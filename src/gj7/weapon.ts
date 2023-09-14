/// <reference path="../component/body.ts" />
/// <reference path="sound.ts" />

namespace Weapon {

	export enum SwingState {
		Idle = 0,
		ChargeCharging,
		ChargeReady,
		Swing,
		Sheathe,
		QuickAttack,
		QuickAttack2,
		Combo,
	}

	/**
	 * Timing info for a weapon's swing stages. This is character-centric.
	 */
	export type CharacterTiming = {
		idleCooldown: number,
		minChargeDuration: number,
		swingDuration: number,
		sheatheDuration: number,

		/**
		 * How long after the quick attack state was entered (i.e., not
		 * including the quickAttackAttackDelay) must the entity wait before
		 * beginning the next quick attack (or combo). Should be less than
		 * quickAttackDuration.
		 */
		quickAttackNextWait: number,

		/**
		 * How long a quick attack lasts before returning to idle. Starts from
		 * when state was entered (i.e., not including the
		 * quickAttackAttackDelay).
		 */
		quickAttackDuration: number,

		/**
		 * From from when the swing state was entered until the "Attack" entity
		 * is spawned.
		 */
		swingAttackDelay: number,

		/**
		 * Time from when the quick attack state was entered until the "Attack"
		 * entity is spawned.
		 */
		quickAttackAttackDelay: number,

		/**
		 * Total duration for the combo state.
		 */
		comboDuration: number,

		/**
		 * Time from when the combo state is entered until the attack object
		 * (collision box) is spawned.
		 */
		comboAttackDelay: number,
	}

	export enum AttackMovement {
		Track = 0,
		Launch,
	}

	export enum AttackType {
		Quick = 0,
		Swing,
		Combo,
	}

	/**
	 * This is how you specify an AttackInfo externally (in a JSON file).
	 * Please see below (type AttackInfo) for details on what all the fields
	 * mean!
	 */
	export type AttackInfoSpec = {
		cboxDims?: number[],
		cboxOffset?: number[],
		movement: string,
		damage: number,
		cTypes: string[],
		knockbackForce: number,
		staggerForce: number,
		lungeForce: number,
		duration: number,

		// optional
		unblockable?: boolean
		sounds?: Sound.Attack,
		blockedDuration?: number,

		// optional: projectiles
		velocity?: number,
		animSpecs?: Anim.Spec[],
	}

	/**
	 * Info (including timing) for the attack. (This is attack-centric.)
	 */
	export type AttackInfo = {
		// NOTE: cboxDims and cboxOffset should exist on normal attacks; they
		// should not exist for static damage definitions, because then the
		// attack takes the collision box of the parent object. We might want
		// to make a separate spec for this.
		cboxDims?: Point,
		cboxOffset?: Point,
		movement: AttackMovement,
		damage: number,
		attackType: AttackType,
		cTypes: CollisionType[],

		/**
		 * Denotes that this attack cannot be blocked. Useful for, e.g.,
		 * environmental attacks that are long-lived and shields shouldn't
		 * protect you from.
		 */
		unblockable?: boolean,

		/**
		 * How much force is applied to the victim if this attack causes a
		 * knockback.
		 */
		knockbackForce: number,

		/**
		 * How much force is applied to the victim if this attack causes a
		 * stagger.
		 */
		staggerForce: number,

		/**
		 * How much force is applied to the attacker to move it forward.
		 */
		lungeForce: number,

		/**
		 * Time in ms before the attack is stopped. -1 for no limit
		 * (e.g., arrows that go until they hit something).
		 */
		duration: number,

		/**
		 * If this attack is blocked (e.g., by the player's shield), this is the
		 * amount of time in ms that the `Blocked` state will be applied to the
		 * attacker. If not provided, uses Blocked.DEFAULT_DURATION.
		 */
		blockedDuration?: number,

		/**
		 * Only relevant for AttackMovement.Launch; speed it flies.
		 */
		velocity?: number,

		/**
		 * Only relevant for AttackMovement.Launch; how to draw the attack
		 * itself (e.g., an arrow).
		 */
		animDatas?: Map<Anim.Key, Anim.Data>,

		/**
		 * Sound effects to play based on different situations (e.g., swing,
		 * hit).
		 */
		sounds?: Sound.Attack,
	}

	/**
	 * NOTE: it's gross (and seems bug-prone) that we have to do this. Is there
	 * a better way?
	 *
	 * @param orig
	 */
	export function cloneAttackInfo(orig: AttackInfo): AttackInfo {
		if (orig == null) {
			return null;
		}

		// make "basic" copy for primitive types
		let res = clone(orig);

		// fixup objects
		if (orig.cboxDims != null) {
			res.cboxDims = orig.cboxDims.copy();
		}
		if (res.cboxOffset != null) {
			res.cboxOffset = orig.cboxOffset.copy();
		}
		if (orig.animDatas != null) {
			res.animDatas = new Map();
			for (let [key, data] of orig.animDatas.entries()) {
				res.animDatas.set(key, Anim.cloneData(data));
			}
		}
		return res;
	}

	/**
	 * Data class for what comprises a weapon.
	 */
	export type Weapon = {
		timing?: CharacterTiming,
		swingAttack?: AttackInfo,
		quickAttack?: AttackInfo,
		comboAttack?: AttackInfo,
		partID?: PartID,
	}

	export function cloneWeapon(orig: Weapon): Weapon {
		// make "basic" copy for primitive types
		let res = clone(orig);

		// fixup objects
		res.swingAttack = cloneAttackInfo(orig.swingAttack);
		res.quickAttack = cloneAttackInfo(orig.quickAttack);
		res.comboAttack = cloneAttackInfo(orig.comboAttack);

		return res;
	}

	/**
	 * Everything we load from the JSON file and convert into this.
	 */
	export type FullWeaponData = {
		weapon: Weapon,
		animations: Map<Anim.Key, Anim.Data>,
	}

	/**
	 * Creates a NEW weapon which is parent piece-wise extended by child.
	 *
	 * The extensions work as follows:
	 *   weapon:
	 *     - timing: full spec and per-item overrides supported
	 *     - attacks: attack additions and per-item overrides supported
	 *     - partID: override supported
	 *   animations:
	 *    - per-animation override supported (must override the entire entry)
	 *
	 * @param parent
	 * @param child
	 */
	export function extendWeapon(parent: FullWeaponData, child: FullWeaponData): FullWeaponData {
		// build up the weapon
		let weapon = cloneWeapon(parent.weapon);

		// allow full or per-item timing overrides
		objOverride(weapon, child.weapon, 'timing');

		// NOTE: not allowing null to disable parent weapons. could implement
		// (would need to let conversion explicitly set null values and then do
		// an object property check)

		// allow full or per-item attack overrides
		for (let attack of ['swingAttack', 'quickAttack', 'comboAttack']) {
			objOverride(weapon, child.weapon, attack);
		}

		if (child.weapon.partID != null) {
			weapon.partID = child.weapon.partID;
		}

		return {
			weapon: weapon,
			animations: Anim.extendAnims(parent.animations, child.animations),
		};
	}

	/**
	 * Info provided for an entity with a combo attack.
	 */
	export type ComboInfo = {
		/**
		 * How many hits it takes to pull off a combo.
		 */
		hits: number

		/**
		 * Time in ms between which hits must land to count towards a combo.
		 */
		consecutiveWindow: number

		/**
		 * After combo conditions have been met, the time window during which a
		 * combo attack can be started.
		 */
		activeWindow: number
	}
}
