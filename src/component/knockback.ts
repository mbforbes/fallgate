/// <reference path="../engine/ecs.ts" />
/// <reference path="timebomb.ts" />

namespace Component {

	export class Knockback extends Timebomb {

		constructor(public duration: number) {
			super(duration, Destruct.Component);
		}
	}
}
