/// <reference path="../core/fsm.ts" />
/// <reference path="ai.ts" />

namespace System {

	/**
	 * The AICow's blackboard.
	 */
	type CowBlackboard = {
		fsm: CowFSM,
	}

	//
	// Cow FSM
	//

	enum CowState {
		Graze = 0,
		WalkLeft,
		WalkRight,
	}

	class CowFSM extends AI.BaseFSM {

		protected sysName = AICow.name

		// each cow has its own personality
		private activityInterval = Probability.uniformInt(2, 6) * 1000;

		private cowNext(): CowState {
			// stay in current state for chosen amt of time
			if (this.elapsedInCur < this.activityInterval) {
				return this.cur;
			}

			// move to next cow activity
			return Probability.uniformChoice([
				CowState.Graze,
				CowState.WalkLeft,
				CowState.WalkRight,
			]);
		}

		// If these are backwards no one will ever know.

		private walkLeft(): void {
			this.aspect.get(Component.Input).intent.set_(-1, -1);
		}

		private walkRight(): void {
			this.aspect.get(Component.Input).intent.set_(1, -1);
		}

		states = new Map<CowState, AI.FSMCode>([
			[CowState.Graze, {
				pre: AI.noop,
				body: this.wait,
				next: this.cowNext,
			}],
			[CowState.WalkLeft, {
				pre: AI.noop,
				body: this.walkLeft,
				next: this.cowNext,
			}],
			[CowState.WalkRight, {
				pre: AI.noop,
				body: this.walkRight,
				next: this.cowNext,
			}],
		])

		constructor(ecs: Engine.ECS, aspect: AIAspect) {
			// pick starting state here
			super(ecs, aspect, CowState.WalkLeft);
		}
	}

	/**
	 * The Cow AI just mills about randomly.
	 */
	export class AICow {

		/**
		 * Ensures that the AIAspect's blackboard has the AICow blackboard.
		 */
		private static ensureBlackboard(ecs: Engine.ECS, aspect: AIAspect): CowBlackboard {
			// create if needed
			if (!aspect.blackboards.has(AICow.name)) {
				let bb: CowBlackboard = {
					fsm: new CowFSM(ecs, aspect),
				}
				aspect.blackboards.set(AICow.name, bb);
			}

			// return it
			return aspect.blackboards.get(AICow.name);
		}

		public static update(delta: number, ecs: Engine.ECS, aspect: AIAspect): void {
			let blackboard = AICow.ensureBlackboard(ecs, aspect);
			blackboard.fsm.update(delta);

			// for debugging, update the component w/ the FSM state
			let aiComp = aspect.get(Component.AIComponent);
			aiComp.debugState = CowState[blackboard.fsm.cur];
		}

	}
}
