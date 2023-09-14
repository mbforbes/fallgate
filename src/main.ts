/// <reference path="../lib/stats.d.ts" />
/// <reference path="../lib/pixi.js.d.ts" />

/// <reference path="core/base.ts" />
/// <reference path="game/game.ts" />
/// <reference path="game/sandbox3.ts" />

/**
 * Where execution begins and where the main loop happens. This is currently
 * chrome-specific.
 */
namespace Main {

	class Ready implements Game.ReadySignal {
		public done() {
			// kick off both update and rendering
			setTimeout(update);
			requestAnimationFrame(render);
		}
	}

	class Preloader {

		constructor() {
			// global PIXI settings we set first
			PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST

			// kick off the loading!
			let loader = PIXI.loader;
			loader.add(Constants.FN_CONFIG);
			loader.once('complete', this.launch, this);

			PIXI.loader.onProgress.detachAll();
			PIXI.loader.onProgress.add((loader: PIXI.loaders.Loader) => {
				// console.log('Loader 1: ' + loader.progress);
				let pMin = 0;
				let pMax = 5;
				let val = Math.round(pMin + pMax * (loader.progress/100));
				document.getElementById('progressBar').setAttribute('value', '' + val);
				document.getElementById('loading').innerText = 'Loading Fallgate [' + val + '%]';
			});

			loader.load();
		}

		public launch(loader: PIXI.loaders.Loader, config: any): void {
			new Loop(config[Constants.FN_CONFIG].data);
		}
	}

	class Loop {
		// Singleton so Chrome can access this. (Obviously should attempt
		// to minimize usage.)
		public static instance: Loop
		private targetUpdate = 16.666
		private updateStats: Stats = new Stats()
		private renderStats: Stats = new Stats()
		private game: Game.Game
		private lastFrameStart: number = -1

		constructor(config: Game.Config) {
			Loop.instance = this;

			// This is where we pick the game to run.
			let ready = new Ready();
			this.game = new Game.Sandbox3(config, this.updateStats, this.renderStats);
			this.game.load2(ready);
		}

		/**
		 * Main game update function. Called after `statsSkipFrames` frames and
		 * forever after.
		 */
		public update(): void {
			let frameStart = (performance || Date).now();

			// track wall time for game systems that run when the ECS gametime
			// is frozen.
			let wallDelta = this.lastFrameStart != -1 ?
				frameStart - this.lastFrameStart :
				Constants.DELTA_MS;
			this.lastFrameStart = frameStart;

			// pre: start stats tracking
			this.updateStats.begin();

			// note: implement lag / catchup sometime later. need to measure
			// timing too if we want this.
			this.game.update(wallDelta, Constants.DELTA_MS);

			// post: tell stats done
			this.updateStats.end();

			// Pick when to run update again. Attempt to run every
			// `this.targetUpdate` ms, but if going too slow, just run as soon
			// as possible.
			let elapsed = (performance || Date).now() - frameStart;
			let nextDelay = Math.max(this.targetUpdate - elapsed, 0);
			setTimeout(update, nextDelay);
		}

		public render(): void {
			this.renderStats.begin();
			this.game.render();
			this.renderStats.end();

			// ask chrome to call this again
			requestAnimationFrame(render);
		}
	}

	/**
	 * Update
	 * @param ts timestamp
	 */
	let update = function(): void {
		Loop.instance.update();
	}

	let render = function(ts: number): void {
		Loop.instance.render()
	}


	// Execution begins here.
	new Preloader();
}
