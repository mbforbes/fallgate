namespace Handler {

	/**
	 * TODO: maybe pull various settings out into a config file or something.
	 */
	export class SlowMotion extends Events.Handler {

		// used as factor when we want basically infinite slowdown = no time
		// passes
		static PAUSE = 10000

		dispatcher = new Map<Events.EventType, (EventType, any) => void>([
			[Events.EventTypes.ThingDead, this.thingDeadMaybeSlowdown],
			[Events.EventTypes.EnemyStaggerPre, this.enemyStaggerSlowdown],
		])

		enemyStaggerSlowdown(et: Events.EventType, args: Events.EnemyStaggerPreArgs): void {
			// slowmotion (pause) first
			if (args.heavyEffects) {
				this.ecs.slowMotion.request(SlowMotion.PAUSE, 250);
			}

			// fire for rest of effects
			let nextArgs: Events.EnemyStaggerArgs = args;
			this.firer.dispatch({name: Events.EventTypes.EnemyStagger, args: args}, 1);
		}

		thingDeadMaybeSlowdown(et: Events.EventType, args: Events.ThingDeadArgs): void {
			// (feature currently disabled)

			// only slowdown when *enemies* dead (not random crap like crates)
			// if (args.thingType !== Ontology.Thing.Enemy) {
			// 	return;
			// }
			// this.ecs.slowMotion.request(SlowMotion.PAUSE, 0);
		}
	}
}
