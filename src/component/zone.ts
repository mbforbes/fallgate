/// <reference path="../core/base.ts" />
/// <reference path="../engine/ecs.ts" />

namespace Component {

	/**
	 * Zones are where players trigger game logic.
	 */
	export class Zone extends Engine.Component {

		/**
		 * Binary indicator of whether the player is in the zone.
		 */
		public containsPlayer: boolean = false

		/**
		 * Whether the zone is active. Inactive zones do not update with
		 * presence or transition events.
		 */
		public active: boolean

		/**
		 * Which zone types this zone is. This is relevant for simple zones
		 * (like camera areas or script regions). More complex zones (like
		 * spawn zones and tutorial zones) should have their own components to
		 * handle tracking the necessary data.
		 */
		public zoneTypes: Set<Logic.ZoneType>

		/**
		 * Gate ID, or null if no GateID. NOTE: can refactor to separate gate
		 * data holding thing if this is gross.
		 */
		public gateID: string|null

		/**
		 * Instruction to trigger upon first entering, or null.
		 */
		public instructionID: string|null

		/**
		 * Control to show while inside, or null.
		 */
		public controlID: string|null

		constructor(zoneSpec: Logic.ZoneSpec) {
			super();

			// convert and set.
			let zd = Logic.convertZoneSpec(zoneSpec);
			this.active = zd.active;
			this.zoneTypes = zd.zoneTypes;
			this.gateID = zd.gateID;
			this.instructionID = zd.instructionID;
			this.controlID = zd.controlID;
		}

		public toString(): string {
			return 'active: ' + (this.active ? Constants.CHECKMARK : Constants.XMARK) +
				', player: ' + (this.containsPlayer ? Constants.CHECKMARK : Constants.XMARK) +
				', gateID: ' + this.gateID +
				', instrID: ' + this.instructionID +
				', ctrlID: ' + this.controlID;
		}
	}
}
