/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/collision-shape.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/input.ts" />

namespace System {

	export class CollisionMovement extends Engine.System {

		// Note that we only run collision resolution on entities with Input
		// Components because those without aren't going anywhere.
		public componentsRequired = new Set<string>([
			Component.Position.name,
			Component.CollisionShape.name,
			Component.Input.name,
		])

		private leastCollidingAxis(
			p1: Component.Position,
			input: Component.Input,
			cInfo: Physics.CollisionInfo,
		): void {
			// turn the axis (a normal) into a vector pointing in the required direction.
			let v = new Point(cInfo.axis.x, cInfo.axis.y);

			// scale by the amount
			v.scale_(-cInfo.amount)

			// move
			p1.p = p1.p.add_(v);

			// new: trying input shit

			// TODO: can we check whether we're *inside* a box and push out if
			// so? right now this force keeps you stuck insdie a collision box
			// if you get pushed into one
			// input.collisionForce.copyFrom_(cInfo.axis).scale_(-20*cInfo.amount);
		}

		/**
		 *
		 * @param position
		 * @param box
		 * @returns whether it collided with a non-mobile solid objects
		 */
		private resolveCollisions(
			position: Component.Position,
			input: Component.Input,
			box: Component.CollisionShape,
		): boolean {
			let hitSolidStationary = false;
			for (let [colliderEntity, cInfo] of box.collisionsFresh.entries()) {
				let colliderComps = this.ecs.getComponents(colliderEntity);
				let colliderBox = colliderComps.get(Component.CollisionShape);
				if (!colliderBox.cTypes.has(CollisionType.Solid)) {
					continue;
				}

				// old: AABB collision resolution
				// this.leastCollidingAABBAxis(position, box, colliderComps.get(Component.Position), colliderBox);

				// new: SAT collision resolution
				this.leastCollidingAxis(position, input, cInfo);

				if (!colliderBox.cTypes.has(CollisionType.Mobile)) {
					hitSolidStationary = true;
				}
			}
			return hitSolidStationary;
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			for (let aspect of entities.values()) {
				let position = aspect.get(Component.Position);
				let input = aspect.get(Component.Input);
				let cShape = aspect.get(Component.CollisionShape);

				// resolve collisions. NOTE: order here probably matters for
				// good behavior (i.e. who pushes who.)

				if (cShape.cTypes.has(CollisionType.Mobile) && cShape.cTypes.has(CollisionType.Solid) &&
						cShape.collisionsFresh.size > 0) {
					// resolve collisions itself
					let hitSolidStationary = this.resolveCollisions(position, input, cShape);

					// bounce if hit something solid+stationary and dead
					if (
						hitSolidStationary &&
						aspect.has(Component.Dead)
					) {
						let input = aspect.get(Component.Input);
						input.bounce = true;
					}
				}
			}
		}
	}
}
