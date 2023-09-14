/// <reference path="../../lib/pixi.js.d.ts" />
namespace Game {

	export interface ReadySignal {
		done(): void
	}

	export interface Game {
		load2(ready: ReadySignal)
		update(wallDelta: number, gameDelta: number): void
		render(): void
	}

	export enum Mode {
		DEBUG = 0,
		RELEASE,
	}

	/**
	 * Main game config JSON.
	 */
	export type Config = {
		mode: string,
		subConfigs: {
			attributes: string,
			controls: string,
			credits: string,
			factory: string,
			fx: string,
			gameSettings: string,
			gui: string,
			instructions: string,
			particles: string,
			scenes: string,
			seasons: string,
			shields: string,
			sounds: string,
			spritesheetJson: string,
			weapons: string,
		}
	}
}
