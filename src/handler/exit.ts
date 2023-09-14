/// <reference path="../engine/events.ts" />
/// <reference path="../component/enemy.ts" />
/// <reference path="../system/selector.ts" />

namespace Handler {

	export class ExitConditionsComplete extends Events.Handler {

		private partyEntities = new Array<Engine.Entity>()

		dispatcher = new Map<Events.EventType, (EventType, any) => void>([
			[Events.EventTypes.ExitConditions, this.exitConditionsChange],
		])

		constructor(
			private gateSelector: System.GateSelector,
			private zoneSelector: System.ZoneSelector,
			private factory: GameMap.GameMap,
		) {
			super();
		}

		@override
		public clear(): void {
			arrayClear(this.partyEntities);
		}

		private exitConditionsChange(et: Events.EventType, args: Events.ExitConditionsArgs) {
			if (args.fulfilled) {
				this.party(args.silent);
			} else {
				this.unparty();
			}
		}

		private party(silent: boolean): void {
			// launch the tween (if not silent)
			if (!silent) {
				this.ecs.getSystem(System.GUIManager).runSequence('exitReady')
			}

			for (let gateE of this.gateSelector.latest()) {
				let comps = this.ecs.getComponents(gateE);
				let gateC = comps.get(Component.Gate);
				if (!gateC.exit) {
					continue;
				}

				let castle = comps.has(Component.DebugKVLayer) && comps.get(Component.DebugKVLayer).layer.endsWith('CastleGate');
				let knightY = castle ? 107 : 175;

				// add trumpet players
				let pos = comps.get(Component.Position);
				let degAngle = -(Constants.RAD2DEG * pos.angle);
				let knights = [
					pos.p.copy().add_(new Point(130, knightY).rotate_(-pos.angle)),
					pos.p.copy().add_(new Point(-130, knightY).rotate_(-pos.angle)),
				];
				for (let knight of knights) {
					let e = this.factory.produce('trumpetKnight', {
						x: knight.x,
						y: knight.y,
						// TODO: needing to specify the w/h here is annoying.
						// can we put some key in the core object properties
						// (or in the factory production?) that lets us
						// sidestep the tiled rotation business and just do
						// our own game-centered positioning?
						width: 1,  // actually ~64
						height: 1,	// actually ~52
						rotation: degAngle + 90,
					});
					this.partyEntities.push(e);
				}

				// add flags
				let flagY = castle ? 50 : 107;
				let flags = [{
					pos: pos.p.copy().add_(new Point(120, flagY).rotate_(-pos.angle)),
					layer: 'flagRight',
				}, {
					pos: pos.p.copy().add_(new Point(-120, flagY).rotate_(-pos.angle)),
					layer: 'flagLeft',
				}];
				for (let flag of flags) {
					let e = this.factory.produce(flag.layer, {
						x: flag.pos.x,
						y: flag.pos.y,
						width: 1,
						height: 1,
						rotation: degAngle,
					});
					this.partyEntities.push(e);
				}

				// add red carpet
				if (!castle) {
					let e = this.factory.produce('carpet', {
						x: pos.p.x,
						y: pos.p.y,
						width: 1,
						height: 1,
						rotation: degAngle,
					});
					this.partyEntities.push(e);
				}
			}

			// enable exit zones
			this.toggleExitZones(true);
		}

		private unparty(): void {
			// remove any party entities
			while (this.partyEntities.length > 0) {
				this.ecs.removeEntity(this.partyEntities.pop());
			}

			// disable exit zones
			this.toggleExitZones(false);
		}

		private toggleExitZones(setTo: boolean): void {
			// enable exit regions
			for (let zone of this.zoneSelector.latest()) {
				let zoneComps = this.ecs.getComponents(zone);
				let zoneComp = zoneComps.get(Component.Zone);
				if (zoneComp.zoneTypes.has(Logic.ZoneType.NearExit) ||
					zoneComp.zoneTypes.has(Logic.ZoneType.NextToExit)) {
					zoneComp.active = setTo;
				}
			}
		}
	}


	export class NextToExit extends Events.Handler {

		dispatcher = new Map<Events.EventType, (et: Events.EventType, args: any) => void>([
			[Events.EventTypes.ZoneTransition, this.playerZoneTransition],
		])

		/**
		 * To avoid double-triggering the exit on rare circumstances (w/ certain
		 * approach angles into the exit gate).
		 */
		private triggered = false

		@override
		public clear(): void {
			this.triggered = false;
		}

		private playerZoneTransition(et: Events.EventType, args: Events.ZoneTransitionArgs): void {
			let zone = this.ecs.getComponents(args.zone).get(Component.Zone);
			if (!zone.zoneTypes.has(Logic.ZoneType.NextToExit) || this.triggered) {
				return;
			}
			if (args.enter) {
				this.firer.dispatch({
					name: Events.EventTypes.StartExitSequence,
					args: {},
				});
				this.triggered = true;
			}
		}
	}

