/// <reference path="../engine/ecs.ts" />

namespace System {

	type SelectorTarget = 'none' | 'sword' | 'bow';

	class PlayerHUDRendererAspect extends Engine.Aspect {
		core: Engine.Entity[] = []

		// hearts
		hearts: Engine.Entity[] = []
		curHealth: number = 0

		// board
		boardBase: string = null
		board: Engine.Entity = null

		// weapon board
		weaponBoardName: string = null
		weaponBoard: Engine.Entity = null

		// sword
		swordIconBase: string = null
		swordIcon: Engine.Entity = null

		// bow
		bowIcon: Engine.Entity = null

		// selector
		selectorTarget: SelectorTarget = 'none'
		selector: Engine.Entity = null

		// doughnuts
		doughnutInactive: Engine.Entity = null
		doughnutActiveBG: Engine.Entity = null
		doughnutActiveDoughnut: Engine.Entity = null

		/**
		 * Removes and nulls everything.
		 */
		public destroyEverything(gui: GUIManager): void {
			// core
			while (this.core.length > 0) {
				gui.destroy(this.core.pop());
			}

			// hearts
			while (this.hearts.length > 0) {
				gui.destroy(this.hearts.pop());
			}

			// board
			if (this.board != null) {
				gui.destroy(this.board);
				this.board = null;
			}

			// weapon board
			if (this.weaponBoardName != null) {
				gui.destroy(this.weaponBoard);
				this.weaponBoard = null;
				this.weaponBoardName = null;
			}

			// sword icon
			if (this.swordIconBase != null) {
				gui.destroy(this.swordIcon);
				this.swordIcon = null;
				this.swordIconBase = null;
			}

			// bow icon
			if (this.bowIcon != null) {
				gui.destroy(this.bowIcon);
				this.bowIcon = null;
			}

			if (this.selector != null) {
				gui.destroy(this.selector);
				this.selector = null;
				this.selectorTarget = 'none';
			}

			// doughnut
			this.destroyInactiveDoughnut(gui);
			this.destroyActiveDoughnut(gui);
		}

		public destroyInactiveDoughnut(gui: GUIManager): void {
			if (this.doughnutInactive != null) {
				gui.destroy(this.doughnutInactive);
				this.doughnutInactive = null;
			}
		}

		public destroyActiveDoughnut(gui: GUIManager): void {
			if (this.doughnutActiveBG != null) {
				gui.destroy(this.doughnutActiveBG);
				this.doughnutActiveBG = null;
			}
			if (this.doughnutActiveDoughnut != null) {
				gui.destroy(this.doughnutActiveDoughnut);
				this.doughnutActiveDoughnut = null;
			}
		}
	}

	function getBoardBase(maxHP: number): string {
		switch (maxHP) {
			case 3:
				return 'HUD/playerHUDBoard3Hearts'
			case 4:
				return 'HUD/playerHUDBoard4Hearts'
			case 5:
				return 'HUD/playerHUDBoard5Hearts'
			default:
				return 'HUD/PlayerHUDv3Board'
		}
	}

	/**
	 * Gets the weapon backing board that should be displayed based on the
	 * weapons the player has.
	 */
	function getWeaponBoardName(aspect: PlayerHUDRendererAspect): string {
		if (!aspect.has(Component.Armed)) {
			return null;
		}
		let armed = aspect.get(Component.Armed);
		switch (armed.inventory.length) {
			case 0:
				return null;
			case 1:
				return 'playerHUDBoardSword';
			case 2:
				return 'playerHUDBoardBow';
			default:
				// if > 2 for some reason, just use the sword + bow one
				return 'playerHUDBoardBow';
		}
	}

	/**
	 * Returns sword asset to be displayed in weapon indicator (hot swapped as
	 * gui asset)
	 */
	function getSwordIconBase(aspect: PlayerHUDRendererAspect): string {
		if (!aspect.has(Component.Armed)) {
			return null;
		}
		let armed = aspect.get(Component.Armed);
		// we know sword weapons based on their combo
		for (let weapon of armed.inventory) {
			if (weapon.comboAttack != null) {
				if (weapon.comboAttack.damage == 2) {
					return 'HUD/hudStab'
				} else if (weapon.comboAttack.damage == 3) {
					return 'HUD/hudAOE'
				}
				// otherwise unk combo, just continue
			}
		}
		// no combo; return base
		return 'HUD/hudSword'
	}

