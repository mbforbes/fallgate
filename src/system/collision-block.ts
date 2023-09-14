/// <reference path="../engine/ecs.ts" />
/// <reference path="util.ts" />
/// <reference path="../component/block.ts" />
/// <reference path="../component/collision-shape.ts" />

namespace System {

	/**
	 * Note that we cycle through *block* entities here.
	 */
	export class CollisionBlock extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.CollisionShape.name,
			Component.Block.name,
		])

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			for (let [entity, aspect] of entities.entries()) {

				let cShape = aspect.get(Component.CollisionShape);
				let block = aspect.get(Component.Block);
				let defenderType = Util.getThing(this.ecs, block.blocker);

				for (let otherEntity of cShape.collisionsFresh.keys()) {
					let otherComps = this.ecs.getComponents(otherEntity);

					// sanity checking -- other entity should have collision box
					if (!otherComps.has(Component.CollisionShape)) {
						console.error('Colliding entities did both have CollisionBox components?!?');
						continue;
					}

					// only worry about weapon collision boxes
					let otherBox = otherComps.get(Component.CollisionShape);
					if (!otherBox.cTypes.has(CollisionType.Attack)) {
						continue;
					}

					// sanity checking -- entity with weapon collision box
					// should also have attack component
					if (!otherComps.has(Component.Attack)) {
						console.error('Weapon CollisionBox did have an Attack component?!?');
						continue;
					}

					// attack might be unblockable
					let attack = otherComps.get(Component.Attack);
					if (attack.info.unblockable) {
						continue;
					}

					let attackerComps = this.ecs.getComponents(attack.attacker);

					// extract original damage for use later. we could skip all
					// the rest if the original damage was == 0, but it's nice
					// to do so we can remove the attack instead of continuously
					// colliding with it. (this is for projectiles sticking
					// around on walls w/ 0 damage).
					let origDamage = attack.info.damage;

					// super simple strategy: reduce damage of attack by the
					// shield's armor.
					//	- if the attack damage is reduced to zero, remove the
					//	  attack entirely and have attacker Blocked)
					//	- if not, make the block resolved
					//	- either way, defender should be Recoil'ed
					attack.info.damage = Math.max(0, attack.info.damage - block.shield.block.armor);
					if (attack.info.damage == 0) {
						// shield fully defended attack

						// remove attack
						attack.fuse = true

						// only modify attacker if the attack was linked to it
						// (and not a projectile)
						if (attack.info.movement === Weapon.AttackMovement.Track) {

							// attacker is blocked. apply changes unless the
							// duration has been set to zero or negative.
							if (attack.info.blockedDuration > 0) {
								// add blocked component
								Util.addOrExtend(this.ecs, attack.attacker, Component.Blocked, attack.info.blockedDuration);

								// make immobile
								Util.addOrExtend(this.ecs, attack.attacker, Component.Immobile, attack.info.blockedDuration);
							}

							// send attacker back
							if (attackerComps.has(Component.Input)) {
								(attackerComps.get(Component.Input)).bounce = true;
							}
						}

					} else {
						// shield reduced attack damage but still > 0

						// make block resolved
						otherBox.collisionsResolved.add(entity);
					}

					// only do recoil and "blocking" event if the original damage
					if (origDamage <= 0) {
						continue;
					}

					// recoil defender
					if (!this.ecs.getComponents(block.blocker).has(Component.Recoil)) {
						this.ecs.addComponent(block.blocker, new Component.Recoil());
					}

					// and dispatch block event
					let eType = Events.EventTypes.Block;
					let eArgs: Events.BlockArgs = {
						shield: block.shield,
						defenderType: defenderType,
						angleAtoB: Util.angleAtoB(this.ecs, attack.attacker, block.blocker),
					};
					this.eventsManager.dispatch({ name: eType, args: eArgs });
				}
			}
		}
	}
}
