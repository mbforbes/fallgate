/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/gui.ts" />

namespace Component {

	export class GUISprite extends Engine.Component {

		public baseData: Anim.BaseData
		public displayData: Anim.DisplayData

		constructor(
				baseSpec: Anim.BaseSpec,
				displaySpec: Anim.DisplaySpec) {
			super();

			this.baseData = Anim.convertBaseSpec(baseSpec);
			this.displayData = Anim.convertDisplaySpec(displaySpec);
		}
	}
}
