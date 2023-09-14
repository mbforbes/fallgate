/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/health.ts" />

namespace System {

	export class LowHealth extends Engine.System {

        // settings
        runEvery = 3000

        // state
        sinceLast = 0

		public componentsRequired = new Set<string>([
            Component.Health.name,
            Component.PlayerInput.name,
        ])

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
            // determine whether to run
            let run = false;
            for (let aspect of entities.values()) {
                let health = aspect.get(Component.Health);
                if (health.current === 1 && health.current < health.maximum) {
                    run = true;
                    break;
                }
            }
            if (!run) {
                return;
            }

            // run: countdown and then show effect
            this.sinceLast += delta;
            if (this.sinceLast >= this.runEvery) {
                this.ecs.getSystem(System.GUIManager).runSequence('lowHealth');
                this.ecs.getSystem(System.Audio).play(['heartbeat']);
                this.sinceLast = 0;
            }
        }
	}
}
