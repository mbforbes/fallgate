/// <reference path="../engine/ecs.ts" />

namespace Component {

	/**
	 * So we know where in the factory.json this was specified.
	 */
	export class DebugKVLayer extends Engine.Component {

		constructor(public layer: string) {
			super();
		}

		public toString(): string {
			return this.layer;
		}
	}
}
