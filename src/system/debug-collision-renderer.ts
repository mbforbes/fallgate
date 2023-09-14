/// <reference path="../../lib/pixi.js.d.ts" />

/// <reference path="../core/lang.ts" />
/// <reference path="../core/polygon.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/stage.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/collision-shape.ts" />

/**
 * Flattens an array of points into a single [x1, y1, x2, y2, ...] array.
 */
function flattenPoints(input: Point[]): number[] {
	let res: number[] = new Array(input.length * 2);
	for (let i = 0; i < input.length; i++) {
		res[i*2] = input[i].x;
		res[i*2 + 1] = input[i].y;
	}
	return res;
}

namespace System {

	class DebugCollisionAspect extends Engine.Aspect {
		textureBox: Stage.Sprite
	}

	export class DebugCollisionRenderer extends Engine.System {

		private cacheVertices = new Array<Point>(4)

		public componentsRequired = new Set<string>([
			Component.Position.name,
			Component.CollisionShape.name,
		])

		public dirtyComponents = new Set<string>([
			Component.Position.name,
			Component.CollisionShape.name,
		])

		constructor(private stage: Stage.MainStage, disabled: boolean) {
			super(disabled, true);
		}

		@override
		public makeAspect(): DebugCollisionAspect {
			return new DebugCollisionAspect();
		}

		/**
		 * Rectangle-only version that enjoys texture reuse.
		 */
		private stretchParticle(box: Component.CollisionShape): Stage.Sprite {
			let dobj = Stage.Sprite.build(
				'particles/particle1.png',
				ZLevelWorld.DEBUG,
				StageTarget.World,
				new Point(0, 0),  // legit position simply set on update
				new Point(0.5, 0.5),
			);
			dobj.width = box.rectDims.x;
			dobj.height = box.rectDims.y;
			return dobj;
		}

		/**
		 * Arbitrary polygon version, but makes new texture per object.
		 */
		private fromGraphics(box: Component.CollisionShape): Stage.Sprite {
			// OMG thought: can we just compute vertices once, then reposition
			// + rotate whenever object moves?

			// get vertices w/ (0,0) as coordinate (local)
			let vertices = flattenPoints(box.localVertices);

			// draw
			let g = new PIXI.Graphics();
			g.beginFill(0xffffff, 1.0);
			g.drawPolygon(vertices);
			g.endFill();
			let s = new Stage.Sprite(g.generateCanvasTexture(), ZLevelWorld.DEBUG, StageTarget.World);
			s.anchor.set(0.5, 0.5);
			return s;
		}

		private makeDisplayObj(box: Component.CollisionShape): Stage.Sprite {
			// faster (i think), but only works for rectangles.
			if (box.shape === Physics.Shape.Rectangle) {
				return this.stretchParticle(box);
			}

			// for other polygons, draw as graphics and save to texture.
			return this.fromGraphics(box);
		}

		@override
		public onAdd(aspect: DebugCollisionAspect): void {
			// get components
			let position = aspect.get(Component.Position);
			let box = aspect.get(Component.CollisionShape);

			// create resources. save to aspect.
			aspect.textureBox = this.makeDisplayObj(box);
			aspect.textureBox.alpha = 0.5;
			aspect.textureBox.visible = !this.disabled;

			// do first update so everything shows up initially
			this.updateDisplayObj(aspect.textureBox, position.p, box, position.angle);

			// add to stage
			this.stage.add(aspect.textureBox);
		}

		@override
		public onRemove(aspect: DebugCollisionAspect): void {
			this.stage.remove(aspect.textureBox);
		}

		@override
		public onDisabled(entities: Map<Engine.Entity, DebugCollisionAspect>): void {
			for (let aspect of entities.values()) {
				aspect.textureBox.visible = false;
			}
		}

		@override
		public onEnabled(entities: Map<Engine.Entity, DebugCollisionAspect>): void {
			for (let aspect of entities.values()) {
				aspect.textureBox.visible = true;
			}
		}

		private getDebugColor(box: Component.CollisionShape): number {
			// color determined by colliding status.

			let color = 0x0000ff;  // default: blue

			if (box.collisionsResolved.size > 0) {
				// green if only resolved collisions exist
				color = 0x00ff00;
			}
			if (box.collisionsFresh.size > 0) {
				// red if any fresh collisions exist
				color = 0xff0000;
			}
			if (box.disabled) {
				// grey if disabled
				color = 0x333333;
			}

			return color;
		}

		private updateDisplayObj(dobj: Stage.Sprite, pos: Point, box: Component.CollisionShape, angle: number): void {
			dobj.position.x = pos.x + box.offset.x;
			dobj.position.y = pos.y + box.offset.y;
			dobj.rotation = angleFlip(angle);
			dobj.tint = this.getDebugColor(box);
		}

		public update(delta: number, entities: Map<Engine.Entity, DebugCollisionAspect>, dirty: Set<Engine.Entity>): void {
			for (let entity of dirty) {
				let aspect = entities.get(entity);
				let position = aspect.get(Component.Position);
				let box = aspect.get(Component.CollisionShape);

				// update internal position / rotation / color
				this.updateDisplayObj(aspect.textureBox, position.p, box, position.angle);
			}
		}
	}
}
