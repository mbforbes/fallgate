/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/health.ts" />

namespace System {

	class DeathAspect extends Engine.Aspect {
		prevHealth: number = -1
	}

   /**
	* Detects death and triggers stuff..
	*/
	export class Death extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Health.name,
		])

		public dirtyComponents = new Set<string>([
			Component.Health.name,
		])

		@override
		public makeAspect(): DeathAspect {
			return new DeathAspect();
		}

		private die(aspect: DeathAspect): void {
			// pre extraction
			let thing = Util.getThing(this.ecs, aspect.entity);

			// add dead component so other systems can know about this.
			this.ecs.addComponent(aspect.entity, new Component.Dead());

			// do any death bleeding
			if (aspect.has(Component.Attributes)) {
				let attr = aspect.get(Component.Attributes);
				Bleeding.begin(this.ecs, aspect.entity, attr.data.deathBlood);
			}

			// NOTE: Legacy (exp) feature would go here: issue exp to
			// list of most recent (frame) attackers.

			// issue event
			let loc = new Point(-1, -1);
			if (aspect.has(Component.Position)) {
				loc.copyFrom_(aspect.get(Component.Position).p);
			}
			let eType: Events.EventType = Events.EventTypes.ThingDead;
			let eArgs: Events.ThingDeadArgs = {
				location: loc,
				thing: aspect.entity,
				thingType: thing,
			}
			this.eventsManager.dispatch({name: eType, args: eArgs})

			// special event if checkpoint. (may want to just always
			// issue dead event and have handlers pick).
			if (aspect.has(Component.Checkpoint)) {
				let eType: Events.EventType = Events.EventTypes.Checkpoint;
				let eArgs: Events.CheckpointArgs = {
					checkpoint: aspect.entity,
					location: loc,
				}
				this.eventsManager.dispatch({
					name: eType,
					args: eArgs,
				});
			}
		}

		public update(delta: number, entities: Map<Engine.Entity, DeathAspect>, dirty: Set<Engine.Entity>): void {
			for (let entity of dirty) {
				let aspect = entities.get(entity);
				let health = aspect.get(Component.Health);

				// detect death the first frame it happens and issue events.
				if ((aspect.prevHealth !== 0 && health.current === 0) ||
					(health.current === 0 && !aspect.has(Component.Dead))) {
					this.die(aspect);
				}

				// bookkeep
				aspect.prevHealth = health.current;
			}
		}
	}
}
