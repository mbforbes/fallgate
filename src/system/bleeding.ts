/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/dead.ts" />
/// <reference path="../component/bleeding.ts" />

namespace System {

	class DeathBloodAspect extends Engine.Aspect {
		public timeSinceLastEmission = 0
	}

	export class Bleeding extends Timebomb {

		tbComp = Component.Bleeding

		public componentsRequired = new Set<string>([
			Component.Bleeding.name,
			Component.Position.name,
		])

		/**
		 * API other systems can use to start something bleeding.
		 * @param blood
		 */
		public static begin(ecs: Engine.ECS, entity: Engine.Entity, blood?: Attributes.Blood): void {
			// may not have blood component
			if (blood == null) {
				return;
			}

			// may have existing blood component; in this case, mutate it.
			let comps = ecs.getComponents(entity);
			if (comps.has(Component.Bleeding)) {
				let bleeding = comps.get(Component.Bleeding);
				bleeding.startTime = ecs.gametime;
				bleeding.duration = blood.duration;
				bleeding.fx = clone(blood.fx);
				return;
			}

			// no existing blood component: spawn new one.
			ecs.addComponent(entity, new Component.Bleeding(blood));
		}

		@override
		public makeAspect(): DeathBloodAspect {
			return new DeathBloodAspect();
		}

		@override
		public update(delta: number, entities: Map<Engine.Entity, DeathBloodAspect>): void {
			// let timebomb bookkeep overall time stuff
			super.update(delta, entities);

			// then handle the blood particles separately
			for (let aspect of entities.values()) {
				let pos = aspect.get(Component.Position);
				let bleeding = aspect.get(Component.Bleeding);

				aspect.timeSinceLastEmission += delta;

				// emit if requisite period has passed
				if (aspect.timeSinceLastEmission >= bleeding.frequency) {
					let eName = Events.EventTypes.Bleed;
					let eArgs: Events.BleedArgs = {
						fx: bleeding.fx,
						location: pos.p.copy(),
					}
					this.eventsManager.dispatch({name: eName, args: eArgs});
					aspect.timeSinceLastEmission = 0;
				}
			}
		}
	}
}
