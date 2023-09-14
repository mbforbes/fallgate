/// <reference path="../engine/ecs.ts" />
/// <reference path="timebomb.ts" />

namespace Component {

		/**
		 * If you were *Blocked* means that you were *attacking* and your
		 * attack got fully blocked.
		 */
		export class Recoil extends Timebomb {

			private static DEFAULT_DURATION = 300

			constructor(public duration: number = Recoil.DEFAULT_DURATION) {
				super(duration, Destruct.Component);
			}
		}
	}
