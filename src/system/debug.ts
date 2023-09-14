/// <reference path="../engine/ecs.ts" />
/// <reference path="../core/keyboard.ts" />
/// <reference path="../component/dummy.ts" />

namespace System {

	export class Debug extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Dummy.name,
		])

		private prevToggle = false
		private systemsToToggle = [
			System.DebugCamera.name,
			// System.DebugPositionRenderer.name,
			System.DebugCollisionRenderer.name,
			// System.DebugMouseRenderer.name,
			// System.DebugComponentRenderer.name,
			System.DebugEntitySelector.name,
			System.DebugInspectionRenderer.name,
			System.DebugTimingRenderer.name,
		]

		constructor(private keyboard: Keyboard) {
			super(false, true);
			this.keyboard.register(new GameKey(GameKey.Tilde));
		}

		private toggle(): void {
			for (let sysName of this.systemsToToggle) {
				this.ecs.toggleSystemByName(sysName);
			}
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			let curToggle = this.keyboard.gamekeys.get(GameKey.Tilde).isDown;
			if (!this.prevToggle && curToggle) {
				this.toggle();
			}
			this.prevToggle = curToggle;
		}
	}
}
