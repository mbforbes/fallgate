/// <reference path="../engine/ecs.ts" />

namespace System {

	type ZoomPkg = {
		startScale: number,
		targetScale: number,
		elapsed: number,
		duration: number,
		period?: number,
		method: Tween.Method,
	}

	/**
	 * NOTE: This is another "non-System System" that doesn't need to track
	 * entities or components, but wants to run every frame sometimes. I guess
	 * it's really a script. But making scripts from arbitrary locations is
	 * annoying because they can't have access to stuff (like the world stage)
	 * that they need.
	 *
	 * Is there a better way to federate access to global resources that aren't
	 * component-like?
	 */
	export class Zoom extends Engine.System {

		private active: ZoomPkg = null

		public componentsRequired = new Set<string>([
			Component.Dummy.name,
		])

		constructor(private stage: Stage.MultiZStage, private defaultZoom: number) {
			super();
		}

		@override
		onClear(): void {
			this.stage.scale.set(this.defaultZoom, this.defaultZoom);
			this.active = null;
		}

		/**
		 * Request a zoom at `scale` across `duration` using `method`. No need
		 * to think about different game zoom levels; that's taken care of
		 * within this.
		 * @param scale
		 * @param duration
		 * @param method
		 * @param period optional: for insane zoooms that involve periods
		 */
		request(scale: number, duration: number, method: Tween.Method, period?: number): void {
			let current = this.stage.scale.x;
			let target = scale * this.defaultZoom;
			this.active = {
				startScale: current,
				targetScale: target,
				elapsed: 0,
				duration: duration,
				period: period,
				method: method,
			}
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			// nothing to do if no active zoom
			if (this.active == null) {
				return;
			}

			// tick forward
			this.active.elapsed += delta;

			// maybe remove
			if (this.active.elapsed >= this.active.duration) {
				this.stage.scale.set(this.active.targetScale, this.active.targetScale);
				this.active = null;
				return;
			}

			// otherwise, pick new level based on tween
			let portion = this.active.method(this.active.elapsed, this.active.duration, this.active.period);
			let current = this.active.startScale + portion * (this.active.targetScale - this.active.startScale)
			this.stage.scale.set(current, current);
		}
	}
}
