/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/events.ts" />
/// <reference path="../component/collision-shape.ts" />
/// <reference path="../component/zone.ts" />

namespace System {

	export class CollisionZone extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.CollisionShape.name,
			Component.Zone.name,
		])

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			for (let [entity, aspect] of entities.entries()) {
				let cShape = aspect.get(Component.CollisionShape);
				let zone = aspect.get(Component.Zone);

				// if the zone is inactive, we don't check presence or signal
				// events.
				if (!zone.active) {
					continue;
				}

				// Handle players and other stuff in zone.
				let playerFound = false;
				for (let collider of cShape.collisionsFresh.keys()) {
					let colliderComps = this.ecs.getComponents(collider);
					if (colliderComps.has(Component.PlayerInput)) {
						playerFound = true;
						break;
					}
				}

				// Compute the new player in zone state, and signal an event if
				// the state has changed.
				if (zone.containsPlayer != playerFound) {
					let eName = Events.EventTypes.ZoneTransition;
					let eArgs: Events.ZoneTransitionArgs = {
						enter: playerFound,
						zone: entity,
					}
					this.eventsManager.dispatch({name: eName, args: eArgs});
				}

				// always set latest player in zone state
				zone.containsPlayer = playerFound;
			}
		}
	}
}
