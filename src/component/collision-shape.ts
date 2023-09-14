/// <reference path="../core/base.ts" />
/// <reference path="../core/util.ts" />
/// <reference path="../gj7/constants.ts" />
/// <reference path="../engine/ecs.ts" />

/**
 * Any collision box can have one or more collision types, which are used by the
 * collision detection system to determine subsets of boxes to check.
 */
enum CollisionType {
	/**
	 * Used to mark a value that shouldn't appear in the game.
	 */
	Invalid = 0,

	/**
	 * Moves. Need to update position.
	 */
	Mobile,

	/**
	 * Should worry about collisions with other SOLID + MOBILE objects.
	 */
	Solid,

	/**
	 * Attacks seek vulnerable boxes (*evil smiley*)
	 */
	Attack,

	/**
	 * Vulnerable boxes can be damaged by attacks.
	 */
	Vulnerable,

	/**
	 * Destructible boxes further mark Vulnerable boxes because a player OR
	 * enemy can destroy them (whereas, with enemy friendly fire off, most
	 * vulnerable boxes are only player-attackable).
	 */
	Destructible,

	/**
	 * Shield boxes stop damage coming from attacks.
	 */
	Shield,

	/**
	 * Player-tagged boxes either come from the player (e.g., Attack+Player) or
	 * are the player (e.g., Mobile+Solid+Vulnerable+Player). This distinction
	 * is important for disabling friendly fire and having only the player be
	 * able to hit cauldrons for checkpoints.
	 */
	Player,

	/**
	 * Logic boxes do things when the player is in them (things like events,
	 * scripts, camera movement).
	 */
	Logic,

	/**
	 * Physics is similar to Logic, but player and enemies can encounter them
	 * (e.g., slow regions).
	 */
	Physics,

	/**
	 * Something the player can pick up.
	 */
	Item,

	/**
	 * Marks attacks that can damage the player at any time, but can only
	 * damage non-player entities if they are *doing* something (i.e., not
	 * "idle", "moving", or "charging").
	 */
	Environment,

	/**
	 * Marks attacks that can damage player or enemies at any time.
	 */
	Explosion,

	/**
	 * Marks a projectile; stopped by walls.
	 */
	Projectile,

	/**
	 * Marks a wall; stops projectiles.
	 */
	Wall,
}

interface MutationListener {
	dirty(): void
}

class MapMutationNotifier<K, V> {
	private m = new Map<K, V>()

	constructor(private listener: MutationListener) {}

	public get size(): number {
		return this.m.size;
	}

	public set(key: K, val: V): MapMutationNotifier<K,V> {
		this.m.set(key, val);
		this.listener.dirty();
		return this;
	}

	public keys(): IterableIterator<K> {
		return this.m.keys();
	}

	public get(key: K): V {
		return this.m.get(key);
	}

	public clear(): void {
		if (this.m.size > 0) {
			this.m.clear();
			this.listener.dirty();
		}
	}

	public entries(): IterableIterator<[K,V]> {
		return this.m.entries();
	}
}

class SetMutationNotifier<T> {
	private s = new Set<T>()

	constructor(private listener: MutationListener) {}

	public add(t: T): SetMutationNotifier<T> {
		if (!this.s.has(t)) {
			this.s.add(t);
			this.listener.dirty();
		}
		return this;
	}

	public has(t: T): boolean {
		return this.s.has(t);
	}

	public get size(): number {
		return this.s.size;
	}

	public clear(): void {
		if (this.s.size > 0) {
			this.s.clear()
			this.listener.dirty();
		}

	}
}

namespace Component {

	/**
	 * IMPORTANT! Game currently assumes `localVertices`, `cTypes`, `shape`,
	 * and `offset` never change.
	 */
	export class CollisionShape extends Engine.Component {

		//
		// assumed immutable
		//

		/**
		 * Used for optimization if shape is rectangle; else, is null.
		 */
		public localVertices: Point[]
		public cTypes = new Set<CollisionType>()
		public shape: Physics.Shape
		public offset: Point

		// cache distances set in constructor (reachability distances)
		public sqMaxDistance: number = -1
		public maxDistance: number = -1

		// optimization used for faster debug collision box rendering
		public get rectDims(): Point {
			if (this.shape !== Physics.Shape.Rectangle) {
				console.warn('Should not get rectDims for non-rectangle. Check .shape first.');
				return null;
			}
			return new Point(
				Math.abs(this.localVertices[0].x) * 2,
				Math.abs(this.localVertices[0].y) * 2,
			);
		}

		//
		// mutable state (signaling dirty component)
		//

		/**
		 * "Fresh" collisions are cleared and then added every frame. They are
		 * only not added if the colliding entity appears in the "resolved"
		 * list.
		 */
		public collisionsFresh = new MapMutationNotifier<Engine.Entity, Physics.CollisionInfo>(this)

