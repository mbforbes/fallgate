/// <reference path="../core/base.ts" />

namespace Physics {

	/**
	 * Computes force that goes in the direction from p1 to p2 and has the
	 * provided magnitude.
	 *
	 * @param p1
	 * @param p2
	 * @param magnitude
	 */
	export function forceFromPoints(p1: Point, p2: Point, magnitude: number): Point {
		return p2.subNew(p1).normalize_().scale_(magnitude);
	}

	/**
	 * Computes force that goes in the direction pointed to from angle and has
	 * the provided magnitude. (Takes into account negative y direction.)
	 * @param angle
	 * @param magnitude
	 */
	export function forceFromAngle(angle: number, magnitude: number): Point {
		return (new Point(Math.cos(angle), -Math.sin(angle))).scale_(magnitude);
	}
}
