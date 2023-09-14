/// <reference path="../engine/ecs.ts" />

namespace Component {
	export class LockOn extends Engine.Component {
		constructor(public fresh: boolean = true) {
			super();
		}
	}
}
