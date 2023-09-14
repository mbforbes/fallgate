/// <reference path="../core/lang.ts" />
/// <reference path="../core/base.ts" />
/// <reference path="../core/util.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/anim.ts" />
/// <reference path="../graphics/animation.ts" />
/// <reference path="../gj7/conversion.ts" />
/// <reference path="../gj7/weapon.ts" />
/// <reference path="../gj7/item.ts" />
/// <reference path="../gj7/shield.ts" />
/// <reference path="../gj7/sound.ts" />
/// <reference path="../gj7/attributes.ts" />
/// <reference path="../component/activity.ts" />
/// <reference path="../component/animatable.ts" />
/// <reference path="../component/armed.ts" />
/// <reference path="../component/camera-followable.ts" />
/// <reference path="../component/collision-shape.ts" />
/// <reference path="../component/body.ts" />
/// <reference path="../component/enemy.ts" />
/// <reference path="../component/health.ts" />
/// <reference path="../component/input.ts" />
/// <reference path="../component/player-input.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/static-renderable.ts" />
/// <reference path="../component/shielded.ts" />

namespace GameMap {

	/**
	 * Helper to turn a comma-separated list of numbers into an array of
	 * numbers. Also ensures the length is as desired.
	 */
	function parseNums(s: string, propName: string, lenWant: number): number[] {
		let res = new Array<number>();

		for (let chunk of s.split(',')) {
			res.push(parseFloat(chunk.trim()));
		}

		if (res.length != lenWant) {
			throw new Error('Property "' + propName + '" expects ' + lenWant +
				' numbers, but "' + s + '" only has ' + res.length + '.');
		}

		return res;
	}

	/**
	 * Helper to turn a comma-separated list of strings into an array of
	 * strings. Also ensures each is one of the provided options.
	 */
	function parseStrings(s: string, propName: string, options: string[]): string[] {
		let res = new Array<string>();

		for (let raw_chunk of s.split(',')) {
			let chunk = raw_chunk.trim();
			// Man, I really want array and set semantics. Ah well. O(n) check.
			if (options.indexOf(chunk) === -1) {
				throw new Error('Property "' + propName + '" expects one of [' +
					options.join(', ') + '], but "' + chunk + '" was given.');
			}
			res.push(chunk);
		}

		return res;
	}

	/**
	 * TODO: maybe pull into Weapons class.
	 *
	 * @param entity
	 * @param ecs
	 * @param weapon
	 */
	function addWeapon(entity: Engine.Entity, ecs: Engine.ECS, weapon: Weapon.Weapon): void {
		if (!ecs.getComponents(entity).has(Component.Armed)) {
			let armed = new Component.Armed(weapon);
			ecs.addComponent(entity, armed);
		} else {
			let armed = ecs.getComponents(entity).get(Component.Armed);
			armed.inventory.push(weapon);
		}
	}

	/**
	 * TODO: maybe pull into Shields class.
	 * @param entity
	 * @param ecs
	 * @param weapon
	 */
	function addShield(entity: Engine.Entity, ecs: Engine.ECS, shield: Shield.Shield): void {
		if (!ecs.getComponents(entity).has(Component.Shielded)) {
			ecs.addComponent(entity, new Component.Shielded(shield));
		} else {
			let shielded = ecs.getComponents(entity).get(Component.Shielded);
			shielded.inventory.push(shield)
		}
	}

	/**
	 * Helper as temporary hack to add weapons until we get the weapon system
	 * straightened away (might be something super simple that multiplexes into
	 * functions like these).
	 */
	function addBow(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
		// add the bow w/ all timing info for swing and attack info for attack.
		let timing: Weapon.CharacterTiming = {
			idleCooldown: 0,
			minChargeDuration: 300,
			swingDuration: 500,
			swingAttackDelay: 0,
			sheatheDuration: 300,
			quickAttackNextWait: -1,
			quickAttackDuration: -1,
			quickAttackAttackDelay: -1,
			comboDuration: -1,
			comboAttackDelay: -1,
		};
		let swingAtk: Weapon.AttackInfo = {
			cboxDims: new Point(10, 10),
			cboxOffset: new Point(0, 0),
			movement: Weapon.AttackMovement.Launch,
			damage: 10,
			attackType: Weapon.AttackType.Swing,
			cTypes: [CollisionType.Attack, CollisionType.Mobile, CollisionType.Player],
			knockbackForce: 5000,
			staggerForce: 5000,
			lungeForce: 0,
			duration: 10000,
			velocity: 10000.0,
		};

		let weapon: Weapon.Weapon = {
			timing: timing,
			swingAttack: swingAtk,
			partID: PartID.Bow,
		};
		addWeapon(entity, ecs, weapon);

		// add bow animations to the character's entity
		let animatable = ensureAnimatable(entity, ecs, props);

		// attack
		let newAlign: Anim.Align = {
			alignType: Anim.AlignType.TextureOrigin,
			extraOffset: new Point(0, 0),
		};
		animatable.animations.set(
			Anim.getKey(Action.Charging, Part.Weapon, PartID.Bow),
			Anim.getData('sprites/weapons/bowCharge', 4, 75,
				Anim.PlayType.PlayAndHold, new Point(0, 1), newAlign));
		animatable.animations.set(
			Anim.getKey(Action.Swinging, Part.Weapon, PartID.Bow),
			Anim.getData('sprites/weapons/bowSwing', 1, 500,
				Anim.PlayType.PlayAndHold, new Point(0, 1), newAlign));
		animatable.animations.set(
			Anim.getKey(Action.Sheathing, Part.Weapon, PartID.Bow),
			Anim.getData('sprites/weapons/bowSheathe', 2, 75,
				Anim.PlayType.PlayAndHold, new Point(0, 1), newAlign));

		let oldAlign: Anim.Align = {
			alignType: Anim.AlignType.TextureOrigin,
			extraOffset: new Point(24, 8),
		}

		// blocking
		animatable.animations.set(Anim.getKey(Action.BlockRaising, Part.Weapon, PartID.Bow),
			Anim.getData('sprites/weapons/bowRaise', 2, 100,
				Anim.PlayType.PlayAndHold, new Point(0, 1), oldAlign));
		animatable.animations.set(Anim.getKey(Action.BlockHolding, Part.Weapon, PartID.Bow),
			Anim.getData('sprites/weapons/bowHold', 1, 100,
				Anim.PlayType.PlayAndHold, new Point(0, 1), oldAlign));
		animatable.animations.set(Anim.getKey(Action.BlockLowering, Part.Weapon, PartID.Bow),
			Anim.getData('sprites/weapons/bowLower', 1, 100,
				Anim.PlayType.PlayAndHold, new Point(0, 1), oldAlign));

		// std
		animatable.animations.set(Anim.getKey(Action.Moving, Part.Weapon, PartID.Bow),
			Anim.getData('sprites/weapons/bowWalk', 8, 100,
				Anim.PlayType.Loop, new Point(0, 1), oldAlign));
		animatable.animations.set(Anim.getKey(Action.Idle, Part.Weapon, PartID.Bow),
			Anim.getData('sprites/weapons/bowIdle', 1, 100,
				Anim.PlayType.Loop, new Point(0, 1), oldAlign));
	}

