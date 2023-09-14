/// <reference path="../engine/ecs.ts" />


/**
 * Part answers the question of "what aspects of an entity should be rendered?"
 *
 * This will be only a few simple things for now (e.g. body + sword), but could
 * be expanded to include things like armor, water splashing, or wounds.
 *
 * This is a 'choose n' enum, much like CollisionType.
 */
enum Part {
	/**
	 * The 'core' part of an entity. This will be the physical body of a sprite,
	 * or the entirety of a scenery object (like a flag).
	 */
	Core = 0,

	/**
	 * When the entity has a visible weapon.
	 */
	Weapon,

	/**
	 * When the entity has a visible shield.
	 */
	Shield,

	/**
	 * Special effects (like a big sword swoosh).
	 */
	Fx,
}

/**
 * PartID answers the question of: "how should each Part be rendered?"
 *
 * For a Core Partart, it will decide, e.g., the stance based on the equipped
 * weapon. For the Weapon or Shield Part, it will be which weapon to render.
 */
enum PartID {
	/**
	 * The 'default' part ID; used esp for an entity's Action where the Part
	 * always has one way it is rendered (e.g., an entity's idle/core/x
	 * always is displayed the same no matter what weapon it is holding).
	 */
	 Default = 0,

	 /**
	  * A sword-relevant part (e.g., the character's stance while holding a
	  * sword (x/core/sword); the sword itself (x/weapon/sword)).
	  */
	 Sword,

	 /**
	  * An axe-relevant part.
	  */
	 Axe,

	 /**
	  * A bow-relevant part.
	  */
	 Bow,
}

namespace Component {
	export class Body extends Engine.Component {

		/**
		 * For optimization: can be set for simple animatable entities to
		 * ignore all the body part checking and just set the mapping to the
		 * default value.
		 *
		 * TODO: probably remove this.
		 */
		public coreDefaultOnly = false

		/**
		 * Does underlying part update. Callers should use setParts(...)
		 * instead to avoid setting the dirty flag whenever possible.
		 */
		private updateParts(v: Map<Part, PartID>): void {
			mapClone(v, this._parts);
			this.dirty();
		}

		/**
		 * Call to set body parts. Handles smartly only setting dirty flag upon
		 * actual mutations.
		 */
		public setParts(v: Map<Part, PartID>): void {
			// only need to mark as dirty if v is different than cur.

			// shortcut check: if sizes different, for sure different.
			if (v.size != this._parts.size) {
				this.updateParts(v);
				return;
			}

			// same size. check each new. if any aren't there+same, different.
			for (let [nk, nv] of v.entries()) {
				if ((!this._parts.has(nk)) || this._parts.get(nk) !== nv) {
					this.updateParts(v);
					return;
				}
			}

			// all same; nothing to do!
		}

		/**
		 * Call to get iterator over [Part, PartID] pairs.
		 */
		public getParts(): IterableIterator<[Part, PartID]> {
			return this._parts.entries();
		}

		/**
		 * Call to get PartID for Part.
		 */
		public getPart(part: Part): PartID {
			return this._parts.get(part);
		}

		private _parts = new Map<Part, PartID>()

		public toString(): string {
			return mapString(this._parts, (p: Part) => Part[p], (p: PartID) => PartID[p]);
		}
	}
}
