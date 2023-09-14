/// <reference path="../../lib/pixi.js.d.ts" />

/// <reference path="../core/lang.ts" />
/// <reference path="../core/tween.ts" />
/// <reference path="../core/util.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/text-renderable.ts" />
/// <reference path="../component/tweenable.ts" />


namespace System {

	class TextRendererAspect extends Engine.Aspect {
		dobj: Stage.GameText
	}

	export class TextRenderer extends Engine.System {

		private cachePos = new Point()

		public componentsRequired = new Set<string>([
			Component.Position.name,
			Component.TextRenderable.name,
		])

		constructor(
				private stage: Stage.MainStage,
				private gameScale: number,
				private translator: Stage.Translator,
		) {
			super();
		}

		@override
		public makeAspect(): TextRendererAspect {
			return new TextRendererAspect();
		}

		/**
		 * Applies scale to positions and sizes of the aspect. The "raw" data
		 * is held in components (Position, TextRenderable, ...) and the
		 * upscaled values will be held in the actual display object.
		 */
		private applyScale(aspect: TextRendererAspect): void {
			let pos = aspect.get(Component.Position);
			let tr = aspect.get(Component.TextRenderable);

			// scale pos
			this.cachePos.copyFrom_(pos.p).scale_(this.gameScale);
			// if the obj is in the world coordinate system, figure out the
			// world coordinates that correspond to the desired HUD coordinates
			if (tr.displayData.stageTarget === StageTarget.World) {
				this.translator.HUDtoWorld(this.cachePos);
			}
			aspect.dobj.position.set(this.cachePos.x, this.cachePos.y);
			aspect.dobj.rotation = angleFlip(pos.angle);

			// style
			let textRenderable = aspect.get(Component.TextRenderable);
			let base = textRenderable.textData.style;
			let target = aspect.dobj.style;
			let props = ['fontSize', 'dropShadowDistance'];
			for (let prop of props) {
				if (base[prop] != null && (typeof base[prop] === 'number')) {
					target[prop] = base[prop] * this.gameScale;
				}
			}
		}

		@override
		public onAdd(aspect: TextRendererAspect): void {
			// Do conversion, create resources, save to aspect.
			let textRenderable = aspect.get(Component.TextRenderable);
			let gameText = new Stage.GameText(
				textRenderable.textData.text,
				textRenderable.textData.style,
				textRenderable.displayData.z,
				textRenderable.displayData.stageTarget
			);
			gameText.anchor.set(textRenderable.textData.anchor.x, textRenderable.textData.anchor.y);
			gameText.alpha = textRenderable.textData.alpha;
			aspect.dobj = gameText;

			// Game scale-aware mutations.
			this.applyScale(aspect);

			// Pre-bookkeep starting values. (NOTE: this, as in GUI Sprite, is gross b/c of the
			// ordering requirement w/ the Tweenable component).
			if (aspect.has(Component.Tweenable)) {
				let tweenable = aspect.get(Component.Tweenable);
				tweenable.groundTruth.alpha = textRenderable.textData.alpha;
				tweenable.groundTruth.color = parseInt((textRenderable.textData.style.fill as string).slice(1), 16);
			}

			// Send aspect display obj to outer renderer.
			this.stage.add(aspect.dobj);
		}

		@override
		public onRemove(aspect: TextRendererAspect): void {
			this.stage.remove(aspect.dobj);
		}

		public update(delta: number, entities: Map<Engine.Entity, TextRendererAspect>): void {
			for (let aspect of entities.values()) {
				// Copy in latest settings.

				// Game scale-aware mutations.
				this.applyScale(aspect);

				// If this is tweenable, read settings from it.
				if (aspect.has(Component.Tweenable)) {
					let tweenable = aspect.get(Component.Tweenable);
					// NOTE: consider eventually refactoring with GUI sprite
					// renderer.
					aspect.dobj.alpha = tweenable.groundTruth.alpha;
					aspect.dobj.style.fill = tweenable.groundTruth.color;
				}
			}
		}
	}
}
