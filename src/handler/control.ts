namespace Handler {

	/**
	 * For giving / revoking player control.
	 */
	export class Control extends Events.Handler {

		dispatcher = new Map<Events.EventType, (et: Events.EventType, args: any) => void>([
			[Events.EventTypes.PlayerControl, this.handlePlayerControl],
		])

		private stopPlayer(): void {
			for (let player of this.ecs.getSystem(System.PlayerSelector).latest()) {
				let pComps = this.ecs.getComponents(player);
				if (pComps.has(Component.Input)) {
					let input = pComps.get(Component.Input);
					input.intent.set_(0, 0);
					input.quickAttack = false;
					input.attack = false;
					// not stopping block for tutorial case where they may be
					// blocking something oncoming. may want to if this causes
					// weird edge cases.
				}
			}
		}

		handlePlayerControl(et: Events.EventType, args: Events.PlayerControlArgs): void {
			if (args.allow) {
				this.ecs.enableSystem(System.PlayerInputMouseKeyboard);
				this.ecs.enableSystem(System.PlayerInputGamepad);
			} else {
				this.ecs.disableSystem(System.PlayerInputMouseKeyboard);
				this.ecs.disableSystem(System.PlayerInputGamepad);
				this.stopPlayer();
			}
		}
	}
}
