/// <reference path="../../lib/pixi.js.d.ts" />

/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/stage.ts" />
/// <reference path="../component/position.ts" />

namespace System {

	class DebugPositionAspect extends Engine.Aspect {
		pos: Stage.Graphics
		vector: Stage.Graphics
		cleared: boolean = true
	}

	export class DebugPositionRenderer extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Position.name,
		])

		constructor(private stage: Stage.MainStage, disabled: boolean) {
			super(disabled);
		}

		@override
		public makeAspect(): DebugPositionAspect {
			return new DebugPositionAspect();
		}

		@override
		public onAdd(aspect: DebugPositionAspect): void {
			// get components
			let position = aspect.get(Component.Position);

			// create resources. save to aspect.
			aspect.pos = new Stage.Graphics(ZLevelWorld.DEBUG, StageTarget.World)
			aspect.vector = new Stage.Graphics(ZLevelWorld.DEBUG, StageTarget.World)
			for (let graphics of [aspect.pos, aspect.vector]) {
				graphics.position.set(position.p.x, position.p.y);
			}

			// save aspect state to outer renderer.
			this.stage.add(aspect.pos);
			this.stage.add(aspect.vector);
		}

		@override
		public onRemove(aspect: DebugPositionAspect): void {
			this.stage.remove(aspect.pos);
			this.stage.remove(aspect.vector);
		}

		@override
		public onDisabled(entities: Map<Engine.Entity, DebugPositionAspect>): void {
			for (let aspect of entities.values()) {
				aspect.pos.clear();
				aspect.vector.clear();
				aspect.cleared = true;
			}
		}

		private maybeDraw(aspect: DebugPositionAspect, pos: Component.Position): void {
			if (!aspect.cleared) {
				return;
			}

			// draw location + angle in red
			aspect.pos.clear();
			aspect.pos.beginFill(0xff0000, 0.7);
			aspect.pos.drawCircle(0, 0, 3);
			aspect.pos.endFill();

			aspect.cleared = false;
		}

		public update(delta: number, entities: Map<Engine.Entity, DebugPositionAspect>): void {
			// Update internal positions. (Currently assuming dims never changes.)
			for (let aspect of entities.values()) {
				let position = aspect.get(Component.Position);

				// always update internal positions

				aspect.pos.x = position.p.x;
				aspect.pos.y = position.p.y;

				aspect.vector.x = position.p.x;
				aspect.vector.y = position.p.y;

				// maybe redraw location and RO (only if cleared)
				this.maybeDraw(aspect, position);

				// always redraw vector because i don't trust pixi's rotation
				let len = 25;
				aspect.vector.clear();
				aspect.vector.lineStyle(3, 0xff0000, 0.7);
				aspect.vector.moveTo(0, 0);
				aspect.vector.lineTo(len*Math.cos(position.angle), -len*Math.sin(position.angle));
				// aspect.vector.lineTo(len, 0);
			}
		}
	}
}
