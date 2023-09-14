/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="../../lib/pixi-layers.d.ts" />
/// <reference path="../../lib/pixi-packer-parser.d.ts" />

/// <reference path="game.ts" />
/// <reference path="../core/keyboard.ts" />
/// <reference path="../core/mouse.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../engine/events.ts" />
/// <reference path="../engine/saving.ts" />
/// <reference path="../system/audio.ts" />
/// <reference path="../graphics/stage.ts" />
/// <reference path="../gj7/sound.ts" />
/// <reference path="../gj7/conversion.ts" />
/// <reference path="../system/ai-cow.ts" />
/// <reference path="../system/ai-brawler.ts" />
/// <reference path="../system/activity.ts" />
/// <reference path="../system/attack.ts" />
/// <reference path="../system/block.ts" />
/// <reference path="../system/body.ts" />
/// <reference path="../system/animation-renderer.ts" />
/// <reference path="../system/collision-block.ts" />
/// <reference path="../system/collision-damage.ts" />
/// <reference path="../system/collision-movement.ts" />
/// <reference path="../system/collision-detection.ts" />
/// <reference path="../system/crosshair.ts" />
/// <reference path="../system/debug.ts" />
/// <reference path="../system/defend.ts" />
/// <reference path="../system/debug-camera.ts" />
/// <reference path="../system/debug-collision-renderer.ts" />
/// <reference path="../system/debug-timing-renderer.ts" />
/// <reference path="../system/follow-camera.ts" />
/// <reference path="../system/movement.ts" />
/// <reference path="../system/player-input.ts" />
/// <reference path="../system/selector.ts" />
/// <reference path="../system/static-renderer.ts" />
/// <reference path="../system/stagger.ts" />
/// <reference path="../system/knockback.ts" />
/// <reference path="../system/swing.ts" />
/// <reference path="../system/particle-renderer.ts" />
/// <reference path="../system/text-renderer.ts" />
/// <reference path="../system/tracking.ts" />
/// <reference path="../system/combo.ts" />

// for debugging
let g

namespace Game {
	//
	// mapping for config states
	//
	type ResConfig = {
		viewport: Point,
		gamescale: number,
		zoom: number,
	}
	let baseRes = new Point(640, 360);
	function getResConfig(scale: number): ResConfig {
		return {
			viewport: baseRes.copy().scale_(scale),
			gamescale: scale,
			zoom: 0.3 * scale,
		}
	}

	//
	// user-set global config
	//
	type UserConfig = {
		resScale: number,
	}
	let userConfig: UserConfig = {
		resScale: 2,
	}

	export function setRes(resNum: number): void {
		// set the scale
		userConfig.resScale = resNum;

		// update the buttons
		for (let i = 1; i <= 6; i++) {
			let className = resNum == i ? 'resButton active' : 'resButton';
			let el = document.getElementById('res' + i);
			if (el != null) {
				el.className = className;
			}
		}
	}

	/**
	 * Must be activated by user gesture.
	 *
	 * @param el the element to take fulscreen. (not typing because typescript
	 * gets mad about such unpure things like cross browser compat stuff.)
	 */
	function openFullscreen(el) {
		if (el.requestFullscreen) {
			el.requestFullscreen();
		} else if (el.mozRequestFullScreen) { /* Firefox */
			el.mozRequestFullScreen();
		} else if (el.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
			el.webkitRequestFullscreen();
		} else if (el.msRequestFullscreen) { /* IE/Edge */
			el.msRequestFullscreen();
		}
	}

	export class Sandbox3 implements Game {

		// game-scoped vars: suff we can make now
		private stage = new Stage.MainStage()
		private eventsManager = new Events.Manager()
		private ecs = new Engine.ECS(this.eventsManager)
		private scriptRunner = new Script.Runner(this.ecs, this.eventsManager)
		private particleJSONS: Map<string, any> = new Map()

