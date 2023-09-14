// Separating axis theorem collision detection implementation.

namespace Physics {

	/**
	 * Projects `vertices` (of polygon) onto `vector`, storing min and max
	 * scales in `out`.
	 *
	 * Since a projection onto a vector will just be a scaling of that vector,
	 * this just tracks the different scales and returns the minimum and maximum
	 * scale. This is the length of the vector occupied by the polygon with the
	 * given vertices.
	 *
	 * @param vertices Input: vertices of a polygon
	 * @param vector Input: the vector to project the vertices on to
	 * @param out Output: the minimum and maximum scales
	 */
	function projectMinMax(vertices: Point[], vector: Point, out: Point): void {
		let min = Infinity;
		let max = -Infinity;
		for (let i = 0; i < vertices.length; i++) {
			let vertex = vertices[i];
			let scale = vertex.dot(vector);
			min = Math.min(min, scale);
			max = Math.max(max, scale);
		}
		out.set_(min, max);
	}

	/**
	 * Projects vertices (of polygon) onto each vector in succession (first all
	 * in vectors1, then all in vectors2). For each vector, records the min and
	 * max scale as a point. These (min, max) pairs are returned in `out`.
	 *
	 * @param vertices Input: vertices of polygon (length n)
	 * @param vectors Input: first set of vectors to project onto (length v1)
	 * @param vectors Input: second set of vectors to project onto (length v2)
	 * @param out Output: (min, max) scales, one for each vector (only v1+v2 set)
	 */
	function projectMinMaxMany(vertices: Point[], vectors1: Point[], vectors2: Point[], out: Point[]): void {
		for (let i = 0; i < vectors1.length; i++) {
			projectMinMax(vertices, vectors1[i], out[i]);
		}
		for (let i = 0; i < vectors2.length; i++) {
			projectMinMax(vertices, vectors2[i], out[vectors1.length + i]);
		}
	}

	export class CollisionInfo {
		constructor(public axis: Point = new Point(), public amount: number = 0) {}

		public copy(): CollisionInfo {
			return new CollisionInfo(this.axis.copy(), this.amount);
		}

		/**
		 * Reverses the direction of the collision (by changing the sign of the
		 * amount). Return this.
		 */
		public rev(): CollisionInfo {
			this.amount = -this.amount;
			return this;
		}
	}

	export class SAT {
		private cacheRanges1: Array<Point>
		private cacheRanges2: Array<Point>

		/**
		 * Creates a SAT collision detector that can check collisions between
		 * at most two n-sided polygons (used to allocate buffer space).
		 * @param n
		 */
		constructor(n) {
			let bufferSize = n+n;
			this.cacheRanges1 = new Array<Point>(bufferSize);
			this.cacheRanges2 = new Array<Point>(bufferSize);
			for (let arr of [this.cacheRanges1, this.cacheRanges2]) {
				for (let i = 0; i < bufferSize; i++) {
					arr[i] = new Point();
				}
			}
		}

		/**
		 * Separating axis theorem collision detection between two sets of
		 * vertices onto two sets of axes.
		 *
		 * If there is a collision, returns the axis and amount of the axis with
		 * the smallest overlap.
		 * @param vertices1 from shape 1
		 * @param axes1 from shape 1
		 * @param vertices2 from shape 2
		 * @param axes2 from shape 2
		 * @param out
		 */
		public collides(vertices1: Point[], axes1: Point[], vertices2: Point[], axes2: Point[], out: CollisionInfo): boolean {
			projectMinMaxMany(vertices1, axes1, axes2, this.cacheRanges1);
			projectMinMaxMany(vertices2, axes1, axes2, this.cacheRanges2);
			let comparisons = axes1.length + axes2.length;
			let smOverlap = Infinity;
			let smOverlapIdx = -1;
			let smDir = -1;
			for (let i = 0; i < comparisons; i++) {
				let p = this.cacheRanges1[i];
				let q = this.cacheRanges2[i];

				// case 1: OK
				//	 p.x		p.y	  Q.x		  Q.y
				// ---+==========+-----+===========+--------
				//
				// case 2: OK
				//	 Q.x		Q.y	  p.x		  p.y
				// ---+==========+-----+===========+--------
				//
				// case 3: COLLIDING
				//	 p.x		Q.x	  p.y		  Q.y
				// ---+==========+=====+===========+--------
				//
				// case 4: COLLIDING
				//	 Q.x		p.x	  Q.y		  p.y
				// ---+==========+=====+===========+--------
				if (p.y < q.x || q.y < p.x) {
					// non-overlap on any axis means safe
					return false;
				}

				// overlap on this axis. track it + direction  in case we have
				// a collision and this is the axis w/ smallest amt.
				let diff1 = p.y - q.x;
				let diff2 = q.y - p.x;
				let overlap: number, direction: number;
				if (diff1 < diff2) {
					overlap = diff1;
					direction = 1;
				} else {
					overlap = diff2;
					direction = -1;
				}
				if (overlap < smOverlap) {
					smOverlap = overlap;
					smOverlapIdx = i;
					smDir = direction;
				}
			}

			// set collision info w/ smallest (kinda gross b/c two arrays...)
			let smAxis = smOverlapIdx < axes1.length ? axes1[smOverlapIdx] : axes2[smOverlapIdx - axes1.length];
			out.axis.copyFrom_(smAxis);
			out.amount = smOverlap * smDir;

			// and return that we did collide
			return true;
		}
	}
}
