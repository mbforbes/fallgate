/// <reference path="../core/base.ts" />
/// <reference path="ecs.ts" />

namespace Events {

	/**
	 * Slimmed down API of Manager.
	 */
	export class Firer {
		constructor(private manager: Manager) { }

		public dispatch(pkg: EventPackage, delay: number = 0): void {
			this.manager.dispatch(pkg, delay);
		}
	}

	/**
	 * The Manager lets Systems dispatch events and Handlers register for them.
	 * It manages the traffic from the former to the latter.
	 */
	export class Manager {
		private multiplexer = new Map<EventType, Handler[]>()
		private handlers = new Array<Handler>()
		private queue = new Array<EventQueueItem>()
		private toRemove = new Array<Handler>()
		private firer = new Firer(this);

		/**
		 * Game sets this during init().
		 */
		private ecs: Engine.ECS

		/**
		 * Game sets this during init().
		 */
		private scriptRunner: Script.Runner


		// Public API
		// ---

		/**
		 * Systems call dispatch to request that events be published.
		 */
		public dispatch(pkg: EventPackage, delay: number = 0): void {
			this.queue.push({ pkg: pkg, remaining: delay })
		}

		/**
		 * Game calls this to pass in the ecs reference.
		 */
		public init(ecs: Engine.ECS, scriptRunner: Script.Runner): void {
			this.ecs = ecs;
			this.scriptRunner = scriptRunner;
		}

		/**
		 * Game calls this to add Handlers.
		 */
		public add(handler: Handler): void {
			// Give it an ECS reference and let it set up its internal data
			// structure.
			handler.init(this.ecs, this.scriptRunner, this.firer);

			// Register all events the handler is interested in to it.
			for (let et of handler.eventsHandled()) {
				this.register(et, handler);
			}

			// Add it to the internal list for updates.
			this.handlers.push(handler);
		}

		/**
		 * Game calls this on scene transitions (onClear()). Tells handlers to
		 * clear any saved scene-specific state. (Should be rare for event
		 * handlers.) Removes any handlers marked as transient. Also clears any
		 * queued events.
		 */
		public clear(): void {
			let toRemove: Handler[] = []
			for (let handler of this.handlers) {
				handler.clear();
				if (handler.transient) {
					toRemove.push(handler);
				}
			}
			for (let handler of toRemove) {
				this.remove(handler);
			}
			arrayClear(this.queue);
		}

		/**
		 * Game calls this to update manager and all handlers.
		 */
		public update(delta: number): void {
			// manage queue
			for (let i = this.queue.length - 1; i >= 0; i--) {
				this.queue[i].remaining -= delta;
				if (this.queue[i].remaining <= 0) {
					this.publish(this.queue[i].pkg);
					this.queue.splice(i, 1);
				}
			}

			// update handlers, marking any finished ones for removal.
			for (let handler of this.handlers) {
				handler.update();

				if (handler.finished) {
					this.toRemove.push(handler);
				}
			}

			// remove any finished handlers
			while (this.toRemove.length > 0) {
				this.remove(this.toRemove.pop());
			}
		}

		// Private
		// ---

		/**
		 * Actually publishes the event.
		 * @param pkg
		 */
		private publish(pkg: EventPackage): void {
			// We may not have any handlers registered at all.
			if (!this.multiplexer.has(pkg.name)) {
				return;
			}
			// If we do, enqueue to all of them.
			for (let handler of this.multiplexer.get(pkg.name)) {
				handler.push(pkg);
			}
		}

		/**
		 * Removes the `handler`. We'll never send it any more events.
		 *
		 * Could be made public to match add(...), but no one needed to call it
		 * yet, so didn't
		 * @param handler
		 */
		private remove(handler: Handler): void {
			// de-register all of its event types
			for (let et of handler.eventsHandled()) {
				this.deregister(et, handler);
			}

			// remove it from our list
			this.handlers.splice(this.handlers.indexOf(handler), 1);
		}

		/**
		 * From now on, `handler` will no longer get `et` events.
		 * @param et
		 * @param handler
		 */
		private deregister(et: EventType, handler: Handler): void {
			// remove handler from the list of handlers handling that event
			// type.
			let hs = this.multiplexer.get(et);
			hs.splice(hs.indexOf(handler), 1);
		}

		/**
		 * From now on, handler will get all et events.
		 */
		private register(et: EventType, handler: Handler): void {
			if (!this.multiplexer.has(et)) {
				this.multiplexer.set(et, []);
			}
			this.multiplexer.get(et).push(handler);
		}
	}

	export type EventType = number
	export type EventPackage = { name: EventType, args: any }
	export type EventQueueItem = { pkg: EventPackage, remaining: number }


	/**
	 * Base class for event handlers.
	 */
	export abstract class Handler {

		/**
		 * dispatcher is overridden by subclasses to define their own mapping
		 * from EventType to function (args: any) => void.
		 */
		protected abstract dispatcher: Map<EventType, (EventType, any) => void>

		/**
		 * Given by the Manager during init(). Used so that the Handler has
		 * some capabilities!
		 */
		protected ecs: Engine.ECS

		/**
		 * Given by the Manager during init(). Used so that the Handler has
		 * even more capabilities!
		 */
		public scriptRunner: Script.Runner

		/**
		 * Given by the Manager during init(). Used so that the Handler has
		 * even MORE capabilities!
		 */
		protected firer: Firer

		/**
		 * incoming is sourced by the Manager and drained during the handler's
		 * update by calling the dispatcher-mapped function.
		 */
		private incoming = new Array<EventPackage>()

		/**
		 * Handlers can override to do logic that requires a working ecs.
		 * (Called automatically after init(...) completes.)
		 */
		protected setup(): void { }

		/**
		 * Handlers can override to do any cleanup to remove scene-dependent
		 * state (like stored Entities).
		 */
		public clear(): void { }

		/**
		 * Handlers can set this at any point and they will never receive any
		 * more events (even if more are available) (and they'll be
		 * de-registered).
		 */
		public finished: boolean = false

		/**
		 * Handlers can set this to mark that they can be cleaned up upon scene
		 * reset. (Otherwise Handlers, like Systems, persist throughout the
		 * lifetime of the game.)
		 */
		public transient: boolean = false

		//
		// None of these should need to be overridden.
		//

		/**
		 * Manager calls this to pass in the ECS reference.
		 */
		public init(ecs: Engine.ECS, scriptRunner: Script.Runner, firer: Firer): void {
			// Save ECS, Runner, and Firer references.
			this.ecs = ecs;
			this.scriptRunner = scriptRunner;
			this.firer = firer;
			this.setup();
		}

		/**
		 * Manager calls this to figure out what events this Handler handles.
		 */
		public eventsHandled(): IterableIterator<EventType> {
			return this.dispatcher.keys();
		}

		/**
		 * Manager calls this to tell Handler about new events.
		 */
		public push(pkg: EventPackage): void {
			this.incoming.push(pkg);
		}

		/**
		 * Manager calls this to have Handler process all events it has
		 * accumulated over the last frame.
		 */
		public update(): void {
			while (this.incoming.length > 0) {
				// check in case finished was set; can happen mid-update.
				if (this.finished) {
					return;
				}

				let pkg = this.incoming.pop();
				this.dispatcher.get(pkg.name).call(this, pkg.name, pkg.args);
			}
		}
	}
}
