/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/weapon.ts" />
/// <reference path="../component/activity.ts" />
/// <reference path="../component/armed.ts" />
/// <reference path="../component/shielded.ts" />

namespace System {

	export class Activity extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Activity.name,
		])

		// Determines which action (type of animation) should be shown.
		private determineAction(aspect: Engine.Aspect): Action {
			// Highest priority: Life states (e.g., Dead)
			if (aspect.has(Component.Dead)) {
				return Action.Dead;
			}

			// High priority: Events that happen to the player (e.g. stagger,
			// knockback, blocked, recoil)
			if (aspect.has(Component.Stagger)) {
				return Action.Staggering;
			}
			if (aspect.has(Component.StaggerReturn)) {
				return Action.StaggerReturning;
			}
			if (aspect.has(Component.Knockback)) {
					return Action.Knockback;
			}
			if (aspect.has(Component.Blocked)) {
				return Action.Blocked;
			}
			if (aspect.has(Component.Recoil)) {
				return Action.Recoiling;
			}

			// Blocking.
			if (aspect.has(Component.Shielded)) {
				let shielded = aspect.get(Component.Shielded);
				switch (shielded.state) {
					case Shield.BlockState.Raise:
						return Action.BlockRaising;
					case Shield.BlockState.Block:
						return Action.BlockHolding;
					case Shield.BlockState.Lower:
						return Action.BlockLowering;
				}
			}

			// Attacking (charge/swing/sheathe). Not all of the swing states
			// force explicit animations (e.g., 'ready' doesn't; we proceed to
			// 'moving' or 'idle' below).
			if (aspect.has(Component.Armed)) {
				let armed = aspect.get(Component.Armed);
				switch (armed.state) {
					case Weapon.SwingState.ChargeCharging:
					case Weapon.SwingState.ChargeReady:
						return Action.Charging;
					case Weapon.SwingState.Swing:
						return Action.Swinging;
					case Weapon.SwingState.Sheathe:
						return Action.Sheathing;
					case Weapon.SwingState.QuickAttack:
						return Action.QuickAttacking;
					case Weapon.SwingState.QuickAttack2:
						return Action.QuickAttacking2;
					case Weapon.SwingState.Combo:
						return Action.ComboAttacking;
				}
			}

			// Moving
			if (aspect.has(Component.Input)) {
				let input = aspect.get(Component.Input);
				if (input.intent.y != 0 || input.intent.x != 0) {
					return Action.Moving;
				}
			}

			// Default
			return Action.Idle;
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			for (let aspect of entities.values()) {
				let activity = aspect.get(Component.Activity);

				// don't do any logic if it's set to manual mode
				if (activity.manual) {
					continue;
				}

				// otherwise, do full check
				activity.action = this.determineAction(aspect);
			}
		}
	}
}
