/// <reference path="../engine/ecs.ts" />

namespace Component {

	/**
	 * Denotes an entity that can execute combo attacks. Flag is set by Combo
	 * System and read by Swing system.
	 */
	export class Comboable extends Engine.Component {
		public comboReady: boolean = false

		// state that the combo system uses to bookkeep. (needed here because
		// combo system tracks per-attack instead of per-attacker, so can't
		// easily store in aspect there.)
		public attacks: Attack[]

		/**
		 * @param hits How many hits it takes to have a combo
		 * @param consecutiveWindow Allowed time between consecutive hits
		 * @param activeWindow How long combo is active after conditions met
		 */
		constructor(
				public hits: number,
				public consecutiveWindow: number,
				public activeWindow: number,
		) {
			super();
			this.attacks = [];
		}

		public toString(): string {
			return 'ready: ' + (this.comboReady ? Constants.CHECKMARK : Constants.XMARK);
		}
	}
}
