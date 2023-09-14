/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/knockback.ts" />
/// <reference path="timebomb.ts" />

namespace System {

	export class Knockback extends Timebomb {

		tbComp = Component.Knockback

		public componentsRequired = new Set<string>([
			Component.Knockback.name,
		])
	}
}
