/**
 * Keyboard has the up-to-date state of the user's keyboard. It holds and does
 * not interpret the state.
 *
 * Currently there should only be one instance of this because it modifies
 * the browser's global state. I think we could change this if we wanted to if
 * it ever seems like it's worth it by calling `window.removeEventListener(...)`
 * or something.
 */
class Keyboard {
	public gamekeys = new Map<string, GameKey>();
	public keyToCode = new Map<string, string>();

	constructor(private eventsManager: Events.Manager) {
		window.addEventListener('keydown', this.downHandler.bind(this), false)
		window.addEventListener('keyup', this.upHandler.bind(this), false)
		this.setup();
	}

	setup() {
		// menu commands
		this.register(new GameKey(GameKey.Enter, 'Enter', true));

		// player controls
		this.register(new GameKey(GameKey.Space, ' ')); // attack
		this.register(new GameKey(GameKey.ShiftLeft, 'Shift')); // block
		this.register(new GameKey(GameKey.W, 'w')); // move
		this.register(new GameKey(GameKey.S, 's')); // move
		this.register(new GameKey(GameKey.A, 'a')); // move
		this.register(new GameKey(GameKey.D, 'd')); // move
		this.register(new GameKey(GameKey.E, 'e')); // future: swap weapon

		// debug gamespeed
		this.register(new GameKey(GameKey.P, 'p')); // pause
		this.register(new GameKey(GameKey.Digit1)); // 1/1x
		this.register(new GameKey(GameKey.Digit2)); // 1/2x
		this.register(new GameKey(GameKey.Digit3)); // 1/4x
		this.register(new GameKey(GameKey.Digit4)); // 1/8x

		// debug scene manip
		this.register(new GameKey(GameKey.J, 'j')); // restart current scene
		this.register(new GameKey(GameKey.N)); // go to next scene
		this.register(new GameKey(GameKey.B)); // go to prev scene

		// debug camera only
		this.register(new GameKey(GameKey.Equal)); // zoom in
		this.register(new GameKey(GameKey.Minus)); // zoom out

		// debug camera (and soon, menuing)
		this.register(new GameKey(GameKey.Left));
		this.register(new GameKey(GameKey.Right));
		this.register(new GameKey(GameKey.Up));
		this.register(new GameKey(GameKey.Down));
	}

	getCode(event: KeyboardEvent): string | undefined {
		// get code if possible (chrome), fallback to key and use key -> code
		// mapping. if we don't have the mapping, it will return undefined,
		// which is ok.
		return event.code || this.keyToCode.get(event.key);
	}

	register(k: GameKey): void {
		this.gamekeys.set(k.code, k);
		if (k.key != null) {
			this.keyToCode.set(k.key, k.code);
			this.keyToCode.set(k.key.toUpperCase(), k.code);
		}
	}

	downHandler(event: KeyboardEvent): void {
		// console.log(event);
		let code = this.getCode(event);
		if (this.gamekeys.has(code)) {
			let key = this.gamekeys.get(code)

			// new: fire event if menu key and key was up and is now pressed
			if (key.menu && !key.isDown) {
				this.eventsManager.dispatch({
					name: Events.EventTypes.MenuKeypress,
					args: { key: key.code },
				});
			}
			// new: fire event for debug keys
			if ((key.code === GameKey.N || key.code === GameKey.B) && !key.isDown) {
				this.eventsManager.dispatch({
					name: Events.EventTypes.DebugKeypress,
					args: { key: key.code },
				});
			}

			key.isDown = true;
			event.preventDefault();
		}
	}

	upHandler(event: KeyboardEvent): void {
		let code = this.getCode(event);
		if (this.gamekeys.has(code)) {
			let key = this.gamekeys.get(code)
			key.isDown = false;
			event.preventDefault();
		}
	}
}

/**
 * GameKey holds the state for a single key.
 *
 * It's a glorified boolean that contains its own key name, which is used to
 * index it in a map.
 */
class GameKey {
	// Constants used as `code`s for keys. `console.log(event)` above to learn
	// more.
	static Enter = 'Enter'
	static Space = 'Space'
	static ShiftLeft = 'ShiftLeft'
	static Left = 'ArrowLeft'
	static Up = 'ArrowUp'
	static Right = 'ArrowRight'
	static Down = 'ArrowDown'
	static W = 'KeyW'
	static S = 'KeyS'
	static A = 'KeyA'
	static D = 'KeyD'
	static E = 'KeyE'
	static N = 'KeyN'
	static B = 'KeyB'
	static J = 'KeyJ'
	static P = 'KeyP'
	static Digit1 = 'Digit1'
	static Digit2 = 'Digit2'
	static Digit3 = 'Digit3'
	static Digit4 = 'Digit4'
	static Equal = 'Equal'
	static Minus = 'Minus'
	static Tilde = 'Backquote'

	// state
	public isDown: boolean = false

	constructor(public code: string, public key: string = null, public menu: boolean = false) { }
}
