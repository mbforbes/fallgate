/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/sparkle.ts" />

namespace System {

    class SparkleAspect extends Engine.Aspect {
        public sparkle: Engine.Entity = null
    }

    export class Sparkle extends Engine.System {

        componentsRequired = new Set<string>([
            Component.Sparkle.name,
            Component.Position.name,
        ])

        dirtyComponents = new Set<string>([
            Component.Dead.name,
        ])

        private layer = 'fxSparkle'

        constructor(private gm: GameMap.GameMap) {
            super();
        }

        @override
        makeAspect(): SparkleAspect {
            return new SparkleAspect();
        }

        @override
        onAdd(aspect: SparkleAspect): void {
            let pos = aspect.get(Component.Position);
            let s = this.gm.produce(this.layer, {
                height: 1,
                width: 1,
                rotation: Constants.RAD2DEG * angleFlip(pos.angle),
                x: pos.p.x,
                y: pos.p.y,
            });
            this.ecs.addComponent(s, new Component.Tracker(aspect.entity));
            aspect.sparkle = s;
        }

        update(delta: number, entities: Map<Engine.Entity, SparkleAspect>, dirty: Set<Engine.Entity>): void {
            // if the thing sparkling is "dead" (e.g., item picked up), remove
            // the sparkle.
            for (let e of dirty) {
                let aspect = entities.get(e);
                let sparkleAnim = this.ecs.getComponents(aspect.sparkle).get(Component.Animatable);

                sparkleAnim.visible = !aspect.has(Component.Dead);
            }
        }
    }
}
