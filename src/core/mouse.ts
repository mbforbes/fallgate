/// <reference path="../../lib/pixi.js.d.ts" />

/// <reference path="../core/base.ts" />

class Mouse {

	public hudPosition = new PIXI.Point()
	public leftDown = false
	public rightDown = false

	constructor(private resolution: Point) {
		window.addEventListener("mousemove", (e: MouseEvent) => { this.onMove(e) });
		window.addEventListener("mousedown", (e: MouseEvent) => { this.onDown(e) });
		window.addEventListener("mouseup", (e: MouseEvent) => { this.onUp(e) });
	}

	private onDown(event: MouseEvent): void {
		if (event.button == 0) {
			this.leftDown = true;
		} else if (event.button == 2) {
			this.rightDown = true;
		}
	}

	private onUp(event: MouseEvent): void {
		if (event.button == 0) {
			this.leftDown = false;
		} else if (event.button == 2) {
			this.rightDown = false;
		}
	}

	private onMove(event: MouseEvent): void {
		// hack so we can access more stuff on the document than Typescript
		// knows exists
		let d: any = document;
		if (d.fullscreenElement || d.webkitFullscreenElement) {
			// fullscreen. compute scaling by figuring out which dimension is
			// stretched, calculate whether X offset exists, and then apply
			// scaling and offset.
			let gameRatio = this.resolution.x / this.resolution.y;
			let screenRatio = screen.width / screen.height;
			let heightLimiting = screenRatio >= gameRatio;
			let scaleFactor = 1;
			let offsetX = 0;
			let offsetY = 0;
			if (heightLimiting) {
				// black bars on the sides (or perfect match)
				scaleFactor = screen.height / this.resolution.y;
				let scaleWidth = scaleFactor * this.resolution.x;
				offsetX = Math.max(0, (screen.width - scaleWidth) / 2) / scaleFactor;
			} else {
				// width limiting (black bars on the top and bottom)
				scaleFactor = screen.width / this.resolution.x;
				let scaleHeight = scaleFactor * this.resolution.y;
				offsetY = Math.max(0, (screen.height - scaleHeight) / 2) / scaleFactor;
			}
			this.hudPosition.set(
				-offsetX + event.pageX / scaleFactor,
				-offsetY + event.pageY / scaleFactor);
		} else {
			// in the page
			this.hudPosition.set(event.offsetX, event.offsetY);
		}
	}
}
