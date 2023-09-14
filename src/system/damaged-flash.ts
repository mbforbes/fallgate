/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/damaged-flash.ts" />
/// <reference path="timebomb.ts" />

namespace System {

	export class DamagedFlash extends Timebomb {

		tbComp = Component.DamagedFlash

		public componentsRequired = new Set<string>([
			Component.DamagedFlash.name,
		])
	}
}
