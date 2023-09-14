/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/ontology.ts" />
/// <reference path="../component/collision-shape.ts" />
/// <reference path="../component/item.ts" />

namespace System {

	/**
	 * Note that this is ITEM-centric collision detection. If we did
	 * PLAYER-centric collision detection, that would more easily extend (e.g.,
	 * to having multiple players). This version is conceptually simpler
	 * (because each item will only collide with the player), but more brittle
	 * (because it just grabs the player when it happens).
	*/
	export class CollisionItem extends Engine.System {
		public componentsRequired = new Set<string>([
			Component.Position.name,
			Component.CollisionShape.name,
			Component.Item.name,
		])

		private handlers = new Map<Ontology.Item, (aspect: Engine.Aspect) => boolean>([
			[Ontology.Item.Health, this.handleHealth],
			[Ontology.Item.Doughnut, this.handleDoughnut],
			[Ontology.Item.UpgradeSword, this.handleUpgradeSword],
			[Ontology.Item.UpgradeShield, this.handleUpgradeShield],
			[Ontology.Item.UpgradeHP4, this.handleUpgradeHP4],
			[Ontology.Item.UpgradeStabCombo, this.handleUpgradeStabCombo],
			[Ontology.Item.UpgradeSpeed, this.handleUpgradeSpeed],
			[Ontology.Item.UpgradeBow, this.handleUpgradeBow],
			[Ontology.Item.UpgradeAOECombo, this.handleUpgradeAOE],
			[Ontology.Item.UpgradeHP5, this.handleUpgradeHP5],
			[Ontology.Item.TransformToBlop, this.handleTransformToBlop],
			[Ontology.Item.TransformToPlayer, this.handleTransformToPlayer],
		])

		constructor(private gm: GameMap.GameMap) {
			super();
		}

		/**
		 * Disabling rather than removing to allow respawns.
		 */
		private disableItem(aspect: Engine.Aspect): void {
			aspect.get(Component.CollisionShape).disabled = true;
			this.ecs.addComponent(aspect.entity, new Component.Dead());
		}

		private handleHealth(aspect: Engine.Aspect): boolean {
			// sanity checking: ensure item has health property; ensure
			// collided with player
			if (!aspect.has(Component.Health)) {
				console.error('Health item did not have required components?!');
				return
			}

			let cShape = aspect.get(Component.CollisionShape);
			let player = cShape.collisionsFresh.keys().next().value;
			let playerComps = this.ecs.getComponents(player);
			if (!playerComps.has(Component.PlayerInput, Component.Health)) {
				console.error('Player did not have required components?!');
				return
			}

			// if the player is at full health, don't pick up the item
			let playerHealth = playerComps.get(Component.Health);
			if (playerHealth.current == playerHealth.maximum) {
				return false;
			}

			// player needs health; pickup item to add health to player
			let itemHealth = aspect.get(Component.Health);
			playerHealth.current = Math.min(
				playerHealth.current + itemHealth.maximum,
				playerHealth.maximum);

			return true;
		}

		private handleDoughnut(aspect: Engine.Aspect): boolean {
			// track
			this.ecs.getSystem(System.Bookkeeper).secretFound();

			// TODO: need a sound

			return true;
		}

		private handleUpgrade(aspect: Engine.Aspect, newLayer: string, sound?: string, delay: number = 0): boolean {
			// remove player and replace with one from new layer
			let player = aspect.get(Component.CollisionShape).collisionsFresh.keys().next().value;
			let playerPos = this.ecs.getComponents(player).get(Component.Position);
			this.ecs.removeEntity(player);

			this.gm.produce(newLayer, {
				height: 1,
				width: 1,
				x: playerPos.p.x,
				y: playerPos.p.y,
				rotation: Constants.RAD2DEG * playerPos.angle,
			});

			// play sound, if any
			if (sound) {
				this.ecs.getSystem(System.DelaySpeaker).enqueue({
					delay: delay,
					options: [sound],
				})
			}

			// flash
			this.ecs.getSystem(System.GUIManager).runSequence('upgrade');

			return true;
		}

		// TODO: just do partial argument binding and have one function. don't
		// want to look this up right now.

		private handleUpgradeSword(aspect: Engine.Aspect): boolean {
			return this.handleUpgrade(aspect, 'player-Sword', 'title-sheen')
		}

		private handleUpgradeShield(aspect: Engine.Aspect): boolean {
			return this.handleUpgrade(aspect, 'player-Shield', 'title-sheen')
		}

		private handleUpgradeHP4(aspect: Engine.Aspect): boolean {
			return this.handleUpgrade(aspect, 'player-Health4', 'title-sheen')
		}

		private handleUpgradeStabCombo(aspect: Engine.Aspect): boolean {
			return this.handleUpgrade(aspect, 'player-StabCombo-Slow', 'title-sheen')
		}

		private handleUpgradeSpeed(aspect: Engine.Aspect): boolean {
			return this.handleUpgrade(aspect, 'player-StabCombo-Fast', 'title-sheen')
		}

		private handleUpgradeBow(aspect: Engine.Aspect): boolean {
			return this.handleUpgrade(aspect, 'player-Bow', 'title-sheen')
		}

		private handleUpgradeAOE(aspect: Engine.Aspect): boolean {
			return this.handleUpgrade(aspect, 'player-AOECombo', 'title-sheen')
		}

		private handleUpgradeHP5(aspect: Engine.Aspect): boolean {
			return this.handleUpgrade(aspect, 'player-Health5', 'title-sheen')
		}

		private handleTransformToBlop(aspect: Engine.Aspect): boolean {
			return this.handleUpgrade(aspect, 'blopPlayer', 'to-blop', 0)
		}

		private handleTransformToPlayer(aspect: Engine.Aspect): boolean {
			return this.handleUpgrade(aspect, 'player-Health5', 'to-human', 0)
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			for (let aspect of entities.values()) {
				let pos = aspect.get(Component.Position);
				let cShape = aspect.get(Component.CollisionShape);
				let item = aspect.get(Component.Item);

				if (cShape.collisionsFresh.size === 0) {
					continue;
				}

				// if we got a collision, dispatch behavior based on item. the
				// behavior returns whether to continue with the item
				// acquisition.
				if (!this.handlers.get(item.behavior).call(this, aspect)) {
					return;
				}

				// disable item
				this.disableItem(aspect);

				// if instruction is set, let bookkeeper decide whether to do
				// it.
				if (item.instructionID != null) {
					this.ecs.getSystem(System.Bookkeeper).maybeShowInstruction(item.instructionID);
				}

				// fire event (for text, sound, etc.)
				let eArgs: Events.ItemCollectedArgs = {
					itemType: item.behavior,
					location: pos.p.copy(),
				};
				this.eventsManager.dispatch({
					name: Events.EventTypes.ItemCollected,
					args: eArgs,
				})
			}
		}
	}
}
