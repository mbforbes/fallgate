/// <reference path="../engine/ecs.ts" />
/// <reference path="timebomb.ts" />

namespace Component {

	export class Attack extends Timebomb {

		// main settings
		public info: Weapon.AttackInfo

		/**
		 * Whether the attack has hit something (used for combo logic).
		 */
		public hit: boolean = false

		/**
		 * Used to limit heavy-duty effects (like pause and flash) shown per
		 * attack.
		 */
		public heavyEffectsShown: boolean = false

		/**
		 * @param attacker
		 * @param info
		 */
		constructor(public attacker: Engine.Entity, info: Weapon.AttackInfo) {
			super(info.duration, Destruct.Entity);
			this.info = Weapon.cloneAttackInfo(info);
		}

		@override
		public toString(): string {
			return super.toString() + 'attack info: ' + JSON.stringify(this.info);
		}
	}
}
