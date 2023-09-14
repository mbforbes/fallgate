/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../engine/events.ts" />
/// <reference path="../gj7/physics.ts" />
/// <reference path="../gj7/weapon.ts" />
/// <reference path="../component/activity.ts" />
/// <reference path="../component/armed.ts" />
/// <reference path="../component/attack.ts" />
/// <reference path="../component/blocked.ts" />
/// <reference path="../component/input.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/shielded.ts" />
/// <reference path="../component/recoil.ts" />
/// <reference path="../component/stagger.ts" />

namespace System {

	/**
	 * State for the entity / input / armed (weapon) tuple.
	 */
	class SwingAspect extends Engine.Aspect {
		/**
		 * How long it's been in the current state.
		 */
		public elapsed: number = 0
		public startedAttack: boolean = false
		public startedQuickAttack: boolean = false
		public startedComboAttack: boolean = false
		public ongoingAttack: Component.Attack = undefined
		/**
		 * Whether the state has changed on this frame.
		 */
		public changed: boolean = false
		public eventsDispatched: boolean = false

		private _state: Weapon.SwingState = Weapon.SwingState.Idle

		/**
		 * What state it is in.
		 */
		public get state(): Weapon.SwingState {
			return this._state;
		}

		public set state(next: Weapon.SwingState) {
			this.elapsed = 0;
			this.startedAttack = false;
			this.startedQuickAttack = false;
			this.startedComboAttack = false;
			this.eventsDispatched = false;
			this._state = next;
			// TODO: set ongoingAttack?
		}
	}

