/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/collision-shape.ts" />

namespace System {

	const GRID_SIZE = 100

	function renderCell(cell: Point): string {
		return cell.x + ',' + cell.y;
	}

	function coordToCell(p: Point): Point {
		return new Point(
			Math.floor(p.x / GRID_SIZE) * GRID_SIZE,
			Math.floor(p.y / GRID_SIZE) * GRID_SIZE,
		);
	}

	function getBoxCells(p: Point, cShape: Component.CollisionShape): string[] {
		let res: string[] = [];

		let min = p.copy().addScalar_(-cShape.maxDistance);
		let max = p.copy().addScalar_(cShape.maxDistance);
		let minCell = coordToCell(min);
		for (let x = minCell.x; x <= max.x; x += GRID_SIZE) {
			for (let y = minCell.y; y <= max.y; y += GRID_SIZE) {
				res.push(renderCell(new Point(x, y)));
			}
		}

		return res;
	}

	export function getPointCell(p: Point): string {
		return renderCell(coordToCell(p));
	}

	class SpatialHashAspect extends Engine.Aspect {
		lastPoint: Point = new Point(-Infinity, -Infinity)
		lastAngle: number = Infinity
	}

	export class SpatialHash extends Engine.System {

		public grid: Map<string, Set<Engine.Entity>> = new Map()

		public componentsRequired = new Set<string>([
			Component.Position.name,
		])

		public dirtyComponents = new Set<string>([
			Component.Position.name,
		])

		@override
		public onAdd(aspect: SpatialHashAspect): void {
			this.recomputeCells(aspect);
		}

		@override
		public makeAspect(): SpatialHashAspect {
			return new SpatialHashAspect();
		}

		@override
		public onRemove(aspect: SpatialHashAspect): void {
			// remove from any previous cells
			let pos = aspect.get(Component.Position);
			while (pos.cells.length > 0) {
				this.grid.get(pos.cells.pop()).delete(aspect.entity);
			}
		}

		private recomputeCells(aspect: SpatialHashAspect): void {
			let pos = aspect.get(Component.Position);

			// remove from any previous cells
			while (pos.cells.length > 0) {
				this.grid.get(pos.cells.pop()).delete(aspect.entity);
			}

			// get current cells
			let cells: string[];
			if (aspect.has(Component.CollisionShape)) {
				cells = getBoxCells(pos.p, aspect.get(Component.CollisionShape));
			} else {
				cells = [getPointCell(pos.p)];
			}

			// add to new cells
			for (let cell of cells) {
				if (!this.grid.has(cell)) {
					this.grid.set(cell, new Set<Engine.Entity>());
				}
				this.grid.get(cell).add(aspect.entity);
			}
			pos.cells = cells;
			aspect.lastPoint.copyFrom_(pos.p);
			aspect.lastAngle = pos.angle;
		}

		public update(delta: number, entities: Map<Engine.Entity, SpatialHashAspect>, dirtyEntities: Set<Engine.Entity>): void {
			for (let entity of dirtyEntities.values()) {
				if (entity == null) {
					throw new Error('WTF');
				}
				let aspect = entities.get(entity);
				if (aspect == null) {
					throw new Error('WTF2');
				}
				this.recomputeCells(aspect);
			}
		}
	}

}
