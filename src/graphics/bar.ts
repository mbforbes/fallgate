/// <reference path="../core/base.ts" />
/// <reference path="../graphics/stage.ts" />

namespace Stage {

	export type PixelBarSettings = {
		fillColor: number,
		outlineColor: number,
		dimensions: Point,
		// TODO: particle shape
	}

	/**
	 * Stretches a single texture to be the bar.
	 *
	 * TODO: this is gross because both this and the sprite repeat the z and
	 * stageTarget.
	 */
	export class TextureBar extends PIXI.Container {
		public portion: number = 1.0
		private sprite: Sprite

		constructor(public img: string, public z: ZLevelWorld | ZLevelHUD,
			public stageTarget: StageTarget, position: Point, public dimensions: Point) {
			super();

			this.sprite = Sprite.build(img, z, stageTarget, new Point(0, 0));
			this.sprite.width = this.dimensions.x * this.portion;
			this.sprite.height = this.dimensions.y;
			this.addChild(this.sprite);
			this.position.set(position.x, position.y);
		}

		update(): void {
			this.sprite.width = this.dimensions.x * this.portion;
		}
	}

	/**
	 * From its position, bar draws up and to the right.
	 */
	export class PixelBar extends PIXI.Container {

		public portion: number = 1.0
		private lastPortion: number = -1
		private outline: PIXI.Graphics = new PIXI.Graphics()
		private fill: PIXI.Graphics = new PIXI.Graphics()

		constructor(private settings: PixelBarSettings) {
			super();

			// static adjustments (probably move)
			this.outline.alpha = 0.5;
			this.fill.alpha = 0.8;

			this.addChild(this.outline);
			this.addChild(this.fill);
		}

		public draw(): void {
			// clear prev
			this.outline.clear();
			this.fill.clear();

			// draw outline
			this.outline.beginFill(this.settings.outlineColor);
			this.outline.drawRect(0, 0, this.settings.dimensions.x, -this.settings.dimensions.y)
			this.outline.endFill();

			// draw fill
			let width = this.portion * (this.settings.dimensions.x - 2);
			this.fill.beginFill(this.settings.fillColor);
			this.fill.drawRect(1, -1, width, -this.settings.dimensions.y + 2)
			this.fill.endFill();
		}

		public update(): void {
			// redraw if needed
			if (this.portion != this.lastPortion) {
				this.draw();
				this.lastPortion = this.portion;
			}

			// TODO: effects here somehow
			// TODO: how to do stuff like trigger particles?
		}
	}
}
