/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/attack.ts" />
/// <reference path="../component/comboable.ts" />

namespace System {

	/**
	 * Tracks attacks to track Combo-able entities' combo status.
	*/
	export class Combo extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Attack.name,
			Component.FromComboable.name,
		])

		constructor(private comboables: ComboableSelector) {
			super();
		}

		private elapsed(attack: Component.Attack): number {
			if (attack.startTime === -1) {
				return 0;
			}
			return this.ecs.gametime - attack.startTime;
		}


		private check(comboable: Component.Comboable): boolean {
			// condition 5: num hits (keeping <= this num handled in insertion)
			if (comboable.attacks.length !== comboable.hits) {
				return false;
			}

			// edge case: if 0 for some reason, we just say always yes (can't
			// compute any durations with this)
			if (comboable.attacks.length === 0) {
				return true;
			}

			// most recent attack in back. if that's out of the active window,
			// we know combo can't be ready.
			let latestAttack = comboable.attacks[comboable.attacks.length - 1];
			let latestElasped = this.elapsed(latestAttack);
			if (latestElasped > comboable.activeWindow) {
				return false;
			}

			// check through all attacks. if any didn't hit, or were out of the
			// consecutive window, combo conditions aren't fulfilled. (latest
			// attack trivially passes consecutive window check as it will have
			// 0 diff w/ itself.)
			let recentElapsed = latestElasped;
			for (let i = comboable.attacks.length - 1; i >= 0; i--) {
				let cur = comboable.attacks[i];

				if (!cur.hit) {
					return false;
				}

				let curElapsed = this.elapsed(cur);
				if (curElapsed - recentElapsed > comboable.consecutiveWindow) {
					return false;
				}

				recentElapsed = curElapsed;
			}

			// all conditions passed: comboable ready
			return true;
		}

		// five criteria:
		//	- [x] 1. consecutive hits
		//	- [x] 2. consecutive window
		//	- [x] 3. active window
		//	- [x] 4. quick attacks only
		//	- [x] 5. #hits fulfilled
		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			// cycle through attacks
			for (let [entity, aspect] of entities.entries()) {
				let attack = this.ecs.getComponents(entity).get(Component.Attack);

				// we are only concerend with sword quick attacks (for now)
				// (condition 4). (add non-hitting ones so we can track them
				// and cancel combos)
				if (attack.info.attackType !== Weapon.AttackType.Quick) {
					continue;
				}

				// we are only concerned with attacks whose attackers are
				// combo'able
				let attacker = attack.attacker;
				let attackerComps = this.ecs.getComponents(attack.attacker);
				if (attackerComps == null || !attackerComps.has(Component.Comboable)) {
					continue;
				}
				let comboable = attackerComps.get(Component.Comboable);

				// check to see whether this attack is tracked already. add it
				// to the back if not, and prune any extras.
				if (comboable.attacks.indexOf(attack) === -1) {
					comboable.attacks.push(attack);
					while (comboable.attacks.length > comboable.hits) {
						comboable.attacks.splice(0, 1);
					}
				}
			}

			// now, we want to update all comboable attackers regardless of
			// whether we saw any attacks.
			// for (let )
			for (let entity of this.comboables.latest()) {
				let comboable = this.ecs.getComponents(entity).get(Component.Comboable);

				// check remaining conditions
				comboable.comboReady = this.check(comboable);
			}
		}
	}
}