	/**
	 * Returns whether to display the bow icon.
	 */
	function getDisplayBowAndSelector(aspect: PlayerHUDRendererAspect): boolean {
		return aspect.has(Component.Armed) && aspect.get(Component.Armed).inventory.length > 1;
	}

	/**
	 * Returns where the selector should be pointing (including 'none' for "it
	 * shouldn't exist").
	 */
	function getSelectorTarget(aspect: PlayerHUDRendererAspect): SelectorTarget {
		if (!getDisplayBowAndSelector(aspect)) {
			return 'none';
		}
		return aspect.get(Component.Armed).active.comboAttack == null ? 'bow' : 'sword';
	}

	function getSelectorY(target: SelectorTarget): number {
		// only valid here are 'bow' and 'sword', but we'll do a 0 default
		// because why not.
		switch (target) {
			case 'sword':
				return 59;
			case 'bow':
				return 96;
			default:
				return 0;
		}
	}

	function buildSelectorTween(y: number): Tween.Spec {
		return {
			visuals: [{
				prop: 'y',
				spec: {
					valType: 'abs',
					val: y,
					duration: 500,
					method: 'easeOutCubic',
					delay: 0,
				}
			}],
			sounds: [],
		}
	}

	export class PlayerHUDRenderer extends Engine.System {

		public coreSpriteIDs = [
			'playerHUDFrameBG',
			'playerHUDFrame',
			'playerHUDPortrait',
		]

		public componentsRequired = new Set<string>([
			Component.Health.name,
			Component.PlayerInput.name,
		])

		constructor() {
			// start disabled (!) until we finish the start script stuff
			super(true);
		}

		@override
		public makeAspect(): PlayerHUDRendererAspect {
			return new PlayerHUDRendererAspect();
		}

		@override
		public onDisabled(entities: Map<Engine.Entity, PlayerHUDRendererAspect>): void {
			let gui = this.ecs.getSystem(GUIManager);

			for (let aspect of entities.values()) {
				aspect.destroyEverything(gui);
			}
		}

		@override
		onRemove(aspect: PlayerHUDRendererAspect): void {
			aspect.destroyEverything(this.ecs.getSystem(GUIManager));
		}

		private ensureCore(aspect: PlayerHUDRendererAspect): void {
			// assuming we either have all or none
			if (aspect.core.length == this.coreSpriteIDs.length) {
				return;
			}

			let gui = this.ecs.getSystem(GUIManager);
			for (let sid of this.coreSpriteIDs) {
				aspect.core.push(gui.createSprite(sid));
			}
		}

		private updateBoard(aspect: PlayerHUDRendererAspect): void {
			let gui = this.ecs.getSystem(GUIManager);

			// see whether replacement necessary
			let health = aspect.get(Component.Health);
			let bb = getBoardBase(health.maximum);
			if (bb === aspect.boardBase) {
				return;
			}

			// replace
			if (aspect.board != null) {
				gui.destroy(aspect.board);
			}
			aspect.board = gui.createSprite('playerHUDBoard', bb);
			aspect.boardBase = bb;
		}

		private updateWeaponBoard(aspect: PlayerHUDRendererAspect): void {
			let gui = this.ecs.getSystem(GUIManager);

			let boardName = getWeaponBoardName(aspect);
			if (boardName != aspect.weaponBoardName) {
				// remove if exists
				if (aspect.weaponBoardName != null) {
					gui.destroy(aspect.weaponBoard);
				}

				// update with new one
				aspect.weaponBoardName = boardName;
				if (boardName == null) {
					aspect.weaponBoard = null;
				} else {
					aspect.weaponBoard = gui.createSprite(boardName);
				}
			}
		}

