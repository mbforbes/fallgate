/// <reference path="../core/util.ts" />
/// <reference path="events.ts" />
/// <reference path="slowmotion.ts" />

namespace Engine {

	type ComponentClass<T extends Component> = new (...args) => T

	type AnyComponentClass = new (...args) => any

	type SystemClass<T extends System> = new (...args) => T

	/**
	 * Mediocre wrapper for mediocre builtin data structure.
	 *
	 * More specifically: I want to treat the keys of a Map as a Set so I can
	 * perform a set intersection. However, a Map's keys() method returns an
	 * iterator. Thus, I'm tracking the keys as well as a separate set.
	 */
	class ComponentContainer {
		private rawMap = new Map<string, Component>()
		private rawKeys = new Set<string>()
		private rawSortedKeys = new Array<string>()

		/**
		 * DO NOT CALL THIS. Use ecs.addComponent(...) instead. That will call
		 * this, *and* update all the systems to know about the new component.
		 *
		 * (Should probably have done some more OO gymnastics to prevent this in
		 * Typescript, but not worth the time yet.)
		 *
		 * @param component
		 */
		public add(component: Component) {
			// some debug checking
			let name = component.name;
			if (this.rawMap.has(name)) {
				throw new Error('Can\'t add component "' + name + '"; already exists.')
			}

			// add it
			this.rawMap.set(name, component);
			this.rawKeys.add(name);

			// maintain sorted list for debug rendering
			this.rawSortedKeys.push(name)
			this.rawSortedKeys.sort();
		}

		/**
		 * DO NOT CALL THIS. Use ecs.removeComponent(...) instead. That will
		 * update the systems' bookkeeping.
		 *
		 * @param c Class of the component to delete (e.g., Component.Position).
		 */
		public delete<T extends Component>(c: ComponentClass<T>): void {
			// some debug checking
			if (!this.rawMap.has(c.name)) {
				throw new Error('Can\'t delete component "' + c.name + '"; doesn\'t exist.')
			}

			// delete it
			this.rawMap.delete(c.name);
			this.rawKeys.delete(c.name);

			// maintain sorted list for debug rendering
			this.rawSortedKeys.splice(this.rawSortedKeys.indexOf(c.name), 1);
		}

		/**
		 * Directly gets a Component. Example: `get(Component.Position)`.
		 * @param c
		 */
		public get<T extends Component>(c: ComponentClass<T>): T {
			return this.rawMap.get(c.name) as T;
		}

		public has(...cs: AnyComponentClass[]): boolean {
			for (let c of cs) {
				if (!this.rawMap.has(c.name)) {
					return false;
				}
			}
			return true;
		}

		public keys(): Set<string> {
			return this.rawKeys;
		}

		public sortedKeys(): string[] {
			return this.rawSortedKeys;
		}

		public debugTable(): [string, string][] {
			let res = [];
			for (let key of this.rawSortedKeys) {
				res.push([key, this.rawMap.get(key).toString()]);
			}
			return res;
		}

		public size(): number {
			return this.rawKeys.size;
		}
	}

	/**
	 * This is a get/has-only interface that can be used instead of
	 * ComponentContainer. It can be used widely throughout the game without
	 * fearing whether add() or delte() will accidentally be called.
	 */
	export class ComponentViewer {
		constructor(private cc: ComponentContainer) { }

		/**
		 * Directly gets a Component. Example: `get(Component.Position)`.
		 * @param c
		 */
		public get<T extends Component>(c: ComponentClass<T>): T {
			return this.cc.get(c);
		}

		/**
		 * Directly sees whether a Component is in the container. Example:
		 * `has(Component.Position)`.
		 * @param c
		 */
		public has(...cs: AnyComponentClass[]): boolean {
			return this.cc.has(...cs);
		}
	}

	type ComponentPackage = {
		container: ComponentContainer,
		viewer: ComponentViewer,
	}

	export class ECS {

		/**
		 * API: slow motion.
		 */
		public slowMotion = new SlowMotion()

		// Core fields.

