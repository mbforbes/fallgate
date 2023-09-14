namespace Graphics {

	export enum LightbulbSize {
		Small = 0,
		Medium,  // default
		Large,
	}

	export type LightbulbSpec = {
		size?: string,
		baseTint?: string,
		flicker?: boolean,
	}

	export type LightbulbData = {
		size: LightbulbSize,
		baseTint: number,
		flicker: boolean,
	}

	export function convertLightbulbSpec(spec: LightbulbSpec): LightbulbData {
		// set default, and check enum conversion
		let size = 'Medium';
		if (spec.size != null) {
			size = spec.size;
		}
		let ls: LightbulbSize = LightbulbSize[size];
		if (ls == null) {
			throw new Error('Got invalid LightbulbSpec.size: "' + size + '"');
		}

		// set default, and perform hex string parsing
		let baseTint = '#FFFFFF';
		if (spec.baseTint != null) {
			baseTint = spec.baseTint;
		}
		let bt = parseInt(baseTint.slice(1), 16);

		// set default
		let flicker = spec.flicker || false;

		return {
			size: ls,
			baseTint: bt,
			flicker: flicker,
		}
	}
}
