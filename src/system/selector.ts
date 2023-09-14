/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />

namespace System {

	/**
	 * Subclass Selector and provide componentsRequired to produce a specific
	 * Selector.
	 *
	 * Selector abstracts out the pattern of code (systems, scripts) wanting to
	 * be able to iterate over a set of entities that all have a set of required
	 * components, just like Systems do. The problem was that one-off
	 * implementations were creating duplicate code, and bugs (like iterators
	 * being exhausted and a second caller coming up dry) had to be fixed
	 * multiple places. This is an intermediary solution. If the number of these
	 * keeps growing, we might want to build Selectors as a concept into the ECS
	 * itself.
	 */
	export abstract class Selector extends Engine.System {

		private _latest = new Map<Engine.Entity, Engine.Aspect>()

		/**
		 * Iterator over the Entities matched this frame by this Selector.
		 */
		public latest(): IterableIterator<Engine.Entity> {
			return this._latest.keys();
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			this._latest = entities;
		}
	}

	/**
	 * Selects ATTACKERS that could make combo attacks.
	 */
	export class ComboableSelector extends Selector {
		public componentsRequired = new Set<string>([
			Component.Comboable.name,
			Component.Armed.name,
		])
	}

	export class SpawnableSelector extends Selector {
		public componentsRequired = new Set<string>([
			Component.Spawnable.name,
		])
	}

	export class EnemySelector extends Selector {
		public componentsRequired = new Set<string>([
			Component.Enemy.name,
			Component.Position.name,
		])
	}

	export class StaticRenderableSelector extends Selector {
		public componentsRequired = new Set<string>([
			Component.StaticRenderable.name,
			Component.Position.name,
		])
	}

	export class PlayerSelector extends Selector {
		public componentsRequired = new Set<string>([
			Component.PlayerInput.name,
		])
	}

	export class ItemSelector extends Selector {
		public componentsRequired = new Set<string>([
			Component.Item.name,
		])
	}

	export class ZoneSelector extends Selector {
		public componentsRequired = new Set<string>([
			Component.CollisionShape.name,
			Component.Position.name,
			Component.Zone.name,
		])
	}

	export class GateSelector extends Selector {
		public componentsRequired = new Set<string>([
			Component.Activity.name,
			Component.Gate.name,
		])
	}

	export class CheckpointSelector extends Selector {
		public componentsRequired = new Set<string>([
			Component.Checkpoint.name,
		])
	}

}
