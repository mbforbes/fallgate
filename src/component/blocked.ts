/// <reference path="../engine/ecs.ts" />
/// <reference path="timebomb.ts" />

namespace Component {

	/**
	 * If you were *Blocked* means that you were *attacking* and your attack
	 * got fully blocked.
	 */
	export class Blocked extends Timebomb {

		public static DEFAULT_DURATION = 750

		constructor(public duration: number) {
			super(duration, Destruct.Component);
		}
	}
}
