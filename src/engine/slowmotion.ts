namespace Engine {

	interface Slowdown {
		remaining: number;
		factor: number;
	}

	/**
	 * Provides slow motion functionality by deciding when to skip updates.
	 *
	 * API sketch:
	 * - field requests for slow motion in raw format (duration and slowdown
	 *	 factor)
	 * - accept deltas and return whether the game should update (or how much)
	 * - for sound effects: trigger events on when slowdown starts or stops
	 *	 (maybe later)
	 */
	export class SlowMotion {

		private active = new Array<Slowdown>()

		// for pause-style slow motion
		private frameIdx = 0;

		/**
		 * API: pause the game overall (debugging only). Doesn't tick regular
		 * slowdowns forward.
		 */
		public debugPaused: boolean = false

		/**
		 * APU: slowdown the game overall (debugging only). Continues to tick
		 * regular slowdowns forward.
		 */
		public debugFactor: number = 1

		/**
		 * API: Request slow motion.
		 * @param factor update every Nth frame (factor == N)
		 * @param duration how long the slow motion lasts for
		 */
		public request(factor: number, duration: number): void {
			this.active.push({remaining: duration, factor: factor});
		}

		/**
		 * Game calls this to decide how much to update.
		 *
		 * @param delta Time elapsed
		 * @returns how much the game should update. Number depends on
		 * implementation. For pause-style, this is either `delta` or 0. For
		 * slowmotion-style, is is 0 <= val <= delta.
		 */
		public update(delta: number): number {
			// shortcut even to slowmotion system: if paused
			if (this.debugPaused) {
				return 0;
			}

			// tick active slowdowns forward, remove any that are finished, and
			// compute the largest factor of the alive ones.
			let largest = 1;
			for (let i = this.active.length - 1; i >= 0; i--) {
				this.active[i].remaining -= delta;
				if (this.active[i].remaining <= 0) {
					this.active.splice(i, 1);
				} else {
					largest = Math.max(largest, this.active[i].factor);
				}
			}

			// if we do have a debug factor != 1, it also is a candidate for
			// the largest slowdown.
			largest = Math.max(largest, this.debugFactor);

			// pause-style slow motion: tick frame count and compute whether to
			// slow down
			this.frameIdx = (this.frameIdx + 1) % largest;
			return this.frameIdx == 0 ? delta : 0;

			// slowdown-style slow motion: decide delta to use
			// return delta / largest;
		}
	}
}