	/**
	 * Helper as temporary hack to add weapons until we get the weapon system
	 * straightened away (might be something super simple that multiplexes into
	 * functions like these).
	 */
	function addAxe(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
		// add the sword w/ all timing info for swing and attack info for attack.
		let timing: Weapon.CharacterTiming = {
			idleCooldown: 0,
			minChargeDuration: 400,
			swingDuration: 1300,
			swingAttackDelay: 0,
			sheatheDuration: 150,
			quickAttackNextWait: -1,
			quickAttackDuration: -1,
			quickAttackAttackDelay: -1,
			comboDuration: -1,
			comboAttackDelay: -1,
		};
		let swingAtk: Weapon.AttackInfo = {
			cboxDims: new Point(120, 90),
			cboxOffset: new Point(-40, 0),
			movement: Weapon.AttackMovement.Track,
			damage: 20,
			attackType: Weapon.AttackType.Swing,
			cTypes: [CollisionType.Attack, CollisionType.Mobile, CollisionType.Player],
			knockbackForce: 50000,
			staggerForce: 50000,
			lungeForce: 0,
			duration: 300,
		};
		let weapon: Weapon.Weapon = {
			timing: timing,
			swingAttack: swingAtk,
			partID: PartID.Axe
		};
		addWeapon(entity, ecs, weapon);

		// add axe animations to the character's entity
		let animatable = ensureAnimatable(entity, ecs, props);

		// attack
		let newAlign: Anim.Align = {
			alignType: Anim.AlignType.TextureOrigin,
			extraOffset: new Point(0, 0),
		}
		animatable.animations.set(
			Anim.getKey(Action.Charging, Part.Weapon, PartID.Axe),
			Anim.getData('sprites/weapons/axeCharge', 3, 150,
				Anim.PlayType.PlayAndHold, new Point(0, 1), newAlign));
		animatable.animations.set(
			Anim.getKey(Action.Swinging, Part.Weapon, PartID.Axe),
			Anim.getData('sprites/weapons/axeSwing', 4, 100,
				Anim.PlayType.PlayAndHold, new Point(0, 1), newAlign));
		animatable.animations.set(
			Anim.getKey(Action.Sheathing, Part.Weapon, PartID.Axe),
			Anim.getData('sprites/weapons/axeSheathe', 1, 150,
				Anim.PlayType.PlayAndHold, new Point(0, 1), newAlign));

		let oldAlign: Anim.Align = {
			alignType: Anim.AlignType.TextureOrigin,
			extraOffset: new Point(24, 8)
		}

		// blocking
		animatable.animations.set(Anim.getKey(Action.BlockRaising, Part.Weapon, PartID.Axe),
			Anim.getData('sprites/weapons/axeRaise', 2, 100,
				Anim.PlayType.PlayAndHold, new Point(0, 1), oldAlign));
		animatable.animations.set(Anim.getKey(Action.BlockHolding, Part.Weapon, PartID.Axe),
			Anim.getData('sprites/weapons/axeHold', 1, 100,
				Anim.PlayType.PlayAndHold, new Point(0, 1), oldAlign));
		animatable.animations.set(Anim.getKey(Action.BlockLowering, Part.Weapon, PartID.Axe),
			Anim.getData('sprites/weapons/axeLower', 1, 100,
				Anim.PlayType.PlayAndHold, new Point(0, 1), oldAlign));

		// std
		animatable.animations.set(Anim.getKey(Action.Moving, Part.Weapon, PartID.Axe),
			Anim.getData('sprites/weapons/axeWalk', 8, 100,
				Anim.PlayType.Loop, new Point(0, 1), oldAlign));
		animatable.animations.set(Anim.getKey(Action.Idle, Part.Weapon, PartID.Axe),
			Anim.getData('sprites/weapons/axeIdle', 1, 100,
				Anim.PlayType.Loop, new Point(0, 1), oldAlign));
	}

	/**
	 * Created as core properties on every object by tiled. (There are more, but
	 * only adding here as needed.)
	 *
	 * TODO: consider refactoring w/ ObjectJson.
	 */
	class CoreData {
		x: number
		y: number
		rotation: number
		width: number
		height: number
	}

	/**
	 * Values are copy-able wrappers around data.
	 *
	 * The extendWith() method is new; right now, its implementation is just to
	 * completely replace with the child for everything except Complex<T>
	 * Values that are Array<T>; for those, it merges (copies of) the two
	 * arrays.
	 */
	abstract class Value {

		abstract val(): any

		abstract copy(): Value

		public extendWith(child: Value): Value {
			return child.copy();
		}
	}

	/**
	 * CoreVal is kind of an exception to normal Values; it represents *all* of
	 * the values that are core to objects.
	 */
	class CoreValue extends Value {
		private data: CoreData
		constructor(orig: CoreData) {
			super();
			this.data = this.copyRaw(orig);
		}
		private copyRaw(orig: CoreData): CoreData {
			let res = new CoreData();
			res.x = orig.x;
			res.y = orig.y;
			res.rotation = orig.rotation;
			res.width = orig.width;
			res.height = orig.height;
			return res;
		}
		val(): CoreData {
			return this.copyRaw(this.data);
		}
		copy(): CoreValue {
			return new CoreValue(this.data);
		}
	}

	class Primitive<T> extends Value {
		constructor(private data: T) { super(); }
		val(): T {
			return this.data;
		}
		copy(): Primitive<T> {
			return new Primitive<T>(this.data);
		}
	}

	class PrimitiveArray<T> extends Value {
		private data: Array<T>
		constructor(orig: Array<T>) {
			super();
			this.data = arrayCopy(orig);
		}
		val(): Array<T> {
			return arrayCopy(this.data);
		}
		copy(): PrimitiveArray<T> {
			return new PrimitiveArray<T>(this.data);
		}
	}

	/**
	 * Complex is a Value that can hold arbitrary objects with an absolute gem
	 * of a deep copying solution.
	 *
	 * Warning: the following values won't copy as expected:
	 * - undefined -> (won't exist)
	 * - Infinity  -> null
	 * - NaN	   -> null
	 *
	 * However, we shouldn't have any of those values anyway. Note that null
	 * does copy correctly.
	 */
	class Complex<T> extends Value {
		private data: T
		constructor(orig: T) {
			// defensively copy when made
			super();
			this.data = clone(orig);
		}
		val(): T {
			// defensively copy when returning value
			return clone(this.data);
		}
		copy(): Complex<T> {
			// don't need to defensively copy here because it happens in the
			// constructor.
			return new Complex<T>(this.data);
		}
		/**
		 * The one, shining, beautiful reason this whole dang method got
		 * exposed: if this is an array of some kind, merge the two arrays.
		 */
		extendWith(child: Complex<T>): Complex<T> {
			// NOTE: There's like WAY too much copying going on here. We copy
			// both things here, plus we then copy them below (happens in
			// Complex constructor). Where this is actually used, we need zero
			// copying. However, it's probably a better contract for copying to
			// happen, so meh.
			let p = this.copy();
			let c = child.copy();
			if (!(p.data instanceof Array) || !(c.data instanceof Array)) {
				return c;
			}

			p.data.push(...c.data);
			return new Complex<T>(p.data);
		}
	}

