/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/weapon.ts" />
/// <reference path="../gj7/shield.ts" />
/// <reference path="../component/activity.ts" />
/// <reference path="../component/body.ts" />
/// <reference path="../component/armed.ts" />
/// <reference path="../component/dead.ts" />
/// <reference path="../component/shielded.ts" />

namespace System {

	export class Body extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Activity.name,
			Component.Body.name,
		])

		private cacheNewParts = new Map<Part, PartID>()

		/**
		 * Based on System ordering within a frame, we can get into states where
		 * the action (idle), components (stagger, death), and inner state
		 * (attack charging) don't seen to match up.
		 *
		 * See GitHub issue #117
		 * (https://github.com/mbforbes/gamejam7/issues/117) for a long tirade
		 * on this as I figured it out.
		 *
		 * Previously, we tried to infer the correct Core body part based on the
		 * Armed (inner state) status. However, the inconsistency mentioned
		 * above caused us to get into weird (action,part,partID) combinations.
		 *
		 * Much System reordering was done to try to get into a consistent
		 * state, but the reading and writing of components and inner states was
		 * too much to cleanly resolve.
		 *
		 * Instead, we're going to make this component more robust by reading
		 * the Action and directly deciding on the Core body part.
		 *
		 * This is the whitelist of actions for which we should change the
		 * core's partID based on the weapon.
		 */
		private modActions: Set<Action> = new Set<Action>([
			Action.Charging,
			Action.Swinging,
			Action.Sheathing,
			Action.QuickAttacking,
			Action.QuickAttacking2,
			Action.ComboAttacking,
		]);

		private updateParts(aspect: Engine.Aspect): void {
			let activity = aspect.get(Component.Activity);

			// build up new mapping of Part -> PartID.
			this.cacheNewParts.clear();

			// Right now we always add the core component. Can imagine not doing
			// this if, e.g., entity was invisible.
			let coreID = PartID.Default;

			// An amred component *may* affect
			//	  -	  the core part ID (if Action in this.modActions)
			// An amred component *will* affect
			//	  -	  the display of a weapon (if we allow weapons to
			//		  be drawn, may want to condition on that in the future).
			if (aspect.has(Component.Armed)) {
				let armed = aspect.get(Component.Armed);

				// if action in whitelist, change core's partID for weapon
				if (this.modActions.has(activity.action)) {
					coreID = armed.active.partID;
				}

				// always set weapon part to current weapon partID
				this.cacheNewParts.set(Part.Weapon, armed.active.partID);
			}

			// Similarly, check for shielded component. Only one partID, so
			// it's easy! (Well, mostly... see inside.)
			if (aspect.has(Component.Shielded)) {
				// for the shield, we hide if the bow is doing anything
				// interesting
				if (coreID != PartID.Bow) {
					this.cacheNewParts.set(Part.Shield, PartID.Default)
				}
			}

			// always set core
			this.cacheNewParts.set(Part.Core, coreID);

			// now, update the Body in bulk
			aspect.get(Component.Body).setParts(this.cacheNewParts);
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			for (let aspect of entities.values()) {
				// full update
				this.updateParts(aspect);
			}
		}
	}
}
