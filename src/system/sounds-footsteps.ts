/// <reference path="../component/audible.ts" />

namespace System {

	class SoundsFootstepsAspect extends Engine.Aspect {
		lastHandledFrame: number = -1
	}

	export class SoundsFootsteps extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Activity.name,
			Component.Audible.name,
			Component.Animatable.name,
			Component.AnimationTickable.name,
			Component.Position.name,
		])

		@override
		public makeAspect(): SoundsFootstepsAspect {
			return new SoundsFootstepsAspect();
		}

		public update(delta: number, entities: Map<Engine.Entity, SoundsFootstepsAspect>): void {
			for (let [entity, aspect] of entities.entries()) {
				let position = aspect.get(Component.Position);
				let activity = aspect.get(Component.Activity);
				let anim = aspect.get(Component.Animatable);
				let audible = aspect.get(Component.Audible);

				// we only handle movements
				if (activity.action !== Action.Moving) {
					aspect.lastHandledFrame = -1;
					continue;
				}

				// we only handle move sounds
				if (audible.sounds.move == null) {
					continue;
				}

				// In the future, we'll detect surface. Just using default for
				// now.
				let surface = audible.sounds.move.default;
				if (surface == null) {
					continue;
				}

				// Check whether the current frame matches a sound.
				if (surface.emitOnFrames.indexOf(anim.coreFrame) === -1) {
					// Resetting lets you play on the original frame again.
					aspect.lastHandledFrame = -1;
					continue;
				}

				// don't play the same frame's sound multiple times
				if (aspect.lastHandledFrame === anim.coreFrame) {
					continue;
				}

				// play and update the frame
				this.ecs.getSystem(System.Audio).play(surface.sounds, position.p);
				aspect.lastHandledFrame = anim.coreFrame;
			}
		}
	}

}
