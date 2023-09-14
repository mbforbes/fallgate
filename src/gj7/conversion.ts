/// <reference path="../component/body.ts" />
/// <reference path="../graphics/stage.ts" />
/// <reference path="shield.ts" />
/// <reference path="sound.ts" />
/// <reference path="weapon.ts" />

namespace Conversion {

	export function jsonToScenes(data: any): Map<string, Scene.Scene> {
		let res = new Map<string, Scene.Scene>();
		for (let name in data) {
			res.set(name, data[name]);
		}
		return res;
	}

	export function jsonToSeasons(data: any): Map<string, Scene.Season> {
		let res = new Map<string, Scene.Season>();
		for (let name in data) {
			res.set(name, data[name]);
		}
		return res;
	}

	export function jsonToSounds(data: any): Sound.Collection {
		let res = new Map<Sound.TrackID, Sound.Track>();
		for (let trackID in data) {
			let rawTrack: Sound.ExternalTrack = data[trackID];
			let track: Sound.Track = {
				path: rawTrack.path,
				volume: rawTrack.volume || 1.0,
				music: rawTrack.music || false,
				duration: rawTrack.duration || -1,
			}
			res.set(trackID, track);
		}
		return res;
	}

	export function jsonToFXConfigs(data: any): Map<string, FX.Config> {
		let res = new Map<string, FX.Config>();
		for (let fxName in data) {
			res.set(fxName, data[fxName] as FX.Config);
		}
		return res;
	}

	function jsonToAttribute(data: any): Attributes.All {
		let ret: Attributes.All = {
			'hitSettings': data['hitSettings'],
			'hitFX': data['hitFX'],
			'hitBlood': data['hitBlood'],
			'deathFX': data['deathFX'],
			'deathBlood': data['deathBlood'],
		};
		if (data['hitSettings']) {
			ret.hitSettings.hitBehavior = Attributes.HitBehavior[data['hitSettings']['hitBehavior'] as string];
		}
		return ret;
	}

	export function jsonToAttributes(data: any): Map<string, Attributes.All> {
		let res = new Map<string, Attributes.All>();
		for (let entityName in data) {
			res.set(entityName, jsonToAttribute(data[entityName]));
		}
		return res;
	}

	/**
	 * Generic function to handle json conversion w/ inheritance.
	 * @param data
	 */
	export function inheritanceBuild<T>(
		data: any,
		parentProp: string,
		jsonToObject: (json: any) => T,
		extendObject: (parent: T, child: T) => T,
	): Map<string, T> {
		let res = new Map<string, T>();
		let children = new Map<string, any>();

		// build up objects w/o children
		for (let objectName in data) {
			let jsonObject = data[objectName];
			if (jsonObject[parentProp] == null) {
				res.set(objectName, jsonToObject(jsonObject));
			} else {
				children.set(objectName, jsonObject);
			}
		}

		// build children. note because inheritance could have depth and we
		// have random iteration order, we re-iterate. this could have O(n^2)
		// runtime but n is so small it doesn't matter.
		let prevNChildren = children.size;
		let toRemove: string[] = [];
		while (children.size > 0) {
			// drain all possible
			for (let [objectName, jsonObject] of children.entries()) {
				if (res.has(jsonObject[parentProp])) {
					let parentObject = res.get(jsonObject[parentProp]);
					let childObject = jsonToObject(jsonObject);
					res.set(objectName, extendObject(parentObject, childObject));
					toRemove.push(objectName);
				}
			}
			while (toRemove.length > 0) {
				children.delete(toRemove.pop());
			}

			// sanity check for orphans
			if (children.size == prevNChildren) {
				throw new Error('Missing chain from child to parent. ' +
					'Remaining children: ' + mapKeyString(children));
			}
			prevNChildren = children.size;
		}

		return res;
	}

	/**
	 * Turn JSON weapon config file to game-usable data.
	 * @param data
	 */
	export function jsonToWeapons(data: any): Map<string, Weapon.FullWeaponData> {
		return inheritanceBuild(data, 'parent', jsonToWeapon, Weapon.extendWeapon);
	}


	/**
	 * Helper function to take a list animations and turn into the in-game data
	 * type.
	 * @param data
	 * @param part
	 * @param partID
	 */
	function jsonToAnimDict(data: any, part: Part, partID: PartID): Map<Anim.Key, Anim.Data> {
		let res = new Map<Anim.Key, Anim.Data>();
		for (let animation of data) {
			let action: Action = Action[animation.action as string];
			let key: Anim.Key = Anim.getKey(action, part, partID);
			let val: Anim.Data = Anim.getData(
				animation.frameBase,
				animation.nFrames,
				animation.msPerFrame,
				Anim.PlayType[animation.playType as string],
				Point.from(animation.anchor),
				{
					alignType: Anim.AlignType[animation.alignType as string],
					extraOffset: Point.from(animation.extraOffset)
			})
			res.set(key, val);
		}
		return res;
	}