		private updateWeaponIcons(aspect: PlayerHUDRendererAspect): void {
			let gui = this.ecs.getSystem(GUIManager);

			// update sword
			let swordIconBase = getSwordIconBase(aspect);
			if (swordIconBase != aspect.swordIconBase) {
				// remove if exists
				if (aspect.swordIconBase != null) {
					gui.destroy(aspect.swordIcon);
				}

				// update with new one
				aspect.swordIconBase = swordIconBase;
				if (swordIconBase == null) {
					aspect.swordIcon = null
				} else {
					aspect.swordIcon = gui.createSprite('playerHUDSwordIcon', swordIconBase);
				}
			}

			// update bow
			if (getDisplayBowAndSelector(aspect)) {
				// ensure bow displayed
				if (aspect.bowIcon == null) {
					aspect.bowIcon = gui.createSprite('playerHUDBowIcon');
				}
			} else {
				// don't want bow displayed; remove if it's there
				if (aspect.bowIcon != null) {
					gui.destroy(aspect.bowIcon);
					aspect.bowIcon = null;
				}
			}
		}

		private updateSelector(aspect: PlayerHUDRendererAspect): void {
			let gui = this.ecs.getSystem(GUIManager);

			let target = getSelectorTarget(aspect);

			if (target == 'none') {
				// no selector wanted; ensure it's gone
				if (aspect.selector != null) {
					gui.destroy(aspect.selector);
					aspect.selector = null;
					aspect.selectorTarget = target;
				}
				return;
			}

			// we want a selector. ensure it exists. if we simply create it, we
			// put it in the right place immediately and don't do any tweening.
			if (aspect.selector == null) {
				aspect.selector = gui.createSprite(
					'playerHUDWeaponSelector',
					null,
					new Point(6, getSelectorY(target)),
				);
				aspect.selectorTarget = target;
				return;
			}

			// at this point, we want a selector and we already have one. now
			// we just do a tween if the target has changed.
			if (aspect.selectorTarget != target) {
				gui.tweenManual(aspect.selector, buildSelectorTween(getSelectorY(target)));
				aspect.selectorTarget = target;
			}
		}

		private updateHearts(aspect: PlayerHUDRendererAspect): void {
			let gui = this.ecs.getSystem(GUIManager);

			let health = aspect.get(Component.Health);
			// replace with 'off' hearts, as needed
			while (health.current < aspect.curHealth) {
				let i = aspect.curHealth - 1;
				gui.destroy(aspect.hearts[i]);
				aspect.hearts[i] = gui.createSprite(
					'playerHUDHeartOff', null, new Point(55 + i*17.5, 9));
				aspect.curHealth--;
			}
			// replace with 'on' hearts, as needed
			while (health.current > aspect.curHealth) {
				let i = aspect.curHealth;
				if (aspect.hearts[i] != null) {
					gui.destroy(aspect.hearts[i]);
				}
				aspect.hearts[i] = gui.createSprite(
					'playerHUDHeartOn', null, new Point(55 + i*17.5, 9));
				aspect.curHealth++;
			}
		}

		private getDoughnutAcquired(): boolean {
			return this.ecs.getSystem(Bookkeeper).getSecretFound();
		}

		private updateDoughnut(aspect: PlayerHUDRendererAspect): void {
			let gui = this.ecs.getSystem(GUIManager);
			let acquired = this.getDoughnutAcquired();

			if (!acquired) {
				// want only inactive thing displayed.

				// remove any active indicators
				aspect.destroyActiveDoughnut(gui);

				// create the inactive thing if necessary
				if (aspect.doughnutInactive == null) {
					aspect.doughnutInactive = gui.createSprite('playerHUDDoughnutInactive');
				}
			} else {
				// want active things displayed;

				// remoave any inactive indicator
				aspect.destroyInactiveDoughnut(gui);

				// create active indicators
				if (aspect.doughnutActiveBG == null) {
					aspect.doughnutActiveBG = gui.createSprite('playerHUDDoughnutActiveBG');
				}
				if (aspect.doughnutActiveDoughnut == null) {
					aspect.doughnutActiveDoughnut = gui.createSprite('playerHUDDoughnutActiveDoughnut');
				}
			}
		}

		public update(delta: number, entities: Map<Engine.Entity, PlayerHUDRendererAspect>): void {
			for (let aspect of entities.values()) {
				this.ensureCore(aspect);
				this.updateBoard(aspect);
				this.updateHearts(aspect);
				this.updateWeaponBoard(aspect);
				this.updateWeaponIcons(aspect);
				this.updateSelector(aspect);
				this.updateDoughnut(aspect);
			}
		}

	}
}
