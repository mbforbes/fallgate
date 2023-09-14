/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/immobile.ts" />
/// <reference path="timebomb.ts" />

namespace System {

	export class Immobile extends Timebomb {

		tbComp = Component.Immobile

		public componentsRequired = new Set<string>([
			Component.Immobile.name,
		])
	}
}