		private nextEntityID = 0
		private entities = new Map<Entity, ComponentPackage>()
		private systems = new Map<System, Map<Entity, Aspect>>()

		// So that we don't pull entities out mid-update.
		private entitiesToDestroy = new Array<Entity>()

		// Ugly extra data structures for doing more stuff on systems (priority
		// updates, turning off debug systems, signaling clearing ...)
		private priorities: number[] = []
		private updateMap = new Map<number, Set<System>>()
		private systemNames = new Map<string, System>()

		// Optimization for handing dirty components.
		/**
		 * Map from <ComponentClass>.name to System.
		 */
		private dirtySystemsCare = new Map<string, Set<System>>()
		private dirtyEntities = new Map<System, Set<Entity>>()

		// Timing. Could break out of ECS. Should there be other Engine-level
		// resources Systems have access to besides the ECS?
		private _gametime: number = 0;
		public get gametime(): number {
			return this._gametime;
		}
		private _walltime: number = 0;
		public get walltime(): number {
			return this._walltime;
		}

		constructor(public eventsManager: Events.Manager) { }

		/**
		 * This is how you make new Entities.
		 */
		public addEntity(): Entity {
			let entity: Entity = this.nextEntityID;
			this.nextEntityID++;

			let cc = new ComponentContainer();
			this.entities.set(entity, {
				container: cc,
				viewer: new ComponentViewer(cc),
			});

			// debug logging
			// console.log('Created entity ' + entity);

			// Assuming there's no system that runs on empty entities.

			return entity;
		}

		/**
		 * This is how you remove entities from the game. Note that actual
		 * entity removal is done at the end of a frame (after all systems have
		 * finished their update(...)).
		 */
		public removeEntity(entity: Entity): void {
			this.entitiesToDestroy.push(entity);
		}

		/**
		 * This is a streamlined way to completely remove an entity from the
		 * game.
		 *
		 * It removes all of the components from the entity, removes it from all
		 * systems, and calls onRemove() on all systems from which it was
		 * removed.
		 *
		 * This is useful to avoid doing the set intersection logic a bunch of
		 * times (and, actually, at all).
		 */
		private destroyEntity(entity: Entity): void {
			for (let system of this.systems.keys()) {
				this.removeEntityFromSystem(entity, system);
			}

			// Don't think we need to remove all components from container
			// because we're just going to remove our reference to the container
			// itself.

			this.entities.delete(entity);
		}

		/**
		 * Handles removing entity from all the places the system might be
		 * bookkeeping it.
		 */
		private removeEntityFromSystem(entity: Entity, system: System): void {
			let aspects = this.systems.get(system);
			if (aspects.has(entity)) {
				let aspect = aspects.get(entity);

				// NOTE: Should we free up the aspect here? Or should Chrome's
				// GC be able to handle this? Might want to look up what
				// `delete` does in Javascript.
				aspects.delete(entity);
				system.onRemove(aspect);

				// remove from dirty list if it was there
				if (this.dirtyEntities.has(system)) {
					let dirty = this.dirtyEntities.get(system);
					if (dirty.has(entity)) {
						dirty.delete(entity);
					}
				}
			}
		}

		/**
		 * This is how you can remove all entities from the game (e.g., for
		 * switching between scenes). Happens IMMEDIATELY.
		 */
		public clear(): void {
			// remove all entities
			for (let entity of mapKeyArr(this.entities)) {
				this.destroyEntity(entity);
			}
			// clear the destroy queue. when destroying entities (above), they
			// will be removed from systems. some systems will then try to queue
			// up destruction of their own tracked entities (e.g., gui
			// entities). the queue would then carry onto the next frame, where
			// new legit entities would be deleted.
			arrayClear(this.entitiesToDestroy);

			// start fresh (done before onClear() because some systems will
			// start creating new entities right away (ahem, fx refilling pools,
			// ahem))
			this.nextEntityID = 0
			// tell all systems
			for (let system of this.systems.keys()) {
				system.onClear();
			}
			// tell all event handlers
			this.eventsManager.clear();

		}

