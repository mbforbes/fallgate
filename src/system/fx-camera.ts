/// <reference path="../core/tween.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/stage.ts" />

namespace System {

	/**
	 * TODO: consider pulling somewhere else so this isn't globally called
	 * `System.ShakeType`
	 */
	export enum ShakeType {
		JumpEaseBack = 0,
		Wobble,
	}

	/**
	 * Modifies final camera position to add addl. effects (like screen
	 * shakes).
	 */
	export class FxCamera extends Engine.System {

		// state

		private cacheDelta = new Point()

		// -1 means nothing active
		private frameIdx: number = -1

		// shake parameters (passed in; these are dummy default values)
		private angle: number = 0
		private nFrames: number = 0
		private magnitude: number = 0
		private shakeType: ShakeType = ShakeType.JumpEaseBack

		public componentsRequired = new Set<string>([
			Component.Dummy.name,
		])

		constructor(private stage: Stage.MultiZStage) {
			super();
		}

		/**
		 * API for requesting fx (currently only shake)
		 * @param angle direction to shake *towards* in radians
		 */
		public shake(angle: number, nFrames: number, magnitude: number, shakeType: ShakeType): void {
			this.frameIdx = 0;
			// we reverse the angle internally because cameras are backwards!
			// (because it's just moving the stage under the viewport)
			this.angle = angleClamp(angle + Math.PI);
			this.nFrames = nFrames;
			this.magnitude = magnitude;
			this.shakeType = shakeType;
		}

		/**
		 * Sets this.cacheDelta
		 */
		private wobble(): void {
			// a sin(bx)
			// a = amplitude
			// b = period (multiplier)

			// hard settings (can pass in if desired)
			let b = 0.4

			// amplitude diminishes over time
			let a = this.magnitude * (1.0 - Tween.easeOutCubic(this.frameIdx, this.nFrames));
			let len = a * Math.sin(b * this.frameIdx);
			this.cacheDelta.x = Math.cos(this.angle) * len;
			this.cacheDelta.y = -Math.sin(this.angle) * len;
		}

		/**
		 * Sets this.cacheDelta
		 */
		private jumpEaseBack(): void {
			// move in the specified direction. y is flipped because i can
			// never remember what coordinate system anything is in.
			let portion = 1.0 - Tween.easeOutCubic(this.frameIdx, this.nFrames);
			let len = portion * this.magnitude;
			this.cacheDelta.x = Math.cos(this.angle) * len;
			this.cacheDelta.y = -Math.sin(this.angle) * len;
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			// check whether we have any ongoing shakes
			if (this.frameIdx == -1) {
				return;
			}

			// use specified shake type to compute offset
			switch (this.shakeType) {
				case ShakeType.JumpEaseBack: {
					this.jumpEaseBack()
					break;
				}
				case ShakeType.Wobble: {
					this.wobble();
					break;
				}
				default: {
					throw new Error('Unimplemented shake type: ' + this.shakeType);
				}
			}

			// apply delta
			this.stage.x += this.cacheDelta.x;
			this.stage.y += this.cacheDelta.y;

			// increment our frame index and disable if necessary
			this.frameIdx++;
			if (this.frameIdx >= this.nFrames) {
				this.frameIdx = -1;
			}
		}
	}
}
