/// <reference path="../engine/ecs.ts" />

namespace Component {

	/**
	 * Dummy will never be added to any entities. It exists for systems which
	 * run without entities.
	 */
	export class Dummy extends Engine.Component {
	}
}
