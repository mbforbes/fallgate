/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/ontology.ts" />

namespace Component {

	/**
	 * An Item Component  marks an entity as an item and denotes item
	 * properties.
	 */
	export class Item extends Engine.Component {
		public behavior: Ontology.Item
		public instructionID?: string
		public gateID?: string

		constructor(public data: GJ7.ItemData) {
			super();

			this.behavior = data.classificiation;
			this.instructionID = data.instructionID;
			this.gateID = data.gateID;
		}

		toString(): string {
			return 'behavior: ' + Ontology.Item[this.behavior] +
				', gateID: ' + this.gateID +
				', instructionID: ' + this.instructionID;
		}

	}
}