		/**
		 * Called when a component becomes dirty.
		 * @param entity
		 */
		private componentDirty(entity: Entity, component: Component): void {
			// for all systems that care about that component becoming dirty,
			// tell them IF they're actually tracking this entity.
			if (!this.dirtySystemsCare.has(component.name)) {
				return;
			}
			for (let sys of this.dirtySystemsCare.get(component.name)) {
				if (this.systems.get(sys).has(entity)) {
					this.dirtyEntities.get(sys).add(entity);
				}
			}
		}

		/**
		 * This is how you assign a Component to an Entity.
		 */
		public addComponent(entity: Entity, component: Component): void {
			this.entities.get(entity).container.add(component);

			// Give component capability to signal game engine when it gets
			// dirty.
			component.signal = () => {
				this.componentDirty(entity, component);
			};

			// update systems
			for (let system of this.systems.keys()) {
				this.check(entity, system);
			}

			// initial dirty signal to broadcast to interested systems so that
			// it gets an update (in addition to the onAdd(...) called above
			// due to being added to a system with check(...))
			component.signal();
		}

		/**
		 * Use this to remove a Component from an Entity.
		 *
		 * @param entity
		 * @param c The Component class (e.g., Component.Position)
		 */
		public removeComponent<T extends Component>(entity: Entity, c: ComponentClass<T>): void {
			// NOTE(mbforbes): Could only remove after the gameloop is done if
			// this causes problems with mid-frame updates.
			let component = this.entities.get(entity).container.get(c);
			this.entities.get(entity).container.delete(c);

			// update systems
			for (let system of this.systems.keys()) {
				this.check(entity, system);
			}

			// final dirty dirty signal to broadcast to interested systems that
			// it has been removed.
			component.signal();
		}

		/**
		 * Use this (option 3) to remove a Component from an Entity --- this
		 * one does the check for you whether the component exists first.
		 */
		public removeComponentIfExists<T extends Component>(entity: Entity, c: ComponentClass<T>): void {
			if (!this.entities.get(entity).container.has(c)) {
				return;
			}
			this.removeComponent(entity, c);
		}

		/**
		 * This is how you get the Components for an Entity.
		 *
		 * Systems dealing with multiple entities, Scripts, and Handlers all
		 * make use of this. The ComponentViewer is returned to ensure that
		 * users do not accidentally call add() or delete() to add components
		 * directly. Instead, the ECS must be used to add or remove components.
		 */
		public getComponents(entity: Entity): ComponentViewer | null {
			// NOTE: adding null check because a system may try to retrieve a
			// cached entity that has been deleted. a better fix would be to
			// prevent that from happening. for now we return null when it
			// does. dangerous code must check the return value.
			if (!this.entities.has(entity)) {
				return null;
			}
			return this.entities.get(entity).viewer;
		}

		/**
		 * This is how you add Systems.
		 */
		public addSystem(priority: number, system: System): void {
			// debug checking
			if (system.componentsRequired.size == 0) {
				throw new Error("Can't add system " + system + "; empty components list.")
			}
			if (this.systems.has(system)) {
				throw new Error("Can't add system " + system + "; already exists.")
			}

			// give system a reference to the ecs and to the event manager
			system.ecs = this;
			system.eventsManager = this.eventsManager;

			// do any system-specified init
			system.init();

			// init its aspect mapping and populate
			this.systems.set(system, new Map<Entity, Aspect>());
			for (let entity of this.entities.keys()) {
				this.check(entity, system);
			}

			// internal bookkeeping for doing priority updates

			// update the array for doing the update order
			this.priorities = Array.from((new Set(this.priorities)).add(priority));
			this.priorities.sort(sortNumeric);

			// update the mapping accessed from that array
			if (!this.updateMap.has(priority)) {
				this.updateMap.set(priority, new Set<System>());
			}
			this.updateMap.get(priority).add(system);

			// internal bookkeeping for the toggleSystem(...) functionality
			this.systemNames.set(system.name, system);

			// internal bookkeeping for doing dirty component updates
			for (let c of system.dirtyComponents) {
				if (!this.dirtySystemsCare.has(c)) {
					this.dirtySystemsCare.set(c, new Set());
				}
				this.dirtySystemsCare.get(c).add(system);
			}
			this.dirtyEntities.set(system, new Set());
		}

