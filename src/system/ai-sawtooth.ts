/// <reference path="../core/fsm.ts" />
/// <reference path="ai.ts" />

namespace System {

	/**
	 * The AISawtooth's blackboard.
	 */
	type SawtoothBlackboard = {
		dodgeDirection: number,
		dodgesPerformed: number,
		fsm: SawtoothFSM,
	}

	//
	// Sawtooth FSM
	//

	enum SawtoothState {
		Idle = 0,
		Kite,
		DodgeDodge,
		DodgeWait,	// only happens after a dodge
		Attack,
		Cooldown,
		Escape,
		Countdown,
		Explode,
	}

	class SawtoothFSM extends AI.BaseFSM {

		protected sysName = AISawtooth.name

		private rangeDetectNext(): SawtoothState {
			if (this.dead()) {
				return SawtoothState.Countdown;
			}
			if (this.alivePlayerInRange(this.getParams<AI.SawtoothParams>().aggressiveRadius)) {
				return SawtoothState.DodgeDodge;
			}
			if (this.alivePlayerInRange(this.getParams<AI.SawtoothParams>().kiteRadius)) {
				return SawtoothState.Kite;
			}

			return SawtoothState.Idle;
		}

		private kiteBody(): void {
			this.facePlayer();
			this.moveBackwards(this.getParams<AI.SawtoothParams>().kiteSpeedScale);
		}

		private dodgePre(): void {
			this.aspect.get(Component.Input).intent.y = 0;

			// face player at start if moving laterally
			if (!this.getParams<AI.SawtoothParams>().dodgeRotate) {
				this.facePlayer();
			}

			// pick dodge direction
			let bb = this.getBlackboard<SawtoothBlackboard>();
			bb.dodgeDirection = Probability.uniformChoice([-1, 1]);

			// increment no. dodges
			bb.dodgesPerformed++;
		}

		private dodgeDodgeBody(): void {
			// rotate every frame if set to
			if (this.getParams<AI.SawtoothParams>().dodgeRotate) {
				this.facePlayer();
			}

			// move in dodge direction
			this.aspect.get(Component.Input).intent.x = this.getBlackboard<SawtoothBlackboard>().dodgeDirection;
		}

		private dodgeDodgeNext(): SawtoothState {
			if (this.dead()) {
				return SawtoothState.Countdown;
			}
			if (this.elapsedInCur <= this.getParams<AI.SawtoothParams>().dodgeDodgeTime) {
				return SawtoothState.DodgeDodge;
			}

			// only go to dodgewait if we may do another dodge
			let bb = this.getBlackboard<SawtoothBlackboard>();
			let params = this.getParams<AI.SawtoothParams>();
			if (bb.dodgesPerformed < params.dodges) {
				return SawtoothState.DodgeWait;
			}

			// exit directly from dodge to attack
			bb.dodgesPerformed = 0;
			return SawtoothState.Attack;
		}

		private dodgeWaitNext(): SawtoothState {
			if (this.dead()) {
				return SawtoothState.Countdown;
			}
			if (this.elapsedInCur <= this.getParams<AI.SawtoothParams>().dodgeWaitTime) {
				return SawtoothState.DodgeWait;
			}

			let bb = this.getBlackboard<SawtoothBlackboard>();

			// we've finished the cooldown. we may want to go back to idle or
			// kite, so check the range.
			let rangeCheckState = this.rangeDetectNext();
			if (rangeCheckState != SawtoothState.DodgeDodge) {
				bb.dodgesPerformed = 0;
				return rangeCheckState;
			}

			// we came to dodgewait because we could do another dodge, so do that.
			// or to attack.
			return SawtoothState.DodgeDodge;
		}

		private attackBody(): void {
			this.facePlayer();
			this.moveForward(this.getParams<AI.SawtoothParams>().attackSpeedScale);
			this.attack()
		}

		private attackNext(): SawtoothState {
			if (this.dead()) {
				return SawtoothState.Countdown;
			}
			// keep attacking utnil sheathing or blocked, after which go to
			// cooldown
			let activity = this.aspect.get(Component.Activity).action;
			switch (activity) {
				case Action.Blocked:
				case Action.Sheathing:
					return SawtoothState.Cooldown;
				default:
					return SawtoothState.Attack;
			}
		}

