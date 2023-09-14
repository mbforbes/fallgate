/// <reference path="../core/base.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/physics.ts" />


namespace Component {

	export class Input extends Engine.Component {
		// main settings
		public movement: Physics.Movement

		// state
		public intent = new Point()
		public attack = false
		public quickAttack = false
		public block = false
		public switchWeapon = false
		public controls = false

		/**
		 * API: InputType.InstantTurn only --- selects target angle
		 */
		public targetAngle = 0

		/**
		 * API: Collision applied force sent here instead of forceQueue because
		 * it happens so often (e.g., if colliding, every single frame).
		 */
		public collisionForce = new Point()

		/**
		 * API: Game logic systems add forces to the forceQueue. Whatever
		 * system is handing movement should empty the queue and apply all
		 * forces every frame.
		 */
		public forceQueue = new Array<Point>()

		/**
		 * API: Game logic systems add friction coefficients to the
		 * frictionQueue. Whatever system is handing movement should empty the
		 * queue and apply friction coefficients every frame.
		 */
		public frictionQueue = new Array<number>()

		/**
		 * API: whether to rebound in reverse direction.
		 */
		public bounce = false

		constructor(movement: Physics.Movement) {
			super();
			this.movement = clone(movement);
			this.movement.attackMobility = this.movement.attackMobility || false;
		}

		public toString(): string {
			return this.intent +
				' [' + Physics.MovementType[this.movement.movementType] + ']' +
				' (atk: ' + this.attack + ')' +
				' (quickAttack: ' + this.quickAttack + ')' +
				' (block: ' + this.block + ')' +
				' (switch: ' + this.switchWeapon + ')' +
				' (fq.len: ' + this.frictionQueue.length + ')';
		}
	}
}
