namespace GJ7 {

	export type ItemData = {
		/**
		 * What is it?
		 */
		classificiation: Ontology.Item,

		/**
		 * Instruction to (maybe) play when picked up.
		 */
		instructionID?: string,

		/**
		 * Gate to (maybe) keep closed until picked up.
		 */
		gateID?: string,
	}

	/**
	 * JSON-specified representation of ItemData.
	 */
	export type ItemSpec = {
		classification: string,
		instructionID?: string,
	}

}
