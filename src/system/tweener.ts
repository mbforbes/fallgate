/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/gui.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/tweenable.ts" />

namespace System {

	class TweenerAspect extends Engine.Aspect {
		waitingTweens: Tween.Package[] = []
		activeTweens: Map<string, Tween.State> = new Map()
	}

	export class Tweener extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Position.name,
			Component.Tweenable.name,
		])

		@override
		public makeAspect(): TweenerAspect {
			return new TweenerAspect();
		}

		private getVal(aspect: TweenerAspect, prop: string): number {
			// position is special because we always use the component as a
			// ground truth. simply set it there.
			if (prop === 'y' || prop === 'x' || prop === 'angle') {
				let pos = aspect.get(Component.Position);
				if (prop === 'y') {
					return pos.p.y;
				} else if (prop === 'x') {
					return pos.p.x;
				} else if (prop === 'angle') {
					return pos.angle;
				}
			}

			// otherwise, get from groundTruth map
			let tweenable = aspect.get(Component.Tweenable);
			return tweenable.groundTruth[prop];
		}

		private setVal(aspect: TweenerAspect, prop: string, val: number): void {
			// position is special because we always use the component as a
			// ground truth. simply set it there.
			if (prop === 'y' || prop === 'x' || prop === 'angle') {
				let pos = aspect.get(Component.Position);
				if (prop === 'y') {
					pos.setY(val);
				} else if (prop === 'x') {
					pos.setX(val);
				} else if (prop === 'angle') {
					pos.angle = val;
				}
				return;
			}

			// it's a non-position prop: use the groundTruth map instead.
			let tweenable = aspect.get(Component.Tweenable);
			tweenable.groundTruth[prop] = val;
		}

		private activate(
				aspect: TweenerAspect,
				tweenable: Component.Tweenable,
				tweenPackage: Tween.Package): void {
			// convert TweenOptionsSepc to TweenState
			let start = this.getVal(aspect, tweenPackage.prop);

			// note that when extracting the number, we may have to convert
			// from a hex string if it's a color.
			let specVal: number = -1;
			if (typeof tweenPackage.spec.val === 'string') {
				specVal = parseInt(tweenPackage.spec.val.slice(1), 16);
			} else {
				specVal = tweenPackage.spec.val
			}
			let target = tweenPackage.spec.valType === 'abs' ?
					specVal : start + specVal;

			// include some sanity checks
			let method: Tween.Method = Tween.methods[tweenPackage.spec.method];
			if (method === null) {
				throw new Error('Unrecognized tween method: "' + tweenPackage.spec.method + '"');
			}
			if (tweenPackage.spec.duration <= -2) {
				throw new Error('Bad tween duration: "' + tweenPackage.spec.duration + '"');
			}
			let state: Tween.State = {
				start: start,
				target: target,
				elapsed: 0,
				duration: tweenPackage.spec.duration,
				period: tweenPackage.spec.period,
				method: method,
			}
			aspect.activeTweens.set(tweenPackage.prop, state);
		}

		public update(delta: number, entities: Map<Engine.Entity, TweenerAspect>): void {
			for (let aspect of entities.values()) {
				// NOTE: eventually do lifetime checking for auto-destruction
				// (is this the place? just use timebomb?)

				let tweenable = aspect.get(Component.Tweenable);

				// Nuclear flag: clear just says "destroy all tweens". Easy
				// enough.
				if (tweenable.clear) {
					arrayClear(aspect.waitingTweens);
					aspect.activeTweens.clear();
					tweenable.clear = false;
					// NOTE: we keep going so we can accept new tweens
				}

				// progress active tweens
				let deleteProps: string[] = [];
				for (let [prop, state] of aspect.activeTweens.entries()) {
					// tick
					state.elapsed += delta;

					// check for finished
					if (state.duration != Tween.Infinite && state.elapsed > state.duration) {
						this.setVal(aspect, prop, state.target);
						deleteProps.push(prop);
						continue;
					}

					// otherwise, compute and set prop val
					let portion = state.method(state.elapsed, state.duration, state.period);
					this.setVal(
						aspect,
						prop,
						state.start + portion * (state.target - state.start));
				}

				// clean up finished tweens
				while (deleteProps.length > 0) {
					aspect.activeTweens.delete(deleteProps.pop());
				}

				// drain the queue and send to the wait list
				while (tweenable.tweenQueue.length > 0) {
					aspect.waitingTweens.push(clone(tweenable.tweenQueue.pop()));
				}

				// progress wait list forward until something is ready to go.
				for (let i = aspect.waitingTweens.length - 1; i >= 0; i--) {
					let tp = aspect.waitingTweens[i];
					if (tp.spec.delay == null || tp.spec.delay < delta) {
						// no wait or ready: remove from waiting list.
						this.activate(aspect, tweenable, tp);
						aspect.waitingTweens.splice(i, 1);
					} else {
						// tick delay down;
						tp.spec.delay -= delta;
					}
				}
			}
		}
	}
}
