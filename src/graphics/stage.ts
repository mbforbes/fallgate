/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="../../lib/pixi-layers.d.ts" />

/// <reference path="../core/lang.ts" />
/// <reference path="../core/util.ts" />
/// <reference path="../gj7/constants.ts" />

// Z levels for this particular game.

enum ZLevelWorld {
	BG = 10,
	Carpet = 20,
	Blood = 22,
	LockOn = 24,
	Item = 26,
	Sparkle = 28,
	Object = 30,
	Building = 40,
	Lighting = 45,
	Top = 50,
	AboveTop = 55,
	Flags = 57,
	Particles = 60,
	// TODO: remove HUD when possible
	HUD = 70,
	HUDLower = 72,
	HUDMiddle = 74,
	HUDTop = 76,
	DEBUG = 9000
}

enum ZLevelHUD {
	Lighting = 0,
	Back = 5,
	Mid = 10,
	Front = 20,
	Overlay = 30,
	Points = 40,
	Particles = 50,
	Button = 80,

	PlayerHUD = 200,
	PlayerHUDBottom = 201,  // frame background, weapon board
	PlayerHUDMid = 202, // portrait, hud board, weapon icons
	PlayerHUDTop = 203, // frame, hearts, weapon selector

	Wash = 500,

	BigOverlay = 600, // vanquished, controls text

	ComboWash = 700,

	PausedWash = 800,
	PausedText = 801,

	Letterbox = 900,

	Curtain = 1000,
	Notification = 2000,

	DEBUG = 9000
}

// Keep StageTarget and ZLevelEnums in sync, please!
enum StageTarget {
	World = 0,
	HUD
}
const ZLevelEnums = [
	ZLevelWorld,
	ZLevelHUD
]

/**
 * These Z levels should have particle container stages used rather than normal
 * continers.
 */
const ParticleContainerZs = new Map<StageTarget, Set<number>>([
	[StageTarget.World, new Set([ZLevelWorld.Particles, ZLevelWorld.Blood])],
	[StageTarget.HUD, new Set([ZLevelHUD.Particles])],
])

namespace Stage {

	/**
	 * Base class for on-screen objects.
	 */
	export interface DisplayObject extends PIXI.DisplayObject {
		z: ZLevelWorld | ZLevelHUD
		stageTarget: StageTarget
	}

	// Implementing objects

	export class Container extends PIXI.Container implements DisplayObject {
		constructor(public z: ZLevelWorld | ZLevelHUD, public stageTarget: StageTarget, initChildren: PIXI.DisplayObject[] = []) {
			super();
			for (let c of initChildren) {
				this.addChild(c);
			}
		}
	}

	export class Layer extends PIXI.display.Layer implements DisplayObject {
		constructor(public z: ZLevelWorld | ZLevelHUD, public stageTarget: StageTarget) {
			super();
		}
	}

	export class Graphics extends PIXI.Graphics implements DisplayObject {
		constructor(public z: ZLevelWorld | ZLevelHUD, public stageTarget: StageTarget) {
			super();
		}
	}

	export class Sprite extends PIXI.Sprite implements DisplayObject {
		constructor(
			texture: PIXI.Texture,
			public z: ZLevelWorld | ZLevelHUD,
			public stageTarget: StageTarget) {
			super(texture);
		}


		static build(img: string, z: ZLevelWorld | ZLevelHUD,
			stageTarget: StageTarget, position: Point,
			anchor: Point = new Point(0, 1)): Sprite {
			let sprite = new Sprite(PIXI.Texture.fromFrame(img), z, stageTarget);
			sprite.anchor.set(anchor.x, anchor.y);
			sprite.position.set(position.x, position.y);
			return sprite;
		}
	}

	export class GameText extends PIXI.Text implements DisplayObject {
		constructor(
			text: string,
			style: PIXI.TextStyle,
			public z: ZLevelWorld | ZLevelHUD,
			public stageTarget: StageTarget) {
			super(text, style);
		}
	}

	// Once we have a DisplayObject that has a ZLevel and StageTarget set, we
	// can add raw PIXI.DisplayObjects in it because each sub-object doesn't
	// need additional the Z-level bookkeeping. (In fact, sub-objects
	// *shouldn't* have this Z information because it will not be looked at by
	// any game component, and it'd be misleading to have it.) So here are some
	// utilities to build PIXI things.

