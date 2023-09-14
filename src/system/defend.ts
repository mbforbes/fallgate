/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../engine/events.ts" />
/// <reference path="../gj7/weapon.ts" />
/// <reference path="../component/armed.ts" />
/// <reference path="../component/shielded.ts" />
/// <reference path="../component/dead.ts" />
/// <reference path="../component/block.ts" />
/// <reference path="../component/input.ts" />
/// <reference path="../component/position.ts" />

namespace System {

	class DefendAspect extends Engine.Aspect {

		/**
		 * How long it's been in the current state.
		 */
		public elapsed: number = 0;
		public startedBlock: boolean = false
		public ongoingBlock: Component.Block = undefined
		private _state: Shield.BlockState = Shield.BlockState.Idle

		/**
		 * What state it is in.
		 */
		public get state(): Shield.BlockState {
			return this._state;
		}

		public set state(next: Shield.BlockState) {
			this.elapsed = 0;
			this.startedBlock = false;
			this._state = next;
			// TODO: set ongoingBlock?
		}
	}

	/**
	 * Defend mediates input (intent to block) with actually spawning a block,
	 * as well as managing the block process.
	 */
	export class Defend extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Position.name,
			Component.Input.name,
			Component.Shielded.name,
		])

		@override
		public makeAspect(): DefendAspect {
			return new DefendAspect();
		}

		private startBlock(blocker: Engine.Entity, refpos: Component.Position, shield: Shield.Shield): Component.Block {
			// TODO: consider using object pool(s) for blocks.

			// create new block
			let block = this.ecs.addEntity();
			this.ecs.addComponent(block, new Component.Position(
				new Point(refpos.p.x, refpos.p.y), refpos.angle));
			let blockComponent = new Component.Block(blocker, -1, shield);
			this.ecs.addComponent(block, blockComponent);
			this.ecs.addComponent(block, Component.CollisionShape.buildRectangle(
				shield.block.cboxDims.copy(),
				new Set<CollisionType>([CollisionType.Mobile, CollisionType.Shield])));
			this.ecs.addComponent(block, new Component.Tracker(
				blocker,
				shield.block.cboxOffset.copy(),
				true));

			// TODO: dispatch block event?

			// track block component so we can destroy it later
			return blockComponent;
		}

		private updateState(delta: number, aspect: DefendAspect): void {
			// (honestly, this is a FSM, and could write functions to trigger edges)
			//
			// + Idle (state used when idling / walking)
			// |
			// | (press)
			// v
			// [note: disabling raise] + Raise
			// [note: disabling raise] |  - duration
			// [note: disabling raise] v
			// + Hold
			// | - (wait for release)
			// v
			// [note: disabling raise] + Lower
			// [note: disabling raise] |  - duration
			// [note: disabling raise] v
			// + [back to Idle] --^
			aspect.elapsed += delta;

			let pos = aspect.get(Component.Position);
			let input = aspect.get(Component.Input);
			let shielded = aspect.get(Component.Shielded);
			let shield = shielded.active;

			let attacking = aspect.has(Component.Armed) &&
				(aspect.get(Component.Armed)).state != Weapon.SwingState.Idle;

			// TODO: refactor into common check
			if (aspect.has(Component.Dead) ||
					aspect.has(Component.Knockback) ||
					aspect.has(Component.Stagger) ||
					aspect.has(Component.StaggerReturn) ||
					aspect.has(Component.Blocked) ||
					attacking) {
				// remove block if it exists
				if (aspect.startedBlock) {
					aspect.ongoingBlock.fuse = true;
					aspect.state = Shield.BlockState.Idle;
				}
				// set to idle
				aspect.state = Shield.BlockState.Idle;
				shielded.state = Shield.BlockState.Idle;
				return;
			}

			// TODO: handle recoil in special way?

			switch (aspect.state) {
				// In idle state, can block any time as long as weapon isn't
				// doing anything.
				case Shield.BlockState.Idle: {
					if (input.block) {
						aspect.state = Shield.BlockState.Block;
					}
					// NOTE: switching shield would go here. But do we really
					// need it? Let's wait and see; doesn't seem like it would
					// add to gameplay.
					break;
				}

				// // In raise state, transition is immediate after raising is
				// // finished.
				// case Shield.BlockState.Raise: {
				//	if (aspect.elapsed >= shield.timing.raiseDuration) {
				//		aspect.state = Shield.BlockState.Block;
				//	}
				//	break;
				// }

				// In block state, create the block (if it hasn't been created
				// yet). Stop as soon as the input is not blocking any more.
				case Shield.BlockState.Block: {
					// Create the block if it hasn't been created.
					if (!aspect.startedBlock) {
						aspect.ongoingBlock = this.startBlock(aspect.entity, pos, shield);
						aspect.startedBlock = true;
					}

					// Lower when blocking is no longer pressed (or entity is
					// dead).
					if (!input.block) {
						aspect.ongoingBlock.fuse = true;
						aspect.state = Shield.BlockState.Idle;
					}
					break;
				}

				// // In lower state, just wait to transition back to idle.
				// case Shield.BlockState.Lower: {
				//	if (aspect.elapsed >= shield.timing.lowerDuration) {
				//		aspect.state = Shield.BlockState.Idle;
				//	}
				//	break;
				// }
			}

			// Always update armed state to match (for other observing systems).
			shielded.state = aspect.state;
		}

		public update(delta: number, entities: Map<Engine.Entity, DefendAspect>): void {
			for (let aspect of entities.values()) {
				this.updateState(delta, aspect);
			}
		}
	}
}
