/// <reference path="../core/tween.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/gui.ts" />

namespace Component {

	export class Tweenable extends Engine.Component {

		/**
		 * Write to this to enqueue tweens. A system performing tweens will
		 * dequeue from it and make the tween happen.
		 */
		public tweenQueue: Tween.Package[] = []

		/**
		 * Set this flag to request that all tweens (ongoing and waiting) are
		 * cleared. A system performing tweens will read it and reset it, and
		 * (hopefully) clear its ongoing tweens as a result.
		 *
		 * Note that by settings this, you're asking the tweens to be just
		 * completely dropped; in other words, their target values won't
		 * reached.
		 */
		public clear: boolean = false

		/**
		 * True values for tween-able settings. Tweening system should write to
		 * this, and renderers will read from it.
		 */
		public groundTruth = {
			alpha: 1.0,		  // opaque
			color: 16777215,  // white
		}
	}
}
