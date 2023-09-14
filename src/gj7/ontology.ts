namespace Ontology {

	/**
	 * Coarse level `Thing` categories multiplex behavior.
	 */
	export enum Thing {
		UNSPECIFIED = 0,
		Player,
		Enemy,
		Destructible,
		Item,
	}

	export enum Item {
		Health = 0,
		Doughnut,
		UpgradeSword,
		UpgradeShield,
		UpgradeHP4,
		UpgradeStabCombo,
		UpgradeSpeed,
		UpgradeBow,
		UpgradeAOECombo,
		UpgradeHP5,
		TransformToBlop,
		TransformToPlayer,
	}
}
