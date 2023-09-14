 /// <reference path="../script/test.ts" />

namespace Handler {

	/**
	 * Handles swapping bodies.
	 */
	export class EndSequence extends Events.Handler {

		dispatcher = new Map<Events.EventType, (EventType, any) => void>([
			[Events.EventTypes.SwapBodies, this.swapBodies],
			[Events.EventTypes.ThingDead, this.maybeTriggerScript],
		])

		// enemies may either be legit dead enemies, or bodies placed by this
		// handler swapping back from humanoid bodies
		toHumanoidMap = new Map<string, string>([
			// blop <-> archer
			['blop-1', 'archerBody'],
			['blop1Body', 'archerBody'],

			// sen <-> king
			['sentinel', 'kingBody'],
			['senBody', 'kingBody'],
		])
		toEnemyMap = new Map<string, string>([
			// blop <-> archer
			['archerBody', 'blop1Body'],

			// sen <-> king
			['kingBody', 'senBody'],
		])

		constructor(private gm: GameMap.GameMap) {
			super();
		}

		// triggers the end-sequence script if enemy dead was final boss
		private maybeTriggerScript(et: Events.EventType, args: Events.ThingDeadArgs): void {
			let comps = this.ecs.getComponents(args.thing);
			if (!comps.has(Component.Enemy)) {
				return;
			}
			let enemy = comps.get(Component.Enemy);
			if (!enemy.finalBoss) {
				return;
			}

			this.scriptRunner.run(new Script.EndSequence());
		}

		private swap(selectors: System.Selector[], map: Map<string, string>): void {
			for (let selector of selectors) {
				for (let entity of selector.latest()) {
					if (!this.ecs.getComponents(entity).has(Component.DebugKVLayer)) {
						continue;
					}
					let layer = this.ecs.getComponents(entity).get(Component.DebugKVLayer).layer;
					if (!map.has(layer)) {
						continue;
					}
					let pos = this.ecs.getComponents(entity).get(Component.Position);
					let newLayer = map.get(layer);
					this.gm.produce(newLayer, {
						x: pos.p.x,
						y: pos.p.y,
						width: 1,
						height: 1,
						rotation: Constants.RAD2DEG * pos.angle,
					});
					this.ecs.removeEntity(entity);
				}
			}
		}

		swapBodies(et: Events.EventType, args: Events.SwapBodiesArgs): void {
			if (args.toHumanoid) {
				this.swap([
						this.ecs.getSystem(System.EnemySelector),
						this.ecs.getSystem(System.StaticRenderableSelector)],
					this.toHumanoidMap);
			} else {
				this.swap(
					[this.ecs.getSystem(System.StaticRenderableSelector)],
					this.toEnemyMap);
			}
		}
	}
}
