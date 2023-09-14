/// <reference path="../core/keyboard.ts" />
/// <reference path="../engine/ecs.ts" />

namespace System {

	export class DebugGameSpeed extends Engine.System {

		// state
		private prevDigits = [false, false, false, false]
		private digitKeys = [GameKey.Digit1, GameKey.Digit2, GameKey.Digit3, GameKey.Digit4]
		private slowScales = [1, 2, 4, 8]

		public componentsRequired = new Set<string>([
			Component.Dummy.name,
		])

		constructor(private keyboard: Keyboard) {
			super(false, true);
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			// same with digits. damn, really should have "button press" as an
			// input abstraction... maybe...
			for (let i = 0; i < this.digitKeys.length; i++) {
				let wantDigit = this.keyboard.gamekeys.get(this.digitKeys[i]).isDown;
				if (wantDigit && !(this.prevDigits[i])) {
					this.ecs.slowMotion.debugFactor = this.slowScales[i];
				}
				this.prevDigits[i] = wantDigit;
			}
		}
	}
}
