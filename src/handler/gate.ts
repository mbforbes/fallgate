/// <reference path="../engine/events.ts" />
/// <reference path="../component/enemy.ts" />
/// <reference path="../system/selector.ts" />

namespace Handler {

	/**
	 * Opens and closes gates.
	 */
	export class GateManager extends Events.Handler {
		dispatcher = new Map<Events.EventType, (EventType, any) => void>([
			[Events.EventTypes.ThingDead, this.eventCheckGates],
			[Events.EventTypes.ItemCollected, this.eventCheckGates],
			[Events.EventTypes.CheckGates, this.manualCheckGates],
		])

		/**
		 * Map from {gateID -> no. enemies alive w/ that gateID}
		 */
		private gateBookkepingCache = new Counter<string>()

		private ensureOpen(gateComps: Engine.ComponentViewer, silent: boolean): void {
			let gate = gateComps.get(Component.Gate);

			// ensure it's shown as open
			let wasOpen = false;
			if (gateComps.has(Component.Activity)) {
				let activity = gateComps.get(Component.Activity);
				wasOpen = activity.action === Action.Opening;

				if (!wasOpen) {
					activity.action = Action.Opening;
				}
			}

			// maybe send event to make noise
			if (!silent && !wasOpen) {
				this.firer.dispatch({
					name: Events.EventTypes.GateOpen,
					args: {},
				});
			}

			// ensure collision box disabled on non-exit gate
			if (!gate.exit) {
				if (gateComps.has(Component.CollisionShape)) {
					gateComps.get(Component.CollisionShape).disabled = true;
				}
			}
			// if it's the exit gate, trigger the fulfilled event if it wasn't
			// open
			if (!wasOpen && gate.exit) {
				let eType = Events.EventTypes.ExitConditions;
				let eArgs: Events.ExitConditionsArgs = {
					silent: silent,
					fulfilled: true,
				};
				this.firer.dispatch({
					name: eType,
					args: eArgs,
				});
			}
		}

		private ensureClosed(gateComps: Engine.ComponentViewer): void {
			// ensure shown as closed
			if (gateComps.has(Component.Activity)) {
				gateComps.get(Component.Activity).action = Action.Idle;
			}

			// ensure collision box enabled
			if (gateComps.has(Component.CollisionShape)) {
				gateComps.get(Component.CollisionShape).disabled = false;
			}

			// if it's the exit gate, remove any fulfilled effects
			let gate = gateComps.get(Component.Gate);
			if (gate.exit) {
				let eType = Events.EventTypes.ExitConditions;
				let eArgs: Events.ExitConditionsArgs = {
					silent: true,
					fulfilled: false,
				};
				this.firer.dispatch({
					name: eType,
					args: eArgs,
				});
			}
		}

		/**
		 * Gets gateID indicated on a non-gate (e.g., an enemy or item).
		 * Returns null if entity is dead or has no valid gateID. Else returns
		 * the gateID.
		 */
		private getMarkedGateID(entity: Engine.Entity): string {
			let comps = this.ecs.getComponents(entity);

			// dead check appleis to enemies and items
			if (comps.has(Component.Dead)) {
				return null;
			}

			// now switch based on thing
			if (comps.has(Component.Enemy)) {
				// enemies might be gatekeepers, in which case they count
				// towards the exit gate.
				let enemy = comps.get(Component.Enemy);
				if (enemy.gatekeeper) {
					return 'EXIT';
				}
				return enemy.gateID;
			} else if (comps.has(Component.Item)) {
				// items simply have a gateID or not.
				return comps.get(Component.Item).gateID;
			} else if (comps.has(Component.Checkpoint)) {
				return comps.get(Component.Checkpoint).gateID;
			}
			// if none of the above, no valid gate ID
			console.warn('Checked gateID of non-implemented entity!');
			return null;
		}

		private checkGates(silent: boolean): void {
			let enemySelector = this.ecs.getSystem(System.EnemySelector);
			let itemSelector = this.ecs.getSystem(System.ItemSelector);
			let checkpointSelector = this.ecs.getSystem(System.CheckpointSelector);
			let gateSelector = this.ecs.getSystem(System.GateSelector);

			// first, do gateID -> no. enemies alive bookkeeping
			this.gateBookkepingCache.clear();

			// cycle through enemies and items once
			for (let selector of [enemySelector, itemSelector, checkpointSelector]) {
				for (let entity of selector.latest()) {
					let gateID = this.getMarkedGateID(entity);
					if (gateID != null) {
						this.gateBookkepingCache.increment(gateID);
					}
				}
			}

			// check all gates, open or close if necessary
			for (let gateEntity of gateSelector.latest()) {
				let gateComps = this.ecs.getComponents(gateEntity);
				let gate = gateComps.get(Component.Gate);
				let alive = this.gateBookkepingCache.get(gate.id);
				if (alive > 0) {
					this.ensureClosed(gateComps);
				} else {
					this.ensureOpen(gateComps, silent)
				}
			}
		}

		private eventCheckGates(t: Events.EventType): void {
			this.checkGates(false);
		}

		private manualCheckGates(t: Events.EventType, args: Events.CheckGatesArgs): void {
			this.checkGates(true);
		}
	}

}