	/**
	 * A property is given to objects in the map editor. Each property has:
	 *
	 *	(a) a name -- this is case-insensitive. It is the 'key' given in the map
	 *		editor
	 *
	 *	(b) a way of interpreting its parameters. This is the function that
	 *		turns the 'value' given in the map editor into something the engine
	 *		expects to work with
	 *
	 *	(c) an effect when applied to an entity. Once the full list of
	 *		Properties is calculated they are all applied to an object.
	 */
	abstract class Property {
		/**
		 * name is needed to build a map using instances, mapping their name to
		 * their instance.
		 */
		public name: string
		abstract otherPropsRequired: string[]
		abstract parseParams(params: any): Value
		abstract apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void

		public init(): void {
			this.name = this.constructor.name;
		}
	}

	/**
	 * CoreProperty is kind of an exception to a normal `Property`s. It
	 * represents all of the properties that are on an object (not a layer) by
	 * default.
	 *
	 * It's given a name and added to the map so that it may be retrieved at
	 * apply() time. It is not parsed like normal properties; it's a special
	 * case and parsed always on every object.
	 *
	 * Note that this has two purposes:
	 *
	 * (1) apply core components that every object should have (like position)
	 *
	 * (2) hold core data that other properties might need (like width/height
	 * for collision boxes)
	 */
	class CoreProperty extends Property {
		otherPropsRequired = []

		parseParams(obj: CoreData): CoreValue {
			return new CoreValue(obj);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let coreData = props.get(CoreProperty.name).val() as CoreData;
			let rawX = coreData.x;
			let rawY = coreData.y;
			let w = coreData.width;
			let h = coreData.height;
			let gameAngle = angleFlip(Constants.DEG2RAD * coreData.rotation);

			// Apply bjorn (collision boxes grown downwards instead of up).
			if (props.has(Bjorn.name)) {
				h = -h;
			}

			// Tiled rotates object CW from bottom-left point. We rotate
			// objects CCW from center. We need to figure out where the object
			// actually is.

			// From tiled position (bottom-left = (rawX, rawY)), rotate vector
			// to center of object (baseAngle) by tiled angle (gameAngle)
			// (result = centerAngle), then travel along it (hyp) to find its
			// rotated center location.
			let baseAngle = Math.atan2(h, w);
			let centerAngle = baseAngle + gameAngle;
			let hyp = Math.sqrt((w * w + h * h) / 4);
			let centerX = rawX + Math.cos(centerAngle) * hyp;
			let centerY = rawY - Math.sin(centerAngle) * hyp;  // "up" = -y

			// Make position component
			ecs.addComponent(entity, new Component.Position(
				new Point(centerX, centerY),
				gameAngle));

			// If respawn marked, also make that component.
			if (props.has(Respawn.name) && (props.get(Respawn.name).val() as boolean)) {
				ecs.addComponent(entity, new Component.Spawnable(new Point(centerX, centerY)));
			}
		}
	}

	class Animations extends Property {
		otherPropsRequired = []

		parseParams(params: Anim.Spec[]): Complex<Anim.Spec[]> {
			return new Complex(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let specs = props.get(Animations.name).val() as Anim.Spec[];
			let animatable = ensureAnimatable(entity, ecs, props);
			for (let spec of specs) {
				let [k, d] = Anim.convertSpec(spec);
				animatable.animations.set(k, d);
			}

			// only add activity and body components if it has anything besides
			// the default animation.
			if (!animatable.defaultOnly) {
				// activity may already have been added by explicit spec.
				if (!ecs.getComponents(entity).has(Component.Activity)) {
					ecs.addComponent(entity, new Component.Activity({}));
				}
				// body
				ecs.addComponent(entity, new Component.Body());
			}
		}
	}

	class AnimationCustomize extends Property {
		otherPropsRequired = []

		parseParams(params: Anim.Customize): Complex<Anim.Customize> {
			return new Complex(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let customize = props.get(AnimationCustomize.name).val() as Anim.Customize;
			let animatable = ensureAnimatable(entity, ecs, props);
			if (customize.tint != null) {
				animatable.globalTint = parseInt(customize.tint.slice(1), 16)
			}
			if (customize.scale != null) {
				animatable.globalScale = customize.scale;
			}
			if (customize.hideOnDeath != null) {
				animatable.hideOnDeath = customize.hideOnDeath;
			}
		}

	}

	class Activity extends Property {
		otherPropsRequired = []

		parseParams(params: Anim.ActivitySpec): Complex<Anim.ActivitySpec> {
			return new Complex<Anim.ActivitySpec>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			// This overwites any default given in the animations.
			let activitySpec = props.get(Activity.name).val() as Anim.ActivitySpec;
			ecs.removeComponentIfExists(entity, Component.Activity);
			ecs.addComponent(entity, new Component.Activity(activitySpec));
		}
	}

	class AISpec extends Property {
		otherPropsRequired = []

		parseParams(params: AI.FactorySpec): Complex<AI.GameSpec> {
			// pull out the behavior and the provided AI parameters (whose type
			// varies based on the behavior chosen)
			let behavior = AI.Behavior[params.behavior] as AI.Behavior;
			return new Complex({
				behavior: behavior,
				params: params.params,
			})
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let aiSpec = props.get(AISpec.name).val() as AI.GameSpec;
			ecs.addComponent(entity, new Component.AIComponent(
				aiSpec.behavior, aiSpec.params));
		}
	}

	class Attributes extends Property {
		options: string[] = []
		otherPropsRequired = []

		constructor(private attributes: Map<string, Attributes.All>) {
			super();
			this.options = mapKeyArr(attributes);
		}

		parseParams(params: string): Primitive<string> {
			// ensure params in options
			if (this.options.indexOf(params) === -1) {
				throw new Error('Property "' + Attributes.name + '" expects one of [' +
					this.options.join(', ') + '], but "' + params + '" was given.');
			}
			return new Primitive<string>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let entityName = props.get(Attributes.name).val() as string;
			ecs.addComponent(
				entity,
				new Component.Attributes(this.attributes.get(entityName)));

		}
	}

