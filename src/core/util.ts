/**
 * Returns whether a contains all items in b.
 */
function setContains<T>(a: Set<T>, b: Set<T>): boolean {
	for (let want of b) {
		if (!a.has(want)) {
			return false;
		}
	}
	return true;
}

/**
 * Makes dest exactly like source (but with same underlying objects).
 */
function setClone<T>(source: Set<T>, dest: Set<T>): void {
	dest.clear();
	for (let v of source) {
		dest.add(v);
	}
}

/**
 * Turns the Set s into a string by calling func on each element and comma-
 * separating the result.
 */
function setString<T>(s: Set<T>, func: (T) => string): string {
	// Creating an array per frame is bad, but let's optimize later if we need
	// to (given this should be used debug-only).
	let res: string[] = [];
	for (let el of s) {
		res.push(func(el));
	}
	return res.join(', ');
}

/**
 * Extends base with extension and returns result. base and extension are not
 * mutated. Shallow copying only.
 */
function objExtend(base: Object, extension: Object): Object {
	let result = {};
	for (let key in base) {
		result[key] = base[key];
	}
	for (let key in extension) {
		result[key] = extension[key];
	}
	return result;
}

/**
 * Mutates `base` by modifying `base`.`property` with `extension`.`property`.
 *
 * Does full override if `base`.`property` is missing, or else does a per-key
 * override of all properties found in `extension`.`property`.
 *
 * If `extension`.`property` is null, `base` is simply returned unmodified.
 *
 * NOTE: Any copying is done by reference (without cloning) to point components
 * of `base` directly to those of `extension`. Do copying first if this
 * matters.
 */
function objOverride<T>(base: T, extension: T, property: string): void {
	// extension doesn't have property; just return base
	if (extension[property] == null) {
		return;
	}

	// base doesn't have property; copy extension's property (ref copy if obj)
	if (base[property] == null) {
		base[property] = extension[property];
		return;
	}

	// both have property; do per-key copy/override of extension's properties
	// (ref copies if objs)
	for (let key in extension[property]) {
		base[property][key] = extension[property][key];
	}
}

/**
 * Takes a simple javascript object (e.g., {a: "foo", b: 5}) and turns into a
 * Map object.
 * @param obj
 */
function objToMap<V>(obj: object): Map<string, V> {
	let res = new Map<string, V>();
	for (let key in obj) {
		res.set(key, obj[key]);
	}
	return res;
}

/**
 * Turns the Map m into a string by calling keyFunc on each key, valFun on each
 * val, and comma-separating the resulting 'keyStr (valStr)' pieces.
 */
function mapString<K, V>(m: Map<K, V>, keyFunc: (K) => string, valFunc: (V) => string): string {
	// Creating an array per frame is bad, but let's optimize later if we need
	// to (given this should be used debug-only).
	let res: string[] = [];
	for (let key of m.keys()) {
		res.push(keyFunc(key) + ' (' + valFunc(m.get(key)) + ')');
	}
	return res.join(', ');
}

/**
 * Returns a string representing all of the keys of a map.
 * @param m
 */
function mapKeyString<K, V>(m: Map<K, V>): string {
	return mapKeyArr(m).join(', ');
}

/**
 * Adds all of `other` to `m`, overwriting as needed.
 * @param m
 * @param other
 */
function mapAdd<K, V>(m: Map<K, V>, other: Map<K, V>): void {
	for (let [key, val] of other.entries()) {
		m.set(key, val);
	}
}

/**
 * Makes dest exactly like source (but with same underlying objects).
 * @param source
 * @param dest
 */
function mapClone<K, V>(source: Map<K, V>, dest: Map<K, V>): void {
	dest.clear();
	for (let [key, val] of source.entries()) {
		dest.set(key, val);
	}
}

/**
 * Like m.keys(), but returns an array instead of an iterator.
 * @param m
 */
function mapKeyArr<K, V>(m: Map<K, V>): K[] {
	let res: K[] = [];
	for (let key of m.keys()) {
		res.push(key);
	}
	return res;
}

