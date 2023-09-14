/// <reference path="../engine/ecs.ts" />

namespace Component {

	/**
	 * For debugging stuff we determined from a tile.
	 */
	export class DebugTileInfo extends Engine.Component {
		constructor(public info: string) { super(); }
		public toString(): string { return this.info; }
	}
}
