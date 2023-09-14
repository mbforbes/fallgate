/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/timebomb.ts" />

namespace System {

	export abstract class Timebomb extends Engine.System {

		/**
		 * This is the actual subclass of Component.Timebomb that the System will track.
		 * E.g., `Component.Attack`.
		 */
		abstract tbComp: new (...args) => Component.Timebomb

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			for (let [entity, aspect] of entities.entries()) {
				let tb = aspect.get(this.tbComp);

				// progress time and check if it's expired OR if the fuse is
				// lit.
				if (tb.startTime === -1) {
					tb.startTime = this.ecs.gametime;
				}
				let elapsed = this.ecs.gametime - tb.startTime;
				if ((elapsed >= tb.duration && tb.duration != -1) || tb.fuse) {
					// activate destruction
					switch (tb.destruct) {
						case Destruct.Component: {
							this.ecs.removeComponent(entity, this.tbComp);
							break;
						}

						case Destruct.Entity: {
							this.ecs.removeEntity(entity);
							break;
						}
					}

					// call last wish if it exists
					if (tb.lastWish) {
						tb.lastWish(this.ecs, entity);
					}
				}
			}
		}
	}
}
