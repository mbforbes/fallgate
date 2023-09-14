/// <reference path="../engine/ecs.ts" />
/// <reference path="timebomb.ts" />

namespace Component {

	export class StaggerReturn extends Timebomb {

		constructor(public duration: number) {
			super(duration, Destruct.Component);
		}
	}
}
