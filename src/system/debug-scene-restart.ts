/// <reference path="../core/keyboard.ts" />
/// <reference path="../engine/ecs.ts" />

namespace System {

    export class DebugSceneRestart extends Engine.System {

        // state
        private prevKey = false

        public componentsRequired = new Set<string>([
            Component.Dummy.name,
        ])

        constructor(private keyboard: Keyboard, private sceneManager: Scene.Manager) {
            super(false, true);
        }

        public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
            let wantReset = this.keyboard.gamekeys.get(GameKey.J).isDown;
            if (wantReset && !this.prevKey) {
                this.sceneManager.resetScene();
            }
            this.prevKey = wantReset;
        }
    }
}
