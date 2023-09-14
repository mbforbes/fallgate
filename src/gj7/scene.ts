/// <reference path="../../lib/pixi.js.d.ts" />

/// <reference path="../gj7/gamemap.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../engine/saving.ts" />

namespace Scene {

	type BGTile = {
		/**
		 * Path of image to use.
		 */
		img: string,
		/**
		 * Starting position. Top-left corner (anchored at (0,0)).
		 */
		pos: [number, number],
	}

	type MapInfo = {
		// json can be empty (or missing?)
		json: string,
		bottom?: string,
		bottom_tiles?: BGTile[],
		top?: string,
		top_tiles?: BGTile[],
	}

	/**
	 * Scene definition both in external files (scene objects in scenes.json)
	 * and internally. Wow! (-- Owen Wilson)
	 */
	export type Scene = {
		map: MapInfo,
		// blueprint can be empty or missing
		blueprint?: string,
		level: {
			name: string,
			number?: number,
			particleIDs?: string[],
			trackIDs?: string[],
		},
		scripts?: {
			start?: string,
			act?: string,
		}
	}

	type SceneName = string

	/**
	 * GUI override definitions
	 */
	export type Season = {
		text: {
			[key: string]: string,
		},
		sprites: {
			[key: string]: string,
		}
	}

	/**
	 * Gets the name of a script, handling defaults if not provided.
	 */
	function getStartScriptName(scripts: { start?: string } | null, gameMode: Game.Mode): string {
		// use whatever is provided if possible
		if (scripts != null && scripts.start != null) {
			return scripts.start;
		}
		// defaults
		if (this.gameMode === Game.Mode.DEBUG) {
			return 'StartLevelDev';
		} else {
			return 'StartLevel';
		}
	}

	/**
	 * Provides information on scenes.
	 *
	 * NOTE: This is pretty awkward. All the properties are publically
	 * accessible. This smells like OO-garbage. Consider dumping.
	 */
	export class InfoProvider {
		constructor(private manager: Manager) { }

		public get mapDims(): Point {
			return this.manager.mapDims
		}

		public get levelNum(): number {
			return this.manager.activeScene.level.number;
		}

		public get levelName(): string {
			return this.manager.activeScene.level.name;
		}

		public get act(): string {
			return this.manager.activeScene.scripts.act;
		}

		public get startScriptName(): string {
			return getStartScriptName(this.manager.activeScene.scripts, this.manager.gameMode);
		}
	}

	function sanityCheckMap(map: MapInfo): void {
		// because our map spec got more complicated
		if (map.bottom == null && map.bottom_tiles == null) {
			throw new Error('Map requires either .bottom or .bottom_tiles to be defined.');
		}
		if (map.bottom != null && map.bottom_tiles != null) {
			console.warn('Map should not have both .bottom and .bottom_tiles defined.');
		}
		if (map.top != null && map.top_tiles != null) {
			console.warn('Map should not have both .top and .top_tiles defined.');
		}
	}

	function getMapDims(map: MapInfo): Point {
		// use single image map if it's there.
		let bImg = map.bottom;
		if (bImg != null) {
			return new Point(
				PIXI.utils.TextureCache[bImg].width,
				PIXI.utils.TextureCache[bImg].height,
			)
		}

		// else we have bg image tiles. figure out total width and height.
		let maxW = 0, maxH = 0;
		for (let tile of map.bottom_tiles) {
			maxW = Math.max(maxW, tile.pos[0] + PIXI.utils.TextureCache[tile.img].width);
			maxH = Math.max(maxH, tile.pos[1] + PIXI.utils.TextureCache[tile.img].height);
		}
		return new Point(maxW, maxH);
	}

	/**
	 * Manages scenes. Part of the engine, ish, but also just kind of a plugin,
	 * that acts on it, really.
	 *
	 * Use the `infoProvider` to get info about the active scene.
	 *
	 * (I know, I know, "Manager" classes are gross. I started to write this as
	 * a function, but... right now I'll take not having to pass tones of
	 * objects around over some kind of preceived design cleanliness.)
	 */
	export class Manager {
		public infoProvider = new InfoProvider(this)
		public mapDims = new Point()
		public activeScene: Scene = null
		private _activeIdx = -1
		public get activeIdx(): number {
			return this._activeIdx
		}

		private mapJsons = new Map<SceneName, any>()
		private blueprintJsons = new Map<SceneName, any>()

		constructor(
			private ecs: Engine.ECS,
			private scriptRunner: Script.Runner,
			private gm: GameMap.GameMap,
			private scenes: Map<SceneName, Scene>,
			private seasons: Map<string, Season>,
			private progression: SceneName[],
			private credits: GJ7.Credits,
			resources: any,
			public gameMode: Game.Mode,
		) {
			// cache map and blueprint jsons for our own
			for (let [name, scene] of this.scenes.entries()) {
				if (scene.map.json != null && scene.map.json.length > 0) {
					this.mapJsons.set(name, resources[scene.map.json].data);
				}
				if (scene.blueprint != null && scene.blueprint.length > 0) {
					this.blueprintJsons.set(name, resources[scene.blueprint].data);
				}
			}
		}

		public nextLevel(): void {
			this.switchToRelative(1);
		}

		/**
		 * Player can trigger this explicitly.
		 */
		public resetScene(): void {
			this.switchToRelative(0, true);
		}

