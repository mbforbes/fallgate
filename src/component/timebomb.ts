/// <reference path="../engine/ecs.ts" />

/**
 * What to do when the timebomb goes off.
 */
enum Destruct {
	/**
	 * Remove the component.
	 */
	Component = 0,

	/**
	 * Remove the entire entity.
	 */
	Entity,
}

namespace Component {
	export class Timebomb extends Engine.Component {

		/**
		 * When created (set on first Timebom System pass).
		 */
		public startTime: number = -1

		constructor(
				/**
				 * Total time in ms this will last (doesn't change).
				 */
				public duration: number,

				/**
				 * What to do upon destruction.
				 */
				public destruct: Destruct,

				/**
				 * A fuse, to allow others to request that the destruction is
				 * activated.
				 */
				public fuse: boolean = false,

				/**
				 * An optional function that will be called upon destruction.
				 */
				public lastWish?: (ecs: Engine.ECS, entity: Engine.Entity) => void,
				) {
			super();
		}

		public toString(): string {
			return 'total duration: ' + this.duration + 'ms';
		}
	}
}
