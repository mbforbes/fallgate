namespace System {

	type CowardBlackboard = {
		fsm: CowardFSM,
	}

	enum CowardState {
		Wait = 0,
		Flee,
		Approach,
		Attack,
	}

	/**
	 * Returns the difference (angle in radians) between two angles (each
	 * in radians). Accounts for the horrid > 180 diff / 359˚-1˚ problem.
	 */
	function angleDiff(a: number, b: number): number {
		// TODO: lol this is hard do this right
		let raw = Math.abs(a - b);
		if (raw < Math.PI) {
			return raw;
		}
		return Constants.TWO_PI - raw;
	}

	class CowardFSM extends AI.BaseFSM {

		protected sysName = AICoward.name

		constructor(ecs: Engine.ECS, aspect: AIAspect) {
			// start in wait state
			super(ecs, aspect, CowardState.Wait);
		}


		private next(): CowardState {
			// wait if far enough away
			let params = this.getParams<AI.CowardParams>();
			let playerDistance = this.playerDist();
			if (playerDistance > params.reactRadius) {
				return CowardState.Wait;
			}

			// if player close and facing, flee
			let playerAngle = this.getPlayerAngle();
			let playerToThisAngle = this.getPlayerPos().pixiAngleTo(this.getPos());
			let testAngle = angleDiff(playerAngle, playerToThisAngle);
			let cutoff = Constants.DEG2RAD * params.playerLookDegrees;
			// console.log('pl: ' + deg(playerAngle) + ', pl->this: ' + deg(playerToThisAngle) + ', diff: ' + deg(testAngle), ', cutoff: ' + cutoff);
			if (testAngle < cutoff) {
				return CowardState.Flee;
			}

			// else, move in for attack
			if (playerDistance < params.attackRadius) {
				return CowardState.Attack;
			}
			return CowardState.Approach;
		}

		private flee(): void {
			this.facePlayer(Math.PI);
			this.moveForward();
			this.noAttack();
		}

		private approach(): void {
			this.facePlayer();
			this.moveForward();
			this.noAttack();
		}

		states = new Map<CowardState, AI.FSMCode>([
			[CowardState.Wait, {
				pre: AI.noop,
				body: this.wait,
				next: this.next,
			}],
			[CowardState.Flee, {
				pre: AI.noop,
				body: this.flee,
				next: this.next,
			}],
			[CowardState.Approach, {
				pre: AI.noop,
				body: this.approach,
				next: this.next,
			}],
			[CowardState.Attack, {
				pre: AI.noop,
				body: this.stopAndAttack,
				next: this.next,
			}],
		])
	}

	export class AICoward {

		/**
		 * Ensures that the AIAspect's blackboard has the AISpider blackboard.
		 */
		private static ensureBlackboard(ecs: Engine.ECS, aspect: AIAspect): CowardBlackboard {
			// create if needed
			if (!aspect.blackboards.has(AICoward.name)) {
				let bb: CowardBlackboard = {
					fsm: new CowardFSM(ecs, aspect),
				};
				aspect.blackboards.set(AICoward.name, bb);
			}

			// return it
			return aspect.blackboards.get(AICoward.name);
		}

		/**
		 * AI System calls to update.
		 * @param delta
		 * @param ecs
		 * @param aspect
		 */
		public static update(delta: number, ecs: Engine.ECS, aspect: AIAspect): void {
			let blackboard = AICoward.ensureBlackboard(ecs, aspect);
			blackboard.fsm.update(delta);

			// for debugging, update the component w/ the FSM state
			let aiComp = aspect.get(Component.AIComponent);
			aiComp.debugState = CowardState[blackboard.fsm.cur];
		}
	}
}
