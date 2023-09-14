/// <reference path="sound.ts" />

namespace Shield {

	export enum BlockState {
		Idle = 0,
		Raise,
		Block,
		Lower,
	}

	/**
	 * Timing info for a shields block stages. This is character-centric.
	 */
	export type CharacterTiming = {
		raiseDuration: number,
		lowerDuration: number,
	}

	/**
	 * Info for the block itself. (This is block-centric.)
	 */
	export type BlockInfo = {
		cboxDims: Point,
		cboxOffset: Point,
		armor: number,
	}

	/**
	 * Data class for what comprises a shield.
	 */
	export type Shield = {
		// NOTE: these are all optional in spec (when provided in json).
		timing: CharacterTiming,
		block: BlockInfo,
		sounds?: Sound.Shield,
	}

	export function cloneShield(orig: Shield): Shield {
		// make "basic" copy for primitive types
		let res = clone(orig);

		// fixup objects
		res.block.cboxDims = orig.block.cboxDims.copy();
		res.block.cboxOffset = orig.block.cboxOffset.copy();

		return res;
	}

	export function extendShield(parent: FullShieldData, child: FullShieldData): FullShieldData {
		let shield = cloneShield(parent.shield);

		// full or per-item overrides
		objOverride(shield, child.shield, 'timing');
		objOverride(shield, child.shield, 'block');
		objOverride(shield, child.shield, 'sounds');

		return {
			shield: shield,
			animations: Anim.extendAnims(parent.animations, child.animations),
		};
	}

	export type FullShieldData = {
		shield: Shield,
		animations: Map<Anim.Key, Anim.Data>,
	}
}
