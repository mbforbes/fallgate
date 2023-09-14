/// <reference path="../core/base.ts" />
/// <reference path="../core/util.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/constants.ts" />

namespace Component {

	/**
	 * `p`: position of the object (center)
	 *
	 * `angle`: 0 <= `angle` <= 2*pi, with 0 facing right, angles increasing
	 *	CCW (note that Pixi and Tiled increase CW).
	 */
	export class Position extends Engine.Component {
		// main state / settings

		private _p = new Point()
		private _revealP = new Point()
		public get p(): Point {
			return this._revealP.copyFrom_(this._p);
		}
		public set p(v: Point) {
			if (!this._p.equals(v)) {
				this._p.copyFrom_(v);
				this.dirty();
			}
		}
		public setX(x: number): void {
			if (this._p.x !== x) {
				this._p.x = x;
				this.dirty();
			}
		}
		public setY(y: number): void {
			if (this._p.y !== y) {
				this._p.y = y;
				this.dirty();
			}
		}
		public setP(x: number, y: number): void {
			if (!this._p.equalsCoords(x, y)) {
				this._p.set_(x, y);
				this.dirty();
			}
		}

		// We use getters and setters here so that we can control the angle
		// value.
		private _angle: number = 0
		public get angle(): number {
			return this._angle;
		}
		public set angle(v_raw: number) {
			if (isNaN(v_raw)) { throw Error('Tried to set angle to NaN!'); }
			let v = angleClamp(v_raw);
			if (this._angle !== v) {
				this._angle = v;
				this.dirty();
			}
		}

		// for spatial hashing
		public cells: string[] = []

		// deubg stuff for reporting
		debugSpeed: number = 0

		constructor(p: Point, angle: number = 0) {
			super();
			this.p = p
			this.angle = angle;
		}

		public toString(): string {
			return this.p.toString() + ', ' + round(this.angle) +
				', speed: ' + round(this.debugSpeed);
		}
	}
}
