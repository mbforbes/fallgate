/// <reference path="../../lib/pixi.js.d.ts" />

/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/dummy.ts" />
/// <reference path="../system/player-input.ts" />

namespace System {

	export class CrosshairRenderer extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Dummy.name,
		])

		protected dobj: Stage.Sprite = null

		constructor(private inputMouse: InputMouse, private stage: Stage.MainStage) {
			super();
		}

		@override
		public onDisabled(entities: Map<Engine.Entity, Engine.Aspect>): void {
			if (this.dobj != null) {
				this.stage.remove(this.dobj);
				this.dobj = null;
			}
		}

		private ensureDobj(): void {
			if (this.dobj != null) {
				return;
			}

			// settings
			let color = 0x000000;
			let opacity = 0.7;
			let length = 30;
			let width = 6

			// create
			let g = new PIXI.Graphics();
			g.beginFill(color, opacity);
			g.drawRect(-length/2, -width/2, length, width);
			g.drawRect(-width/2, -length/2, width, length);
			g.endFill();
			let s = new Stage.Sprite(g.generateCanvasTexture(), ZLevelWorld.DEBUG, StageTarget.World);
			s.anchor.set(0.5, 0.5);
			this.dobj = s;
			this.stage.add(s);
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			this.ensureDobj();
			this.dobj.position.set(this.inputMouse.worldPosition.x, this.inputMouse.worldPosition.y);
		}
	}
}
