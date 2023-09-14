/// <reference path="../core/util.ts" />
/// <reference path="../system/selector.ts" />
/// <reference path="../component/collision-shape.ts" />
/// <reference path="../component/activity.ts" />
/// <reference path="../component/dead.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/input.ts" />

namespace System {

	// functions

	function attacking(aspect: Engine.Aspect) {
		if (!aspect.has(Component.Armed)) {
			return false;
		}

		let armed = aspect.get(Component.Armed);
		return armed.state == Weapon.SwingState.QuickAttack ||
			armed.state == Weapon.SwingState.QuickAttack2 ||
			armed.state == Weapon.SwingState.Swing;
	}


	/**
	 * Euler integration: obvious thing you'd think of (if you were Newton).
	 * @param p
	 * @param v
	 * @param a
	 * @param t
	 * @param out_p
	 * @param out_v
	 */
	function integrateExplicitEuler(p: Point, v: Point, a: Point, t: number, out_p: Point, out_v: Point): void {
		// update position with *current* veloctiy
		// x_{t+1} = x_t + v_t * delta
		out_p.x = p.x + v.x * t;
		out_p.y = p.y + v.y * t;

		// update velocity with current acceleration
		// v_{t+1} = v_t + a_t * delta
		out_v.x = v.x + a.x * t;
		out_v.y = v.y + a.y * t;

		// clamp small velocities
		// if (out_v.l2Squared() < 2000) {
		//	out_v.x = 0;
		//	out_v.y = 0;
		// }
	}

	/**
	 * Semi-implicit Euler integration: better because... symplectic?
	 * https://gafferongames.com/post/integration_basics/
	 *
	 * @param p
	 * @param v
	 * @param a
	 * @param t
	 * @param out_p
	 * @param out_v
	 */
	function integrateSemiImplicitEuler(p: Point, v: Point, a: Point, t: number, out_p: Point, out_v: Point): void {
		// update velocity with current acceleration
		// v_{t+1} = v_t + a_t * delta
		out_v.x = v.x + a.x * t;
		out_v.y = v.y + a.y * t;

		// update position with *new* veloctiy
		// x_{t+1} = x_t + v_t * delta
		out_p.x = p.x + out_v.x * t;
		out_p.y = p.y + out_v.y * t;

		// clamp small velocities
		// if (out_v.l2Squared() < 2000) {
		//	out_v.x = 0;
		//	out_v.y = 0;
		// }
	}

	/**
	 * Verlet integration --- rebranded 200 years later!
	 * @param p
	 * @param prev_p
	 * @param a
	 * @param t
	 * @param out_p
	 * @param out_v
	 */
	function integrateVerlet(p: Point, prev_p: Point, a: Point, t: number, out_p: Point, out_v: Point): void {
		// verlet integration formula
		let tsq = t * t;
		out_p.x = 2 * p.x - prev_p.x + a.x * tsq;
		out_p.y = 2 * p.y - prev_p.y + a.y * tsq;

		// compute velocity
		p.sub(prev_p, out_v)
	}

	// classes

	class MovementAspect extends Engine.Aspect {
		v = new Point()
		start_p = new Point()
		prev_p = new Point()
		prev_p_init = false
	}

	export class Movement extends Engine.System {

		// constants

		// drag coefficient
		static K_DRAG = 0.3;

		// dampen scale on bounce
		static BOUNCE_DAMPEN = 0.3;

		// members

		public componentsRequired = new Set<string>([
			Component.Position.name,
			Component.Input.name,
		])

		// to avoid creating new objects.
		// Used to accumulate acceleration.
		private cacheIntent = new Point()
		private cacheA = new Point()
		private cacheNextP = new Point()
		private cacheNextV = new Point()

		// functions

		@override
		public makeAspect(): MovementAspect {
			return new MovementAspect();
		}

