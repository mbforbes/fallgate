/// <reference path="../../lib/pixi.js.d.ts" />

/// <reference path="../core/base.ts" />

namespace Typography {

	/**
	 * Internal representation of textSpec.
	 */
	export type TextData = {
		text: string,
		style: PIXI.TextStyle,
		anchor: Point,
		alpha: number,
	}

	export type TextSpec = {
		/**
		 * What text to actually use. This can also be overwritten in the game
		 * engine (e.g., for dynamic text).
		 */

		text?: string,
		/**
		 * See options in `class TextStyle` in `lib/pixi.js.d.ts`
		 */
		style: PIXI.TextStyle,

		/**
		 * Where the text is anchored. Default: (0.5, 0.5) (center).
		 */
		anchor?: number[],

		/**
		 * Transparency (0 = transparent, 1 = opaque).
		 */
		alpha?: number,
	}

	export function convertTextSpec(textSpec: TextSpec, overrideText?: string): TextData {
		return {
			text: overrideText || textSpec.text || '<WHOOPS UNSET>',
			style: clone(textSpec.style),
			anchor: (textSpec.anchor ? Point.from(textSpec.anchor) : new Point(0.5, 0.5)),
			alpha: (textSpec.alpha != null ? textSpec.alpha : 1),
		}
	}

}
