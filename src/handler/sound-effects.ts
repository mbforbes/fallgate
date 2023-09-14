/// <reference path="../engine/events.ts" />
/// <reference path="../system/audio.ts" />

namespace Handler {

	export class SoundEffects extends Events.Handler {

		dispatcher = new Map<Events.EventType, (EventType, any) => void>([
			[Events.EventTypes.Damage, this.damageSound],
			[Events.EventTypes.Charge, this.chargeSound],
			[Events.EventTypes.Swing, this.swingSound],
			[Events.EventTypes.ThingDead, this.deathSound],
			[Events.EventTypes.Block, this.blockSound],
			[Events.EventTypes.Checkpoint, this.checkpointSound],
			[Events.EventTypes.ItemCollected, this.itemSound],
			[Events.EventTypes.GateOpen, this.gateOpenSound],
			[Events.EventTypes.EnemyStagger, this.staggerSound],
		])

		static itemSounds = new Map<Ontology.Item, string[]>([
			[Ontology.Item.Health, ['gainHealth']],
			[Ontology.Item.Doughnut, ['doughnut']],
		])

		constructor(private delaySpeaker: System.DelaySpeaker) {
			super();
		}

		blockSound(et: Events.EventType, args: Events.BlockArgs): void {
			if (args.shield.sounds != null && args.shield.sounds.block != null) {
				this.ecs.getSystem(System.Audio).play(args.shield.sounds.block);
			}
		}

		damageSound(et: Events.EventType, args: Events.DamageArgs): void {
			// play any sound from the weapon's attack
			let atk = args.attackInfo;
			if (atk.sounds != null) {
				this.ecs.getSystem(System.Audio).play(atk.sounds.hit, args.location);
			}

			// and also play any sound from the victim taking damage
			let vComps = this.ecs.getComponents(args.victim);
			if (vComps.has(Component.Audible)) {
				let audible = vComps.get(Component.Audible);
				if (audible.sounds.damaged != null) {
					this.ecs.getSystem(System.Audio).play(audible.sounds.damaged, args.location);
				}
			}
		}

		chargeSound(et: Events.EventType, args: Events.AttackArgs): void {
			let atk = args.attackInfo;
			if (atk.sounds != null) {
				this.ecs.getSystem(System.Audio).play(atk.sounds.charge, args.location);
			}
		}

		swingSound(et: Events.EventType, args: Events.AttackArgs): void {
			let atk = args.attackInfo;
			if (atk.sounds != null) {
				this.ecs.getSystem(System.Audio).play(atk.sounds.swing, args.location);
			}
		}

		deathSound(et: Events.EventType, args: Events.ThingDeadArgs): void {
			let vComps = this.ecs.getComponents(args.thing);
			if (vComps.has(Component.Audible)) {
				let audible = vComps.get(Component.Audible);
				if (audible.sounds.killed != null) {
					// hack for explostions to always play
					let location = args.location;
					if (vComps.has(Component.AIComponent) &&
						vComps.get(Component.AIComponent).behavior === AI.Behavior.Sawtooth) {
						location = null;
					}
					this.ecs.getSystem(System.Audio).play(audible.sounds.killed, location);
				}
			}

			// special case player death
			if (args.thingType == Ontology.Thing.Player) {
				this.delaySpeaker.enqueue({
					options: ['vanquished'],
					delay: 1000,
				})
			}
		}

		checkpointSound(et: Events.EventType, args: Events.CheckpointArgs): void {
			this.ecs.getSystem(System.Audio).play(['checkpoint']);
			this.delaySpeaker.enqueue({
				options: ['checkpoint-voice'],
				delay: 400,
			})
		}

		itemSound(et: Events.EventType, args: Events.ItemCollectedArgs): void {
			if (!SoundEffects.itemSounds.has(args.itemType)) {
				return;
			}
			this.ecs.getSystem(System.Audio).play(SoundEffects.itemSounds.get(args.itemType));
		}

		/**
		 * NOTE: this is a stupid design pattern.
		 */
		gateOpenSound(et: Events.EventType, args: Events.GateOpenArgs): void {
			this.ecs.getSystem(System.Audio).play(['gateOpen']);
		}

		staggerSound(et: Events.EventType, args: Events.EnemyStaggerArgs): void {
			this.ecs.getSystem(System.Audio).play(['stagger']);
		}
	}
}
