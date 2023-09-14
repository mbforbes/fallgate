/// <reference path="../core/lang.ts" />
/// <reference path="../core/util.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/constants.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/collision-shape.ts" />

namespace System {

	// Helper classes and functions that will be used by the collision detection
	// system.
	// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-



	/**
	 * Manages a list of collision boxes (`implementers`) that all match some
	 * criteria (`required`).
	 */
	class CollisionSet {
		implementers = new Set<Engine.Entity>()

		constructor(public required: Set<CollisionType>) {}
	}

	/**
	 * Collides left and right.
	 */
	class Collider {
		// Really only need one of these because single-threaded, but this is
		// simplest for now.
		private sat = new Physics.SAT(4)
		private cacheCol = new Physics.CollisionInfo()
		private cacheC1 = new Point()
		private cacheC2 = new Point()
		private spatialHash: SpatialHash

		constructor(private ecs: Engine.ECS, public debugName, public left: CollisionSet, public right: CollisionSet) {
			this.spatialHash = ecs.getSystem(SpatialHash);
		}

		private getCandidates(l: Engine.Entity, p1: Component.Position, b1: Component.CollisionShape): Set<Engine.Entity> {
			let res = new Set<Engine.Entity>();
			for (let cell of p1.cells) {
				for (let r of this.spatialHash.grid.get(cell).values()) {
					// no self collide and must be in correct set.
					if (l != r && this.right.implementers.has(r)) {
						res.add(r);
					}
				}
			}
			return res;
		}

		/**
		 * Appends to allColliders and returns [nCheap, nExpensive] collision
		 * checks
		 */
		update(allColliders: Component.CollisionShape[]): [number, number] {
			let cheapCollisionChecks = 0;
			let expensiveCollisionChecks = 0;

			for (let l of this.left.implementers) {

				let c1 = this.ecs.getComponents(l);
				let p1 = c1.get(Component.Position);
				let s1 = c1.get(Component.CollisionShape);

				// Don't bother checking if left is disabled.
				if (s1.disabled) {
					continue;
				}

				for (let r of this.getCandidates(l, p1, s1)) {

					let c2 = this.ecs.getComponents(r);
					let p2 = c2.get(Component.Position);
					let s2 = c2.get(Component.CollisionShape);

					// Don't bother checking if right is disabled.
					if (s2.disabled) {
						continue;
					}

					// Try cheaper collision method first.
					cheapCollisionChecks++;

					// cacheC1 and cacheC2 become the center points of each of
					// the shapes.
					this.cacheC1.copyFrom_(p1.p).add_(s1.offset);
					this.cacheC2.copyFrom_(p2.p).add_(s2.offset);
					// a   > b + c
					// a^2 > (b + c)^2
					// a^2 > b^2 + c^2 + 2bc
					if (this.cacheC1.sqDistTo(this.cacheC2) > s1.sqMaxDistance + s2.sqMaxDistance + 2*s1.maxDistance*s2.maxDistance) {
						continue;
					}

					expensiveCollisionChecks++;

					// Could pre-check if collision already resolved here, but
					// it's probably actually cheaper to check collisions first
					// because most things *won't* be colliding.

					// SAT
					let v1 = s1.getVertices(p1.p, p1.angle);
					let a1 = s1.getAxes(p1.p, p1.angle);
					let v2 = s2.getVertices(p2.p, p2.angle);
					let a2 = s2.getAxes(p2.p, p2.angle);
					if (!this.sat.collides(v1, a1, v2, a2, this.cacheCol)) {
						continue;
					}

					// Don't add if collision already resolved by at least one
					// of the entities.
					if (s1.collisionsResolved.has(r) || s2.collisionsResolved.has(l)) {
						continue;
					}

					// Collliiiiidddeeee.
					s1.collisionsFresh.set(r, this.cacheCol.copy());
					s2.collisionsFresh.set(l, this.cacheCol.copy().rev());
					allColliders.push(s1, s2);
				}
			}

			return [cheapCollisionChecks, expensiveCollisionChecks];
		}
	}


	// Bookkeeping setup here
	// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

	export class CollisionDetection extends Engine.System {

		private prevColliders: Component.CollisionShape[] = []

		public componentsRequired = new Set<string>([
			Component.Position.name,
			Component.CollisionShape.name,
		])

		constructor(private cheapPanel: Stats.Panel, private expensivePanel: Stats.Panel) {
			super();
		}

		private colliders: Collider[] = []

