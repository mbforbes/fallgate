/// <reference path="../../lib/pixi.js.d.ts" />

/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/lighting.ts" />
/// <reference path="../component/lightbulb.ts" />

namespace System {

	class LightingAspect extends Engine.Aspect {
		dobjs: Stage.Sprite[] = []
	}

	/**
	 * Illuminates the game.
	 */
	export class Lighting extends Engine.System {

		// config: texture and scale to render each lightbulb size. note: could
		// also add anchoring config here if we end up using the cone.
		private sizeTextures = new Map<Graphics.LightbulbSize, [string, number]>([
			[Graphics.LightbulbSize.Small, ['fx/light128.png', 0.5]],
			[Graphics.LightbulbSize.Medium, ['fx/light256.png', 0.5]],
			[Graphics.LightbulbSize.Large, ['fx/light256.png', 1]],
		])

		public componentsRequired = new Set<string>([
			Component.Lightbulb.name,
			Component.Position.name,
		])

		constructor(
			private stage: Stage.MainStage,
			private translator: Stage.Translator,
			private lightingLayer: Stage.Layer,
			private gamescale: number,
		) {
			super();
		}

		@override
		public makeAspect(): LightingAspect {
			return new LightingAspect();
		}

		@override
		public onAdd(aspect: LightingAspect): void {
			// get lightbulb settings
			let lightbulb = aspect.get(Component.Lightbulb);


			// create resources and save to necessary layers.
			for (let config of lightbulb.configs) {
				let [tex, rawScale] = this.sizeTextures.get(config.size);
				let scale = rawScale * this.gamescale;
				let sprite = new Stage.Sprite(PIXI.Texture.fromFrame(tex), ZLevelHUD.Lighting, StageTarget.HUD);

				sprite.scale.set(scale, scale);
				sprite.tint = config.baseTint;
				sprite.anchor.set(0.5, 0.5);
				sprite.alpha = 0.9;

				sprite.parentLayer = this.lightingLayer;
				this.stage.add(sprite);
				aspect.dobjs.push(sprite);
			}

			// set positions correctly so they're right on the first frame
			this.updatePositions(aspect);
		}

		@override
		public onRemove(aspect: LightingAspect): void {
			for (let dobj of aspect.dobjs) {
				dobj.parentLayer = null;
				this.stage.remove(dobj);
			}
		}

		private updatePositions(aspect: LightingAspect): void {
			let pos = this.translator.worldToHUD(aspect.get(Component.Position).p);
			for (let dobj of aspect.dobjs) {
				dobj.position.set(pos.x, pos.y);
			}
		}

		private updateFlickers(aspect: LightingAspect): void {
			let configs = aspect.get(Component.Lightbulb).configs;
			for (let i = 0; i < configs.length; i++) {
				// flicker by +/- 0.1 every ~3 frames
				if (configs[i].flicker && Math.random() > 0.66) {
					let [_, baseScale] = this.sizeTextures.get(configs[i].size)
					let scale = baseScale + (Math.random() * 0.2 - 0.1);
					aspect.dobjs[i].scale.set(scale, scale);
				}
			}
		}

		public update(delta: number, entities: Map<Engine.Entity, LightingAspect>): void {
			for (let aspect of entities.values()) {
				this.updatePositions(aspect);
				this.updateFlickers(aspect);
			}
		}
	}
}