	/**
	 * NOTE: may want to turn into script so we can only enable exiting after a
	 * certain time.
	 */
	export class ExitSequence extends Events.Handler {
		dispatcher = new Map<Events.EventType, (EventType, any) => void>([
			[Events.EventTypes.StartExitSequence, this.handleStartExitSequence],
			[Events.EventTypes.MenuKeypress, this.menuKeypress],
		])

		private levelSwitchEnabled = false
		private guiBookkeep: Engine.Entity[] = []

		constructor(public sceneManager: Scene.Manager) {
			super();
		}

		@override
		public clear(): void {
			arrayClear(this.guiBookkeep);
		}

		/**
		 * Depending on the level type we either
		 * (a) show the level report (normal)
		 * (b) skip the level report and directly end (for multi-part levels
		 *     where this isn't the last segment)
		 */
		private handleStartExitSequence(et: Events.EventType, args: Events.StartExitSequenceArgs): void {
			let ssName = this.sceneManager.infoProvider.startScriptName;
			switch (ssName) {
				// intentional fallthrough for both multipart non-final levels
				case 'StartLevelMultipartFirst':
				case 'StartLevelMultipartMid':
					this.ecs.getSystem(System.Bookkeeper).endLevel();
					this.levelSwitchEnabled = true;
					this.clearReportExitLevel();
					break;

				// for all other cases, show the level report
				default:
					this.showLevelReport();
					break;
			}
		}

		private showLevelReport(): void {
			// disable player HUD and input, and mark in cutscene for AIs
			this.ecs.disableSystem(System.PlayerHUDRenderer);
			this.firer.dispatch({
				name: Events.EventTypes.PlayerControl,
				args: { allow: false },
			});
			this.ecs.getSystem(System.AISystem).inCutscene = true;

			// zoom in
			this.ecs.getSystem(System.Zoom).request(2, 2000, Tween.easeOutCubic);

			// Map from text tween IDs (in the gui.json) to text to replace
			// their contents with.
			let bookkeeper = this.ecs.getSystem(System.Bookkeeper);
			bookkeeper.endLevel();
			let report = bookkeeper.report();
			this.guiBookkeep.push(...this.ecs.getSystem(System.GUIManager).runSequence('endLevel', new Map([
				['exitLevelName', this.sceneManager.infoProvider.levelName],
				['exitLevelNumber', 'Level ' + this.sceneManager.infoProvider.levelNum],
				['exitKillsText', report.enemiesKilled],
				['exitDeathsText', report.playerDeaths],
				['exitSecretsText', report.secretsFound],
				['exitTimeTextBig', report.timeTakenBig],
				['exitTimeTextSmall', report.timeTakenSmall],
			])));

			// NOTE: may want a delay here
			this.levelSwitchEnabled = true;

			// play sound
			this.ecs.getSystem(System.Audio).play(['title-sheen']);
		}

		private menuKeypress(et: Events.EventType, args: Events.MenuKeypressArgs): void {
			this.clearReportExitLevel();
		}

		private clearReportExitLevel(): void {
			if (this.levelSwitchEnabled) {
				this.levelSwitchEnabled = false;
				// exit tweens
				let guiManager = this.ecs.getSystem(System.GUIManager);
				while (this.guiBookkeep.length > 0) {
					guiManager.tween(this.guiBookkeep.pop(), 'exit');
				}

				// zoom out
				this.ecs.getSystem(System.Zoom).request(1, 3000, Tween.linear);

				// remove collision boxes on exit gates
				let gateSelector = this.ecs.getSystem(System.GateSelector);
				for (let gateE of gateSelector.latest()) {
					let gateComps = this.ecs.getComponents(gateE);
					let gate = gateComps.get(Component.Gate);
					if (!gate.exit) {
						continue;
					}
					this.ecs.removeComponentIfExists(gateE, Component.CollisionShape);
				}

				// make player walk towards exit
				let playerSelector = this.ecs.getSystem(System.PlayerSelector);
				let player = playerSelector.latest().next().value;
				let fwdParams: AI.ForwardParams = {
					faceExit: true,
					beforeWaitTime: 500,
					forwardTime: 900,
				}
				this.ecs.addComponent(player, new Component.AIComponent(
					AI.Behavior.Forward, fwdParams, true,
				))

				// trigger the scene switching
				let nextArgs: Events.SwitchSceneArgs = {
					prep: true,
				}
				this.firer.dispatch({ name: Events.EventTypes.SwitchScene, args: nextArgs }, 1000);
			}
		}
	}

