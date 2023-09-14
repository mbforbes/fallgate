/// <reference path="../engine/ecs.ts" />

namespace Component {

	/**
	 * Denotes baddies.
	 */
	export class Enemy extends Engine.Component {

		public enemyName: string
		public kind: string

		/**
		 * Denotes whether the enemy bars the EXIT level gate.
		 */
		public gatekeeper: boolean

		/**
		 * Denots whether the enemy has been zone checked
		 */
		public zoneChecked: boolean = false

		/**
		 * Denotes what Gate the entity is linked to, or null if none.
		 */
		public gateID: string|null = null

		/**
		 * Denotes a boss. Currently only used for coloring the health bar
		 * special.
		 */
		public boss: boolean

		/**
		 * Denotes final boss.
		 */
		public finalBoss: boolean

		/**
		 * Whether the HUD has been manually disabled (for, e.g., huge clumps
		 * of enemies).
		 */
		public hudDisabled: boolean

		constructor(settings: GJ7.Enemy) {
			super();

			this.enemyName = Probability.uniformChoice(settings.names);
			this.kind = settings.kind;
			this.gatekeeper = settings.gatekeeper || false;
			this.boss = settings.boss || false;
			this.hudDisabled = settings.hudDisabled || false;
			this.finalBoss = settings.finalBoss || false;
		}

		public toString(): string {
			return this.enemyName + ' (' + this.kind + ')' +
				' boss: ' + (this.boss ? Constants.CHECKMARK : Constants.XMARK) +
				' gatekeeper: ' + (this.gatekeeper ? Constants.CHECKMARK : Constants.XMARK) +
				' zoneChecked: ' + (this.zoneChecked ? Constants.CHECKMARK : Constants.XMARK) +
				' gateID: ' + this.gateID;
		}
	}
}
