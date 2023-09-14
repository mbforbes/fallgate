/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/weapon.ts" />

namespace Component {

	export class Armed extends Engine.Component {

		// main settings
		public active: Weapon.Weapon

		public inventory = new Array<Weapon.Weapon>()
		public activeIdx = -1

		/**
		 * Elapsed is the time in ms that has been spent in this.state. This is
		 * used for display purposes (e.g. for flashing tints during variuos
		 * stages of charging). It is set by the Swing system to match its
		 * internal state and should only be observed by other systems.
		 */
		public elapsed = 0

		constructor(
				active: Weapon.Weapon,

				/**
				 * The state is set by the Swing system to match its internal
				 * state and should only be observed by other systems.
				 */
				public state: Weapon.SwingState = Weapon.SwingState.Idle) {
			super();
			this.active = Weapon.cloneWeapon(active);
			this.inventory.push(active);
			this.activeIdx = 0;
		}
	}
}
