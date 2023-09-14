/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/animatable.ts" />

namespace System {

	/**
	 * Ticks animations that need ticking.
	 */
	export class AnimationTicker extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Animatable.name,
			Component.AnimationTickable.name,
		])

		public update(
			delta: number,
			entities: Map<Engine.Entity, Engine.Aspect>,
		): void {
			// tick everything that's selected
			for (let aspect of entities.values()) {
				let animatable = aspect.get(Component.Animatable);
				let keepUpdating = false;
				if (!animatable.pause) {
					for (let key of animatable.state.activeKeys) {
						let ac = animatable.state.animations.get(key);

						// tick
						keepUpdating = ac.animation.update(delta) || keepUpdating;

						// expose core frame (for, e.g., footsteps)
						if (ac.part === Part.Core) {
							animatable.coreFrame = ac.animation.frame;
						}
					}
				}
				// if all animations don't require updates, well, don't update
				// them.
				if (!keepUpdating) {
					this.ecs.removeComponent(aspect.entity, Component.AnimationTickable);
				}
			}
		}
	}
}
