/// <reference path="../../lib/pixi.js.d.ts" />

/// <reference path="../core/lang.ts" />
/// <reference path="../core/util.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/stage.ts" />
/// <reference path="../component/activity.ts" />
/// <reference path="../component/animatable.ts" />
/// <reference path="../component/body.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/stagger.ts" />


namespace System {

	export class AnimationRenderer extends Engine.System {

		//
		// static
		//

		/**
		 * TODO: eventually fully replace with Animation.build (these are
		 * separate because of the Anim.Data (old) vs Anim.BaseData (new)
		 * divide).
		 */
		private static buildAnimation(st: StageTarget, z: ZLevelWorld|ZLevelHUD, d: Anim.Data): Stage.Animation {
			// Create
			let anim = Stage.Animation.build({
				base: d.frameBase,
				frames: d.nFrames,
				speed: d.speed,
				playType: d.playType,
				anchor: d.anchor,
				alpha: d.alpha,
				tint: d.tint,
				scale: d.scale,
			}, {
				stageTarget: st,
				z: z,
			});
			anim.visible = false;  // will turn on first update

			return anim;
		}

		/**
		 * Computes the set of current keys to be displayed.
		 */
		private static getCurrentKeys(
			aspect: Engine.Aspect,
			animatable: Component.Animatable,
			out: Set<Anim.Key>,
		): void {
			out.clear();

			// simple case: default only
			if (animatable.defaultOnly) {
				out.add(Anim.DefaultKey);
				return;
			}

			// otherwise, gotta do body part calculus
			let activity = aspect.get(Component.Activity);
			let body = aspect.get(Component.Body);
			for (let [part, partID] of body.getParts()) {
				// Check early on with what we have loaded. Don't add it if we don't. We're not
				// warning here as it would happen every frame, but these should be fixed at
				// some point assuming we want a complete set of animations.
				let key = Anim.getKey(activity.action, part, partID);
				// TODO: remove "state" and see whether works.
				if (animatable.state.animations.has(key)) {
					out.add(key);
				}
			}
		}

		private static getCoreKey(aspect: Engine.Aspect, animatable: Component.Animatable): Anim.Key {
			// easy case: only one key!
			if (animatable.defaultOnly) {
				return Anim.DefaultKey;
			}

			// otherwise, depends on activity and partID
			let activity = aspect.get(Component.Activity);
			let body = aspect.get(Component.Body);
			let corePartID = body.getPart(Part.Core);
			return Anim.getKey(activity.action, Part.Core, corePartID);
		}


		//
		// instance
		//

		public componentsRequired = new Set<string>([
			Component.Position.name,
			Component.Animatable.name,
		])

		public dirtyComponents = new Set<string>([
			// changes in these require updates.
			Component.Position.name,
			Component.Animatable.name,
			Component.Activity.name,
			Component.Body.name,

			// listening for these to be added/removed as also means update
			// required
			Component.Dead.name,
			Component.DamagedFlash.name,
		])

		private cacheTodoKeys = new Set<Anim.Key>();
		private cacheTexOrigPos = new Point()
		private cacheAlignOffset = new Point()

		constructor(private stage: Stage.MainStage) {
			super();
		}

		@override
		public onAdd(aspect: Engine.Aspect): void {
			let animatable = aspect.get(Component.Animatable);

			// loop through all provided animation types for the action
			for (let [key, data] of animatable.animations.entries()) {
				let anim = AnimationRenderer.buildAnimation(animatable.stageTarget, animatable.z, data);
				let tint = data.tint != null ? data.tint : animatable.globalTint;
				let scale = data.scale != null ? data.scale : animatable.globalScale;
				// apply scale immediately (because it doesn't change, like
				// tint does; if it starts to, put below near where getTint()
				// is)
				anim.scale.set(scale, scale);
				let [action, part, partID] = Anim.splitKey(key);
				animatable.state.animations.set(key, {
					animation: anim,
					align: data.align,
					tint: tint,
					scale: scale,
					action: action,
					part: part,
					partID: partID,
				});
			}

			// we don't actually add to the stage yet as we'll need to decide
			// each frame what gets displayed.

			// let ticker know about it
			this.ecs.addComponent(aspect.entity, new Component.AnimationTickable());
		}

