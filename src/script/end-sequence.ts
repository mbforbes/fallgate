/// <reference path="../engine/script.ts" />

namespace Script {


	export class EndSequence extends Script {

		code = new Map<number, FunctionPackage>([
			[0, { func: this.begin, args: null }],
			[3000, { func: this.zoomOut, args: null }],
			[4000, { func: this.swapBodies, args: [true] }],
			[4200, { func: this.swapBodies, args: [false] }],
			[6000, { func: this.swapBodies, args: [true] }],
			[6400, { func: this.swapBodies, args: [false] }],
			[8000, { func: this.swapBodies, args: [true] }],
			[8800, { func: this.swapBodies, args: [false] }],
			[10000, { func: this.swapBodies, args: [true] }],
			[12980, { func: this.blackOut, args: [true] }],
			[16000, { func: this.nextScene, args: [true] }],
		])

		begin(): void {
			// stop level timer
			this.ecs.getSystem(System.Bookkeeper).endLevel();

			// zoom in close
			this.ecs.getSystem(System.Zoom).request(2.6, 750, Tween.easeInCubic);

			// cut player controls
			this.eventsManager.dispatch({
				name: Events.EventTypes.PlayerControl,
				args: { allow: false },
			});

			// kill any other remaining enemies so they don't get you while
			// you're paused.
			for (let enemy of this.ecs.getSystem(System.EnemySelector).latest()) {
				let eComps = this.ecs.getComponents(enemy);
				if (eComps.has(Component.Health)) {
					eComps.get(Component.Health).current = 0;
				}
			}

			// cut music
			let audio = this.ecs.getSystem(System.Audio);
			audio.playMusic([]);

			// start ending sounds
			audio.play(['end-sound']);

		}

		zoomOut(): void {
			this.ecs.getSystem(System.Zoom).request(0.6, 10000, Tween.easeInCubic);
		}

		swapBodies(toHumanoid: boolean): void {
			// send body swap request
			let eArgs: Events.SwapBodiesArgs = {
				toHumanoid: toHumanoid,
			}
			this.eventsManager.dispatch({
				name: Events.EventTypes.SwapBodies,
				args: eArgs,
			});

			// gui blood
			if (toHumanoid) {
				this.ecs.getSystem(System.GUIManager).runSequence('hit');
			}

			// sound
			let audio = this.ecs.getSystem(System.Audio);
			audio.play(['heartbeat']);
		}

		blackOut(): void {
			this.ecs.getSystem(System.GUIManager).createSprite('blackoutWash');
		}

		nextScene(): void {
			let eArgs: Events.SwitchSceneArgs = {
				prep: false,
			}
			this.eventsManager.dispatch({
				name: Events.EventTypes.SwitchScene,
				args: eArgs,
			});
		}
	}
}
