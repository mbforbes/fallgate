/// <reference path="../../lib/pixi.js.d.ts" />

/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/lockon.ts" />


namespace System {

	/**
	 * Cleans-up old LockOn Components and renders a marker around the active
	 * one. Actual lock-on mechanic is in PlayerInputMouseKeyboard System.
	 */
	export class LockOn extends Engine.System {

		// settings

		/**
		 * Amount that lockon graphic rotates per frame, in radians.
		 */
		static ROTATE_DELTA: number = 0.1;

		public componentsRequired = new Set<string>([
			Component.LockOn.name,
			Component.Position.name,
		])

		private dobj = Stage.Sprite.build('HUD/target1.png',
			ZLevelWorld.LockOn, StageTarget.World, new Point(), new
			Point(0.5, 0.5));

		constructor(private stage: Stage.MainStage) {
			super();
			this.dobj.visible = false;
			this.stage.add(this.dobj);
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			let foundAspect: Engine.Aspect = null;

			// clean up old lockon components. note that we take this
			// opportunity mark the fresh one as not fresh (done every frame).
			for (let [entity, aspect] of entities.entries()) {
				let lockon = aspect.get(Component.LockOn);
				if (lockon.fresh) {
					// we found the fresh one to use
					foundAspect = aspect;
					lockon.fresh = false;
				} else {
					// we found an old one to cleanup
					this.ecs.removeComponent(entity, Component.LockOn);
				}
			}

			// might be nothing to lockon to. if so, done.
			if (foundAspect == null) {
				this.dobj.visible = false;
				return;
			}

			// if something found, get its position, and then show the target
			// around it.
			let pos = foundAspect.get(Component.Position);
			this.dobj.visible = true;
			this.dobj.position.set(pos.p.x, pos.p.y);
			this.dobj.rotation = angleClamp(this.dobj.rotation + LockOn.ROTATE_DELTA);
		}
	}
}
