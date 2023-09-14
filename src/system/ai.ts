/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/ai.ts" />
/// <reference path="../component/ai.ts" />

namespace AI {

	/**
	 * Stops everything.
	 */
	export function wait(aspect: System.AIAspect): void {
		let input = aspect.get(Component.Input);
		input.intent.set_(0, 0);
		input.targetAngle = null;
		input.attack = false;
	}

	/**
	 * Buncha common helper methods.
	 */
	export abstract class BaseFSM extends FSM {

		/**
		 * Subclasses write their AI class (e.g., AIBrawler.name) here.
		 */
		protected abstract sysName: string

		/**
		 * Subclasses provide type (AI.*Params) when calling.
		 */
		protected getBlackboard<T>(): T {
			return this.aspect.blackboards.get(this.sysName);
		}

		/**
		 * Subclasses provide type (AI.*Params) when calling.
		 */
		protected getParams<T>(): T {
			return (this.aspect.get(Component.AIComponent)).params;
		}

		constructor(
			protected ecs: Engine.ECS,
			protected aspect: System.AIAspect,
			protected startState: number) {
			super(startState);
		}

		/**
		 * Wait means you don't move and don't attack.
		 *
		 * @prereq: aspect has Component.Input
		 */
		protected wait(): void {
			wait(this.aspect);
		}

		protected swinging(): boolean {
			let armed = this.aspect.get(Component.Armed);
			return armed.state !== Weapon.SwingState.Idle;
		}

		protected dead(): boolean {
			return this.aspect.has(Component.Dead);
		}

		/**
		 * Gets player entity.
		 */
		protected getPlayer(): number {
			return this.aspect.playerSelector.latest().next().value;
		}

		protected getPlayerComps(): Engine.ComponentViewer {
			return this.ecs.getComponents(this.getPlayer());
		}

		protected playerDead(): boolean {
			// should only be one player. player may not exist for some frames,
			// so be robust to that.
			let player = this.getPlayer();
			if (player == null) {
				return true;
			}
			return this.ecs.getComponents(player).has(Component.Dead);
		}

		/*
		 * Freeze input movement and attack.
		 *
		 */
		protected stopAndAttack(): void {
			this.stopMovement();
			this.attack();
		}

		/*
		 * Given that the AI wants to (charge/swing/sheathe) attack, this
		 * decides whether it should active it's `attack` input (based on
		 * timing).
		 */
		protected attack(): void {
			let input = this.aspect.get(Component.Input);
			let armed = this.aspect.get(Component.Armed);
			let prevAttacking = input.attack;

			// start charging if haven't
			if (!prevAttacking) {
				input.attack = true;
				return;
			}

			// if charging and ready to swing, release to swing
			if (armed.state == Weapon.SwingState.ChargeReady) {
				input.attack = false;
				return;
			}

			// if charging and not ready to swing, keep charging
			input.attack = true;
		}

		protected explodePre(): void {
			// manually set to quick-attacking action to play that animation
			let activity = this.aspect.get(Component.Activity);
			activity.manual = true;
			activity.action = Action.QuickAttacking;

			// repeating some of the stuff that happens in the swing system
			// (spawn the attack and spawn event so the sound effect plays)

			let attackInfo = this.aspect.get(Component.Armed).active.quickAttack;

			// do the quick attack
			this.ecs.getSystem(System.Swing).startAttack(
				this.aspect.entity,
				this.aspect.get(Component.Position),
				this.aspect.get(Component.Input),
				attackInfo,
				PartID.Default,
			);

			// spawn swing event
			let eNameSwing: Events.EventType = Events.EventTypes.Swing;
			let eArgsSwing: Events.AttackArgs = {
				attackInfo: attackInfo,
				location: this.aspect.get(Component.Position).p,
			}
			this.ecs.eventsManager.dispatch({ name: eNameSwing, args: eArgsSwing });

			// spawn special explode event
			let eNameExplode: Events.EventType = Events.EventTypes.Explosion;
			let eArgsExplode: Events.ExplosionArgs = {}
			this.ecs.eventsManager.dispatch({ name: eNameExplode, args: eArgsExplode });
		}

		/**
		 * Returns how far the player is from `this`.
		 */
		protected playerDist(): number {
			return this.playerDistTo(this.getPos());
		}

		/**
		 * Returns how far the player is from `location`.
		 * @param location
		 */
		protected playerDistTo(location: Point): number {
			return location.distTo(this.getPlayerPos());
		}

		/**
		 *
		 * @param range Distance from self.
		 */
		protected alivePlayerInRange(range: number): boolean {
			if (this.playerDead()) {
				return false;
			}
			return this.getPos().distTo(this.getPlayerPos()) < range;
		}

		/**
		 * TODO: change to getter?
		 */
		protected getPos(): Point {
			return this.aspect.get(Component.Position).p;
		}

		protected getPlayerPos(): Point {
			return this.getPlayerComps().get(Component.Position).p
		}

		protected getPlayerAngle(): number {
			return this.getPlayerComps().get(Component.Position).angle;
		}

		protected closeTo(target: Point, epsilon: number = 25): boolean {
			return this.getPos().distTo(target) < epsilon;
		}

		/**
		 * Helper: forward movement for tank controls, when X and Y need to be
		 * set correctly to match the target angle.
		 * @param scale (see moveForward)
		 */
		protected moveForwardTank(scale: number): void {
			let input = this.aspect.get(Component.Input);
			let pos = this.aspect.get(Component.Position);
			input.intent.y = -Math.sin(pos.angle);
			input.intent.x = Math.cos(pos.angle);
		}

