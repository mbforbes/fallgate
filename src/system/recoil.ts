/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/recoil.ts" />
/// <reference path="timebomb.ts" />

namespace System {

	export class Recoil extends Timebomb {

		tbComp = Component.Recoil

		public componentsRequired = new Set<string>([
			Component.Recoil.name,
		])
	}
}
