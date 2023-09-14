/// <reference path="../core/fsm.ts" />
/// <reference path="ai.ts" />
/// <reference path="util.ts" />

namespace System {

	/**
	 * The AISpider's blackboard.
	 */
	type SpiderBlackboard = {
		fsm: SpiderFSM,
		waitDuration: number,
		moveAngle: number,
		moveDuration: number,
	}

	//
	// Spider FSM
	//

	enum SpiderState {
		Wait = 0,
		Move,
		Face,
		Attack,
	}

	class SpiderFSM extends AI.BaseFSM {

		protected sysName = AISpider.name

		private waitswapUnlessPreemp(cur: number, other: number,
			preemp: number, maxDuration: number): number {
			// if player in range, preemp state
			if (this.alivePlayerInRange(this.getParams<AI.SpiderParams>().attackRange)) {
				return preemp;
			}

			// if elapsed over duration, switch to other
			if (this.elapsedInCur >= maxDuration) {
				return other;
			}

			// else, just stay as self
			return cur;
		}

		//
		// wait
		//

		private waitPre(): void {
			// pick uniform wait time between param set min and max
			let params = this.getParams<AI.SpiderParams>();
			this.getBlackboard<SpiderBlackboard>().waitDuration = Probability.uniformInt(
				params.waitMin, params.waitMax);
		}

		private waitNext(): SpiderState {
			return this.waitswapUnlessPreemp(
				SpiderState.Wait,
				SpiderState.Move,
				SpiderState.Face,
				this.getBlackboard<SpiderBlackboard>().waitDuration);
		}

		//
		// move
		//

		private movePre(): void {
			let blackbaord = this.aspect.blackboards.get(AISpider.name);

			// pick move angle
			blackbaord.moveAngle = angleClamp(Math.random() * Constants.TWO_PI);

			// pick move duration
			let params = this.getParams<AI.SpiderParams>();
			blackbaord.moveDuration = Probability.uniformInt(params.moveMin, params.moveMax);
		}

		private moveDo(): void {
			// go forward at angle
			let input = this.aspect.get(Component.Input);
			input.targetAngle = this.getBlackboard<SpiderBlackboard>().moveAngle;
			input.intent.y = Physics.UP;
		}

		private moveNext(): SpiderState {
			if (this.hittingWall()) {
				return SpiderState.Wait;
			}
			return this.waitswapUnlessPreemp(
				SpiderState.Move,
				SpiderState.Wait,
				SpiderState.Face,
				this.getBlackboard<SpiderBlackboard>().moveDuration);
		}


		//
		// check used both in Face and Attack
		//

		/**
		 * Checks whether to exit 'agressive' states and go back to Wait, or to
		 * try attacking (Face / Attack)
		 */
		private aggressiveNext(): SpiderState {
			// if the player's not in range, go back to wait. otherwise, try to
			// face or attack.
			let playerInRange = this.alivePlayerInRange(this.getParams<AI.SpiderParams>().attackRange);

			if (!playerInRange) {
				return SpiderState.Wait;
			} else {
				return this.facingPlayer() ? SpiderState.Attack : SpiderState.Face;
			}
		}

		//
		// attack facing (wants to attack, has to try to face player)
		//

		private faceDo(): void {
			this.facePlayer();
			this.noAttack();
		}

		//
		// attack attacking: do a swing! (or a barrel roll)
		//

		private attackNext(): SpiderState {
			// always finish out swings (attacks). if not swinging, use the
			// general aggressive next check.
			if (this.swinging()) {
				return SpiderState.Attack;
			}
			return this.aggressiveNext();
		}

		/**
		 * This is the actual FSM: mapping between states and functions.
		 */
		states = new Map<SpiderState, AI.FSMCode>([
			[SpiderState.Wait, {
				pre: this.waitPre,
				body: this.wait,
				next: this.waitNext,
			}],
			[SpiderState.Move, {
				pre: this.movePre,
				body: this.moveDo,
				next: this.moveNext,
			}],
			[SpiderState.Face, {
				pre: AI.noop,
				body: this.faceDo,
				next: this.aggressiveNext,
			}],
			[SpiderState.Attack, {
				pre: AI.noop,
				body: this.stopAndAttack,
				next: this.attackNext,
			}],
		])

		constructor(ecs: Engine.ECS, aspect: AIAspect) {
			// start in wait state
			super(ecs, aspect, SpiderState.Wait);
		}
	}

	//
	// actual AI class itself
	//

	export class AISpider {

		/**
		 * Ensures that the AIAspect's blackboard has the AISpider blackboard.
		 */
		private static ensureBlackboard(ecs: Engine.ECS, aspect: AIAspect): SpiderBlackboard {
			// create if needed
			if (!aspect.blackboards.has(AISpider.name)) {
				let bb: SpiderBlackboard = {
					fsm: new SpiderFSM(ecs, aspect),
					waitDuration: -1,
					moveAngle: -1,
					moveDuration: -1,
				};
				aspect.blackboards.set(AISpider.name, bb);
			}

			// return it
			return aspect.blackboards.get(AISpider.name);
		}

		/**
		 * AI System calls to update.
		 * @param delta
		 * @param ecs
		 * @param aspect
		 */
		public static update(delta: number, ecs: Engine.ECS, aspect: AIAspect): void {
			let blackboard = AISpider.ensureBlackboard(ecs, aspect);
			blackboard.fsm.update(delta);

			// for debugging, update the component w/ the FSM state
			let aiComp = aspect.get(Component.AIComponent);
			aiComp.debugState = SpiderState[blackboard.fsm.cur];
		}
	}
}
