/// <reference path="../script/test.ts" />

namespace Handler {

	/**
	 * Handles logic for what happens when the player activates a checkpoint.
	 *
	 * (Could eventually refactor into some kind of "core gj7 logic" handler.)
	 */
	export class Checkpoint extends Events.Handler {

		private static SPAWN_OFFSET = new Point(16, -64)

		dispatcher = new Map<Events.EventType, (EventType, any) => void>([
			[Events.EventTypes.Checkpoint, this.checkpoint],
		])

		constructor(private gm: GameMap.GameMap) {
			super();
		}

		checkpoint(et: Events.EventType, args: Events.CheckpointArgs): void {
			// sound effect (separate handler)
			// text (separate handler)

			let playerSelector = this.ecs.getSystem(System.PlayerSelector);
			let enemySelector = this.ecs.getSystem(System.EnemySelector);

			// make player go here next
			let checkpointComps = this.ecs.getComponents(args.checkpoint);
			let cauldronPos = checkpointComps.get(Component.Position);
			for (let player of playerSelector.latest()) {
				let playerComps = this.ecs.getComponents(player);
				let spawnable = playerComps.get(Component.Spawnable);
				spawnable.position.copyFrom_(cauldronPos.p).add_(Checkpoint.SPAWN_OFFSET);
			}

			// make all dead enemies no longer able to be respawned
			for (let enemy of enemySelector.latest()) {
				let enemyComps = this.ecs.getComponents(enemy);
				// if it's not dead, let it keep any spawnable prop it has
				if (!enemyComps.has(Component.Dead)) {
					continue;
				}
				this.ecs.removeComponentIfExists(enemy, Component.Spawnable);
			}

			// and add the new 'checkpoint on' entity
			this.ecs.removeEntity(args.checkpoint);
			this.gm.produce('checkpointsActiveTemplate', {
				x: cauldronPos.p.x,
				y: cauldronPos.p.y,
				rotation: 0,
				width: 1,
				height: 1,
			});

		}
	}
}
