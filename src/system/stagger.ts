/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/stagger.ts" />
/// <reference path="timebomb.ts" />

namespace System {

	export class Stagger extends Timebomb {

		tbComp = Component.Stagger

		public componentsRequired = new Set<string>([
			Component.Stagger.name,
		])
	}
}
