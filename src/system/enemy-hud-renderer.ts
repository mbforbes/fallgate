/// <reference path="../engine/ecs.ts" />

namespace System {

	/**
	 * GUI entity
	 */
	type PiecePackage = {
		entity: Engine.Entity,
		offset: Point,
		startAlpha: number,
	}

	class EnemyHUDRendererAspect extends Engine.Aspect {
		/**
		 * Map from GUI element name to info
		 */
		public txtPieces = new Map<string, PiecePackage>()
		public spritePieces = new Map<string, PiecePackage>()
		public prevVisible: boolean = false
		public cacheBarID: string = null
	}

	export class EnemyHUDRenderer extends Engine.System {

		private cacheEnemyHUDBasePos = new Point()

		// positioning based on player location
		private aboveOffset = new Point(0, -25);
		private belowOffset = new Point(0, 50);

		// how much to multiply max health by to get total bar size
		private widthMultiplier = 10

		// bar sprite IDs that need to be altered
		private barSpriteIDs = new Set<string>([
			'enemyHUDNormalHealth', 'enemyHUDGatekeeperHealth', 'enemyHUDBossHealth']);

		public componentsRequired = new Set<string>([
			Component.Position.name,
			Component.Health.name,
			Component.Enemy.name,
		])

		// NOTE: use Component.Lockon to judge visibility

		constructor(
			private gui: System.GUIManager,
			private guiSequence: GUI.SequenceSpec,
			private translator: Stage.Translator,
			private playerSelector: System.PlayerSelector,
		) {
			super();
		}

		@override
		public makeAspect(): EnemyHUDRendererAspect {
			return new EnemyHUDRendererAspect();
		}

		/**
		 * Health value (current or maximum) to coordinate (x) value in base HUD
		 * coordinates.
		 */
		private healthToCoord(health: number): number {
			return health * this.widthMultiplier;
		}

		private setBarWidth(bar: Engine.Entity, health: Component.Health): void {
			let sComps = this.ecs.getComponents(bar);
			let gs = sComps.get(Component.GUISprite);
			gs.baseData.width = this.healthToCoord(health.current);
		}

		private computeBarID(enemy: Component.Enemy): string {
			if (enemy.boss) {
				return 'enemyHUDBossHealth';
			}
			if (enemy.gatekeeper || enemy.gateID != null) {
				return 'enemyHUDGatekeeperHealth';
			}
			return 'enemyHUDNormalHealth';
		}

		private createSpritePkg(spriteID: string, overridePos: Point = null): PiecePackage {
			// cache inner HUD offset so that we know how to reposition this
			// piece later when we move the whole HUD based on the enemy's
			// position.
			let s = this.gui.createSprite(spriteID, null, overridePos);
			let sComps = this.ecs.getComponents(s);

			// start invisible
			if (sComps.has(Component.Tweenable)) {
				sComps.get(Component.Tweenable).groundTruth.alpha = 0;
			}

			return {
				entity: s,
				offset: sComps.get(Component.Position).p.copy(),
				startAlpha: sComps.get(Component.GUISprite).baseData.alpha,
			}
		}

		/**
		 * NOTE: not cleaning anything up (no onRemove(...)) because
		 * System.GUIManager takes care of it at the end of the level (and
		 * otherwise we end up with a race condition there).
		 * @param aspect
		 */
		@override
		public onAdd(aspect: EnemyHUDRendererAspect): void {
			// Construct using System.GUIManager

			// get info
			let enemy = aspect.get(Component.Enemy);
			let health = aspect.get(Component.Health);

			let textOverrides = new Map<string, string>([
				['enemyHUDName', enemy.enemyName],
				['enemyHUDKind', enemy.kind],
			])

			for (let txtID of this.guiSequence.text) {
				let override = null;
				if (textOverrides.has(txtID)) {
					override = textOverrides.get(txtID);
				}
				let e = this.gui.createText(txtID, override);
				let eComps = this.ecs.getComponents(e);
				// TODO: tween
				// this.gui.tween(e, 'enter');
				aspect.txtPieces.set(txtID, {
					entity: e,
					offset: eComps.get(Component.Position).p.copy(),
					startAlpha: eComps.get(Component.TextRenderable).textData.alpha,
				});

				// start invisible
				if (eComps.has(Component.Tweenable)) {
					eComps.get(Component.Tweenable).groundTruth.alpha = 0;
				}
			}

			// pick bar type based on enemy status
			let barID = this.computeBarID(enemy);
			aspect.cacheBarID = barID;

			for (let spriteID of this.guiSequence.sprites.concat([barID])) {
				let overridePos: Point = null;
				if (spriteID === 'enemyHUDCapRight') {
					overridePos = new Point(this.healthToCoord(health.maximum), 0);
				}

				let spritePkg = this.createSpritePkg(spriteID, overridePos)
				let sComps = this.ecs.getComponents(spritePkg.entity);

				// maybe override the width
				if (spriteID === 'enemyHUDUnderBar') {
					sComps.get(Component.GUISprite).baseData.width = this.healthToCoord(health.maximum);
				}

				aspect.spritePieces.set(spriteID, spritePkg);
			}
		}

