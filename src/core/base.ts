// base "library"

namespace Constants {
	// Totally unchanging constants.
	export const HALF_PI = 0.5 * Math.PI;
	export const TWO_PI = 2 * Math.PI;
	export const RAD2DEG = 180 / Math.PI;
	export const DEG2RAD = Math.PI / 180;
}

/**
 * Rounds `num` to n decimal places.
 * @param num
 */
function round(num: number, places: number = 2): number {
	let d = 10 ** places
	return Math.round(num * d) / d;
}

/**
 * Note: Can't clone class-based objects, only (arbitrarily complex)
 * combinations of basic types---i.e., things that can be fully represented in
 * JSON.
 *
 * Use for:
 * - objects {}
 * - arrays []
 *
 * ... of:
 * - booleans
 * - numbers
 * - strings
 * - enums (I think) (because these are just numbers once the game is running)
 *
 * @param obj
 */
function clone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

/**
 * Clamps angle (in radians) to be 0 <= angle <= 2*pi
 */
function angleClamp(angle: number): number {
	angle %= Constants.TWO_PI;
	if (angle < 0) {
		angle += Constants.TWO_PI;
	}
	return angle;
}

/**
 * Goes between game angle (increasing CCW) and pixi angle (increasing CW)
 * representation.
 * @param gameAngle
 */
function angleFlip(angle: number): number {
	return angleClamp(-angle);
}

/**
 * Sort function for arrays of numbers. It's insane you need to do this.
 */
function sortNumeric(a: number, b: number): number {
	return a - b;
}

class Point {

	public get x(): number {
		return this._x;
	}
	public set x(val: number) {
		if (isNaN(val)) { throw Error('Tried to set x to NaN!'); }
		this._x = val;
	}

	public get y(): number {
		return this._y;
	}
	public set y(val: number) {
		if (isNaN(val)) { throw Error('Tried to set y to NaN!'); }
		this._y = val;
	}

	constructor(private _x: number = 0, private _y: number = 0) { }

	/**
	 * Returns new Point from array with two numbers.
	 * @param array
	 */
	public static from(array: number[]): Point {
		return new Point(array[0], array[1]);
	}

	/**
	 * Returns manhattan distance to other point.
	 */
	manhattanTo(other: Point): number {
		const dx = other.x - this.x;
		const dy = other.y - this.y;
		return Math.abs(dx) + Math.abs(dy);
	}

	/**
	 * Returns squared distance to other point. Useful for comparisons where
	 * relative distance is all that matters so you can avoid spending the sqrt.
	 */
	sqDistTo(other: Point): number {
		const dx = other.x - this.x;
		const dy = other.y - this.y;
		return dx * dx + dy * dy;
	}

	distTo(other: Point): number {
		return Math.sqrt(this.sqDistTo(other));
	}

	/**
	 * Returns angle from this to other (in radians, clamped in [0, 2*pi]).
	 */
	angleTo(other: Point): number {
		const dx = other.x - this.x;
		const dy = other.y - this.y;
		return angleClamp(Math.atan2(dy, dx));
	}

	/**
	 * Returns angle from this to other (in radians, clamped in [0, 2*pi]),
	 * accounting for y-down coordinate system.
	 */
	pixiAngleTo(other: Point): number {
		const dx = other.x - this.x;
		// y distances are actually reversed (due to y-down coordinate system)
		const dy = -(other.y - this.y);
		return angleClamp(Math.atan2(dy, dx));
	}

	/**
	 * Also rounds.
	 */
	toString() {
		let x = Math.round(this.x * 100) / 100
		let y = Math.round(this.y * 100) / 100
		return '(' + x + ', ' + y + ')';
	}

	toCoords(): [number, number] {
		return [this.x, this.y];
	}

	dot(other: Point): number {
		return this.x * other.x + this.y * other.y;
	}

	// l2 norm, squared
	l2Squared(): number {
		return this.dot(this);
	}

	// l2 norm
	l2(): number {
		return Math.sqrt(this.l2Squared());
	}

	/**
	 * Scales each coordinate of point by alpha. Returns this.
	 */
	scale_(alpha: number): Point {
		this.x *= alpha;
		this.y *= alpha;
		return this;
	}

	/**
	 * Element-wise clamp each component to be within [min, max]. Returns this.
	 * @param min
	 * @param max
	 */
	clampEach_(min: number, max: number): Point {
		this.x = Math.min(Math.max(this.x, min), max);
		this.y = Math.min(Math.max(this.y, min), max);
		return this;
	}

	/**
	 * Make this unit norm. Returns this.
	 */
	normalize_(): Point {
		return this.scale_(1 / this.l2());
	}

	equals(other: Point): boolean {
		return this.x === other.x && this.y === other.y;
	}

	equalsCoords(x: number, y: number): boolean {
		return this.x === x && this.y === y;
	}

	isZero(): boolean {
		return this.equalsCoords(0, 0);
	}

	/**
	 * Mutates and returns this.
	 * @param other
	 */
	add_(other: Point): Point {
		this.x += other.x;
		this.y += other.y;
		return this;
	}

	/**
	 * Mutates and returns this.
	 * @param s
	 */
	addScalar_(s: number): Point {
		this.x += s;
		this.y += s;
		return this;
	}

	/**
	 * Returns a new Point that is this - other.
	 * @param other
	 */
	subNew(other: Point): Point {
		let res = new Point();
		this.sub(other, res);
		return res;
	}

	/**
	 * Returns (`this` - `other`) in `out`.
	 * @param other
	 * @param out
	 */
	sub(other: Point, out: Point): void {
		out.x = this.x - other.x;
		out.y = this.y - other.y;
	}

	/**
	 * Returns new point.
	 */
	copy(): Point {
		return new Point(this.x, this.y);
	}

	copyTo(other: Point): void {
		other.x = this.x;
		other.y = this.y;
	}

	/**
	 * Returns: this.
	 */
	copyFrom_(other: Point): Point {
		this.x = other.x;
		this.y = other.y;
		return this;
	}

	set_(x: number, y: number): Point {
		this.x = x;
		this.y = y;
		return this;
	}

	setFrom_(coords: number[]): Point {
		this.set_(coords[0], coords[1]);
		return this;
	}

	rotate_(theta: number): Point {
		// sin / cos of angle used below
		const sin_t = Math.sin(theta);
		const cos_t = Math.cos(theta);
		const sin_a = cos_t;
		const cos_a = sin_t;

		const x_x = this.x * cos_t;
		const x_y = this.x * sin_t;
		const y_x = this.y * cos_a;
		const y_y = this.y * sin_a;

		this.x = x_x - y_x;
		this.y = x_y + y_y;

		return this;
	}
}
