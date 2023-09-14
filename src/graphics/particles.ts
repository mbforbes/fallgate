namespace Graphics {

	/**
	 * Spec in our custom .json file.
	 */
	export type ParticlesConfig = {
		[id: string]: {
			config: string,
			textures: {
				base: string,
				frames: number,
			}[],
			anim?: {
				framerate: number,
			},
		},
	}
}
