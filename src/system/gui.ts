/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/gui.ts" />
/// <reference path="delay-speaker.ts" />
/// <reference path="../component/gui-sprite.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/tweenable.ts" />

namespace System {

	type DestructItem = {
		entity: Engine.Entity,
		remaining: number,
	}

	type Properties = {
		assetType: GUI.AssetType,
		id: string,
	}

	/**
	 * Used to manage GUI entities, safely storing references to them so they
	 * can be manipulated with scripts.
	 *
	 * NOTE: It doesn't appear this should really be a system. We really just
	 * want to register for an 'onClear()' call.
	 */
	export class GUIManager extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Dummy.name,
		])

		/**
		 * Holds next valid ID to use.
		 */
		private entities: Map<Engine.Entity, Properties> = new Map()
		private destructQueue: DestructItem[] = []

		constructor(private guiFile: GUI.File, private delaySpeaker: DelaySpeaker) {
			super();
		}

		private createCommon(
			assetType: GUI.AssetType,
			id: string,
			overridePos?: Point): Engine.Entity {
			// create and snag entity
			let entity = this.ecs.addEntity();
			this.entities.set(entity, {
				assetType: assetType,
				id: id,
			});

			// Add position component.
			let startPosSpec = assetType === GUI.AssetType.Sprite ?
				this.guiFile.sprites[id].startPos :
				this.guiFile.text[id].startPos;
			this.ecs.addComponent(entity,
				GUI.convertPositionSpec(startPosSpec, overridePos));

			// Add tweenable component.
			this.ecs.addComponent(entity, new Component.Tweenable());

			return entity;
		}

		//
		// API
		//

		/**
		 * Shortuct to call 'enter' tween on all text and sprite elements of
		 * `id` sequence.
		 * @param id
		 * @param textOverrides map from textID -> override text
		 */
		public runSequence(
			id: string,
			textOverrides: Map<string, string> = new Map(),
			imgOverrides: Map<string, string> = new Map(),
		): Engine.Entity[] {
			// start txt and sprite tweens, overriding any requested text
			let seq = this.guiFile.sequences[id];
			if (seq == null) {
				throw new Error('Unknown GUI sequence: "' + id + '"');
			}
			let res: Engine.Entity[] = [];
			for (let txtID of seq.text) {
				let override = null;
				if (textOverrides.has(txtID)) {
					override = textOverrides.get(txtID);
				}
				let e = this.createText(txtID, override);
				this.tween(e, 'enter');
				res.push(e)
			}
			for (let spriteID of seq.sprites) {
				let override = null;
				if (imgOverrides.has(spriteID)) {
					override = imgOverrides.get(spriteID);
				}
				let e = this.createSprite(spriteID, override);
				this.tween(e, 'enter');
				res.push(e);
			}
			return res;
		}

		public createText(id: string, overrideText?: string, overridePos?: Point): Engine.Entity {
			// get entity (w/ position and tweenable already attached)
			let entity = this.createCommon(GUI.AssetType.Text, id, overridePos);

			// add the text renderable component
			let spec = this.guiFile.text[id];
			this.ecs.addComponent(entity, new Component.TextRenderable(
				Typography.convertTextSpec(spec.textSpec, overrideText),
				Anim.convertDisplaySpec(spec.displaySpec)
			));

			return entity;

		}

		public createSprite(id: string, overrideImg?: string, overridePos?: Point): Engine.Entity {
			// get entity (w/ position and tweenable already attached)
			let entity = this.createCommon(GUI.AssetType.Sprite, id, overridePos);

			// add the gui sprite component
			let spec = clone(this.guiFile.sprites[id]);
			if (overrideImg != null) {
				spec.baseSpec.base = overrideImg;
			}
			// default to 1 scale here (b/c defaulting pulled out of conversion
			// for animated sprite global scaling)
			if (spec.baseSpec.scale == null) {
				spec.baseSpec.scale = 1;
			}
			this.ecs.addComponent(entity, new Component.GUISprite(
				spec.baseSpec, spec.displaySpec));

			return entity;
		}

		/**
		 * Only for built-in tweens (provided in gui.json).
		 */
		public tween(entity: Engine.Entity, tween: string): void {
			// get gui entity
			if (!this.entities.has(entity)) {
				throw new Error('Cannot tween untracked GUI entity: ' + entity);
			};
			let props = this.entities.get(entity);

			// get the set of tweens
			let tweenMap = props.assetType === GUI.AssetType.Text ?
				this.guiFile.text[props.id].tweens : this.guiFile.sprites[props.id].tweens;
			if (tweenMap[tween] == null) {
				throw new Error('Unknown tween name "' + tween + '" for gui element "' + props.id + '"');
			}
			let tweenSpec = tweenMap[tween];

			// apply
			this.tweenManual(entity, tweenSpec);
		}

		/**
		 * Apply custom, engine-generated tween to entity. (Also used as lib
		 * function within this class to apply file-specified tween.)
		 */
		public tweenManual(entity: Engine.Entity, tweenSpec: Tween.Spec): void {
			let tweenable = this.ecs.getComponents(entity).get(Component.Tweenable);

			// enqueue all visual tweens
			for (let tp of tweenSpec.visuals) {
				tweenable.tweenQueue.push(tp);
			}

			// enqueue all audio effects
			for (let sd of tweenSpec.sounds) {
				this.delaySpeaker.enqueue(sd);
			}

			// If this tween requested destruction at some delay, at that
			// trigger.
			if (tweenSpec.destruct != null) {
				this.destructQueue.push({
					entity: entity,
					remaining: tweenSpec.destruct,
				})
			}
		}

		public destroy(entity: Engine.Entity): void {
			if (!this.entities.has(entity)) {
				throw new Error('Cannot remove untracked gui element: ' + entity);
			}
			this.entities.delete(entity);
			this.ecs.removeEntity(entity);
		}

		//
		// System stuff
		//

		@override
		public onClear(): void {
			this.entities.clear();
			arrayClear(this.destructQueue);
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			// check for ones that should be destroyed
			for (let i = this.destructQueue.length - 1; i >= 0; i--) {
				// destroy if time limit reached
				if (this.destructQueue[i].remaining <= delta) {
					this.destroy(this.destructQueue[i].entity);
					this.destructQueue.splice(i, 1);
					continue;
				}

				// else just count down
				this.destructQueue[i].remaining -= delta;
			}
		}
	}
}
