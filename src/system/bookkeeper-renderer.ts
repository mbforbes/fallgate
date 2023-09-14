/// <reference path="../../lib/pixi.js.d.ts" />

/// <reference path="../engine/ecs.ts" />

namespace System {

	export class BookkeeperRenderer extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Dummy.name,
		])

		// dobjs: { [key: string]: Stage.GameText } = {
		dobjs = {
			curLabel: null,
			curHms: null,
			curDecimal: null,
			totLabel: null,
			totHms: null,
			totDecimal: null,
		}

		constructor(stage: Stage.MainStage, viewportDims: Point, startDisabled: boolean = true) {
			super(startDisabled);

			let baseStyle = {
				align: 'right',
				fontFamily: [
					"Consolas", "Mono", "Courier New", "Monospace",
				],
				fontSize: 1,
				fontWeight: "bold",
				fill: "#e7e7e7",
				dropShadow: true,
				dropShadowColor: "#000000",
				dropShadowDistance: 2,
				dropShadowBlur: 5,
				dropShadowAngle: 2.35,
				dropShadowAlpha: 0.4
			}
			let labelStyle = clone(baseStyle);
			labelStyle.fontSize = 18;
			let hmsStyle = clone(baseStyle);
			hmsStyle.fontSize = 25;
			let decimalStyle = clone(baseStyle);
			decimalStyle.fontSize = 18;

			let buffer = 8;  // space to pad bottom and side of screen
			let spacingH = 54;  // in between LEVEL and TOTAL sections
			let decimalW = 42;  // width of decimal section
			let textH = 18;  // height of label text to put stuff above
			let squeezeY = 2;  // amount to pull larger font text down to align

			this.dobjs.curLabel = new Stage.GameText('LEVEL', labelStyle as PIXI.TextStyle, ZLevelHUD.DEBUG, StageTarget.HUD)
			this.dobjs.curLabel.position.set(viewportDims.x - buffer, viewportDims.y - buffer - spacingH);
			this.dobjs.curHms = new Stage.GameText('', hmsStyle as PIXI.TextStyle, ZLevelHUD.DEBUG, StageTarget.HUD)
			this.dobjs.curHms.position.set(viewportDims.x - buffer - decimalW, viewportDims.y - buffer - textH - spacingH + squeezeY);
			this.dobjs.curDecimal = new Stage.GameText('', decimalStyle as PIXI.TextStyle, ZLevelHUD.DEBUG, StageTarget.HUD)
			this.dobjs.curDecimal.position.set(viewportDims.x - buffer, viewportDims.y - buffer - textH - spacingH);

			this.dobjs.totLabel = new Stage.GameText('TOTAL', labelStyle as PIXI.TextStyle, ZLevelHUD.DEBUG, StageTarget.HUD)
			this.dobjs.totLabel.position.set(viewportDims.x - buffer, viewportDims.y - buffer);
			this.dobjs.totHms = new Stage.GameText('', hmsStyle as PIXI.TextStyle, ZLevelHUD.DEBUG, StageTarget.HUD)
			this.dobjs.totHms.position.set(viewportDims.x - buffer - decimalW, viewportDims.y - buffer - textH + squeezeY);
			this.dobjs.totDecimal = new Stage.GameText('', decimalStyle as PIXI.TextStyle, ZLevelHUD.DEBUG, StageTarget.HUD)
			this.dobjs.totDecimal.position.set(viewportDims.x - buffer, viewportDims.y - buffer - textH);

			for (let dobjName in this.dobjs) {
				let dobj = this.dobjs[dobjName];
				dobj.anchor.set(1, 1);
				dobj.visible = !startDisabled;
				stage.add(dobj);
			}
		}

		@override
		public onDisabled(entities: Map<Engine.Entity, Engine.Aspect>): void {
			for (let dobjName in this.dobjs) {
				this.dobjs[dobjName].visible = false;
			}
		}

		@override
		public onEnabled(entities: Map<Engine.Entity, Engine.Aspect>): void {
			for (let dobjName in this.dobjs) {
				this.dobjs[dobjName].visible = true;
			}
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {
			let source = this.ecs.getSystem(System.Bookkeeper);
			let [level, total] = source.debugElapsed();
			let [levelHms, levelDecimal] = level;
			this.dobjs.curHms.text = levelHms;
			this.dobjs.curDecimal.text = levelDecimal;
			let [totalHms, totalDecimal] = total;
			this.dobjs.totHms.text = totalHms;
			this.dobjs.totDecimal.text = totalDecimal;
		}
	}
}