		/**
		 * Helper: forward movement for when Y = Physics.UP means forward.
		 * @param scale (see moveForward)
		 */
		protected moveForwardStandard(scale: number): void {
			this.aspect.get(Component.Input).intent.y = Physics.UP * scale;
		}

		/**
		 * @param scale optional; in [0, 1]; scale for input force
		 */
		protected moveForward(scale: number = 1.0): void {
			let mt = this.aspect.get(Component.Input).movement.movementType;
			if (mt === Physics.MovementType.Strafe) {
				this.moveForwardTank(scale);
			} else {
				this.moveForwardStandard(scale);
			}
		}

		protected stopMovement(): void {
			this.aspect.get(Component.Input).intent.set_(0, 0);
		}

		/**
		 *
		 * @param scale optional; in [0, 1]; scale for input force
		 */
		protected moveBackwards(scale: number = 1.0): void {
			this.aspect.get(Component.Input).intent.y = Physics.DOWN * scale;
		}

		protected noAttack(): void {
			let input = this.aspect.get(Component.Input);
			input.attack = false;
		}


		/**
		 * Returns whether this thing is hitting a solid, immobile object.
		 */
		protected hittingWall(): boolean {
			if (!this.aspect.has(Component.CollisionShape)) {
				return false;
			}
			let cShape = this.aspect.get(Component.CollisionShape);
			for (let collider of cShape.collisionsFresh.keys()) {
				let colliderComps = this.ecs.getComponents(collider);
				if (!colliderComps.has(Component.CollisionShape)) {
					continue;
				}
				let colliderCShape = colliderComps.get(Component.CollisionShape);
				if (colliderCShape.cTypes.has(CollisionType.Solid) &&
					!colliderCShape.cTypes.has(CollisionType.Mobile)) {
					return true;
				}
			}
			return false;
		}

		/**
		 *
		 * @param offset optional offset in radians to add to player-facing
		 * angle (0 means face towards player, pi means face away)
		 */
		protected facePlayer(offset: number = 0) {
			this.faceTarget(this.getPlayerPos(), offset);
		}

		/**
		 *
		 * @param target
		 * @param offset optional offset in radians to add to angle to target
		 */
		protected faceTarget(target: Point, offset: number = 0): void {
			let pos = this.aspect.get(Component.Position);
			let input = this.aspect.get(Component.Input);

			// this is where we want to face
			let desiredAngle = angleClamp(pos.p.pixiAngleTo(target) + offset);

			// easy case: can instantly turn. just set the target angle.
			if (input.movement.movementType === Physics.MovementType.InstantTurn ||
				input.movement.movementType === Physics.MovementType.Strafe) {
				input.targetAngle = desiredAngle;
				return;
			}

			// InputType.RotateMove. more difficult: needs to turn.
			let theta = angleClamp(desiredAngle - pos.angle);
			if (theta < Math.PI) {
				// turn left
				input.intent.x = Physics.LEFT;
			} else {
				// turn right
				input.intent.x = Physics.RIGHT;
			}
		}

		protected facingPlayer() {
			let position = this.aspect.get(Component.Position);
			let playerPos = this.getPlayerPos();
			return AI.facing(position.p, position.angle, playerPos);
		}
	}

	//
	// AI helpers for AI systems
	//

	/**
	 * Sometimes you just gotta chill out.
	 */
	export function noop(): void { }

	/**
	 * Helper for the AI to decide whether it's facing close enough to a target
	 * (e.g., to attack).
	 *
	 * @param pos
	 * @param target
	 * @param epsilon
	 */
	export function facing(pos: Point, angle: number, target: Point, epsilon: number = Math.PI / 32): boolean {
		return Math.abs(pos.pixiAngleTo(target) - angle) < epsilon;
	}

}

namespace System {

	export class AIAspect extends Engine.Aspect {
		blackboards: AI.Blackboards = new Map()
		constructor(public playerSelector: PlayerSelector) {
			super();
		}
	}

	export class AISystem extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.AIComponent.name,
			Component.Input.name,
		])

		/**
		 * TODO: refactor into Service.
		 */
		public inCutscene: boolean = false

		private behaviorMap = new Map<AI.Behavior, (delta: number, ecs: Engine.ECS, aspect: AIAspect) => void>([
			[AI.Behavior.Cow, AICow.update],
			[AI.Behavior.Archer, AIArcher.update],
			[AI.Behavior.Brawler, AIBrawler.update],
			[AI.Behavior.Spider, AISpider.update],
			[AI.Behavior.Mimic, AIMimic.update],
			[AI.Behavior.Forward, AIForward.update],
			[AI.Behavior.SwingTimer, AISwingTimer.update],
			[AI.Behavior.Sawtooth, AISawtooth.update],
			[AI.Behavior.FollowSawtooth, AIFollowSawtooth.update],
			[AI.Behavior.Coward, AICoward.update],
			[AI.Behavior.Sentinel, AISentinel.update],
		])

		constructor(private playerSelector: PlayerSelector) {
			super();
		}

		@override
		public makeAspect(): AIAspect {
			return new AIAspect(this.playerSelector);
		}

		public update(delta: number, entities: Map<Engine.Entity, AIAspect>): void {
			for (let aspect of entities.values()) {
				// update each entity with its corresponding AI.
				let ai = aspect.get(Component.AIComponent);

				// NEW! if in a cutscene, only update cutscene components.
				if (this.inCutscene && !ai.cutscene) {
					AI.wait(aspect);
					continue;
				}

				let updateFn = this.behaviorMap.get(ai.behavior);
				updateFn(delta, this.ecs, aspect);
			}
		}
	}
}
