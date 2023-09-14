/// <reference path="../../lib/pixi.js.d.ts" />

/// <reference path="anim.ts" />
/// <reference path="stage.ts" />

namespace Stage {

	enum PlayDirection {
		Forward = 0,
		Backward,
	}

	type FilterName = string


	/**
	 * A blob of Animatable game state (containg all animations and some prev
	 * state).
	 *
	 * Dev note: While this is given to the Component.Animatable now, it was
	 * previously the AnimationRenderer Aspect, and conceptually belongs there;
	 * it's heavy-weight transient state. It's been moved to
	 * Component.Animatable during the "dirty component" feature development so
	 * that it may be shared across the 2 animation renderer systems.
	 */
	export class AnimatableState {
		curVisible: boolean = false
		activeKeys = new Set<Anim.Key>()
		animations = new Map<Anim.Key, AnimationContainer>()
	}

	/**
	 * Holds an animation along with other core information either (a)
	 * necessary to remember with it, (b) that is lost when mutating the
	 * animation. NOTE: We may be able to just pull this into Animation itself.
	 */
	export type AnimationContainer = {
		animation: Animation,
		align: Anim.Align,
		tint: number,
		scale: number,

		// These provided so we can avoid string comparisons.
		action: Action,
		part: Part,
		partID: PartID,
	}

	/**
	 * Animation is my own implementation of PIXI.extras.AnimatedSprite that
	 * supports a couple key features it is missing:
	 *
	 *	  (a) a clearly-defined spec for frame timing. PIXI gives "change this
	 *		  number in this direction to change the speed." That's it, even
	 *		  within the code's comments. We give "ms / frame".
	 *
	 *	  (b) different play types (e.g. Loop and PingPong).
	 *
	 * In exchange, though, their timing is more sophisticated, using core
	 * objects (PIXI.ticker) and lag. They also support callback functions for
	 * events like frame changes or animation completions, but that doesn't fit
	 * with this engine's procedural style.
	 *
	 * Animation is constructed from:
	 *
	 *	 - Component.Animatable	   ----	   per-entity data that is the same
	 *									   across all of its Animations
	 *
	 *	 - AnimationData		   ----	   per-Animation data
	 */
	export class Animation extends PIXI.Sprite implements DisplayObject {

		// filter names TODO(later): this is ugly
		public static BrightnessFilter: FilterName = 'BrightnessFilter'

		public get frame(): number {
			return this.curFrameIndex;
		}

		private curFrameIndex: number
		private timeInCurrentFrame: number
		private playDirection: PlayDirection
		private nFrames: number
		private neverUpdate: boolean = false

		// public filterCache = new Map<FilterName, PIXI.Filter>()

		public static loadTextures(base: string, frames: number): PIXI.Texture[] {
			// Kind of hack here: allowing 0-frame animations to have
			// non-numeric names.

			// compute paths to load textures
			let nTextures = frames == 0 ? 1 : frames;
			let textures = new Array<PIXI.Texture>(nTextures);
			if (frames == 0) {
				textures[0] = PIXI.Texture.fromFrame(base + '.png');
			}
			else {
				for (let i = 1; i <= frames; i++) {
					textures[i-1] = PIXI.Texture.fromFrame(base + i + '.png');
				}
			}
			return textures;
		}

		public static build(bd: Anim.BaseData, dd: Anim.DisplayData): Animation {
			// build animation from textures and further mutate
			let textures = Animation.loadTextures(bd.base, bd.frames);
			let anim = new Animation(
				textures, dd.z, dd.stageTarget, bd.speed, bd.playType);
			anim.anchor.set(bd.anchor.x, bd.anchor.y);
			anim.alpha = bd.alpha;
			anim.tint = bd.tint != null ? bd.tint : 0xffffff;
			anim.scale.set(bd.scale, bd.scale);
			return anim;
		}

		/**
		 * All properties passed are assumed immutable.
		 */
		constructor(
				private textures: PIXI.Texture[],
				public z: ZLevelWorld | ZLevelHUD,
				public stageTarget: StageTarget,
				public frameDuration: number,
				public playType: Anim.PlayType) {
			super(textures[0]);
			this.nFrames = this.textures.length;
			this.reset();

			// build basic filters TODO(later): this is ugly
			// let brightnessFilter = new PIXI.filters.ColorMatrixFilter();
			// this.filterCache.set(Animation.BrightnessFilter, brightnessFilter);
			// this.filters = [brightnessFilter];

			this.neverUpdate = this.nFrames < 2
		}

