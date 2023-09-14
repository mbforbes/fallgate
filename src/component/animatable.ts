/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/anim.ts" />


namespace Component {

	/**
	 * Animatable holds the mapping from {Action, Part, PartID} ->
	 * AnimationData. It stores z and stagetarget, which doesn't change per
	 * entity. It also holds flags that can be modified externally and then
	 * read (and also set) by the AnimationRenderer system.
	 */
	export class Animatable extends Engine.Component {

		//
		// Game state / big blob objects
		//

		/**
		 * Heavy-weight game-state added to component so that it may be shared
		 * between two animation renderer systems.
		 */
		public state: Stage.AnimatableState = new Stage.AnimatableState()

		//
		// Data
		//

		/**
		 * The core data about the set of animations possible for this
		 * Component.
		 *
		 * Assumed immutable after onAdd(...) in AnimationRenderer.
		 */
		public animations = new Map<Anim.Key, Anim.Data>()

		/**
		 * Set (via AnimationCustimze prop in GameMap) to hide on death.
		 *
		 * Assumed immutable after set in GameMap.
		 */
		public hideOnDeath: boolean = false

		/**
		 * Global tint for recoloring. Tint priorities:
		 * 1. game events (e.g., red = damaged)
		 * 2. animations-specific tints
		 * 3. globalTint
		 *
		 * Assumed immutable after set in GameMap.
		 */
		public globalTint: number = 0xffffff

		/**
		 * Similar to tint, this is able to be overridden globally, or per
		 * animation (which takes priority).
		 *
		 * (No game events re-scale right now, but theoretically also that'd be
		 * top presidence... though I guess that'd scale the base scale?)
		 */
		public globalScale: number = 1

		/**
		 * Set by system ticking the animation(s) and viewable by other systems
		 * (e.g., sound effects system for footsteps).
		 */
		public coreFrame: number = -1

		/**
		 * API: Flag bit used to signal that the current animation should be
		 * reset. Used to trigger an animation to start from the beginning in
		 * the middle of it playing (e.g., for a new knockback while already in
		 * a knockback).
		 */
		public get reset(): boolean { return this._reset; }
		public set reset(v: boolean) {
			if (this._reset !== v) {
				this._reset = v;
				this.dirty();
			}
		}
		private _reset: boolean = false

		/**
		 * API: Flag bit used to pause animations (e.g., for animatable FX that
		 * we don't need to be playing all the time in the background).
		 */
		public get pause(): boolean { return this._pause; }
		public set pause(v: boolean) {
			if (this._pause !== v) {
				this._pause = v;
				this.dirty();
			}
		}
		private _pause: boolean = false

		/**
		 * API: Flag it used to hide animations (e.g., for animatable FX in a
		 * big pool that we don't want to show while they're not active).
		 */
		public get visible(): boolean { return this._visible; }
		public set visible(v: boolean) {
			if (this._visible !== v) {
				this._visible = v;
				this.dirty();
			}
		}
		private _visible: boolean = true

		/**
		 * Both z and stageTarget are assumed immutable after set.
		 */
		constructor(public z: ZLevelWorld | ZLevelHUD, public stageTarget: StageTarget) {
			super();
		}

		public get defaultOnly(): boolean {
			return this.animations.size === 1 && this.animations.has(Anim.DefaultKey);
		}

		toString(): string {
			return (
				'Core frame: ' + this.coreFrame +
				', Displaying: ' + this.state.activeKeys.size +
				', Total: ' + this.state.animations.size
			);
		}
	}
}