/**
 * Removes all elements from an array.
 */
function arrayClear<T>(arr: Array<T>): void {
	while (arr.length > 0) {
		arr.pop();
	}
}

/**
 * Copies a array.
 */
function arrayCopy<T>(array: Array<T>): Array<T> {
	let res = new Array<T>();
	for (let el of array) {
		res.push(el);
	}
	return res;
}

//
// Let's talk about enums.
//
// For the following enum:
//
//	   enum Foo {
//		   Bar = 0,
//		   Baz,
//	   }
//
// the following object will be generated in js:
//
//	   > Foo
//	   Object
//		   0: "Bar"
//		   1: "Baz"
//		   Bar: 0
//		   Baz: 1
//
// so, you can get the name of an enum val by doing
//
//	   > Foo[Foo.Bar]
//	   "Bar"
//

/**
 * Gets the name of an enum's value; e.g., Foo.Bar -> "Bar".
 */
// function enumValToName(e: any, v)

/**
 * Gets all the numerical values of an enum in sorted order.
 */
function enumSortedVals(e: any): number[] {
	let vals: number[] = new Array<number>();
	for (let key in e) {
		let val = e[key];
		if (typeof val === 'number') {
			vals.push(val);
		}
	}
	vals.sort(sortNumeric);
	return vals;
}

/**
 * Gets all of the string values (names) of an enum in sorted order.
 * @param e
 */
function enumSortedNames(e: any): string[] {
	let nums = enumSortedVals(e);
	let names: string[] = [];
	for (let num of nums) {
		names.push(e[num]);
	}
	return names;
}

/**
 * Miliseconds to display-friendly string for users. Examples:
 * - 18752.100000000000037859 -> '18.752s'
 * - 65752.100000000000037859 -> '1m 5.752s'
 * @param ms
 */
function msToUserTime(ms: number): string {
	let full_s = ms / 1000;
	let m = Math.floor(full_s / 60);
	let s = (full_s % 60).toFixed(3);
	let mStr = m > 0 ? m + 'm ' : '';
	return mStr + s + 's';
}

/**
 * NEW! ms to display-friendly string for users, with two parts and better fmt.
 * Returns 2 parts:
 *    [h:][m:]ss
 *    .ddd
 * - 9752.100000000000037859 ->   '0:09', '.752'
 * - 18752.100000000000037859 ->  '0:18', '.752'
 * - 65752.100000000000037859 ->  '1:05', '.752'
 * - 165752.100000000000037859 -> '2:45', '.752'
 * - 3600500.00 ->             '1:00:00', '.500'
 * - 3720500.00 ->             '1:02:00', '.500'
 * @param ms
 */
function msToUserTimeTwoPart(ms: number): [string, string] {
	let full_s = ms / 1000;
	let h = Math.floor(full_s / 3600);
	let m = Math.floor((full_s % 3600) / 60);
	let s = Math.floor(full_s % 60);
	let dStr = (full_s % 1).toFixed(3).slice(1);
	let hStr = h > 0 ? h + ':' : '';
	let mStr = h > 0 && m < 10 ? '0' + m + ':' : m + ':';
	let sStr = s < 10 ? '0' + s : '' + s;
	return [hStr + mStr + sStr, dStr];
}

/**
 * Like Python's collections.Counter
 */
class Counter<T> {
	private data = new Map<T, number>()

	public static from<T>(i: IterableIterator<T>): Counter<T> {
		let c = new Counter<T>();
		for (let val of i) {
			c.increment(val);
		}
		return c;
	}

	public clear(): void {
		this.data.clear();
	}

	public increment(key: T): void {
		if (!this.data.has(key)) {
			this.data.set(key, 1);
		} else {
			let cur = this.data.get(key);
			this.data.set(key, cur + 1);
		}
	}

	public get(key: T): number {
		if (!this.data.has(key)) {
			return 0;
		}
		return this.data.get(key);
	}

	public entries(): IterableIterator<[T, number]> {
		return this.data.entries();
	}
}
