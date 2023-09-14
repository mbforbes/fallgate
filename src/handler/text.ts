/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />

namespace Handler {

	export class TextHandler extends Events.Handler {
		static FLOAT_DISPLAY_OFFSET = new Point(30, -30)

		static itemText = new Map<Ontology.Item, string>([
			[Ontology.Item.Health, 'HEALTH'],
			[Ontology.Item.Doughnut, 'DOUGHNUT'],
		])

		dispatcher = new Map<Events.EventType, (EventType, any) => void>([
			[Events.EventTypes.Damage, this.floatText],
			[Events.EventTypes.ItemCollected, this.item],
			[Events.EventTypes.EnemyStagger, this.stagger],
			[Events.EventTypes.Checkpoint, this.checkpoint],
		])

		constructor(
				private translator: Stage.Translator,
				private gui: System.GUIManager) {
			super();

		}

		/**
		 * Show text for when a fun thing like a stagger happens.
		 */
		funText(txt: string, worldPos: Point): void {
			let hudBasePos = this.translator.worldToHUDBase(
				TextHandler.FLOAT_DISPLAY_OFFSET.copy().add_(worldPos));

			this.gui.tween(
				this.gui.createText('flashText', txt, hudBasePos),
				'enter');
		}

		stagger(et: Events.EventType, args: Events.EnemyStaggerArgs): void {
			this.funText('STAGGER', args.vLocation);
		}

		item(et: Events.EventType, args:Events.ItemCollectedArgs): void {
			if (!TextHandler.itemText.has(args.itemType)) {
				return;
			}
			this.funText(TextHandler.itemText.get(args.itemType), args.location);
		}


		checkpoint(et: Events.EventType, args: Events.CheckpointArgs): void {
			this.funText('CHECKPOINT', args.location);
		}

		/**
		 * Show damage text (currently disabled).
		 */
		floatText(et: Events.EventType, args: Events.DamageArgs): void {
			// Don't display 0 damage.
			if (args.internalDamage == 0) {
				return;
			}
			let loc = this.translator.worldToHUDBase(
				TextHandler.FLOAT_DISPLAY_OFFSET.copy().add_(args.location));
			let displayDamage = '' + (args.internalDamage);

			let e = this.gui.createText('floatText', displayDamage, loc);
			this.gui.tween(e, 'enter');
		}
	}
}
