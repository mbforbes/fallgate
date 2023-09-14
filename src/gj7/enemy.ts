namespace GJ7 {

	export type Enemy = {
		names: string[],
		kind: string,
		gatekeeper?: boolean,
		boss?: boolean,
		hudDisabled?: boolean,
		finalBoss?: boolean,
	}
}
