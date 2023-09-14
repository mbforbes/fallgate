// Game logic relevant things. If you think of a better name I'm all ears.

namespace Logic {

	export enum ZoneType {
		Camera = 0,
		NearExit,
		NextToExit,
		EnemyGateGroup,
	}

	/**
	 * Internal representation of zone info.
	 */
	export type ZoneData = {
		zoneTypes: Set<ZoneType>,
		active: boolean,
		gateID: string|null,
		instructionID: string|null,
		controlID: string|null,
	}

	/**
	 * Convert external zone spec to internal zone info.
	 * @param zoneSpec
	 */
	export function convertZoneSpec(zoneSpec: ZoneSpec): ZoneData {
		// built up set of zone types
		let zts = new Set<ZoneType>();
		if (zoneSpec.zoneTypes != null) {
			for (let rzt of zoneSpec.zoneTypes) {
				let zt = ZoneType[rzt];
				if (zt == null) {
					throw new Error('Unknown ZoneType: "' + rzt + '".');
				}
				zts.add(zt);
			}
		}

		// default active to true
		let active = true;
		if (zoneSpec.active != null) {
			active = zoneSpec.active;
		}

		return {
			zoneTypes: zts,
			active: active,
			gateID: zoneSpec.gateID || null,
			instructionID: zoneSpec.instructionID || null,
			controlID: zoneSpec.controlID || null,
		}
	}

	/**
	 * Specified externally.
	 */
	export type ZoneSpec = {
		/**
		 * Zero or more of the `ZoneType`s above (must match capitalization).
		 */
		zoneTypes?: string[],

		/**
		 * Whether the zone starts active. Defaults to true if not set.
		 */
		active?: boolean,

		/**
		 * ID for the corresponding gate. Applicable for EnemyGateGroup gates.
		 * NOTE: can pull this into a separate component if it's sullying the
		 * purity of the ZoneSpec.
		 */
		gateID?: string,

		/**
		 * If set, the instruciton ID to trigger when the player enters the
		 * zone.
		 */
		instructionID?: string,

		/**
		 * If set, the control ID to show whenever the player is in the zone.
		 */
		controlID?: string,
	}

	export type Gate = {
		/**
		 * ID of the Gate---used for matching Gates up with EnemyGateGroup
		 * Zones.
		 */
		id?: string,

		/**
		 * Whether this is the final Gate of the level. Defaults to false.
		 */
		exit?: boolean

		/**
		 * Whether this is the starting Gate of the level. Defaults to false.
		 */
		start?: boolean
	}
}
