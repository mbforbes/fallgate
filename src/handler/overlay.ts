namespace Handler {

	export class Overlay extends Events.Handler {

		dispatcher = new Map<Events.EventType, (EventType, any) => void>([
			[Events.EventTypes.EnemyStagger, this.flashWhite],
			[Events.EventTypes.Damage, this.bloodScreen],
		])

		bloodScreen(et: Events.EventType, args: Events.DamageArgs): void {
			// player only
			if (args.victimType !== Ontology.Thing.Player) {
				return;
			}

			this.ecs.getSystem(System.GUIManager).runSequence('hit');
		}

		flashWhite(et: Events.EventType, args: Events.EnemyStaggerArgs): void {
			if (!args.heavyEffects) {
				return;
			}
			this.ecs.getSystem(System.GUIManager).runSequence('combo');
		}

	}
}
