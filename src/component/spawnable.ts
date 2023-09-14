/// <reference path="../core/base.ts" />
/// <reference path="../engine/ecs.ts" />

namespace Component {
	/**
	 * Marks where an entity should be respawned.
	 */
	export class Spawnable extends Engine.Component {

		// main settings
		public position: Point

		constructor(position: Point, public angle: number = 0) {
			super();

			this.position = position.copy();
		}
	}
}
