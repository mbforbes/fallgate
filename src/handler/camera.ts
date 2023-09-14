/// <reference path="../system/fx-camera.ts" />

namespace Handler {

	export class Camera extends Events.Handler {

		// Settings

		enemyStaggerMagnitude = 100
		enemyStaggerFrames = 40
		enemyStaggerType = System.ShakeType.JumpEaseBack;

		playerHitMagnitude = 75
		playerHitFrames = 60
		playerHitType = System.ShakeType.Wobble

		playerBlocksMagnitude = 15
		playerBlocksFrames = 30
		playerBlocksType = System.ShakeType.JumpEaseBack

		explosionMagnitude = 90
		explosionFrames = 60
		explosionType = System.ShakeType.Wobble

		dispatcher = new Map<Events.EventType, (EventType, any) => void>([
			[Events.EventTypes.EnemyStaggerPre, this.enemyStaggerShake],
			[Events.EventTypes.Damage, this.damageShake],
			[Events.EventTypes.Block, this.blockShake],
			[Events.EventTypes.Explosion, this.explosionShake],
		])

		/**
		 * TODO: is this really the best way to get systems? I haven't had to
		 * get a system before, so there's no API for it. This could be solved
		 * with some kind of message bus. It'd be overkill right now.
		 * @param fxCamera
		 */
		constructor(private fxCamera: System.FxCamera) {
			super();
		}

		blockShake(et: Events.EventType, args: Events.BlockArgs): void {
			// currently only shaking when player blocks
			if (args.defenderType !== Ontology.Thing.Player) {
				return;
			}

			this.fxCamera.shake(
				args.angleAtoB,
				this.playerBlocksFrames,
				this.playerBlocksMagnitude,
				this.playerBlocksType);
		}

		explosionShake(et: Events.EventType, args: Events.DamageArgs): void {
			this.fxCamera.shake(
				Constants.HALF_PI,
				this.explosionFrames,
				this.explosionMagnitude,
				this.explosionType);
		}

		damageShake(et: Events.EventType, args: Events.DamageArgs): void {
			// currently only shaking when player hit
			if (args.victimType !== Ontology.Thing.Player) {
				return;
			}

			this.fxCamera.shake(
				0,
				this.playerHitFrames,
				this.playerHitMagnitude,
				this.playerHitType);
		}

		enemyStaggerShake(et: Events.EventType, args: Events.EnemyStaggerPreArgs): void {
			if (!args.heavyEffects) {
				return;
			}
			this.fxCamera.shake(
				args.angleAtoV,
				this.enemyStaggerFrames,
				this.enemyStaggerMagnitude,
				this.enemyStaggerType);
		}
	}
}
