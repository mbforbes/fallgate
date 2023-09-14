/// <reference path="../engine/ecs.ts" />

namespace Component {

	export class Health extends Engine.Component {

		public get maximum(): number {return this._maximum;}
		public set maximum(v: number) {
			if (v !== this._maximum) {
				this._maximum = v;
				this.dirty();
			}
		}
		private _maximum: number

		public get current(): number {return this._current;}
		public set current(v: number) {
			if (v !== this._current) {
				this._current = v;
				this.dirty();
			}
		}
		private _current: number

		constructor(maximum: number, current = maximum) {
			super();
			this.maximum = maximum;
			this.current = current;
		}

		public toString(): string {
			return this.current + ' / ' + this.maximum;
		}
	}
}