	/**
	 * Ensures that `entity` has an Animatable component by creating it if
	 * needed.
	 */
	function ensureAnimatable(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): Component.Animatable {
		let components = ecs.getComponents(entity);

		let animatable: Component.Animatable
		if (components.has(Component.Animatable)) {
			animatable = components.get(Component.Animatable);
		} else {
			// determine the draw layer
			let drawLayer = ZLevelWorld.Object;
			if (props.has(DrawLayer.name)) {
				drawLayer = props.get(DrawLayer.name).val() as ZLevelWorld;
			}

			// create component and add to object
			animatable = new Component.Animatable(drawLayer, StageTarget.World);
			ecs.addComponent(entity, animatable);
		}

		return animatable;
	}

	class Audible extends Property {
		otherPropsRequired = []

		parseParams(params: Sound.Entity): Complex<Sound.Entity> {
			return new Complex<Sound.Entity>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let entitySounds = props.get(Audible.name).val() as Sound.Entity;
			ecs.addComponent(entity, new Component.Audible(entitySounds));
		}
	}

	class Bjorn extends Property {
		otherPropsRequired = []

		parseParams(params: boolean): Primitive<boolean> {
			return new Primitive<boolean>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			// Bjorn only affects other properties.
			// God damnit, Bjorn.
		}
	}

	class Checkpoint extends Property {
		otherPropsRequired = []

		parseParams(params: boolean): Primitive<boolean> {
			return new Primitive<boolean>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			if (!(props.get(Checkpoint.name).val() as boolean)) {
				// console.warn('Warning: Useless k/v "' + this.name + '" found but disabled.');
				return;
			}
			let gateID = null;
			if (props.has(GateID.name)) {
				gateID = props.get(GateID.name).val() as string;
			}
			ecs.addComponent(entity, new Component.Checkpoint(gateID));
		}
	}

	class CollisionGenerate extends Property {
		otherPropsRequired = [CollisionTypes.name]

		parseParams(params: boolean): Primitive<boolean> {
			return new Primitive<boolean>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			// First, see whether this is turned on at all.
			if (!(props.get(CollisionGenerate.name).val() as boolean)) {
				// console.warn('Warning: Useless k/v "' + this.name + '" found but disabled.');
				return;
			}

			// Get the size and collision info for the object.
			let coreData = props.get(CoreProperty.name).val() as CoreData;
			let cTypes = props.get(CollisionTypes.name).val() as CollisionType[];

			// Build the collision box.
			ecs.addComponent(entity, Component.CollisionShape.buildRectangle(
				new Point(coreData.width, coreData.height),
				new Set<CollisionType>(cTypes),
			));
		}
	}

	class CollisionManual extends Property {
		otherPropsRequired = [CollisionTypes.name]

		parseParams(params: string): PrimitiveArray<number> {
			return new PrimitiveArray<number>(parseNums(params, this.name, 4));
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let data: number[] = props.get(CollisionManual.name).val() as number[];
			let cTypes = props.get(CollisionTypes.name).val() as CollisionType[];

			ecs.addComponent(entity, Component.CollisionShape.buildRectangle(
				new Point(data[2], data[3]),
				new Set<CollisionType>(cTypes),
				new Point(data[0], -data[1])));
		}
	}

	class CollisionTypes extends Property {
		otherPropsRequired = []

		parseParams(params: string[]): PrimitiveArray<CollisionType> {
			let res: CollisionType[] = [];
			for (let param of params) {
				let cType = CollisionType[param] as CollisionType;
				if (cType == null) {
					throw new Error('Property ' + this.name + '" expects a valid ' +
						'CollisionType, one of: [' + enumSortedNames(ZLevelWorld).join(', ') +
						'] but ' + param + '" was given as one type.');
				}
				res.push(cType);
			}
			return new PrimitiveArray<CollisionType>(res);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			// Nothing happens here; application is done in one of the collision
			// creation classes (CollisionGenerate, CollisionManual).
		}
	}

	class Comboable extends Property {
		otherPropsRequired = []

		parseParams(params: Weapon.ComboInfo): Complex<Weapon.ComboInfo> {
			return new Complex<Weapon.ComboInfo>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let comboInfo = props.get(Comboable.name).val() as Weapon.ComboInfo;
			ecs.addComponent(entity, new Component.Comboable(
				comboInfo.hits, comboInfo.consecutiveWindow, comboInfo.activeWindow,
			));
		}
	}

	class Destructible extends Property {
		otherPropsRequired = []

		parseParams(params: boolean): Primitive<boolean> {
			return new Primitive<boolean>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			if (!(props.get(Destructible.name).val() as boolean)) {
				// console.warn('Warning: Useless k/v "' + this.name + '" found but disabled.');
				return;
			}
			ecs.addComponent(entity, new Component.Destructible());
		}
	}

	class DrawLayer extends Property {
		otherPropsRequired = []

		parseParams(params: string): Primitive<ZLevelWorld> {
			let z = ZLevelWorld[params] as ZLevelWorld;
			if (z == null) {
				// Bad value! Build up options for nice error reporting...
				throw new Error('Property "' + this.name + '" expects a valid ' +
					'ZLevelWorld, one of: [' + enumSortedNames(ZLevelWorld).join(', ') +
					'] but "' + params + '" was given.');
			}

			// return the value
			return new Primitive<ZLevelWorld>(z);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			// Nothing happens here; application is done in one of the animation
			// or static image component creations.
		}
	}

	class Enemy extends Property {
		otherPropsRequired = []

		parseParams(params: GJ7.Enemy): Complex<GJ7.Enemy> {
			return new Complex<GJ7.Enemy>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let data = props.get(Enemy.name).val() as GJ7.Enemy;
			let enemy = new Component.Enemy(data)
			ecs.addComponent(entity, enemy);

			// enemy lighting set to default value if Lightbulbs prop not
			// provided.
			if (!props.has(Lightbulbs.name)) {
				ecs.addComponent(entity, new Component.Lightbulb([{}]));
			}
		}
	}

	class Gate extends Property {
		otherPropsRequired = []

		parseParams(params: Logic.Gate): Complex<Logic.Gate> {
			return new Complex<Logic.Gate>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let gate = props.get(Gate.name).val() as Logic.Gate;
			if (props.has(GateID.name)) {
				gate.id = props.get(GateID.name).val() as string;
			}
			let start = gate.start || false;
			let exit = gate.exit || false;
			if (gate.id != null && (start || exit)) {
				throw new Error('Start and exit gates cannot have GateIDs.');
			}
			if (start && exit) {
				throw new Error('Gate cannot be both start and exit.')
			}
			if (start) {
				gate.id = 'START';
			}
			if (exit) {
				gate.id = 'EXIT';
			}
			ecs.addComponent(entity, new Component.Gate(
				start, exit, gate.id));
		}
	}

	class GateID extends Property {
		otherPropsRequired = []

		parseParams(params: string): Primitive<string> {
			return new Primitive<string>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			// Application is done in Gate, Zone, Item, or Checkpoint
		}
	}

