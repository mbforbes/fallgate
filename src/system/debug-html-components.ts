/// <reference path="../component/debug-inspection.ts" />

namespace System {

	class DebugHTMLComponentsAspect extends Engine.Aspect {
		title: HTMLHeadingElement
		table: HTMLTableElement
		cellmap = new Map<string, HTMLTableCellElement>()
		rowkeys = new Array<string>()

		constructor() {
			super();

			this.title = document.createElement('h2');
			this.table = document.createElement('table');
		}
	}

	function fillRow(row: HTMLTableRowElement, cName: string, cToString: string): HTMLTableCellElement {
		let k = document.createElement('td');
		k.innerText = cName;

		let v = document.createElement('td');
		v.innerText = cToString;
		v.className = 'lcvVal';

		row.appendChild(k);
		row.appendChild(v);
		return v;
	}

	/**
	 * Renders components for an entity (the entity marked by the
	 * Component.DebugInspection) as an HTML table.
	 */
	export class DebugHTMLComponents extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.DebugInspection.name,
		])

		/**
		 *
		 * @param el The element to render our debug views to.
		 */
		constructor(private el: HTMLElement) {
			super(false, true);

			// for fun
			let decoration = document.createElement('h2');
			decoration.style.fontStyle = 'italic'
			decoration.innerText = '\u{26A1} Lightning Component Viewer v1.0'
			el.appendChild(decoration);
		}

		@override
		public makeAspect(): DebugHTMLComponentsAspect {
			return new DebugHTMLComponentsAspect();
		}

		@override
		public onAdd(aspect: DebugHTMLComponentsAspect): void {
			aspect.title.innerText = aspect.entity.toString();
			this.el.appendChild(aspect.title);
			this.el.appendChild(aspect.table);
		}

		@override
		public onRemove(aspect: DebugHTMLComponentsAspect): void {
			this.el.removeChild(aspect.title);
			this.el.removeChild(aspect.table);
		}

		private updateTable(aspect: DebugHTMLComponentsAspect): void {
			let ti = 0;
			for (let [cName, cToString] of aspect.debugComponentTable()) {
				let pastTable = ti >= aspect.rowkeys.length;

				// - check whether stale table row(s) exist
				//	 known: if table row key < component
				//	 do: remove (keep ti) while row key < component
				while (!pastTable && aspect.rowkeys[ti] < cName) {
					aspect.cellmap.delete(aspect.rowkeys[ti]);
					aspect.rowkeys.splice(ti, 1);
					aspect.table.deleteRow(ti);
				}

				// - check component missing table row
				//	 known: if table row key > component
				//	 do: add table row at the location, increment ti
				if (pastTable || aspect.rowkeys[ti] > cName) {
					// todo: refactor w/ above
					let row = aspect.table.insertRow(ti);
					let vCell = fillRow(row, cName, cToString);
					aspect.cellmap.set(cName, vCell);
					aspect.rowkeys.splice(ti, 0, cName);
					ti++;
					continue;
				}

				// - check match
				//	 known: if table row key === component
				//	 do: update entry
				if (aspect.rowkeys[ti] === cName) {
					// update contents
					aspect.cellmap.get(cName).innerText = cToString;
					ti++;
					continue;
				}

				// Should never get here.
				throw new Error('Coding assumption error!');
			}
		}

		private render(aspect: DebugHTMLComponentsAspect): void {
			this.updateTable(aspect);
		}

		public update(delta: number, entities: Map<Engine.Entity, DebugHTMLComponentsAspect>): void {
			if (entities.size == 0) {
				return
			} else if (entities.size > 1) {
				this.el.innerText = 'ERROR: > 1 Entities w/ Component.DebugInspection.';
				return;
			}

			// render first (and only)
			this.render(entities.values().next().value);
		}
	}
}
