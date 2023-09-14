/// <reference path="../core/lang.ts" />
/// <reference path="../core/base.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/dummy.ts" />
/// <reference path="../component/input.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/player-input.ts" />

namespace System {

	// .........................................................................
	// Helper classes
	// .........................................................................

	/**
	 * Options for a button that can be either pressed or held and released.
	 */
	enum GameButtonAction {
		Nothing = 0,
		Press,
		HoldStart,
		HoldRelease,
	}

	/**
	 * Helps determine state for a button (e.g. keyboard or mouse) that can be
	 * either pressed or held and released.
	 */
	class GameButton {
		public action = GameButtonAction.Nothing

		private isDown = false
		private timeDown = 0

		constructor(
			/**
			 * Cutoff for pressing (< this) and holding (> this) a button, in ms of
			 * the duration held.
			 */
			private HOLD_THRESHOLD = 150) { }

		private determineAction(down: boolean, delta: number): GameButtonAction {
			// wasn't down and now isn't: nothing happens
			if (!this.isDown && !down) {
				return GameButtonAction.Nothing;
			}

			// wasn't down and now is: start press
			if (!this.isDown && down) {
				this.isDown = true;
				this.timeDown = 0;
				// don't yet know what kind of press this is, so don't signal
				// any press happened (!)
				return GameButtonAction.Nothing;
			}

			// was down and now is: continue hold
			if (this.isDown && down) {
				this.timeDown += delta;
				// if this is when the hold threshold was crossed, signal start
				// of the hold.
				if (this.timeDown >= this.HOLD_THRESHOLD && this.timeDown - delta < this.HOLD_THRESHOLD) {
					return GameButtonAction.HoldStart;
				}
			}

			// was down and now isn't: release! make decision about action.
			if (this.isDown && !down) {
				this.isDown = false;
				// use previous holding time (don't increment this.timeDown
				// before checking). in addition to being technically more
				// accurate (could have been released just after last update),
				// this way we know whether a HoldStart action was already
				// emitted (only if the previous this.timeDown was above the
				// threshold)
				if (this.timeDown < this.HOLD_THRESHOLD) {
					return GameButtonAction.Press;
				} else {
					return GameButtonAction.HoldRelease;
				}
			}
		}

		update(down: boolean, delta: number): void {
			this.action = this.determineAction(down, delta);
		}
	}

	class AttackButton extends GameButton {
		public quickAttacking = false
		public attacking = false

		@override
		update(down: boolean, delta: number): void {
			super.update(down, delta);

			switch (this.action) {
				case GameButtonAction.Nothing:
					this.quickAttacking = false;
					this.attacking = false;
					break;
				case GameButtonAction.Press:
					this.quickAttacking = true;
					this.attacking = false;
					break;
				case GameButtonAction.HoldStart:
					this.quickAttacking = false;
					this.attacking = true;
					break;
				case GameButtonAction.HoldRelease:
					this.quickAttacking = false;
					this.attacking = false;
					break;
			}
		}
	}

	// .........................................................................
	// Subsystems
	// .........................................................................

	function clampReal(raw: number): number {
		let lim = 0.12;
		if ((raw > 0 && raw < lim) || (raw < 0 && raw > -lim)) {
			return 0;
		}
		return raw;
	}

	// function debugReportGamepad(gp: Gamepad): void {
	// 	console.log("Gamepad connected at index " + gp.index + ": " +
	// 		gp.id + ". It has " + gp.buttons.length + " buttons and " +
	// 		gp.axes.length + " axes.");
	// }

