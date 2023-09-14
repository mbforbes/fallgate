/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/typography.ts" />

namespace Component {

	/**
	 * TextRenderable denotes entities that should be rendered as text. Only
	 * bare bones info is given here (not even sure it belongs in ECS); the
	 * system that renders it will turn it into all the necessary properties.
	 */
	export class TextRenderable extends Engine.Component {
		constructor(
				public textData: Typography.TextData,
				public displayData: Anim.DisplayData) {
			super();
		}
	}
}