		public update(delta: number, entities: Map<Engine.Entity, EnemyHUDRendererAspect>): void {
			// get player pos for angle computations
			let player = this.playerSelector.latest().next().value;
			if (player == null) {
				console.warn('Player not found; skipping enemy hud update');
				return;
			}
			let playerPos = this.ecs.getComponents(player).get(Component.Position).p;

			for (let aspect of entities.values()) {
				// check whether manually disabled
				let enemy = aspect.get(Component.Enemy);
				if (enemy.hudDisabled) {
					continue;
				}

				// get data
				let health = aspect.get(Component.Health);
				let enemyPos = aspect.get(Component.Position).p;
				let angle = playerPos.angleTo(enemyPos);
				let offset = this.aboveOffset;
				if (angle < Math.PI) {
					offset = this.belowOffset;
				}

				// maybe update barID (the "check at frame 1" detection is
				// really causing annoyances... gateID not set by aspect
				// creation)
				let barID = this.computeBarID(enemy);
				if (barID != aspect.cacheBarID) {
					// destroy
					if (aspect.cacheBarID != null && aspect.spritePieces.has(aspect.cacheBarID)) {
						this.gui.destroy(aspect.spritePieces.get(aspect.cacheBarID).entity);
						aspect.spritePieces.delete(aspect.cacheBarID);
					}
					// create new one
					aspect.spritePieces.set(barID, this.createSpritePkg(barID));
					aspect.cacheBarID = barID;
				}

				// detect visibility
				let visible = aspect.has(Component.LockOn) || aspect.has(Component.DamagedFlash);

				// translate to HUD coordinates
				this.translator.worldToHUDBase(this.cacheEnemyHUDBasePos.copyFrom_(enemyPos));

				// now update the HUD entities' positions
				let worklist = [aspect.spritePieces, aspect.txtPieces];
				for (let w of worklist) {
					for (let [id, pkg] of w.entries()) {
						// update the width of any of the bars
						if (this.barSpriteIDs.has(id)) {
							this.setBarWidth(pkg.entity, health);
						}

						// update HUD entity pos as enemy pos + player-aware
						// distance offset + HUD entity offset
						let eComps = this.ecs.getComponents(pkg.entity);
						// safety check in case pkg.entity isn't tracked (level
						// warping bug).
						if (eComps == null) {
							continue;
						}
						let pos = eComps.get(Component.Position);
						pos.p = this.cacheEnemyHUDBasePos.copy().add_(offset).add_(pkg.offset);

						// if no tweenable comp, nothing else we can do in this
						// inner loop
						if (!eComps.has(Component.Tweenable)) {
							continue;
						}
						let tweenable = eComps.get(Component.Tweenable);

						// ensure visibility if we need it
						if ((!aspect.prevVisible) && visible) {
							// clear any queued up fade-out tweens because
							// otherwise they'd override this or happen too
							// fast after mouse-off
							tweenable.clear = true;
							tweenable.tweenQueue.push({
								prop: 'alpha',
								spec: {
									delay: 0,
									duration: 200,
									val: pkg.startAlpha,
									valType: 'abs',
									method: 'linear',
								}
							});
						}

						// do exit tween if just became not locked-on
						if (aspect.prevVisible && (!visible)) {
							tweenable.tweenQueue.push({
								prop: 'alpha',
								spec: {
									delay: 1500,
									duration: 500,
									val: 0,
									valType: 'abs',
									method: 'linear',
								}
							});

						}
					}
				}

				// update state
				aspect.prevVisible = visible;
			}
		}
	}
}
