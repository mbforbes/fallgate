/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/shield.ts" />

namespace Component {

	export class Shielded extends Engine.Component {

		// main settings
		public active: Shield.Shield

		public inventory = new Array<Shield.Shield>()
		public activeIdx = -1

		constructor(
				active: Shield.Shield,

				/**
				 * The state is set by the Defend system to match its internal
				 * state and should only be observed by other systems.
				 */
				public state: Shield.BlockState = Shield.BlockState.Idle) {
			super();

			this.active = Shield.cloneShield(active);
			this.inventory.push(this.active);
			this.activeIdx = 0;
		}
	}
}
