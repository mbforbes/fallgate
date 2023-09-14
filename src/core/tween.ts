/// <reference path="../gj7/sound.ts" />

namespace Tween {

	//
	// Tween methods
	//

	// some tweens adapted from
	// https://github.com/gdsmith/jquery.easing/blob/master/jquery.easing.js

	/**
	 * All tween methods are of this type.
	 */
	export type Method = (elapsed: number, duration: number, period: number) => number

	/**
	 * Duration used to signal no end. (Behavior not defined for most tween
	 * Methods; this is used internally elsewhere.)
	 */
	export const Infinite = -1

	/**
	 * ---------------------------------
	 *								   .
	 *							   .
	 *						  .
	 *					  .
	 *				 .
	 *			.
	 *		.
	 * .
	 * ---------------------------------
	 *
	 * @param elapsed
	 * @param duration
	 *
	 * Returns how much to tween \in [0, 1].
	 */
	export function linear(elapsed: number, duration: number): number {
		return elapsed/duration;
	}

	export function easeInCubic(elapsed: number, duration: number): number {
		let p = elapsed/duration;
		return p*p*p;
	};

	/**
	 * ---------------------------------
	 *								   .
	 *					   .
	 *				.
	 *		   .
	 *		.
	 *	  .
	 *	.
	 * .
	 * ---------------------------------
	 *
	 * @param elapsed
	 * @param duration
	 *
	 * Returns how much to tween \in [0, 1].
	 */
	export function easeOutCubic(elapsed: number, duration: number): number {
		let portion = elapsed/duration - 1;
		return portion*portion*portion + 1;
	};

	const eobCCUB = 2.70158;
	const eobCSQ = 1.70158;

	export function easeOutBack(elapsed: number, duration: number): number {
		let p = elapsed / duration;
		return 1 + eobCCUB * Math.pow(p - 1, 3) + eobCSQ * Math.pow(p - 1, 2);
	}

	const TWOTHIRDSPI = (Math.PI / 3) * 2;

	export function easeOutElastic(elapsed: number, duration: number): number {
		let p = elapsed / duration;
		if (p <= 0) {
			return 0;
		}
		if (p >= 1) {
			return 1;
		}
		return Math.pow(2, -10 * p) * Math.sin((10 * p - 0.75) * TWOTHIRDSPI) + 1;
	}

	const bncN1 = 7.5625;
	const bncD1 = 2.75;

	export function easeOutBounce(elapsed: number, duration: number): number {
		let p = elapsed / duration;

		if (p < 1/bncD1) {
			return bncN1*p*p;
		} else if (p < 2/bncD1) {
			return bncN1*(p-=(1.5/bncD1))*p + .75;
		} else if (p < 2.5/bncD1) {
			return bncN1*(p-=(2.25/bncD1))*p + .9375;
		} else {
			return bncN1*(p-=(2.625/bncD1))*p + .984375;
		}
	}

	export function sine(elapsed: number, _: number, period: number): number {
		return Math.sin(period * elapsed);
	}

	/**
	 *		^		  ^
	 *	  /	  \		/	\	  . . .
	 *	 /	   \   /	 \	 /
	 * x		 v		   v
	 *
	 * NOTE: if we have other cycles in the future, can probably pass the
	 * underlying method as a parameter!
	 *
	 * @param elapsed
	 * @param _ duration (unused)
	 * @param period
	 */
	export function linearCycle(elapsed: number, _: number, period: number): number {
		let progress = (elapsed % period) / period;
		if (progress <= 0.5) {
			// ascending wave --- progress is from 0 up to 1
			return progress / 0.5;
		} else {
			// descending wave --- progress is from 1 down to 0
			return 1 - ((progress - 0.5) / 0.5);
		}
	}

	/**
	 * Flahses between 0 and 1 at `period` interval.
	 * @param elapsed
	 * @param _ duration (unused)
	 * @param period
	 */
	export function flashBetween(elapsed: number, _: number, period: number): number {
		return Math.round(elapsed / period) % 2 == 0 ? 0 : 1;
	}

	/**
	 * Returns a function that will wait a given time, then interpolate the
	 * remainder using the provided subMethod.
	 * @param wait
	 * @param subMethod
	 */
	export function delay(wait: number, subMethod: Method): Method {
		return function(elapsed: number, duration: number, period: number): number {
			if (elapsed < wait) {
				return 0.0;
			}
			return subMethod(elapsed - wait, duration - wait, period);
		}
	}

	export const methods = {
		sine: sine,
		linear: linear,
		linearCycle: linearCycle,
		easeInCubic: easeInCubic,
		easeOutCubic: easeOutCubic,
		easeOutBack: easeOutBack,
		easeOutBounce: easeOutBounce,
		easeOutElastic: easeOutElastic,
		flashBetween: flashBetween,
	}

	//
	// Tween infrastructure
	//

	/**
	 * A tween spec defines a set of visual tweens, and a set of sounds to
	 * play.
	 */
	export type Spec = {
		visuals: Package[],
		sounds: Sound.Delay[],
		destruct?: number,
	}

	export type Package = {

		/**
		 * The property to tween. Valid properties are:
		 * - x
		 * - y
		 * - angle
		 * - all properties found in `groundTruth` in
		 *	 `src/component/tweenable.ts`
		 *
		 * (NOTE: Do we want to pull this set of options into the tween lib
		 * somewhere?)
		 */
		prop: string,

		/**
		 * How to tween. See below for the detailed spec.
		 */
		spec: OptionsSpec,
	}

	/**
	 * Each tween property has a set of options that define (a) what value to
	 * tween to and (b) how to do it over time. These are broken up to finer
	 * grained properties in the object.
	 */
	type OptionsSpec = {

		/**
		 * See below: this is whether the value is 'abs' = 'absolute' (a
		 * specific value to go to), or 'rel' = 'relative' (a number to add to
		 * the current setting).
		 */
		valType: ValType,

		/**
		 * This must either be a number or a hex string like '#abcdef' (exactly
		 * one pound sign and then six hex digits).
		 */
		val: number | string,

		duration: number,

		/**
		 * This should refer to one of the functions in Tween.
		 * TODO: build and export some kind of mapping there.
		 */
		method: string,

		/**
		 * only used for some tweens; the period on which to cycle
		 */
		period?: number,

		/**
		 * Default: 0.
		 */
		delay?: number,
	}

	type ValType = 'abs' | 'rel';

	/**
	 * Internal state of a tween.
	 */
	export type State = {

		// val space

		start: number,

		target: number,

		// time

		elapsed: number,

		/**
		 * duration can be Tween.Infinite, in which case the tween won't end.
		 * In that case, a tween method will need to be duration-agnostic
		 * (e.g., a sine wave the follows the provided period).
		 */
		duration: number,

		/**
		 * only used for some tweens; the period on which to cycle
		 */
		period?: number,

		method: Method,
	}

}
