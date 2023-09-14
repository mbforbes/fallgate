/// <reference path="../engine/ecs.ts" />

namespace Script {

	/**
	 * Runs scripts.
	 */
	export class Runner {
		private scripts = new Array<Script>()

		constructor(private ecs: Engine.ECS, private eventsManager: Events.Manager) {}

		/**
		 * Add a script to the active set of running scripts. This init()s the
		 * script.
		 *
		 * @param script
		 */
		run(script: Script): void {
			script._init(this.ecs, this.eventsManager, this);
			script.init();
			this.scripts.push(script);
		}

		/**
		 * Stops all scripts from running immediately.
		 */
		clear(): void {
			arrayClear(this.scripts);
		}

		/**
		 * Called every frame to run code blocks for any scripts that are
		 * ready, update long-running blocks of scripts, and clean up finished
		 * scripts.
		 *
		 * @param delta Tick time in ms
		 */
		update(delta: number): void {
			// loop through scripts, updating them, and removing any that have
			// finished. looping backwards for easy removal during loop.
			for (let i = this.scripts.length - 1; i >= 0; i--) {
				this.scripts[i].update(delta);
				if (this.scripts[i].finished) {
					this.scripts.splice(i, 1);
				}
			}
		}
	}

	export type FunctionPackage = {
		func: (...args: any[]) => void,
		args: any,
	}

	/**
	 * Takes in game time elapsed, returns whether finished.
	 */
	type UpdateFunction = (delta: number) => boolean

	/**
	 * Actual Scripts subclass this to script game events. It pairs time delays
	 * (in ms) with code to run once after that amount of time has elapsed.
	 *
	 * Scripts should be the opposite of Systems: they should only need to run
	 * on a few frames (as opposed to every frame), they should not bookkeep
	 * subsets of entities (though they can use subsystems to do this), and they
	 * should be created and then cleaned up (as opposed to persisting
	 * throughout the game).
	 */
	export abstract class Script {

		//
		// init'd later
		//

		/**
		 * This is where the delays (in ms) and code to run go.
		 */
		abstract code: Map<number, FunctionPackage>

		/**
		 * Provided in init().
		 */
		public ecs: Engine.ECS

		/**
		 * Provided in init().
		 */
		public eventsManager: Events.Manager

		/**
		 * Provided in init().
		 */
		protected runner: Runner

		/**
		 * Generated in init(). Contains the ordered list of delays (keys of
		 * this.code) that are remaining to execute.
		 */
		private todo: number[]


		//
		// init'd now
		//

		/**
		 * This marks whether the script has finished executing and can be
		 * cleaned up. The script runner observes this.
		 */
		public get finished(): boolean {
			return this.todo.length === 0 && this.active.length == 0;
		}

		/**
		 * Used as desired by script to store functions that need to be
		 * updated.
		 */
		protected active = new Array<UpdateFunction>()

		/**
		 * Contains total time elapsed since script was started.
		 */
		private elapsed: number = 0

		/**
		 * The script runner calls this to pass in the ECS, and it allows the
		 * script to do internal bookkeeping setup.
		 *
		 * (Most things creating Scripts will have the ECS anyway, but it's
		 * cleaner to avoid having them all have to pass it in.)
		 */
		_init(ecs: Engine.ECS, eventsManager: Events.Manager, runner: Script.Runner): void {
			this.ecs = ecs;
			this.eventsManager = eventsManager;
			this.runner = runner;
			this.todo = mapKeyArr(this.code);
			this.todo.sort(sortNumeric);
		}

		/**
		 * Let the script do any custom initialization.
		 */
		init(): void {}

		public update(delta: number): void {
			this.elapsed += delta;

			let nToRemove = 0;
			for (let delay of this.todo) {
				// If the appropriate delay has passed, call the function, and
				// mark that we should remove it (can't remove during iteration
				// because that screws up the iterator).
				if (this.elapsed >= delay) {
					let pkg = this.code.get(delay);
					pkg.func.apply(this, pkg.args);
					nToRemove++;
				} else {
					// Since our delays are sorted, once we can't do one of
					// them, we won't be able to do the rest.
					break;
				}
			}

			// remove any code we've finished
			for (let i = 0; i < nToRemove; i++) {
				this.todo.shift();
			}

			// run any active functions, and remove them if they've finished
			for (let i = this.active.length - 1; i >= 0; i--) {
				if (this.active[i].call(this, delta)) {
					this.active.splice(i, 1);
				}
			}
		}
	}
}