	/**
	 * Helper function to process each attack's AttackInfo.
	 * @param data
	 */
	export function jsonToAttackInfo(data: Weapon.AttackInfoSpec, attackType: Weapon.AttackType): Weapon.AttackInfo {
		let cboxDims = data.cboxDims == null ? null : Point.from(data.cboxDims);
		let cboxOffset = data.cboxOffset == null ? null : Point.from(data.cboxOffset);
		let unblockable = data.unblockable == null ? false : data.unblockable;

		// convert and check collision types
		let cTypes: CollisionType[] = [];
		for (let cTypeStr of data.cTypes) {
			let cType = CollisionType[cTypeStr];
			if (cType == null) {
				throw new Error('Invalid cType: "' + cTypeStr + '"');
			}
			cTypes.push(cType);
		}

		let animDatas: Map<Anim.Key, Anim.Data> = null;
		if (data.animSpecs != null) {
			animDatas = new Map();
			for (let spec of data.animSpecs) {
				let [animKey, animData] = Anim.convertSpec(spec);
				animDatas.set(animKey, animData);
			}
		}

		return {
			// main
			cboxDims: cboxDims,
			cboxOffset: cboxOffset,
			movement: Weapon.AttackMovement[data.movement as string],
			damage: data.damage,
			attackType: attackType,
			cTypes: cTypes,
			knockbackForce: data.knockbackForce,
			staggerForce: data.staggerForce,
			lungeForce: data.lungeForce,
			duration: data.duration,

			// optional
			unblockable: unblockable,
			sounds: data.sounds,
			blockedDuration: data.blockedDuration || Component.Blocked.DEFAULT_DURATION,

			// projectiles
			velocity: data.velocity,
			animDatas: animDatas,
		};
	}

	/**
	 * Helper function to process each weapon.
	 * @param data
	 */
	function jsonToWeapon(data: any): Weapon.FullWeaponData {
		let mainPartID: PartID = null;
		let animations = new Map<Anim.Key, Anim.Data>();

		// maybe add main anims
		if (data.mainAnimationBase && data.mainAnimations) {
			let mainPart: Part = Part[data.mainAnimationBase.part as string];
			mainPartID = PartID[data.mainAnimationBase.partID as string];
			mapAdd(animations, jsonToAnimDict(data.mainAnimations, mainPart, mainPartID));
		}

		// maybe add fx anims
		// NOTE: we no longer use these, I think :-(
		if (data.fxAnimationBase && data.fxAnimations) {
			let fxPart: Part = Part[data.fxAnimationBase.part as string];
			let fxPartID: PartID = PartID[data.fxAnimationBase.partID as string];
			mapAdd(animations, jsonToAnimDict(data.fxAnimations, fxPart, fxPartID));
		}

		let fwd: Weapon.FullWeaponData = {
			weapon: {
				timing: data.timing,
				partID: mainPartID,
			},
			animations: animations,
		};

		// Add on attacks that exist
		if (data.swingAttack != null) {
			fwd.weapon.swingAttack = jsonToAttackInfo(data.swingAttack, Weapon.AttackType.Swing);
		}
		if (data.quickAttack != null) {
			fwd.weapon.quickAttack = jsonToAttackInfo(data.quickAttack, Weapon.AttackType.Quick);
		}
		if (data.comboAttack != null) {
			fwd.weapon.comboAttack = jsonToAttackInfo(data.comboAttack, Weapon.AttackType.Combo);
		}

		return fwd;
	}

	/**
	 * Turn JSON shield config file to game-usable data.
	 * @param data
	 */
	export function jsonToShields(data: any): Map<string, Shield.FullShieldData> {
		return inheritanceBuild(data, 'parent', jsonToShield, Shield.extendShield);
	}

	/**
	 * Helper function to process each shield.
	 * @param data
	 */
	function jsonToShield(data: any): Shield.FullShieldData {
		let blockInfo: Shield.BlockInfo = null;
		if (data.blockInfo != null && data.blockInfo.cboxDims != null &&
				data.blockInfo.cboxOffset != null) {
			blockInfo = {
				cboxDims: Point.from(data.blockInfo.cboxDims),
				cboxOffset: Point.from(data.blockInfo.cboxOffset),
				armor: data.blockInfo.armor,
			}
		}

		let part: Part = Part[data.animationCore.part as string];
		let partID: PartID = PartID[data.animationCore.partID as string];
		let animDict = jsonToAnimDict(data.animations, part, partID);

		return {
			shield: {
				timing: data.characterTiming,
				block: blockInfo,
				sounds: data.sounds,
			},
			animations: animDict,
		}
	}
}
