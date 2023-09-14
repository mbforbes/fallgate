namespace Events {

	/**
	 * List of all game event types.
	 */
	export enum EventTypes {
		Damage = 0,
		Charge,
		Swing,
		Checkpoint,
		ThingDead,

		/**
		 * Fired when player enters or leaves a zone.
		 */
		ZoneTransition,

		/**
		 * Fired when an attack is blocked.
		 */
		Block,

		/**
		 * Trigger for events before enemy stagger (like pause/slowmotion). A
		 * handler that catches this will fire the EnemyStagger event.
		 */
		EnemyStaggerPre,

		/**
		 * Fired when an enemy is staggered.
		 */
		EnemyStagger,

		/**
		 * Fired when player picks up a health item.
		 */
		ItemCollected,

		/**
		 * A little specific, but: emit blood on the ground.
		 */
		Bleed,

		/**
		 * Player has fulfilled OR unfulfilled exit conditions for level.
		 */
		ExitConditions,

		/**
		 * A menu keypress was registered.
		 */
		MenuKeypress,

		/**
		 * A debug keypress was registered (not done for all debug keys, only
		 * newer ones)
		 */
		DebugKeypress,

		/**
		 * Starts the "end of level" sequence.
		 */
		StartExitSequence,

		/**
		 * Asks for the scene switch.
		 */
		SwitchScene,

		/**
		 * When the gameplay starts at the beginning of a level.
		 */
		GameplayStart,

		/**
		 * Gates open and produce sounds and my design for this engine isn't
		 * great yet.
		 */
		GateOpen,

		/**
		 * Trigger to check all gates (and close any as needed).
		 */
		CheckGates,

		/**
		 * Trigger to show instructions.
		 */
		ShowInstructions,

		/**
		 * Trigger for game logic stuff DANG stop making events just use this!
		 */
		GameLogic,

		/**
		 * BOOM
		 */
		Explosion,

		/**
		 * For the end sequence.
		 */
		SwapBodies,

		/**
		 * For giving/revoking player control.
		 */
		PlayerControl,
	}

	// Below are all of the corresponding args objects for each of the above
	// event types.

	export type DamageArgs = {
		location: Point,

		/**
		 * Angle from attacker to victim.
		 */
		angleAtoV: number,
		internalDamage: number,
		attackInfo: Weapon.AttackInfo,
		victim: Engine.Entity,
		victimType: Ontology.Thing,
	}

	/**
	 * Used for the events:
	 *  - Charge
	 *  - Swing
	 */
	export type AttackArgs = {
		attackInfo: Weapon.AttackInfo,
		location: Point,
	}

	export type CheckpointArgs = {
		checkpoint: Engine.Entity,
		location: Point,
	}

	export type ThingDeadArgs = {
		location: Point,
		thing: Engine.Entity,
		thingType: Ontology.Thing,
	}

	export type ZoneTransitionArgs = {
		/**
		 * True if entering the zone, false if exiting.
		 */
		enter: boolean,

		/**
		 * The zone.
		 */
		zone: Engine.Entity,
	}

	export type BlockArgs = {
		shield: Shield.Shield,
		defenderType: Ontology.Thing,

		/**
		 * Angle from attacker to blocker.
		 */
		angleAtoB: number,
	}

	export type EnemyStaggerPreArgs = {
		/**
		 * Angle from attacker to victim.
		 */
		angleAtoV: number,

		/**
		 * Location of the victim.
		 */
		vLocation: Point,

		/**
		 * Whether to show heavy effects
		 */
		heavyEffects: boolean,
	}

	/**
	 * Same property descriptions as EnemyStaggerPreArgs.
	 */
	export type EnemyStaggerArgs = {
		angleAtoV: number,
		vLocation: Point,
		heavyEffects: boolean,
	}

	export type ItemCollectedArgs = {
		itemType: Ontology.Item,
		location: Point,
	}

	export type BleedArgs = {
		/**
		 * Keys in fx.json (all will be emitted).
		 */
		fx: string[],
		location: Point,
	}

	export type ExitConditionsArgs = {
		silent: boolean,
		fulfilled: boolean,
	}

	export type MenuKeypressArgs = {
		/**
		 * One of GameKey.* strings
		 */
		key: string,
	}

	export type DebugKeypressArgs = {
		/**
		 * One of GameKey.* strings
		 */
		key: string,
	}

	export type StartExitSequenceArgs = {}

	export type SwitchSceneArgs = {
		/**
		 * if prep == true, does the fade out. if prep == false, does the
		 * actual scene switch. sending prep == true will cause the event
		 * handler to publish its own prep == false event.
		 */
		prep: boolean,

		/**
		 * If not specified, defaults to going to next level (1). Otherwise,
		 * adds this value to the level index (e.g., providing -1 goes back one
		 * level).
		 */
		increment?: number,
	}

	export type GameplayStartArgs = {}

	export type GateOpenArgs = {}

	export type CheckGatesArgs = {}

	export type ShowInstructionsArgs = {
		instructionsID: string,
	}

	export enum Phase {
		TitleScreenShow = 0,
		CreditsShow,
		RecapShow,
	}

	export type GameLogicArgs = {
		phase: Phase,
	}

	export type ExplosionArgs = {}

	export type SwapBodiesArgs = {
		toHumanoid: boolean,
	}

	export type PlayerControlArgs = {
		allow: boolean,
	}
}
