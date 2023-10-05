/// <reference path="../../lib/pixi-particles.d.ts" />

/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/particles.ts" />
/// <reference path="../graphics/animation.ts" />

namespace System {

	/**
	 * In case we want more per-emitter config.
	 */
	type ParticlePkg = {
		emitter: PIXI.particles.Emitter,
	}

	export class ParticleRenderer extends Engine.System {

		private emitters = new Map<string, ParticlePkg>()

		public componentsRequired = new Set<string>([
			Component.Dummy.name,
		])

		constructor(
			stage: Stage.ZStage,
			particleConfig: Graphics.ParticlesConfig,
			particleConfigJSONS: Map<string, any>,
		) {
			super();

			// mutate json configs as needed
			this.mutateConfigs(particleConfigJSONS);

			// build all emitters
			for (let emitterID in particleConfig) {
				let config = particleConfig[emitterID];

				// build textures
				let textures: PIXI.Texture[] = [];
				for (let texture of config.textures) {
					textures.push(...Stage.Animation.loadTextures(texture.base, texture.frames));
				}

				// build emitter. how we do it changes based on whether it's an animated particle.
				let emitter: PIXI.particles.Emitter;
				if (config.anim != null) {
					// animated particle
					emitter = new PIXI.particles.Emitter(
						stage,
						{
						    //@ts-ignore
							framerate: config.anim.framerate,
							loop: true,
							textures: textures,
						},
						clone(particleConfigJSONS.get(config.config)),
					);
					emitter.particleConstructor = PIXI.particles.AnimatedParticle;
				} else {
					// non-animated particle
					emitter = new PIXI.particles.Emitter(
						stage,
						textures,
						clone(particleConfigJSONS.get(config.config)),
					);
				}

				// save
				this.emitters.set(emitterID, {
					emitter: emitter,
				});
			}
		}

		/**
		 * Returns whether emitterID known.
		 */
		private check(emitterID: string): boolean {
			if (!this.emitters.has(emitterID)) {
				console.error('Unknown emitterID: "' + emitterID + '"');
				console.error('Known emitters: ' + mapKeyString(this.emitters));
				return false;
			}
			return true;
		}

		/**
		 * Disables everything not in emitterIDs; enables everything in
		 * emitterIDs.
		 */
		public enableOnly(emitterIDs: string[]): void {
			let eids = new Set(emitterIDs);

			// loop over everything we know of, disable if not in eids, enable
			// if it is.
			for (let id of this.emitters.keys()) {
				if (eids.has(id)) {
					this.enable(id);
				} else {
					this.disable(id, true);
				}
			}
		}

		/**
		 * How to enable an emitter. (no-op if already enabled.)
		 */
		public enable(emitterID: string): void {
			// sanity check
			if (!this.check(emitterID)) {
				return;
			}

			let pkg = this.emitters.get(emitterID);
			if (pkg.emitter.emit) {
				// console.warn('Emitter "' + emitterID + '" is already enabled');
				return;
			}

			pkg.emitter.emit = true;
		}

		public disable(emitterID: string, cleanup: boolean = false): void {
			// sanity check
			if (!this.check(emitterID)) {
				return;
			}

			let pkg = this.emitters.get(emitterID);
			pkg.emitter.emit = false;
			if (cleanup) {
				pkg.emitter.cleanup();
			}
		}

		private mutateConfigs(particleConfigJSONS: Map<string, any>): void {
			for (let json of particleConfigJSONS.values()) {
				// first, sanity checks / overrides for our game engine
				json.emit = false;
				json.autoUpdate = false;
			}
		}

		// once we have some on/off logic running (right not onClear called
		// before first scene so turns all off immediately)

		// @override
		// public onClear(): void {
		// 	// disable + cleanup all
		// 	for (let eid of this.emitters.keys()) {
		// 		this.disable(eid, true);
		// 	}
		// }

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			// get player pos
			let playerPos = null;
			let player = this.ecs.getSystem(PlayerSelector).latest().next().value;
			if (player != null) {
				playerPos = this.ecs.getComponents(player).get(Component.Position).p;
			}

			for (let pkg of this.emitters.values()) {
				pkg.emitter.update(delta * 0.001);
				if (playerPos != null) {
					pkg.emitter.spawnPos.set(playerPos.x, playerPos.y);
				}
			}
		}

	}
}
