namespace Handler {

	/**
	 * Sending events to the bookkeeeper.
	 */
	export class Bookkeeping extends Events.Handler {

		dispatcher = new Map<Events.EventType, (EventType, any) => void>([
			[Events.EventTypes.ThingDead, this.thingDead],
			[Events.EventTypes.GameplayStart, this.startLevel],
		])

		thingDead(et: Events.EventType, args: Events.ThingDeadArgs): void {
			let bookkeeper = this.ecs.getSystem(System.Bookkeeper);
			switch (args.thingType) {
				case Ontology.Thing.Enemy:
					bookkeeper.enemyKilled();
					break;
				case Ontology.Thing.Destructible:
					bookkeeper.destructibleSmashed();
					break;
				case Ontology.Thing.Player:
					bookkeeper.playerDied();
					break;
			}
		}

		startLevel(et: Events.EventType, args: Events.GameplayStartArgs): void {
			this.ecs.getSystem(System.Bookkeeper).startLevel();
		}

		// NOTE: ending the level had a race condition with other functions
		// waiting on the same event. we just compute the end level time there
		// :-)
	}
}