		@override
		public onRemove(aspect: Engine.Aspect): void {
			let state = aspect.get(Component.Animatable).state;

			for (let key of state.activeKeys.keys()) {
				let cont = state.animations.get(key);
				this.stage.remove(cont.animation);
			}
		}

		private getTint(aspect: Engine.Aspect, defaultTint: number): number {
			// TODO: make constants somewhere
			let red = 0xff0000;
			let flash = 0xffff00;

			// NOTE: could disable red on dead, but I think it looks kind of
			// good, even though it might logically not make quite as much
			// sense.

			// Tint red if damage flash enabled.
			if (aspect.has(Component.DamagedFlash)) {
				return red;
			}

			// default
			return defaultTint;
		}

		// private getBrightness(aspect: Engine.Aspect): number {
		// 	let dark = 0.0;
		// 	let normal = 1.0;
		// 	let bright = 3.0;

		// 	// if dead, don't flash or anything
		// 	if (aspect.has(Component.Dead)) {
		// 		return normal;
		// 	}

		// 	// damage immunity
		// 	if (aspect.has(Component.Invincible)) {
		// 		let inv = aspect.get(Component.Invincible);
		// 		let elapsed = this.ecs.gametime - inv.startTime;
		// 		let portion = Tween.linearCycle(elapsed, -1, 400);
		// 		return portion*dark + (1-portion)*normal;
		// 	}

		// 	// charge
		// 	if (aspect.has(Component.Armed)) {
		// 		let armed = aspect.get(Component.Armed);

		// 		let portion = 0.0;
		// 		switch(armed.state) {
		// 			case Weapon.SwingState.ChargeCharging:
		// 			case Weapon.SwingState.ChargeReady:
		// 				portion = Tween.linearCycle(armed.elapsed, -1, 200);
		// 				break;
		// 		}
		// 		return portion*bright + (1-portion)*normal;
		// 	}

		// 	return normal;
		// }

		// private applyFilters(aspect: Engine.Aspect, animation: Stage.Animation): void {
		// 	// brightness (currently only filter)
		// 	// let brightness = this.getBrightness(aspect);

		// 	// set every frame (inefficient?)
		// 	// (animation.filterCache.get(Stage.Animation.BrightnessFilter) as PIXI.filters.ColorMatrixFilter)
		// 	//	.brightness(brightness);
		// }

		private maybeHide(aspect: Engine.Aspect, animatable: Component.Animatable): void {
			if (animatable.hideOnDeath) {
				animatable.visible = !aspect.has(Component.Dead);
			}
		}

		/**
		 * Changes individual animation as necessary based on active components.
		 */
		private mutateAnimation(
			delta: number,
			aspect: Engine.Aspect,
			ac: Stage.AnimationContainer,
			visible: boolean,
		): void {
			ac.animation.visible = visible;
			if (visible) {
				ac.animation.tint = this.getTint(aspect, ac.tint);
				// this.applyFilters(aspect, animation);
			}
		}

		private updateAnimations(delta: number, aspect: Engine.Aspect, next: Set<Anim.Key>): void {
			// Extract (and sometimes mutate) flags that signal details on how
			// we should render animations.
			let animatable = aspect.get(Component.Animatable);
			let state = animatable.state;

			// reset
			let reset = animatable.reset;
			animatable.reset = false;

			// hide
			let visible = animatable.visible;

			// For each key in prevKeys:
			//	- if it's not in the new keys, remove from the stage
			// For each key left in the new keys:
			//	- if it's not in the old keys, add it to the stage
			// (could do a set difference instead and avoid double-checking
			// objects, but avoiding duplicating objects probably faster)
			for (let prevKey of state.activeKeys.keys()) {
				if (next.has(prevKey)) {
					let ac = state.animations.get(prevKey);
					this.mutateAnimation(delta, aspect, ac, visible);

					// TODO: maybe move reset to animation ticker (if it's
					// clean to) so we don't skip the first frame upon reset.

					// Reset (if requested).
					if (reset) {
						ac.animation.reset()
					}
				} else {
					// No longer displayed; remove from stage.
					this.stage.remove(state.animations.get(prevKey).animation);
				}
			}
			for (let newKey of next.keys()) {
				if (!state.activeKeys.has(newKey)) {
					// Reset animation frame progression and add to stage.
					let ac = state.animations.get(newKey);
					ac.animation.reset();
					this.mutateAnimation(delta, aspect, ac, visible);
					this.stage.add(ac.animation);
				}
			}
		}