	/**
	 * Helper function for creating `PIXI.Sprite`s with one-liners.
	 * @param img
	 * @param position
	 * @param anchor
	 */
	export function buildPIXISprite(img: string, position: Point,
		anchor: Point = new Point(0, 1)): PIXI.Sprite {
		let sprite = new PIXI.Sprite(PIXI.Texture.fromFrame(img));
		sprite.anchor.set(anchor.x, anchor.y);
		sprite.position.set(position.x, position.y);
		return sprite;
	}

	/**
	 * The overall stage object that levels interact with.
	 *
	 * Contains a single 'MainStageCore'.
	 *
	 * The 'MainStageCore' houses 'MultiZStage's, each of which is drawn in order
	 * (e.g. world, then HUD).
	 *
	 * Each 'MultiZStage' houses 'ZStage's, which contain objects at a certain Z
	 * level. The ZStages are "normal" containers, in that they hold
	 * DisplayObjects.
	 */
	export class MainStage {
		private stage = new MainStageCore()

		// Mapping from chosen numbers to indices.
		private mapping = new Map<StageTarget, number>()

		constructor() {
			// get all valid stage targets. Map from chosen numbers to 0-based
			// indices.
			var ts = enumSortedVals(StageTarget);
			for (var i = 0; i < ts.length; i++) {
				this.mapping.set(ts[i], i);
				this.stage.addChildAt(new MultiZStage(ts[i], ZLevelEnums[i]), i);
			}
		}

		add(obj: DisplayObject) {
			var idx = this.mapping.get(obj.stageTarget);
			var stage = this.stage.getChildAt(idx);
			stage.add(obj);
		}

		remove(obj: DisplayObject) {
			var idx = this.mapping.get(obj.stageTarget);
			var stage = this.stage.getChildAt(idx);
			stage.remove(obj);
		}

		render(renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer): void {
			renderer.render(this.stage);
		}

		/*
		 * Get a particular stage. This is done only for the camera (normally it
		 * shouldn't be needed).
		 */
		camera_get(t: StageTarget): MultiZStage {
			return this.stage.getChildAt(t);
		}
	}

	/**
	 * Should only exist as the overall stage in a MainStage instance.
	 */
	class MainStageCore extends PIXI.display.Stage {
		children: MultiZStage[]

		@override
		getChildAt(index: number): MultiZStage {
			if (index < 0 || index >= this.children.length) {
				throw new Error('getChildAt: Supplied index ' + index + ' does not exist in the child list, or the supplied DisplayObject is not a child of the caller');
			}
			return this.children[index];
		}
	}

	/**
	 * Stage with multiple z-levels. 'World' and 'HUD' are examples of
	 * 'MultiZStage's.
	 */
	export class MultiZStage extends PIXI.Container {
		children: ZStage[]

		// Mapping from chosen Z numbers to container indices.
		public mapping: Map<number, number> = new Map<number, number>()

		// Pre-create our z-level stages.
		constructor(stagetTarget: StageTarget, z_enum: any) {
			super();

			// anchor the stage itself

			// Get all valid stage targets. Map from chosen numbers to 0-based
			// indices.
			var zs = enumSortedVals(z_enum);
			for (var i = 0; i < zs.length; i++) {
				this.mapping.set(zs[i], i);

				// decide whether the z stage is going to be a standard
				// container or a particle one.
				let zStage: ZStage
				if (ParticleContainerZs.get(stagetTarget).has(zs[i])) {
					zStage = new PIXI.particles.ParticleContainer(
						undefined, {
						alpha: true,
						position: true,
						rotation: true,
						vertices: true,
						tint: true,
						uvs: true,
					},
					);
				} else {
					zStage = new PIXI.Container();
				}

				// plop it in
				this.addChildAt(zStage, i);
			}
		}

		@override
		getChildAt(index: number): ZStage {
			if (index < 0 || index >= this.children.length) {
				throw new Error('getChildAt: Supplied index ' + index + ' does not exist in the child list, or the supplied DisplayObject is not a child of the caller');
			}
			return this.children[index];
		}

