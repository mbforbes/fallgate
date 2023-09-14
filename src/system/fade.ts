/// <reference path="../engine/ecs.ts" />
/// <reference path="../core/keyboard.ts" />
/// <reference path="../component/dummy.ts" />

namespace System {

	export enum FadeTarget {
		/**
		 * Shows game.
		 */
		Reveal = 0,

		/**
		 * Black curtain over screen.
		 */
		Black,
	}

	/**
	 * TODO: use shader instead of graphics object.
	 */
	export class Fade extends Engine.System {

		private curAlpha: number = 0
		private curtain: Stage.Graphics
		private inStage: boolean = false

		private elapsed: number = -1
		private duration: number = -1
		private targetAlpha: number = -1

		public componentsRequired = new Set<string>([
			Component.Dummy.name,
		])

		constructor(
			private stage: Stage.MainStage,
			viewportDims: Point,
		) {
			super();

			this.curtain = new Stage.Graphics(ZLevelHUD.Curtain, StageTarget.HUD);
			this.curtain.beginFill(0x000000, 1.0);
			this.curtain.drawRect(0, 0, viewportDims.x, viewportDims.y);
			this.curtain.endFill();
			// start game w/ black screen
			this.curtain.alpha = 1;
			this.stage.add(this.curtain);
			this.inStage = true;
		}

		/**
		 * API.
		 * @param targetAlpha alpha of the CURTAIN: 1.0 = black screen, 0.0 =
		 * no curtain.
		 */
		public request(targetAlpha, duration: number = 500): void {
			this.elapsed = 0;
			this.duration = duration;
			this.targetAlpha = targetAlpha;

			this.curtain.alpha = this.curAlpha;
			if (!this.inStage) {
				this.stage.add(this.curtain);
				this.inStage = true;
			}
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			// check whether any active tweens
			if (this.duration === -1) {
				return;
			}

			// tick
			this.elapsed += delta;

			// if finished, set final state
			if (this.elapsed >= this.duration) {
				this.curAlpha = this.targetAlpha;
				if (this.curAlpha === 0) {
					this.stage.remove(this.curtain);
					this.inStage = false;
				}

				this.elapsed = -1;
				this.duration = -1;
				this.targetAlpha = -1;
				return;
			}

			// otherwise, do the normal tween NOTE: If we want to support
			// partial tweens, or re-tweening from, e.g., 1 to 1 with no
			// visible difference, we need to track the starting alpha value
			// and tween between that and the target alpha.
			let portion = Tween.easeInCubic(this.elapsed, this.duration);
			this.curAlpha = this.targetAlpha === 1 ? portion : 1 - portion;
			this.curtain.alpha = this.curAlpha;
		}
	}
}
