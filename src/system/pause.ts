/// <reference path="../core/keyboard.ts" />
/// <reference path="../engine/ecs.ts" />

namespace System {

	export class Pause extends Engine.System {

		// state
		private prevPause = false
		private guiElements: Engine.Entity[] = []

		public componentsRequired = new Set<string>([
			Component.Dummy.name,
		])

		constructor(private keyboard: Keyboard) {
			super(false, true);
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			// detect new pause button presses to toggle
			let wantPause = this.keyboard.gamekeys.get(GameKey.P).isDown;
			if (wantPause && !this.prevPause) {
				// toggle
				this.ecs.slowMotion.debugPaused = !this.ecs.slowMotion.debugPaused;

				// do gui stuff
				let gui = this.ecs.getSystem(GUIManager);
				if (this.ecs.slowMotion.debugPaused) {
					this.guiElements.push(...gui.runSequence('paused'));
				} else {
					while (this.guiElements.length > 0) {
						gui.tween(this.guiElements.pop(), 'exit');
					}
				}
			}

			this.prevPause = wantPause;
		}
	}
}
