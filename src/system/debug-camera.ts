/// <reference path="../core/lang.ts" />
/// <reference path="../core/base.ts" />
/// <reference path="../core/keyboard.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/stage.ts" />
/// <reference path="../system/player-input.ts" />

namespace System {

	export class DebugCamera extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Dummy.name,
		])

		private prev_in = false
		private prev_out = false
		private prev_left = false
		private prev_right = false
		private prev_down = false
		private prev_up = false

		private prev_intent = new Point()
		private intent = new Point()
		private prev_zoom = 0

		constructor(private keyboard: Keyboard, private stage: Stage.MultiZStage, disabled: boolean) {
			super(disabled, true);

		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			// first figure out the player's intent
			let left = this.keyboard.gamekeys.get(GameKey.Left).isDown;
			let right = this.keyboard.gamekeys.get(GameKey.Right).isDown;
			let up = this.keyboard.gamekeys.get(GameKey.Up).isDown;
			let down = this.keyboard.gamekeys.get(GameKey.Down).isDown;
			let zoomin = this.keyboard.gamekeys.get(GameKey.Equal).isDown;
			let zoomout = this.keyboard.gamekeys.get(GameKey.Minus).isDown;

			this.intent.x = InputKeyboard.resolve_pair(this.prev_left, left, this.prev_right, right, this.prev_intent.x);
			this.intent.y = InputKeyboard.resolve_pair(this.prev_up, up, this.prev_down, down, this.prev_intent.y);
			let zoom = InputKeyboard.resolve_pair(this.prev_out, zoomout, this.prev_in, zoomin, this.prev_zoom);

			// bookkeeping
			this.intent.copyTo(this.prev_intent);
			this.prev_zoom = zoom;
			this.prev_left = left;
			this.prev_right = right;
			this.prev_up = up;
			this.prev_down = down;
			this.prev_in = zoomin;
			this.prev_out = zoomout;

			// act on stage
			this.stage.x -= 5 * this.intent.x;
			this.stage.y -= 5 * this.intent.y;
			let scale = this.stage.scale.x + 0.01 * zoom;
			this.stage.scale.set(scale, scale);

			// stage loc
			// console.debug('stage at:' + this.stage.x + ', ' + this.stage.y +
			//	'; scale: (' + this.stage.scale.x + ', ' + this.stage.scale.y + ')');
		}
	}
}