		/**
		 * Built for debugging.
		 * @param n Name of scene to switch to
		 */
		public switchToName(n: SceneName): void {
			for (let i = 0; i < this.progression.length; i++) {
				if (this.progression[i] === n) {
					this.switchTo(i);
					return;
				}
			}
			console.warn('Scene "' + n + '" not found. Ignoring request.');
		}

		public switchToRelative(increment: number, softReset = false): void {
			// mod doesn't work for negative numbers
			let idx = (this.activeIdx + increment) % this.progression.length;
			if (idx < 0) {
				idx = this.progression.length + idx;
			}
			this.switchTo(idx, softReset);
		}

		/**
		 * Adds BG or FG (set by `z`) image(s) to the game. At most one of
		 * `single` or `tiles` (neither OK, but not both) should be provided.
		 */
		private addImgs(single: string | null, tiles: BGTile[] | null, z: ZLevelWorld) {
			let queue: [Point, string][] = [];
			if (single != null) {
				// single image case
				queue.push([new Point(0, 0), single]);
			}
			if (tiles != null) {
				// tiled image case
				for (let tile of tiles) {
					queue.push([new Point(tile.pos[0], tile.pos[1]), tile.img]);
				}
			}

			// add 'em to the game!
			for (let [pos, img] of queue) {
				let e = this.ecs.addEntity();
				this.ecs.addComponent(e, new Component.Position(pos));
				this.ecs.addComponent(e, new Component.StaticRenderable(
					img,
					z,
					StageTarget.World,
					new Point(0, 0),
				));
			}
		}

		private switchTo(idx: number, softReset = false): void {
			// set new one as active
			this._activeIdx = idx;
			let active = this.progression[this.activeIdx];

			// load blueprint json. if none specified, we pass in null, which
			// is OK.
			let blueprintJson = null;
			if (this.blueprintJsons.has(active)) {
				blueprintJson = this.blueprintJsons.get(active);
			}
			this.gm.setBlueprint(blueprintJson);

			// destroy all entities. (placed after factory & blueprint parsing
			// because some systems will try to refill their entity pool during
			// their onClear(), and at the first level of the game, the factory
			// must exist for them to do so!)
			this.scriptRunner.clear();
			this.ecs.clear();

			// load json-defined map if possible
			if (this.mapJsons.has(active)) {
				console.log('Loading map "' + active + '".');
				this.gm.parseBareMap(this.mapJsons.get(active));
			}

			this.activeScene = this.scenes.get(active);
			let map = this.activeScene.map;

			// figure out the size of the bottom image as our map size.
			sanityCheckMap(map);
			this.mapDims = getMapDims(map);

			// put in bottom and top image(s)
			this.addImgs(map.bottom, map.bottom_tiles, ZLevelWorld.BG);
			this.addImgs(map.top, map.top_tiles, ZLevelWorld.Top);

			// do any particle modifications if specified
			let particleIDs = this.activeScene.level.particleIDs;
			if (particleIDs != null) {
				this.ecs.getSystem(System.ParticleRenderer).enableOnly(particleIDs);
			}

			// do any music modifications if specified
			let audioSystem = this.ecs.getSystem(System.Audio);
			let trackIDs = this.activeScene.level.trackIDs;
			if (trackIDs != null) {
				audioSystem.playMusic(trackIDs);
			}

			let bookkeeper = this.ecs.getSystem(System.Bookkeeper);

			// save progress
			Saving.save(active, audioSystem.getPlaying(), bookkeeper.serialize());

			// run startup script. also decide whether to tell bookkeeper about
			// this level (only for "normal" levels)
			let ssName = getStartScriptName(this.activeScene.scripts, this.gameMode);
			let setIdx = true;
			switch (ssName) {
				case 'StartLevel': {
					this.scriptRunner.run(new Script.StartLevel(this.infoProvider, this.gm));
					break;
				}

				case 'StartLevelDev': {
					this.scriptRunner.run(new Script.StartLevelDev(this.infoProvider, this.gm));
					break;
				}

				case 'StartLevelMultipartFirst': {
					this.scriptRunner.run(new Script.StartLevelMultipartFirst(this.infoProvider, this.gm));
					break;
				}

				case 'StartLevelMultipartMid': {
					this.scriptRunner.run(new Script.StartLevelMultipartMid(this.infoProvider, this.gm));
					setIdx = false;
					break;
				}

				case 'StartLevelMultipartLast': {
					this.scriptRunner.run(new Script.StartLevelMultipartLast(this.infoProvider, this.gm));
					setIdx = false;
					break;
				}

				case 'StartLevelTitle': {
					this.scriptRunner.run(new Script.StartLevelTitle());
					setIdx = false;
					break;
				}

				case 'StartLevelCredits': {
					this.scriptRunner.run(new Script.StartLevelCredits(this.credits));
					setIdx = false;
					break;
				}

				case 'StartLevelRecap': {
					this.scriptRunner.run(new Script.StartLevelRecap());
					setIdx = false;
					break;
				}

				case 'StartLevelAct': {
					this.scriptRunner.run(new Script.StartLevelAct(this.seasons.get(this.activeScene.scripts.act)));
					setIdx = false;
					break;
				}

				default: {
					throw new Error('Unrecognized start script: ' + ssName);
				}
			}

			// fresh start for new level
			if (setIdx && !softReset) {
				bookkeeper.setActive(idx);
			}
			if (softReset) {
				bookkeeper.softReset();
			}
		}
	}
}
