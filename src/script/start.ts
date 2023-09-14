/// <reference path="../engine/script.ts" />

namespace Script {

	//
	// common functions for different start scripts
	//

	/**
	 * Things that happen before a single frame is run in the new level.
	 */
	function startLevelInit(this: Script, allowAllAIs: boolean) {
		// disable player input (start w/ this b/c sometimes we start a level
		// w/o having exited a previous one, like at the start of the game)
		this.eventsManager.dispatch({
			name: Events.EventTypes.PlayerControl,
			args: { allow: false },
		});

		// maybe disable non-cutscene AIs
		if (!allowAllAIs) {
			this.ecs.getSystem(System.AISystem).inCutscene = true;
		}

		// fade in here
		this.ecs.getSystem(System.Fade).request(0, 1000);
	}

	/**
	 * Adds "next to exit" zones at the entrances of the exit gates.
	 *
	 * Has to run after 1 update frame has run so that the gate selectors have a
	 * frame to select their gates.
	 */
	function addExitRegions(this: Script, gm: GameMap.GameMap): void {
		for (let gate of this.ecs.getSystem(System.GateSelector).latest()) {
			let comps = this.ecs.getComponents(gate);
			let gateComp = comps.get(Component.Gate);
			let pos = comps.get(Component.Position);
			let zonePos = pos.p.copy().add_(new Point(0, 100).rotate_(-pos.angle))
			let degAngle = -(Constants.RAD2DEG * pos.angle);
			if (gateComp.exit) {
				gm.produce('nextToExitv2', {
					height: 1,
					width: 1,
					rotation: degAngle + 90,
					x: zonePos.x,
					y: zonePos.y,
				})
			}
		}
	}

	function openStartGate(this: Script) {
		// this looks kinda nice so yeah
		let gateSelector = this.ecs.getSystem(System.GateSelector)
		for (let gateEntity of gateSelector.latest()) {
			let gateComps = this.ecs.getComponents(gateEntity);
			let gateComp = gateComps.get(Component.Gate);
			if (!gateComp.start) {
				continue;
			}
			let activity = gateComps.get(Component.Activity);
			activity.action = Action.Opening;
			// send event to make noise
			this.eventsManager.dispatch({
				name: Events.EventTypes.GateOpen,
				args: {},
			});
		}
	}

	export function startPlayerMovement(ecs: Engine.ECS, beforeWaitTime: number, forwardTime: number): void {
		// turn on the player's cutscene AI
		let playerSelector = ecs.getSystem(System.PlayerSelector);
		for (let playerEntity of playerSelector.latest()) {
			let fwdParams: AI.ForwardParams = {
				beforeWaitTime: beforeWaitTime,
				faceExit: false,
				forwardTime: forwardTime,
			};
			ecs.addComponent(
				playerEntity,
				new Component.AIComponent(AI.Behavior.Forward, fwdParams, true));
		}
	}

	function _startPlayerMovement(this: Script, beforeWaitTime: number, forwardTime: number): void {
		startPlayerMovement(this.ecs, beforeWaitTime, forwardTime);
	}

	function startGameplay(this: StartLevelBase): void {
		let playerSelector = this.ecs.getSystem(System.PlayerSelector);
		for (let playerEntity of playerSelector.latest()) {
			// set spawn point to be here (outside of the start gate)
			let playerComps = this.ecs.getComponents(playerEntity);
			if (playerComps.has(Component.Spawnable)) {
				let spawnable = playerComps.get(Component.Spawnable);
				let pos = playerComps.get(Component.Position);
				spawnable.position.copyFrom_(pos.p);
			}
			// remove AI
			this.ecs.removeComponentIfExists(playerEntity, Component.AIComponent);
		}

		// give back player input system
		this.eventsManager.dispatch({
			name: Events.EventTypes.PlayerControl,
			args: { allow: true },
		});
		let eArgs: Events.GameplayStartArgs = {};
		this.eventsManager.dispatch({
			name: Events.EventTypes.GameplayStart,
			args: eArgs,
		});

		// ename normal AIs
		this.ecs.getSystem(System.AISystem).inCutscene = false;
	}

	function addHUD(this: Script): void {
		this.ecs.enableSystem(System.PlayerHUDRenderer);
	}

	abstract class StartLevelBase extends Script {
		constructor(public infoProvider: Scene.InfoProvider) {
			super();
		}
	}

	/**
	 * Standard start level script with visual effects and delays.
	 */
	export class StartLevel extends StartLevelBase {

		code = new Map<number, FunctionPackage>([
			[1, { func: addExitRegions, args: [this.gm] }],
			[500, { func: _startPlayerMovement, args: [100, 1000] }],
			[600, { func: openStartGate, args: this }],
			[1000, { func: this.triggerGUI, args: null }],
			[1001, { func: this.zoomIn, args: null }],
			[4000, { func: this.zoomOut, args: null }],
			[5000, { func: startGameplay, args: this }],
			[6000, { func: addHUD, args: null }],
		])

		constructor(public infoProvider: Scene.InfoProvider, private gm: GameMap.GameMap) {
			super(infoProvider);
		}

