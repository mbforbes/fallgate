/// <reference path="../core/fsm.ts" />
/// <reference path="ai.ts" />

namespace System {

	/**
	 * The AISawtooth's blackboard.
	 */
	type FollowSawtoothBlackboard = {
		fsm: FollowSawtoothFSM,
    }

	//
	// FollowSawtooth FSM
	//

	enum FollowSawtoothState {
        Idle = 0,
        Pursue,
		Countdown,
		Explode,
	}

	class FollowSawtoothFSM extends AI.BaseFSM {

		protected sysName = AIFollowSawtooth.name

		private rangeDetectNext(): FollowSawtoothState {
			if (this.dead()) {
				return FollowSawtoothState.Countdown;
			}
			if (this.alivePlayerInRange(this.getParams<AI.FollowSawtoothParams>().pursueRadius)) {
				return FollowSawtoothState.Pursue;
			}

			return FollowSawtoothState.Idle;
        }

        private pursue(): void {
			// always try to face and move
			this.facePlayer();
            this.noAttack();
            this.moveForward();
        }

        private pursueNext(): FollowSawtoothState {
            if (this.dead()) {
                return FollowSawtoothState.Countdown;
            }
            return FollowSawtoothState.Pursue;
        }

		private countdownPre(): void {
			// play sound but only for sufficiently long countdowns
			if (this.getParams<AI.FollowSawtoothParams>().countdownTime >= 1000) {
				this.ecs.getSystem(System.Audio).play(['sawtoothBeep']);
			}
        }

		private countdownNext(): FollowSawtoothState {
			if (this.elapsedInCur < this.getParams<AI.FollowSawtoothParams>().countdownTime) {
				return FollowSawtoothState.Countdown;
			}
			return FollowSawtoothState.Explode;
		}

		private explodeNext(): FollowSawtoothState {
			// only need this because of respawning! (it will appear not dead
			// and needs to revert back to idle)
			if (this.dead()) {
				return FollowSawtoothState.Explode;
			} else {
				let activity = this.aspect.get(Component.Activity);
				activity.manual = false;
				return FollowSawtoothState.Idle;
			}
		}

		states = new Map<FollowSawtoothState, AI.FSMCode>([
			[FollowSawtoothState.Idle, {
				pre: AI.noop,
				body: this.wait,
				next: this.rangeDetectNext,
            }],
			[FollowSawtoothState.Pursue, {
				pre: AI.noop,
				body: this.pursue,
				next: this.pursueNext,
            }],
			[FollowSawtoothState.Countdown, {
				pre: this.countdownPre,
				body: this.wait,
				next: this.countdownNext,
            }],
			[FollowSawtoothState.Explode, {
				pre: this.explodePre,
				body: this.wait,
				next: this.explodeNext,
            }],
        ])

		constructor(ecs: Engine.ECS, aspect: AIAspect) {
			// start in wait state
			super(ecs, aspect, FollowSawtoothState.Idle);
		}
    }

    export class AIFollowSawtooth {

		/**
		 * Ensures that the AIAspect's blackboard has the AISawtooth blackboard.
		 */
		private static ensureBlackboard(ecs: Engine.ECS, aspect: AIAspect): FollowSawtoothBlackboard {
			// create if needed
			if (!aspect.blackboards.has(AIFollowSawtooth.name)) {
				let bb: FollowSawtoothBlackboard = {
					fsm: new FollowSawtoothFSM(ecs, aspect),
				}
				aspect.blackboards.set(AIFollowSawtooth.name, bb);
			}

			// return it
			return aspect.blackboards.get(AIFollowSawtooth.name);
        }

		/**
		 * AI System calls to update.
		 * @param delta
		 * @param ecs
		 * @param aspect
		 */
		public static update(delta: number, ecs: Engine.ECS, aspect: AIAspect): void {
			let blackboard = AIFollowSawtooth.ensureBlackboard(ecs, aspect);
			blackboard.fsm.update(delta);

			// for debugging, update the component w/ the FSM state
			let aiComp = aspect.get(Component.AIComponent);
			aiComp.debugState = FollowSawtoothState[blackboard.fsm.cur];
		}
    }
}
