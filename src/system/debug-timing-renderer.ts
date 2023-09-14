/// <reference path="../../lib/pixi.js.d.ts" />

/// <reference path="../engine/ecs.ts" />
/// <reference path="../engine/measurement.ts" />
/// <reference path="../graphics/stage.ts" />
/// <reference path="../component/lockon.ts" />

function sumTimes(total: number, val: Measurement.Record): number {
	return total + val.time;
}

/**
 * cont contains {bar, leftText}
 */
type RecordView = {
	cont: Stage.Container,
	bar: PIXI.Sprite,
	leftText: PIXI.Text,
}

/**
 * cont contains header and all RecordView.cont objects
 */
type SectionView = {
	cont: Stage.Container,
	header: PIXI.Text,
	records: Map<string, RecordView>,
}

namespace System {

	/**
	 * Renders timing breakdown of various game stuff.
	 */
	export class DebugTimingRenderer extends Engine.System {

		// settings
		private redrawEveryFrames = 120
		private width = 150;
		private height = 15;
		private spacing = 3;
		private buffer = 5;

		// state
		private sinceLastRedraw = this.redrawEveryFrames // immediate at start
		private sectionViews = new Map<string, SectionView>()

		public componentsRequired = new Set<string>([
			Component.Dummy.name,
		])

		constructor(
			private stage: Stage.MainStage,
			private clocks: Measurement.ClockTower,
			private viewportSize: Point,
			private display: number = 15,
		) {
			super(true, true);
		}

		private ensureSectionView(section: string): SectionView {
			// build if needed
			if (!this.sectionViews.has(section)) {
				let header = new PIXI.Text(section, {
					fontFamily: 'Josefin Sans',
					fill: '#ffffff',
					fontSize: this.height,
				});
				header.alpha = 0.9;
				header.anchor.set(1, 0);
				header.position.set(this.viewportSize.x - this.buffer, 0);

				// add + track
				let cont = new Stage.Container(ZLevelHUD.DEBUG, StageTarget.HUD);
				cont.addChild(header);
				this.stage.add(cont);
				this.sectionViews.set(section, {
					cont: cont,
					header: header,
					records: new Map(),
				});
			}

			// get
			return this.sectionViews.get(section);
		}

		private ensureRecordView(sectionView: SectionView, recordName: string): RecordView {
			// create if needed
			if (!sectionView.records.has(recordName)) {
				// color stays same for recordName
				let tintStr = '#ffffff';
				let tintNum = parseInt(tintStr.slice(1), 16);

				// create the bar
				let bar = Stage.buildPIXISprite(
					'particles/particle1.png',
					new Point(0, 0),  // legit position simply set on update
					new Point(1, 0),
				);
				bar.width = 1;  // tmp
				bar.height = this.height;
				bar.alpha = 0.9;
				bar.tint = tintNum;

				// create left text
				let txt = new PIXI.Text(recordName, {
					fontFamily: 'Josefin Sans',
					fill: tintStr,
					fontSize: this.height,
				});
				txt.alpha = 0.9;
				txt.anchor.set(1, 0);

				// add + track
				let cont = new Stage.Container(ZLevelHUD.DEBUG, StageTarget.HUD);
				cont.addChild(bar);
				cont.addChild(txt);
				sectionView.records.set(recordName, {
					cont: cont,
					bar: bar,
					leftText: txt,
				});
				sectionView.cont.addChild(cont);
			}

			// return
			return sectionView.records.get(recordName);
		}

		private updateView(rv: RecordView, record: Measurement.Record, totalTime: number, i: number): void {
			let cont = rv.cont;
			cont.visible = true;
			cont.position.x = this.viewportSize.x - this.buffer;
			// this.height + this.buffer extra to make room for header
			cont.position.y = this.height + this.buffer + (this.height + this.spacing) * i;

			let bar = rv.bar;
			let portion = (record.time / totalTime);
			let barW = portion * this.width;
			bar.width = barW;

			let txt = rv.leftText;
			txt.text = record.name +
				' [' + round(record.time, 2) + 'ms] ' +
				' (' + round(portion * 100, 1) + '%)';
			txt.position.x = -(barW + this.spacing);
		}

		private redraw(): void {
			// retrieve report, iterate through sections
			let m = this.clocks.report();
			let startY = 0;
			for (let [section, records] of m.entries()) {
				this.redrawSection(section, startY, records);
				startY += this.sectionViews.get(section).cont.height + this.buffer * 2;
			}
		}

		private redrawSection(section: string, startY: number, records: Measurement.Record[]): void {
			let sectionView = this.ensureSectionView(section);
			sectionView.cont.visible = true;

			// offset entire section
			sectionView.cont.y = startY;

			// compute total time
			let totalTime = 0;
			for (let record of records) {
				totalTime += record.time;
			}

			// bookkeep all existing names so we know what to hide.
			// NOTE: making a new obj and crossing fingers stack allocated vs
			// dealing with bad existing set API
			let prevRecordNames = new Set(mapKeyArr(sectionView.records));

			// update all records in top-N
			for (let i = 0; i < records.length && i < this.display; i++) {
				let record = records[i];

				// build if necessary
				let rv = this.ensureRecordView(sectionView, record.name);

				// update
				this.updateView(rv, record, totalTime, i);
				prevRecordNames.delete(record.name);
			}

			// for any we didn't update, hide it.
			for (let entry of prevRecordNames.values()) {
				sectionView.records.get(entry).cont.visible = false
			}
			prevRecordNames.clear();
		}

		@override
		public onDisabled(entities: Map<Engine.Entity, Engine.Aspect>): void {
			for (let sectionView of this.sectionViews.values()) {
				sectionView.cont.visible = false;
			}
			this.sinceLastRedraw = this.redrawEveryFrames;  // immediately draw on enabled
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			// redraw every N frames
			this.sinceLastRedraw += 1;
			if (this.sinceLastRedraw >= this.redrawEveryFrames) {
				this.redraw();
				this.sinceLastRedraw = 0;
			}
		}

	}

}
