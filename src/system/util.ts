/// <reference path="../core/base.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/ontology.ts" />

namespace System {

	/**
	 * System-level utility functions.
	 */
	export class Util {

		/**
		 * Adds or extends `c` (some Timebomb subclass) to `aspect` to last for
		 * `duration` from now.
		 *
		 * @param ecs
		 * @param aspect
		 * @param c should be a subclass of Timebomb, but I think Typescript is
		 * confused, so using 'any'
		 * @param duration
		 */
		public static addOrExtend(ecs: Engine.ECS, entity: Engine.Entity, c: any, duration: number) {
			let comps = ecs.getComponents(entity);
			if (comps.has(c)) {
				let existing = comps.get<Component.Timebomb>(c);
				existing.startTime = ecs.gametime;
				existing.duration = duration;
			} else {
				ecs.addComponent(entity, new c(duration));
			}
		}

		/**
		 * Gets the broad class of thing this entity is.
		 * @param ecs
		 * @param entity
		 */
		public static getThing(ecs: Engine.ECS, entity: Engine.Entity): Ontology.Thing {
			let comps = ecs.getComponents(entity);
			if (comps.has(Component.PlayerInput)) {
				return Ontology.Thing.Player;
			}
			if (comps.has(Component.Enemy)) {
				return Ontology.Thing.Enemy;
			}
			if (comps.has(Component.Item)) {
				return Ontology.Thing.Item;
			}
			if (comps.has(Component.Destructible)) {
				return Ontology.Thing.Destructible;
			}
			return Ontology.Thing.UNSPECIFIED;
		}

		/**
		 * Returns angle from `a` to `b`, or 0 if either doesn't have the
		 * necessary components (position).
		 * @param ecs
		 * @param a
		 * @param b
		 */
		public static angleAtoB(ecs: Engine.ECS, a: Engine.Entity, b: Engine.Entity): number {
			let aComps = ecs.getComponents(a);
			let bComps = ecs.getComponents(b);

			if (aComps == null || bComps == null || (!aComps.has(Component.Position)) || (!bComps.has(Component.Position))) {
				return 0;
			}

			let aPos = aComps.get(Component.Position);
			let bPos = bComps.get(Component.Position);
			return angleClamp(aPos.p.pixiAngleTo(bPos.p));
		}

		public static logEntityLayerCounts(entities: Map<Engine.Entity, Engine.Aspect>): void {
			Util.logDirtyLayerCounts(entities, entities.keys());
		}

		public static logDirtyLayerCounts(entities: Map<Engine.Entity, Engine.Aspect>, dirty: IterableIterator<Engine.Entity>): void {
			// NOTE: consider lodash map w/ Counter.from(...)
			let c = new Counter<string>();
			for (let e of dirty) {
				let aspect = entities.get(e);
				let val: string;
				if (aspect.has(Component.DebugKVLayer)) {
					val = aspect.get(Component.DebugKVLayer).layer;
				} else {
					val = 'unknown'
				}
				c.increment(val);
			}
			// NOTE: consider adding sorting to counter + even graphic
			// representation.
			for (let [k, v] of c.entries()) {
				console.log(k + ': ' + v);
			}
		}
	}
}
