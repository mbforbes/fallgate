/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/sound.ts" />

namespace Component {

	/**
	 * Audible denotes that an entity has sound effects associated with it,
	 * mapping from events it can undergo to Track IDs for what sounds to play.
	 */
	export class Audible extends Engine.Component {
		// main settings
		public sounds: Sound.Entity

		constructor(sounds: Sound.Entity) {
			super();
			this.sounds = clone(sounds);
		}
	}
}
