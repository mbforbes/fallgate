/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/fx.ts" />

namespace System {

	export class FxAnimations extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Dummy.name,
		])

		private emitters = new Map<string, FX.Emitter>()

		constructor(private factory: GameMap.GameMap, private fxConfigs: Map<string, FX.Config>) {
			super();
		}

		public init(): void {
			// create all emitters --- only done here because ecs not defined
			// in constructor
			for (let [name, config] of this.fxConfigs.entries()) {
				this.emitters.set(name, new FX.Emitter(
					this.ecs, this.factory, config.factory, config.duration, config.pool
				))
			}
		}

		@override
		public onClear(): void {
			for (let emitter of this.emitters.values()) {
				emitter.refillPools();
			}
		}

		/**
		 * API to request animatable effects to be emitted.
		 *
		 * @param fxName Name of the fx (i.e., key in fx.json). Note that this
		 * is NOT necessarily the name of the object in the factory.json.
		 * @param x
		 * @param y
		 * @param direction optional number in [0, 2pi]; if null, picks
		 * randomly
		 */
		public emit(fxName: string, x: number, y: number, direction: number = null): void {
			// It may seem weird that we're doing this right upon request
			// instead of waiting until our update, but nowthing will be shown
			// until the animation system updates as well. If we want this to
			// be even more synchronous, can buffer emit requests here OR in
			// the FX.Emitter.
			if (!this.emitters.has(fxName)) {
				throw new Error('Requested invalid fx name: "' + fxName + '".');
			}

			this.emitters.get(fxName).emit(x, y, direction);
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			for (let emitter of this.emitters.values()) {
				emitter.update(delta);
			}
		}

	}

}
