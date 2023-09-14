namespace System {

	/**
	 * Checks enemies the first frame they exist to assign them to zones.
	 * (Still runs over them all frames after, but then doesn't do much.)
	 *
	 * ALSO runs after N frames to check exit gate conditions in general. This
	 * has to happen *somewhere,* so might as well here.
	 *
	 * Ugh.
	 */
	export class EnemyZoneChecker extends Engine.System {

		private exitCheckFramesRemaining = 5

		public componentsRequired = new Set<string>([
			Component.Enemy.name,
			Component.CollisionShape.name,
		])

		public onClear(): void {
			this.exitCheckFramesRemaining = 5;
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			// manual exit check
			if (this.exitCheckFramesRemaining >= 0) {
				if (this.exitCheckFramesRemaining === 0) {
					let eName = Events.EventTypes.CheckGates;
					let eArgs: Events.CheckGatesArgs = {}
					this.eventsManager.dispatch({
						name: eName,
						args: eArgs,
					})
				}
				this.exitCheckFramesRemaining--;
			}

			// enemy zone check
			for (let [entity, aspect] of entities.entries()) {
				// zoneChecked computation
				let enemy = aspect.get(Component.Enemy);
				if (enemy.zoneChecked) {
					continue;
				}
				enemy.zoneChecked = true;

				// finding the gateID (if any) computation
				let cShape = aspect.get(Component.CollisionShape);
				for (let collider of cShape.collisionsFresh.keys()) {
					let colliderComps = this.ecs.getComponents(collider);
					if (colliderComps.has(Component.Zone)) {
						let zone = colliderComps.get(Component.Zone);
						// enemy might intersect w/ multiple zones. keep the
						// first one with a non-null gateID.
						if (zone.gateID != null) {
							enemy.gateID = zone.gateID;
							break;
						}
					}
				}
			}
		}
	}
}