		/**
		 * "Resolved" collisions are for the lifetime of the entity. This is
		 * meant for an attack, which should only damage another entity once.
		 */
		public collisionsResolved = new SetMutationNotifier<Engine.Entity>(this)

		/**
		 * Can be used to make the collision box inactive without having to
		 * destroy and recreate it. Disabled boxes don't collide with anything.
		 */
		public get disabled(): boolean {return this._disabled;}
		public set disabled(v: boolean) {
			if (this._disabled !== v) {
				this._disabled = v;
				this.dirty();
			}
		}
		private _disabled: boolean = false


		//
		// internally cached (not related to dirty component stuff)
		//

		private _sides: number
		private _axes: number
		private _globalVertices: Point[]
		private _globalEdges: Point[]
		private _globalAxes: Point[]
		private _repr: string

		// for when the vertices, edges, and axes are valid
		private _cacheComputedPoint = new Point(-Infinity, -Infinity);
		private _cacheComputedAngle = -Infinity;

		// just a normal cache var
		private cacheFullPos = new Point()

		private recomputeGlobalVertices(worldPos: Point, angle: number): void {
			for (let i = 0; i < this._sides; i++) {
				this._globalVertices[i].copyFrom_(this.localVertices[i]).rotate_(-angle).add_(worldPos);
			}
		}

		/**
		 * Recomputes internals if needed.
		 */
		private maybeRecomputeInternals(pos: Point, angle: number): void {
			// See whether computations are needed.
			if (this._cacheComputedPoint.equals(pos) && this._cacheComputedAngle === angle) {
				return;
			}

			// We do need to do the computations. Note that internally we must
			// add any offset to the provided position. (Can move this
			// outwards if we want to allow the offset to vary.)
			this.cacheFullPos.copyFrom_(pos).add_(this.offset);
			this.recomputeGlobalVertices(this.cacheFullPos, angle);
			Physics.getEdges(this._globalVertices, this._globalEdges, this._axes);
			Physics.getNormals(this._globalEdges, this._globalAxes);

			// Save so we don't have to do next time.
			this._cacheComputedPoint.copyFrom_(pos);
			this._cacheComputedAngle = angle;
		}

		/**
		 * Gets the vertices of this collision box (for SAT).
		 * @param pos
		 * @param angle
		 */
		public getVertices(pos: Point, angle: number): Point[] {
			this.maybeRecomputeInternals(pos, angle);
			return this._globalVertices;
		}

		/**
		 * Gets the axes (AKA normals) (for SAT).
		 * @param pos
		 * @param angle
		 */
		public getAxes(pos: Point, angle: number): Point[] {
			this.maybeRecomputeInternals(pos, angle);
			return this._globalAxes;
		}

		/**
		 * Factory for rectangle-shaped collision boxes.
		 */
		public static buildRectangle(dims: Point, cTypes: Set<CollisionType>, offset: Point = new Point()): CollisionShape {
			return new CollisionShape([
					new Point(-dims.x/2, -dims.y/2),
					new Point(dims.x/2, -dims.y/2),
					new Point(dims.x/2, dims.y/2),
					new Point(-dims.x/2, dims.y/2),
				],
				cTypes,
				Physics.Shape.Rectangle,
				offset,
			);
		}

		constructor(
			localVertices: Point[],
			cTypes: Set<CollisionType>,
			shape: Physics.Shape = Physics.Shape.Polygon,
			offset: Point = new Point(),
		) {
			super();

			// defensively copy in main settings
			let sides = localVertices.length;
			this._sides = sides;
			this.localVertices = new Array<Point>(sides);
			for (let i = 0; i < sides; i++) {
				this.localVertices[i] = localVertices[i].copy();
			}
			setClone(cTypes, this.cTypes);
			this.shape = shape;
			this.offset = offset.copy()
			// Rectangles only have two unique axes.
			this._axes = shape === Physics.Shape.Rectangle ? sides / 2 : sides;

			// init the arrays that we want
			this._globalVertices = new Array<Point>(sides);
			this._globalEdges = new Array<Point>(this._axes);
			this._globalAxes = new Array<Point>(this._axes);
			for (let arr of [this._globalVertices, this._globalEdges, this._globalAxes]) {
				for (let i = 0; i < arr.length; i++) {
					arr[i] = new Point();
				}
			}

			// max distance here ignores offset; offset is taken into account
			// in code that uses the max distance by first computing the
			// shapes' centers with pos + offset.
			let maxDSq = -1;
			for (let i = 0; i < sides; i++) {
				maxDSq = Math.max(maxDSq, localVertices[i].l2Squared());
			}
			this.sqMaxDistance = maxDSq;
			this.maxDistance = Math.sqrt(maxDSq);

			// cache for toString()
			this._repr = '[' + this.localVertices + '] ' + setString(this.cTypes, (c: CollisionType) => CollisionType[c]);
		}

		public toString(): string {
			return this._repr;
		}
	}
}
