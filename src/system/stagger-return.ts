/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/stagger-return.ts" />
/// <reference path="timebomb.ts" />

namespace System {

	export class StaggerReturn extends Timebomb {

		tbComp = Component.StaggerReturn

		public componentsRequired = new Set<string>([
			Component.StaggerReturn.name,
		])
	}
}
