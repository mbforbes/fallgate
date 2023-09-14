/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/attributes.ts" />
/// <reference path="../gj7/events.ts" />
/// <reference path="util.ts" />
/// <reference path="../component/attack.ts" />
/// <reference path="../component/collision-shape.ts" />
/// <reference path="../component/health.ts" />
/// <reference path="../component/input.ts" />
/// <reference path="../component/level-gainer.ts" />
/// <reference path="../component/stagger.ts" />


namespace System {

	// Actions enemies can take and be immune from environmental damage.
	const envImmuneEnemyActions = new Set<Action>([
		Action.Moving, Action.Idle, Action.Charging,
	]);

	type HitProps = {
		flash: boolean,
		immobilize: boolean,
		invincible: boolean,
	}

	type HitBehaviorDetails = {
		knockback: HitProps,
		stagger: HitProps,
	}

	// settings map for behavior mapping. can pull into yet another JSON file
	// if we want, but seems like it won't need to change much.
	let hitBehaviorMap = new Map<Attributes.HitBehavior, HitBehaviorDetails>([
		[Attributes.HitBehavior.Player, {
			knockback: {
				flash: true,
				immobilize: false,
				invincible: true,
			},
			// NOTE: player shouldn't get staggered.
			stagger: {
				flash: true,
				immobilize: false,
				invincible: true,
			}
		}],
		[Attributes.HitBehavior.StandardEnemy, {
			knockback: {
				flash: true,
				immobilize: true,
				invincible: false,
			},
			stagger: {
				flash: true,
				immobilize: true,
				invincible: true,
			}
		}],
	])

	/**
	 * Note that the System.CollisionDamage iterates through *things that can
	 * be damaged*, NOT through damaging (attack) objects.
	 */
	export class CollisionDamage extends Engine.System {

		/**
		 * How much blocks dampen the force applied by.
		 *
		 * If we decide to go this route, there are a few places we could put
		 * this number instead to make it more configurable:
		 *
		 *	- make it part of weapons
		 *	- make it part of shields
		 *	- make it a game-level constant
		 *
		 * What we do will depend on how much we want to tweak this for
		 * different enemies.
		 *
		 * Note: set to 1.0 to make blocks not dampen force at all. Set to 0.0
		 * to make blocks completely remove attacks' force.
		 */
		public static BLOCK_FORCE_DAMPEN = 0.5

		/**
		 * Note that the System.CollisionDamage iterates through *things that can
		 * be damaged*, NOT through damaging (attack) objects.
		 */
		public componentsRequired = new Set<string>([
			Component.Position.name,
			Component.CollisionShape.name,
			Component.Health.name,
		])

		public dirtyComponents = new Set<string>([
			Component.CollisionShape.name,
		])

		/**
		 * Returns whether the aspect is immune from damage.
		 * @param aspect
		 */
		private isDamageImmune(aspect: Engine.Aspect): boolean {
			return aspect.has(Component.Invincible) || aspect.has(Component.Dead);
		}

		/**
		 * Returns whether this entity is an Attack with all required
		 * properties.
		 * @param entity
		 */
		private isValidAttack(entity: Engine.Entity): boolean {
			let otherComps = this.ecs.getComponents(entity);

			// sanity checking
			if (!otherComps.has(Component.CollisionShape) || !otherComps.has(Component.Position)) {
				console.error('Attack did not have either CollisionBox Position component. Ignoring.');
				return false;
			}

			// only worry about "Attack" collision types
			let otherBox = otherComps.get(Component.CollisionShape);
			if (!otherBox.cTypes.has(CollisionType.Attack)) {
				return false;
			}

			// If it had an "Attack" collision type, it should also have an
			// Attack Component. Sanity check this.
			if (!otherComps.has(Component.Attack)) {
				console.error('Weapon CollisionBox did have an Attack component?!?');
				return false;
			}

			// all checks pass
			return true;
		}

		/**
		 * Special check for damage checks that cannot be done at collision
		 * time; e.g., Environmental collisions that hit enemies, but only when
		 * they're doing certain things.
		 */
		private canDamage(victim: Engine.Aspect, attackEntity: Engine.Entity): boolean {
			// play can always be damaged
			if (victim.has(Component.PlayerInput)) {
				return true;
			}

			// non-environmental attacks can always damage
			let otherCShape = this.ecs.getComponents(attackEntity).get(Component.CollisionShape);
			if (!otherCShape.cTypes.has(CollisionType.Environment)) {
				return true;
			}

			// non-player and environmental attack. must check victim action.
			if (!victim.has(Component.Activity)) {
				console.warn('Victim has no Component.Activity. Assuming non-damagable by Environment.');
				return false;
			}
			let action = victim.get(Component.Activity).action;
			return !envImmuneEnemyActions.has(action);
		}