	export class InputGamepad extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Dummy.name,
		])

		private prevMenu: boolean = false
		private prevDebug: boolean = false
		private prevQuickAttack: boolean = false
		private prevSwitchWeapon: boolean = false

		public intentMove: Point = new Point()
		public intentFace: Point = new Point()
		public quickAttack: boolean = false
		public block: boolean = false
		public switchWeapon: boolean = false

		private idleFrames = 2
		private idleFor = 0
		private gamepadDetectionShown: boolean = false

		/**
		 * Idle is set if the gamepad has no inputs for idleFrames frames. When
		 * this happens, the systems using the gamepad know they can ignore the
		 * gamepad until a button is pressed again and read from the mouse and
		 * keyboard. Without this, the gamepad would "zero-out" all of the
		 * inputs and not let any mouse / keyboard.
		 */
		public idle: boolean = true

		/**
		 * Last time input read from gamepad. Used so that mousedoens't
		 * overwrite facing state if mouse isn't being used.
		 */
		public lastActiveWallTimestamp = 0

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			// poll + sanity check
			let gps = navigator.getGamepads();
			if (gps == null || gps[0] == null) {
				this.idle = true;
				return;
			}
			let gp = gps[0];
			if (!gp.connected || gp.buttons.length < 18 || gp.axes.length < 4) {
				this.idle = true;
				return;
			}

			// show notification first time gamepad used
			if (!this.gamepadDetectionShown) {
				this.ecs.getSystem(System.GUIManager).runSequence(
					'notification', new Map([['notification', 'gamepad detected']]));
				this.gamepadDetectionShown = true;
			}

			// input. L and R analog stick, with d-pad overwriting if used.
			this.intentMove.set_(
				clampReal(gp.axes[0]),
				clampReal(gp.axes[1]),
			);
			this.intentFace.set_(
				clampReal(gp.axes[2]),
				-clampReal(gp.axes[3]),
			);
			if (gp.buttons[12].pressed || gp.buttons[13].pressed ||
				gp.buttons[14].pressed || gp.buttons[15].pressed) {
				this.intentMove.set_(
					-gp.buttons[14].value + gp.buttons[15].value,
					gp.buttons[13].value - gp.buttons[12].value,
				);
			}

			// if no explicit direction from right stick, use movement input.
			if (this.intentFace.isZero()) {
				this.intentFace.copyFrom_(this.intentMove);
				this.intentFace.y = -this.intentFace.y;
			}

			// buttons
			let curQuickAttack = gp.buttons[0].pressed || gp.buttons[1].pressed || gp.buttons[2].pressed || gp.buttons[5].pressed;
			this.quickAttack = !this.prevQuickAttack && curQuickAttack;
			this.prevQuickAttack = curQuickAttack;

			let curSwitchWeapon = gp.buttons[3].pressed;
			this.switchWeapon = !this.prevSwitchWeapon && curSwitchWeapon;
			this.prevSwitchWeapon = curSwitchWeapon;

			this.block = gp.buttons[4].pressed || gp.buttons[6].pressed || gp.buttons[7].pressed;

			// events
			let curMenu = gp.buttons[9].pressed || gp.buttons[17].pressed;
			if (!this.prevMenu && curMenu) {
				this.eventsManager.dispatch({
					name: Events.EventTypes.MenuKeypress,
					args: { key: 'ENTER' },
				});
			}
			this.prevMenu = curMenu;

			let curDebug = gp.buttons[8].pressed;
			if (!this.prevDebug && curDebug) {
				this.eventsManager.dispatch({
					name: Events.EventTypes.DebugKeypress,
					args: { key: 'BACKTICK' },
				});
			}
			this.prevDebug = curDebug;

			// idle computation
			if (this.intentMove.isZero() &&
				this.intentFace.isZero() &&
				!curQuickAttack &&
				!curSwitchWeapon &&
				!curMenu &&
				!curDebug) {
				// nothing pressed. max out at this.idleFrames so we don't just
				// keep counting.
				this.idleFor = Math.min(this.idleFor + 1, this.idleFrames);
			} else {
				// active!
				this.idleFor = 0;
				this.lastActiveWallTimestamp = this.ecs.walltime;
			}
			this.idle = this.idleFor >= this.idleFrames;
		}
	}

	/**
	 * Kind of a weird system. Updated on its own so that it runs once per
	 * frame. But then the results are used by one or more other systems rather
	 * than updating components direction. More of a "subsystem."
	 */
	export class InputKeyboard extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Dummy.name,
		])

		// state exported for other systems' use
		public intent = new Point()
		public quickAttacking = false
		public attacking = false
		public blocking = false
		public switching = false
		public controls = false

		// private attackButton = new AttackButton()
		private prev_quickAttacking = false;
		private prev_left = false
		private prev_right = false
		private prev_down = false
		private prev_up = false
		private prev_switching = false
		private prev_controls = false
		private prev_intent = new Point()

		constructor(private keyboard: Keyboard) {
			super();
		}

		/**
		 * Returns -1 if a wins, 1 if b wins, 0 if neither wins, and prev if we
		 * should use what happened last frame.
		 */
		public static resolve_pair(
			prev_a: boolean, a: boolean,
			prev_b: boolean, b: boolean,
			prev: number): number {
			// Easy cases: only one pressed.
			if (!a && !b) {
				return 0;
			} else if (a && !b) {
				return -1;
			} else if (!a && b) {
				return 1;
			}

			// Difficult cases: both are pressed.
			if (prev_a && !prev_b) {
				// b is new press; use b.
				return 1;
			} else if (!prev_a && prev_b) {
				// a is the new press; use a.
				return -1;
			} else if (!prev_a && !prev_b) {
				// frame-perfect double-press. pick b arbitrarily.
				return 1;
			} else {
				// both pressed previously, both pressed now. can't do anything
				// but keep doing what we were doing.
				return prev;
			}
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			// raw input reads
			let switching = this.keyboard.gamekeys.get(GameKey.E).isDown;
			let controls = this.keyboard.gamekeys.get(GameKey.Enter).isDown;
			let left = this.keyboard.gamekeys.get(GameKey.A).isDown;
			let right = this.keyboard.gamekeys.get(GameKey.D).isDown;
			let up = this.keyboard.gamekeys.get(GameKey.W).isDown;
			let down = this.keyboard.gamekeys.get(GameKey.S).isDown;
			let quickAttacking = this.keyboard.gamekeys.get(GameKey.Space).isDown;
			this.blocking = this.keyboard.gamekeys.get(GameKey.ShiftLeft).isDown;

			// resolve input pairs
			this.intent.x = InputKeyboard.resolve_pair(this.prev_left, left, this.prev_right, right, this.prev_intent.x);
			this.intent.y = InputKeyboard.resolve_pair(this.prev_up, up, this.prev_down, down, this.prev_intent.y);

			// metered pressing
			this.controls = controls && !this.prev_controls;
			this.switching = switching && !this.prev_switching;

			// old: using the "button" mechanic for holding down of various
			// lengths timing. this caused too much lag for the quick press
			// actions, so canning it.
			// this.attackButton.update(this.keyboard.keys.get(GameKey.Space).isDown, delta);
			// this.attacking = this.attackButton.attacking;
			// this.stabbing = this.attackButton.stabbing;

			// quick attack just when pressed (w/ rate limiting)
			this.quickAttacking = quickAttacking && !this.prev_quickAttacking;

			// tmp: no 'swing' attacking (will do some power or retaliation
			// attack eventually; maybe just the same as stabbing in that
			// case?)
			this.attacking = false;

			// bookkeeping
			this.intent.copyTo(this.prev_intent);
			this.prev_quickAttacking = quickAttacking;
			this.prev_left = left;
			this.prev_right = right;
			this.prev_up = up;
			this.prev_down = down;
			this.prev_controls = controls;
			this.prev_switching = switching;
		}
	}

	/**
	 * Sets mutate to the value of from.
	 * @param mutate
	 * @param from
	 */
	function setFromPIXI(mutate: Point, from: PIXI.Point) {
		mutate.set_(from.x, from.y);
	}

	/**
	 * Another 'subsystem' that updates independently.
	 */
	export class InputMouse extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Dummy.name,
		])

		// Properties exposed to other systems.
		public worldPosition = new Point()
		public quickAttacking = false
		public blocking = false

		// for metering and setting timestamp
		private prevQuickAttacking = false;
		private prevBlocking = false;
		private curHUDPosition = new Point()
		private prevHUDPosition = new Point()

		public lastActiveWallTimestamp = 0

		/**
		 * Used internally to let PIXI do the translation.
		 */
		private cacheWorldPosition = new PIXI.Point()

		constructor(private mouse: Mouse, private hud: Stage.MultiZStage,
			private world: Stage.MultiZStage) {
			super(false, true);
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			// transform and set position
			this.world.toLocal(this.mouse.hudPosition, this.hud, this.cacheWorldPosition, true);
			this.worldPosition.set_(this.cacheWorldPosition.x, this.cacheWorldPosition.y);

			// button inputs
			let curQuickAttacking = this.mouse.leftDown;
			this.quickAttacking = curQuickAttacking && (!this.prevQuickAttacking);
			this.blocking = this.mouse.rightDown;

			// active computation
			setFromPIXI(this.curHUDPosition, this.mouse.hudPosition);
			if (curQuickAttacking != this.prevQuickAttacking ||
				this.blocking != this.prevBlocking ||
				!this.curHUDPosition.equals(this.prevHUDPosition)
			) {
				this.lastActiveWallTimestamp = this.ecs.walltime;
			}

			// update cached state
			this.prevHUDPosition.copyFrom_(this.curHUDPosition);
			this.prevQuickAttacking = curQuickAttacking;
			this.prevBlocking = this.blocking;
		}
	}

	// .........................................................................
	// Systems
	// .........................................................................

	/**
	 *
	 * @param from base position
	 * @param over list of entities to check over --- each must have
	 * Component.Position!
	 * @param within maximum distance (from `from`) for which a non-null entity
	 * is returned
	 * @param skipDead whether to skip entities that have Component.Dead
	 */
	function getClosest(
		ecs: Engine.ECS,
		from: Point,
		over: IterableIterator<Engine.Entity>,
		within: number,
		skipDead: boolean): Engine.Entity | null {
		// keep track of smallest distance and pick closest entity.
		let closest: Engine.Entity = null;
		let closestDist: number = Infinity;
		for (let entity of over) {

			let comps = ecs.getComponents(entity);
			if (skipDead && comps.has(Component.Dead)) {
				continue;
			}
			let entityPos = comps.get(Component.Position);
			let dist = from.distTo(entityPos.p);
			if (dist < closestDist) {
				closestDist = dist;
				closest = entity;
			}
		}

		return closestDist < within ? closest : null;
	}

	/**
	 * When debug is on, can use this to pick entities for inspection.
	 */
	export class DebugEntitySelector extends Engine.System {

		private static MAX_ENTITY_DIST = 200;

		public componentsRequired = new Set<string>([
			Component.Position.name,
		])

		public constructor(private inputMouse: InputMouse) {
			super(true, true);
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			// get closest thing
			let mouseWorld = this.inputMouse.worldPosition;
			let spatialHash = this.ecs.getSystem(System.SpatialHash);
			let cell = getPointCell(mouseWorld);
			let ents = spatialHash.grid.get(cell);
			if (ents == null) {
				return;
			}
			let closestEntity = getClosest(
				this.ecs,
				mouseWorld,
				ents.values(),
				DebugEntitySelector.MAX_ENTITY_DIST,
				false);
			if (closestEntity == null) {
				return;
			}

			// mark as debug inspection w/ current timestamp
			let comps = this.ecs.getComponents(closestEntity);
			if (comps.has(Component.DebugInspection)) {
				(comps.get(Component.DebugInspection))
					.pickTime = this.ecs.walltime;
			} else {
				this.ecs.addComponent(
					closestEntity,
					new Component.DebugInspection(this.ecs.walltime));
			}
		}
	}

	export class PlayerInputGamepad extends Engine.System {
		public componentsRequired = new Set<string>([
			Component.Input.name,
			Component.Position.name,
			Component.PlayerInput.name,
		])

		public constructor(private inputGamepad: InputGamepad) {
			super();
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			// if gamepad is idle, don't overwrite keyboard/mouse input state.
			if (this.inputGamepad.idle) {
				return;
			}

			for (let aspect of entities.values()) {
				let input = aspect.get(Component.Input);
				// movement
				input.intent.copyFrom_(this.inputGamepad.intentMove);

				// facing. only mutate target angle if there's some intent
				// pressed.
				if (!this.inputGamepad.intentMove.isZero() || !this.inputGamepad.intentFace.isZero()) {
					input.targetAngle = Math.atan2(this.inputGamepad.intentFace.y, this.inputGamepad.intentFace.x);
					// 0 -> 2pi for movement system
					if (input.targetAngle <= 0) {
						input.targetAngle += Constants.TWO_PI;
					}
				}

				input.quickAttack = this.inputGamepad.quickAttack;
				input.block = this.inputGamepad.block;
				input.switchWeapon = this.inputGamepad.switchWeapon;
			}
		}
	}

	/**
	 * Default game movement class.
	 */
	export class PlayerInputMouseKeyboard extends Engine.System {

		// static

		private static MIN_ANG_DIST = 5
		private static MAX_LOCKON_DIST = 100;

		// instance

		public componentsRequired = new Set<string>([
			Component.Input.name,
			Component.PlayerInput.name,
		])

		public constructor(
			private inputMouse: InputMouse,
			private inputKeyboard: InputKeyboard,
			private inputGamepad: InputGamepad,
			private enemySelector: System.EnemySelector,
		) {
			// note: consider starting disabled (!) until we fade-in the level
			super(true);
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			// set all input aspects (probably only 1) with the mouse angle and
			// the values computed by the input keyboard.
			for (let aspect of entities.values()) {
				let mouseWorld = this.inputMouse.worldPosition;
				let input = aspect.get(Component.Input);
				let position = aspect.get(Component.Position);

				// lockon: retrieve world position and modify if within some
				// delta of an enemy.
				let closestEnemy = getClosest(
					this.ecs,
					mouseWorld,
					this.enemySelector.latest(),
					PlayerInputMouseKeyboard.MAX_LOCKON_DIST,
					true);
				if (closestEnemy != null) {
					let enemyComps = this.ecs.getComponents(closestEnemy);
					let enemyPos = enemyComps.get(Component.Position);
					mouseWorld.copyFrom_(enemyPos.p);
					// set component so lockon system can render graphic
					if (!enemyComps.has(Component.LockOn)) {
						this.ecs.addComponent(closestEnemy, new Component.LockOn());
					} else {
						(enemyComps.get(Component.LockOn)).fresh = true;
					}
				}

				// Compute mouse angle only if (manhattan) distance above some
				// threshold. This is to avoid the entity freaking out when near
				// the mouse point.
				const thresh = PlayerInputMouseKeyboard.MIN_ANG_DIST;
				if (position.p.manhattanTo(mouseWorld) > thresh) {
					// compute mouse angle. use only if mouse more active than
					// gamepad.
					if (this.inputMouse.lastActiveWallTimestamp > this.inputGamepad.lastActiveWallTimestamp) {
						input.targetAngle = position.p.pixiAngleTo(mouseWorld);
					}

					// Usual movement. Y intent used; X intent ignored in Movement
					// system.
					this.inputKeyboard.intent.copyTo(input.intent);
				} else {
					// Too close. Don't move (and not X intent now either,
					// though currently unused anywhere).
					input.intent.set_(0, 0);
				}

				input.quickAttack = this.inputKeyboard.quickAttacking || this.inputMouse.quickAttacking;
				input.block = this.inputKeyboard.blocking || this.inputMouse.blocking;
				input.switchWeapon = this.inputKeyboard.switching;
				input.controls = this.inputKeyboard.controls;
			}
		}
	}

	export class PlayerInputWSAD extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Input.name,
			Component.PlayerInput.name,
		])

		public constructor(private inputKeyboard: InputKeyboard) {
			super();
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			// set all input aspects (probably only 1) with the values computed
			// by the input keyboard.
			for (let aspect of entities.values()) {
				let input = aspect.get(Component.Input);

				this.inputKeyboard.intent.copyTo(input.intent);
				input.attack = this.inputKeyboard.attacking;
				input.block = this.inputKeyboard.blocking;
				input.switchWeapon = this.inputKeyboard.switching;
				input.controls = this.inputKeyboard.controls;
			}
		}
	}
}