	class Health extends Property {
		otherPropsRequired = []

		parseParams(params: string): Primitive<number> {
			return new Primitive<number>(parseInt(params));
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let health = props.get(Health.name).val() as number;
			ecs.addComponent(entity, new Component.Health(health));
		}
	}

	class Img extends Property {
		otherPropsRequired = []

		parseParams(params: string): Primitive<string> {
			return new Primitive<string>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let path = props.get(Img.name).val() as string;

			let drawLayer = ZLevelWorld.Object;
			if (props.has(DrawLayer.name)) {
				drawLayer = props.get(DrawLayer.name).val() as ZLevelWorld;
			}

			ecs.addComponent(entity, new Component.StaticRenderable(path, drawLayer, StageTarget.World));
		}
	}

	class Item extends Property {
		otherPropsRequired = []

		parseParams(params: GJ7.ItemSpec): Complex<GJ7.ItemData> {
			// validity check
			let item = Ontology.Item[params.classification] as Ontology.Item;
			if (item == null) {
				// Bad value! Build up options for nice error reporting...
				throw new Error('Property "' + this.name + '" expects a valid ' +
					'Ontology.Item, one of: [' + enumSortedNames(Ontology.Item).join(', ') +
					'] but "' + params.classification + '" was given.');
			}
			return new Complex<GJ7.ItemData>({
				classificiation: item,
				instructionID: params.instructionID,
			});
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let behavior = props.get(Item.name).val() as GJ7.ItemData;

			if (props.has(GateID.name)) {
				behavior.gateID = props.get(GateID.name).val() as string;
			}

			ecs.addComponent(entity, new Component.Item(behavior));

			// bob! (but not for hearts)
			if (behavior.classificiation != Ontology.Item.Health) {
				let t = new Component.Tweenable();
				t.tweenQueue.push({
					prop: 'y',
					spec: {
						val: 20,
						valType: 'rel',
						duration: -1,
						period: 0.002,
						method: 'sine',
					},
				});
				ecs.addComponent(entity, t);
			}

			// sparkle
			ecs.addComponent(entity, new Component.Sparkle());
		}
	}

	class Knockbackable extends Property {
		otherPropsRequired = []

		parseParams(params: boolean): Primitive<boolean> {
			return new Primitive<boolean>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			if (!(props.get(Knockbackable.name).val() as boolean)) {
				// console.warn('Warning: Useless k/v "' + this.name + '" found but disabled.');
				return;
			}
			ecs.addComponent(entity, new Component.Knockbackable());
		}
	}

	class Lightbulbs extends Property {
		otherPropsRequired = []

		parseParams(params: Graphics.LightbulbSpec[]): Complex<Graphics.LightbulbSpec[]> {
			return new Complex<Graphics.LightbulbSpec[]>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let specs = props.get(Lightbulbs.name).val() as Graphics.LightbulbSpec[];
			ecs.addComponent(entity, new Component.Lightbulb(specs));
		}
	}

	class Move extends Property {
		otherPropsRequired = []

		parseParams(params: Physics.Movement): Complex<Physics.Movement> {
			return new Complex<Physics.Movement>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let movement = props.get(Move.name).val() as Physics.Movement;
			ecs.addComponent(entity, new Component.Input(movement));
		}
	}

	/**
	 * Prop used in blueprint.json infrastructure (no effect here).
	 */
	class ParentLayer extends Property {
		otherPropsRequired = []

		parseParams(params: string): Primitive<string> {
			return new Primitive<string>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			// nothing to do --- this logic is for the blueprint.json
		}
	}

	class PhysicsRegion extends Property {
		otherPropsRequired = []

		parseParams(params: Physics.Region): Complex<Physics.Region> {
			return new Complex<Physics.Region>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let region = props.get(PhysicsRegion.name).val() as Physics.Region;
			ecs.addComponent(entity, new Component.PhysicsRegion(region));
		}
	}

	class Player extends Property {
		otherPropsRequired = []

		parseParams(params: boolean): Primitive<boolean> {
			return new Primitive<boolean>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			if (!(props.get(Player.name).val() as boolean)) {
				// console.warn('Warning: Useless k/v "' + this.name + '" found but disabled.');
				return;
			}

			ecs.addComponent(entity, new Component.PlayerInput());
			ecs.addComponent(entity, new Component.CameraFollowable());
			// ecs.addComponent(entity, new Component.DebugInspection(ecs.walltime));
			// addBow(entity, ecs, props);
			// addAxe(entity, ecs, props);

			// player lighting hardcoded
			ecs.addComponent(entity, new Component.Lightbulb([{
				size: 'Large',
			}]))
		}
	}

	class PersistentDamage extends Property {
		otherPropsRequired = []

		parseParams(params: Weapon.AttackInfoSpec): Complex<Weapon.AttackInfoSpec> {
			return new Complex<Weapon.AttackInfoSpec>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let data = props.get(PersistentDamage.name).val() as Weapon.AttackInfoSpec;
			let pd = new Component.PersistentDamage(
				Conversion.jsonToAttackInfo(data, Weapon.AttackType.Quick));
			ecs.addComponent(entity, pd);
		}
	}

	class Respawn extends Property {
		otherPropsRequired = []

		parseParams(params: boolean): Primitive<boolean> {
			return new Primitive<boolean>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			// Respawn is applied in the initial setup (CoreProperty) if it is
			// found.
		}
	}

	class Shields extends Property {
		options = []
		otherPropsRequired = []

		constructor(private shields: Map<string, Shield.FullShieldData>) {
			super();
			this.options = mapKeyArr(shields);
		}

		parseParams(params: string): PrimitiveArray<string> {
			return new PrimitiveArray<string>(parseStrings(params, this.name, this.options));
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let animatable = ensureAnimatable(entity, ecs, props);
			let shieldNames = props.get(Shields.name).val() as string[];
			for (let shieldName of shieldNames) {
				let sd = this.shields.get(shieldName);
				// data
				addShield(entity, ecs, sd.shield);

				// animations
				for (let [animKey, animData] of sd.animations.entries()) {
					animatable.animations.set(animKey, animData);
				}
			}
		}
	}

	class Staggerable extends Property {
		otherPropsRequired = []

		parseParams(params: boolean): Primitive<boolean> {
			return new Primitive<boolean>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			if (!(props.get(Staggerable.name).val() as boolean)) {
				// console.warn('Warning: Useless k/v "' + this.name + '" found but disabled.');
				return;
			}
			ecs.addComponent(entity, new Component.Staggerable());
		}
	}

	class Weapons extends Property {
		options: string[] = []
		otherPropsRequired = []

		constructor(private weapons: Map<string, Weapon.FullWeaponData>) {
			super();
			this.options = mapKeyArr(weapons);
		}

