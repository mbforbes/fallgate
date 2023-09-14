/// <reference path="../engine/events.ts" />
/// <reference path="../gj7/tutorial.ts" />

namespace Handler {

	/**
	 * Displaying instructions! (Note that the Bookkeeper sends the actual
	 * events to ensure they aren't shown twice.)
	 */
    export class Instructions extends Events.Handler {
        private guiEnts: Engine.Entity[] = []

        dispatcher = new Map<Events.EventType, (EventType, any) => void>([
            [Events.EventTypes.ZoneTransition, this.onZoneEnter],
            [Events.EventTypes.ShowInstructions, this.showInstructions],
            [Events.EventTypes.MenuKeypress, this.maybeHideInstructions],
        ])

        constructor(private instructions: GJ7.Instructions) {
            super();
        }

        @override
        clear(): void {
            arrayClear(this.guiEnts);
        }

        /**
         * Note that this handler function is kind of an exception to what this
         * class handles because it gets the raw underlying event. However, it
         * still then goes through the bookkeeper to do the mediating logic.
         */
        onZoneEnter(et: Events.EventType, args: Events.ZoneTransitionArgs): void {
            if (!args.enter) {
                return;
            }
            let iid = this.ecs.getComponents(args.zone).get(Component.Zone).instructionID;
            if (iid == null) {
                return;
            }
            this.ecs.getSystem(System.Bookkeeper).maybeShowInstruction(iid);
        }

        showInstructions(et: Events.EventType, args: Events.ShowInstructionsArgs): void {
            let instr = this.instructions[args.instructionsID];
            if (instr == null) {
                throw new Error('Unknown instructions ID: "' + args.instructionsID + '"');
            }
            let textReplacements = new Map([
                ['instructTitle', instr.title],
                ['instructText', instr.txt],
            ])
            let imgReplacements = new Map([
                ['instructIcon', instr.img],
            ])

            // modify and replace gui things
            this.guiEnts.push(...this.ecs.getSystem(System.GUIManager)
                .runSequence('instructions', textReplacements, imgReplacements));

            // remove player input, disable non-cutscene AIs
            this.firer.dispatch({
                name: Events.EventTypes.PlayerControl,
                args: { allow: false },
            });
            this.ecs.getSystem(System.AISystem).inCutscene = true;
        }

        maybeHideInstructions(et: Events.EventType, args: Events.MenuKeypressArgs): void {
            if (this.guiEnts.length > 0) {
                // tween out
                let guiM = this.ecs.getSystem(System.GUIManager);
                while (this.guiEnts.length > 0) {
                    guiM.tween(this.guiEnts.pop(), 'exit');
                }

                // restore player and AI control
                this.firer.dispatch({
                    name: Events.EventTypes.PlayerControl,
                    args: { allow: true },
                });
                this.ecs.getSystem(System.AISystem).inCutscene = false;
            }

        }
    }

    /**
     * Displaying Controls. (Note that these are always shown so there's no
     * need to mediate w/ Bookkeeper.)
     */
    export class Controls extends Events.Handler {

        private guiEnts: Engine.Entity[] = []

        dispatcher = new Map<Events.EventType, (EventType, any) => void>([
            [Events.EventTypes.ZoneTransition, this.onZoneTransition],
        ])

        constructor(private controls: GJ7.Controls) {
            super();
        }

        @override
        clear(): void {
            arrayClear(this.guiEnts);
        }

        /**
         * Shows a specific control
         */
        private showControl(control: GJ7.Control): void {
            // construct replacements
            let textReplacements = new Map([
                ['controlsText', control.txt],
            ])

            // show GUI and bookkeep
            this.guiEnts.push(...this.ecs.getSystem(System.GUIManager)
                .runSequence('controls', textReplacements));
        }

        /**
         * Hides any/all controls.
         */
        private hideControl(): void {
            let guiM = this.ecs.getSystem(System.GUIManager);
            while (this.guiEnts.length > 0) {
                guiM.tween(this.guiEnts.pop(), 'exit');
            }
        }

        onZoneTransition(et: Events.EventType, args: Events.ZoneTransitionArgs): void {
            // get cid
            let cid = this.ecs.getComponents(args.zone).get(Component.Zone).controlID;
            if (cid == null) {
                return;
            }

            // get control info
            let control = this.controls[cid];
            if (control == null) {
                throw new Error('Unknown control ID: "' + cid + '"');
            }

            if (args.enter) {
                this.showControl(control);
            } else {
                // NOTE: hide right now just hides everything. If we end up
                // wanting to distinguish between specific controls to
                // show/hide, we can bookkeep per-control and actually hide
                // them only.
                this.hideControl();
            }
        }
    }
}
