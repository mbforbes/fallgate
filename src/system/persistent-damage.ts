/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/persistent-damage.ts" />
/// <reference path="../component/attack.ts" />

namespace System {

	export class PersistentDamage extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Position.name,
			Component.PersistentDamage.name,
			Component.CollisionShape.name,
		])

		public dirtyComponents = new Set<string>([
			Component.CollisionShape.name,
		])

		@override
		public onAdd(aspect: Engine.Aspect): void {
			// we simply add an attack component onto this same object so it
			// *becomes* the attack as well (mind blown).
			let pd = aspect.get(Component.PersistentDamage);
			this.ecs.addComponent(aspect.entity, new Component.Attack(aspect.entity, pd.attackInfo));
		}

		/**
		 * Clear any resolved collisions of the collision box so that the
		 * attack can keep damaging stuff forever (in contrast to stuff like
		 * swords that don't get to damage things frame after frame).
		 */
		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>, dirty: Set<Engine.Entity>): void {
			for (let entity of dirty) {
				let aspect = entities.get(entity);
				aspect.get(Component.CollisionShape).collisionsResolved.clear();
			}
		}
	}
}
