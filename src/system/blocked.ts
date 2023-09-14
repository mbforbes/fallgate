/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/blocked.ts" />
/// <reference path="timebomb.ts" />

namespace System {

	export class Blocked extends Timebomb {

		tbComp = Component.Blocked

		public componentsRequired = new Set<string>([
			Component.Blocked.name,
		])
	}
}
