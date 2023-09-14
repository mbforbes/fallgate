/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/block.ts" />
/// <reference path="timebomb.ts" />

namespace System {

	export class Block extends Timebomb {

		tbComp = Component.Block

		public componentsRequired = new Set<string>([
			Component.Block.name,
		])
	}
}
