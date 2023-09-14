// Generic functions for working with polygons.

namespace Physics {
	export enum Shape {
		Rectangle = 0,  // for rectangle-specific optimizations
		Polygon,
	}

	/**
	 * Gets the vertices for a rectangle of `dims` dimensions, rotated at
	 * `angle`, and at position `offset` from origin. Stores vertices in `out`.
	 *
	 * @param dims Dimensions of the rectangle
	 * @param angle Angle the rectangle is rotated to
	 * @param out Array to save the vertices in
	 * @param offset (optional) Added to all points, e.g., position
	 */
	export function rectVertices(dims: Point, angle: number, out: Point[], offset: Point = new Point()): void {
			// p2
			// +--------+--------+ p3
			// |		| center |
			// +--------o--------+	<-- midline
			// |		|		 |
			// +--------+--------+ p4
			// p1

			// compute center. current graphics (x, y) are pos + offset in
			// global space, so that's 0,0 in local space.
			// let center_x = dims.x/2;
			// let center_y = -dims.y/2;
			let center_x = 0;
			let center_y = 0;

			// compute angle between midline and corner (say, p3). this is also
			// constant (wrt box dims) so could cache if we want.
			let midToCorner = Math.atan2(dims.y/2, dims.x/2);

			// compute diagonal between center and any point (say, p3). this is
			// constant (wrt box dims) so could cache if we want. (note that
			// sin(angle) can be 0, so use cos if its. better way to do this w/o
			// conditionals?)
			let diag: number
			let sinMidCorner = Math.sin(midToCorner);
			if (sinMidCorner == 0) {
				diag = (dims.x/2) / Math.cos(midToCorner);
			} else {
				diag = (dims.y/2) / Math.sin(midToCorner);
			}

			// compute the angle between x axis and p3.
			let beta_3 = angle + midToCorner;

			// compute x and y distances from center to p3.
			let dx_3 = diag * Math.cos(beta_3);
			let dy_3 = diag * Math.sin(beta_3);

			// now p4
			let beta_4 = angle - midToCorner;
			let dx_4 = diag * Math.cos(beta_4);
			let dy_4 = diag * Math.sin(beta_4);

			// p1 and p2 are swapped distances as p3 and p4,
			// respectively.

			// p1--p4
			out[0].set_(offset.x + center_x - dx_3, offset.y + center_y + dy_3);
			out[1].set_(offset.x + center_x - dx_4, offset.y + center_y + dy_4);
			out[2].set_(offset.x + center_x + dx_3, offset.y + center_y - dy_3);
			out[3].set_(offset.x + center_x + dx_4, offset.y + center_y - dy_4);
	}

	/**
	 * Given the vertices of a polygon, computes the edges and returns them
	 * through `out`.
	 *
	 * @param vertices Input: the vertices of a n-sided polygon (length n)
	 * @param out Output: the edges of that n-sided polygon (length n or limit)
	 * @param limit (optional) limits only provided this many out points
	 */
	export function getEdges(vertices: Point[], out: Point[], limit: number = null): void {
		// as many sides as points
		let n = limit || vertices.length;
		if (out.length != n) {
			throw new Error('Must provide ' + n + ' edges for output.');
		}

		// each side uses two points
		// we just wrap
		for (let i = 0; i < n; i++) {
			let p1 = vertices[i];
			let p2 = vertices[(i + 1) % vertices.length];
			let edge = out[i];
			p2.sub(p1, edge);
			let mag = Math.sqrt(edge.x*edge.x + edge.y*edge.y);
			edge.x /= mag;
			edge.y /= mag;
		}
	}

	/**
	 * Given a set of vectors, returns their normals through `out`.
	 *
	 * @param vectors Input: the vectors (length n)
	 * @param out Output: the normals of the provided vectors (length n)
	 */
	export function getNormals(vectors: Point[], out: Point[]): void {
		// as many normals as vectors
		let n = vectors.length;
		if (out.length != n) {
			throw new Error('Must provide as many normals as vectors.');
		}

		for (let i = 0; i < n; i++) {
			let v = vectors[i];
			let n = out[i];
			n.x = -v.y;
			n.y = v.x;
		}
	}
}