		private cooldownNext(): SawtoothState {
			if (this.dead()) {
				return SawtoothState.Countdown;
			}
			if (this.elapsedInCur < this.getParams<AI.SawtoothParams>().cooldownTime) {
				return SawtoothState.Cooldown;
			}

			// if palyer went away, go back to idle / kite
			let rangeCheckState = this.rangeDetectNext();
			if (rangeCheckState !== SawtoothState.DodgeDodge) {
				return rangeCheckState;
			}

			// if player is still near after cooldown, escape!
			return SawtoothState.Escape;
		}

		private escape(): void {
			this.facePlayer();
			this.moveBackwards(this.getParams<AI.SawtoothParams>().escapeSpeedScale);
		}

		private escapeNext(): SawtoothState {
			if (this.dead()) {
				return SawtoothState.Countdown;
			}
			if (this.elapsedInCur < this.getParams<AI.SawtoothParams>().escapeTime) {
				return SawtoothState.Escape;
			}

			return this.rangeDetectNext();
		}

		private countdownPre(): void {
			// play sound but only for sufficiently long countdowns
			if (this.getParams<AI.SawtoothParams>().countdownTime >= 1000) {
				this.ecs.getSystem(System.Audio).play(['sawtoothBeep']);
			}
		}

		private countdownNext(): SawtoothState {
			if (this.elapsedInCur < this.getParams<AI.SawtoothParams>().countdownTime) {
				return SawtoothState.Countdown;
			}
			return SawtoothState.Explode;
		}

		private explodeNext(): SawtoothState {
			// only need this because of respawning! (it will appear not dead
			// and needs to revert back to idle)
			if (this.dead()) {
				return SawtoothState.Explode;
			} else {
				let activity = this.aspect.get(Component.Activity);
				activity.manual = false;
				return SawtoothState.Idle;
			}
		}

		states = new Map<SawtoothState, AI.FSMCode>([
			[SawtoothState.Idle, {
				pre: AI.noop,
				body: this.wait,
				next: this.rangeDetectNext,
			}],
			[SawtoothState.Kite, {
				pre: AI.noop,
				body: this.kiteBody,
				next: this.rangeDetectNext,
			}],
			[SawtoothState.DodgeDodge, {
				pre: this.dodgePre,
				body: this.dodgeDodgeBody,
				next: this.dodgeDodgeNext,
			}],
			[SawtoothState.DodgeWait, {
				pre: AI.noop,
				body: this.wait,
				next: this.dodgeWaitNext,
			}],
			[SawtoothState.Attack, {
				pre: AI.noop,
				body: this.attackBody,
				next: this.attackNext,
			}],
			[SawtoothState.Cooldown, {
				pre: AI.noop,
				body: this.wait,
				next: this.cooldownNext,
			}],
			[SawtoothState.Escape, {
				pre: AI.noop,
				body: this.escape,
				next: this.escapeNext,
			}],
			[SawtoothState.Countdown, {
				pre: this.countdownPre,
				body: this.wait,
				next: this.countdownNext,
			}],
			[SawtoothState.Explode, {
				pre: this.explodePre,
				body: this.wait,
				next: this.explodeNext,
			}],
		])


		constructor(ecs: Engine.ECS, aspect: AIAspect) {
			// start in wait state
			super(ecs, aspect, SawtoothState.Idle);
		}
	}

	//
	// actual AI class
	//

	export class AISawtooth {

		/**
		 * Ensures that the AIAspect's blackboard has the AISawtooth blackboard.
		 */
		private static ensureBlackboard(ecs: Engine.ECS, aspect: AIAspect): SawtoothBlackboard {
			// create if needed
			if (!aspect.blackboards.has(AISawtooth.name)) {
				let bb: SawtoothBlackboard = {
					dodgesPerformed: 0,
					dodgeDirection: -1,
					fsm: new SawtoothFSM(ecs, aspect),
				}
				aspect.blackboards.set(AISawtooth.name, bb);
			}

			// return it
			return aspect.blackboards.get(AISawtooth.name);
		}

		/**
		 * AI System calls to update.
		 * @param delta
		 * @param ecs
		 * @param aspect
		 */
		public static update(delta: number, ecs: Engine.ECS, aspect: AIAspect): void {
			let blackboard = AISawtooth.ensureBlackboard(ecs, aspect);
			blackboard.fsm.update(delta);

			// for debugging, update the component w/ the FSM state
			let aiComp = aspect.get(Component.AIComponent);
			aiComp.debugState = SawtoothState[blackboard.fsm.cur];
		}
	}
}
