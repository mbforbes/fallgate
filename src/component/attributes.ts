/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/attributes.ts" />

namespace Component {

	export class Attributes extends Engine.Component {
		// main settings
		public data: Attributes.All

		constructor(data: Attributes.All) {
			super();
			this.data = clone(data);
		}
	}
}