		private updatePositions(aspect: Engine.Aspect): void {
			// Always update the position.
			let animatable = aspect.get(Component.Animatable);
			let state = animatable.state;
			let position = aspect.get(Component.Position);

			let coreKey = AnimationRenderer.getCoreKey(aspect, animatable);
			let rot = angleFlip(position.angle);  // us: CCW; pixi: CW

			// First, update the core animation's position / rotation.
			if (!state.animations.has(coreKey)) {
				console.error('DEBUG: All entity animations:');
				for (let anim of state.animations.keys()) {
					console.error(' - "' + anim + '"');
				}
				throw new Error('Entity lacks animation: "' + coreKey + '";\n');
			}
			let coreAnim = state.animations.get(coreKey).animation;

			coreAnim.position.set(position.p.x, position.p.y);
			coreAnim.rotation = rot;

			// Next, extract its origin for use later.
			let coreOrig = this.cacheTexOrigPos;
			coreAnim.getTextureOrigin(coreOrig);

			// Then, update the others.
			for (let [key, cont] of state.animations.entries()) {
				if (key == coreKey) {
					continue;
				}

				// Position depends on tracking type.
				switch (cont.align.alignType) {
					case Anim.AlignType.Center: {
						cont.animation.position.set(position.p.x, position.p.y);
						break;
					}
					case Anim.AlignType.TextureOrigin: {
						// rotate the alignment extra offset by animation's
						// rotation
						let ao = this.cacheAlignOffset;
						ao.copyFrom_(cont.align.extraOffset).rotate_(rot).add_(coreOrig);
						cont.animation.position.set(ao.x, ao.y);
						break;
					}
				}
				// Rotation is always set the same throughout (can change).
				cont.animation.rotation = rot;
			}
		}

		// private animDirty(aspect: Engine.Aspect, animatable: Component.Animatable): boolean {
		// 	let activityDirty = aspect.has(Component.Activity) && aspect.get(Component.Activity).dirty;
		// 	let bodyDirty = aspect.has(Component.Body) && aspect.get(Component.Body).dirty;
		// 	return animatable.dirty || activityDirty || bodyDirty;
		// }

		public update(
			delta: number,
			entities: Map<Engine.Entity, Engine.Aspect>,
			dirty: Set<Engine.Entity>,
		): void {
			for (let entity of dirty) {
				let aspect = entities.get(entity);
				let animatable = aspect.get(Component.Animatable);
				// let animDirty = this.animDirty(aspect, animatable);

				// pre
				// shortcut to avoid most of updates for invisible things
				let state = animatable.state;
				this.maybeHide(aspect, animatable);
				if ((state.curVisible === animatable.visible) && !animatable.visible) {
					continue;
				}

				// getCurrent Keys
				let nextKeys = this.cacheTodoKeys;
				AnimationRenderer.getCurrentKeys(aspect, animatable, nextKeys);

				// update anims
				this.updateAnimations(delta, aspect, nextKeys);

				// updatePositions

				// TODO: find a way to only update positions when only positions
				// changed (majority case). may require more extensive
				// bookkeeping of dirty components (specifically, to notice
				// removed ones like Dead or DamagedFlash so we can avoid
				// running the above methods).
				this.updatePositions(aspect);

				// maybe add ticker so it's updated. w/ dirty check, we didn't
				// do so for mere position changes, but we're deprecating
				// reading dirty flag so trying just always adding it.
				// if (animDirty && (!aspect.has(Component.AnimationTickable))) {
				if (!aspect.has(Component.AnimationTickable)) {
					this.ecs.addComponent(entity, new Component.AnimationTickable());
				}

				// post
				setClone(nextKeys, state.activeKeys);
				state.curVisible = animatable.visible;
			}
		}
	}
}
