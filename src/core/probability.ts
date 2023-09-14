namespace Probability {
	/**
	 * Probably actually *not* uniform, but probably good enough for games.
	 * Returns an integer uniform between min and max, both inclusive.
	 * @param min lower bound, inclusive
	 * @param max upper bound, inclusive
	 */
	export function uniformInt(min: number, max: number): number {
		return min + Math.floor(Math.random() * (max - min + 1));
	}

	/**
	 * Also probably not uniform.
	 * @param min lower bound, inclusive
	 * @param max upper bound, exclusive
	 */
	export function uniformReal(min: number, max: number): number {
		return min + Math.random() * (max - min);
	}

	/**
	 * Choose one element at random from `a`. (Randomness questionable.)
	 * @param a
	 */
	export function uniformChoice<T>(a: T[]): T {
		return a[uniformInt(0, a.length - 1)];
	}
}