		public update(delta: number, entities: Map<Engine.Entity, MovementAspect>): void {
			// physics gets arbitrary smaller delta
			delta = delta / 100;

			for (let aspect of entities.values()) {
				let position = aspect.get(Component.Position);
				let input = aspect.get(Component.Input);

				// squash out invalid input
				input.intent.clampEach_(-1, 1);

				// prelim bookkeeping for the first frame of the game. ugh, i
				// wish we could remove this branch easily... Question from
				// future Max: onAdd(...) doesn't work for this?
				if (!aspect.prev_p_init) {
					aspect.prev_p.copyFrom_(position.p);
					aspect.start_p.copyFrom_(position.p);
					aspect.prev_p_init = true;
				}

				// our quest for the rest of the method is to accumulate
				// acceleration from various forces.
				let a = this.cacheA;
				a.set_(0, 0);

				let immobile = aspect.has(Component.Immobile);
				let dead = aspect.has(Component.Dead);
				let dampened = false;  // updated below
				let inputOnly = false;  // updated below
				let customDecel = false;  // updated below
				let action = null;

				// Unless one of these, handle input-driven movement.

				// TODO: Can we refactor this check (used in swing and defence
				// as well, I think, as well as maybe other places) into a
				// common place and call "incapacitated" or something?
				if (!dead && !immobile) {

					// Handle rotation. This is done differently depending on the
					// inputType.
					switch (input.movement.movementType) {
						case Physics.MovementType.RotateMove: {
							position.angle += input.intent.x * input.movement.rotateSpeed;
							break;

						}

						// Intentional fall-through; both Strafe and
						// InstantTurn allow instantaneously affecting the
						// facing angle.
						case Physics.MovementType.Strafe:
						case Physics.MovementType.InstantTurn: {
							// allow AIs not to turn. note: in hind sight, this
							// is stupid because it ignores input target angles
							// of 0 from the player too.
							position.angle = input.targetAngle || position.angle;
							break;
						}

						// Can't tell whether this way of doing code maintenance is
						// smart or dumb.
						default: {
							throw new Error('Update this switch for new InputType.');
						}
					}

					// Move slowly during various actions. Swinging is already
					// weird: you get a lunge force from your attack, but no
					// movement itself. However, your max speed may be
					// increased. It's probably going to get even weirder with
					// sawtooths' curvy long Swing follow attacks.
					let moveAccel = input.movement.accel;
					if (aspect.has(Component.Activity)) {
						let activity = aspect.get(Component.Activity);
						action = activity.action;
						switch (activity.action) {
							case Action.Idle:
								// NOTE: consider pulling out of dead /
								// immobile check.
								customDecel = true;
								break;
							case Action.Charging:
							case Action.Sheathing:
							case Action.BlockRaising:
							case Action.BlockHolding:
							case Action.BlockLowering:
							case Action.QuickAttacking:
							case Action.QuickAttacking2:
							case Action.ComboAttacking:
							case Action.Recoiling:
								dampened = true;
								moveAccel *= 0.25;
								break;
							// TODO: can we just take the big check above
							// (dead, staggered, staggerreturning, etc.) as
							// move here? OR (perhaps even better) refactor as
							// proposed above.
							case Action.Swinging:
								if (!input.movement.attackMobility) {
									dampened = true;
									moveAccel *= 0.0;
								}
								break;
							case Action.Blocked:
								dampened = true;
								moveAccel *= 0.0;
								break;
						}
					}

					// Handle forward movement (and other Action checks).
					switch (input.movement.movementType) {

						// Intentional fall-through; for both RotateMove and
						// InstantTurn, facing direction is tied to movement
						// direction.
						case Physics.MovementType.RotateMove:
						case Physics.MovementType.InstantTurn: {
							if (input.intent.y != 0) {
								// normal forward movement (priority)
								// TODO: why do we need a -cos here?
								a.x += input.intent.y * moveAccel * -Math.cos(position.angle);
								a.y += input.intent.y * moveAccel * Math.sin(position.angle);
								inputOnly = true;
							} else if (input.intent.x != 0) {
								// sideways movement
								let rot = position.angle - Constants.HALF_PI;
								a.x += input.intent.x * moveAccel * Math.cos(rot);
								a.y += input.intent.x * moveAccel * -Math.sin(rot);
								inputOnly = true;
							}
							break;
						}

						// Strafing doesn't tie movement direction to angle.
						case Physics.MovementType.Strafe: {
							// could just normalize, but that would disallow
							// AIs doing slower movement.
							this.cacheIntent.copyFrom_(input.intent);
							let mag = this.cacheIntent.l2()
							if (mag > 1.0) {
								this.cacheIntent.scale_(1 / mag);
							}
							if (mag > 0) {
								a.add_(this.cacheIntent.scale_(moveAccel));
								inputOnly = true;
							}
							break;
						}
					}
				}

				// Before adding all more complex forces and integrating: we
				// know that if something is static, and we've allowed for its
				// rotational movement (above), we're done because it's simply
				// going to keeps its starting position.
				if (input.movement.static) {
					position.p = aspect.prev_p;
					continue;
				}

				// bounce
				if (input.bounce) {
					aspect.v.scale_(-1 * Movement.BOUNCE_DAMPEN);
				}
				input.bounce = false;

				// add externally applied forces
				while (input.forceQueue.length > 0) {
					let force = input.forceQueue.pop().scale_(input.movement.invMass);
					a.add_(force);
					inputOnly = false;
				}
				a.add_(input.collisionForce);
				input.collisionForce.set_(0, 0);

				// drag is Movement.K_DRAG by default, or the custom decel if
				// conditions are met.
				let k_drag = customDecel ? input.movement.decel : Movement.K_DRAG;

				// apply any external drags
				while (input.frictionQueue.length > 0) {
					k_drag += input.frictionQueue.pop();
				}

				// apply drag
				a.x += -k_drag * aspect.v.x;
				a.y += -k_drag * aspect.v.y;

				// integrate
				// ---

				// integrateExplicitEuler(position.p, aspect.v, a, delta, this.cacheNextP, this.cacheNextV);
				integrateSemiImplicitEuler(position.p, aspect.v, a, delta, this.cacheNextP, this.cacheNextV);
				// integrateVerlet(position.p, aspect.prev_p, a, delta, this.cacheNextP, this.cacheNextV);

				// find top speed and cutoff if action known and matches a
				// limit.
				if (action != null) {
					// pick max speed if matching action
					let maxSpeed = null;
					switch (action) {
						case Action.Moving:
							maxSpeed = input.movement.maxMoveSpeed;
							break;
						case Action.Swinging:
							if (input.movement.maxSwingSpeed != null) {
								maxSpeed = input.movement.maxSwingSpeed;
							}
							break;
					}

					// apply any max speed chosen
					if (maxSpeed != null) {
						let vL2 = this.cacheNextV.l2();
						if (vL2 > maxSpeed) {
							this.cacheNextV.scale_(maxSpeed / vL2);
						}
					}
				}

				// find min speed. raise to that if (1) under (and *only*
				// under) input forces, (2) not dampened by special actions.
				let vL2 = this.cacheNextV.l2();
				if (inputOnly && !dampened && vL2 < input.movement.minMoveSpeed) {
					this.cacheNextV.scale_(input.movement.minMoveSpeed / vL2);
				}

				// bookkeep
				aspect.prev_p.copyFrom_(position.p);
				position.p = this.cacheNextP;
				aspect.v.copyFrom_(this.cacheNextV);

				// debug bookkeeeping
				position.debugSpeed = this.cacheNextV.l2();
			}
		}
	}
}