	export class LevelExiter extends Events.Handler {
		dispatcher = new Map<Events.EventType, (et: Events.EventType, args: any) => void>([
			[Events.EventTypes.SwitchScene, this.sceneSwitcher],
		])

		constructor(private sceneManager: Scene.Manager) {
			super();
		}

		/**
		 * Either preps for a scene switch (fade out + request scene switch),
		 * or does the actual scene switch, depending on how args.prep is set.
		 */
		sceneSwitcher(t: Events.EventType, args: Events.SwitchSceneArgs) {
			if (args.prep) {
				// fade out
				this.ecs.getSystem(System.Fade).request(1, 500);

				// ask for the legit scene switch
				let nextArgs: Events.SwitchSceneArgs = {
					prep: false,
					increment: args.increment,
				}
				this.firer.dispatch({
					name: Events.EventTypes.SwitchScene,
					args: nextArgs,
				}, 500)
			} else {
				// do the legit scene switch
				let increment = args.increment || 1;
				this.sceneManager.switchToRelative(increment);
			}
		}
	}

	/**
	 * Only registered in debug mode. Lets you switch levels at any time.
	 */
	export class ExitHandlerDev extends Events.Handler {
		dispatcher = new Map<Events.EventType, (EventType, any) => void>([
			[Events.EventTypes.DebugKeypress, this.switchLevelAndRemove],
		])

		keyIncrement = new Map([
			[GameKey.B, -1],
			[GameKey.N, 1],
		])

		private switchLevelAndRemove(et: Events.EventTypes, args: Events.DebugKeypressArgs): void {
			if (this.keyIncrement.has(args.key)) {
				// trigger scene switching
				let nextArgs: Events.SwitchSceneArgs = {
					prep: true,
					increment: this.keyIncrement.get(args.key),
				}
				this.firer.dispatch({ name: Events.EventTypes.SwitchScene, args: nextArgs });
			}
		}
	}

	export class ExitHandlerTitle extends Events.Handler {
		gui: Engine.Entity[] = []

		dispatcher = new Map<Events.EventType, (EventType, any) => void>([
			[Events.EventTypes.GameLogic, this.addGUI],
			[Events.EventTypes.SwitchScene, this.onSceneSwitch],
			[Events.EventTypes.MenuKeypress, this.startGame],
		])

		transient = true

		@override
		public clear(): void {
			arrayClear(this.gui);
		}

		private addGUI(et: Events.EventType, args: Events.GameLogicArgs): void {
			if (args.phase !== Events.Phase.TitleScreenShow) {
				return;
			}
			let guiM = this.ecs.getSystem(System.GUIManager);
			this.gui.push(...guiM.runSequence('titleScreen'));
		}

		/**
		 * Provided only because in debug mode we sometimes skip past the title
		 * screen, which means, the startGame() below will never have ran. This
		 * stops it from trying to run on the next level.
		 */
		private onSceneSwitch(): void {
			this.finished = true;
		}

		private startGame(): void {
			// remove gui
			let guiM = this.ecs.getSystem(System.GUIManager);
			while (this.gui.length > 0) {
				guiM.tween(this.gui.pop(), 'exit');
			}

			// make player start walking
			Script.startPlayerMovement(this.ecs, 100, 6000);

			// go to next level after a bit more
			let nextArgs: Events.SwitchSceneArgs = {
				prep: true,
			}
			this.firer.dispatch({ name: Events.EventTypes.SwitchScene, args: nextArgs }, 5000);

			// don't run again until we start the game again
			this.finished = true;
		}
	}

	// settings

	// control how often new credits appear
	let timeSlope = 200; // per-line multiplier
	let timeIntercept = 14000;  // lump sum add
	let timeNextIntercept = 4000;

	let creditsLineTween: Tween.Spec = {
		visuals: [{
			prop: 'y',
			spec: {
				valType: 'rel',
				val: -1000,
				duration: 8000,  // how fast a credit line moves
				method: 'linear',
				delay: 0,  // set below according to line's position
			}
		}],
		sounds: [],
	};

	function linesIn(s: string): number {
		let total = 1;
		for (let i = 0; i < s.length; i++) {
			if (s[i] == '\n') {
				total += 1;
			}
		}
		return total;
	}

	export class ExitHandlerCredits extends Events.Handler {
		dispatcher = new Map<Events.EventType, (EventType, any) => void>([
			[Events.EventTypes.GameLogic, this.addGUI],
			[Events.EventTypes.SwitchScene, this.onSceneSwitch],
			[Events.EventTypes.MenuKeypress, this.finishCredits],
		])

		transient = true

		constructor(private credits: GJ7.Credits) {
			super();
		}

