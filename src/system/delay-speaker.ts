/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/sound.ts" />

namespace System {

	/**
	 * Simply plays sounds after a delay.
	 *
	 * TODO: shouldn't really be system.
	 */
	export class DelaySpeaker extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Dummy.name,
		])

		private soundQueue: Sound.DelayData[] = [];

		public enqueue(sd: Sound.DelayData): void {
			this.soundQueue.push(clone(sd));
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			for (let i = this.soundQueue.length - 1; i >= 0; i--) {
				// check if ready and play
				if (this.soundQueue[i].delay == null || this.soundQueue[i].delay < delta) {
					this.ecs.getSystem(System.Audio).play(
						this.soundQueue[i].options, this.soundQueue[i].location);
					this.soundQueue.splice(i, 1);
				} else {
					// else, decrement wait time
					this.soundQueue[i].delay -= delta;
				}
			}
		}
	}
}
