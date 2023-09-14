/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/physics.ts" />

namespace Component {

	/**
	 * A physics region has some effect on things moving through it.
	 */
	export class PhysicsRegion extends Engine.Component {

		// main settings
		public region: Physics.Region

		constructor(region: Physics.Region) {
			super();

			this.region = clone(region);
		}
	}
}
