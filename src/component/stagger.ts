/// <reference path="../engine/ecs.ts" />
/// <reference path="attributes.ts" />
/// <reference path="timebomb.ts" />
/// <reference path="stagger-return.ts" />

namespace Component {

	export class Stagger extends Timebomb {

		constructor(public duration: number) {
			super(
				duration,
				Destruct.Component,
				false,
				(ecs: Engine.ECS, entity: Engine.Entity) => {
					// When stagger goes away, add a StaggerReturn component.
					let comps = ecs.getComponents(entity);
					if (!comps.has(Component.Attributes)) {
						console.error('Tried to add StaggerReturn but entity has no Attributes Component (for timing).');
						return;
					}
					let attribs = comps.get(Component.Attributes);
					let duration = attribs.data.hitSettings.staggerReturnDuration;
					ecs.addComponent(entity, new Component.StaggerReturn(duration));
				}
			);
		}
	}
}
