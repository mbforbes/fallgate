 /// <reference path="../script/test.ts" />

namespace Handler {

	export class Death extends Events.Handler {

		dispatcher = new Map<Events.EventType, (EventType, any) => void>([
			[Events.EventTypes.ThingDead, this.thingDead],
		])

		constructor(private playerSelector: System.PlayerSelector,
					private spawnableSelector: System.SpawnableSelector) {
			super();
		}

		thingDead(et: Events.EventType, args: Events.ThingDeadArgs): void {
			// enemy death
			if (args.thingType === Ontology.Thing.Enemy) {
				this.scriptRunner.run(new Script.EnemyDeath(args.thing));
				return;
			}

			// player death
			if (args.thingType === Ontology.Thing.Player) {
				this.scriptRunner.run(new Script.PlayerDeath(this.playerSelector, this.spawnableSelector));
				return;
			}

			// "other" deaths
			this.scriptRunner.run(new Script.OtherDeath(args.thing));
		}
	}
}
