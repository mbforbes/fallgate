/// <reference path="../core/fsm.ts" />
/// <reference path="ai.ts" />

namespace System {
	/**
	 * The AISentinel's blackboard.
	 */
	type SentinelBlackboard = {
		home: Point,
		fsm: SentinelFSM,
	}

	//
	// Sentinel FSM
	//

	enum SentinelState {
		AtHome = 0,
		GoHome,
		Pursue,
		Attack,
	}

	class SentinelFSM extends AI.BaseFSM {

		protected sysName = AISentinel.name

		/**
		 *	Get player's distance from our home
		 */
		private playerHomeDist(): number {
			return this.playerDistTo(this.getBlackboard<SentinelBlackboard>().home);
		}

		/**
		 * Helper for more aggressive states (pursuing and attacking) to
		 * determine next state.
		 */
		private aggressiveNext(): SentinelState {
			let params = this.getParams<AI.SentinelParams>();

			// if player's dead, or it's far enough away from our home and
			// we're allowed to forget, just go back home
			if (this.playerDead() || (params.forget && this.playerHomeDist() > params.pursuitDistance)) {
				return SentinelState.GoHome;
			}

			// if we're facing the player and in attack range, then attack
			if (this.facingPlayer() && this.alivePlayerInRange(params.attackRange)) {
				return SentinelState.Attack;
			}

			// otherwise player is in pursuit distance but we need to face
			// and/or move. stay in pursuit.
			return SentinelState.Pursue;
		}

		//
		// atHome
		//

		private atHomeNext(): SentinelState {
			// pursue player if in pursuit distance from home
			if (this.playerHomeDist() <= this.getParams<AI.SentinelParams>().pursuitDistance) {
				return SentinelState.Pursue;
			}

			// otherwise stay home
			return SentinelState.AtHome;
		}

		//
		// goHome
		//

		private goHomeDo(): void {
			this.faceTarget(this.getBlackboard<SentinelBlackboard>().home);
			this.noAttack();
			this.moveForward();
		}

		private goHomeNext(): SentinelState {
			// we may need to pursue the player
			if (this.playerHomeDist() <= this.getParams<AI.SentinelParams>().pursuitDistance) {
				return SentinelState.Pursue;
			}

			// if we made it home, yay.
			if (this.closeTo(this.getBlackboard<SentinelBlackboard>().home)) {
				return SentinelState.AtHome;
			}

			// otherwise keep going home
			return SentinelState.GoHome;
		}

		//
		// pursue(ing player) (includes facing)
		//

		private playerBowOut(): boolean {
			let pComps = this.getPlayerComps();
			if (!pComps.has(Component.Armed)) {
				return false;
			}
			let armed = pComps.get(Component.Armed);
			return armed.active.partID === PartID.Bow;
		}

		private pursueDo(): void {
			// always try to face
			this.facePlayer();
			this.noAttack();

			// if player has bow out, defend
			this.aspect.get(Component.Input).block = this.playerBowOut()


			// if not close enough to attack, also pursue
			if (!this.alivePlayerInRange(this.getParams<AI.SentinelParams>().attackRange)) {
				this.moveForward();
			}
		}

		//
		// attack!
		//

		private noBlock(): void {
			this.aspect.get(Component.Input).block = false;
		}

		private attackNext(): SentinelState {
			// always finish out swings (attacks).
			if (this.swinging()) {
				return SentinelState.Attack;
			}

			// otherwise, rely on general "aggressive next" check
			return this.aggressiveNext();
		}

		//
		// actual FSM defined now
		//

		states = new Map<SentinelState, AI.FSMCode>([
			[SentinelState.AtHome, {
				pre: AI.noop,
				body: this.wait,
				next: this.atHomeNext,
			}],
			[SentinelState.GoHome, {
				pre: AI.noop,
				body: this.goHomeDo,
				next: this.goHomeNext,
			}],
			[SentinelState.Pursue, {
				pre: AI.noop,
				body: this.pursueDo,
				next: this.aggressiveNext,
			}],
			[SentinelState.Attack, {
				pre: this.noBlock,
				body: this.stopAndAttack,
				next: this.attackNext,
			}],
		])

		constructor(ecs: Engine.ECS, aspect: AIAspect) {
			// start in wait state
			super(ecs, aspect, SentinelState.AtHome);
		}
	}

	//
	// actual AI class
	//

	export class AISentinel {

		/**
		 * Ensures that the AIAspect's blackboard has the AISentinel blackboard.
		 */
		private static ensureBlackboard(ecs: Engine.ECS, aspect: AIAspect): SentinelBlackboard {
			// create if needed
			if (!aspect.blackboards.has(AISentinel.name)) {
				let position = aspect.get(Component.Position);
				let bb: SentinelBlackboard = {
					home: position.p.copy(),
					fsm: new SentinelFSM(ecs, aspect),
				}
				aspect.blackboards.set(AISentinel.name, bb);
			}

			// return it
			return aspect.blackboards.get(AISentinel.name);
		}

		/**
		 * AI System calls to update.
		 * @param delta
		 * @param ecs
		 * @param aspect
		 */
		public static update(delta: number, ecs: Engine.ECS, aspect: AIAspect): void {
			let blackboard = AISentinel.ensureBlackboard(ecs, aspect);
			blackboard.fsm.update(delta);

			// for debugging, update the component w/ the FSM state
			let aiComp = aspect.get(Component.AIComponent);
			aiComp.debugState = SentinelState[blackboard.fsm.cur];
		}
	}
}
