/// <reference path="../engine/ecs.ts" />
/// <reference path="timebomb.ts" />

namespace Component {

	export class Block extends Timebomb {

		// main settings
		public shield: Shield.Shield

		constructor(
				public blocker: Engine.Entity,
				public duration: number,
				shield: Shield.Shield) {
			super(duration, Destruct.Entity);
			this.shield = Shield.cloneShield(shield);
		}
	}
}
