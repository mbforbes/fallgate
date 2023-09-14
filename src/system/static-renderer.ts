/// <reference path="../../lib/pixi.js.d.ts" />

/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/stage.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/static-renderable.ts" />

namespace System {

	class StaticRendererAspect extends Engine.Aspect {
		dobj: Stage.DisplayObject
	}

	/**
	 * StaticRenderer assumes objects never change (positions, z-levels,
	 * anything). This makes it fast to have lots of them as they don't burn
	 * any cycles on update.
	 */
	export class StaticRenderer extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Position.name,
			Component.StaticRenderable.name,
		])

		constructor(private stage: Stage.MainStage) {
			super();
		}

		@override
		public makeAspect(): StaticRendererAspect {
			return new StaticRendererAspect();
		}

		@override
		public onAdd(aspect: StaticRendererAspect): void {
			// Get component(s)
			let renderable = aspect.get(Component.StaticRenderable);
			let position = aspect.get(Component.Position);

			// Create resources. Save to aspect.
			let sprite = new Stage.Sprite(
				PIXI.Texture.fromFrame(renderable.img),
				renderable.z,
				renderable.stageTarget);
			if (!renderable.manualDims.equalsCoords(0, 0)) {
				sprite.width = renderable.manualDims.x;
				sprite.height = renderable.manualDims.y;
			}
			sprite.anchor.set(renderable.anchor.x, renderable.anchor.y);
			sprite.position.set(position.p.x, position.p.y);
			sprite.rotation = angleFlip(position.angle);
			aspect.dobj = sprite;

			// Save aspect state to outer renderer.
			this.stage.add(aspect.dobj);
		}

		@override
		public onRemove(aspect: StaticRendererAspect): void {
			this.stage.remove(aspect.dobj);
		}

		public update(delta: number, entities: Map<Engine.Entity, StaticRendererAspect>): void {
			// Optimizing for fast unchanging objects, this doesn't do anything
			// in update!
		}
	}
}
