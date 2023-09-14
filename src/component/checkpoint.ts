/// <reference path="../engine/ecs.ts" />

namespace Component {

	/**
	 * Marks an entity as a checkpoint.
	 */
	export class Checkpoint extends Engine.Component {

		constructor(public gateID: string) {
			super();
		}
	}
}
