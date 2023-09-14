/// <reference path="../core/fsm.ts" />
/// <reference path="ai.ts" />

namespace System {
	/**
	 * The AIBrawler's blackboard.
	 */
	type BrawlerBlackboard = {
		home: Point,
		fsm: BrawlerFSM,
	}

	//
	// Brawler FSM
	//

	enum BrawlerState {
		AtHome = 0,
		GoHome,
		Pursue,
		Attack,
	}

	class BrawlerFSM extends AI.BaseFSM {

		protected sysName = AIBrawler.name

		/**
		 *	Get player's distance from our home
		 */
		private playerHomeDist(): number {
			return this.playerDistTo(this.getBlackboard<BrawlerBlackboard>().home);
		}

		/**
		 * Helper for more aggressive states (pursuing and attacking) to
		 * determine next state.
		 */
		private aggressiveNext(): BrawlerState {
			let params = this.getParams<AI.BrawlerParams>();

			// if player's dead, or it's far enough away from our home and
			// we're allowed to forget, just go back home
			if (this.playerDead() || (params.forget && this.playerHomeDist() > params.pursuitDistance)) {
				return BrawlerState.GoHome;
			}

			// if we're facing the player and in attack range, then attack
			if (this.facingPlayer() && this.alivePlayerInRange(params.attackRange)) {
				return BrawlerState.Attack;
			}

			// otherwise player is in pursuit distance but we need to face
			// and/or move. stay in pursuit.
			return BrawlerState.Pursue;
		}

		//
		// atHome
		//

		private atHomeNext(): BrawlerState {
			// pursue player if in pursuit distance from home
			if (this.playerHomeDist() <= this.getParams<AI.BrawlerParams>().pursuitDistance) {
				return BrawlerState.Pursue;
			}

			// otherwise stay home
			return BrawlerState.AtHome;
		}

		//
		// goHome
		//

		private goHomeDo(): void {
			this.faceTarget(this.getBlackboard<BrawlerBlackboard>().home);
			this.noAttack();
			this.moveForward();
		}

		private goHomeNext(): BrawlerState {
			// we may need to pursue the player
			if (this.playerHomeDist() <= this.getParams<AI.BrawlerParams>().pursuitDistance) {
				return BrawlerState.Pursue;
			}

			// if we made it home, yay.
			if (this.closeTo(this.getBlackboard<BrawlerBlackboard>().home)) {
				return BrawlerState.AtHome;
			}

			// otherwise keep going home
			return BrawlerState.GoHome;
		}

		//
		// pursue(ing player) (includes facing)
		//

		private pursueDo(): void {
			// always try to face
			this.facePlayer();
			this.noAttack();

			// if not close enough to attack, also pursue
			if (!this.alivePlayerInRange(this.getParams<AI.BrawlerParams>().attackRange)) {
				this.moveForward();
			}
		}

		//
		// attack!
		//

		private attackNext(): BrawlerState {
			// always finish out swings (attacks).
			if (this.swinging()) {
				return BrawlerState.Attack;
			}

			// otherwise, rely on general "aggressive next" check
			return this.aggressiveNext();
		}

		//
		// actual FSM defined now
		//

		states = new Map<BrawlerState, AI.FSMCode>([
			[BrawlerState.AtHome, {
				pre: AI.noop,
				body: this.wait,
				next: this.atHomeNext,
			}],
			[BrawlerState.GoHome, {
				pre: AI.noop,
				body: this.goHomeDo,
				next: this.goHomeNext,
			}],
			[BrawlerState.Pursue, {
				pre: AI.noop,
				body: this.pursueDo,
				next: this.aggressiveNext,
			}],
			[BrawlerState.Attack, {
				pre: AI.noop,
				body: this.stopAndAttack,
				next: this.attackNext,
			}],
		])

		constructor(ecs: Engine.ECS, aspect: AIAspect) {
			// start in wait state
			super(ecs, aspect, BrawlerState.AtHome);
		}
	}

	//
	// actual AI class
	//

	export class AIBrawler {

		/**
		 * Ensures that the AIAspect's blackboard has the AIBrawler blackboard.
		 */
		private static ensureBlackboard(ecs: Engine.ECS, aspect: AIAspect): BrawlerBlackboard {
			// create if needed
			if (!aspect.blackboards.has(AIBrawler.name)) {
				let position = aspect.get(Component.Position);
				let bb: BrawlerBlackboard = {
					home: position.p.copy(),
					fsm: new BrawlerFSM(ecs, aspect),
				}
				aspect.blackboards.set(AIBrawler.name, bb);
			}

			// return it
			return aspect.blackboards.get(AIBrawler.name);
		}

		/**
		 * AI System calls to update.
		 * @param delta
		 * @param ecs
		 * @param aspect
		 */
		public static update(delta: number, ecs: Engine.ECS, aspect: AIAspect): void {
			let blackboard = AIBrawler.ensureBlackboard(ecs, aspect);
			blackboard.fsm.update(delta);

			// for debugging, update the component w/ the FSM state
			let aiComp = aspect.get(Component.AIComponent);
			aiComp.debugState = BrawlerState[blackboard.fsm.cur];
		}
	}
}
