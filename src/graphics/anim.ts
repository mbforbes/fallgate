namespace Anim {

	export enum PlayType {
		Loop = 0,
		PingPong,
		PlayAndHold,
	}

	export enum AlignType {
		/**
		 * Center is where the 'core' parts' textures are anchored. This is the
		 * position of the sprite.
		 */
		Center = 0,

		/**
		 * TextureOrigin is the bottom-left corner of the core body part's
		 * texture. This is position + rotation-aware anchor offset.
		 */
		TextureOrigin,
	}

	/**
	 * Anim.Align describes how Animations should be positioned. This was
	 * created for non-Core body parts to track the Core body part, but the Core
	 * body parts use it too (with the defaults).
	 */
	export type Align = {
		alignType: AlignType,
		extraOffset: Point
	}

	/**
	 * Helper for getting default Align.
	 */
	function defaultAlign(): Align {
		return {
			alignType: AlignType.Center,
			extraOffset: new Point(),
		}
	}

	/**
	 * Animation data is the essential info for generating, positioning, and
	 * playing an animation. TODO: Refactor with BaseData.
	 */
	export type Data = {
		frameBase: string
		nFrames: number,
		speed: number,
		playType: PlayType,
		anchor: Point,
		alpha: number,
		tint?: number,
		scale?: number,
		align: Align,
	}

	export function cloneData(orig: Data): Data {
		if (orig == null) {
			return null
		}

		// clone does primitives
		let res = clone(orig);

		// then we apply fixups

		// these all aren't technically null-able, but other code that copied
		// this did these checks, so doing here; may want to remove or make all
		// these things explicitly nullable.
		if (orig.anchor != null) {
			res.anchor = orig.anchor.copy();
		}
		if (orig.align != null && orig.align.extraOffset != null) {
			res.align.extraOffset = orig.align.extraOffset.copy();
		}

		return res;
	}

	/**
	 * Helper to get Data using defaults.
	 */
	export function getData(
			frameBase: string,
			nFrames: number,
			speed: number,
			playType: PlayType = PlayType.Loop,
			anchor: Point = new Point(0.5, 0.5),
			align: Align = defaultAlign(),
			alpha: number = 1.0,
			tint: number = 0xffffff,
			scale: number = 1.0): Data {
		return {
			frameBase: frameBase,
			nFrames: nFrames,
			speed: speed,
			playType: playType,
			anchor: anchor,
			alpha: alpha,
			tint: tint,
			scale: scale,
			align: {
				alignType: align.alignType,
				extraOffset: align.extraOffset.copy(),
			},
		}
	}

	export type Key = string
	export type AnimMap = Map<Key, Data>

	export function getKey(action: Action, part: Part, partID: PartID): Key {
		return Action[action] + ',' + Part[part] + ',' + PartID[partID];
	}

	export function splitKey(key: Key): [Action, Part, PartID] {
		let [a, p, pid] = key.split(',');
		return [Action[a], Part[p], PartID[pid]];
	}

	export const DefaultKey = getKey(Action.Idle, Part.Core, PartID.Default)

	export function convertActivity(activitySpec: ActivitySpec): Activity {
		// start with defaults
		let res: Activity = {
			startAction: Action.INVALID,
			manual: false,
		}

		// fill in any specified values.
		if (activitySpec.startAction != null) {
			let startAction = Action[activitySpec.startAction];
			if (startAction == null) {
				throw new Error('Unknown Action: "' + activitySpec.startAction + '".');
			};
			res.startAction = startAction;
		}
		if (activitySpec.manual != null) {
			res.manual = activitySpec.manual;
		}

		return res;
	}

	/**
	 * Returns a new animation map w/ base entries of `parent` and extensions
	 * and overrides in `child`. Cloning is used such that all of the values
	 * are new (so no object pointers point back to `parent` or `child`).
	 */
	export function extendAnims(parent: AnimMap, child: AnimMap): AnimMap {
		let anims = new Map<Anim.Key, Anim.Data>();
		for (let base of [parent, child]) {
			for (let [key, data] of base.entries()) {
				anims.set(key, Anim.cloneData(data));
			}
		}
		return anims;
	}

	/**
	 * Internal representation. For interpretation, see below in ActivitySpec.
	 */
	export type Activity = {
		startAction: Action,
		manual: boolean,
	}

	/**
	 * Specified externally.
	 */
	export type ActivitySpec = {
		/**
		 * What action to begin with. If unset, defaults to Action.INVALID.
		 */
		startAction?: string,

		/**
		 * Whether that the Activity will always be changed manually (by some
		 * game logic) --- this makes the Activity system skip over it.
		 * Defaults to false.
		 */
		manual?: boolean,
	}

	/**
	 * Note that this preserves null (missing) `scale` settings for animted
	 * sprites rather than setting the default of 1 so that the animation can
	 * be globally scaled up when its scale factor is missing. Because of this,
	 * other usages of basespec/basedata (like gui sprites) need to set the
	 * scale = 1 default themselves.
	 */
	export function convertBaseSpec(baseSpec: BaseSpec): BaseData {
		// check enum conversion
		let pt = PlayType[baseSpec.playType as string];
		if (pt == null) {
			throw new Error('Got invalid PlayType: "' + baseSpec.playType +	 '"');
		}

		return {
			base: baseSpec.base,
			frames: baseSpec.frames,
			speed: baseSpec.speed,
			playType: pt,
			anchor: (baseSpec.anchor ? Point.from(baseSpec.anchor) : new Point(0.5, 0.5)),
			alpha: (baseSpec.alpha != null ? baseSpec.alpha : 1),
			tint: (baseSpec.tint != null ? parseInt(baseSpec.tint.slice(1), 16) : null),
			scale: (baseSpec.scale != null ? baseSpec.scale : null),
			width: baseSpec.width,
			height: baseSpec.height,
		}
	}

	export function convertDisplaySpec(displaySpec: DisplaySpec): DisplayData {
		let st: StageTarget = StageTarget[displaySpec.stageTarget];
		if (st == null) {
			throw new Error('Unknown StageTarget: "' + displaySpec.stageTarget + '"');
		}

		let z: number;
		if (st === StageTarget.World) {
			z = ZLevelWorld[displaySpec.z];
		} else if (st === StageTarget.HUD) {
			z = ZLevelHUD[displaySpec.z];
		} else {
			throw new Error('Programming error StageTarget: "' + st + '" not handled.');
		}
		if (z == null) {
			throw new Error('Unknown z level: "' + displaySpec.z + '"');
		}

		return {
			stageTarget: st,
			z: z,
		}
	}

	/**
	 * Converts external Spec to internal Key and Data representations.
	 *
	 * TODO: refactor to use getData(...)
	 *
	 * @param spec
	 */
	export function convertSpec(spec: Spec): [Key, Data] {
		// get data
		let baseData = convertBaseSpec(spec.baseSpec);
		let alignType: AlignType = spec.alignType ? AlignType[spec.alignType] : AlignType.Center;
		let extraOffset: Point = spec.extraOffset ? Point.from(spec.extraOffset) : new Point(0, 0);
		let ad: Data = {
			frameBase: baseData.base,
			nFrames: baseData.frames,
			speed: baseData.speed,
			playType: baseData.playType,
			anchor: baseData.anchor,
			alpha: baseData.alpha,
			tint: baseData.tint,
			scale: baseData.scale,
			align: {
				alignType: alignType,
				extraOffset: extraOffset,
			}
		}

		// get key. || handles undefined, null, and no key.
		let action: Action = Action[spec.action];
		if (action == null) {
			throw new Error('Invalid Action: "' + spec.action +'". See enum Action for options');
		}
		let part: Part = spec.part ? Part[spec.part] : Part.Core
		let partID: PartID = spec.partID ? PartID[spec.partID] : PartID.Default;
		let ak: Key = getKey(action, part, partID);

		return [ak, ad];
	}

	/**
	 * Internal representation of BaseSpec.
	 */
	export type BaseData = {
	   base: string,
	   frames: number,
	   speed: number,
	   playType: PlayType,
	   anchor: Point,
	   alpha: number,
	   tint?: number,
	   scale: number,
	   width?: number,
	   height?: number,
	}

	/**
	 * Specified externally. This is used as a component for full game
	 * entities, and as the complete spec for lighter weight game entities
	 * (like GUI components) that don't require all of the body part
	 * computations and intra-body part alignment.
	 */
	export type BaseSpec = {
		/**
		 * Frame base on which #.png makes a frame.
		 */
		base: string,

		/**
		 * How many frames.
		 */
		frames: number,

		/**
		 * ms per frame.
		 */
		speed: number,

		/**
		 * One of enum PlayType.
		 */
		playType: string,

		/**
		 * Where the animation is anchored. Default to [0.5, 0.5].
		 */
		anchor?: number[],

		/**
		 * Defaults to 1.
		 */
		alpha?: number,

		/**
		 * Hex string of tint color. Defaults to null (no tint).
		 */
		tint?: string,

		/**
		 * Defaults to 1. NOTE: width and height OVERRIDE this if provided.
		 */
		scale?: number,

		/**
		 * Only used as an override of natural width if provided. NOTE: This
		 * OVERRIDES scale if provided.
		 */
		width?: number,

		/**
		 * Only used as an override of natural height if provided. NOTE: This
		 * OVERRIDES scale if provided.
		 */
		height?: number,

	}

	/**
	 * Internal representation of `DisplaySpec`.
	 */
	export type DisplayData = {
		stageTarget: StageTarget,
		z: ZLevelHUD|ZLevelWorld,
	}

	/**
	 * Specified externally. The z level information isn't present in the
	 * animation specs for "standard" game objects because their properties are
	 * given in the map (via DrawLayer). However, for things like GUI objects,
	 * we want to be able to cleanly specify them in the animation. (In fact,
	 * this probably *should* be part of all other animatable objects
	 * eventually..).
	 */
	export type DisplaySpec = {
		/**
		 * One of the names in the `StageTarget` enum ('World' or 'HUD').
		 */
		stageTarget: 'World' | 'HUD',

		/**
		 * Should be one of the names in the relevant enum, which depends on the stageTarget picked:
		 * - `StageTarget.World`: `ZLevelWord.*`
		 * - `StageTarget.HUD`: `ZLevelHUD.*`
		 */
		z: string,
	}

	/**
	 * Global customization for an entire set of animations.
	 */
	export type Customize = {
		tint?: string,
		scale?: number,
		hideOnDeath?: boolean,
	}

	/**
	 * Specified externally. This is used for full, standard game entities that
	 * have Actions, Body Parts, Part IDs, and support alignments within body
	 * parts.
	 */
	export type Spec = {
		/**
		 * This is the core information (the type is given above).
		 */
		baseSpec: BaseSpec,

		/**
		 * One of enum AlignType. Defaults to AlignType.Center.
		 */
		alignType?: string,

		/**
		 * Extra offset to add to alignment base position. Defaults to [0, 0].
		 */
		extraOffset?: number[],

		/**
		 * One of enum Action.
		 */
		action: string,

		/**
		 * One of enum Part. Defaults to Part.Core.
		 */
		part?: string,

		/**
		 * One of enum PartID. Defaults to PartID.Default.
		 */
		partID?: string,
	}
}
