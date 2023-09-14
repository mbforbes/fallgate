/// <reference path="../gj7/ai.ts" />

namespace Component {

	export class AIComponent extends Engine.Component {

		// main settings
		public params: any

		/**
		 * For debugging, AI systems can choose to update this string with the
		 * some string (e.g., the sate of the FSM).
		 */
		public debugState: string = ''

		/**
		 * @param behavior What behavior to use.
		 * @param params These are one of the "AI.*Params" types.
		 * @param cutscene Whether to run the AI for this component during
		 * cutscenes. Necessary so we can make the player walk around during
		 * cutscenes but keep them from getting mauled by enemies right out of
		 * the gate (literally).
		 */
		constructor(public behavior: AI.Behavior, params: any, public cutscene: boolean = false) {
			super();
			this.params = clone(params);
		}

		toString(): string {
			return AI.Behavior[this.behavior] + ' (' + this.debugState + ')';
		}
	}
}
