/// <reference path="../engine/ecs.ts" />

namespace Component {

	/**
	 * Inspect this entity.
	 */
	export class DebugInspection extends Engine.Component {

		/**
		 *
		 * @param pickTime game time when this debug inspection was picked
		 * (done so systems can prune old ones)
		 */
		constructor(public pickTime: number) {
			super();
		}
	}
}
