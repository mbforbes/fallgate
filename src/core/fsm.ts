namespace AI {
	/**
	 * FSM keys. Subclasses can use their own enums!
	 */
	type FSMState = number

	/**
	 * FSM values. Code to be run:
	 * - when entering a state (pre)
	 * - during state's update (body)
	 * - to determine the next state (next)
	 */
	export type FSMCode = {
		pre: () => void,
		body: () => void,
		next: () => FSMState,
	}

	/**
	 * Finite state machine.
	 */
	export abstract class FSM {

		/**
		 * Provide in subclasses
		 */
		abstract states: Map<FSMState, FSMCode>

		cur: FSMState
		elapsedInCur: number = 0
		init: boolean = false


		constructor(start: FSMState) {
			this.cur = start;
		}

		public update(delta: number): void {
			// TODO: more elegant way of doing this
			if (this.init) {
				this.states.get(this.cur).pre.call(this);
				this.init = true;
			}

			// run the body and determine the next state with. update the
			// elapsed time.
			let code = this.states.get(this.cur)
			code.body.call(this);
			let next = code.next.call(this);
			this.elapsedInCur += delta;

			// if switching to a new state, run the pre for that new state
			// now! (also reset timings and setup next state to run.)
			if (next !== this.cur) {
				this.states.get(next).pre.call(this);
				this.elapsedInCur = 0;
				this.cur = next;
			}
		}
	}
}