		// ... and sutff we make later
		private audio: System.Audio
		private mode: Mode
		private pixi_renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer
		private gm: GameMap.GameMap
		private r: ReadySignal
		private clockCentral: Measurement.ClockTower
		private sceneManager: Scene.Manager
		private subConfigs: {
			attributes: Map<string, Attributes.All>,
			controls: GJ7.Controls,
			credits: GJ7.Credits,
			factory: Map<string, any>,
			fx: Map<string, FX.Config>,
			gui: GUI.File,
			instructions: GJ7.Instructions,
			particles: Graphics.ParticlesConfig,
			progression: string[],
			scenes: Map<string, Scene.Scene>,
			seasons: Map<string, Scene.Season>,
			shields: Map<string, Shield.FullShieldData>,
			sounds: Sound.Collection,
			weapons: Map<string, Weapon.FullWeaponData>,
		}

		constructor(private config: Game.Config, private updateStats: Stats, private renderStats: Stats) {
			this.mode = this.config.mode === 'release' ? Mode.RELEASE : Mode.DEBUG;
		}

		/**
		 * In main.ts, the overall config.json is loaded. That tells us a bunch
		 * of additional resources to load. Here, we load them all.
		 */
		public load2(ready: ReadySignal) {
			// save for later --- we'll signal when we're done
			this.r = ready;

			// queue up loading of all subconfigs
			for (let key in this.config.subConfigs) {
				let fn = this.config.subConfigs[key];
				PIXI.loader.add(fn, fn);
			}

			// single sheet with texture packer: load single sheet (loading json
			// triggers loading texture)
			// let fn = 'assets/sheets/sheet.json'
			// PIXI.loader.add(fn, fn);

			// multi sheet with pixi packer and parser. This add spritesheet parsing
			// middleware and loads up json, which triggers loading all textures.
			PIXI.loader.use(pixiPackerParser(PIXI));
			let fn = 'assets/new-sheets/main_en_full.json'
			PIXI.loader.add(fn, fn);

			// kick off loading
			PIXI.loader.once('complete', this.parse, this);

			PIXI.loader.onProgress.detachAll();
			PIXI.loader.onProgress.add((loader: PIXI.loaders.Loader) => {
				// console.log('Loader 2: ' + loader.progress);
				let pMin = 5;
				let pMax = 30;
				let val = Math.round(pMin + pMax * (loader.progress / 100));
				document.getElementById('progressBar').setAttribute('value', '' + val);
				document.getElementById('loading').innerText = 'Loading Fallgate [' + val + '%]';
			});

			PIXI.loader.load();
		}

		private parse(loader: PIXI.loaders.Loader, resources: any): void {
			this.parseConfigs(resources);
			this.parseGamemap(resources);
			this.load3();
		}

		private parseConfigs(resources: any): void {
			this.subConfigs = {
				attributes: Conversion.jsonToAttributes(resources[this.config.subConfigs.attributes].data),
				controls: resources[this.config.subConfigs.controls].data as GJ7.Controls,
				credits: resources[this.config.subConfigs.credits].data as GJ7.Credits,
				factory: resources[this.config.subConfigs.factory].data,
				fx: Conversion.jsonToFXConfigs(resources[this.config.subConfigs.fx].data),
				gui: resources[this.config.subConfigs.gui].data as GUI.File,
				instructions: resources[this.config.subConfigs.instructions].data as GJ7.Instructions,
				particles: resources[this.config.subConfigs.particles].data as Graphics.ParticlesConfig,
				progression: resources[this.config.subConfigs.scenes].data.progression,
				scenes: Conversion.jsonToScenes(resources[this.config.subConfigs.scenes].data.scenes),
				seasons: Conversion.jsonToSeasons(resources[this.config.subConfigs.seasons].data),
				shields: Conversion.jsonToShields(resources[this.config.subConfigs.shields].data),
				sounds: Conversion.jsonToSounds(resources[this.config.subConfigs.sounds].data),
				weapons: Conversion.jsonToWeapons(resources[this.config.subConfigs.weapons].data),
			}
		}

