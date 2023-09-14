/// <reference path="../engine/ecs.ts" />

namespace Component {

	export class PersistentDamage extends Engine.Component {
		constructor(public attackInfo: Weapon.AttackInfo) {
			super();
		}
	}
}
