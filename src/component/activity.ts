/// <reference path="../engine/ecs.ts" />

/**
 * Action answers the broader question of "what is the entity doing?"
 *
 * This is a 'choose 1' enum; each entity will be doing exactly 1 Action.
 */
enum Action {
	/**
	 * Used interally in system when nothing has been set yet.
	 */
	INVALID = -1,

	/**
	 * Default Action---all Animatables should implement this.
	 */
	Idle,

	/**
	 * When the entity has forward/backwards motion (turning alone doesn't
	 * count).
	 */
	Moving,

	/**
	 * When the entity is raising a shield to block.
	 */
	BlockRaising,

	/**
	 * When the entity is blocking with a shield.
	 */
	BlockHolding,

	/**
	 * When the entity is lowering a shield from a block.
	 */
	BlockLowering,

	/**
	 * When the entity is charging up an attack.
	 */
	Charging,

	/**
	 * When the entity is carrying out an attack.
	 */
	Swinging,

	/**
	 * When the entity is finishing an attack.
	 */
	Sheathing,

	/**
	 * When the entity is dying + then while it's dead (hang on last frame).
	 */
	Dead,

	/**
	 * When the entity has been hit and damaged.
	 */
	Staggering,

	/**
	 * When the entity is returning from Staggering to Idle.
	 */
	StaggerReturning,

	/**
	 * When the enemy is hit and paralyzed; consecutive knockbacks (usually)
	 * lead to a stagger.
	 */
	Knockback,

	/**
	 * When the entity attempted an attack and failed, i.e., their attack was
	 * blocked by something else.
	 */
	Blocked,

	/**
	 * When the entity is blocking and their shield got hit.
	 */
	Recoiling,

	/**
	 * When the entity is carrying out a quick attack (used as primary
	 * QuickAttack if entity has more than one).
	 */
	QuickAttacking,

	/**
	 * Second quick attack. Wart on game design we're doing it this way.
	 */
	QuickAttacking2,

	/**
	 * Powerful attack after landing two quick attacks in a row.
	 */
	ComboAttacking,


	//
	// Specialty actions. I don't think this is inefficient, just a little
	// ugly.
	//

	/**
	 * Something (gate, carpet) is opening / staying open.
	 */
	Opening,
}

namespace Component {

	export class Activity extends Engine.Component {

		/**
		 * For optimization: can be set to note that Action.Idle should always
		 * be used.
		 *
		 * TODO: probably remove this entirely.
		 */
		public idleOnly: boolean = false

		/**
		 * The action this entity is taking. One thing at a time, always.
		 */
		public get action(): Action { return this._action;}
		public set action(v: Action) {
			if (this._action !== v) {
				this._action = v;
				this.dirty();
			}
		}
		private _action: Action

		/**
		 * Whether the activity will always be changed manually (by
		 * some game logic) --- this makes the Activity system skip
		 * over this.
		 */
		public get manual() : boolean { return this._manual; }
		public set manual(v : boolean) {
			if (this._manual !== v) {
				this._manual = v;
				this.dirty();
			}
		}
		private _manual : boolean = false

		constructor(activitySpec: Anim.ActivitySpec) {
			super();
			let settings: Anim.Activity = Anim.convertActivity(activitySpec);
			this.action = settings.startAction;
			this.manual = settings.manual;
		}

		toString(): string {
			return Action[this.action];
		}
	}
}
