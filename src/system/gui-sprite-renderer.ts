/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/animation.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/gui-sprite.ts" />
/// <reference path="../component/tweenable.ts" />


namespace System {

	class GUISpriteRendererAspect extends Engine.Aspect {
		dobj: Stage.Animation
		origScale: number = 1
	}

	export class GUISpriteRenderer extends Engine.System {

		private cachePos = new Point()

		public componentsRequired = new Set<string>([
			Component.Position.name,
			Component.GUISprite.name,
		])

		constructor(
			private stage: Stage.MainStage,
			private gameScale: number,
			private translator: Stage.Translator,
		) {
			super();
		}

		@override
		public makeAspect(): GUISpriteRendererAspect{
			return new GUISpriteRendererAspect();
		}

		private applyScale(aspect: GUISpriteRendererAspect): void {
			let pos = aspect.get(Component.Position);
			let gs = aspect.get(Component.GUISprite);

			// scale pos
			this.cachePos.copyFrom_(pos.p).scale_(this.gameScale);
			// if the obj is in the world coordinate system, figure out the
			// world coordinates that correspond to the desired HUD coordinates
			if (gs.displayData.stageTarget === StageTarget.World) {
				this.translator.HUDtoWorld(this.cachePos);
			}
			aspect.dobj.position.set(this.cachePos.x, this.cachePos.y);
			aspect.dobj.rotation = angleFlip(pos.angle);

			// fallback scale used when width or height not defined as an
			// override
			let sScale = aspect.origScale * this.gameScale;

			// scale width
			if (gs.baseData.width != null) {
				aspect.dobj.width = gs.baseData.width * this.gameScale;
			} else {
				aspect.dobj.scale.x = sScale;
			}

			// scale height
			if (gs.baseData.height != null) {
				aspect.dobj.height = gs.baseData.height * this.gameScale;
			} else {
				aspect.dobj.scale.y = sScale;
			}
		}

		@override
		public onAdd(aspect: GUISpriteRendererAspect): void {
			// Get component(s).
			let guiSprite = aspect.get(Component.GUISprite);

			// Create resources, save to aspect.
			aspect.dobj = Stage.Animation.build(guiSprite.baseData, guiSprite.displayData);
			aspect.origScale = guiSprite.baseData.scale;

			// Apply game scale-aware changes.
			this.applyScale(aspect);

			// Bookkeep thing to tween ground truth if applicable.

			// NOTE: this seem kind of gross, and there's now an ordered dependence between when the
			// different components are made (tweenable must come first). Can we resolve this with a
			// better design (e.g., not the "groundTruth" on Component.Tweenable?)
			if (aspect.has(Component.Tweenable)) {
				let tweenable = aspect.get(Component.Tweenable);
				tweenable.groundTruth.alpha = aspect.dobj.alpha;
			}

			// Send aspect to stage.
			this.stage.add(aspect.dobj);
		}

		@override
		public onRemove(aspect: GUISpriteRendererAspect): void {
			this.stage.remove(aspect.dobj);
		}

		public update(delta: number, entities: Map<Engine.Entity, GUISpriteRendererAspect>): void {
			for (let aspect of entities.values()) {
				// Copy in latest settings.

				// Game scale-aware mutations.
				this.applyScale(aspect);

				// If this is tweenable, read settings from it.
				if (aspect.has(Component.Tweenable)) {
					let tweenable = aspect.get(Component.Tweenable);
					// TODO: this more fully.
					aspect.dobj.alpha = tweenable.groundTruth.alpha;
				}

				// update the animation always
				aspect.dobj.update(delta);
			}
		}
	}
}
