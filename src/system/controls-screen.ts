/// <reference path="../../lib/pixi.js.d.ts" />

/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/player-input.ts" />
/// <reference path="../component/input.ts" />

namespace System {

	/**
	 * Holds the actual display.
	 */
	class ControlsScreenAspect extends Engine.Aspect {
		overlay = Stage.Sprite.build(
			'HUD/controlsScreen.png', ZLevelHUD.Overlay, StageTarget.HUD,
			new Point(), new Point(0.5, 0.5))


		private _visible : boolean;
		public get visible() : boolean {
			return this._visible;
		}
		public set visible(v : boolean) {
			this.overlay.alpha = v ? 1.0 : 0.0;
			this._visible = v;
		}


		constructor(screenSize: Point) {
			super();

			this.visible = true;
			this.overlay.position.set(screenSize.x/2, screenSize.y/2);
		}
	}

	/**
	 * Handles bringing up the controls screen.
	 */
	export class ControlsScreen extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Input.name,
			Component.PlayerInput.name,
		])

		constructor(private stage: Stage.MainStage, private screenSize: Point) {
			super();
		}

		@override
		public makeAspect(): ControlsScreenAspect {
			return new ControlsScreenAspect(this.screenSize);
		}

		@override
		public onAdd(aspect: ControlsScreenAspect): void {
			// send the aspect's display object to the outer renderer.
			this.stage.add(aspect.overlay);
		}

		public update(delta: number, entities: Map<Engine.Entity, ControlsScreenAspect>): void {
			// Currently should be only one (just the player).
			for (let aspect of entities.values()) {
				let input = aspect.get(Component.Input);
				if (input.controls) {
					aspect.visible = !aspect.visible;
				}
			}
		}
	}
}
