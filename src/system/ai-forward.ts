namespace System {

	type ForwardBlackboard = {
		fsm: ForwardFSM,
	}

	enum ForwardState {
		WaitBefore = 0,
		Forward,
		WaitAfter,
	}

	class ForwardFSM extends AI.BaseFSM {

		protected sysName = AIForward.name

		constructor(ecs: Engine.ECS, aspect: AIAspect) {
			// start in wait state
			super(ecs, aspect, ForwardState.WaitBefore);
		}

		private waitNext(): ForwardState {
			let fwdParams = this.getParams<AI.ForwardParams>();
			return this.elapsedInCur <= fwdParams.beforeWaitTime ? ForwardState.WaitBefore : ForwardState.Forward;
		}

		private maybeFaceExit(): void {
			// check whether we're supposed to face the exit
			let fwdParams = this.getParams<AI.ForwardParams>();
			if (!fwdParams.faceExit) {
				return;
			}

			// just face the first exit we find (assumes instant turn).
			let gateSelector = this.ecs.getSystem(GateSelector);
			for (let gateE of gateSelector.latest()) {
				let gateComps = this.ecs.getComponents(gateE);
				let gate = gateComps.get(Component.Gate);
				if (gate.exit) {
					this.faceTarget(gateComps.get(Component.Position).p);
				}
			}
		}

		private fwdNext(): ForwardState {
			let fwdParams = this.getParams<AI.ForwardParams>();
			return this.elapsedInCur <= fwdParams.forwardTime ? ForwardState.Forward : ForwardState.WaitAfter;
		}

		states = new Map<ForwardState, AI.FSMCode>([
			[ForwardState.WaitBefore, {
				pre: AI.noop,
				body: this.wait,
				next: this.waitNext,
			}],
			[ForwardState.Forward, {
				pre: this.maybeFaceExit,
				body: this.moveForward,
				next: this.fwdNext,
			}],
			[ForwardState.WaitAfter, {
				pre: AI.noop,
				body: this.wait,
				next: () => {return ForwardState.WaitAfter},
			}],
		])

	}

	export class AIForward {

		/**
		 * Ensures that the AIAspect's blackboard has the AISpider blackboard.
		 */
		private static ensureBlackboard(ecs: Engine.ECS, aspect: AIAspect): ForwardBlackboard {
			// create if needed
			if (!aspect.blackboards.has(AIForward.name)) {
				let bb: ForwardBlackboard = {
					fsm: new ForwardFSM(ecs, aspect),
				};
				aspect.blackboards.set(AIForward.name, bb);
			}

			// return it
			return aspect.blackboards.get(AIForward.name);
		}

		/**
		 * AI System calls to update.
		 * @param delta
		 * @param ecs
		 * @param aspect
		 */
		public static update(delta: number, ecs: Engine.ECS, aspect: AIAspect): void {
			let blackboard = AIForward.ensureBlackboard(ecs, aspect);
			blackboard.fsm.update(delta);

			// for debugging, update the component w/ the FSM state
			let aiComp = aspect.get(Component.AIComponent);
			aiComp.debugState = ForwardState[blackboard.fsm.cur];
		}
	}
}
