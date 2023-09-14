/// <reference path="../engine/script.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../system/selector.ts" />

namespace Script {

	function disableCollisionsHelper(ecs: Engine.ECS, thing: Engine.Entity): void {
		let comps = ecs.getComponents(thing);

		// NOTE: edge case here because this function can be delayed: don't
		// disable collisions if the thing isn't still dead (i.e., has been
		// respawned).
		if (!comps.has(Component.Dead)) {
			return;
		}

		if (comps.has(Component.CollisionShape)) {
			let cShape = comps.get(Component.CollisionShape);
			cShape.disabled = true;
		}
	}

	/**
	 * Delayed actions when "other" (non-player / non-enemy) dies.
	 */
	export class OtherDeath extends Script {
		code = new Map<number, FunctionPackage>([
			[0, {func: this.disableCollisions, args: null}],
		])

		constructor(private thing: Engine.Entity) {
			super();
		}

		disableCollisions(): void {
			disableCollisionsHelper(this.ecs, this.thing);
		}
	}


	/**
	 * Delayed actions when enemy dies.
	 */
	export class EnemyDeath extends Script {
		code = new Map<number, FunctionPackage>([
			[0, {func: this.disableCollisions, args: null}],
		])

		constructor(private enemy: Engine.Entity) {
			super();
		}

		disableCollisions(): void {
			disableCollisionsHelper(this.ecs, this.enemy);
		}
	}

	/**
	 * Delayed actions when player dies.
	 */
	export class PlayerDeath extends Script {

		code = new Map<number, FunctionPackage>([
			[0, {func: this.vanquished, args: null}],
			[1, {func: this.zoomIn, args: null}],
			[2000, {func: this.disablePlayerCollisions, args: null}],
			[2890, {func: this.zoomOut, args: null}],
			[3000, {func: this.respawn, args: null}],
		])

		constructor(private playerSelector: System.PlayerSelector,
					private spawnableSelector: System.SpawnableSelector,
		) {
			super();
		}

		vanquished(): void {
			this.ecs.getSystem(System.GUIManager).runSequence('vanquished');
		}

		zoomIn(): void {
			this.ecs.getSystem(System.Zoom).request(1.3, 2890, Tween.linear);
		}

		disablePlayerCollisions(): void {
			disableCollisionsHelper(this.ecs, this.playerSelector.latest().next().value);
		}

		respawn(): void {
			// respawn things (player, enemies, crates, ...)
			this.reviveHealReposition(this.spawnableSelector.latest());

			// close gates as needed
			this.eventsManager.dispatch({
				name: Events.EventTypes.CheckGates,
				args: {},
			})
		}

		reviveHealReposition(iter: IterableIterator<Engine.Entity>): void {
			for (let entity of iter) {
				let comps = this.ecs.getComponents(entity);

				// Don't apply if entity is not spawnable
				if (!comps.has(Component.Spawnable)) {
					continue;
				}

				// remove dead
				this.ecs.removeComponentIfExists(entity, Component.Dead);

				// make health max
				if (comps.has(Component.Health)) {
					let health = comps.get(Component.Health);
					health.current = health.maximum;
				}

				// move to spawn point
				let position = comps.get(Component.Position);
				let spawnable = comps.get(Component.Spawnable);
				position.p = spawnable.position;
				position.angle = spawnable.angle;

				// enable collision box
				if (comps.has(Component.CollisionShape)) {
					let cShape = comps.get(Component.CollisionShape);
					cShape.disabled = false;
				}
			}
		}

		zoomOut(): void {
			this.ecs.getSystem(System.Zoom).request(1, 500, Tween.easeOutCubic);
		}

	}
}