		private parseGamemap(resources: any): void {
			this.gm = new GameMap.GameMap(
				this.ecs,
				this.subConfigs.weapons,
				this.subConfigs.shields,
				this.subConfigs.attributes);

			// deprecated: parse map as one blob
			// this.gm.parseMap(resources[this.config.mapJson].data);

			// new: parse factory now, then parse objects later (in scene)
			this.gm.parseFactory(this.subConfigs.factory);

		}

		/**
		 * Some config files (like the map or particles) have yet more config
		 * files that they specify. Hence, we do a third round of loading.
		 */
		private load3(): void {
			// load json and pngs for scenes. We track what we request for
			// bookkeeping becacuse PIXI's loader doesn't seem to have a  "has"
			// method, but it crashes if you add something twice.
			let requested = new Set<string>();
			for (let scene of this.subConfigs.scenes.values()) {
				let assets = [
					scene.map.json,
					scene.map.bottom,
					scene.map.top,
					scene.blueprint,
				];
				if (scene.map.bottom_tiles != null) {
					for (let tile of scene.map.bottom_tiles) {
						assets.push(tile.img);
					}
				}
				if (scene.map.top_tiles != null) {
					for (let tile of scene.map.top_tiles) {
						assets.push(tile.img);
					}
				}
				for (let asset of assets) {
					if (asset == null || asset.length === 0 || requested.has(asset)) {
						continue;
					}
					PIXI.loader.add(asset, asset);
					requested.add(asset);
				}
			}

			// also load individual particle config jsons
			for (let emitterID in this.subConfigs.particles) {
				let pjson = this.subConfigs.particles[emitterID].config;
				if (requested.has(pjson)) {
					continue;
				}
				PIXI.loader.add(pjson, pjson);
				requested.add(pjson);
				this.particleJSONS.set(pjson, null);
			}

			// kick it off
			PIXI.loader.once('complete', this.parseLoad3, this);

			PIXI.loader.onProgress.detachAll();
			PIXI.loader.onProgress.add((loader: PIXI.loaders.Loader) => {
				// console.log('Loader 3: ' + loader.progress);
				let pMin = 35;
				let pMax = 65;
				let val = Math.round(pMin + pMax * (loader.progress / 100));
				document.getElementById('progressBar').setAttribute('value', '' + val);
				document.getElementById('loading').innerText = 'Loading Fallgate [' + val + '%]';
			});

			PIXI.loader.load();
		}

		private parseLoad3(loader: PIXI.loaders.Loader, resources: any): void {
			// note that we'll load in the first scene later
			this.sceneManager = new Scene.Manager(
				this.ecs,
				this.scriptRunner,
				this.gm,
				this.subConfigs.scenes,
				this.subConfigs.seasons,
				this.subConfigs.progression,
				this.subConfigs.credits,
				resources,
				this.mode,
			);

			// save contents of individual particle config JSON files.
			for (let pjson of mapKeyArr(this.particleJSONS)) {
				this.particleJSONS.set(pjson, resources[pjson].data);
			}

			// this kicks off audio to do its own loading
			this.audio = new System.Audio(this.subConfigs.sounds).load();

			// yay done ready to build game
			this.makeStartButton();
		}

		private makeStartButton(): void {
			// remove loading sign / progress bar.
			document.getElementById('loading').remove();
			document.getElementById('progressBar').remove();

			// add start game button
			let startButton = document.createElement('button');
			startButton.className = 'startButton';
			startButton.innerText = 'Start game'
			startButton.onclick = (mouseEvent) => {
				this.maybeStartGame();
			}
			let loader = document.getElementById('loader');
			loader.appendChild(document.createElement('br'));
			loader.appendChild(startButton);

		}

		private maybeStartGame(): void {
			// fade out all loader content
			// NOTE: doesn't work. maybe chrome chugging too hard.
			// document.getElementById('loader').style.opacity = "0";

			// kick off game
			this.setup();
		}

