/// <reference path="../system/audio.ts" />
/// <reference path="../graphics/anim.ts" />
/// <reference path="../graphics/typography.ts" />
/// <reference path="../component/position.ts" />

namespace GUI {

	/**
	 * External gui.json. Note that the only naming rule on the IDs is that
	 * they *cannot contain slashes.*
	 */
	export type File = {
		sequences: {
			[sequenceID: string]: SequenceSpec,
		}
		text: {
			[guiTextID: string]: TextSpec,
		},
		sprites: {
			[guiSpriteID: string]: SpriteSpec,
		},
	}

	export type SequenceSpec = {
		text: string[],
		sprites: string[],
	}

	export enum AssetType {
		Text = 0,
		Sprite,
	}

	/**
	 * Single GUI text element in gui.json. Defines the text properties,
	 * (optional) position, and a set of tweens.
	 */
	export type TextSpec = {
		textSpec: Typography.TextSpec,
		displaySpec: Anim.DisplaySpec,
		/**
		 * If not provided, will rely on code that creates the GUI element to
		 * specify the starting position.
		 */
		startPos?: PositionSpec,
		tweens: {
			[tweenID: string]: Tween.Spec
		},
	}


	/**
	 * Single GUI sprite element in gui.json. Defines the animation, (optional)
	 * position, and a set of tweens.
	 */
	export type SpriteSpec = {
		baseSpec: Anim.BaseSpec,
		displaySpec: Anim.DisplaySpec,
		/**
		 * If not provided, will rely on code that creates the GUI element to
		 * specify the starting position.
		 */
		startPos?: PositionSpec,
		tweens: {
			[tweenID: string]: Tween.Spec
		},
	}

	/**
	 * Note: If it's weird to refer to a component here, can move into the
	 * system.
	 */
	export function convertPositionSpec(spec: PositionSpec, overridePos?: Point): Component.Position {
		let pos = new Point();
		let angle = 0;
		if (spec != null) {
			pos.setFrom_(spec.position);
			angle = spec.rotation || 0;
		}
		if (overridePos != null) {
			pos.copyFrom_(overridePos);
		}
		return new Component.Position(pos, angle);
	}

	/**
	 * Where a GUI element should start.
	 */
	export type PositionSpec = {
		position: number[],
		/**
		 * Default: 0.
		 */
		rotation?: number,
	}
}