		add(obj: DisplayObject) {
			var idx = this.mapping.get(obj.z);
			var stage = this.getChildAt(idx);

			// TODO: Track indices ourself so we can do 2n removal instead of
			// n.
			stage.addChild(obj);
		}

		remove(obj: DisplayObject) {
			var idx = this.mapping.get(obj.z);
			var stage = this.getChildAt(idx);
			// TODO: Track indices ourself so we can do 2n removal instead of
			// n.
			stage.removeChild(obj);
		}

		/**
		 * Call this on The World MultiZStage to get the game world min & max x,
		 * y coordinates of the visible area. (Used, e.g., for audio culling
		 * sound effects.)
		 *
		 * @param viewportDims
		 * @param outMin
		 * @param outMax
		 * @param buffer Widen bounds by this much on each side (so 2x per
		 * dimension) to be a bit generous about some bounds checking (e.g., for
		 * audio effects near the border).
		 */
		getViewBounds(viewportDims: Point, outMin: Point, outMax: Point, buffer: number = 0): void {
			let minX = -(this.x / this.scale.x);
			let minY = -(this.y / this.scale.y);

			let w = viewportDims.x / this.scale.x;
			let h = viewportDims.y / this.scale.y;

			outMin.set_(minX - buffer, minY - buffer);
			outMax.set_(minX + w + buffer, minY + h + buffer);
		}
	}

	/**
	 * Single z-level container; contains all objects at a certain z level.
	 */
	export type ZStage = PIXI.Container | PIXI.particles.ParticleContainer

	export class Translator {
		private cacheHUDPos = new PIXI.Point()
		private cacheWorldPos = new PIXI.Point()

		constructor(
			private hud: Stage.MultiZStage, private world: Stage.MultiZStage,
			private viewportSize: Point, private gameScale: number) { }

		/**
		 * Transforms the provided point from world to hud coordinates. Mutates
		 * the point. Also returns it, for convenience (no new Points are
		 * created).
		 */
		worldToHUD(point: Point): Point {
			// world -> hud coordinates
			let wp = this.cacheWorldPos;
			let hp = this.cacheHUDPos;
			wp.set(point.x, point.y)
			this.hud.toLocal(wp, this.world, hp, true); // sets results into hp
			point.set_(hp.x, hp.y);
			return point;
		}

		/**
		 * Transforms the provided point from HUD (raw, actual) coordinates to
		 * HUD *base* (640 x 360) coordinates. Returns the same point for
		 * convenience. No new points are created.
		 */
		HUDtoHUDBase(point: Point): Point {
			return point.set_(
				Math.round((point.x / this.viewportSize.x) * 640),
				Math.round((point.y / this.viewportSize.y) * 360));
		}

		/**
		 * Transforms the provided point from world to HUD *base* (640 x 360)
		 * (unscaled) coordinates. Returns the same point for convenience. No
		 * new points are created.
		 */
		worldToHUDBase(point: Point): Point {
			return this.HUDtoHUDBase(this.worldToHUD(point));
		}

		/**
		 * Transforms the provided point from HUD base (640 x 360) coordinates
		 * coordinates to (raw, actual) HUD (likely 720p or 1080p) coordinates.
		 * Returns the same point for convenience. No new points are created.
		 */
		HUDbaseToHUD(point: Point): Point {
			return point.set_(
				Math.round((point.x / 640) * this.viewportSize.x),
				Math.round((point.y / 360) * this.viewportSize.y));
		}

		/**
		 * Transforms the provided point from HUD (raw, actual) coordinates
		 * (e.g., 720p or 1080p) to world coordinates. Returns the same point
		 * for convenience. No new points are created.
		 */
		HUDtoWorld(point: Point): Point {
			// hud -> world coordinates
			let wp = this.cacheWorldPos;
			let hp = this.cacheHUDPos;
			hp.set(point.x, point.y)
			this.world.toLocal(hp, this.hud, wp, true); // sets results into wp
			point.set_(wp.x, wp.y);
			return point;
		}

		/**
		 * Transforms the provided point from HUD base (640 x 360) coordinates
		 * coordinates to world coordinates. Returns the same point for
		 * convenience. No new points are created.
		 */
		HUDBaseToWorld(point: Point): Point {
			return this.HUDtoWorld(this.HUDbaseToHUD(point));
		}
	}
}
