namespace Physics {

	export let STOP = 0
	export let LEFT = 1
	export let RIGHT = -1
	export let UP = -1
	export let DOWN = 1

	export enum MovementType {
		/**
		 * RotateMove means the rotational velocity is used to rotate the
		 * entity when it requests x-direction movement. WSAD-only controls
		 * would use this.
		 */
		RotateMove = 0,

		/**
		 * InstantTurn means the entity is able to pick a target rotation
		 * instantaneously (ignores rotational velocity). Mouse + keyboard
		 * controls would use this.
		 */
		InstantTurn = 1,

		/**
		 * Strafe means the rotation and movement direction are indepenent of
		 * eachother. Input (e.g., WSAD) controls movement in 8 directions;
		 * rotation controls aiming attacks and blocks.
		 */
		Strafe = 2,
	}

	export type Movement = {
		movementType: MovementType,
		accel: number,
		minMoveSpeed: number,
		maxMoveSpeed: number,

		/**
		 * Whether the enemy has full movement mobility during their attacks.
		 * Should be false normally; true for special enemies that can chase
		 * you during an attack (e.g., sawtooth).
		 */
		attackMobility?: boolean

		/**
		 * For enemies that have a swing attack, this is the max speed they can
		 * achieve during that stage of movement.
		 */
		maxSwingSpeed?: number,

		/**
		 * Deceleration is the drag coefficient used when entity is "Idle" (not
		 * trying to move, no special actions happening like damaged or
		 * attacking).
		 */
		decel: number,

		/**
		 * Inverse of inertial mass. Range: [0, 1]. Meaning:
		 * - 1.0: All forces applied as normal. (Normal.)
		 * - 0.5: All forces dampened by half. (E.g., giants.)
		 * - 0.0: All forces completely dampened.
		 *
		 * If you're keen on physics, this is basically the inverse (inertial)
		 * mass (1/m) of an entity. Given F = ma, rewritten as F/m = a,
		 * replacing s = 1/m, sF = a. So, given a constant force, this scales
		 * the strength of that force to affect the resulting acceleration
		 * applied.
		 */
		invMass: number,

		/**
		 * invMass is almost enough to stop movement, but the player can still
		 * push something around with invMass == 0. Set this to `true` for an
		 * entity to be completely immobile (physics will just skip over it).
		 */
		static?: boolean,

		/**
		 * Only used for cow-like movement (movementType ===
		 * MovementType.RotateMove).
		 */
		rotateSpeed?: number,

		/**
		 * Denotes that the entity resists the effect of slow regions.
		 */
		resistSlow?: boolean,
	}

	export enum RegionType {
		Slow = 0,
	}

	export type Region = {
		regionType: RegionType,
		scale: number,
	}

}
