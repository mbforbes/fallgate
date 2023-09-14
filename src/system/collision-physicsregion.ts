/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/physics.ts" />
/// <reference path="../component/collision-shape.ts" />
/// <reference path="../component/physics-region.ts" />

namespace System {
	export class CollisionPhysicsRegion extends Engine.System {
		public componentsRequired = new Set<string>([
			Component.CollisionShape.name,
			Component.PhysicsRegion.name,
		])

		/**
		 * RegionType.Slow
		 */
		private frictionMover(mover: Engine.Entity, scale: number): void {
			let moverComps = this.ecs.getComponents(mover);
			if (!moverComps.has(Component.Input)) {
				return;
			}
			let input = moverComps.get(Component.Input);
			if (input.movement.resistSlow) {
				return;
			}
			input.frictionQueue.push(scale);
		}

		private alterMover(mover: Engine.Entity, region: Physics.Region): void {
			// alter based on region type
			if (region.regionType === Physics.RegionType.Slow) {
				this.frictionMover(mover, region.scale);
			}
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			for (let aspect of entities.values()) {
				let cShape = aspect.get(Component.CollisionShape);
				let pr = aspect.get(Component.PhysicsRegion);

				for (let mover of cShape.collisionsFresh.keys()) {
					this.alterMover(mover, pr.region);
				}
			}
		}
	}
}
