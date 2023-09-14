namespace Attributes {
	/**
	 * Feature (flash, invincible, immobile) groupings.
	 */
	export enum HitBehavior {
		Player = 0,
		StandardEnemy,
	}

	/**
	 * Behavior and timings for what happens when something gets hit.
	 */
	export type HitSettings = {
		hitBehavior: HitBehavior,
		knockbackAnimDuration: number,
		knockbackBehaviorDuration: number,
		staggerDuration: number,
		staggerReturnDuration: number,
	}

	export type Blood = {
		/**
		 * How frequently to emit an FX particle.
		 */
		frequency: number,

		/**
		 * For how long to emit FX particles (NOT how long each particle lives;
		 * that's defined in the FX.Config.Duration). The number of particles
		 * emitted will be duration / frequency.
		 */
		duration: number,

		/**
		 * Which particles to emit
		 */
		fx: string[],
	}

	export type HitFX = {
		/**
		 * Which partile to emit.
		 */
		fxName: string,

		/**
		 * Whether to explicitly orient the hit FX (e.g., directional blood
		 * droplets). Assumed false if not provided.
		 */
		face?: boolean,
	}

	/**
	 * All attributes recorded for a given object. Update this with more as we
	 * desire more.
	 */
	export type All = {
		hitSettings?: HitSettings,
		hitFX?: HitFX[],
		hitBlood?: Blood,
		deathFX?: string[],
		deathBlood?: Blood,
	}
}