	/**
	 * Swing mediates input (intent to swing) with actually spawning an attack,
	 * as well as managing the attack process.
	 */
	export class Swing extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Position.name,
			Component.Input.name,
			Component.Armed.name,
		])

		@override
		public makeAspect(): SwingAspect {
			return new SwingAspect();
		}

		/**
		 * This should laregely only be called from within the Swing system as
		 * it handles the logic of deciding when attacks can be created based
		 * on required delays and state changes. However, it's exposed for
		 * special circumstances, like an entity creating its "quick attack"
		 * (explosion) once when it's dead.
		 */
		public startAttack(
			attacker: Engine.Entity,
			attackerPos: Component.Position,
			attackerInput: Component.Input,
			attackInfo: Weapon.AttackInfo,
			partID: PartID,
		): Component.Attack {
			let attack = this.ecs.addEntity();

			// position
			let pos = new Component.Position(
				new Point(attackerPos.p.x, attackerPos.p.y), attackerPos.angle);
			this.ecs.addComponent(attack, pos);

			// attack
			let attackComp = new Component.Attack(attacker, attackInfo);
			this.ecs.addComponent(attack, attackComp);
			this.ecs.addComponent(attack, new Component.ActiveAttack());

			// add comboable to attack if entity is comboable and attack is one that could have combos (non-ranged only)
			if (this.ecs.getComponents(attacker).has(Component.Comboable) &&
				attackInfo.movement == Weapon.AttackMovement.Track) {
				this.ecs.addComponent(attack, new Component.FromComboable())
			}

			// collision. avoid self-colliding by resolving collision box w/
			// attacker now
			let weaponCShape = Component.CollisionShape.buildRectangle(
				attackInfo.cboxDims.copy(),
				new Set<CollisionType>(attackInfo.cTypes));
			weaponCShape.collisionsResolved.add(attacker);
			this.ecs.addComponent(attack, weaponCShape);

			// attacker movement (for lunge forces)
			attackerInput.forceQueue.push(
				Physics.forceFromAngle(attackerPos.angle, attackInfo.lungeForce));

			// attack movement
			switch (attackInfo.movement) {
				// Track means attack moves with entity (like a sword swing)
				case Weapon.AttackMovement.Track: {
					this.ecs.addComponent(attack, new Component.Tracker(
						attacker,
						attackInfo.cboxOffset.copy(),
						true));
					break;
				}

				// Launch means the attack moves on its own (like an arrow)
				case Weapon.AttackMovement.Launch: {
					// alter position by cbox offset
					if (attackInfo.cboxOffset != null) {
						pos.p = pos.p.add_(attackInfo.cboxOffset.copy().rotate_(-pos.angle));
					}

					// movement
					let input = new Component.Input({
						movementType: Physics.MovementType.RotateMove,
						accel: 1,
						minMoveSpeed: attackInfo.velocity,
						maxMoveSpeed: attackInfo.velocity,
						decel: 0,
						invMass: 1.0,
						rotateSpeed: 0.05,
					});
					input.intent.y = Physics.UP;
					this.ecs.addComponent(attack, input);

					// rendering. add both moving and idle animations: moving
					// when it's moving, idle when/if it gets stopped.
					this.ecs.addComponent(attack, new Component.Activity({
						startAction: Action[Action.Moving],
					}));
					let body = new Component.Body();
					body.setParts(new Map<Part, PartID>([[Part.Core, PartID.Default]]));
					this.ecs.addComponent(attack, body);
					let animatable = new Component.Animatable(ZLevelWorld.Object, StageTarget.World);
					for (let [key, data] of attackInfo.animDatas.entries()) {
						animatable.animations.set(key, data);
					}
					this.ecs.addComponent(attack, animatable);
					break;
				}
			}

			return attackComp;
		}

		/**
		 * Dispatch events on the first frame of each state.
		 * @param aspect
		 * @param attackInfo
		 */
		private maybeDispatchEvent(
			aspect: SwingAspect,
			attackInfo: Weapon.AttackInfo,
			eventType: Events.EventType,
		): void {
			if (aspect.eventsDispatched) {
				return;
			}

			let eName: Events.EventType = eventType;
			let eArgs: Events.AttackArgs = {
				attackInfo: attackInfo,
				location: aspect.get(Component.Position).p,
			}
			this.eventsManager.dispatch({ name: eName, args: eArgs });
			aspect.eventsDispatched = true;
		}

		private updateState(delta: number, aspect: SwingAspect): void {
			// (honestly, this is a FSM, and could write functions to trigger edges)
			//
			// + Idle (state used when idling / walking)  <----+
			// |											   |
			// | (press)									   |
			// v											   |
			// + ChargeCharging								   |
			// |  - min duration or early release			   |
			// |											   |
			//[?]----------- early release? -------------------+
			// |
			// | (min duration elapsed)
			// v
			// + ChargeReady
			// |  - whenever released
			// v
			// + Swing
			// |  - duration (total)
			// |  - attack delay
			// |
			// | (after duration (total) elapsed)
			// v
			// + Sheathe
			// |  - duration
			// |
			// | (after duration elapsed)
			// v
			// + [back to Idle] --^
			aspect.elapsed += delta;

			let pos = aspect.get(Component.Position);
			let input = aspect.get(Component.Input);
			let armed = aspect.get(Component.Armed);
			let weapon = armed.active;
			let comboable: Component.Comboable = null;
			if (aspect.has(Component.Comboable)) {
				comboable = aspect.get(Component.Comboable);
			}

			let blocking = aspect.has(Component.Shielded) &&
				(aspect.get(Component.Shielded)).state != Shield.BlockState.Idle;

			// TODO: refactor into common check (maybe relies on
			// Activity.Action).
			// special check --- no swinging when staggered, dead, blocked,
			// recoil, or blocking; always move back to 'idle'
			if (aspect.has(Component.Knockback) ||
				aspect.has(Component.Stagger) ||
				aspect.has(Component.StaggerReturn) ||
				aspect.has(Component.Dead) ||
				aspect.has(Component.Blocked) ||
				aspect.has(Component.Recoil) ||
				blocking) {
				// remove attack if it exists
				if (aspect.startedAttack || aspect.startedQuickAttack || aspect.startedComboAttack) {
					aspect.ongoingAttack.fuse = true;
				}
				// set to idle
				aspect.state = Weapon.SwingState.Idle;
				armed.state = Weapon.SwingState.Idle;
				return;
			}

			switch (aspect.state) {
				// In idle state, as long as not blocking, can swing any time
				// after cooldown has elapsed.
				case Weapon.SwingState.Idle: {
					// check shielded component, if applicable.
					if (aspect.elapsed >= weapon.timing.idleCooldown) {
						if (input.quickAttack) {
							aspect.state = Weapon.SwingState.QuickAttack;
						} else if (input.attack) {
							aspect.state = Weapon.SwingState.ChargeCharging;
						} else if (input.switchWeapon) {
							armed.activeIdx = (armed.activeIdx + 1) % armed.inventory.length;
							armed.active = armed.inventory[armed.activeIdx];
							// play sound
							if (armed.inventory.length > 1) {
								let audio = this.ecs.getSystem(Audio);
								if (armed.active.partID == PartID.Bow) {
									audio.play(['switchToBow']);
								} else if (armed.active.partID == PartID.Sword) {
									audio.play(['switchToSword']);
								}
							}
							// reset anims
							if (aspect.has(Component.Animatable)) {
								aspect.get(Component.Animatable).reset = true;
							}
						}
					}
					break;
				}

				// In charge state, must wait minimum duration, and then can be
				// ready to swing. If minimum duration not waited, return to
				// idle.
				case Weapon.SwingState.ChargeCharging: {
					// events dispatched as soon as state changed
					// charge may be happening more than i thought. just using
					// swing for now.
					// this.maybeDispatchEvent(aspect, weapon.swingAttack, Events.EventTypes.Charge);

					if (aspect.elapsed >= weapon.timing.minChargeDuration) {
						aspect.state = Weapon.SwingState.ChargeReady;
					} else if (!input.attack) {
						aspect.state = Weapon.SwingState.Idle;
					}
					break;
				}

				case Weapon.SwingState.ChargeReady: {
					if (!input.attack) {
						aspect.state = Weapon.SwingState.Swing;
					}
					break;
				}

				// In swing state, create the attack after the attack delay has
				// passed. The swing lasts a set amount of time.
				case Weapon.SwingState.Swing: {
					if (weapon.swingAttack == null) {
						throw new Error('SwingAttack initiated for weapon without one!');
					}

					// events dispatched as soon as state changed
					this.maybeDispatchEvent(aspect, weapon.swingAttack, Events.EventTypes.Swing);

					if (!aspect.startedAttack && aspect.elapsed >= weapon.timing.swingAttackDelay) {
						aspect.ongoingAttack = this.startAttack(aspect.entity, pos, input, weapon.swingAttack, weapon.partID);
						aspect.startedAttack = true;
					}

					if (aspect.elapsed >= weapon.timing.swingDuration) {
						aspect.state = Weapon.SwingState.Sheathe;
					}
					break;
				}

				// In sheathe state, just wait to transition back to idle.
				case Weapon.SwingState.Sheathe: {
					if (aspect.elapsed >= weapon.timing.sheatheDuration) {
						aspect.state = Weapon.SwingState.Idle;
					}
					break;
				}

				// In the quick attack states, create the attack after the
				// attack delay has passed. The quick attack lasts a set amount
				// of time. A new quick attack can be spawned before the first
				// one fully expires. NOTE: intentional fall-through here.
				case Weapon.SwingState.QuickAttack:
				case Weapon.SwingState.QuickAttack2: {
					if (weapon.quickAttack == null) {
						throw new Error('QuickAttack initiated for weapon without one!');
					}

					// events dispatched as soon as state changed
					this.maybeDispatchEvent(aspect, weapon.quickAttack, Events.EventTypes.Swing);

					// because this block handles both cases (QuickAttack and
					// QuickAttack2), determine what the other one is.
					let other = aspect.state == Weapon.SwingState.QuickAttack ?
						Weapon.SwingState.QuickAttack2 :
						Weapon.SwingState.QuickAttack;

					// spawn attack object if we haven't and
					// quickAttackAttackDelay has passed
					if (!aspect.startedQuickAttack && aspect.elapsed >= weapon.timing.quickAttackAttackDelay) {
						aspect.ongoingAttack = this.startAttack(aspect.entity, pos, input, weapon.quickAttack, weapon.partID);
						aspect.startedQuickAttack = true;
					}

					// switch to next attack if there's input and and quickAttackNextWait has passed
					if (input.quickAttack && aspect.elapsed >= weapon.timing.quickAttackNextWait) {
						// switch to combo if conditions are met
						if (input.quickAttack && comboable !== null && comboable.comboReady) {
							aspect.state = Weapon.SwingState.Combo;
						} else {
							// or just do another quick attack if not
							aspect.state = other;
						}
					}

					if (aspect.elapsed >= weapon.timing.quickAttackDuration) {
						aspect.state = Weapon.SwingState.Idle;
					}

					break;
				}

				case Weapon.SwingState.Combo: {
					if (weapon.comboAttack == null) {
						throw new Error('ComboAttack initiated for weapon without one!');
					}

					// events dispatched as soon as state changed
					this.maybeDispatchEvent(aspect, weapon.comboAttack, Events.EventTypes.Swing);

					// spawn attack object if we haven't and comboAttackDelay
					// has passed
					if (!aspect.startedComboAttack && aspect.elapsed >= weapon.timing.comboAttackDelay) {
						aspect.ongoingAttack = this.startAttack(aspect.entity, pos, input, weapon.comboAttack, weapon.partID);
						aspect.startedComboAttack = true;
					}

					if (aspect.elapsed >= weapon.timing.comboDuration) {
						aspect.state = Weapon.SwingState.Idle;
					}

					break;
				}
			}

			// Always update armed state (`state` and `elapsed`) to match (for
			// other observing systems).
			armed.state = aspect.state;
			armed.elapsed = aspect.elapsed;
		}

		public update(delta: number, entities: Map<Engine.Entity, SwingAspect>): void {
			for (let aspect of entities.values()) {
				this.updateState(delta, aspect);
			}
		}
	}
}