		/**
		 * New! Get a System by name. Is this an anti-pattern? Or will this
		 * free us from passing systems around everywhere. Only you can decide.
		 * @param name
		 */
		public getSystem<T extends System>(s: SystemClass<T>): T {
			return this.systemNames.get(s.name) as T;
		}

		/**
		 * Toggles whether a system is enabled or disabled. Currently primarily
		 * used for debugging.
		 */
		public toggleSystem<T extends System>(s: SystemClass<T>): void {
			this.toggleSystemInner(s.name, null);
		}

		/**
		 * Used only when the System class is not known, onlys its name (currently only during
		 * Debug). TODO: we can remove this as well if we figure out the types.
		 * @param sName
		 */
		public toggleSystemByName(sName: string): void {
			this.toggleSystemInner(sName, null);
		}

		/**
		 * Disables a system.
		 * @param name
		 */
		public disableSystem<T extends System>(s: SystemClass<T>): void {
			this.toggleSystemInner(s.name, false);
		}

		/**
		 * Enables a system.
		 * @param name
		 */
		public enableSystem<T extends System>(s: SystemClass<T>): void {
			this.toggleSystemInner(s.name, true);
		}

		private toggleSystemInner(name: string, desired: boolean | null): void {
			let sys = this.systemNames.get(name);
			if (!sys) {
				return;
			}
			// enable on OR set to toggle and system is disabled
			if (desired || (desired == null && sys.disabled)) {
				// enable
				sys.disabled = false;
				sys.onEnabled(this.systems.get(sys));
			} else {
				// disable
				sys.disabled = true;
				sys.onDisabled(this.systems.get(sys));
			}
		}

		/**
		 * Call this to update all systems. Returns actual update timesetup
		 * used (accounting for slow motion).
		 */
		public update(wallDelta: number, gameDelta: number, clockTower: Measurement.ClockTower): number {
			// apply slow motion to get timestep to use.
			let delta = this.slowMotion.update(gameDelta);

			// If stopped, only update debug systems.
			let debugOnly = delta == 0;

			// clocks
			this._walltime += wallDelta;
			this._gametime += delta;

			// Call update on all systems in priority order.
			for (let priority of this.priorities) {
				let systems = this.updateMap.get(priority);
				for (let sys of systems.values()) {
					// timing
					clockTower.start(Measurement.T_SYSTEMS, sys.name)

					// update. can't be disabled. debugOnly either must be off,
					// or if it's on, the system must be a debug system.
					if (!sys.disabled && (!debugOnly || sys.debug)) {
						sys.update(delta, this.systems.get(sys), this.dirtyEntities.get(sys), clockTower);
						// system clears its own dirty entity list after updating
						this.dirtyEntities.get(sys).clear();
					}

					// timing
					clockTower.end(Measurement.T_SYSTEMS, sys.name)
				}
			}

			return delta;
		}

		/**
		 * This should be called at the end every frame to do final cleanup for
		 * the frame.
		 *
		 * It's separated from the update(...) because Handlers and Scripts may
		 * use resources that would be cleaned up or mark them for deletion.
		 * This should happen after those things happen, but before the next
		 * frame begins.
		 */
		public finishUpdate(): void {
			// Remove any entities we need to remove. This is done after so
			// that we don't get race conditions between one system removing an
			// entity and another wanting to use it. (We could prevent this by
			// carefully ordering which systems run when, but this seems to be
			// a less error-prone situation.)
			while (this.entitiesToDestroy.length > 0) {
				this.destroyEntity(this.entitiesToDestroy.pop());
			}
		}