		@override
		init(): void {
			startLevelInit.call(this);
		}

		triggerGUI(): void {
			this.ecs.getSystem(System.GUIManager).runSequence('startLevel', new Map([
				['startLevelName', this.infoProvider.levelName],
				['startLevelNumber', 'Level ' + this.infoProvider.levelNum],
			]));
		}

		zoomIn(): void {
			this.ecs.getSystem(System.Zoom).request(1.4, 2000, Tween.easeOutCubic);
		}

		zoomOut(): void {
			this.ecs.getSystem(System.Zoom).request(1, 3000, Tween.easeInCubic);
		}
	}

	/**
	 * Development start level script to quickly get to testing.
	 */
	export class StartLevelDev extends StartLevelBase {
		code = new Map<number, FunctionPackage>([
			[1, { func: addExitRegions, args: [this.gm] }],
			[2, { func: _startPlayerMovement, args: [0, 800] }],
			[3, { func: openStartGate, args: null }],
			[4, { func: addHUD, args: null }],
			[800, { func: startGameplay, args: null }],
		])

		constructor(public infoProvider: Scene.InfoProvider, private gm: GameMap.GameMap) {
			super(infoProvider);
		}

		@override
		init(): void {
			startLevelInit.call(this);
		}
	}

	/**
	 * Used to start first scenes of multi-part levels (e.g., castle).
	 */
	export class StartLevelMultipartFirst extends StartLevel {
	}

	/**
	 * Used to start middle (non-first/last) scenes of multi-part levels (e.g.,
	 * castle).
	 */
	export class StartLevelMultipartMid extends StartLevelDev {
	}

	/**
	 * Used to start last scenes of multi-part levels (e.g., castle).
	 */
	export class StartLevelMultipartLast extends StartLevelDev {
	}

	/**
	 * For season (AKA act) transition GUI screens.
	 */
	export class StartLevelAct extends Script {
		code = new Map<number, FunctionPackage>([
			[0, { func: this.startActGUI, args: null }],
			[7000, { func: this.nextLevel, args: null }],
		])

		constructor(private season: Scene.Season) {
			super();
		}

		@override
		init(): void {
			startLevelInit.call(this);
		}

		startActGUI(): void {
			this.ecs.getSystem(System.GUIManager).runSequence(
				'seasonTransition',
				objToMap<string>(this.season.text),
				objToMap<string>(this.season.sprites),
			);
		}

		nextLevel(): void {
			// go to next scene
			let eArgs: Events.SwitchSceneArgs = {
				prep: true,
			}
			this.eventsManager.dispatch({
				name: Events.EventTypes.SwitchScene,
				args: eArgs,
			});
		}
	}

	export class StartLevelTitle extends Script {
		code = new Map<number, FunctionPackage>([
			[0, { func: this.triggerStartEvent, args: null }],
			[6400, { func: this.shakeCamera, args: null }],
		])

		@override
		init(): void {
			// general setup
			startLevelInit.call(this, true);

			// register event handler we'll need
			this.eventsManager.add(new Handler.ExitHandlerTitle());

			// for second playthrough: clear bookkeeper of timing and
			// instructions shown caches
			this.ecs.getSystem(System.Bookkeeper).reset();
		}

		triggerStartEvent(): void {
			let args: Events.GameLogicArgs = {
				phase: Events.Phase.TitleScreenShow,
			}
			this.eventsManager.dispatch({
				name: Events.EventTypes.GameLogic,
				args: args,
			});
		}

		/**
		 * Timing should line up with fallgate logo hitting bottom of its y
		 * tween.
		 */
		shakeCamera(): void {
			this.ecs.getSystem(System.FxCamera).shake(
				Constants.HALF_PI, 60, 90, System.ShakeType.Wobble);
		}
	}

	export class StartLevelCredits extends Script {
		code = new Map<number, FunctionPackage>([
			[0, { func: this.triggerStartEvent, args: null }],
		])

		constructor(private credits: GJ7.Credits) {
			super();
		}

		@override
		init(): void {
			// general setup
			startLevelInit.call(this);

			// register event handler we'll need
			this.eventsManager.add(new Handler.ExitHandlerCredits(this.credits));
		}

		triggerStartEvent(): void {
			let args: Events.GameLogicArgs = {
				phase: Events.Phase.CreditsShow,
			}
			this.eventsManager.dispatch({
				name: Events.EventTypes.GameLogic,
				args: args,
			});
		}

	}

	export class StartLevelRecap extends Script {
		code = new Map<number, FunctionPackage>([
			[0, { func: this.triggerStartEvent, args: null }],
		])

		@override
		init(): void {
			// general setup
			startLevelInit.call(this);

			// register event handler we'll need
			this.eventsManager.add(new Handler.ExitHandlerRecap());

			// we don't want this here or credits or next title screen
			this.ecs.disableSystem(System.PlayerHUDRenderer);
		}

		triggerStartEvent(): void {
			let args: Events.GameLogicArgs = {
				phase: Events.Phase.RecapShow,
			}
			this.eventsManager.dispatch({
				name: Events.EventTypes.GameLogic,
				args: args,
			});
		}

	}


}
