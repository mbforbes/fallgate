/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/physics.ts" />
/// <reference path="../component/dead.ts" />
/// <reference path="../component/input.ts" />
/// <reference path="../component/position.ts" />

namespace System {

	export class AIArcher {

		private static cacheClosest = new Point();

		public static update(delta: number, ecs: Engine.ECS, aspect: AIAspect): void {
			let input = aspect.get(Component.Input);
			let position = aspect.get(Component.Position);

			let shortest = Infinity;
			let closest = AIArcher.cacheClosest;

			// Find closest non-dead moving thing.
			for (let mover of aspect.playerSelector.latest()) {
				// Don't go after self.
				if (mover == aspect.entity) {
					continue;
				}

				// Don't go after dead things
				let moverComps = ecs.getComponents(mover);
				if (ecs.getComponents(mover).has(Component.Dead)) {
					continue;
				}

				// find dist
				let moverPos = moverComps.get(Component.Position);
				let dist = position.p.sqDistTo(moverPos.p);

				// use if closest
				if (dist < shortest) {
					closest.copyFrom_(moverPos.p);
					shortest = dist;
				}
			}

			// See if we found anything (if not, archer is last thing
			// alive. Congrats, archer!
			if (shortest === Infinity) {
				// Should do some kind of celebration here or something.
				input.attack = false;
				input.intent.y = Physics.STOP;
				return;
			}

			let minArcherDist = 500000;

			// We found something. Move away if too close.
			if (shortest <= minArcherDist) {
				input.intent.y = Physics.DOWN;

			} else {
				input.intent.y = Physics.STOP;
			}

			// Always face closest thing.
			input.targetAngle = position.p.pixiAngleTo(closest);

			// If far enough away, keep shooting.
			if (shortest > minArcherDist) {
				input.attack = !input.attack;
			} else {
				input.attack = false;
			}
		}
	}
}