		/**
		 * Called once loading is complete and user has provided sufficient
		 * settings to build the game!
		 */
		private setup(): void {
			// get corresponding config for game mode
			let resConfig: ResConfig = getResConfig(userConfig.resScale);

			// PIXI setup
			this.pixi_renderer = PIXI.autoDetectRenderer(
				resConfig.viewport.x,
				resConfig.viewport.y, {
				backgroundColor: Constants.BGColor
			}
			);

			// Remove loading / setup HTML elements
			document.getElementById('loader').remove();

			// Add HTML elements for web renderer and debug reports.
			this.pixi_renderer.view.className = 'game';
			this.pixi_renderer.view.id = 'game';
			let gameParent = document.getElementById('gameParent');
			gameParent.appendChild(this.pixi_renderer.view);

			// sound effects toggle
			let musicButton = document.createElement('button');
			musicButton.className = 'fsButton';
			musicButton.innerText = 'Toggle music';
			musicButton.onclick = (ev: MouseEvent) => {
				this.ecs.getSystem(System.Audio).toggleMusic();
			};
			gameParent.appendChild(musicButton);

			// sound effects toggle
			let effectsButton = document.createElement('button');
			effectsButton.className = 'fsButton';
			effectsButton.innerText = 'Toggle sound effects';
			effectsButton.onclick = (ev: MouseEvent) => {
				this.ecs.getSystem(System.Audio).toggleEffects();
			};
			gameParent.appendChild(effectsButton);

			// speedrun timer (!)
			let srButton = document.createElement('button');
			srButton.className = 'fsButton';
			srButton.innerText = 'Toggle speedrun timer';
			srButton.onclick = (ev: MouseEvent) => {
				this.ecs.toggleSystem(System.BookkeeperRenderer);
			};
			gameParent.appendChild(srButton);

			// clear save data
			let saveClearButton = document.createElement('button');
			saveClearButton.className = 'fsButton';
			saveClearButton.innerText = 'Clear save data';
			saveClearButton.onclick = (ev: MouseEvent) => {
				if (confirm("Are you sure you want to clear your Fallgate save data?\n\n" +
					"This will will remove all of your progress through the game.\n\n" +
					"If you choose OK, you can then reload the game to start over."
				)) {
					this.ecs.getSystem(System.GUIManager).runSequence(
						'notification', new Map([['notification', 'save data cleared']]));
					Saving.clear();
				}
			};
			gameParent.appendChild(saveClearButton);

			// full screen
			let fsButton = document.createElement('button');
			fsButton.className = 'fsButton';
			fsButton.innerText = 'Open in fullscreen';
			fsButton.onclick = (ev: MouseEvent) => {
				openFullscreen(this.pixi_renderer.view);
			};
			gameParent.appendChild(fsButton);

			// extra panels (and global game ref) added in debug mode only
			let cheapCollPanel: Stats.Panel = null
			let expensiveCollPanel: Stats.Panel = null
			if (this.mode == Mode.DEBUG) {
				// setup
				let statsParent = document.getElementById('statsRow');

				// render and update panels
				let panels = [this.updateStats, this.renderStats];
				for (let p of panels) {
					p.dom.className = 'stats';
					p.dom.style.position = 'relative';	// override hardcode
					statsParent.appendChild(p.dom);
				}

				// Add addl. debug stats panels
				let customStats = new Stats();
				cheapCollPanel = customStats.addPanel(new Stats.Panel('cCks', '#f8f', '#212'));
				expensiveCollPanel = customStats.addPanel(new Stats.Panel('xCks', '#ff8', '#221'));
				customStats.showPanel(3);
				customStats.dom.className = 'stats';
				customStats.dom.style.position = 'relative';  // override hardcode
				statsParent.appendChild(customStats.dom);

			}

			// TODO: move back to debug-only.
			// give the console a reference to the game
			g = this;

			// Prevent right click even so we can correctly handle right mouse
			// button events.
			let gameEl = document.getElementById('game');
			gameEl.addEventListener('contextmenu', (e) => {
				e.preventDefault();
			});

			// Time measurement.
			if (this.mode == Mode.DEBUG) {
				this.clockCentral = new Measurement.ClockCentral()
			} else {
				this.clockCentral = new Measurement.FakeClockTower()
			}
			this.clockCentral.init();

			// disable pixi's interaction manager, which causes both pixi's
			// ticks to fire AND expensive object traversals when it intercepts
			// mouse events.
			let im = this.pixi_renderer.plugins.interaction as PIXI.interaction.InteractionManager;
			im.destroy();

			// init our events manager
			this.eventsManager.init(this.ecs, this.scriptRunner);

			// common resources for systems
			let world = this.stage.camera_get(StageTarget.World);
			let hud = this.stage.camera_get(StageTarget.HUD);
			let translator = new Stage.Translator(
				hud, world, resConfig.viewport.copy(), resConfig.gamescale);

			let keyboard = new Keyboard(this.eventsManager);
			let mouse = new Mouse(resConfig.viewport.copy());

			// Set up lighting layer and texture it renders to. Lightbulbs are
			// added later.
			//
			// lightingLayer = Layer (container)
			// - internally, lights should be ADD'ed (blend mode)
			// - renders to a texture
			// - clear color set to grey (overall darkening color)
			//
			// lightingSprite = Sprite (rendered view of lights layer)
			// - uses render texture of lighting layer
			// - should be MULTIPLY'd with the world to light it
			//
			// lightbulb = Graphics|Sprite (light source)
			// - parentLayer must be set to lighting so it becomes a light
			// - must be ALSO added to a container (addChild) so it is visible
			// - both of the above are required for it to function as a light
			//   (!)
			let lightingLayer = new Stage.Layer(ZLevelHUD.Lighting, StageTarget.HUD);
			lightingLayer.on('display', function (el) {
				el.blendMode = PIXI.BLEND_MODES.ADD;
			});
			lightingLayer.useRenderTexture = true;
			lightingLayer.clearColor = [0.5, 0.5, 0.5, 1];
			this.stage.add(lightingLayer);

			let lightingSprite = new Stage.Sprite(lightingLayer.getRenderTexture(), ZLevelHUD.Lighting, StageTarget.HUD);
			lightingSprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;
			this.stage.add(lightingSprite);

			// set default zoom level
			world.scale.set(resConfig.zoom, resConfig.zoom);

			// make systems! note that priorities here don't affect render order
			// (which has its own mapping via z stages and z levels)
			let debugDefaultDisabled = true;

			// libs (not really systems; don't do per-frame updates; just
			// provide APIs)
			let delaySpeaker = new System.DelaySpeaker();
			let gui = new System.GUIManager(this.subConfigs.gui, delaySpeaker);
			this.ecs.addSystem(5, delaySpeaker);
			this.ecs.addSystem(5, gui);

			// subsystems
			let inputKeyboard = new System.InputKeyboard(keyboard);
			let inputMouse = new System.InputMouse(mouse, hud, world);
			let inputGamepad = new System.InputGamepad();
			let playerSelector = new System.PlayerSelector();
			let enemySelector = new System.EnemySelector();
			let zoneSelector = new System.ZoneSelector();
			let comboableSelector = new System.ComboableSelector();
			let gateSelector = new System.GateSelector();
			let spawnableSelector = new System.SpawnableSelector();
			let itemSelector = new System.ItemSelector();
			let checkpointSelector = new System.CheckpointSelector();
			let staticRenderableSelector = new System.StaticRenderableSelector();
			this.ecs.addSystem(5, inputKeyboard);
			this.ecs.addSystem(5, inputMouse);
			this.ecs.addSystem(5, inputGamepad);
			this.ecs.addSystem(5, playerSelector);
			this.ecs.addSystem(5, enemySelector);
			this.ecs.addSystem(5, zoneSelector);
			this.ecs.addSystem(5, comboableSelector);
			this.ecs.addSystem(5, gateSelector);
			this.ecs.addSystem(5, spawnableSelector);
			this.ecs.addSystem(5, itemSelector);
			this.ecs.addSystem(5, checkpointSelector);
			this.ecs.addSystem(5, staticRenderableSelector);

			// input/ai -- affect entity state (idle vs moving)
			// this.ecs.addSystem(10, new System.PlayerInputWSAD(inputKeyboard));
			this.ecs.addSystem(10, new System.PlayerInputMouseKeyboard(inputMouse, inputKeyboard, inputGamepad, enemySelector));
			this.ecs.addSystem(10, new System.Pause(keyboard));
			// this.ecs.addSystem(10, new System.ControlsScreen(this.stage, viewportSize));
			// this.ecs.addSystem(10, new System.AICow());
			// this.ecs.addSystem(10, new System.AIArcher(aiGameState));
			// this.ecs.addSystem(10, new System.AIBrawler(playerSelector));
			this.ecs.addSystem(10, new System.AISystem(playerSelector));
			if (this.mode == Mode.DEBUG) {
				this.ecs.addSystem(10, new System.Debug(keyboard));
				this.ecs.addSystem(10, new System.DebugGameSpeed(keyboard));
				this.ecs.addSystem(10, new System.DebugEntitySelector(inputMouse));

			}

			// always allowing level restarts due to potential softlocks and no
			// saving
			this.ecs.addSystem(10, new System.DebugSceneRestart(keyboard, this.sceneManager));

			// gamepad runs after mouse/keyboard because it will either
			// overwrite or leave alone the state set by them.
			this.ecs.addSystem(12, new System.PlayerInputGamepad(inputGamepad));

			// clean up unique-intended things
			if (this.mode == Mode.DEBUG) {
				this.ecs.addSystem(15, new System.DebugInspectionUniquifier());
			}

			// process inputs that create new entities -- depend on entity state (reads stagger, death, each other)
			//										   -- modifies entity state (writes attack state, block state)
			this.ecs.addSystem(20, new System.Swing());
			this.ecs.addSystem(20, new System.Defend());

			// movements
			this.ecs.addSystem(40, new System.Tracking()); // must come after swing (positions attack objects)
			this.ecs.addSystem(40, new System.Movement());

			// detect collisions
			this.ecs.addSystem(45, new System.SpatialHash()); // must come before collision detection
			this.ecs.addSystem(50, new System.CollisionDetection(cheapCollPanel, expensiveCollPanel)); // must come after movement (to avoid sinking in objects)

			// resolve collisions -- affect entity state (writes stagger, death, blocked, recoil)
			this.ecs.addSystem(60, new System.CollisionMovement());
			this.ecs.addSystem(60, new System.CollisionBlock());
			this.ecs.addSystem(60, new System.CollisionZone());
			this.ecs.addSystem(60, new System.CollisionItem(this.gm));
			this.ecs.addSystem(60, new System.CollisionPhysicsRegion());
			this.ecs.addSystem(60, new System.CollisionProjectile());
			this.ecs.addSystem(60, new System.PersistentDamage());

			// damage collision happens after block
			this.ecs.addSystem(65, new System.CollisionDamage());
			// zone checking happens after zone collision
			this.ecs.addSystem(65, new System.EnemyZoneChecker());

			// timebombs -- affect entity state (writes stagger, recoil, blocked)
			this.ecs.addSystem(70, new System.Attack());
			this.ecs.addSystem(70, new System.Block());
			this.ecs.addSystem(70, new System.Blocked());
			this.ecs.addSystem(70, new System.Stagger());
			this.ecs.addSystem(70, new System.StaggerReturn());
			this.ecs.addSystem(70, new System.DamagedFlash());
			this.ecs.addSystem(70, new System.Recoil());
			this.ecs.addSystem(70, new System.Knockback());
			this.ecs.addSystem(70, new System.Immobile());
			this.ecs.addSystem(70, new System.Invincible());
			this.ecs.addSystem(70, new System.Bleeding());

			// other misc game logic
			this.ecs.addSystem(75, new System.Combo(comboableSelector));
			this.ecs.addSystem(75, new System.Death());

			// camera
			this.ecs.addSystem(80, new System.Zoom(world, resConfig.zoom));
			this.ecs.addSystem(80, new System.DebugCamera(keyboard, world, debugDefaultDisabled))
			this.ecs.addSystem(80, new System.FollowCamera(
				world,
				resConfig.viewport.copy(),
				this.sceneManager.infoProvider,
				zoneSelector));
			let fxCamera = new System.FxCamera(world);
			this.ecs.addSystem(82, fxCamera);

			// pre-rendering: determine part / partID matchups
			this.ecs.addSystem(85, new System.Activity());
			this.ecs.addSystem(87, new System.Body());

			// pre-rendering: tween!
			this.ecs.addSystem(89, new System.Tweener());

			// rendering
			let fxAnimations = new System.FxAnimations(this.gm, this.subConfigs.fx);
			this.ecs.addSystem(90, fxAnimations);
			this.ecs.addSystem(90, new System.Sparkle(this.gm));
			this.ecs.addSystem(90, new System.LockOn(this.stage));
			this.ecs.addSystem(90, new System.StaticRenderer(this.stage));
			this.ecs.addSystem(90, new System.AnimationRenderer(this.stage));
			this.ecs.addSystem(90, new System.Lighting(this.stage, translator, lightingLayer, resConfig.gamescale))
			this.ecs.addSystem(90, new System.EnemyHUDRenderer(
				gui, this.subConfigs.gui.sequences['enemyHUD'], translator, playerSelector));
			this.ecs.addSystem(90, new System.PlayerHUDRenderer());
			this.ecs.addSystem(90, new System.TextRenderer(this.stage, resConfig.gamescale, translator));
			this.ecs.addSystem(90, new System.GUISpriteRenderer(this.stage, resConfig.gamescale, translator));

			// sounds (audible... rendering?) and sounds+FX
			this.ecs.addSystem(90, new System.SoundsFootsteps());
			this.ecs.addSystem(90, this.audio);
			this.ecs.addSystem(90, new System.LowHealth());

			this.ecs.addSystem(90, new System.ParticleRenderer(
				world.getChildAt(world.mapping.get(ZLevelWorld.Particles)),
				this.subConfigs.particles,
				this.particleJSONS,
			));

			// ticking animations (still part of rendering, but comes after
			// AnimationRenderer)
			this.ecs.addSystem(95, new System.AnimationTicker());

			this.ecs.addSystem(100, new System.CrosshairRenderer(inputMouse, this.stage));

			// debug rendering
			if (this.mode == Mode.DEBUG) {
				// this.ecs.addSystem(100, new System.DebugPositionRenderer(this.stage, debugDefaultDisabled));
				this.ecs.addSystem(100, new System.DebugCollisionRenderer(this.stage, debugDefaultDisabled));
				// this.ecs.addSystem(100, new System.DebugComponentRenderer(this.stage));

				// create a two-col layout for rendering debug HTML components
				document.getElementById('gameContent').className = 'left';
				let debugCol = document.createElement('div');
				debugCol.id = 'debugColumn';
				debugCol.className = 'right';
				document.getElementById('contentParent').appendChild(debugCol);
				this.ecs.addSystem(100, new System.DebugHTMLComponents(debugCol));

				this.ecs.addSystem(100, new System.DebugInspectionRenderer(this.stage));
				this.ecs.addSystem(100, new System.DebugTimingRenderer(this.stage, this.clockCentral, resConfig.viewport.copy()));
			}

			// speedrun timer!
			this.ecs.addSystem(100, new System.BookkeeperRenderer(this.stage, resConfig.viewport.copy()));

			// libraries
			this.ecs.addSystem(110, new System.Bookkeeper());
			this.ecs.addSystem(110, new System.Fade(this.stage, resConfig.viewport.copy()));

			// event handlers
			this.eventsManager.add(new Handler.Camera(fxCamera));
			this.eventsManager.add(new Handler.TextHandler(translator, gui));
			this.eventsManager.add(new Handler.Checkpoint(this.gm));
			this.eventsManager.add(new Handler.Death(playerSelector, spawnableSelector));
			// this.eventsManager.add(new Handler.Debug());
			this.eventsManager.add(new Handler.SoundEffects(delaySpeaker));
			this.eventsManager.add(new Handler.SlowMotion());
			this.eventsManager.add(new Handler.Overlay());
			this.eventsManager.add(new Handler.FX(fxAnimations));
			this.eventsManager.add(new Handler.ExitConditionsComplete(gateSelector, zoneSelector, this.gm));
			this.eventsManager.add(new Handler.NextToExit());
			this.eventsManager.add(new Handler.ExitSequence(this.sceneManager));
			this.eventsManager.add(new Handler.LevelExiter(this.sceneManager));
			this.eventsManager.add(new Handler.GateManager());
			this.eventsManager.add(new Handler.Bookkeeping());
			this.eventsManager.add(new Handler.Instructions(this.subConfigs.instructions));
			this.eventsManager.add(new Handler.Controls(this.subConfigs.controls));
			this.eventsManager.add(new Handler.Control());
			this.eventsManager.add(new Handler.EndSequence(this.gm));
			if (this.mode == Mode.DEBUG) {
				this.eventsManager.add(new Handler.ExitHandlerDev());
			}

			// modify core game stuff w/ systems that need crosstalk
			this.audio.boundsGetter = world;
			this.audio.viewportSize = resConfig.viewport.copy();

			// Tell scene manager to load any level progress that was saved, or just the
			// first level in the progression (which is the title sceen) if no save data
			// was found.
			let [sceneName, trackIDs, bookkeeperStr] = Saving.load();
			if (sceneName != null) {
				// we have to play the music first because otherwise the sceneManager
				// may load the lack of tracks, then immediately save them.
				if (trackIDs != null) {
					this.ecs.getSystem(System.Audio).playMusic(trackIDs);
				}

				// load all stats
				this.ecs.getSystem(System.Bookkeeper).load(bookkeeperStr);

				this.sceneManager.switchToName(sceneName);
			} else {
				// First level.
				this.sceneManager.nextLevel();
			}

			// Start update loop.
			this.r.done()
			g = this;
		}

