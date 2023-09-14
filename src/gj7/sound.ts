namespace Sound {

	/**
	 * Used in game.
	 */
	export type Track = {
		path: string,
		volume: number,
		music: boolean,
		duration: number,
	}

	/**
	 * Specified externally (in sounds.json).
	 */
	export type ExternalTrack = {
		path: string,

		/**
		 * Value from 0.0 (muted) to 1.0 (full volume), inclusive. If not
		 * provided, defaults to 1.0 (full volume).
		 */
		volume?: number,

		/**
		 * If provided, treats as music. Defautls to false.
		 */
		music?: boolean,

		/**
		 * Required if music. Used for looping.
		 */
		duration?: number,
	}

	export type TrackID = string

	export type Collection = Map<TrackID, Track>

	/**
	 * Sounds emitted when moving on a particular surface. Syncs with
	 * animation.
	 */
	type Surface = {
		emitOnFrames: number[],
		sounds: TrackID[],
	}

	/**
	 * Specified externally by GUI elements and entities that make
	 * sound sounds when they do things.
	 */
	export type Delay = {
		/**
		 * One of these will be selected randomly and played.
		 */
		options: TrackID[],

		/**
		 * Optional. Should play immediately if not provided.
		 */
		delay?: number,
	}

	/**
	 * Used in-game to track a full package handled by the delay speaker.
	 */
	export type DelayData = {
		options: TrackID[],
		delay?: number,
		location?: Point,
	}

	/**
	 * Each `TrackID[]` is a list of options from which a single sound is
	 * selected to play. `move.emitOnFrames` specifies a list of frame numbers,
	 * and when any of the frame numbers are reached, it randomly plays one of
	 * the sounds from `move.sounds`.
	 */
	export type Entity = {
		damaged?: TrackID[],
		killed?: TrackID[],
		move?: {
			default?: Surface,
		},
	}

	/**
	 * Track IDs associated with a weapon's attack.
	 */
	export type Attack = {
		charge?: TrackID[],
		swing?: TrackID[],
		hit?: TrackID[],
	}

	/**
	 * Track IDs associated with a shield's actions.
	 */
	export type Shield = {
		raise?: TrackID[],
		lower?: TrackID[],
		block?: TrackID[],
	}
}