		/**
		 * Log basic statistics to console.debug. Don't call every frame.
		 */
		public debugStats(): void {
			let nEntities = this.entities.size;
			let nComponents = 0;
			for (let components of this.entities.values()) {
				nComponents += components.container.size();
			}
			let avgComps = nComponents / nEntities;
			let nSystems = this.systems.size;

			console.debug('Entities: ' + nEntities);
			console.debug('Components: ' + nComponents);
			console.debug('\t avg ' + avgComps + ' components/entity ');
			console.debug('Systems: ' + nSystems);
		}

		/**
		 * Checks whether entity belongs in system. Updates assignments (adding
		 * or removing from systems) as necessary.
		 */
		private check(entity: Entity, system: System): void {
			let have_container = this.entities.get(entity).container;
			let have = have_container.keys();
			let needed = system.componentsRequired;
			let aspects = this.systems.get(system);
			if (setContains(have, needed)) {
				// this entity is a match. it should be in the system.
				if (!aspects.has(entity)) {
					let aspect = system.makeAspect();
					aspect.setCC_(have_container);
					aspect.entity = entity;

					aspects.set(entity, aspect);
					system.onAdd(aspect);
				}
			} else {
				// this entity is not a match. it should not be in the system.
				this.removeEntityFromSystem(entity, system);
			}
		}
	}

	/**
	 * An aspect is the subset of an Entity's Components that a System needs.
	 * There is an instance of an Aspect for each each System/Entity pairing. It
	 * is the System's view into the Entity's Components.
	 */
	export class Aspect {

		public entity: Entity

		private components: ComponentContainer

		/**
		 * Directly gets a Component. Example: `aspect.get(Component.Position)`.
		 *
		 * @param c The Component class (e.g., Component.Position).
		 */
		public get<T extends Component>(c: ComponentClass<T>): T {
			return this.components.get(c);
		}

		/**
		 * Check whether 1 or more components exist. Returns true only if all
		 * components exist. Example: `aspect.has(Component.Position)`.
		 *
		 * @param cs One or more Component classes (e.g., Component.Position).
		 */
		public has(...cs: AnyComponentClass[]): boolean {
			for (let c of cs) {
				if (!this.components.has(c)) {
					return false;
				}
			}
			return true;
		}


		//
		// ECS API
		//

		public setCC_(cc: ComponentContainer): void {
			this.components = cc;
		}

		//
		// Debug API
		//

		public debugComponentTable(): [string, string][] {
			return this.components.debugTable();
		}

		//
		// No API here --- this is all internal crap.
		//

		private repr: string = ''

		public toString(): string {

			if (this.repr == '') {
				var aspect = <typeof Aspect>this.constructor;
				let repr = aspect.name;
				let pieces = Array.from(this.components.keys());
				if (pieces.length > 0) {
					repr += '<' + pieces.join(', ') + '>';
				}
				this.repr = repr;
			}
			return this.repr;
		}
	}

	/**
	 * An entity is just an ID. This is used to look up its associated Components.
	 */
	export type Entity = number

	/**
	 * A Component is a bundle of state. Each instance of a Component is associated
	 * with a single Entity.
	 *
	 * Components have no API to fulfill.
	 */
	export abstract class Component {

		/**
		 * A Component can manage signaling when it gets "dirty" if it wants to
		 * support dirty component optimization by simply calling `dirty()` on
		 * itself.
		 */
		public dirty() {
			this.signal();
		}

		//
		// Internal stuff
		//

		/**
		 * Overridden by ECS once it gets tracked by the game engine.
		 */
		public signal: () => void = () => { }

		// auto-filled by constructor
		public name: string

		constructor() {
			// holy crap. this could get the static member, but it actually got the
			// name of the constructor == the name of the class (!).
			var component = <typeof Component>this.constructor;
			this.name = component.name;
		}

		public toString(): string {
			// ✓
			return Constants.CHECKMARK;
		}
	}


	/**
	 * A System cares about a set of components. It will run on every entity that
	 * has that set of components. A System's state is not serialized.
	 *
	 * A System must specify the immutable set of Components it needs at compile
	 * time. (Its immutability isn't enforced by anything but my wrath.) It also
	 * must specify an update() method for what it wants to do every frame (if
	 * anything).
	 */
	export abstract class System {
		//
		// API Systems must fulfill:
		//

