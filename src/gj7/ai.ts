namespace AI {

	/**
	 * Select the AI here.
	 */
	export enum Behavior {
		Cow = 0,
		Archer,
		Brawler,
		Spider,
		Mimic,
		Forward,
		SwingTimer,
		Sawtooth,
		FollowSawtooth,
		Coward,
		Sentinel,
	}

	// Parameters for corresponding AI Behaviors go here.

	export type CowParams = {
		/**
		 * Number in [0, 1]. Probability of moving.
		 */
		moveChance: number
	}

	export type BrawlerParams = {
		/**
		 * If something the AI wants to attack is within `attackRange` from
		 * itself, it will start swinging.
		 */
		attackRange: number,

		/**
		 * If an enemy (i.e., the player) gets within this distance from an
		 * AI's *home* (not its current location), it will start pursuing it.
		 */
		noticeDistance: number,

		/**
		 * The AI will pursue an enemy up to `pursuitDistance` from its *home*
		 * (not its current location).
		 */
		pursuitDistance: number,

		/**
		 * Whether to "forget" about the player and turn around once the player
		 * leaves the `pursuitDistance`. If false, will pursue literally
		 * forever once it spots the player once.
		 */
		forget: boolean,
	}

	export type SentinelParams = BrawlerParams

	export type SpiderParams = {
		// wait timing
		waitMin: number
		waitMax: number

		// move timing
		moveMin: number
		moveMax: number

		// attack settings
		attackRange: number,
	}

	export type MimicParams = BrawlerParams

	export type ForwardParams = {
		/**
		 * How long to wait before moving.
		 */
		beforeWaitTime: number,

		/**
		 * Whether to face the exit when it starts moving.
		 */
		faceExit: boolean,

		/**
		 * How long to move forward before stopping.
		 */
		forwardTime: number,
	}

	export type SwingTimerParams = {
		/**
		 * How long to wait at start of game before beginning the period
		 * specified by wait/attack. Allows coordination between different
		 * instances of the same AI.
		 */
		initialWait: number,

		/**
		 * how long to have no inputs
		 */
		wait: number,

		/**
		 * how long to (charge/swing/sheathe) attack
		 */
		attack: number,
	}

	export type SawtoothParams = {
		kiteSpeedScale: number,
		kiteRadius: number,
		aggressiveRadius: number,
		dodges: number,
		dodgeRotate: boolean,
		dodgeDodgeTime: number,
		dodgeWaitTime: number,
		attackSpeedScale: number,
		escapeTime: number,
		escapeSpeedScale: number,
		cooldownTime: number,
		countdownTime: number,
	}

	export type FollowSawtoothParams = {
		pursueRadius: number,
		countdownTime: number,
	}

	export type CowardParams = {
		reactRadius: number,
		playerLookDegrees: number,
		attackRadius: number,
	}

	//
	//
	//

	/**
	 * This is the type that should be put as the value for the "ai" key in the
	 * factory.json.
	 */
	export type FactorySpec = {
		/**
		 * This should be the name of one of the options above under Behavior
		 * (e.g., "Cow").
		 */
		behavior: string,

		/**
		 * This should be a fully fleshed-out set of the corresponding
		 * "*Params" object for the behavior that you picked. For example, if
		 * you picked "Cow" for the behavior, than this would be a CowParams
		 * object, which would look like {moveChance: 0.8}.
		 */
		params: any,
	}

	/**
	 * Corresponding game type that FactorySpec gets converted into.
	 */
	export type GameSpec = {
		behavior: Behavior,
		params: any,
	}

	/**
	 * AIAspects store these, and then each AI stores its own blackboard
	 * within. That lets each AI manage its own scratch space.
	 */
	export type Blackboards = Map<any, any>
}