		private addGUI(et: Events.EventType, args: Events.GameLogicArgs): void {
			if (args.phase !== Events.Phase.CreditsShow) {
				return;
			}
			let guiM = this.ecs.getSystem(System.GUIManager);

			// add the persistent bg stuff
			for (let sid of ['creditsWash', 'creditsLetterBoxTop', 'creditsLetterBoxBot']) {
				guiM.createSprite(sid);
			}

			// enqueue all credits lines
			let nextDelay = 0;
			for (let i = 0; i < this.credits.lines.length; i++) {
				let spec = clone(creditsLineTween);
				spec.visuals[0].spec.delay = nextDelay;
				spec.destruct = nextDelay + 20000;
				let nLines = linesIn(this.credits.lines[i]);
				spec.visuals[0].spec.duration = nLines * timeSlope + timeIntercept;
				nextDelay += nLines * timeSlope + timeNextIntercept;
				guiM.tweenManual(guiM.createText('creditsLine', this.credits.lines[i]), spec);
			}
		}

		/**
		 * Provided only because in debug mode we sometimes skip past a screen,
		 * which means the startGame() below will never have ran. This stops it
		 * from trying to run on the next level.
		 */
		private onSceneSwitch(): void {
			this.finished = true;
		}

		private finishCredits(): void {
			// go to next level (title)
			let nextArgs: Events.SwitchSceneArgs = {
				prep: true,
			}
			this.firer.dispatch({ name: Events.EventTypes.SwitchScene, args: nextArgs });

			// don't run again until we hit credits again
			this.finished = true;
		}
	}

	export class ExitHandlerRecap extends Events.Handler {
		dispatcher = new Map<Events.EventType, (EventType, any) => void>([
			[Events.EventTypes.GameLogic, this.addGUI],
			[Events.EventTypes.SwitchScene, this.onSceneSwitch],
			[Events.EventTypes.MenuKeypress, this.finishRecap],
		])

		transient = true

		private guiBookkeep: Engine.Entity[] = []

		private addGUI(et: Events.EventType, args: Events.GameLogicArgs): void {
			if (args.phase !== Events.Phase.RecapShow) {
				return;
			}

			// recap
			let bookkeeper = this.ecs.getSystem(System.Bookkeeper);
			let [recap, doughnutArray] = bookkeeper.recap();
			let guiM = this.ecs.getSystem(System.GUIManager);
			this.guiBookkeep.push(...guiM.runSequence('recap', new Map([
				['recapTimeValue', recap.timeTaken],
				['recapTimeValueBig', recap.timeTakenBig],
				['recapTimeValueSmall', recap.timeTakenSmall],
				['recapKillsValue', recap.enemiesKilled],
				['recapDeathsValue', recap.playerDeaths],
				['recapDoughnutsValue', recap.secretsFound],
			])));

			// donut display
			let d = {
				cols: 8,
				xOffscreen: 700,
				xStart: 400,
				xSpacing: 25,
				yStart: 135,
				ySpacing: 25,
				delayStart: 2000,
				delaySpacing: 50,
				duration: 500,
			};

			let all_found = true;
			for (let i = 0; i < doughnutArray.length; i++) {
				all_found = all_found && doughnutArray[i];
				let col = i % d.cols;
				let row = Math.floor(i / d.cols);
				let x = d.xStart + col * d.xSpacing;
				let y = d.yStart + row * d.ySpacing;
				let sid = doughnutArray[i] ? 'recapDoughnutOn' : 'recapDoughnutOff';
				let e = guiM.createSprite(sid, null, new Point(d.xOffscreen, y));
				let delay = d.delayStart + i * d.delaySpacing;
				let sounds = doughnutArray[i] ? [{ options: ['pop-1', 'pop-2', 'pop-3'], delay: delay }] : [];
				guiM.tweenManual(e, {
					visuals: [{
						prop: 'x',
						spec: {
							val: x,
							valType: 'abs',
							delay: delay,
							duration: d.duration,
							method: 'easeOutBack',
						},
					},
					],
					sounds: sounds,
				})
			}

			// optionally add doughnut% indicator
			if (all_found) {
				let dids = [
					guiM.createText('recapDoughnutPercent'),
					guiM.createSprite('recapSparkle'),
				];
				for (let did of dids) {
					guiM.tween(did, 'enter');
				}
			}
		}

		/**
		 * Provided only because in debug mode we sometimes skip past a screen,
		 * which means the finishRecap() below will never have ran. This
		 * stops it from trying to run on the next level.
		 */
		private onSceneSwitch(): void {
			this.finished = true;
		}

		private finishRecap(): void {
			// note: not doing exit tweens, just fading

			// go to next level (credits)
			let nextArgs: Events.SwitchSceneArgs = {
				prep: true,
			}
			this.firer.dispatch({ name: Events.EventTypes.SwitchScene, args: nextArgs });

			// don't run again until we hit recap again
			this.finished = true;
		}
	}

}