		/**
		 * Set of <ComponentClass>.name, ALL of which are required to run the
		 * system on an entity.
		 *
		 * This should be defined at compile time and should not change over
		 * the course of the program. If you want to change them, modify the
		 * game engine to handle that first.
		 */
		public abstract componentsRequired: Set<string>

		/**
		 * update() is called on the System every frame.
		 *
		 * NOTE: Move this to optional if there is ever a system that doesn't
		 * need to do anything on update().
		 */
		public abstract update(delta: number, entities: Map<Entity, Aspect>, dirty: Set<Entity>, clockTower: Measurement.ClockTower): void

		//
		// API Systems can override if they want:
		//

		/**
		 * Set of <ComponentClass>.name; if ANY of them become dirty, the
		 * system will be given that entity during its update. Very cool
		 * feature: components here need not be tracked by componentsRequired.
		 */
		public dirtyComponents: Set<string> = new Set()

		/**
		 * @param disabled DO NOT SET THIS AFTER CONSTRUCTION. Use
		 * ecs.toggleSystem(), ecs.disableSystem(), and ecs.enableSystem().
		 * Lets systems start out disabled. Disabled systems are not updated.
		 *
		 * @param debug Denotes a debug system that is updated even when the
		 * game is paused.
		 */
		constructor(public disabled: boolean = false, public debug: boolean = false) {
		}

		/**
		 * init() is called just after creation but before any other methods
		 * (e.g. onAdd(...) or update(...)) are called. It can be used to setup
		 * internal state that requires the ecs.
		 */
		public init(): void { }

		/**
		 * makeAspect() is called to make a new aspect for this system (whenever
		 * an entity is added). By default, systems get a standard Aspect. If
		 * they override this, they can return a subclass of Aspect instead,
		 * which they can use to store stuff in. Whatever they return here will
		 * be the Aspect they get in onAdd(), onRemove(), and update().
		 */
		public makeAspect(): Aspect {
			return new Aspect();
		}

		/**
		 * onAdd() is called just AFTER an entity is added to a system. (It
		 * *will* be in the system's set of entities.)
		 */
		public onAdd(aspect: Aspect): void { }

		/**
		 * onRemove() is called just AFTER an entity is removed from a system.
		 * (It will *not* be in the system's set of entities.)
		 */
		public onRemove(aspect: Aspect): void { }

		/**
		 * onDisabled() is called when a system is disabled; after this, it
		 * won't receive any more update() calls (until it is enabled again). It
		 * is expected to clean up its state as necessary (e.g., wiping what
		 * it's drawn from the screen).
		 */
		public onDisabled(entities: Map<Entity, Aspect>): void { }

		/**
		 * onEnabled() is called when a system is enabled, having previously
		 * been disabled.
		 */
		public onEnabled(entities: Map<Entity, Aspect>): void { }

		/**
		 * onClear() is called after all entities have been cleared from the
		 * ECS. It allows systems that build and maintain a pool of entities to
		 * re-generate that pool.
		 */
		public onClear(): void { }

		//
		// Fields given to all systems
		//

		/**
		 * Reference to the ECS. This is set after construction but before any
		 * aspects are added or updates are called.
		 */
		public ecs: ECS

		/**
		 * Reference to the Events.Manager. This is set after construction but
		 * before any aspects are added or updates are called.
		 */
		public eventsManager: Events.Manager

		//
		// Other bookkeeping internal crap:
		//

		public get name(): string {
			let system = <typeof System>this.constructor;
			return system.name;
		}

		public toString(): string {
			if (this.repr == '') {
				var system = <typeof System>this.constructor;
				let repr = system.name;
				let pieces = Array.from(this.componentsRequired);
				if (pieces.length > 0) {
					repr += '[' + pieces.join(', ') + ']';
				}
				this.repr = repr;
			}
			return this.repr;
		}

		// computed at runtime when needed. Down here because of syntax highlighter
		// bugs.
		private repr: string = ''
	}

}
