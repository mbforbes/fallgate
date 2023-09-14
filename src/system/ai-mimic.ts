/// <reference path="../core/fsm.ts" />
/// <reference path="ai.ts" />
/// <reference path="util.ts" />

namespace System {

	/**
	 * The AIMimic's blackboard.
	 */
	type MimicBlackboard = {
		home: Point,
		fsm: MimicFSM,
	}

	//
	// Mimic FSM
	//

	enum MimicState {
		Hide = 0,
		Smash,
		Pursue,
		GoHome,
		Attack,
	}

	class MimicFSM extends AI.BaseFSM {

		protected sysName = AIMimic.name

		/**
		 *	Get player's distance from our home
		 */
		private playerHomeDist(): number {
			return this.playerDistTo(this.getBlackboard<MimicBlackboard>().home);
		}

		/**
		 * Helper for more aggressive states (pursuing and attacking) to
		 * determine next state.
		 */
		private aggressiveNext(): MimicState {
			let params = this.getParams<AI.MimicParams>();

			// if player's far enough away from our home, just go back home
			if (this.playerHomeDist() > params.pursuitDistance) {
				return MimicState.GoHome;
			}

			// if we're facing the player and in attack range, then attack
			if (this.facingPlayer() && this.alivePlayerInRange(params.attackRange)) {
				return MimicState.Attack;
			}

			// otherwise player is in pursuit distance but we need to face
			// and/or move. stay in pursuit.
			return MimicState.Pursue;
		}


		//
		// hide
		//

		private hideNext(): MimicState {
			// jump out and attack player if hiding and they get near us. (not
			// using home distance because crate can be pushed.)
			if (this.playerDist() <= this.getParams<AI.MimicParams>().noticeDistance) {
				return MimicState.Smash;
			}

			// otherwise stay hiding
			return MimicState.Hide;
		}

		//
		// smash
		//

		private smashDo(): void {
			let input = this.aspect.get(Component.Input);
			input.quickAttack = true;
		}

		private smashNext(): MimicState {
			return MimicState.Pursue;
		}

		//
		// pursue
		//

		private pursueDo(): void {
			// stop the smashing
			let input = this.aspect.get(Component.Input);
			input.quickAttack = false;

			// always try to face
			this.facePlayer();
			this.noAttack();

			// if not close enough to attack, also pursue
			if (!this.alivePlayerInRange(this.getParams<AI.MimicParams>().attackRange)) {
				this.moveForward();
			}
		}

		//
		// goHome
		//

		private goHomeDo(): void {
			this.faceTarget(this.getBlackboard<MimicBlackboard>().home);
			this.noAttack();
			this.moveForward();
		}

		private goHomeNext(): MimicState {
			// we may need to pursue the player
			if (this.playerHomeDist() <= this.getParams<AI.MimicParams>().pursuitDistance) {
				return MimicState.Pursue;
			}

			// if we made it home, yay.
			if (this.closeTo(this.getBlackboard<MimicBlackboard>().home)) {
				return MimicState.Hide;
			}

			// otherwise keep going home
			return MimicState.GoHome;
		}

		//
		// attack!
		//

		private attackNext(): MimicState {
			// always finish out swings (attacks).
			if (this.swinging()) {
				return MimicState.Attack;
			}

			// otherwise, rely on general "aggressive next" check
			return this.aggressiveNext();
		}

		states = new Map<MimicState, AI.FSMCode>([
			[MimicState.Hide, {
				pre: AI.noop,
				body: this.wait,
				next: this.hideNext,
			}],
			[MimicState.Smash, {
				pre: AI.noop,
				body: this.smashDo,
				next: this.smashNext,
			}],
			[MimicState.Pursue, {
				pre: AI.noop,
				body: this.pursueDo,
				next: this.aggressiveNext,
			}],
			[MimicState.GoHome, {
				pre: AI.noop,
				body: this.goHomeDo,
				next: this.goHomeNext,
			}],
			[MimicState.Attack, {
				pre: AI.noop,
				body: this.stopAndAttack,
				next: this.attackNext,
			}],
		])

		constructor(ecs: Engine.ECS, aspect: AIAspect) {
			// start in wait state
			super(ecs, aspect, MimicState.Hide);
		}
	}

	export class AIMimic {

		/**
		 * Ensures that the AIAspect's blackboard has the AIMimic blackboard.
		 */
		private static ensureBlackboard(ecs: Engine.ECS, aspect: AIAspect): MimicBlackboard {
			// create if needed
			if (!aspect.blackboards.has(AIMimic.name)) {
				let position = aspect.get(Component.Position);
				let bb: MimicBlackboard = {
					home: position.p.copy(),
					fsm: new MimicFSM(ecs, aspect),
				}
				aspect.blackboards.set(AIMimic.name, bb);
			}

			// return it
			return aspect.blackboards.get(AIMimic.name);
		}

		/**
		 * AI System calls to update.
		 * @param delta
		 * @param ecs
		 * @param aspect
		 */
		public static update(delta: number, ecs: Engine.ECS, aspect: AIAspect): void {
			let blackboard = AIMimic.ensureBlackboard(ecs, aspect);
			blackboard.fsm.update(delta);

			// for debugging, update the component w/ the FSM state
			let aiComp = aspect.get(Component.AIComponent);
			aiComp.debugState = MimicState[blackboard.fsm.cur];
		}
	}

}
