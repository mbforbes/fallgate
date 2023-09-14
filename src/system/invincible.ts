/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/invincible.ts" />
/// <reference path="timebomb.ts" />

namespace System {

	export class Invincible extends Timebomb {

		tbComp = Component.Invincible

		public componentsRequired = new Set<string>([
			Component.Invincible.name,
		])
	}
}
