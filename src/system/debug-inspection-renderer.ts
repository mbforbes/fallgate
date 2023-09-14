/// <reference path="../../lib/pixi.js.d.ts" />

/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/lockon.ts" />


namespace System {

	class DebugInspectionAspect extends Engine.Aspect {

		static ROTATE_DELTA: number = 0.2;
		static TINT: number = 0xff0000;

		public dobj = Stage.Sprite.build('HUD/target1.png',
			ZLevelWorld.DEBUG, StageTarget.World, new Point(),
			new Point(0.5, 0.5));


		constructor() {
			super();

			this.dobj.visible = true;
			this.dobj.tint = DebugInspectionAspect.TINT;
		}
	}

	/**
	 * Renders a graphic around entities with the Component.DebugInspection.
	 */
	export class DebugInspectionRenderer extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.DebugInspection.name,
			Component.Position.name,
		])

		constructor(private stage: Stage.MainStage) {
			super(true, true);
		}

		@override
		public makeAspect(): DebugInspectionAspect {
			return new DebugInspectionAspect();
		}

		@override
		public onAdd(aspect: DebugInspectionAspect): void {
			this.stage.add(aspect.dobj);
		}

		@override
		public onRemove(aspect: DebugInspectionAspect): void {
			this.stage.remove(aspect.dobj);
		}

		@override
		public onDisabled(entities: Map<Engine.Entity, DebugInspectionAspect>): void {
			for (let aspect of entities.values()) {
				aspect.dobj.visible = false;
			}
		}

		public update(delta: number, entities: Map<Engine.Entity, DebugInspectionAspect>): void {
			for (let aspect of entities.values()) {
				let position = aspect.get(Component.Position);

				// update position and rotate
				aspect.dobj.visible = true;
				aspect.dobj.position.set(position.p.x, position.p.y);
				aspect.dobj.rotation = angleClamp(aspect.dobj.rotation + DebugInspectionAspect.ROTATE_DELTA);
			}
		}
	}

}
