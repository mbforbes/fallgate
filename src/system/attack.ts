/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/active-attack.ts" />
/// <reference path="../component/attack.ts" />
/// <reference path="timebomb.ts" />

namespace System {

	export class Attack extends Timebomb {

		tbComp = Component.Attack

		public componentsRequired = new Set<string>([
			Component.Attack.name,
			Component.ActiveAttack.name,
		])
	}
}
