/// <reference path="../component/debug-inspection.ts" />

namespace System {

	/**
	 * Ensures only one entity has the Component.DebugInspection on it.
	 */
	export class DebugInspectionUniquifier extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.DebugInspection.name,
		])

		constructor() {
			super(false, true);
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			if (entities.size == 0) {
				return
			}

			// get one with biggest timestamp
			let latestTime: number = -1;
			let latestEntity: Engine.Entity = null;
			for (let [entity, aspect] of entities.entries()) {
				let di = aspect.get(Component.DebugInspection);
				if (di.pickTime > latestTime) {
					latestTime = di.pickTime;
					latestEntity = entity;
				}
			}

			// prune debug inspection component off of the others
			for (let [entity, aspect] of entities.entries()) {
				if (entity !== latestEntity) {
					this.ecs.removeComponent(entity, Component.DebugInspection);
				}
			}
		}
	}
}