		parseParams(params: string): PrimitiveArray<string> {
			return new PrimitiveArray<string>(parseStrings(params, this.name, this.options));
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let animatable = ensureAnimatable(entity, ecs, props);
			let weaponNames = props.get(Weapons.name).val() as string[];
			for (let weaponName of weaponNames) {
				let wd = this.weapons.get(weaponName);
				// data
				addWeapon(entity, ecs, wd.weapon);

				// animations
				for (let [animKey, animData] of wd.animations.entries()) {
					animatable.animations.set(animKey, animData);
				}
			}
		}
	}

	class Zone extends Property {
		otherPropsRequired = [CollisionTypes.name]

		parseParams(params: Logic.ZoneSpec): Complex<Logic.ZoneSpec> {
			return new Complex<Logic.ZoneSpec>(params);
		}

		apply(entity: Engine.Entity, ecs: Engine.ECS, props: ValMap): void {
			let zoneSpec = props.get(Zone.name).val() as Logic.ZoneSpec;
			if (props.has(GateID.name)) {
				zoneSpec.gateID = props.get(GateID.name).val() as string;
			}
			ecs.addComponent(entity, new Component.Zone(zoneSpec));
		}
	}

	/**
	 * Map of string->T class for case-insensitive string keys.
	 */
	class LowerKeyMap<T> {
		protected map = new Map<string, T>()

		public has(key: string): boolean {
			return this.map.has(key.toLowerCase());
		}

		public get(key: string): T {
			return this.map.get(key.toLowerCase());
		}

		public set(key: string, val: T): void {
			this.map.set(key.toLowerCase(), val);
		}
	}

	/**
	 * For storing the set of all existing properties (indexed by case-
	 * insensitive name).
	 */
	class PropertyMap extends LowerKeyMap<Property> {
		public build(list: Property[]): PropertyMap {
			for (let prop of list) {
				prop.init();
				this.set(prop.name, prop);
			}
			return this;
		}
	}

	/**
	 * For storing parsed property values (prop name -> prop val). The
	 * properties themselves (with their parseParams(...) and apply(...)
	 * functions) are stored in a PropertyMap.
	 */
	class ValMap extends LowerKeyMap<Value> {
		copy(): ValMap {
			let res = new ValMap();
			for (let [k, v] of this.map.entries()) {
				res.set(k, v.copy());
			}
			return res;
		}

		/**
		 * Parses a property map json, using the full set of validProps. Mutates
		 * this (replacing overlapping ones with any newfound properties).
		 * @returns this
		 */
		parse(validProps: PropertyMap, json: any): ValMap {
			for (let key in json) {
				if (validProps.has(key)) {
					// The property is valid.
					this.set(key, validProps.get(key).parseParams(json[key]));
				} else {
					// Blue screen of death (currently as exception).
					throw new Error('Error: Unimplemented key: "' + key + '"');
				}
			}
			return this;
		}

		/**
		 * Returns `this`.
		 */
		extendWith(child: ValMap): ValMap {
			for (let key of child.keys()) {
				if (!this.has(key)) {
					// if prop didn't exist, just use child's
					this.set(key, child.get(key));
				} else {
					// if prop did exist, use the Value extendWith() method.
					// This is almost always just an override (for simplicity);
					// the exception is for arrays, where the arrays are
					// merged.
					this.set(key, this.get(key).extendWith(child.get(key)));
				}
			}
			return this;
		}

		/**
		 * Ensures that all 'otherPropsRequired' constraints are met. layerName
		 * is just for debugging. Throws exception if not.
		 */
		check(validProps: PropertyMap, layerName: string): void {
			for (let propName of this.map.keys()) {
				let prop = validProps.get(propName);
				for (let other of prop.otherPropsRequired) {
					if (!this.has(other)) {
						throw new Error('Property "' + propName + '" also requires ' +
							'property "' + other + '" but the second one was ' +
							'not found. This happened in the layer "' + layerName + '".');
					}
				}
			}
		}

		keys(): IterableIterator<string> {
			return this.map.keys();
		}
	}

	/**
	 * TODO: consider refactoring w/ CoreData.
	 */
	export type ObjectJson = {
		x: number,
		y: number,
		rotation: number,
		width: number,
		height: number,
		properties?: any,
	}

	/**
	 * http://docs.mapeditor.org/en/stable/reference/json-map-format/
	 */
	type TiledMap = {
		height: number
		infinite: boolean
		layers: any[]
		nextobjectid: number
		orientation: string
		renderorder: string
		tiledversion: string
		tileheight: number
		tilesets: Tileset[]
		tilewidth: number
		type: string
		version: number
		width: number
	}

	type TileLayer = {
		data: number[],
		height: number,
		name: string
		opacity: number
		type: "tilelayer"
		visible: boolean
		width: number
		x: 0
		y: 0
	}

	type Tileset = {
		columns: number
		firstgid: number
		image?: string  // terrain
		imageheight?: number
		imagewidth?: number
		margin: number
		name: string
		spacing: number
		terrains?: Terrain[]  // terrain
		tilecount: number
		tileheight: number
		tilewidth: number
		transparentcolor?: string
		tiles: {
			// note that this id is a number-as-a-string;
			// should be added to "firstgid" above to get its gid
			[id: string]: {
				// for terrain
				terrain?: number[]

				// for other
				image?: string
				imageheight: number
				imagewidth: number
			}
		}
	}

	type Terrain = {
		name: string
		tile: -1  // bizarre, but seems to always be -1
	}

	// inventory of helpful vertices
	const V_Full = {
		vertices: [new Point(-32, -32), new Point(32, -32), new Point(32, 32), new Point(-32, 32)],
		shape: Physics.Shape.Rectangle,
	}
	const V_TriangleBulgeBR = {
		vertices: [new Point(-32, 32), new Point(32, 32), new Point(32, -32), new Point(-12, -12)],
		shape: Physics.Shape.Polygon,
	}
	const V_TriangleBR = {
		vertices: [new Point(-32, 32), new Point(32, 32), new Point(32, -32)],
		shape: Physics.Shape.Polygon,
	}

	// inventory of helpful collsion types
	const C_Bramble = new Set<CollisionType>([
		CollisionType.Solid, CollisionType.Attack, CollisionType.Environment,
	])
	const C_Wall = new Set<CollisionType>([
		CollisionType.Solid, CollisionType.Wall,
	])

	type TerrainShape = {
		vertices: Point[]
		shape: Physics.Shape
	}

	type TerrainCollisionData = {
		shape: TerrainShape
		cTypes: Set<CollisionType>
	}

	type TerrainTileDescriptor = {
		coll: TerrainCollisionData
		angle: number
		objLayerOverride?: string,
	}

