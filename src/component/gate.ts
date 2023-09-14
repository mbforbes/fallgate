/// <reference path="../core/base.ts" />
/// <reference path="../engine/ecs.ts" />

namespace Component {

	/**
	 * Gates mark segment and level boundaries.
	 */
	export class Gate extends Engine.Component {

		constructor(public start: boolean, public exit: boolean, public id: string|null) {
			super();
		}

		public toString(): string {
			return 'id: ' + this.id +
				', exit: ' + (this.exit ? Constants.CHECKMARK : Constants.XMARK) +
				', start: ' + (this.start ? Constants.CHECKMARK : Constants.XMARK);
		}
	}
}
