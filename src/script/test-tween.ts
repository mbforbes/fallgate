/// <reference path="../engine/script.ts" />

namespace Script {

	export class TestTween extends Script {

		code = new Map<number, FunctionPackage>([
			// [1000, {func: this.v1, args: null}],
			// [1000, {func: this.v2, args: null}],
		])

		v2() {
			console.log('starting make tween script (v2)');
			let gui: System.GUIManager = this.ecs.getSystem(System.GUIManager);
			let iid = gui.createSprite('test1');
			gui.tween(iid, 'start');
		}

		v1() {
			console.log('starting make tween script (v1)');
			let e = this.ecs.addEntity();
			let guiSpec: GUI.SpriteSpec = {
				baseSpec: {
					base: "sprites/player/playerWalk",
					frames: 8,
					speed: 50,
					playType: "Loop",
				},
				startPos: {
					position: [0, 0],
					rotation: 0,
				},
				displaySpec: {
					stageTarget: "HUD",
					z: 'DEBUG',
				},
				tweens: {
					start: {
						visuals: [],
						sounds: [],
					}
				}
			};
			let guiSprite = new Component.GUISprite(guiSpec.baseSpec, guiSpec.displaySpec);
			let pos = new Component.Position(new Point(0, 0));
			let tweenable = new Component.Tweenable();
			tweenable.tweenQueue.push({
				prop: 'x',
				spec: {
					val: 640,
					valType: 'rel',
					duration: 2000,
					delay: 1000,
					method: 'easeOutCubic',
				}
			});
			tweenable.tweenQueue.push({
				prop: 'y',
				spec: {
					val: 360,
					valType: 'rel',
					duration: 2000,
					delay: 3000,
					method: 'easeOutCubic',
				}
			});
			tweenable.tweenQueue.push({
				prop: 'x',
				spec: {
					val: -640,
					valType: 'rel',
					duration: 2000,
					delay: 5000,
					method: 'easeOutCubic',
				}
			});
			tweenable.tweenQueue.push({
				prop: 'y',
				spec: {
					val: -360,
					valType: 'rel',
					duration: 2000,
					delay: 7000,
					method: 'easeOutCubic',
				}
			});
			tweenable.tweenQueue.push({
				prop: 'x',
				spec: {
					val: 320,
					valType: 'abs',
					duration: 2000,
					delay: 9000,
					method: 'easeOutCubic',
				}
			});
			tweenable.tweenQueue.push({
				prop: 'y',
				spec: {
					val: 180,
					valType: 'abs',
					duration: 2000,
					delay: 9000,
					method: 'easeOutCubic',
				}
			});
			tweenable.tweenQueue.push({
				prop: 'angle',
				spec: {
					val: 0.01,
					valType: 'abs',
					duration: -1,
					delay: 9000,
					method: 'linear',
				}
			});
			this.ecs.addComponent(e, guiSprite);
			this.ecs.addComponent(e, pos);
			this.ecs.addComponent(e, tweenable);
		}
	}
}