	const TerrainMapping = new Map<string, TerrainTileDescriptor>([
		// bramble
		['bramble,bramble,none,none', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0 }],
		['bramble,none,bramble,none', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0 }],
		['none,none,bramble,bramble', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0 }],
		['none,bramble,none,bramble', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0 }],
		['none,none,none,bramble', { coll: { shape: V_TriangleBulgeBR, cTypes: C_Bramble }, angle: 0 }],
		['none,bramble,none,none', { coll: { shape: V_TriangleBulgeBR, cTypes: C_Bramble }, angle: -90 }],
		['bramble,none,none,none', { coll: { shape: V_TriangleBulgeBR, cTypes: C_Bramble }, angle: 180 }],
		['none,none,bramble,none', { coll: { shape: V_TriangleBulgeBR, cTypes: C_Bramble }, angle: 90 }],
		// OOB
		['bramble,bramble,bramble,bramble', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],
		['none,bramble,bramble,bramble', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],
		['bramble,none,bramble,bramble', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],
		['bramble,bramble,none,bramble', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],
		['bramble,bramble,bramble,none', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],

		// forest walls
		['none,forestWalls,none,forestWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		['forestWalls,none,forestWalls,none', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		['none,none,forestWalls,forestWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		['forestWalls,forestWalls,none,none', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		['none,none,none,forestWalls', { coll: { shape: V_TriangleBR, cTypes: C_Wall }, angle: 0 }],
		['none,forestWalls,none,none', { coll: { shape: V_TriangleBR, cTypes: C_Wall }, angle: -90 }],
		['forestWalls,none,none,none', { coll: { shape: V_TriangleBR, cTypes: C_Wall }, angle: 180 }],
		['none,none,forestWalls,none', { coll: { shape: V_TriangleBR, cTypes: C_Wall }, angle: 90 }],
		['none,forestWalls,forestWalls,forestWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		['forestWalls,none,forestWalls,forestWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		['forestWalls,forestWalls,none,forestWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		['forestWalls,forestWalls,forestWalls,none', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		// OOB
		['forestWalls,forestWalls,forestWalls,forestWalls', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],

		// castle walls
		['none,castleWalls,none,castleWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		['castleWalls,none,castleWalls,none', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		['none,none,castleWalls,castleWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		['castleWalls,castleWalls,none,none', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		['none,none,none,castleWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		['none,castleWalls,none,none', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		['castleWalls,none,none,none', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		['none,none,castleWalls,none', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		['none,castleWalls,castleWalls,castleWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		['castleWalls,none,castleWalls,castleWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		['castleWalls,castleWalls,none,castleWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		['castleWalls,castleWalls,castleWalls,none', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
		// OOB
		['castleWalls,castleWalls,castleWalls,castleWalls', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],

	])

	/**
	 * Parses roundabout map info on GIDs, tilesets, and terrains stored in
	 * json file exported from Tiled. After constrcution supports lookup from
	 * global ID (found in json data arrays) to more useful things.
	 */
	class TileDataStructure {

		private gid2tilesetName = new Map<number, string>()
		private gid2localIDs = new Map<number, number[]>()

		/**
		 * Map from tileset.name -> {local ID -> terrain.name}
		 */
		private tilesetLocalIDs = new Map<string, Map<number, string>>()

		constructor(tilesets: Tileset[]) {
			if (tilesets == null) {
				console.warn('No tilesets provided in map.')
				return;
			}
			for (let tileset of tilesets) {
				// seems like non-terrain tilesets won't have... well...
				// terrains.
				if (tileset.terrains == null) {
					continue;
				}

				// build up local ID map w/ terrains
				let localIDs = new Map<number, string>();
				for (let i = 0; i < tileset.terrains.length; i++) {
					let terrain = tileset.terrains[i];
					localIDs.set(i, terrain.name);
				}

				this.tilesetLocalIDs.set(tileset.name, localIDs);

				// build up global ID map w/ tiles
				for (let tileIDstr in tileset.tiles) {
					let gid = tileset.firstgid + parseInt(tileIDstr);
					this.gid2tilesetName.set(gid, tileset.name);
					this.gid2localIDs.set(gid, tileset.tiles[tileIDstr].terrain);
				}
			}
		}

		public descriptor(gid: number): [string, TerrainTileDescriptor] {
			let terrainNames = this.terrainNames(gid);

			// tmp: log for fun
			// console.log(terrainNames);

			if (terrainNames == null || (!TerrainMapping.has(terrainNames))) {
				return [terrainNames, null];
			}
			return [terrainNames, TerrainMapping.get(terrainNames)];
		}

		private terrainNames(gid: number): string {
			if (!this.gid2localIDs.has(gid)) {
				return null;
			}
			let localIDs = this.gid2localIDs.get(gid);

			if (!this.gid2tilesetName.has(gid)) {
				return null;
			}
			let tilesetName = this.gid2tilesetName.get(gid);

			if (!this.tilesetLocalIDs.has(tilesetName)) {
				return null;
			}
			let lid = this.tilesetLocalIDs.get(tilesetName);

			return [
				lid.has(localIDs[0]) ? lid.get(localIDs[0]) : 'none',
				lid.has(localIDs[1]) ? lid.get(localIDs[1]) : 'none',
				lid.has(localIDs[2]) ? lid.get(localIDs[2]) : 'none',
				lid.has(localIDs[3]) ? lid.get(localIDs[3]) : 'none',
			].join(',');
		}
	}

	export class GameMap {

		/**
		 * Create new objects, just like that! Map from layer name to props.
		 */
		private factory: Map<string, ValMap>

		/**
		 * Scene-specific factory overrides.
		 */
		private blueprint = new Map<string, ValMap>()

		/**
		 * All properties, with name -> property. Built in constructor.
		 */
		private propertyMap: PropertyMap

		constructor(
			private ecs: Engine.ECS,
			weapons: Map<string, Weapon.FullWeaponData>,
			shields: Map<string, Shield.FullShieldData>,
			attributes: Map<string, Attributes.All>,
		) {
			/**
			 * All properties.
			 */
			let propertyList = [
				new CoreProperty(),

				new Activity(),
				new AISpec(),
				new Animations(),
				new AnimationCustomize(),
				new Audible(),
				new Attributes(attributes),
				new Bjorn(),
				new Checkpoint(),
				new CollisionGenerate(),
				new CollisionManual(),
				new CollisionTypes(),
				new Comboable(),
				new Destructible(),
				new DrawLayer(),
				new Enemy(),
				new Gate(),
				new GateID(),
				new Health(),
				new Img(),
				new Item(),
				new Knockbackable(),
				new Lightbulbs(),
				new Move(),
				new ParentLayer(),
				new PhysicsRegion(),
				new PersistentDamage(),
				new Player(),
				new Respawn(),
				new Shields(shields),
				new Staggerable(),
				new Weapons(weapons),
				new Zone(),
			];

			/**
			 * All properties, with name -> property.
			 */
			this.propertyMap = (new PropertyMap()).build(propertyList)
		}

		/**
		 * NEW: LAYER DEFINITIONS (v2.0)
		 *
		 * Builds up factory from a json file of layer -> {k: v} dicts.
		 * @param json "layerName": { k: v, k: v, ... }
		 */
		public parseFactory(json: any): void {
			this.factory = Conversion.inheritanceBuild(
				json,
				'parentLayer',
				(layerJson: any) => { return (new ValMap()).parse(this.propertyMap, layerJson); },
				(parent: ValMap, child: ValMap) => {
					return parent.copy().extendWith(child);
				},
			)
		}

		public setBlueprint(json: any): void {
			// clear anything that exists
			this.blueprint.clear();

			// copy in current factory layers
			for (let [layerName, valMap] of this.factory.entries()) {
				this.blueprint.set(layerName, valMap.copy());
			}

			// may have no blueprint.json. that's OK! just use the factory.
			if (json == null) {
				return
			}

			// blueprint.json rules:
			// - each layer must have a unique name (not in factory.json)
			// - each layer must have a parentLayer property that refers to
			//	 something in factory.json
			for (let layerName in json) {
				// sanity checks
				if (this.factory.has(layerName)) {
					throw new Error('blueprint.json had same layer "' + layerName + '" as layer in factory.json');
				}
				let layer = json[layerName];
				if (!layer.hasOwnProperty('parentLayer')) {
					throw new Error('blueprint.json layer "' + layerName + '" did not have required "parentLayer" layer property');
				}
				let parentLayerName = layer.parentLayer;
				if (!this.factory.has(parentLayerName)) {
					throw new Error('blueprint.json parentLayer "' + parentLayerName + '" does not exist in factory.json');
				}

				// make copy of parent layer from factory, extend & override
				let overrideLayer = this.factory.get(parentLayerName).copy();
				overrideLayer.parse(this.propertyMap, layer);
				this.blueprint.set(layerName, overrideLayer);
			}
		}

		/**
		 * NEW: OBJECT DEFINITIONS (v2.0)
		 *
		 * @param json
		 */
		public parseBareMap(json: TiledMap): void {
			let tds = new TileDataStructure(json.tilesets);
			for (let layer of json.layers) {
				// for layers that have known objects, produce them.
				if (layer.type === 'objectgroup' && layer.hasOwnProperty('objects') && this.blueprint.has(layer.name)) {
					for (let object of layer.objects) {
						this.parseObject(object, this.blueprint.get(layer.name), layer.name);
					}
				}
				// parse tile layers and construct collision boxes.
				if (layer.type === 'tilelayer') {
					this.parseTiles(tds, layer, json.tilewidth, json.tileheight);
				}
			}

			// build collision boxes around map.
			this.buildBorder(json.height * json.tileheight, json.width * json.tilewidth);
		}

		/**
		 * Builds border around map so player doesn't walk out.
		 */
		private buildBorder(height: number, width: number, thickness: number = 64): void {
			const cTypes = new Set([CollisionType.Solid, CollisionType.Wall]);
			// [dims(w, h), p(x, y)] of [left, top, right, bottom]
			const worklist = [
				[new Point(thickness, height), new Point(-thickness / 2, height / 2)],
				[new Point(width, thickness), new Point(width / 2, -thickness / 2)],
				[new Point(thickness, height), new Point(width + thickness / 2, height / 2)],
				[new Point(width, thickness), new Point(width / 2, height + thickness / 2)],
			];
			for (let [dims, p] of worklist) {
				let e = this.ecs.addEntity();
				this.ecs.addComponent(e, Component.CollisionShape.buildRectangle(dims, cTypes));
				this.ecs.addComponent(e, new Component.Position(p));
			}
		}

		/**
		 * Parses tiles from `layer` in order to build collision objects in
		 * bulk.
		 */
		private parseTiles(tds: TileDataStructure, layer: TileLayer, tilewidth: number, tileheight: number): void {
			// pick out objects to use
			let objectLayer: string = null;
			let objectMap = new Map<string, string>([
				['bramble', 'brambleTile'],
				['forestWalls', 'wallTile'],
			]);
			if (objectMap.has(layer.name)) {
				objectLayer = objectMap.get(layer.name);
			} else {
				return;
			}

			// populate
			for (let i = 0; i < layer.data.length; i++) {
				let gid = layer.data[i];

				// ignore empty spots.
				if (gid === 0) {
					continue;
				}

				// lookup if we know how + want to make this one, and produce
				// it if so.
				let [terrains, desctiptor] = tds.descriptor(gid);
				if (desctiptor == null) {
					continue;
				}

				// maybe override layer if the terrain tile descriptor says to
				let curObjectLayer = objectLayer;
				if (desctiptor.objLayerOverride != null) {
					curObjectLayer = desctiptor.objLayerOverride;
				}

				let objJson: ObjectJson = {
					height: 0.01,
					width: 0.01,
					rotation: desctiptor.angle,
					x: (i % layer.width) * tilewidth + tilewidth / 2,
					y: Math.floor(i / layer.width) * tileheight + tileheight / 2,
				}
				let e = this.produce(curObjectLayer, objJson);
				// this.ecs.addComponent(e, new Component.DebugTileInfo(terrains));
				this.ecs.addComponent(e, new Component.CollisionShape(
					desctiptor.coll.shape.vertices,
					desctiptor.coll.cTypes,
					desctiptor.coll.shape.shape,
				));
			}
		}

		/**
		 * Ask the factory to produce a unit.
		 *
		 * @param layerName
		 * @param json Note that the width and height can be dummy values (like
		 *	   0) and this is still OK (I think) (if you're curious why, read
		 *	   the code and update this comment).
		 */
		public produce(layerName: string, json: ObjectJson): Engine.Entity {
			// sanity check
			if (!this.blueprint.has(layerName)) {
				throw new Error('Attempted to create object "' + layerName +
					'" which was not in factory/blueprint.');
			}

			return this.parseObject(json, this.blueprint.get(layerName), layerName);
		}

		private parseObject(json: ObjectJson, layerProps: ValMap, layerName: string): Engine.Entity {
			// This is the ground-truth set of all properties we can deal with.
			let validProps = this.propertyMap;

			// copy over properties from the layer
			let objProps = layerProps.copy();

			// parse core props for object
			objProps.set(
				CoreProperty.name,
				validProps.get(CoreProperty.name).parseParams(json));

			// use object-specific properties as overrides and additions
			if (json.hasOwnProperty('properties')) {
				objProps.parse(validProps, json.properties);
			}

			// check if list of props are valid
			objProps.check(validProps, layerName);

			// make the object!

			// create entity
			let entity = this.ecs.addEntity();

			// apply custom properties to object. all properties may be applied
			// in any order.
			for (let propName of objProps.keys()) {
				validProps.get(propName).apply(entity, this.ecs, objProps);
			}

			// add in a final debug layer to know where it came from.
			this.ecs.addComponent(entity, new Component.DebugKVLayer(layerName));

			// pass the entity back for callers that want it
			return entity;
		}
	}
}
