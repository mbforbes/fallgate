/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/constants.ts" />

namespace Component {
	export class StaticRenderable extends Engine.Component {
		/**
		 * Manual dimensions should only be set if they should be altered from
		 * the original. If they are not provided, or if (0,0) is provided, the
		 * original will be used.
		 * @param img
		 * @param z
		 * @param stageTarget
		 * @param manualDims
		 */
		constructor(
				public img: string,
				public z: ZLevelWorld | ZLevelHUD,
				public stageTarget: StageTarget,
				public anchor: Point = new Point(0.5, 0.5),
				public manualDims: Point = new Point()) {
			super();
		}

		toString(): string {
			return this.img;
		}
	}
}

