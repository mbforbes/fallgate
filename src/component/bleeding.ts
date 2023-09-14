/// <reference path="../engine/ecs.ts" />

namespace Component {

	export class Bleeding extends Timebomb {

		// main settings
		public frequency: number
		public fx: string[]

		constructor(blood: Attributes.Blood) {
			super(blood.duration, Destruct.Component);

			this.frequency = blood.frequency;
			this.fx = clone(blood.fx);
		}
	}
}