		@override
		init(): void {
			// NOTE: Even with cleanup, the below thing are redundant! The
			// player will be checked many times for hitting other stuff. Due
			// to the new spatial hashing, we now only care about the number of
			// "left-hand-side" things we check, but we'll spatially retrieve
			// everything on the right hand side and check all of it (at least
			// a boolean check). Due to this, we might want to consider some
			// scheme like:
			// - (1) check all mobile stuff against other things. To figure out
			//   whether a mobile thing can collide with another thing:
			// - (2) check a set of rules (akin to the subset matching below)
			//   (could also do "excludes")
			// - (3) once any rule passes (it could for multiple reasons), run
			//   the expensive collision checks
			//
			// as it stands, players and projectiles are going to spatially
			// grab stuff around them and iterate over the same set of things
			// SEVERAL TIMES.

			// running into things
			this.colliders.push(new Collider(this.ecs, 'mobile+solid / solid',
				new CollisionSet(new Set([CollisionType.Mobile, CollisionType.Solid])),
				new CollisionSet(new Set([CollisionType.Solid]))));

			// attacks that move (i.e., not bramble) hitting stuff (players, enemies, destructibles, ...)
			this.colliders.push(new Collider(this.ecs, 'mobile+attack / vulnerable',
				new CollisionSet(new Set([CollisionType.Mobile, CollisionType.Attack])),
				new CollisionSet(new Set([CollisionType.Vulnerable]))));

			// mobile things (e.g., player, enemies) running into attacks (e.g., bramble)
			this.colliders.push(new Collider(this.ecs, 'mobile+vulnerable / attack+environment',
				new CollisionSet(new Set([CollisionType.Mobile, CollisionType.Vulnerable])),
				new CollisionSet(new Set([CollisionType.Attack, CollisionType.Environment]))));

			// blocking (may need to refine if we need 'player' tag for this as
			// well)
			this.colliders.push(new Collider(this.ecs, 'shield / attack',
				new CollisionSet(new Set([CollisionType.Shield])),
				new CollisionSet(new Set([CollisionType.Attack]))));

			// player or enemies (may want destructables eventually?) going
			// into game logic areas
			this.colliders.push(new Collider(this.ecs, 'player / logic',
				new CollisionSet(new Set([CollisionType.Mobile, CollisionType.Solid])),
				new CollisionSet(new Set([CollisionType.Logic]))));

			// item pickups!
			this.colliders.push(new Collider(this.ecs, 'player / item',
				new CollisionSet(new Set([CollisionType.Player, CollisionType.Solid])),
				new CollisionSet(new Set([CollisionType.Item]))));

			// players or enemies going into physics regions
			this.colliders.push(new Collider(this.ecs, 'physics / mobile',
				new CollisionSet(new Set([CollisionType.Physics])),
				new CollisionSet(new Set([CollisionType.Mobile])),
			));

			// projectiles hitting stuff that stops them
			this.colliders.push(new Collider(this.ecs, 'projectile / wall',
				new CollisionSet(new Set([CollisionType.Projectile])),
				new CollisionSet(new Set([CollisionType.Wall]))));
		}

		@override
		onAdd(aspect: Engine.Aspect): void {
			let box = aspect.get(Component.CollisionShape);

			for (let collider of this.colliders) {
				for (let cSet of [collider.left, collider.right]) {
					if (setContains(box.cTypes, cSet.required)) {
						cSet.implementers.add(aspect.entity)
					}
				}
			}
		}

		@override
		onRemove(aspect: Engine.Aspect): void {
			for (let collider of this.colliders) {
				for (let cSet of [collider.left, collider.right]) {
					if (cSet.implementers.has(aspect.entity)) {
						cSet.implementers.delete(aspect.entity)
					}
				}
			}
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>, dirty: Set<Engine.Entity>, clockTower: Measurement.ClockTower): void {
			// clear all "fresh" collisions
			while (this.prevColliders.length > 0) {
				this.prevColliders.pop().collisionsFresh.clear();
			}

			// Now use our own internal bookkeeping to run collision detection
			// between subsets as needed.
			let expensiveCollisionChecks = 0;
			let cheapCollisionChecks = 0;
			for (let collider of this.colliders) {
				clockTower.start(Measurement.T_COLL_COLLIDERS, collider.debugName);
				let [c, e] = collider.update(this.prevColliders);
				cheapCollisionChecks += c;
				expensiveCollisionChecks += e;
				clockTower.end(Measurement.T_COLL_COLLIDERS, collider.debugName);
			}

			// // re-enable when need to check stuff
			// if (this.cheapPanel !== null) {
			// 	this.cheapPanel.update(cheapCollisionChecks, 8000);
			// }
			// if (this.expensivePanel !== null) {
			// 	this.expensivePanel.update(expensiveCollisionChecks, 300);
			// }
		}
	}
}
