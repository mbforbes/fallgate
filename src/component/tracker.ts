/// <reference path="../core/base.ts" />
/// <reference path="../engine/ecs.ts" />

namespace Component {

	/**
	 * Tracker denotes an entity that tracks the position of another entity (the
	 * `target`).
	 */
	export class Tracker extends Engine.Component {

		// main settings
		public offset: Point
		public internalOffset: Point

		/**
		 *	target			   --- the thing to track. Tracks at its center.
		 *
		 *	offset			   --- offset that the Tracker's location is
		 *						   positioned relative to the target's computed
		 *						   origin
		 *
		 *	trackRotation	   --- if set, `offset` will be computed relative to
		 *						   the target's rotation.
		 *
		 *	internalOffset	   --- the final offset that will be applied to make
		 *						   this entity line up as desired (e.g., make
		 *						   something besides its center its center
		 *						   track)
		 */
		constructor(
			public target: Engine.Entity,
			offset: Point = new Point(),
			public trackRotation: boolean = true,
			internalOffset: Point = new Point()) {
			super();

			this.offset = offset.copy();
			this.internalOffset = internalOffset.copy();
		}

		public toString(): string {
			return 'target: ' + this.target +
				', offset: ' + this.offset +
				', trackRot: ' + this.trackRotation +
				', internalOffset: ' + this.internalOffset;
		}
	}
}
