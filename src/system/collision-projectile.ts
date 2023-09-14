/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/collision-shape.ts" />

namespace System {

	/**
	 * Checking projectiles colliding with walls.
	 */
	export class CollisionProjectile extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.CollisionShape.name,
			Component.Attack.name,
			Component.Input.name,
		])

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			for (let [entity, aspect] of entities.entries()) {
				// get projectile collision boxes
				let cShape = aspect.get(Component.CollisionShape);
				if (!cShape.cTypes.has(CollisionType.Projectile)) {
					continue;
				}

				// see whether they hit a wall
				let hitWall = false;
				for (let collider of cShape.collisionsFresh.keys()) {
					let colliderComps = this.ecs.getComponents(collider);
					// sanity check collider has a collision box
					if (!colliderComps.has(Component.CollisionShape)) {
						continue;
					}
					let colliderCShape = colliderComps.get(Component.CollisionShape);
					if (colliderCShape.cTypes.has(CollisionType.Wall)) {
						hitWall = true;
						break;
					}
				}
				if (!hitWall) {
					continue;
				}

				// omg we hit a wall. stop it, and make its damage 0 (so the
				// attack still makes it get removed).
				this.ecs.removeComponentIfExists(entity, Component.Input);
				let atk = aspect.get(Component.Attack)
				atk.info.damage = 0;

				// ... and play hit sounds!
				if (atk.info.sounds != null && atk.info.sounds.hit != null) {
					this.ecs.getSystem(Audio).play(
						atk.info.sounds.hit,
						aspect.get(Component.Position).p,
					)
				}
			}
		}
	}
}