		/**
		 * NOTE: sets this.curFrameIndex. Shouldn't do elsewhere. (Probably
		 * should use setter to enforce this...)
		 */
		private switchFrames(index: number): void {
			if (index < 0 || index >= this.textures.length) {
				throw new Error('Desired texture index ' + index + ' out of ' +
					'bounds. Must be between 0 and ' + this.textures.length);
			}
			if (index !== this.curFrameIndex) {
				this._texture = this.textures[index];
				this._textureID = -1;
				this.curFrameIndex = index;
			}
		}

		public reset(): void {
			this.timeInCurrentFrame = 0;
			this.playDirection = PlayDirection.Forward;
			this.switchFrames(0);
		}

		/**
		 * Gets the true origin (bottom-left corner) of the texture displayed on screen, accounting
		 * for anchor and rotation.
		 */
		public getTextureOrigin(out: Point): void {
			// sin / cos of angle used below
			const sin_t = Math.sin(this.rotation);
			const cos_t = Math.cos(this.rotation);
			const sin_a = cos_t;
			const cos_a = sin_t;

			// Let's talk about anchoring. Anchoring works like:
			//
			// (0, 0) ---------- (1, 0)
			//	 |				   |
			//	 |				   |
			//	 |	  (0.5, 0.5)   |
			//	 |				   |
			//	 |				   |
			// (0, 1) ---------- (1, 1)

			// anchor scales w & h to make vectors from texture origin to anchor
			const w = this.width * this.anchor.x;
			const h = this.height * (1 - this.anchor.y);

			// compute vector components
			const wx = w * cos_t;
			const wy = w * sin_t;
			const hx = h * cos_a;
			const hy = h * sin_a;

			// backtrack from anchor to texture origin
			out.x = this.position.x - wx - hx;
			out.y = this.position.y - wy + hy;
		}

		public computeNextFrameIdx(): number {
			switch(this.playType) {

				// start over at beginning after end reached
				case Anim.PlayType.Loop: {
					return this.curFrameIndex === this.nFrames - 1 ?
						0 : this.curFrameIndex + 1;
				}

				// reverse directions if on either end
				case Anim.PlayType.PingPong: {

					if (this.playDirection === PlayDirection.Forward &&
							this.curFrameIndex === this.nFrames - 1) {
						this.playDirection = PlayDirection.Backward;
					} else if (this.playDirection === PlayDirection.Backward &&
							this.curFrameIndex === 0) {
						this.playDirection = PlayDirection.Forward;
					}
					// update based on direction
					let delta = this.playDirection === PlayDirection.Forward ?
						1 : -1;
					return this.curFrameIndex + delta;
				}

				// hold last frame
				case Anim.PlayType.PlayAndHold: {
					return this.curFrameIndex === this.nFrames - 1 ?
						this.nFrames - 1 : this.curFrameIndex + 1;
				}
			}
		}

		private noUpdateNeeded(): boolean {
			return this.neverUpdate ||
				(this.playType === Anim.PlayType.PlayAndHold &&
					this.curFrameIndex === this.nFrames - 1);
		}

		/**
		 * Returns whether the update needs to continue to happen in the
		 * future (barring current frame changes w/ a rest(...)).
		 */
		public update(delta: number): boolean {
			// quick sanity check
			if (this.scale == null) {
				throw new Error('Scale should not be null');
			}

			if (this.neverUpdate) {
				return false;
			}

			this.timeInCurrentFrame += delta;

			// If we haven't played this frame for long enough (and we haven't
			// been told to reset), stay in it.
			if (this.timeInCurrentFrame < this.frameDuration) {
				return !this.noUpdateNeeded();
			}

			// Otherwise, we proceed to the next frame.

			// Figure out timing for next frame. policy options:
			//
			// (a) start at 0. this would avoid shortchanging the new frame,
			// but would make overall timings inconsistent as we'd be
			// rounding up to the nearest frame.
			//
			//	   this.timeInCurrentFrame = 0;
			//
			// (b) discount with amount of time over previous frame. keeps
			// frames progressing on time but shortchanges next frame.
			//
			//	   this.timeInCurrentFrame -= this.frameDuration;
			//
			// going with (a) for now so that animations look consistent.
			this.timeInCurrentFrame = 0;
			let nextFrameIndex = this.computeNextFrameIdx();

			// update internals
			this.switchFrames(nextFrameIndex);

			return !this.noUpdateNeeded();
		}
	}
}
