/// <reference path="../core/base.ts" />
/// <reference path="../core/tween.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/stage.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/camera-followable.ts" />

namespace System {

	/**
	 * Simple class that tries to follow something marked followable. Should
	 * only have one of those.
	 */
	export class FollowCamera extends Engine.System {
		// settings
		roomWeight = 0.7
		interpFrames = 60;

		// cached state (would be in aspect, but only at most one entity for
		// this system, so just storing here).
		interpStartPos = new Point(-1, -1)
		interpFramesReamining = 0;
		lastInRoom = true;

		public componentsRequired = new Set<string>([
			Component.Position.name,
			Component.CameraFollowable.name,
		])

		constructor(private stage: Stage.MultiZStage, private viewportDims: Point,
				private sceneInfoProvider: Scene.InfoProvider, private zones: ZoneSelector) {
			super();
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			// should be exactly one player (just follow first if more than one).
			if (entities.size == 0) {
				return;
			}
			let aspect = entities.values().next().value;

			// this is where the follow target is
			let position = aspect.get(Component.Position);

			// by default we follow the player
			let centerX = position.p.x
			let centerY = position.p.y;

			// however! if any room has the player in it, weight to the center
			// of the room instead. this supports only one room.
			let inRoom = false;
			for (let zoneEntity of this.zones.latest()) {
				let zoneComps = this.ecs.getComponents(zoneEntity);
				let zoneComp = zoneComps.get(Component.Zone);
				if (!zoneComp.zoneTypes.has(Logic.ZoneType.Camera) ||
					!zoneComp.containsPlayer) {
					continue;
				}

				// camera zone with player! extract and break immediately.
				let roomPos = zoneComps.get(Component.Position);
				let roomBox = zoneComps.get(Component.CollisionShape);
				let roomCenterX = roomPos.p.x;
				let roomCenterY = roomPos.p.y;
				centerX = this.roomWeight*roomCenterX + (1.0-this.roomWeight)*centerX;
				centerY = this.roomWeight*roomCenterY + (1.0-this.roomWeight)*centerY;
				inRoom = true;
				break;
			}

			// transitioning between rooms makes us interpolate. also update
			// this state.
			let interpStart = false;
			if (this.lastInRoom != inRoom) {
				this.interpFramesReamining = this.interpFrames;
				this.interpStartPos.set_(this.stage.x, this.stage.y);
				interpStart = true;
			}
			this.lastInRoom = inRoom;

			// approach: figure out desired position and either move there
			// directly or interpolate.

			// first figure out size of viewport
			let w = this.viewportDims.x / this.stage.scale.x;
			let h = this.viewportDims.y / this.stage.scale.y;

			// we want the stage to be cornered at this location
			let targetX = centerX - w/2;
			let targetY = centerY - h/2;

			// clamping
			let levelDims = this.sceneInfoProvider.mapDims;
			targetX = Math.min(Math.max(targetX, 0), levelDims.x - w);
			targetY = Math.min(Math.max(targetY, 0), levelDims.y - h);

			// stage coordinates get scaled with its scale. (also stage
			// coordinates are negative because we're moving the stage
			// *under* the viewport (i.e. in reverse)).
			targetX = (-targetX) * this.stage.scale.x;
			targetY = (-targetY) * this.stage.scale.y;

			// if starting the game, or in a room, move directly
			if ((this.stage.x == 0 && this.stage.y == 0) || this.interpFramesReamining == 0) {
				this.stage.x = targetX;
				this.stage.y = targetY;
			} else {
				// for transitions, interpolate. isn't totally vanilla easing
				// because the target is changing per frame as the player
				// moves.
				let elapsed = this.interpFrames - this.interpFramesReamining;
				let p = Tween.easeOutCubic(elapsed, this.interpFrames);
				this.stage.x = this.interpStartPos.x + p * (targetX - this.interpStartPos.x);
				this.stage.y = this.interpStartPos.y + p * (targetY - this.interpStartPos.y);;
				this.interpFramesReamining--;
			}
		}
	}
}
