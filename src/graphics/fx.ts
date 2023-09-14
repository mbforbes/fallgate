/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/gamemap.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/animatable.ts" />

namespace FX {

	/**
	 * fx.json should map strings to these objects.
	*/
	export type Config = {
		factory: string,
		pool: number,
		duration: number
	}

	/**
	 * Wraps an animatable effect Entity with metadata for Emitter bookkeeping.
	*/
	type Pkg = {
		effect: Engine.Entity,
		elapsed: number,
	}

	/**
	 * Each Emitter controls emitting a single type of particles. It holds a
	 * pool of those particles and fields requests to display them.
	*/
	export class Emitter {
		private active = new Array<Pkg>()
		private pool = new Array<Pkg>()
		private baseFactoryObj: GameMap.ObjectJson = {
			x: 0,
			y: 0,
			rotation: 0,
			width: 0,
			height: 0,
		}

		constructor(private ecs: Engine.ECS, private factory: GameMap.GameMap,
					private id: string, private duration: number,
					private poolSize: number) {
			// sanity checking
			if (duration < -1) {
				console.error('Invalid duration for fx "' + id + '": ' + duration);
				return;
			}

			// NOTE: trying to avoid this here b/c otherwise we do it twice on game startup (because
			// onClear() called once at beginning of game to start first level).
			// this.refillPools();
		}

		public refillPools(): void {
			// drain any existing pools. When we transition levels, we still
			// have our active and pool reservoirs, but the entities are all
			// stale because they refer to non-existing entities!
			arrayClear(this.active);
			arrayClear(this.pool);

			// fill the pool
			for (let i = 0; i < this.poolSize; i++) {
				// build obj. note: not doing a check for
				// Component.Animatable.name because we'll crash if we don't
				// have it anyway.
				let entity = this.factory.produce(this.id, this.baseFactoryObj);
				let comps = this.ecs.getComponents(entity);
				let anim = comps.get(Component.Animatable);
				anim.pause = true;
				anim.visible = false;

				// put in pool
				this.pool.push({
					effect: entity,
					elapsed: 0,
				})
			}
		}

		/**
		 * API to emit particles
		 * @param x
		 * @param y
		 * @param direction optional number in [0, 2pi]; if null, picks
		 * randomly
		 */
		public emit(x: number, y: number, direction: number = null): void {
			// edge case: if nothing in pool, no emissions, ever.
			if (this.poolSize == 0) {
				return;
			}
			// if nothing in the pool, reclaim oldest active item.
			if (this.pool.length === 0) {
				this.reclaim(0);
			}

			// we have at least one item in the pool; activate and move to
			// active list
			let pkg = this.pool.pop();
			let comps = this.ecs.getComponents(pkg.effect);
			let pos = comps.get(Component.Position);
			let anim = comps.get(Component.Animatable);
			pos.setP(x, y);
			pos.angle = direction || Probability.uniformReal(0, Constants.TWO_PI);
			anim.reset = true;
			anim.visible = true;
			anim.pause = false;
			pkg.elapsed = 0;
			this.active.push(pkg);
		}

		/**
		 * Reclaims element i from active and returns to pool.
		 * @param i index of active list
		 */
		private reclaim(i: number): void {
			let pkg = this.active[i];
			let comps = this.ecs.getComponents(pkg.effect);
			let anim = comps.get(Component.Animatable);
			anim.visible = false;
			anim.pause = true;
			this.active.splice(i, 1);
			this.pool.push(pkg);
		}

		/**
		 * Engine calls this every frame.
		 * @param delta
		 */
		public update(delta: number): void {
			// if we have infinitely-lasting particles, don't ever worry about
			// reclaiming
			if (this.duration === -1) {
				return;
			}

			// reclaim loop
			for (let i = this.active.length - 1; i >= 0; i--) {
				// update elapsed
				let pkg = this.active[i];
				pkg.elapsed += delta;

				// recycle to pool if needed
				if (pkg.elapsed > this.duration) {
					this.reclaim(i);
				}
			}
		}
	}
}
