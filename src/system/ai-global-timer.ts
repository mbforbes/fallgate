namespace System {

	type SwingTimerBlackboard = {
		fsm: SwingTimerFSM,
	}

	enum SwingTimerState {
		InitialWait = 0,
		Wait,
		Attack,
	}

	class SwingTimerFSM extends AI.BaseFSM {

		protected sysName = AISwingTimer.name

		constructor(ecs: Engine.ECS, aspect: AIAspect) {
			// start in initial wait state
			super(ecs, aspect, SwingTimerState.InitialWait);
		}

		private initialWaitNext(): SwingTimerState {
			let swingTimerParams = this.getParams<AI.SwingTimerParams>();
			return this.elapsedInCur <= swingTimerParams.initialWait ? SwingTimerState.InitialWait : SwingTimerState.Wait;
		}

		private waitNext(): SwingTimerState {
			let swingTimerParams = this.getParams<AI.SwingTimerParams>();
			return this.elapsedInCur <= swingTimerParams.wait ? SwingTimerState.Wait : SwingTimerState.Attack;
		}

		private attackNext(): SwingTimerState {
			let swingTimerParams = this.getParams<AI.SwingTimerParams>();
			return this.elapsedInCur <= swingTimerParams.attack ? SwingTimerState.Attack : SwingTimerState.Wait;
		}

		states = new Map<SwingTimerState, AI.FSMCode>([
			[SwingTimerState.InitialWait, {
				pre: AI.noop,
				body: this.noAttack,
				next: this.initialWaitNext,
			}],
			[SwingTimerState.Wait, {
				pre: AI.noop,
				body: this.noAttack,
				next: this.waitNext,
			}],
			[SwingTimerState.Attack, {
				pre: AI.noop,
				body: () => { this.aspect.get(Component.Input).attack = true; },
				next: this.attackNext,
			}],
		])
	}

	export class AISwingTimer {

		/**
		 * Ensures that the AIAspect's blackboard has the AISpider blackboard.
		 */
		private static ensureBlackboard(ecs: Engine.ECS, aspect: AIAspect): SwingTimerBlackboard {
			// create if needed
			if (!aspect.blackboards.has(AISwingTimer.name)) {
				let bb: SwingTimerBlackboard = {
					fsm: new SwingTimerFSM(ecs, aspect),
				};
				aspect.blackboards.set(AISwingTimer.name, bb);
			}

			// return it
			return aspect.blackboards.get(AISwingTimer.name);
		}

		/**
		 * AI System calls to update.
		 * @param delta
		 * @param ecs
		 * @param aspect
		 */
		public static update(delta: number, ecs: Engine.ECS, aspect: AIAspect): void {
			let blackboard = AISwingTimer.ensureBlackboard(ecs, aspect);
			blackboard.fsm.update(delta);

			// for debugging, update the component w/ the FSM state
			let aiComp = aspect.get(Component.AIComponent);
			aiComp.debugState = SwingTimerState[blackboard.fsm.cur];
		}
	}
}
