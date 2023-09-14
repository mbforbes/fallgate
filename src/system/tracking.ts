/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/tracker.ts" />

namespace System {

	export class Tracking extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Position.name,
			Component.Tracker.name,
		])

		private cacheP = new Point()

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			let offset = this.cacheP;
			for (let aspect of entities.values()) {
				// extract
				let position = aspect.get(Component.Position);
				let tracker = aspect.get(Component.Tracker);
				let targetComps = this.ecs.getComponents(tracker.target);
				// sanity check in case target went out of scope
				if (targetComps == null) {
					continue;
				}
				let targetPos = targetComps.get(Component.Position);

				// compute offset
				offset.set_(0, 0);
				if (!tracker.trackRotation) {
					// the offset doesn't track rotation
					offset.copyFrom_(tracker.offset);
				} else {
					// the offset tracks rotation. when rotated, both (x and y)
					// components of the offset contribute to each of the (x and
					// y) directions.
					let a = targetPos.angle;
					let aPrime = a - Constants.HALF_PI;
					offset.set_(
						Math.cos(a) * tracker.offset.x + Math.cos(aPrime) * tracker.offset.y,
						-Math.sin(a) * tracker.offset.x + -Math.sin(aPrime) * tracker.offset.y,
					);
					position.angle = targetPos.angle;
				}

				// save
				position.p = offset.add_(targetPos.p).add_(tracker.internalOffset);
			}
		}
	}
}