		/**
		 * Apply damage to `victim` from `attackEntity`.
		 * @param victim
		 * @param attackEntity
		 * @returns amount of damage dealt
		 */
		private applyDamage(victim: Engine.Aspect, attackEntity: Engine.Entity): number {
			// pre-extraction
			let pos = victim.get(Component.Position);
			let health = victim.get(Component.Health);
			let otherComps = this.ecs.getComponents(attackEntity);
			let otherBox = otherComps.get(Component.CollisionShape);
			let attackComp = otherComps.get(Component.Attack);
			let angleVtoA = Util.angleAtoB(this.ecs, victim.entity, attackComp.attacker);
			let angleAtoV = angleClamp(angleVtoA + Math.PI);

			// Deal damage. Note that damage could be 0 (if the attack was
			// blocked).
			health.current = Math.max(0, health.current - attackComp.info.damage);

			// Collisions are only added in the collision detection system if
			// it hasn't been resolved by either entity. so that means (a) we
			// don't need to check resolution beforehand here, and (b) we only
			// need to worry about updating a single resolution map. For (b),
			// we'll choose to update the weapon's resolution map as it has a
			// much shorter lifespan.
			otherBox.collisionsResolved.add(victim.entity);

			// Mark as hit on attack (for combo purposes).
			attackComp.hit = true;

			// Only spawn damage event when nonzero damage
			if (attackComp.info.damage > 0) {
				// Damage event (text and sound effect)
				let eName = Events.EventTypes.Damage;
				let eArgs: Events.DamageArgs = {
					location: pos.p.copy(),
					angleAtoV: angleAtoV,
					internalDamage: attackComp.info.damage,
					attackInfo: attackComp.info,
					victim: victim.entity,
					victimType: Util.getThing(this.ecs, victim.entity),
				};
				this.eventsManager.dispatch({ name: eName, args: eArgs })
			}

			return attackComp.info.damage;
		}

		/**
		 * Helper to apply knockback when we know we want it.
		 * @param victim
		 */
		private applyKnockback(victim: Engine.Aspect): void {
			// figure out timing
			if (!victim.has(Component.Attributes)) {
				console.error('Tried to knockback entity but lacked Attributes Component (for timing).');
				return;
			}
			let attribs = victim.get(Component.Attributes);
			if (attribs.data.hitSettings == null) {
				console.error('Tried to knockback entity but lacked hitSettings Attribute data.');
				return;
			}

			// extend or add the Knockback component.
			Util.addOrExtend(this.ecs, victim.entity, Component.Knockback,
				attribs.data.hitSettings.knockbackAnimDuration);

			// Always reset the animation on a knockback. (This is
			// unnecessary for the first knockback, which already starts a
			// new animation, but is required for subsequent consecutive
			// knockbacks to play their animation from the start).
			if (victim.has(Component.Animatable)) {
				let anim = victim.get(Component.Animatable);
				anim.reset = true;
			}
		}

		/**
		 * Helper to apply stagger when we know we want it.
		 * @param victim
		 */
		private applyStagger(victim: Engine.Aspect, attackEntity: Engine.Entity): void {
			// pre-extraction
			let otherComps = this.ecs.getComponents(attackEntity);
			let attack = otherComps.get(Component.Attack);
			let angleVtoA = Util.angleAtoB(this.ecs, victim.entity, attack.attacker);
			let angleAtoV = angleClamp(angleVtoA + Math.PI);

			// figure out timing
			if (!victim.has(Component.Attributes)) {
				console.error('Tried to stagger entity but lacked Attributes Component.');
				return;
			}
			let attribs = victim.get(Component.Attributes);
			if (attribs.data.hitSettings == null) {
				console.error('Tried to stagger entity but lacked hitSettings Attribute data.');
				return;
			}

			// add stagger
			this.ecs.addComponent(victim.entity, new Component.Stagger(
				attribs.data.hitSettings.staggerDuration));

			// stagger enemy event
			if (!victim.has(Component.PlayerInput)) {
				// only show heavy effects once
				let heavyEffects = !attack.heavyEffectsShown;
				attack.heavyEffectsShown = true;

				let eName = Events.EventTypes.EnemyStaggerPre;
				let eArgs: Events.EnemyStaggerPreArgs = {
					angleAtoV: angleAtoV,
					vLocation: victim.get(Component.Position).p.copy(),
					heavyEffects: heavyEffects,
				};
				this.eventsManager.dispatch({ name: eName, args: eArgs });
			}
		}

		/**
		 * Determine knockback, stagger, or neither.
		 * @param attackEntity
		 */
		private applyKnockbackStagger(victim: Engine.Aspect, attackEntity: Engine.Entity): [boolean, boolean] {
			// pre-extraction
			let isKnockbackable = victim.has(Component.Knockbackable);
			let isStaggerable = victim.has(Component.Staggerable);
			let otherComps = this.ecs.getComponents(attackEntity);
			let attack = otherComps.get(Component.Attack);

			// compute what we want
			let doStagger = isStaggerable && attack.info.damage > 0 && attack.info.attackType == Weapon.AttackType.Combo;
			let doKnockback = isKnockbackable && attack.info.damage > 0 && (!doStagger);

			// Handle extra knockback stuff.
			if (doKnockback) {
				this.applyKnockback(victim);
			}

			// Handle stagger stuff.
			if (doStagger) {
				this.applyStagger(victim, attackEntity);
			}

			// return whether we knockback'd or stagger'd
			return [doKnockback, doStagger];
		}

