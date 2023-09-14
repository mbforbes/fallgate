/// <reference path="../engine/ecs.ts" />

/// <reference path="../graphics/lighting.ts" />

namespace Component {

    export class Lightbulb extends Engine.Component {

        configs: Graphics.LightbulbData[]

        constructor(specs: Graphics.LightbulbSpec[]) {
            super();
            this.configs = [];
            for (let spec of specs) {
                this.configs.push(Graphics.convertLightbulbSpec(spec));
            }
        }
    }
}
