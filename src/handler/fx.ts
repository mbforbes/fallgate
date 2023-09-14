
/// <reference path="../engine/events.ts" />
/// <reference path="../component/attributes.ts" />
/// <reference path="../system/fx-animations.ts" />

namespace Handler {

	/**
	 * Spawns animation events.
	*/
	export class FX extends Events.Handler {

		dispatcher = new Map<Events.EventType, (EventType, any) => void>([
			[Events.EventTypes.Damage, this.hit],
			[Events.EventTypes.ThingDead, this.death],
			[Events.EventTypes.Bleed, this.bleed],
		])

		constructor(private fxAnimations: System.FxAnimations) {
			super();
		}

		private bleed(et: Events.EventType, args: Events.BleedArgs): void {
			for (let fx of args.fx) {
				this.fxAnimations.emit(fx, args.location.x, args.location.y);
			}
		}

		//
		// TODO: refactor the below
		//

		private hit(et: Events.EventType, args: Events.DamageArgs): void {
			// find if any hit effects were requested
			let comps = this.ecs.getComponents(args.victim);
			if (!comps.has(Component.Attributes)) {
				// console.log('no attribute components. creature: ' + args.victimType);
				return;
			}
			let attributes = comps.get(Component.Attributes);

			// play any hits animation FX found
			if (attributes.data.hitFX == null) {
				return;
			}
			for (let fx of attributes.data.hitFX) {
				let direction = null;
				if (fx.face != null && fx.face) {
					direction = args.angleAtoV;
				}
				this.fxAnimations.emit(fx.fxName, args.location.x, args.location.y, direction);
			}
		}

		private death(et: Events.EventType, args: Events.ThingDeadArgs): void {
			// find if any death effects were requested
			let comps = this.ecs.getComponents(args.thing);
			if (!comps.has(Component.Attributes)) {
				// console.log('no attribute components. thing type: ' + args.thingType);
				return;
			}
			let attributes = comps.get(Component.Attributes);

			// play any death animation FX found
			if (attributes.data.deathFX == null) {
				return;
			}
			for (let fx of attributes.data.deathFX) {
				this.fxAnimations.emit(fx, args.location.x, args.location.y);
			}
		}
	}
}