		private applyForces(victim: Engine.Aspect, attackEntity: Engine.Entity,
			doKnockback: boolean, doStagger: boolean): void {
			// pre-check: nothing to do
			if (!doKnockback && !doStagger) {
				return;
			}

			// pre-extraction
			let pos = victim.get(Component.Position);
			let otherComps = this.ecs.getComponents(attackEntity);
			let attack = otherComps.get(Component.Attack);
			let attackerComps = this.ecs.getComponents(attack.attacker);
			let angleVtoA = Util.angleAtoB(this.ecs, victim.entity, attack.attacker);

			// Must be able to send forces and compute angles.
			if ((!victim.has(Component.Input)) ||
				(attackerComps == null) ||
				(!attackerComps.has(Component.Position))) {
				return;
			}

			// scale magnitude based on whether attack was blocked.
			let scale = attack.info.damage > 0 ? 1.0 : CollisionDamage.BLOCK_FORCE_DAMPEN;
			let input = victim.get(Component.Input);
			let attackerPos = attackerComps.get(Component.Position);

			// get the force to use. by default we'll just use the
			// knockback force (i.e., also if the attack was
			// blocked), unless we saw a stagger was caused.
			let forceMag = doStagger ? attack.info.staggerForce : attack.info.knockbackForce;

			// Decide in what direction the force should be applied.
			let force = Physics.forceFromPoints(
				attackerPos.p,
				pos.p,
				forceMag * scale)
			input.forceQueue.push(force);

			// Decide how the victim should be angled.
			// Make victim face attacker
			pos.angle = angleVtoA;
		}

		private applyBehaviors(victim: Engine.Aspect, doKnockback: boolean, doStagger: boolean): void {
			// pre-check: nothing to do
			if (!doKnockback && !doStagger) {
				return;
			}

			// pre-check: confusing state
			if (doKnockback && doStagger) {
				console.error('Tried to apply knockback AND stagger on same frame?');
				return;
			}

			// pull out attribute info
			if (!victim.has(Component.Attributes)) {
				console.error('Tried to apply knockback or stagger to entity but lacked Attributes Component (for timing).');
				return;
			}
			let attribs = victim.get(Component.Attributes);

			// figure out behavior, props, and duration to use.
			let details = hitBehaviorMap.get(attribs.data.hitSettings.hitBehavior);
			let props = doKnockback ? details.knockback : details.stagger;
			let duration = doKnockback ?
				attribs.data.hitSettings.knockbackBehaviorDuration :
				attribs.data.hitSettings.staggerDuration + attribs.data.hitSettings.staggerReturnDuration;

			// maybe damage flash
			if (props.flash) {
				Util.addOrExtend(this.ecs, victim.entity, Component.DamagedFlash, duration);
			}

			// maybe make immobile
			if (props.immobilize) {
				Util.addOrExtend(this.ecs, victim.entity, Component.Immobile, duration);
			}

			// maybe make invincible
			if (props.invincible) {
				Util.addOrExtend(this.ecs, victim.entity, Component.Invincible, duration);
			}
		}

		public applyFx(victim: Engine.Aspect, dealt: number): void {
			// don't bleed if no damage dealt
			if (dealt <= 0) {
				return;
			}

			// get attributes
			if (!victim.has(Component.Attributes)) {
				return;
			}
			let attribs = victim.get(Component.Attributes);

			// bleed (if applicable)
			Bleeding.begin(this.ecs, victim.entity, attribs.data.hitBlood);
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>, dirty: Set<Engine.Entity>): void {
			for (let entity of dirty) {
				let aspect = entities.get(entity);

				// initial check for damage immunity
				if (this.isDamageImmune(aspect)) {
					continue;
				}

				// cycle through everything that hit this object.
				let cShape = aspect.get(Component.CollisionShape);
				for (let otherEntity of cShape.collisionsFresh.keys()) {
					// damage immunity status may change during this loop
					if (this.isDamageImmune(aspect)) {
						continue;
					}

					// attacks are frequently spawned and removed; ensure valid
					if (!this.isValidAttack(otherEntity)) {
						continue;
					}

					if (!this.canDamage(aspect, otherEntity)) {
						continue;
					}

					// Apply damage (note: two attacks per frame can hit).
					let dealt = this.applyDamage(aspect, otherEntity);

					// NOTE: Legacy (exp) feature would go here: on the victim,
					// add the attack.attacker to the list of thing that last
					// hit it. Then the Death system can issue exp to those on
					// the list the frame that it dies.

					// Compute and apply knockback, stagger, or neither.
					let [doKnockback, doStagger] = this.applyKnockbackStagger(aspect, otherEntity);

					// Apply "hit" forces to this entity.
					this.applyForces(aspect, otherEntity, doKnockback, doStagger);

					// Apply behaviors (flash, invincible, immobile).
					this.applyBehaviors(aspect, doKnockback, doStagger);

					// Apply effects (blood).
					this.applyFx(aspect, dealt);

					// NOTE: consider (for arrows) removing attack one it hits
					// something. (Alternatively, make stick around.)
				}
			}
		}
	}
}