		/**
		 * start (timer)
		 * @param phase
		 */
		private s(phase: string): void {
			this.clockCentral.start(Measurement.T_OVERALL, phase);
		}

		/**
		 * end (timer)
		 * @param phase
		 */
		private e(phase: string): void {
			this.clockCentral.end(Measurement.T_OVERALL, phase);
		}

		public update(wallDelta: number, rawGameDelta: number): void {
			// TODO: use decorators for timing instead if possible

			// game logic
			this.s('update');
			let gameDelta = this.ecs.update(wallDelta, rawGameDelta, this.clockCentral);
			this.e('update');

			// TODO: should the below (events and scripts) respect the slowdown
			// that the ecs does to the game timestep w/ slowmotion? if so, it
			// should return the actual delta it used so the others below can
			// use the same thing.

			// events (so, more game logic)
			this.s('events');
			this.eventsManager.update(gameDelta);
			this.e('events');

			// scripts (so, more game logic)
			this.s('scripting');
			this.scriptRunner.update(gameDelta);
			this.e('scripting');

			// final game logic (cleanup of entites, etc.)
			this.s('cleanup');
			this.ecs.finishUpdate();
			this.e('cleanup');

			// rendering happens in the render() function. It should bookkeep
			// its own time there.
		}

		public render(): void {
			// render
			this.s('render');
			this.stage.render(this.pixi_renderer);
			this.e('render');
		}
	}
}
