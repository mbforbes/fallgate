var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
// base "library"
var Constants;
(function (Constants) {
    // Totally unchanging constants.
    Constants.HALF_PI = 0.5 * Math.PI;
    Constants.TWO_PI = 2 * Math.PI;
    Constants.RAD2DEG = 180 / Math.PI;
    Constants.DEG2RAD = Math.PI / 180;
})(Constants || (Constants = {}));
/**
 * Rounds `num` to n decimal places.
 * @param num
 */
function round(num, places = 2) {
    let d = Math.pow(10, places);
    return Math.round(num * d) / d;
}
/**
 * Note: Can't clone class-based objects, only (arbitrarily complex)
 * combinations of basic types---i.e., things that can be fully represented in
 * JSON.
 *
 * Use for:
 * - objects {}
 * - arrays []
 *
 * ... of:
 * - booleans
 * - numbers
 * - strings
 * - enums (I think) (because these are just numbers once the game is running)
 *
 * @param obj
 */
function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * Clamps angle (in radians) to be 0 <= angle <= 2*pi
 */
function angleClamp(angle) {
    angle %= Constants.TWO_PI;
    if (angle < 0) {
        angle += Constants.TWO_PI;
    }
    return angle;
}
/**
 * Goes between game angle (increasing CCW) and pixi angle (increasing CW)
 * representation.
 * @param gameAngle
 */
function angleFlip(angle) {
    return angleClamp(-angle);
}
/**
 * Sort function for arrays of numbers. It's insane you need to do this.
 */
function sortNumeric(a, b) {
    return a - b;
}
class Point {
    constructor(_x = 0, _y = 0) {
        this._x = _x;
        this._y = _y;
    }
    get x() {
        return this._x;
    }
    set x(val) {
        if (isNaN(val)) {
            throw Error('Tried to set x to NaN!');
        }
        this._x = val;
    }
    get y() {
        return this._y;
    }
    set y(val) {
        if (isNaN(val)) {
            throw Error('Tried to set y to NaN!');
        }
        this._y = val;
    }
    /**
     * Returns new Point from array with two numbers.
     * @param array
     */
    static from(array) {
        return new Point(array[0], array[1]);
    }
    /**
     * Returns manhattan distance to other point.
     */
    manhattanTo(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return Math.abs(dx) + Math.abs(dy);
    }
    /**
     * Returns squared distance to other point. Useful for comparisons where
     * relative distance is all that matters so you can avoid spending the sqrt.
     */
    sqDistTo(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return dx * dx + dy * dy;
    }
    distTo(other) {
        return Math.sqrt(this.sqDistTo(other));
    }
    /**
     * Returns angle from this to other (in radians, clamped in [0, 2*pi]).
     */
    angleTo(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return angleClamp(Math.atan2(dy, dx));
    }
    /**
     * Returns angle from this to other (in radians, clamped in [0, 2*pi]),
     * accounting for y-down coordinate system.
     */
    pixiAngleTo(other) {
        const dx = other.x - this.x;
        // y distances are actually reversed (due to y-down coordinate system)
        const dy = -(other.y - this.y);
        return angleClamp(Math.atan2(dy, dx));
    }
    /**
     * Also rounds.
     */
    toString() {
        let x = Math.round(this.x * 100) / 100;
        let y = Math.round(this.y * 100) / 100;
        return '(' + x + ', ' + y + ')';
    }
    toCoords() {
        return [this.x, this.y];
    }
    dot(other) {
        return this.x * other.x + this.y * other.y;
    }
    // l2 norm, squared
    l2Squared() {
        return this.dot(this);
    }
    // l2 norm
    l2() {
        return Math.sqrt(this.l2Squared());
    }
    /**
     * Scales each coordinate of point by alpha. Returns this.
     */
    scale_(alpha) {
        this.x *= alpha;
        this.y *= alpha;
        return this;
    }
    /**
     * Element-wise clamp each component to be within [min, max]. Returns this.
     * @param min
     * @param max
     */
    clampEach_(min, max) {
        this.x = Math.min(Math.max(this.x, min), max);
        this.y = Math.min(Math.max(this.y, min), max);
        return this;
    }
    /**
     * Make this unit norm. Returns this.
     */
    normalize_() {
        return this.scale_(1 / this.l2());
    }
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
    equalsCoords(x, y) {
        return this.x === x && this.y === y;
    }
    isZero() {
        return this.equalsCoords(0, 0);
    }
    /**
     * Mutates and returns this.
     * @param other
     */
    add_(other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }
    /**
     * Mutates and returns this.
     * @param s
     */
    addScalar_(s) {
        this.x += s;
        this.y += s;
        return this;
    }
    /**
     * Returns a new Point that is this - other.
     * @param other
     */
    subNew(other) {
        let res = new Point();
        this.sub(other, res);
        return res;
    }
    /**
     * Returns (`this` - `other`) in `out`.
     * @param other
     * @param out
     */
    sub(other, out) {
        out.x = this.x - other.x;
        out.y = this.y - other.y;
    }
    /**
     * Returns new point.
     */
    copy() {
        return new Point(this.x, this.y);
    }
    copyTo(other) {
        other.x = this.x;
        other.y = this.y;
    }
    /**
     * Returns: this.
     */
    copyFrom_(other) {
        this.x = other.x;
        this.y = other.y;
        return this;
    }
    set_(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    setFrom_(coords) {
        this.set_(coords[0], coords[1]);
        return this;
    }
    rotate_(theta) {
        // sin / cos of angle used below
        const sin_t = Math.sin(theta);
        const cos_t = Math.cos(theta);
        const sin_a = cos_t;
        const cos_a = sin_t;
        const x_x = this.x * cos_t;
        const x_y = this.x * sin_t;
        const y_x = this.y * cos_a;
        const y_y = this.y * sin_a;
        this.x = x_x - y_x;
        this.y = x_y + y_y;
        return this;
    }
}
/// <reference path="../../lib/pixi.js.d.ts" />
var Game;
(function (Game) {
    let Mode;
    (function (Mode) {
        Mode[Mode["DEBUG"] = 0] = "DEBUG";
        Mode[Mode["RELEASE"] = 1] = "RELEASE";
    })(Mode = Game.Mode || (Game.Mode = {}));
})(Game || (Game = {}));
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
    constructor(eventsManager) {
        this.eventsManager = eventsManager;
        this.gamekeys = new Map();
        this.keyToCode = new Map();
        window.addEventListener('keydown', this.downHandler.bind(this), false);
        window.addEventListener('keyup', this.upHandler.bind(this), false);
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
    getCode(event) {
        // get code if possible (chrome), fallback to key and use key -> code
        // mapping. if we don't have the mapping, it will return undefined,
        // which is ok.
        return event.code || this.keyToCode.get(event.key);
    }
    register(k) {
        this.gamekeys.set(k.code, k);
        if (k.key != null) {
            this.keyToCode.set(k.key, k.code);
            this.keyToCode.set(k.key.toUpperCase(), k.code);
        }
    }
    downHandler(event) {
        // console.log(event);
        let code = this.getCode(event);
        if (this.gamekeys.has(code)) {
            let key = this.gamekeys.get(code);
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
    upHandler(event) {
        let code = this.getCode(event);
        if (this.gamekeys.has(code)) {
            let key = this.gamekeys.get(code);
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
    constructor(code, key = null, menu = false) {
        this.code = code;
        this.key = key;
        this.menu = menu;
        // state
        this.isDown = false;
    }
}
// Constants used as `code`s for keys. `console.log(event)` above to learn
// more.
GameKey.Enter = 'Enter';
GameKey.Space = 'Space';
GameKey.ShiftLeft = 'ShiftLeft';
GameKey.Left = 'ArrowLeft';
GameKey.Up = 'ArrowUp';
GameKey.Right = 'ArrowRight';
GameKey.Down = 'ArrowDown';
GameKey.W = 'KeyW';
GameKey.S = 'KeyS';
GameKey.A = 'KeyA';
GameKey.D = 'KeyD';
GameKey.E = 'KeyE';
GameKey.N = 'KeyN';
GameKey.B = 'KeyB';
GameKey.J = 'KeyJ';
GameKey.P = 'KeyP';
GameKey.Digit1 = 'Digit1';
GameKey.Digit2 = 'Digit2';
GameKey.Digit3 = 'Digit3';
GameKey.Digit4 = 'Digit4';
GameKey.Equal = 'Equal';
GameKey.Minus = 'Minus';
GameKey.Tilde = 'Backquote';
/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="../core/base.ts" />
class Mouse {
    constructor(resolution) {
        this.resolution = resolution;
        this.hudPosition = new PIXI.Point();
        this.leftDown = false;
        this.rightDown = false;
        window.addEventListener("mousemove", (e) => { this.onMove(e); });
        window.addEventListener("mousedown", (e) => { this.onDown(e); });
        window.addEventListener("mouseup", (e) => { this.onUp(e); });
    }
    onDown(event) {
        if (event.button == 0) {
            this.leftDown = true;
        }
        else if (event.button == 2) {
            this.rightDown = true;
        }
    }
    onUp(event) {
        if (event.button == 0) {
            this.leftDown = false;
        }
        else if (event.button == 2) {
            this.rightDown = false;
        }
    }
    onMove(event) {
        // hack so we can access more stuff on the document than Typescript
        // knows exists
        let d = document;
        if (d.fullscreenElement || d.webkitFullscreenElement) {
            // fullscreen. compute scaling by figuring out which dimension is
            // stretched, calculate whether X offset exists, and then apply
            // scaling and offset.
            let gameRatio = this.resolution.x / this.resolution.y;
            let screenRatio = screen.width / screen.height;
            let heightLimiting = screenRatio >= gameRatio;
            let scaleFactor = 1;
            let offsetX = 0;
            let offsetY = 0;
            if (heightLimiting) {
                // black bars on the sides (or perfect match)
                scaleFactor = screen.height / this.resolution.y;
                let scaleWidth = scaleFactor * this.resolution.x;
                offsetX = Math.max(0, (screen.width - scaleWidth) / 2) / scaleFactor;
            }
            else {
                // width limiting (black bars on the top and bottom)
                scaleFactor = screen.width / this.resolution.x;
                let scaleHeight = scaleFactor * this.resolution.y;
                offsetY = Math.max(0, (screen.height - scaleHeight) / 2) / scaleFactor;
            }
            this.hudPosition.set(-offsetX + event.pageX / scaleFactor, -offsetY + event.pageY / scaleFactor);
        }
        else {
            // in the page
            this.hudPosition.set(event.offsetX, event.offsetY);
        }
    }
}
/**
 * Returns whether a contains all items in b.
 */
function setContains(a, b) {
    for (let want of b) {
        if (!a.has(want)) {
            return false;
        }
    }
    return true;
}
/**
 * Makes dest exactly like source (but with same underlying objects).
 */
function setClone(source, dest) {
    dest.clear();
    for (let v of source) {
        dest.add(v);
    }
}
/**
 * Turns the Set s into a string by calling func on each element and comma-
 * separating the result.
 */
function setString(s, func) {
    // Creating an array per frame is bad, but let's optimize later if we need
    // to (given this should be used debug-only).
    let res = [];
    for (let el of s) {
        res.push(func(el));
    }
    return res.join(', ');
}
/**
 * Extends base with extension and returns result. base and extension are not
 * mutated. Shallow copying only.
 */
function objExtend(base, extension) {
    let result = {};
    for (let key in base) {
        result[key] = base[key];
    }
    for (let key in extension) {
        result[key] = extension[key];
    }
    return result;
}
/**
 * Mutates `base` by modifying `base`.`property` with `extension`.`property`.
 *
 * Does full override if `base`.`property` is missing, or else does a per-key
 * override of all properties found in `extension`.`property`.
 *
 * If `extension`.`property` is null, `base` is simply returned unmodified.
 *
 * NOTE: Any copying is done by reference (without cloning) to point components
 * of `base` directly to those of `extension`. Do copying first if this
 * matters.
 */
function objOverride(base, extension, property) {
    // extension doesn't have property; just return base
    if (extension[property] == null) {
        return;
    }
    // base doesn't have property; copy extension's property (ref copy if obj)
    if (base[property] == null) {
        base[property] = extension[property];
        return;
    }
    // both have property; do per-key copy/override of extension's properties
    // (ref copies if objs)
    for (let key in extension[property]) {
        base[property][key] = extension[property][key];
    }
}
/**
 * Takes a simple javascript object (e.g., {a: "foo", b: 5}) and turns into a
 * Map object.
 * @param obj
 */
function objToMap(obj) {
    let res = new Map();
    for (let key in obj) {
        res.set(key, obj[key]);
    }
    return res;
}
/**
 * Turns the Map m into a string by calling keyFunc on each key, valFun on each
 * val, and comma-separating the resulting 'keyStr (valStr)' pieces.
 */
function mapString(m, keyFunc, valFunc) {
    // Creating an array per frame is bad, but let's optimize later if we need
    // to (given this should be used debug-only).
    let res = [];
    for (let key of m.keys()) {
        res.push(keyFunc(key) + ' (' + valFunc(m.get(key)) + ')');
    }
    return res.join(', ');
}
/**
 * Returns a string representing all of the keys of a map.
 * @param m
 */
function mapKeyString(m) {
    return mapKeyArr(m).join(', ');
}
/**
 * Adds all of `other` to `m`, overwriting as needed.
 * @param m
 * @param other
 */
function mapAdd(m, other) {
    for (let [key, val] of other.entries()) {
        m.set(key, val);
    }
}
/**
 * Makes dest exactly like source (but with same underlying objects).
 * @param source
 * @param dest
 */
function mapClone(source, dest) {
    dest.clear();
    for (let [key, val] of source.entries()) {
        dest.set(key, val);
    }
}
/**
 * Like m.keys(), but returns an array instead of an iterator.
 * @param m
 */
function mapKeyArr(m) {
    let res = [];
    for (let key of m.keys()) {
        res.push(key);
    }
    return res;
}
/**
 * Removes all elements from an array.
 */
function arrayClear(arr) {
    while (arr.length > 0) {
        arr.pop();
    }
}
/**
 * Copies a array.
 */
function arrayCopy(array) {
    let res = new Array();
    for (let el of array) {
        res.push(el);
    }
    return res;
}
//
// Let's talk about enums.
//
// For the following enum:
//
//	   enum Foo {
//		   Bar = 0,
//		   Baz,
//	   }
//
// the following object will be generated in js:
//
//	   > Foo
//	   Object
//		   0: "Bar"
//		   1: "Baz"
//		   Bar: 0
//		   Baz: 1
//
// so, you can get the name of an enum val by doing
//
//	   > Foo[Foo.Bar]
//	   "Bar"
//
/**
 * Gets the name of an enum's value; e.g., Foo.Bar -> "Bar".
 */
// function enumValToName(e: any, v)
/**
 * Gets all the numerical values of an enum in sorted order.
 */
function enumSortedVals(e) {
    let vals = new Array();
    for (let key in e) {
        let val = e[key];
        if (typeof val === 'number') {
            vals.push(val);
        }
    }
    vals.sort(sortNumeric);
    return vals;
}
/**
 * Gets all of the string values (names) of an enum in sorted order.
 * @param e
 */
function enumSortedNames(e) {
    let nums = enumSortedVals(e);
    let names = [];
    for (let num of nums) {
        names.push(e[num]);
    }
    return names;
}
/**
 * Miliseconds to display-friendly string for users. Examples:
 * - 18752.100000000000037859 -> '18.752s'
 * - 65752.100000000000037859 -> '1m 5.752s'
 * @param ms
 */
function msToUserTime(ms) {
    let full_s = ms / 1000;
    let m = Math.floor(full_s / 60);
    let s = (full_s % 60).toFixed(3);
    let mStr = m > 0 ? m + 'm ' : '';
    return mStr + s + 's';
}
/**
 * NEW! ms to display-friendly string for users, with two parts and better fmt.
 * Returns 2 parts:
 *    [h:][m:]ss
 *    .ddd
 * - 9752.100000000000037859 ->   '0:09', '.752'
 * - 18752.100000000000037859 ->  '0:18', '.752'
 * - 65752.100000000000037859 ->  '1:05', '.752'
 * - 165752.100000000000037859 -> '2:45', '.752'
 * - 3600500.00 ->             '1:00:00', '.500'
 * - 3720500.00 ->             '1:02:00', '.500'
 * @param ms
 */
function msToUserTimeTwoPart(ms) {
    let full_s = ms / 1000;
    let h = Math.floor(full_s / 3600);
    let m = Math.floor((full_s % 3600) / 60);
    let s = Math.floor(full_s % 60);
    let dStr = (full_s % 1).toFixed(3).slice(1);
    let hStr = h > 0 ? h + ':' : '';
    let mStr = h > 0 && m < 10 ? '0' + m + ':' : m + ':';
    let sStr = s < 10 ? '0' + s : '' + s;
    return [hStr + mStr + sStr, dStr];
}
/**
 * Like Python's collections.Counter
 */
class Counter {
    constructor() {
        this.data = new Map();
    }
    static from(i) {
        let c = new Counter();
        for (let val of i) {
            c.increment(val);
        }
        return c;
    }
    clear() {
        this.data.clear();
    }
    increment(key) {
        if (!this.data.has(key)) {
            this.data.set(key, 1);
        }
        else {
            let cur = this.data.get(key);
            this.data.set(key, cur + 1);
        }
    }
    get(key) {
        if (!this.data.has(key)) {
            return 0;
        }
        return this.data.get(key);
    }
    entries() {
        return this.data.entries();
    }
}
/// <reference path="../core/base.ts" />
/// <reference path="ecs.ts" />
var Events;
(function (Events) {
    /**
     * Slimmed down API of Manager.
     */
    class Firer {
        constructor(manager) {
            this.manager = manager;
        }
        dispatch(pkg, delay = 0) {
            this.manager.dispatch(pkg, delay);
        }
    }
    Events.Firer = Firer;
    /**
     * The Manager lets Systems dispatch events and Handlers register for them.
     * It manages the traffic from the former to the latter.
     */
    class Manager {
        constructor() {
            this.multiplexer = new Map();
            this.handlers = new Array();
            this.queue = new Array();
            this.toRemove = new Array();
            this.firer = new Firer(this);
        }
        // Public API
        // ---
        /**
         * Systems call dispatch to request that events be published.
         */
        dispatch(pkg, delay = 0) {
            this.queue.push({ pkg: pkg, remaining: delay });
        }
        /**
         * Game calls this to pass in the ecs reference.
         */
        init(ecs, scriptRunner) {
            this.ecs = ecs;
            this.scriptRunner = scriptRunner;
        }
        /**
         * Game calls this to add Handlers.
         */
        add(handler) {
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
        clear() {
            let toRemove = [];
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
        update(delta) {
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
        publish(pkg) {
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
        remove(handler) {
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
        deregister(et, handler) {
            // remove handler from the list of handlers handling that event
            // type.
            let hs = this.multiplexer.get(et);
            hs.splice(hs.indexOf(handler), 1);
        }
        /**
         * From now on, handler will get all et events.
         */
        register(et, handler) {
            if (!this.multiplexer.has(et)) {
                this.multiplexer.set(et, []);
            }
            this.multiplexer.get(et).push(handler);
        }
    }
    Events.Manager = Manager;
    /**
     * Base class for event handlers.
     */
    class Handler {
        constructor() {
            /**
             * incoming is sourced by the Manager and drained during the handler's
             * update by calling the dispatcher-mapped function.
             */
            this.incoming = new Array();
            /**
             * Handlers can set this at any point and they will never receive any
             * more events (even if more are available) (and they'll be
             * de-registered).
             */
            this.finished = false;
            /**
             * Handlers can set this to mark that they can be cleaned up upon scene
             * reset. (Otherwise Handlers, like Systems, persist throughout the
             * lifetime of the game.)
             */
            this.transient = false;
        }
        /**
         * Handlers can override to do logic that requires a working ecs.
         * (Called automatically after init(...) completes.)
         */
        setup() { }
        /**
         * Handlers can override to do any cleanup to remove scene-dependent
         * state (like stored Entities).
         */
        clear() { }
        //
        // None of these should need to be overridden.
        //
        /**
         * Manager calls this to pass in the ECS reference.
         */
        init(ecs, scriptRunner, firer) {
            // Save ECS, Runner, and Firer references.
            this.ecs = ecs;
            this.scriptRunner = scriptRunner;
            this.firer = firer;
            this.setup();
        }
        /**
         * Manager calls this to figure out what events this Handler handles.
         */
        eventsHandled() {
            return this.dispatcher.keys();
        }
        /**
         * Manager calls this to tell Handler about new events.
         */
        push(pkg) {
            this.incoming.push(pkg);
        }
        /**
         * Manager calls this to have Handler process all events it has
         * accumulated over the last frame.
         */
        update() {
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
    Events.Handler = Handler;
})(Events || (Events = {}));
var Engine;
(function (Engine) {
    /**
     * Provides slow motion functionality by deciding when to skip updates.
     *
     * API sketch:
     * - field requests for slow motion in raw format (duration and slowdown
     *	 factor)
     * - accept deltas and return whether the game should update (or how much)
     * - for sound effects: trigger events on when slowdown starts or stops
     *	 (maybe later)
     */
    class SlowMotion {
        constructor() {
            this.active = new Array();
            // for pause-style slow motion
            this.frameIdx = 0;
            /**
             * API: pause the game overall (debugging only). Doesn't tick regular
             * slowdowns forward.
             */
            this.debugPaused = false;
            /**
             * APU: slowdown the game overall (debugging only). Continues to tick
             * regular slowdowns forward.
             */
            this.debugFactor = 1;
        }
        /**
         * API: Request slow motion.
         * @param factor update every Nth frame (factor == N)
         * @param duration how long the slow motion lasts for
         */
        request(factor, duration) {
            this.active.push({ remaining: duration, factor: factor });
        }
        /**
         * Game calls this to decide how much to update.
         *
         * @param delta Time elapsed
         * @returns how much the game should update. Number depends on
         * implementation. For pause-style, this is either `delta` or 0. For
         * slowmotion-style, is is 0 <= val <= delta.
         */
        update(delta) {
            // shortcut even to slowmotion system: if paused
            if (this.debugPaused) {
                return 0;
            }
            // tick active slowdowns forward, remove any that are finished, and
            // compute the largest factor of the alive ones.
            let largest = 1;
            for (let i = this.active.length - 1; i >= 0; i--) {
                this.active[i].remaining -= delta;
                if (this.active[i].remaining <= 0) {
                    this.active.splice(i, 1);
                }
                else {
                    largest = Math.max(largest, this.active[i].factor);
                }
            }
            // if we do have a debug factor != 1, it also is a candidate for
            // the largest slowdown.
            largest = Math.max(largest, this.debugFactor);
            // pause-style slow motion: tick frame count and compute whether to
            // slow down
            this.frameIdx = (this.frameIdx + 1) % largest;
            return this.frameIdx == 0 ? delta : 0;
            // slowdown-style slow motion: decide delta to use
            // return delta / largest;
        }
    }
    Engine.SlowMotion = SlowMotion;
})(Engine || (Engine = {}));
/// <reference path="../core/util.ts" />
/// <reference path="events.ts" />
/// <reference path="slowmotion.ts" />
var Engine;
(function (Engine) {
    /**
     * Because someone can't get their shit together so I have to.
     *
     * More specifically: I want to treat the keys of a Map as a Set so I can
     * perform a set intersection. However, a Map's keys() method returns an
     * iterator. Thus, I'm tracking the keys as well as a separate set.
     */
    class ComponentContainer {
        constructor() {
            this.rawMap = new Map();
            this.rawKeys = new Set();
            this.rawSortedKeys = new Array();
        }
        /**
         * DO NOT CALL THIS. Use ecs.addComponent(...) instead. That will call
         * this, *and* update all the systems to know about the new component.
         *
         * (Should probably have done some more OO gymnastics to prevent this in
         * Typescript, but not worth the time yet.)
         *
         * @param component
         */
        add(component) {
            // some debug checking
            let name = component.name;
            if (this.rawMap.has(name)) {
                throw new Error('Can\'t add component "' + name + '"; already exists.');
            }
            // add it
            this.rawMap.set(name, component);
            this.rawKeys.add(name);
            // maintain sorted list for debug rendering
            this.rawSortedKeys.push(name);
            this.rawSortedKeys.sort();
        }
        /**
         * DO NOT CALL THIS. Use ecs.removeComponent(...) instead. That will
         * update the systems' bookkeeping.
         *
         * @param c Class of the component to delete (e.g., Component.Position).
         */
        delete(c) {
            // some debug checking
            if (!this.rawMap.has(c.name)) {
                throw new Error('Can\'t delete component "' + c.name + '"; doesn\'t exist.');
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
        get(c) {
            return this.rawMap.get(c.name);
        }
        has(...cs) {
            for (let c of cs) {
                if (!this.rawMap.has(c.name)) {
                    return false;
                }
            }
            return true;
        }
        keys() {
            return this.rawKeys;
        }
        sortedKeys() {
            return this.rawSortedKeys;
        }
        debugTable() {
            let res = [];
            for (let key of this.rawSortedKeys) {
                res.push([key, this.rawMap.get(key).toString()]);
            }
            return res;
        }
        size() {
            return this.rawKeys.size;
        }
    }
    /**
     * This is a get/has-only interface that can be used instead of
     * ComponentContainer. It can be used widely throughout the game without
     * fearing whether add() or delte() will accidentally be called.
     */
    class ComponentViewer {
        constructor(cc) {
            this.cc = cc;
        }
        /**
         * Directly gets a Component. Example: `get(Component.Position)`.
         * @param c
         */
        get(c) {
            return this.cc.get(c);
        }
        /**
         * Directly sees whether a Component is in the container. Example:
         * `has(Component.Position)`.
         * @param c
         */
        has(...cs) {
            return this.cc.has(...cs);
        }
    }
    Engine.ComponentViewer = ComponentViewer;
    class ECS {
        constructor(eventsManager) {
            this.eventsManager = eventsManager;
            /**
             * API: slow motion.
             */
            this.slowMotion = new Engine.SlowMotion();
            // Core fields.
            this.nextEntityID = 0;
            this.entities = new Map();
            this.systems = new Map();
            // So that we don't pull entities out mid-update.
            this.entitiesToDestroy = new Array();
            // Ugly extra data structures for doing more stuff on systems (priority
            // updates, turning off debug systems, signaling clearing ...)
            this.priorities = [];
            this.updateMap = new Map();
            this.systemNames = new Map();
            // Optimization for handing dirty components.
            /**
             * Map from <ComponentClass>.name to System.
             */
            this.dirtySystemsCare = new Map();
            this.dirtyEntities = new Map();
            // Timing. Could break out of ECS. Should there be other Engine-level
            // resources Systems have access to besides the ECS?
            this._gametime = 0;
            this._walltime = 0;
        }
        get gametime() {
            return this._gametime;
        }
        get walltime() {
            return this._walltime;
        }
        /**
         * This is how you make new Entities.
         */
        addEntity() {
            let entity = this.nextEntityID;
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
        removeEntity(entity) {
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
        destroyEntity(entity) {
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
        removeEntityFromSystem(entity, system) {
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
        clear() {
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
            this.nextEntityID = 0;
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
        componentDirty(entity, component) {
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
        addComponent(entity, component) {
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
        removeComponent(entity, c) {
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
        removeComponentIfExists(entity, c) {
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
        getComponents(entity) {
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
        addSystem(priority, system) {
            // debug checking
            if (system.componentsRequired.size == 0) {
                throw new Error("Can't add system " + system + "; empty components list.");
            }
            if (this.systems.has(system)) {
                throw new Error("Can't add system " + system + "; already exists.");
            }
            // give system a reference to the ecs and to the event manager
            system.ecs = this;
            system.eventsManager = this.eventsManager;
            // do any system-specified init
            system.init();
            // init its aspect mapping and populate
            this.systems.set(system, new Map());
            for (let entity of this.entities.keys()) {
                this.check(entity, system);
            }
            // internal bookkeeping for doing priority updates
            // update the array for doing the update order
            this.priorities = Array.from((new Set(this.priorities)).add(priority));
            this.priorities.sort(sortNumeric);
            // update the mapping accessed from that array
            if (!this.updateMap.has(priority)) {
                this.updateMap.set(priority, new Set());
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
        getSystem(s) {
            return this.systemNames.get(s.name);
        }
        /**
         * Toggles whether a system is enabled or disabled. Currently primarily
         * used for debugging.
         */
        toggleSystem(s) {
            this.toggleSystemInner(s.name, null);
        }
        /**
         * Used only when the System class is not known, onlys its name (currently only during
         * Debug). TODO: we can remove this as well if we figure out the types.
         * @param sName
         */
        toggleSystemByName(sName) {
            this.toggleSystemInner(sName, null);
        }
        /**
         * Disables a system.
         * @param name
         */
        disableSystem(s) {
            this.toggleSystemInner(s.name, false);
        }
        /**
         * Enables a system.
         * @param name
         */
        enableSystem(s) {
            this.toggleSystemInner(s.name, true);
        }
        toggleSystemInner(name, desired) {
            let sys = this.systemNames.get(name);
            if (!sys) {
                return;
            }
            // enable on OR set to toggle and system is disabled
            if (desired || (desired == null && sys.disabled)) {
                // enable
                sys.disabled = false;
                sys.onEnabled(this.systems.get(sys));
            }
            else {
                // disable
                sys.disabled = true;
                sys.onDisabled(this.systems.get(sys));
            }
        }
        /**
         * Call this to update all systems. Returns actual update timesetup
         * used (accounting for slow motion).
         */
        update(wallDelta, gameDelta, clockTower) {
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
                    clockTower.start(Measurement.T_SYSTEMS, sys.name);
                    // update. can't be disabled. debugOnly either must be off,
                    // or if it's on, the system must be a debug system.
                    if (!sys.disabled && (!debugOnly || sys.debug)) {
                        sys.update(delta, this.systems.get(sys), this.dirtyEntities.get(sys), clockTower);
                        // system clears its own dirty entity list after updating
                        this.dirtyEntities.get(sys).clear();
                    }
                    // timing
                    clockTower.end(Measurement.T_SYSTEMS, sys.name);
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
        finishUpdate() {
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
        debugStats() {
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
        check(entity, system) {
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
            }
            else {
                // this entity is not a match. it should not be in the system.
                this.removeEntityFromSystem(entity, system);
            }
        }
    }
    Engine.ECS = ECS;
    /**
     * An aspect is the subset of an Entity's Components that a System needs.
     * There is an instance of an Aspect for each each System/Entity pairing. It
     * is the System's view into the Entity's Components.
     */
    class Aspect {
        constructor() {
            //
            // No API here --- this is all internal crap.
            //
            this.repr = '';
        }
        /**
         * Directly gets a Component. Example: `aspect.get(Component.Position)`.
         *
         * @param c The Component class (e.g., Component.Position).
         */
        get(c) {
            return this.components.get(c);
        }
        /**
         * Check whether 1 or more components exist. Returns true only if all
         * components exist. Example: `aspect.has(Component.Position)`.
         *
         * @param cs One or more Component classes (e.g., Component.Position).
         */
        has(...cs) {
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
        setCC_(cc) {
            this.components = cc;
        }
        //
        // Debug API
        //
        debugComponentTable() {
            return this.components.debugTable();
        }
        toString() {
            if (this.repr == '') {
                var aspect = this.constructor;
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
    Engine.Aspect = Aspect;
    /**
     * A Component is a bundle of state. Each instance of a Component is associated
     * with a single Entity.
     *
     * Components have no API to fulfill.
     */
    class Component {
        constructor() {
            //
            // Internal stuff
            //
            /**
             * Overridden by ECS once it gets tracked by the game engine.
             */
            this.signal = () => { };
            // holy crap. this could get the static member, but it actually got the
            // name of the constructor == the name of the class (!).
            var component = this.constructor;
            this.name = component.name;
        }
        /**
         * A Component can manage signaling when it gets "dirty" if it wants to
         * support dirty component optimization by simply calling `dirty()` on
         * itself.
         */
        dirty() {
            this.signal();
        }
        toString() {
            // ✓
            return Constants.CHECKMARK;
        }
    }
    Engine.Component = Component;
    /**
     * A System cares about a set of components. It will run on every entity that
     * has that set of components. A System's state is not serialized.
     *
     * A System must specify the immutable set of Components it needs at compile
     * time. (Its immutability isn't enforced by anything but my wrath.) It also
     * must specify an update() method for what it wants to do every frame (if
     * anything).
     */
    class System {
        /**
         * @param disabled DO NOT SET THIS AFTER CONSTRUCTION. Use
         * ecs.toggleSystem(), ecs.disableSystem(), and ecs.enableSystem().
         * Lets systems start out disabled. Disabled systems are not updated.
         *
         * @param debug Denotes a debug system that is updated even when the
         * game is paused.
         */
        constructor(disabled = false, debug = false) {
            this.disabled = disabled;
            this.debug = debug;
            //
            // API Systems can override if they want:
            //
            /**
             * Set of <ComponentClass>.name; if ANY of them become dirty, the
             * system will be given that entity during its update. Very cool
             * feature: components here need not be tracked by componentsRequired.
             */
            this.dirtyComponents = new Set();
            // computed at runtime when needed. Down here because of syntax highlighter
            // bugs.
            this.repr = '';
        }
        /**
         * init() is called just after creation but before any other methods
         * (e.g. onAdd(...) or update(...)) are called. It can be used to setup
         * internal state that requires the ecs.
         */
        init() { }
        /**
         * makeAspect() is called to make a new aspect for this system (whenever
         * an entity is added). By default, systems get a standard Aspect. If
         * they override this, they can return a subclass of Aspect instead,
         * which they can use to store stuff in. Whatever they return here will
         * be the Aspect they get in onAdd(), onRemove(), and update().
         */
        makeAspect() {
            return new Aspect();
        }
        /**
         * onAdd() is called just AFTER an entity is added to a system. (It
         * *will* be in the system's set of entities.)
         */
        onAdd(aspect) { }
        /**
         * onRemove() is called just AFTER an entity is removed from a system.
         * (It will *not* be in the system's set of entities.)
         */
        onRemove(aspect) { }
        /**
         * onDisabled() is called when a system is disabled; after this, it
         * won't receive any more update() calls (until it is enabled again). It
         * is expected to clean up its state as necessary (e.g., wiping what
         * it's drawn from the screen).
         */
        onDisabled(entities) { }
        /**
         * onEnabled() is called when a system is enabled, having previously
         * been disabled.
         */
        onEnabled(entities) { }
        /**
         * onClear() is called after all entities have been cleared from the
         * ECS. It allows systems that build and maintain a pool of entities to
         * re-generate that pool.
         */
        onClear() { }
        //
        // Other bookkeeping internal crap:
        //
        get name() {
            let system = this.constructor;
            return system.name;
        }
        toString() {
            if (this.repr == '') {
                var system = this.constructor;
                let repr = system.name;
                let pieces = Array.from(this.componentsRequired);
                if (pieces.length > 0) {
                    repr += '[' + pieces.join(', ') + ']';
                }
                this.repr = repr;
            }
            return this.repr;
        }
    }
    Engine.System = System;
})(Engine || (Engine = {}));
var Saving;
(function (Saving) {
    function save(sceneName, trackNames, bookkeeper) {
        localStorage.setItem('/fallgate/save/scene', sceneName);
        console.info('[Saving] Saved scene: ' + sceneName);
        let serializedTracks = trackNames.join(';');
        localStorage.setItem('/fallgate/save/tracks', serializedTracks);
        console.info('[Saving] Saved tracks: ' + serializedTracks);
        localStorage.setItem('/fallgate/save/bookkeeper', bookkeeper);
        console.info('[Saving] Saved bookkeeper: ' + bookkeeper);
    }
    Saving.save = save;
    function clear() {
        localStorage.clear();
        console.info('[Saving] Cleared all save data');
    }
    Saving.clear = clear;
    function load() {
        let sceneName = localStorage.getItem('/fallgate/save/scene');
        console.info('[Saving] Loaded scene: ' + sceneName);
        let trackIDs = null;
        let tracks = localStorage.getItem('/fallgate/save/tracks');
        if (tracks != null) {
            trackIDs = tracks.split(';');
        }
        console.info('[Saving] Loaded tracks: ' + trackIDs);
        let bookkeeper = localStorage.getItem('/fallgate/save/bookkeeper');
        console.info('[Saving] Loaded bookkeeper: ' + bookkeeper);
        return [sceneName, trackIDs, bookkeeper];
    }
    Saving.load = load;
})(Saving || (Saving = {}));
/// <reference path="../../lib/howler.d.ts" />
/// <reference path="../gj7/sound.ts" />
var System;
(function (System) {
    /**
     * Handles audio.
     */
    class Audio extends Engine.System {
        constructor(collection) {
            super();
            this.collection = collection;
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
            // bounds stuff
            this.boundsGetter = null;
            this.viewportSize = null;
            this.cacheMinBounds = new Point();
            this.cacheMaxBounds = new Point();
            // settings
            this.effectVolume = 1.0;
            this.musicVolume = 0.7;
            this.effectsOn = true;
            this.musicOn = true;
            // internal data structure of load(ing/ed) sounds and music
            this.sounds = new Map();
            this.music = new Map();
            // queue for frame buffering
            this.queue = [];
            this.playedThisFrame = new Set();
            // cache for what music shouuld be playing
            this.playingMusic = [];
        }
        /**
         * @returns this (for convenience).
        */
        load() {
            // Load all sound effects and music.
            for (let [trackID, track] of this.collection.entries()) {
                let h;
                if (track.music) {
                    // create an audio sprite for music
                    let volume = track.volume * this.musicVolume;
                    this.music.set(trackID, {
                        volume: volume,
                        howl: new Howl({
                            src: track.path,
                            html5: true,
                            volume: volume,
                            sprite: {
                                main: [0, track.duration, true],
                            }
                        }),
                    });
                }
                else {
                    // sound effects are simpler
                    let volume = track.volume * this.effectVolume;
                    this.sounds.set(trackID, {
                        volume: volume,
                        howl: new Howl({
                            src: track.path,
                            volume: volume,
                        })
                    });
                }
            }
            return this;
        }
        /**
         * @param only Only these will be played; all others will be stopped.
         */
        playMusic(only) {
            let s = new Set(only);
            // always update cache of what should be playing
            arrayClear(this.playingMusic);
            for (let track of s) {
                this.playingMusic.push(track);
            }
            // if music is disabled, we do nothing
            if (!this.musicOn) {
                return;
            }
            // otherwise, we ensure the requested tracks are playing, and all
            // others are not (by fading them out)
            for (let [trackID, hpkg] of this.music.entries()) {
                let h = hpkg.howl;
                if (s.has(trackID)) {
                    // always turn up its volume (in case it was disabled)
                    h.volume(hpkg.volume);
                    // ensure it's playing
                    if (!h.playing()) {
                        h.seek(0);
                        h.play('main');
                    }
                }
                else {
                    // ensure it's not playing
                    if (h.playing()) {
                        h.fade(h.volume(), 0.0, 1500);
                        h.once('fade', function () {
                            h.stop();
                        });
                    }
                }
            }
        }
        disableMusic() {
            for (let [trackID, hpkg] of this.music.entries()) {
                hpkg.howl.volume(0);
            }
        }
        /**
         * API for toggling music.
         */
        toggleMusic() {
            this.musicOn = !this.musicOn;
            let w = '', f = '';
            if (this.musicOn) {
                this.playMusic(this.playingMusic);
                w = 'on';
                f = 'On';
            }
            else {
                this.disableMusic();
                w = 'off';
                f = 'Off';
            }
            this.ecs.getSystem(System.GUIManager).runSequence('notification', new Map([['notification', 'music ' + w]]), new Map([['notification', 'HUD/music' + f]]));
        }
        /**
         * API for toggling sound effects.
         */
        toggleEffects() {
            this.effectsOn = !this.effectsOn;
            let w = this.effectsOn ? 'on' : 'off';
            let f = this.effectsOn ? 'On' : 'Off';
            this.ecs.getSystem(System.GUIManager).runSequence('notification', new Map([['notification', 'sound effects ' + w]]), new Map([['notification', 'HUD/sound' + f]]));
            // Nothing else needs to happen here because sound effects are
            // short. We simply decide whether to play future effects based on
            // this setting.
        }
        /**
         * API to get all music that should currently be playing (regardless of whether
         * music volume is off).
         *
         * This is necessary for saving, because we don't specify the music in every
         * stage.
         */
        getPlaying() {
            return Array.from(this.playingMusic);
        }
        play(options, location = null) {
            // sanity checking
            if (options == null) {
                return;
            }
            // if we have no location info or can't determine bounds, just play
            // the sound.
            if (location == null || this.boundsGetter == null || this.viewportSize == null) {
                this.playHelper(options);
                return;
            }
            // get bounds and check
            this.boundsGetter.getViewBounds(this.viewportSize, this.cacheMinBounds, this.cacheMaxBounds, 20);
            if (location.x < this.cacheMinBounds.x || location.x > this.cacheMaxBounds.x ||
                location.y < this.cacheMinBounds.y || location.y > this.cacheMaxBounds.y) {
                return;
            }
            // bounds check OK, play.
            this.playHelper(options);
        }
        /**
         * Picks one of `options` and plays it.
         * @param options
         */
        playHelper(options) {
            // checks and picking track ID
            if (options.length == 0) {
                console.warn('Tried to play sound with no TrackID options.');
                return;
            }
            let idx = Probability.uniformInt(0, options.length - 1);
            let trackID = options[idx];
            if (!this.sounds.has(trackID)) {
                console.warn('Tried to play unknown trackID "' + trackID + '".');
                console.warn('All known trackIDs: ' + mapKeyArr(this.sounds));
                return;
            }
            // enqueue
            this.queue.push(trackID);
        }
        onClear() {
            arrayClear(this.queue);
            this.playedThisFrame.clear();
        }
        // Plays all queued sound effects, avoiding duplicates.
        update(delta, entities) {
            this.playedThisFrame.clear();
            while (this.queue.length > 0) {
                let trackID = this.queue.pop();
                // ensure not already played
                if (this.playedThisFrame.has(trackID)) {
                    continue;
                }
                // ensure not muted
                if (!this.effectsOn) {
                    continue;
                }
                // play it
                let hpkg = this.sounds.get(trackID);
                let h = hpkg.howl;
                if (h.state() === 'loaded') {
                    h.play();
                    this.playedThisFrame.add(trackID);
                }
            }
        }
    }
    __decorate([
        override
    ], Audio.prototype, "onClear", null);
    System.Audio = Audio;
})(System || (System = {}));
// language infrastructure functions. should be kept as light as possible as
// this will be imported everywhere.
//
// decorators
//
// override(...) is from https://github.com/Microsoft/TypeScript/issues/2000
/**
 * Method decorator that ensures a super function really is being overridden.
 * @param target
 * @param propertyKey
 * @param descriptor
 */
function override(target, propertyKey, descriptor) {
    var baseType = Object.getPrototypeOf(target);
    if (typeof baseType[propertyKey] !== 'function') {
        throw new Error('Method ' + propertyKey + ' of ' + target.constructor.name + ' does not override any base class method');
    }
}
/// <reference path="../core/base.ts" />
/**
 * This file contains game-level constants.
 */
var Constants;
(function (Constants) {
    // Game-level constants
    Constants.FN_CONFIG = 'assets/data/config.json';
    Constants.BGColor = 0x050505;
    Constants.DELTA_MS = 16.669;
    // strings
    Constants.CHECKMARK = '\u{2713}'; // ✓
    Constants.XMARK = '\u{2717}'; // ✗
})(Constants || (Constants = {}));
/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="../../lib/pixi-layers.d.ts" />
/// <reference path="../core/lang.ts" />
/// <reference path="../core/util.ts" />
/// <reference path="../gj7/constants.ts" />
// Z levels for this particular game.
var ZLevelWorld;
(function (ZLevelWorld) {
    ZLevelWorld[ZLevelWorld["BG"] = 10] = "BG";
    ZLevelWorld[ZLevelWorld["Carpet"] = 20] = "Carpet";
    ZLevelWorld[ZLevelWorld["Blood"] = 22] = "Blood";
    ZLevelWorld[ZLevelWorld["LockOn"] = 24] = "LockOn";
    ZLevelWorld[ZLevelWorld["Item"] = 26] = "Item";
    ZLevelWorld[ZLevelWorld["Sparkle"] = 28] = "Sparkle";
    ZLevelWorld[ZLevelWorld["Object"] = 30] = "Object";
    ZLevelWorld[ZLevelWorld["Building"] = 40] = "Building";
    ZLevelWorld[ZLevelWorld["Lighting"] = 45] = "Lighting";
    ZLevelWorld[ZLevelWorld["Top"] = 50] = "Top";
    ZLevelWorld[ZLevelWorld["AboveTop"] = 55] = "AboveTop";
    ZLevelWorld[ZLevelWorld["Flags"] = 57] = "Flags";
    ZLevelWorld[ZLevelWorld["Particles"] = 60] = "Particles";
    // TODO: remove HUD when possible
    ZLevelWorld[ZLevelWorld["HUD"] = 70] = "HUD";
    ZLevelWorld[ZLevelWorld["HUDLower"] = 72] = "HUDLower";
    ZLevelWorld[ZLevelWorld["HUDMiddle"] = 74] = "HUDMiddle";
    ZLevelWorld[ZLevelWorld["HUDTop"] = 76] = "HUDTop";
    ZLevelWorld[ZLevelWorld["DEBUG"] = 9000] = "DEBUG";
})(ZLevelWorld || (ZLevelWorld = {}));
var ZLevelHUD;
(function (ZLevelHUD) {
    ZLevelHUD[ZLevelHUD["Lighting"] = 0] = "Lighting";
    ZLevelHUD[ZLevelHUD["Back"] = 5] = "Back";
    ZLevelHUD[ZLevelHUD["Mid"] = 10] = "Mid";
    ZLevelHUD[ZLevelHUD["Front"] = 20] = "Front";
    ZLevelHUD[ZLevelHUD["Overlay"] = 30] = "Overlay";
    ZLevelHUD[ZLevelHUD["Points"] = 40] = "Points";
    ZLevelHUD[ZLevelHUD["Particles"] = 50] = "Particles";
    ZLevelHUD[ZLevelHUD["Button"] = 80] = "Button";
    ZLevelHUD[ZLevelHUD["PlayerHUD"] = 200] = "PlayerHUD";
    ZLevelHUD[ZLevelHUD["PlayerHUDBottom"] = 201] = "PlayerHUDBottom";
    ZLevelHUD[ZLevelHUD["PlayerHUDMid"] = 202] = "PlayerHUDMid";
    ZLevelHUD[ZLevelHUD["PlayerHUDTop"] = 203] = "PlayerHUDTop";
    ZLevelHUD[ZLevelHUD["Wash"] = 500] = "Wash";
    ZLevelHUD[ZLevelHUD["BigOverlay"] = 600] = "BigOverlay";
    ZLevelHUD[ZLevelHUD["ComboWash"] = 700] = "ComboWash";
    ZLevelHUD[ZLevelHUD["PausedWash"] = 800] = "PausedWash";
    ZLevelHUD[ZLevelHUD["PausedText"] = 801] = "PausedText";
    ZLevelHUD[ZLevelHUD["Letterbox"] = 900] = "Letterbox";
    ZLevelHUD[ZLevelHUD["Curtain"] = 1000] = "Curtain";
    ZLevelHUD[ZLevelHUD["Notification"] = 2000] = "Notification";
    ZLevelHUD[ZLevelHUD["DEBUG"] = 9000] = "DEBUG";
})(ZLevelHUD || (ZLevelHUD = {}));
// Keep StageTarget and ZLevelEnums in sync, please!
var StageTarget;
(function (StageTarget) {
    StageTarget[StageTarget["World"] = 0] = "World";
    StageTarget[StageTarget["HUD"] = 1] = "HUD";
})(StageTarget || (StageTarget = {}));
const ZLevelEnums = [
    ZLevelWorld,
    ZLevelHUD
];
/**
 * These Z levels should have particle container stages used rather than normal
 * continers.
 */
const ParticleContainerZs = new Map([
    [StageTarget.World, new Set([ZLevelWorld.Particles, ZLevelWorld.Blood])],
    [StageTarget.HUD, new Set([ZLevelHUD.Particles])],
]);
var Stage;
(function (Stage) {
    // Implementing objects
    class Container extends PIXI.Container {
        constructor(z, stageTarget, initChildren = []) {
            super();
            this.z = z;
            this.stageTarget = stageTarget;
            for (let c of initChildren) {
                this.addChild(c);
            }
        }
    }
    Stage.Container = Container;
    class Layer extends PIXI.display.Layer {
        constructor(z, stageTarget) {
            super();
            this.z = z;
            this.stageTarget = stageTarget;
        }
    }
    Stage.Layer = Layer;
    class Graphics extends PIXI.Graphics {
        constructor(z, stageTarget) {
            super();
            this.z = z;
            this.stageTarget = stageTarget;
        }
    }
    Stage.Graphics = Graphics;
    class Sprite extends PIXI.Sprite {
        constructor(texture, z, stageTarget) {
            super(texture);
            this.z = z;
            this.stageTarget = stageTarget;
        }
        static build(img, z, stageTarget, position, anchor = new Point(0, 1)) {
            let sprite = new Sprite(PIXI.Texture.fromFrame(img), z, stageTarget);
            sprite.anchor.set(anchor.x, anchor.y);
            sprite.position.set(position.x, position.y);
            return sprite;
        }
    }
    Stage.Sprite = Sprite;
    class GameText extends PIXI.Text {
        constructor(text, style, z, stageTarget) {
            super(text, style);
            this.z = z;
            this.stageTarget = stageTarget;
        }
    }
    Stage.GameText = GameText;
    // Once we have a DisplayObject that has a ZLevel and StageTarget set, we
    // can add raw PIXI.DisplayObjects in it because each sub-object doesn't
    // need additional the Z-level bookkeeping. (In fact, sub-objects
    // *shouldn't* have this Z information because it will not be looked at by
    // any game component, and it'd be misleading to have it.) So here are some
    // utilities to build PIXI things.
    /**
     * Helper function for creating `PIXI.Sprite`s with one-liners.
     * @param img
     * @param position
     * @param anchor
     */
    function buildPIXISprite(img, position, anchor = new Point(0, 1)) {
        let sprite = new PIXI.Sprite(PIXI.Texture.fromFrame(img));
        sprite.anchor.set(anchor.x, anchor.y);
        sprite.position.set(position.x, position.y);
        return sprite;
    }
    Stage.buildPIXISprite = buildPIXISprite;
    /**
     * The overall stage object that levels interact with.
     *
     * Contains a single 'MainStageCore'.
     *
     * The 'MainStageCore' houses 'MultiZStage's, each of which is drawn in order
     * (e.g. world, then HUD).
     *
     * Each 'MultiZStage' houses 'ZStage's, which contain objects at a certain Z
     * level. The ZStages are "normal" containers, in that they hold
     * DisplayObjects.
     */
    class MainStage {
        constructor() {
            this.stage = new MainStageCore();
            // Mapping from chosen numbers to indices.
            this.mapping = new Map();
            // get all valid stage targets. Map from chosen numbers to 0-based
            // indices.
            var ts = enumSortedVals(StageTarget);
            for (var i = 0; i < ts.length; i++) {
                this.mapping.set(ts[i], i);
                this.stage.addChildAt(new MultiZStage(ts[i], ZLevelEnums[i]), i);
            }
        }
        add(obj) {
            var idx = this.mapping.get(obj.stageTarget);
            var stage = this.stage.getChildAt(idx);
            stage.add(obj);
        }
        remove(obj) {
            var idx = this.mapping.get(obj.stageTarget);
            var stage = this.stage.getChildAt(idx);
            stage.remove(obj);
        }
        render(renderer) {
            renderer.render(this.stage);
        }
        /*
         * Get a particular stage. This is done only for the camera (normally it
         * shouldn't be needed).
         */
        camera_get(t) {
            return this.stage.getChildAt(t);
        }
    }
    Stage.MainStage = MainStage;
    /**
     * Should only exist as the overall stage in a MainStage instance.
     */
    class MainStageCore extends PIXI.display.Stage {
        getChildAt(index) {
            if (index < 0 || index >= this.children.length) {
                throw new Error('getChildAt: Supplied index ' + index + ' does not exist in the child list, or the supplied DisplayObject is not a child of the caller');
            }
            return this.children[index];
        }
    }
    __decorate([
        override
    ], MainStageCore.prototype, "getChildAt", null);
    /**
     * Stage with multiple z-levels. 'World' and 'HUD' are examples of
     * 'MultiZStage's.
     */
    class MultiZStage extends PIXI.Container {
        // Pre-create our z-level stages.
        constructor(stagetTarget, z_enum) {
            super();
            // Mapping from chosen Z numbers to container indices.
            this.mapping = new Map();
            // anchor the stage itself
            // Get all valid stage targets. Map from chosen numbers to 0-based
            // indices.
            var zs = enumSortedVals(z_enum);
            for (var i = 0; i < zs.length; i++) {
                this.mapping.set(zs[i], i);
                // decide whether the z stage is going to be a standard
                // container or a particle one.
                let zStage;
                if (ParticleContainerZs.get(stagetTarget).has(zs[i])) {
                    zStage = new PIXI.particles.ParticleContainer(undefined, {
                        alpha: true,
                        position: true,
                        rotation: true,
                        vertices: true,
                        tint: true,
                        uvs: true,
                    });
                }
                else {
                    zStage = new PIXI.Container();
                }
                // plop it in
                this.addChildAt(zStage, i);
            }
        }
        getChildAt(index) {
            if (index < 0 || index >= this.children.length) {
                throw new Error('getChildAt: Supplied index ' + index + ' does not exist in the child list, or the supplied DisplayObject is not a child of the caller');
            }
            return this.children[index];
        }
        add(obj) {
            var idx = this.mapping.get(obj.z);
            var stage = this.getChildAt(idx);
            // TODO: Track indices ourself so we can do 2n removal instead of
            // n.
            stage.addChild(obj);
        }
        remove(obj) {
            var idx = this.mapping.get(obj.z);
            var stage = this.getChildAt(idx);
            // TODO: Track indices ourself so we can do 2n removal instead of
            // n.
            stage.removeChild(obj);
        }
        /**
         * Call this on The World MultiZStage to get the game world min & max x,
         * y coordinates of the visible area. (Used, e.g., for audio culling
         * sound effects.)
         *
         * @param viewportDims
         * @param outMin
         * @param outMax
         * @param buffer Widen bounds by this much on each side (so 2x per
         * dimension) to be a bit generous about some bounds checking (e.g., for
         * audio effects near the border).
         */
        getViewBounds(viewportDims, outMin, outMax, buffer = 0) {
            let minX = -(this.x / this.scale.x);
            let minY = -(this.y / this.scale.y);
            let w = viewportDims.x / this.scale.x;
            let h = viewportDims.y / this.scale.y;
            outMin.set_(minX - buffer, minY - buffer);
            outMax.set_(minX + w + buffer, minY + h + buffer);
        }
    }
    __decorate([
        override
    ], MultiZStage.prototype, "getChildAt", null);
    Stage.MultiZStage = MultiZStage;
    class Translator {
        constructor(hud, world, viewportSize, gameScale) {
            this.hud = hud;
            this.world = world;
            this.viewportSize = viewportSize;
            this.gameScale = gameScale;
            this.cacheHUDPos = new PIXI.Point();
            this.cacheWorldPos = new PIXI.Point();
        }
        /**
         * Transforms the provided point from world to hud coordinates. Mutates
         * the point. Also returns it, for convenience (no new Points are
         * created).
         */
        worldToHUD(point) {
            // world -> hud coordinates
            let wp = this.cacheWorldPos;
            let hp = this.cacheHUDPos;
            wp.set(point.x, point.y);
            this.hud.toLocal(wp, this.world, hp, true); // sets results into hp
            point.set_(hp.x, hp.y);
            return point;
        }
        /**
         * Transforms the provided point from HUD (raw, actual) coordinates to
         * HUD *base* (640 x 360) coordinates. Returns the same point for
         * convenience. No new points are created.
         */
        HUDtoHUDBase(point) {
            return point.set_(Math.round((point.x / this.viewportSize.x) * 640), Math.round((point.y / this.viewportSize.y) * 360));
        }
        /**
         * Transforms the provided point from world to HUD *base* (640 x 360)
         * (unscaled) coordinates. Returns the same point for convenience. No
         * new points are created.
         */
        worldToHUDBase(point) {
            return this.HUDtoHUDBase(this.worldToHUD(point));
        }
        /**
         * Transforms the provided point from HUD base (640 x 360) coordinates
         * coordinates to (raw, actual) HUD (likely 720p or 1080p) coordinates.
         * Returns the same point for convenience. No new points are created.
         */
        HUDbaseToHUD(point) {
            return point.set_(Math.round((point.x / 640) * this.viewportSize.x), Math.round((point.y / 360) * this.viewportSize.y));
        }
        /**
         * Transforms the provided point from HUD (raw, actual) coordinates
         * (e.g., 720p or 1080p) to world coordinates. Returns the same point
         * for convenience. No new points are created.
         */
        HUDtoWorld(point) {
            // hud -> world coordinates
            let wp = this.cacheWorldPos;
            let hp = this.cacheHUDPos;
            hp.set(point.x, point.y);
            this.world.toLocal(hp, this.hud, wp, true); // sets results into wp
            point.set_(wp.x, wp.y);
            return point;
        }
        /**
         * Transforms the provided point from HUD base (640 x 360) coordinates
         * coordinates to world coordinates. Returns the same point for
         * convenience. No new points are created.
         */
        HUDBaseToWorld(point) {
            return this.HUDtoWorld(this.HUDbaseToHUD(point));
        }
    }
    Stage.Translator = Translator;
})(Stage || (Stage = {}));
/// <reference path="../engine/ecs.ts" />
/**
 * Part answers the question of "what aspects of an entity should be rendered?"
 *
 * This will be only a few simple things for now (e.g. body + sword), but could
 * be expanded to include things like armor, water splashing, or wounds.
 *
 * This is a 'choose n' enum, much like CollisionType.
 */
var Part;
(function (Part) {
    /**
     * The 'core' part of an entity. This will be the physical body of a sprite,
     * or the entirety of a scenery object (like a flag).
     */
    Part[Part["Core"] = 0] = "Core";
    /**
     * When the entity has a visible weapon.
     */
    Part[Part["Weapon"] = 1] = "Weapon";
    /**
     * When the entity has a visible shield.
     */
    Part[Part["Shield"] = 2] = "Shield";
    /**
     * Special effects (like a big sword swoosh).
     */
    Part[Part["Fx"] = 3] = "Fx";
})(Part || (Part = {}));
/**
 * PartID answers the question of: "how should each Part be rendered?"
 *
 * For a Core Partart, it will decide, e.g., the stance based on the equipped
 * weapon. For the Weapon or Shield Part, it will be which weapon to render.
 */
var PartID;
(function (PartID) {
    /**
     * The 'default' part ID; used esp for an entity's Action where the Part
     * always has one way it is rendered (e.g., an entity's idle/core/x
     * always is displayed the same no matter what weapon it is holding).
     */
    PartID[PartID["Default"] = 0] = "Default";
    /**
     * A sword-relevant part (e.g., the character's stance while holding a
     * sword (x/core/sword); the sword itself (x/weapon/sword)).
     */
    PartID[PartID["Sword"] = 1] = "Sword";
    /**
     * An axe-relevant part.
     */
    PartID[PartID["Axe"] = 2] = "Axe";
    /**
     * A bow-relevant part.
     */
    PartID[PartID["Bow"] = 3] = "Bow";
})(PartID || (PartID = {}));
var Component;
(function (Component) {
    class Body extends Engine.Component {
        constructor() {
            super(...arguments);
            /**
             * For optimization: can be set for simple animatable entities to
             * ignore all the body part checking and just set the mapping to the
             * default value.
             *
             * TODO: probably remove this.
             */
            this.coreDefaultOnly = false;
            this._parts = new Map();
        }
        /**
         * Does underlying part update. Callers should use setParts(...)
         * instead to avoid setting the dirty flag whenever possible.
         */
        updateParts(v) {
            mapClone(v, this._parts);
            this.dirty();
        }
        /**
         * Call to set body parts. Handles smartly only setting dirty flag upon
         * actual mutations.
         */
        setParts(v) {
            // only need to mark as dirty if v is different than cur.
            // shortcut check: if sizes different, for sure different.
            if (v.size != this._parts.size) {
                this.updateParts(v);
                return;
            }
            // same size. check each new. if any aren't there+same, different.
            for (let [nk, nv] of v.entries()) {
                if ((!this._parts.has(nk)) || this._parts.get(nk) !== nv) {
                    this.updateParts(v);
                    return;
                }
            }
            // all same; nothing to do!
        }
        /**
         * Call to get iterator over [Part, PartID] pairs.
         */
        getParts() {
            return this._parts.entries();
        }
        /**
         * Call to get PartID for Part.
         */
        getPart(part) {
            return this._parts.get(part);
        }
        toString() {
            return mapString(this._parts, (p) => Part[p], (p) => PartID[p]);
        }
    }
    Component.Body = Body;
})(Component || (Component = {}));
/// <reference path="sound.ts" />
var Shield;
(function (Shield) {
    let BlockState;
    (function (BlockState) {
        BlockState[BlockState["Idle"] = 0] = "Idle";
        BlockState[BlockState["Raise"] = 1] = "Raise";
        BlockState[BlockState["Block"] = 2] = "Block";
        BlockState[BlockState["Lower"] = 3] = "Lower";
    })(BlockState = Shield.BlockState || (Shield.BlockState = {}));
    function cloneShield(orig) {
        // make "basic" copy for primitive types
        let res = clone(orig);
        // fixup objects
        res.block.cboxDims = orig.block.cboxDims.copy();
        res.block.cboxOffset = orig.block.cboxOffset.copy();
        return res;
    }
    Shield.cloneShield = cloneShield;
    function extendShield(parent, child) {
        let shield = cloneShield(parent.shield);
        // full or per-item overrides
        objOverride(shield, child.shield, 'timing');
        objOverride(shield, child.shield, 'block');
        objOverride(shield, child.shield, 'sounds');
        return {
            shield: shield,
            animations: Anim.extendAnims(parent.animations, child.animations),
        };
    }
    Shield.extendShield = extendShield;
})(Shield || (Shield = {}));
/// <reference path="../component/body.ts" />
/// <reference path="sound.ts" />
var Weapon;
(function (Weapon) {
    let SwingState;
    (function (SwingState) {
        SwingState[SwingState["Idle"] = 0] = "Idle";
        SwingState[SwingState["ChargeCharging"] = 1] = "ChargeCharging";
        SwingState[SwingState["ChargeReady"] = 2] = "ChargeReady";
        SwingState[SwingState["Swing"] = 3] = "Swing";
        SwingState[SwingState["Sheathe"] = 4] = "Sheathe";
        SwingState[SwingState["QuickAttack"] = 5] = "QuickAttack";
        SwingState[SwingState["QuickAttack2"] = 6] = "QuickAttack2";
        SwingState[SwingState["Combo"] = 7] = "Combo";
    })(SwingState = Weapon.SwingState || (Weapon.SwingState = {}));
    let AttackMovement;
    (function (AttackMovement) {
        AttackMovement[AttackMovement["Track"] = 0] = "Track";
        AttackMovement[AttackMovement["Launch"] = 1] = "Launch";
    })(AttackMovement = Weapon.AttackMovement || (Weapon.AttackMovement = {}));
    let AttackType;
    (function (AttackType) {
        AttackType[AttackType["Quick"] = 0] = "Quick";
        AttackType[AttackType["Swing"] = 1] = "Swing";
        AttackType[AttackType["Combo"] = 2] = "Combo";
    })(AttackType = Weapon.AttackType || (Weapon.AttackType = {}));
    /**
     * NOTE: it's gross (and seems bug-prone) that we have to do this. Is there
     * a better way?
     *
     * @param orig
     */
    function cloneAttackInfo(orig) {
        if (orig == null) {
            return null;
        }
        // make "basic" copy for primitive types
        let res = clone(orig);
        // fixup objects
        if (orig.cboxDims != null) {
            res.cboxDims = orig.cboxDims.copy();
        }
        if (res.cboxOffset != null) {
            res.cboxOffset = orig.cboxOffset.copy();
        }
        if (orig.animDatas != null) {
            res.animDatas = new Map();
            for (let [key, data] of orig.animDatas.entries()) {
                res.animDatas.set(key, Anim.cloneData(data));
            }
        }
        return res;
    }
    Weapon.cloneAttackInfo = cloneAttackInfo;
    function cloneWeapon(orig) {
        // make "basic" copy for primitive types
        let res = clone(orig);
        // fixup objects
        res.swingAttack = cloneAttackInfo(orig.swingAttack);
        res.quickAttack = cloneAttackInfo(orig.quickAttack);
        res.comboAttack = cloneAttackInfo(orig.comboAttack);
        return res;
    }
    Weapon.cloneWeapon = cloneWeapon;
    /**
     * Creates a NEW weapon which is parent piece-wise extended by child.
     *
     * The extensions work as follows:
     *   weapon:
     *     - timing: full spec and per-item overrides supported
     *     - attacks: attack additions and per-item overrides supported
     *     - partID: override supported
     *   animations:
     *    - per-animation override supported (must override the entire entry)
     *
     * @param parent
     * @param child
     */
    function extendWeapon(parent, child) {
        // build up the weapon
        let weapon = cloneWeapon(parent.weapon);
        // allow full or per-item timing overrides
        objOverride(weapon, child.weapon, 'timing');
        // NOTE: not allowing null to disable parent weapons. could implement
        // (would need to let conversion explicitly set null values and then do
        // an object property check)
        // allow full or per-item attack overrides
        for (let attack of ['swingAttack', 'quickAttack', 'comboAttack']) {
            objOverride(weapon, child.weapon, attack);
        }
        if (child.weapon.partID != null) {
            weapon.partID = child.weapon.partID;
        }
        return {
            weapon: weapon,
            animations: Anim.extendAnims(parent.animations, child.animations),
        };
    }
    Weapon.extendWeapon = extendWeapon;
})(Weapon || (Weapon = {}));
/// <reference path="../component/body.ts" />
/// <reference path="../graphics/stage.ts" />
/// <reference path="shield.ts" />
/// <reference path="sound.ts" />
/// <reference path="weapon.ts" />
var Conversion;
(function (Conversion) {
    function jsonToScenes(data) {
        let res = new Map();
        for (let name in data) {
            res.set(name, data[name]);
        }
        return res;
    }
    Conversion.jsonToScenes = jsonToScenes;
    function jsonToSeasons(data) {
        let res = new Map();
        for (let name in data) {
            res.set(name, data[name]);
        }
        return res;
    }
    Conversion.jsonToSeasons = jsonToSeasons;
    function jsonToSounds(data) {
        let res = new Map();
        for (let trackID in data) {
            let rawTrack = data[trackID];
            let track = {
                path: rawTrack.path,
                volume: rawTrack.volume || 1.0,
                music: rawTrack.music || false,
                duration: rawTrack.duration || -1,
            };
            res.set(trackID, track);
        }
        return res;
    }
    Conversion.jsonToSounds = jsonToSounds;
    function jsonToFXConfigs(data) {
        let res = new Map();
        for (let fxName in data) {
            res.set(fxName, data[fxName]);
        }
        return res;
    }
    Conversion.jsonToFXConfigs = jsonToFXConfigs;
    function jsonToAttribute(data) {
        let ret = {
            'hitSettings': data['hitSettings'],
            'hitFX': data['hitFX'],
            'hitBlood': data['hitBlood'],
            'deathFX': data['deathFX'],
            'deathBlood': data['deathBlood'],
        };
        if (data['hitSettings']) {
            ret.hitSettings.hitBehavior = Attributes.HitBehavior[data['hitSettings']['hitBehavior']];
        }
        return ret;
    }
    function jsonToAttributes(data) {
        let res = new Map();
        for (let entityName in data) {
            res.set(entityName, jsonToAttribute(data[entityName]));
        }
        return res;
    }
    Conversion.jsonToAttributes = jsonToAttributes;
    /**
     * Generic function to handle json conversion w/ inheritance.
     * @param data
     */
    function inheritanceBuild(data, parentProp, jsonToObject, extendObject) {
        let res = new Map();
        let children = new Map();
        // build up objects w/o children
        for (let objectName in data) {
            let jsonObject = data[objectName];
            if (jsonObject[parentProp] == null) {
                res.set(objectName, jsonToObject(jsonObject));
            }
            else {
                children.set(objectName, jsonObject);
            }
        }
        // build children. note because inheritance could have depth and we
        // have random iteration order, we re-iterate. this could have O(n^2)
        // runtime but n is so small it doesn't matter.
        let prevNChildren = children.size;
        let toRemove = [];
        while (children.size > 0) {
            // drain all possible
            for (let [objectName, jsonObject] of children.entries()) {
                if (res.has(jsonObject[parentProp])) {
                    let parentObject = res.get(jsonObject[parentProp]);
                    let childObject = jsonToObject(jsonObject);
                    res.set(objectName, extendObject(parentObject, childObject));
                    toRemove.push(objectName);
                }
            }
            while (toRemove.length > 0) {
                children.delete(toRemove.pop());
            }
            // sanity check for orphans
            if (children.size == prevNChildren) {
                throw new Error('Missing chain from child to parent. ' +
                    'Remaining children: ' + mapKeyString(children));
            }
            prevNChildren = children.size;
        }
        return res;
    }
    Conversion.inheritanceBuild = inheritanceBuild;
    /**
     * Turn JSON weapon config file to game-usable data.
     * @param data
     */
    function jsonToWeapons(data) {
        return inheritanceBuild(data, 'parent', jsonToWeapon, Weapon.extendWeapon);
    }
    Conversion.jsonToWeapons = jsonToWeapons;
    /**
     * Helper function to take a list animations and turn into the in-game data
     * type.
     * @param data
     * @param part
     * @param partID
     */
    function jsonToAnimDict(data, part, partID) {
        let res = new Map();
        for (let animation of data) {
            let action = Action[animation.action];
            let key = Anim.getKey(action, part, partID);
            let val = Anim.getData(animation.frameBase, animation.nFrames, animation.msPerFrame, Anim.PlayType[animation.playType], Point.from(animation.anchor), {
                alignType: Anim.AlignType[animation.alignType],
                extraOffset: Point.from(animation.extraOffset)
            });
            res.set(key, val);
        }
        return res;
    }
    /**
     * Helper function to process each attack's AttackInfo.
     * @param data
     */
    function jsonToAttackInfo(data, attackType) {
        let cboxDims = data.cboxDims == null ? null : Point.from(data.cboxDims);
        let cboxOffset = data.cboxOffset == null ? null : Point.from(data.cboxOffset);
        let unblockable = data.unblockable == null ? false : data.unblockable;
        // convert and check collision types
        let cTypes = [];
        for (let cTypeStr of data.cTypes) {
            let cType = CollisionType[cTypeStr];
            if (cType == null) {
                throw new Error('Invalid cType: "' + cTypeStr + '"');
            }
            cTypes.push(cType);
        }
        let animDatas = null;
        if (data.animSpecs != null) {
            animDatas = new Map();
            for (let spec of data.animSpecs) {
                let [animKey, animData] = Anim.convertSpec(spec);
                animDatas.set(animKey, animData);
            }
        }
        return {
            // main
            cboxDims: cboxDims,
            cboxOffset: cboxOffset,
            movement: Weapon.AttackMovement[data.movement],
            damage: data.damage,
            attackType: attackType,
            cTypes: cTypes,
            knockbackForce: data.knockbackForce,
            staggerForce: data.staggerForce,
            lungeForce: data.lungeForce,
            duration: data.duration,
            // optional
            unblockable: unblockable,
            sounds: data.sounds,
            blockedDuration: data.blockedDuration || Component.Blocked.DEFAULT_DURATION,
            // projectiles
            velocity: data.velocity,
            animDatas: animDatas,
        };
    }
    Conversion.jsonToAttackInfo = jsonToAttackInfo;
    /**
     * Helper function to process each weapon.
     * @param data
     */
    function jsonToWeapon(data) {
        let mainPartID = null;
        let animations = new Map();
        // maybe add main anims
        if (data.mainAnimationBase && data.mainAnimations) {
            let mainPart = Part[data.mainAnimationBase.part];
            mainPartID = PartID[data.mainAnimationBase.partID];
            mapAdd(animations, jsonToAnimDict(data.mainAnimations, mainPart, mainPartID));
        }
        // maybe add fx anims
        // NOTE: we no longer use these, I think :-(
        if (data.fxAnimationBase && data.fxAnimations) {
            let fxPart = Part[data.fxAnimationBase.part];
            let fxPartID = PartID[data.fxAnimationBase.partID];
            mapAdd(animations, jsonToAnimDict(data.fxAnimations, fxPart, fxPartID));
        }
        let fwd = {
            weapon: {
                timing: data.timing,
                partID: mainPartID,
            },
            animations: animations,
        };
        // Add on attacks that exist
        if (data.swingAttack != null) {
            fwd.weapon.swingAttack = jsonToAttackInfo(data.swingAttack, Weapon.AttackType.Swing);
        }
        if (data.quickAttack != null) {
            fwd.weapon.quickAttack = jsonToAttackInfo(data.quickAttack, Weapon.AttackType.Quick);
        }
        if (data.comboAttack != null) {
            fwd.weapon.comboAttack = jsonToAttackInfo(data.comboAttack, Weapon.AttackType.Combo);
        }
        return fwd;
    }
    /**
     * Turn JSON shield config file to game-usable data.
     * @param data
     */
    function jsonToShields(data) {
        return inheritanceBuild(data, 'parent', jsonToShield, Shield.extendShield);
    }
    Conversion.jsonToShields = jsonToShields;
    /**
     * Helper function to process each shield.
     * @param data
     */
    function jsonToShield(data) {
        let blockInfo = null;
        if (data.blockInfo != null && data.blockInfo.cboxDims != null &&
            data.blockInfo.cboxOffset != null) {
            blockInfo = {
                cboxDims: Point.from(data.blockInfo.cboxDims),
                cboxOffset: Point.from(data.blockInfo.cboxOffset),
                armor: data.blockInfo.armor,
            };
        }
        let part = Part[data.animationCore.part];
        let partID = PartID[data.animationCore.partID];
        let animDict = jsonToAnimDict(data.animations, part, partID);
        return {
            shield: {
                timing: data.characterTiming,
                block: blockInfo,
                sounds: data.sounds,
            },
            animations: animDict,
        };
    }
})(Conversion || (Conversion = {}));
var AI;
(function (AI) {
    /**
     * Finite state machine.
     */
    class FSM {
        constructor(start) {
            this.elapsedInCur = 0;
            this.init = false;
            this.cur = start;
        }
        update(delta) {
            // TODO: more elegant way of doing this
            if (this.init) {
                this.states.get(this.cur).pre.call(this);
                this.init = true;
            }
            // run the body and determine the next state with. update the
            // elapsed time.
            let code = this.states.get(this.cur);
            code.body.call(this);
            let next = code.next.call(this);
            this.elapsedInCur += delta;
            // if switching to a new state, run the pre for that new state
            // now! (also reset timings and setup next state to run.)
            if (next !== this.cur) {
                this.states.get(next).pre.call(this);
                this.elapsedInCur = 0;
                this.cur = next;
            }
        }
    }
    AI.FSM = FSM;
})(AI || (AI = {}));
var AI;
(function (AI) {
    /**
     * Select the AI here.
     */
    let Behavior;
    (function (Behavior) {
        Behavior[Behavior["Cow"] = 0] = "Cow";
        Behavior[Behavior["Archer"] = 1] = "Archer";
        Behavior[Behavior["Brawler"] = 2] = "Brawler";
        Behavior[Behavior["Spider"] = 3] = "Spider";
        Behavior[Behavior["Mimic"] = 4] = "Mimic";
        Behavior[Behavior["Forward"] = 5] = "Forward";
        Behavior[Behavior["SwingTimer"] = 6] = "SwingTimer";
        Behavior[Behavior["Sawtooth"] = 7] = "Sawtooth";
        Behavior[Behavior["FollowSawtooth"] = 8] = "FollowSawtooth";
        Behavior[Behavior["Coward"] = 9] = "Coward";
        Behavior[Behavior["Sentinel"] = 10] = "Sentinel";
    })(Behavior = AI.Behavior || (AI.Behavior = {}));
})(AI || (AI = {}));
/// <reference path="../gj7/ai.ts" />
var Component;
(function (Component) {
    class AIComponent extends Engine.Component {
        /**
         * @param behavior What behavior to use.
         * @param params These are one of the "AI.*Params" types.
         * @param cutscene Whether to run the AI for this component during
         * cutscenes. Necessary so we can make the player walk around during
         * cutscenes but keep them from getting mauled by enemies right out of
         * the gate (literally).
         */
        constructor(behavior, params, cutscene = false) {
            super();
            this.behavior = behavior;
            this.cutscene = cutscene;
            /**
             * For debugging, AI systems can choose to update this string with the
             * some string (e.g., the sate of the FSM).
             */
            this.debugState = '';
            this.params = clone(params);
        }
        toString() {
            return AI.Behavior[this.behavior] + ' (' + this.debugState + ')';
        }
    }
    Component.AIComponent = AIComponent;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/ai.ts" />
/// <reference path="../component/ai.ts" />
var AI;
(function (AI) {
    /**
     * Stops everything.
     */
    function wait(aspect) {
        let input = aspect.get(Component.Input);
        input.intent.set_(0, 0);
        input.targetAngle = null;
        input.attack = false;
    }
    AI.wait = wait;
    /**
     * Buncha common helper methods.
     */
    class BaseFSM extends AI.FSM {
        constructor(ecs, aspect, startState) {
            super(startState);
            this.ecs = ecs;
            this.aspect = aspect;
            this.startState = startState;
        }
        /**
         * Subclasses provide type (AI.*Params) when calling.
         */
        getBlackboard() {
            return this.aspect.blackboards.get(this.sysName);
        }
        /**
         * Subclasses provide type (AI.*Params) when calling.
         */
        getParams() {
            return (this.aspect.get(Component.AIComponent)).params;
        }
        /**
         * Wait means you don't move and don't attack.
         *
         * @prereq: aspect has Component.Input
         */
        wait() {
            wait(this.aspect);
        }
        swinging() {
            let armed = this.aspect.get(Component.Armed);
            return armed.state !== Weapon.SwingState.Idle;
        }
        dead() {
            return this.aspect.has(Component.Dead);
        }
        /**
         * Gets player entity.
         */
        getPlayer() {
            return this.aspect.playerSelector.latest().next().value;
        }
        getPlayerComps() {
            return this.ecs.getComponents(this.getPlayer());
        }
        playerDead() {
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
        stopAndAttack() {
            this.stopMovement();
            this.attack();
        }
        /*
         * Given that the AI wants to (charge/swing/sheathe) attack, this
         * decides whether it should active it's `attack` input (based on
         * timing).
         */
        attack() {
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
        explodePre() {
            // manually set to quick-attacking action to play that animation
            let activity = this.aspect.get(Component.Activity);
            activity.manual = true;
            activity.action = Action.QuickAttacking;
            // repeating some of the stuff that happens in the swing system
            // (spawn the attack and spawn event so the sound effect plays)
            let attackInfo = this.aspect.get(Component.Armed).active.quickAttack;
            // do the quick attack
            this.ecs.getSystem(System.Swing).startAttack(this.aspect.entity, this.aspect.get(Component.Position), this.aspect.get(Component.Input), attackInfo, PartID.Default);
            // spawn swing event
            let eNameSwing = Events.EventTypes.Swing;
            let eArgsSwing = {
                attackInfo: attackInfo,
                location: this.aspect.get(Component.Position).p,
            };
            this.ecs.eventsManager.dispatch({ name: eNameSwing, args: eArgsSwing });
            // spawn special explode event
            let eNameExplode = Events.EventTypes.Explosion;
            let eArgsExplode = {};
            this.ecs.eventsManager.dispatch({ name: eNameExplode, args: eArgsExplode });
        }
        /**
         * Returns how far the player is from `this`.
         */
        playerDist() {
            return this.playerDistTo(this.getPos());
        }
        /**
         * Returns how far the player is from `location`.
         * @param location
         */
        playerDistTo(location) {
            return location.distTo(this.getPlayerPos());
        }
        /**
         *
         * @param range Distance from self.
         */
        alivePlayerInRange(range) {
            if (this.playerDead()) {
                return false;
            }
            return this.getPos().distTo(this.getPlayerPos()) < range;
        }
        /**
         * TODO: change to getter?
         */
        getPos() {
            return this.aspect.get(Component.Position).p;
        }
        getPlayerPos() {
            return this.getPlayerComps().get(Component.Position).p;
        }
        getPlayerAngle() {
            return this.getPlayerComps().get(Component.Position).angle;
        }
        closeTo(target, epsilon = 25) {
            return this.getPos().distTo(target) < epsilon;
        }
        /**
         * Helper: forward movement for tank controls, when X and Y need to be
         * set correctly to match the target angle.
         * @param scale (see moveForward)
         */
        moveForwardTank(scale) {
            let input = this.aspect.get(Component.Input);
            let pos = this.aspect.get(Component.Position);
            input.intent.y = -Math.sin(pos.angle);
            input.intent.x = Math.cos(pos.angle);
        }
        /**
         * Helper: forward movement for when Y = Physics.UP means forward.
         * @param scale (see moveForward)
         */
        moveForwardStandard(scale) {
            this.aspect.get(Component.Input).intent.y = Physics.UP * scale;
        }
        /**
         * @param scale optional; in [0, 1]; scale for input force
         */
        moveForward(scale = 1.0) {
            let mt = this.aspect.get(Component.Input).movement.movementType;
            if (mt === Physics.MovementType.Strafe) {
                this.moveForwardTank(scale);
            }
            else {
                this.moveForwardStandard(scale);
            }
        }
        stopMovement() {
            this.aspect.get(Component.Input).intent.set_(0, 0);
        }
        /**
         *
         * @param scale optional; in [0, 1]; scale for input force
         */
        moveBackwards(scale = 1.0) {
            this.aspect.get(Component.Input).intent.y = Physics.DOWN * scale;
        }
        noAttack() {
            let input = this.aspect.get(Component.Input);
            input.attack = false;
        }
        /**
         * Returns whether this thing is hitting a solid, immobile object.
         */
        hittingWall() {
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
        facePlayer(offset = 0) {
            this.faceTarget(this.getPlayerPos(), offset);
        }
        /**
         *
         * @param target
         * @param offset optional offset in radians to add to angle to target
         */
        faceTarget(target, offset = 0) {
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
            }
            else {
                // turn right
                input.intent.x = Physics.RIGHT;
            }
        }
        facingPlayer() {
            let position = this.aspect.get(Component.Position);
            let playerPos = this.getPlayerPos();
            return AI.facing(position.p, position.angle, playerPos);
        }
    }
    AI.BaseFSM = BaseFSM;
    //
    // AI helpers for AI systems
    //
    /**
     * Sometimes you just gotta chill out.
     */
    function noop() { }
    AI.noop = noop;
    /**
     * Helper for the AI to decide whether it's facing close enough to a target
     * (e.g., to attack).
     *
     * @param pos
     * @param target
     * @param epsilon
     */
    function facing(pos, angle, target, epsilon = Math.PI / 32) {
        return Math.abs(pos.pixiAngleTo(target) - angle) < epsilon;
    }
    AI.facing = facing;
})(AI || (AI = {}));
var System;
(function (System) {
    class AIAspect extends Engine.Aspect {
        constructor(playerSelector) {
            super();
            this.playerSelector = playerSelector;
            this.blackboards = new Map();
        }
    }
    System.AIAspect = AIAspect;
    class AISystem extends Engine.System {
        constructor(playerSelector) {
            super();
            this.playerSelector = playerSelector;
            this.componentsRequired = new Set([
                Component.AIComponent.name,
                Component.Input.name,
            ]);
            /**
             * TODO: refactor into Service.
             */
            this.inCutscene = false;
            this.behaviorMap = new Map([
                [AI.Behavior.Cow, System.AICow.update],
                [AI.Behavior.Archer, System.AIArcher.update],
                [AI.Behavior.Brawler, System.AIBrawler.update],
                [AI.Behavior.Spider, System.AISpider.update],
                [AI.Behavior.Mimic, System.AIMimic.update],
                [AI.Behavior.Forward, System.AIForward.update],
                [AI.Behavior.SwingTimer, System.AISwingTimer.update],
                [AI.Behavior.Sawtooth, System.AISawtooth.update],
                [AI.Behavior.FollowSawtooth, System.AIFollowSawtooth.update],
                [AI.Behavior.Coward, System.AICoward.update],
                [AI.Behavior.Sentinel, System.AISentinel.update],
            ]);
        }
        makeAspect() {
            return new AIAspect(this.playerSelector);
        }
        update(delta, entities) {
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
    __decorate([
        override
    ], AISystem.prototype, "makeAspect", null);
    System.AISystem = AISystem;
})(System || (System = {}));
/// <reference path="../core/fsm.ts" />
/// <reference path="ai.ts" />
var System;
(function (System) {
    //
    // Cow FSM
    //
    let CowState;
    (function (CowState) {
        CowState[CowState["Graze"] = 0] = "Graze";
        CowState[CowState["WalkLeft"] = 1] = "WalkLeft";
        CowState[CowState["WalkRight"] = 2] = "WalkRight";
    })(CowState || (CowState = {}));
    class CowFSM extends AI.BaseFSM {
        constructor(ecs, aspect) {
            // pick starting state here
            super(ecs, aspect, CowState.WalkLeft);
            this.sysName = AICow.name;
            // each cow has its own personality
            this.activityInterval = Probability.uniformInt(2, 6) * 1000;
            this.states = new Map([
                [CowState.Graze, {
                        pre: AI.noop,
                        body: this.wait,
                        next: this.cowNext,
                    }],
                [CowState.WalkLeft, {
                        pre: AI.noop,
                        body: this.walkLeft,
                        next: this.cowNext,
                    }],
                [CowState.WalkRight, {
                        pre: AI.noop,
                        body: this.walkRight,
                        next: this.cowNext,
                    }],
            ]);
        }
        cowNext() {
            // stay in current state for chosen amt of time
            if (this.elapsedInCur < this.activityInterval) {
                return this.cur;
            }
            // move to next cow activity
            return Probability.uniformChoice([
                CowState.Graze,
                CowState.WalkLeft,
                CowState.WalkRight,
            ]);
        }
        // If these are backwards no one will ever know.
        walkLeft() {
            this.aspect.get(Component.Input).intent.set_(-1, -1);
        }
        walkRight() {
            this.aspect.get(Component.Input).intent.set_(1, -1);
        }
    }
    /**
     * The Cow AI just mills about randomly.
     */
    class AICow {
        /**
         * Ensures that the AIAspect's blackboard has the AICow blackboard.
         */
        static ensureBlackboard(ecs, aspect) {
            // create if needed
            if (!aspect.blackboards.has(AICow.name)) {
                let bb = {
                    fsm: new CowFSM(ecs, aspect),
                };
                aspect.blackboards.set(AICow.name, bb);
            }
            // return it
            return aspect.blackboards.get(AICow.name);
        }
        static update(delta, ecs, aspect) {
            let blackboard = AICow.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
            // for debugging, update the component w/ the FSM state
            let aiComp = aspect.get(Component.AIComponent);
            aiComp.debugState = CowState[blackboard.fsm.cur];
        }
    }
    System.AICow = AICow;
})(System || (System = {}));
/// <reference path="../core/fsm.ts" />
/// <reference path="ai.ts" />
var System;
(function (System) {
    //
    // Brawler FSM
    //
    let BrawlerState;
    (function (BrawlerState) {
        BrawlerState[BrawlerState["AtHome"] = 0] = "AtHome";
        BrawlerState[BrawlerState["GoHome"] = 1] = "GoHome";
        BrawlerState[BrawlerState["Pursue"] = 2] = "Pursue";
        BrawlerState[BrawlerState["Attack"] = 3] = "Attack";
    })(BrawlerState || (BrawlerState = {}));
    class BrawlerFSM extends AI.BaseFSM {
        constructor(ecs, aspect) {
            // start in wait state
            super(ecs, aspect, BrawlerState.AtHome);
            this.sysName = AIBrawler.name;
            //
            // actual FSM defined now
            //
            this.states = new Map([
                [BrawlerState.AtHome, {
                        pre: AI.noop,
                        body: this.wait,
                        next: this.atHomeNext,
                    }],
                [BrawlerState.GoHome, {
                        pre: AI.noop,
                        body: this.goHomeDo,
                        next: this.goHomeNext,
                    }],
                [BrawlerState.Pursue, {
                        pre: AI.noop,
                        body: this.pursueDo,
                        next: this.aggressiveNext,
                    }],
                [BrawlerState.Attack, {
                        pre: AI.noop,
                        body: this.stopAndAttack,
                        next: this.attackNext,
                    }],
            ]);
        }
        /**
         *	Get player's distance from our home
         */
        playerHomeDist() {
            return this.playerDistTo(this.getBlackboard().home);
        }
        /**
         * Helper for more aggressive states (pursuing and attacking) to
         * determine next state.
         */
        aggressiveNext() {
            let params = this.getParams();
            // if player's dead, or it's far enough away from our home and
            // we're allowed to forget, just go back home
            if (this.playerDead() || (params.forget && this.playerHomeDist() > params.pursuitDistance)) {
                return BrawlerState.GoHome;
            }
            // if we're facing the player and in attack range, then attack
            if (this.facingPlayer() && this.alivePlayerInRange(params.attackRange)) {
                return BrawlerState.Attack;
            }
            // otherwise player is in pursuit distance but we need to face
            // and/or move. stay in pursuit.
            return BrawlerState.Pursue;
        }
        //
        // atHome
        //
        atHomeNext() {
            // pursue player if in pursuit distance from home
            if (this.playerHomeDist() <= this.getParams().pursuitDistance) {
                return BrawlerState.Pursue;
            }
            // otherwise stay home
            return BrawlerState.AtHome;
        }
        //
        // goHome
        //
        goHomeDo() {
            this.faceTarget(this.getBlackboard().home);
            this.noAttack();
            this.moveForward();
        }
        goHomeNext() {
            // we may need to pursue the player
            if (this.playerHomeDist() <= this.getParams().pursuitDistance) {
                return BrawlerState.Pursue;
            }
            // if we made it home, yay.
            if (this.closeTo(this.getBlackboard().home)) {
                return BrawlerState.AtHome;
            }
            // otherwise keep going home
            return BrawlerState.GoHome;
        }
        //
        // pursue(ing player) (includes facing)
        //
        pursueDo() {
            // always try to face
            this.facePlayer();
            this.noAttack();
            // if not close enough to attack, also pursue
            if (!this.alivePlayerInRange(this.getParams().attackRange)) {
                this.moveForward();
            }
        }
        //
        // attack!
        //
        attackNext() {
            // always finish out swings (attacks).
            if (this.swinging()) {
                return BrawlerState.Attack;
            }
            // otherwise, rely on general "aggressive next" check
            return this.aggressiveNext();
        }
    }
    //
    // actual AI class
    //
    class AIBrawler {
        /**
         * Ensures that the AIAspect's blackboard has the AIBrawler blackboard.
         */
        static ensureBlackboard(ecs, aspect) {
            // create if needed
            if (!aspect.blackboards.has(AIBrawler.name)) {
                let position = aspect.get(Component.Position);
                let bb = {
                    home: position.p.copy(),
                    fsm: new BrawlerFSM(ecs, aspect),
                };
                aspect.blackboards.set(AIBrawler.name, bb);
            }
            // return it
            return aspect.blackboards.get(AIBrawler.name);
        }
        /**
         * AI System calls to update.
         * @param delta
         * @param ecs
         * @param aspect
         */
        static update(delta, ecs, aspect) {
            let blackboard = AIBrawler.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
            // for debugging, update the component w/ the FSM state
            let aiComp = aspect.get(Component.AIComponent);
            aiComp.debugState = BrawlerState[blackboard.fsm.cur];
        }
    }
    System.AIBrawler = AIBrawler;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/**
 * Action answers the broader question of "what is the entity doing?"
 *
 * This is a 'choose 1' enum; each entity will be doing exactly 1 Action.
 */
var Action;
(function (Action) {
    /**
     * Used interally in system when nothing has been set yet.
     */
    Action[Action["INVALID"] = -1] = "INVALID";
    /**
     * Default Action---all Animatables should implement this.
     */
    Action[Action["Idle"] = 0] = "Idle";
    /**
     * When the entity has forward/backwards motion (turning alone doesn't
     * count).
     */
    Action[Action["Moving"] = 1] = "Moving";
    /**
     * When the entity is raising a shield to block.
     */
    Action[Action["BlockRaising"] = 2] = "BlockRaising";
    /**
     * When the entity is blocking with a shield.
     */
    Action[Action["BlockHolding"] = 3] = "BlockHolding";
    /**
     * When the entity is lowering a shield from a block.
     */
    Action[Action["BlockLowering"] = 4] = "BlockLowering";
    /**
     * When the entity is charging up an attack.
     */
    Action[Action["Charging"] = 5] = "Charging";
    /**
     * When the entity is carrying out an attack.
     */
    Action[Action["Swinging"] = 6] = "Swinging";
    /**
     * When the entity is finishing an attack.
     */
    Action[Action["Sheathing"] = 7] = "Sheathing";
    /**
     * When the entity is dying + then while it's dead (hang on last frame).
     */
    Action[Action["Dead"] = 8] = "Dead";
    /**
     * When the entity has been hit and damaged.
     */
    Action[Action["Staggering"] = 9] = "Staggering";
    /**
     * When the entity is returning from Staggering to Idle.
     */
    Action[Action["StaggerReturning"] = 10] = "StaggerReturning";
    /**
     * When the enemy is hit and paralyzed; consecutive knockbacks (usually)
     * lead to a stagger.
     */
    Action[Action["Knockback"] = 11] = "Knockback";
    /**
     * When the entity attempted an attack and failed, i.e., their attack was
     * blocked by something else.
     */
    Action[Action["Blocked"] = 12] = "Blocked";
    /**
     * When the entity is blocking and their shield got hit.
     */
    Action[Action["Recoiling"] = 13] = "Recoiling";
    /**
     * When the entity is carrying out a quick attack (used as primary
     * QuickAttack if entity has more than one).
     */
    Action[Action["QuickAttacking"] = 14] = "QuickAttacking";
    /**
     * Second quick attack. Wart on game design we're doing it this way.
     */
    Action[Action["QuickAttacking2"] = 15] = "QuickAttacking2";
    /**
     * Powerful attack after landing two quick attacks in a row.
     */
    Action[Action["ComboAttacking"] = 16] = "ComboAttacking";
    //
    // Specialty actions. I don't think this is inefficient, just a little
    // ugly.
    //
    /**
     * Something (gate, carpet) is opening / staying open.
     */
    Action[Action["Opening"] = 17] = "Opening";
})(Action || (Action = {}));
var Component;
(function (Component) {
    class Activity extends Engine.Component {
        constructor(activitySpec) {
            super();
            /**
             * For optimization: can be set to note that Action.Idle should always
             * be used.
             *
             * TODO: probably remove this entirely.
             */
            this.idleOnly = false;
            this._manual = false;
            let settings = Anim.convertActivity(activitySpec);
            this.action = settings.startAction;
            this.manual = settings.manual;
        }
        /**
         * The action this entity is taking. One thing at a time, always.
         */
        get action() { return this._action; }
        set action(v) {
            if (this._action !== v) {
                this._action = v;
                this.dirty();
            }
        }
        /**
         * Whether the activity will always be changed manually (by
         * some game logic) --- this makes the Activity system skip
         * over this.
         */
        get manual() { return this._manual; }
        set manual(v) {
            if (this._manual !== v) {
                this._manual = v;
                this.dirty();
            }
        }
        toString() {
            return Action[this.action];
        }
    }
    Component.Activity = Activity;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/weapon.ts" />
var Component;
(function (Component) {
    class Armed extends Engine.Component {
        constructor(active, 
        /**
         * The state is set by the Swing system to match its internal
         * state and should only be observed by other systems.
         */
        state = Weapon.SwingState.Idle) {
            super();
            this.state = state;
            this.inventory = new Array();
            this.activeIdx = -1;
            /**
             * Elapsed is the time in ms that has been spent in this.state. This is
             * used for display purposes (e.g. for flashing tints during variuos
             * stages of charging). It is set by the Swing system to match its
             * internal state and should only be observed by other systems.
             */
            this.elapsed = 0;
            this.active = Weapon.cloneWeapon(active);
            this.inventory.push(active);
            this.activeIdx = 0;
        }
    }
    Component.Armed = Armed;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/shield.ts" />
var Component;
(function (Component) {
    class Shielded extends Engine.Component {
        constructor(active, 
        /**
         * The state is set by the Defend system to match its internal
         * state and should only be observed by other systems.
         */
        state = Shield.BlockState.Idle) {
            super();
            this.state = state;
            this.inventory = new Array();
            this.activeIdx = -1;
            this.active = Shield.cloneShield(active);
            this.inventory.push(this.active);
            this.activeIdx = 0;
        }
    }
    Component.Shielded = Shielded;
})(Component || (Component = {}));
/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/weapon.ts" />
/// <reference path="../component/activity.ts" />
/// <reference path="../component/armed.ts" />
/// <reference path="../component/shielded.ts" />
var System;
(function (System) {
    class Activity extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Activity.name,
            ]);
        }
        // Determines which action (type of animation) should be shown.
        determineAction(aspect) {
            // Highest priority: Life states (e.g., Dead)
            if (aspect.has(Component.Dead)) {
                return Action.Dead;
            }
            // High priority: Events that happen to the player (e.g. stagger,
            // knockback, blocked, recoil)
            if (aspect.has(Component.Stagger)) {
                return Action.Staggering;
            }
            if (aspect.has(Component.StaggerReturn)) {
                return Action.StaggerReturning;
            }
            if (aspect.has(Component.Knockback)) {
                return Action.Knockback;
            }
            if (aspect.has(Component.Blocked)) {
                return Action.Blocked;
            }
            if (aspect.has(Component.Recoil)) {
                return Action.Recoiling;
            }
            // Blocking.
            if (aspect.has(Component.Shielded)) {
                let shielded = aspect.get(Component.Shielded);
                switch (shielded.state) {
                    case Shield.BlockState.Raise:
                        return Action.BlockRaising;
                    case Shield.BlockState.Block:
                        return Action.BlockHolding;
                    case Shield.BlockState.Lower:
                        return Action.BlockLowering;
                }
            }
            // Attacking (charge/swing/sheathe). Not all of the swing states
            // force explicit animations (e.g., 'ready' doesn't; we proceed to
            // 'moving' or 'idle' below).
            if (aspect.has(Component.Armed)) {
                let armed = aspect.get(Component.Armed);
                switch (armed.state) {
                    case Weapon.SwingState.ChargeCharging:
                    case Weapon.SwingState.ChargeReady:
                        return Action.Charging;
                    case Weapon.SwingState.Swing:
                        return Action.Swinging;
                    case Weapon.SwingState.Sheathe:
                        return Action.Sheathing;
                    case Weapon.SwingState.QuickAttack:
                        return Action.QuickAttacking;
                    case Weapon.SwingState.QuickAttack2:
                        return Action.QuickAttacking2;
                    case Weapon.SwingState.Combo:
                        return Action.ComboAttacking;
                }
            }
            // Moving
            if (aspect.has(Component.Input)) {
                let input = aspect.get(Component.Input);
                if (input.intent.y != 0 || input.intent.x != 0) {
                    return Action.Moving;
                }
            }
            // Default
            return Action.Idle;
        }
        update(delta, entities) {
            for (let aspect of entities.values()) {
                let activity = aspect.get(Component.Activity);
                // don't do any logic if it's set to manual mode
                if (activity.manual) {
                    continue;
                }
                // otherwise, do full check
                activity.action = this.determineAction(aspect);
            }
        }
    }
    System.Activity = Activity;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    /**
     * For selecting attacks that are active and not simply passive ones.
     * (Active attacks must be updated; passive attacks need not be.)
     */
    class ActiveAttack extends Engine.Component {
    }
    Component.ActiveAttack = ActiveAttack;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/**
 * What to do when the timebomb goes off.
 */
var Destruct;
(function (Destruct) {
    /**
     * Remove the component.
     */
    Destruct[Destruct["Component"] = 0] = "Component";
    /**
     * Remove the entire entity.
     */
    Destruct[Destruct["Entity"] = 1] = "Entity";
})(Destruct || (Destruct = {}));
var Component;
(function (Component) {
    class Timebomb extends Engine.Component {
        constructor(
        /**
         * Total time in ms this will last (doesn't change).
         */
        duration, 
        /**
         * What to do upon destruction.
         */
        destruct, 
        /**
         * A fuse, to allow others to request that the destruction is
         * activated.
         */
        fuse = false, 
        /**
         * An optional function that will be called upon destruction.
         */
        lastWish) {
            super();
            this.duration = duration;
            this.destruct = destruct;
            this.fuse = fuse;
            this.lastWish = lastWish;
            /**
             * When created (set on first Timebom System pass).
             */
            this.startTime = -1;
        }
        toString() {
            return 'total duration: ' + this.duration + 'ms';
        }
    }
    Component.Timebomb = Timebomb;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="timebomb.ts" />
var Component;
(function (Component) {
    class Attack extends Component.Timebomb {
        /**
         * @param attacker
         * @param info
         */
        constructor(attacker, info) {
            super(info.duration, Destruct.Entity);
            this.attacker = attacker;
            /**
             * Whether the attack has hit something (used for combo logic).
             */
            this.hit = false;
            /**
             * Used to limit heavy-duty effects (like pause and flash) shown per
             * attack.
             */
            this.heavyEffectsShown = false;
            this.info = Weapon.cloneAttackInfo(info);
        }
        toString() {
            return super.toString() + 'attack info: ' + JSON.stringify(this.info);
        }
    }
    __decorate([
        override
    ], Attack.prototype, "toString", null);
    Component.Attack = Attack;
})(Component || (Component = {}));
/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/timebomb.ts" />
var System;
(function (System) {
    class Timebomb extends Engine.System {
        update(delta, entities) {
            for (let [entity, aspect] of entities.entries()) {
                let tb = aspect.get(this.tbComp);
                // progress time and check if it's expired OR if the fuse is
                // lit.
                if (tb.startTime === -1) {
                    tb.startTime = this.ecs.gametime;
                }
                let elapsed = this.ecs.gametime - tb.startTime;
                if ((elapsed >= tb.duration && tb.duration != -1) || tb.fuse) {
                    // activate destruction
                    switch (tb.destruct) {
                        case Destruct.Component: {
                            this.ecs.removeComponent(entity, this.tbComp);
                            break;
                        }
                        case Destruct.Entity: {
                            this.ecs.removeEntity(entity);
                            break;
                        }
                    }
                    // call last wish if it exists
                    if (tb.lastWish) {
                        tb.lastWish(this.ecs, entity);
                    }
                }
            }
        }
    }
    System.Timebomb = Timebomb;
})(System || (System = {}));
/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/active-attack.ts" />
/// <reference path="../component/attack.ts" />
/// <reference path="timebomb.ts" />
var System;
(function (System) {
    class Attack extends System.Timebomb {
        constructor() {
            super(...arguments);
            this.tbComp = Component.Attack;
            this.componentsRequired = new Set([
                Component.Attack.name,
                Component.ActiveAttack.name,
            ]);
        }
    }
    System.Attack = Attack;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="timebomb.ts" />
var Component;
(function (Component) {
    class Block extends Component.Timebomb {
        constructor(blocker, duration, shield) {
            super(duration, Destruct.Entity);
            this.blocker = blocker;
            this.duration = duration;
            this.shield = Shield.cloneShield(shield);
        }
    }
    Component.Block = Block;
})(Component || (Component = {}));
/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/block.ts" />
/// <reference path="timebomb.ts" />
var System;
(function (System) {
    class Block extends System.Timebomb {
        constructor() {
            super(...arguments);
            this.tbComp = Component.Block;
            this.componentsRequired = new Set([
                Component.Block.name,
            ]);
        }
    }
    System.Block = Block;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    class Dead extends Engine.Component {
    }
    Component.Dead = Dead;
})(Component || (Component = {}));
/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/weapon.ts" />
/// <reference path="../gj7/shield.ts" />
/// <reference path="../component/activity.ts" />
/// <reference path="../component/body.ts" />
/// <reference path="../component/armed.ts" />
/// <reference path="../component/dead.ts" />
/// <reference path="../component/shielded.ts" />
var System;
(function (System) {
    class Body extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Activity.name,
                Component.Body.name,
            ]);
            this.cacheNewParts = new Map();
            /**
             * Based on System ordering within a frame, we can get into states where
             * the action (idle), components (stagger, death), and inner state
             * (attack charging) don't seen to match up.
             *
             * See GitHub issue #117
             * (https://github.com/mbforbes/gamejam7/issues/117) for a long tirade
             * on this as I figured it out.
             *
             * Previously, we tried to infer the correct Core body part based on the
             * Armed (inner state) status. However, the inconsistency mentioned
             * above caused us to get into weird (action,part,partID) combinations.
             *
             * Much System reordering was done to try to get into a consistent
             * state, but the reading and writing of components and inner states was
             * too much to cleanly resolve.
             *
             * Instead, we're going to make this component more robust by reading
             * the Action and directly deciding on the Core body part.
             *
             * This is the whitelist of actions for which we should change the
             * core's partID based on the weapon.
             */
            this.modActions = new Set([
                Action.Charging,
                Action.Swinging,
                Action.Sheathing,
                Action.QuickAttacking,
                Action.QuickAttacking2,
                Action.ComboAttacking,
            ]);
        }
        updateParts(aspect) {
            let activity = aspect.get(Component.Activity);
            // build up new mapping of Part -> PartID.
            this.cacheNewParts.clear();
            // Right now we always add the core component. Can imagine not doing
            // this if, e.g., entity was invisible.
            let coreID = PartID.Default;
            // An amred component *may* affect
            //	  -	  the core part ID (if Action in this.modActions)
            // An amred component *will* affect
            //	  -	  the display of a weapon (if we allow weapons to
            //		  be drawn, may want to condition on that in the future).
            if (aspect.has(Component.Armed)) {
                let armed = aspect.get(Component.Armed);
                // if action in whitelist, change core's partID for weapon
                if (this.modActions.has(activity.action)) {
                    coreID = armed.active.partID;
                }
                // always set weapon part to current weapon partID
                this.cacheNewParts.set(Part.Weapon, armed.active.partID);
            }
            // Similarly, check for shielded component. Only one partID, so
            // it's easy! (Well, mostly... see inside.)
            if (aspect.has(Component.Shielded)) {
                // for the shield, we hide if the bow is doing anything
                // interesting
                if (coreID != PartID.Bow) {
                    this.cacheNewParts.set(Part.Shield, PartID.Default);
                }
            }
            // always set core
            this.cacheNewParts.set(Part.Core, coreID);
            // now, update the Body in bulk
            aspect.get(Component.Body).setParts(this.cacheNewParts);
        }
        update(delta, entities) {
            for (let aspect of entities.values()) {
                // full update
                this.updateParts(aspect);
            }
        }
    }
    System.Body = Body;
})(System || (System = {}));
var Anim;
(function (Anim) {
    let PlayType;
    (function (PlayType) {
        PlayType[PlayType["Loop"] = 0] = "Loop";
        PlayType[PlayType["PingPong"] = 1] = "PingPong";
        PlayType[PlayType["PlayAndHold"] = 2] = "PlayAndHold";
    })(PlayType = Anim.PlayType || (Anim.PlayType = {}));
    let AlignType;
    (function (AlignType) {
        /**
         * Center is where the 'core' parts' textures are anchored. This is the
         * position of the sprite.
         */
        AlignType[AlignType["Center"] = 0] = "Center";
        /**
         * TextureOrigin is the bottom-left corner of the core body part's
         * texture. This is position + rotation-aware anchor offset.
         */
        AlignType[AlignType["TextureOrigin"] = 1] = "TextureOrigin";
    })(AlignType = Anim.AlignType || (Anim.AlignType = {}));
    /**
     * Helper for getting default Align.
     */
    function defaultAlign() {
        return {
            alignType: AlignType.Center,
            extraOffset: new Point(),
        };
    }
    function cloneData(orig) {
        if (orig == null) {
            return null;
        }
        // clone does primitives
        let res = clone(orig);
        // then we apply fixups
        // these all aren't technically null-able, but other code that copied
        // this did these checks, so doing here; may want to remove or make all
        // these things explicitly nullable.
        if (orig.anchor != null) {
            res.anchor = orig.anchor.copy();
        }
        if (orig.align != null && orig.align.extraOffset != null) {
            res.align.extraOffset = orig.align.extraOffset.copy();
        }
        return res;
    }
    Anim.cloneData = cloneData;
    /**
     * Helper to get Data using defaults.
     */
    function getData(frameBase, nFrames, speed, playType = PlayType.Loop, anchor = new Point(0.5, 0.5), align = defaultAlign(), alpha = 1.0, tint = 0xffffff, scale = 1.0) {
        return {
            frameBase: frameBase,
            nFrames: nFrames,
            speed: speed,
            playType: playType,
            anchor: anchor,
            alpha: alpha,
            tint: tint,
            scale: scale,
            align: {
                alignType: align.alignType,
                extraOffset: align.extraOffset.copy(),
            },
        };
    }
    Anim.getData = getData;
    function getKey(action, part, partID) {
        return Action[action] + ',' + Part[part] + ',' + PartID[partID];
    }
    Anim.getKey = getKey;
    function splitKey(key) {
        let [a, p, pid] = key.split(',');
        return [Action[a], Part[p], PartID[pid]];
    }
    Anim.splitKey = splitKey;
    Anim.DefaultKey = getKey(Action.Idle, Part.Core, PartID.Default);
    function convertActivity(activitySpec) {
        // start with defaults
        let res = {
            startAction: Action.INVALID,
            manual: false,
        };
        // fill in any specified values.
        if (activitySpec.startAction != null) {
            let startAction = Action[activitySpec.startAction];
            if (startAction == null) {
                throw new Error('Unknown Action: "' + activitySpec.startAction + '".');
            }
            ;
            res.startAction = startAction;
        }
        if (activitySpec.manual != null) {
            res.manual = activitySpec.manual;
        }
        return res;
    }
    Anim.convertActivity = convertActivity;
    /**
     * Returns a new animation map w/ base entries of `parent` and extensions
     * and overrides in `child`. Cloning is used such that all of the values
     * are new (so no object pointers point back to `parent` or `child`).
     */
    function extendAnims(parent, child) {
        let anims = new Map();
        for (let base of [parent, child]) {
            for (let [key, data] of base.entries()) {
                anims.set(key, Anim.cloneData(data));
            }
        }
        return anims;
    }
    Anim.extendAnims = extendAnims;
    /**
     * Note that this preserves null (missing) `scale` settings for animted
     * sprites rather than setting the default of 1 so that the animation can
     * be globally scaled up when its scale factor is missing. Because of this,
     * other usages of basespec/basedata (like gui sprites) need to set the
     * scale = 1 default themselves.
     */
    function convertBaseSpec(baseSpec) {
        // check enum conversion
        let pt = PlayType[baseSpec.playType];
        if (pt == null) {
            throw new Error('Got invalid PlayType: "' + baseSpec.playType + '"');
        }
        return {
            base: baseSpec.base,
            frames: baseSpec.frames,
            speed: baseSpec.speed,
            playType: pt,
            anchor: (baseSpec.anchor ? Point.from(baseSpec.anchor) : new Point(0.5, 0.5)),
            alpha: (baseSpec.alpha != null ? baseSpec.alpha : 1),
            tint: (baseSpec.tint != null ? parseInt(baseSpec.tint.slice(1), 16) : null),
            scale: (baseSpec.scale != null ? baseSpec.scale : null),
            width: baseSpec.width,
            height: baseSpec.height,
        };
    }
    Anim.convertBaseSpec = convertBaseSpec;
    function convertDisplaySpec(displaySpec) {
        let st = StageTarget[displaySpec.stageTarget];
        if (st == null) {
            throw new Error('Unknown StageTarget: "' + displaySpec.stageTarget + '"');
        }
        let z;
        if (st === StageTarget.World) {
            z = ZLevelWorld[displaySpec.z];
        }
        else if (st === StageTarget.HUD) {
            z = ZLevelHUD[displaySpec.z];
        }
        else {
            throw new Error('Programming error StageTarget: "' + st + '" not handled.');
        }
        if (z == null) {
            throw new Error('Unknown z level: "' + displaySpec.z + '"');
        }
        return {
            stageTarget: st,
            z: z,
        };
    }
    Anim.convertDisplaySpec = convertDisplaySpec;
    /**
     * Converts external Spec to internal Key and Data representations.
     *
     * TODO: refactor to use getData(...)
     *
     * @param spec
     */
    function convertSpec(spec) {
        // get data
        let baseData = convertBaseSpec(spec.baseSpec);
        let alignType = spec.alignType ? AlignType[spec.alignType] : AlignType.Center;
        let extraOffset = spec.extraOffset ? Point.from(spec.extraOffset) : new Point(0, 0);
        let ad = {
            frameBase: baseData.base,
            nFrames: baseData.frames,
            speed: baseData.speed,
            playType: baseData.playType,
            anchor: baseData.anchor,
            alpha: baseData.alpha,
            tint: baseData.tint,
            scale: baseData.scale,
            align: {
                alignType: alignType,
                extraOffset: extraOffset,
            }
        };
        // get key. || handles undefined, null, and no key.
        let action = Action[spec.action];
        if (action == null) {
            throw new Error('Invalid Action: "' + spec.action + '". See enum Action for options');
        }
        let part = spec.part ? Part[spec.part] : Part.Core;
        let partID = spec.partID ? PartID[spec.partID] : PartID.Default;
        let ak = getKey(action, part, partID);
        return [ak, ad];
    }
    Anim.convertSpec = convertSpec;
})(Anim || (Anim = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/anim.ts" />
var Component;
(function (Component) {
    /**
     * Animatable holds the mapping from {Action, Part, PartID} ->
     * AnimationData. It stores z and stagetarget, which doesn't change per
     * entity. It also holds flags that can be modified externally and then
     * read (and also set) by the AnimationRenderer system.
     */
    class Animatable extends Engine.Component {
        /**
         * Both z and stageTarget are assumed immutable after set.
         */
        constructor(z, stageTarget) {
            super();
            this.z = z;
            this.stageTarget = stageTarget;
            //
            // Game state / big blob objects
            //
            /**
             * Heavy-weight game-state added to component so that it may be shared
             * between two animation renderer systems.
             */
            this.state = new Stage.AnimatableState();
            //
            // Data
            //
            /**
             * The core data about the set of animations possible for this
             * Component.
             *
             * Assumed immutable after onAdd(...) in AnimationRenderer.
             */
            this.animations = new Map();
            /**
             * Set (via AnimationCustimze prop in GameMap) to hide on death.
             *
             * Assumed immutable after set in GameMap.
             */
            this.hideOnDeath = false;
            /**
             * Global tint for recoloring. Tint priorities:
             * 1. game events (e.g., red = damaged)
             * 2. animations-specific tints
             * 3. globalTint
             *
             * Assumed immutable after set in GameMap.
             */
            this.globalTint = 0xffffff;
            /**
             * Similar to tint, this is able to be overridden globally, or per
             * animation (which takes priority).
             *
             * (No game events re-scale right now, but theoretically also that'd be
             * top presidence... though I guess that'd scale the base scale?)
             */
            this.globalScale = 1;
            /**
             * Set by system ticking the animation(s) and viewable by other systems
             * (e.g., sound effects system for footsteps).
             */
            this.coreFrame = -1;
            this._reset = false;
            this._pause = false;
            this._visible = true;
        }
        /**
         * API: Flag bit used to signal that the current animation should be
         * reset. Used to trigger an animation to start from the beginning in
         * the middle of it playing (e.g., for a new knockback while already in
         * a knockback).
         */
        get reset() { return this._reset; }
        set reset(v) {
            if (this._reset !== v) {
                this._reset = v;
                this.dirty();
            }
        }
        /**
         * API: Flag bit used to pause animations (e.g., for animatable FX that
         * we don't need to be playing all the time in the background).
         */
        get pause() { return this._pause; }
        set pause(v) {
            if (this._pause !== v) {
                this._pause = v;
                this.dirty();
            }
        }
        /**
         * API: Flag it used to hide animations (e.g., for animatable FX in a
         * big pool that we don't want to show while they're not active).
         */
        get visible() { return this._visible; }
        set visible(v) {
            if (this._visible !== v) {
                this._visible = v;
                this.dirty();
            }
        }
        get defaultOnly() {
            return this.animations.size === 1 && this.animations.has(Anim.DefaultKey);
        }
        toString() {
            return ('Core frame: ' + this.coreFrame +
                ', Displaying: ' + this.state.activeKeys.size +
                ', Total: ' + this.state.animations.size);
        }
    }
    Component.Animatable = Animatable;
})(Component || (Component = {}));
/// <reference path="../core/base.ts" />
/// <reference path="../core/util.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/constants.ts" />
var Component;
(function (Component) {
    /**
     * `p`: position of the object (center)
     *
     * `angle`: 0 <= `angle` <= 2*pi, with 0 facing right, angles increasing
     *	CCW (note that Pixi and Tiled increase CW).
     */
    class Position extends Engine.Component {
        constructor(p, angle = 0) {
            super();
            // main state / settings
            this._p = new Point();
            this._revealP = new Point();
            // We use getters and setters here so that we can control the angle
            // value.
            this._angle = 0;
            // for spatial hashing
            this.cells = [];
            // deubg stuff for reporting
            this.debugSpeed = 0;
            this.p = p;
            this.angle = angle;
        }
        get p() {
            return this._revealP.copyFrom_(this._p);
        }
        set p(v) {
            if (!this._p.equals(v)) {
                this._p.copyFrom_(v);
                this.dirty();
            }
        }
        setX(x) {
            if (this._p.x !== x) {
                this._p.x = x;
                this.dirty();
            }
        }
        setY(y) {
            if (this._p.y !== y) {
                this._p.y = y;
                this.dirty();
            }
        }
        setP(x, y) {
            if (!this._p.equalsCoords(x, y)) {
                this._p.set_(x, y);
                this.dirty();
            }
        }
        get angle() {
            return this._angle;
        }
        set angle(v_raw) {
            if (isNaN(v_raw)) {
                throw Error('Tried to set angle to NaN!');
            }
            let v = angleClamp(v_raw);
            if (this._angle !== v) {
                this._angle = v;
                this.dirty();
            }
        }
        toString() {
            return this.p.toString() + ', ' + round(this.angle) +
                ', speed: ' + round(this.debugSpeed);
        }
    }
    Component.Position = Position;
})(Component || (Component = {}));
var Attributes;
(function (Attributes) {
    /**
     * Feature (flash, invincible, immobile) groupings.
     */
    let HitBehavior;
    (function (HitBehavior) {
        HitBehavior[HitBehavior["Player"] = 0] = "Player";
        HitBehavior[HitBehavior["StandardEnemy"] = 1] = "StandardEnemy";
    })(HitBehavior = Attributes.HitBehavior || (Attributes.HitBehavior = {}));
})(Attributes || (Attributes = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/attributes.ts" />
var Component;
(function (Component) {
    class Attributes extends Engine.Component {
        constructor(data) {
            super();
            this.data = clone(data);
        }
    }
    Component.Attributes = Attributes;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="timebomb.ts" />
var Component;
(function (Component) {
    class StaggerReturn extends Component.Timebomb {
        constructor(duration) {
            super(duration, Destruct.Component);
            this.duration = duration;
        }
    }
    Component.StaggerReturn = StaggerReturn;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="attributes.ts" />
/// <reference path="timebomb.ts" />
/// <reference path="stagger-return.ts" />
var Component;
(function (Component) {
    class Stagger extends Component.Timebomb {
        constructor(duration) {
            super(duration, Destruct.Component, false, (ecs, entity) => {
                // When stagger goes away, add a StaggerReturn component.
                let comps = ecs.getComponents(entity);
                if (!comps.has(Component.Attributes)) {
                    console.error('Tried to add StaggerReturn but entity has no Attributes Component (for timing).');
                    return;
                }
                let attribs = comps.get(Component.Attributes);
                let duration = attribs.data.hitSettings.staggerReturnDuration;
                ecs.addComponent(entity, new Component.StaggerReturn(duration));
            });
            this.duration = duration;
        }
    }
    Component.Stagger = Stagger;
})(Component || (Component = {}));
/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="../core/lang.ts" />
/// <reference path="../core/util.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/stage.ts" />
/// <reference path="../component/activity.ts" />
/// <reference path="../component/animatable.ts" />
/// <reference path="../component/body.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/stagger.ts" />
var System;
(function (System) {
    class AnimationRenderer extends Engine.System {
        constructor(stage) {
            super();
            this.stage = stage;
            //
            // instance
            //
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.Animatable.name,
            ]);
            this.dirtyComponents = new Set([
                // changes in these require updates.
                Component.Position.name,
                Component.Animatable.name,
                Component.Activity.name,
                Component.Body.name,
                // listening for these to be added/removed as also means update
                // required
                Component.Dead.name,
                Component.DamagedFlash.name,
            ]);
            this.cacheTodoKeys = new Set();
            this.cacheTexOrigPos = new Point();
            this.cacheAlignOffset = new Point();
        }
        //
        // static
        //
        /**
         * TODO: eventually fully replace with Animation.build (these are
         * separate because of the Anim.Data (old) vs Anim.BaseData (new)
         * divide).
         */
        static buildAnimation(st, z, d) {
            // Create
            let anim = Stage.Animation.build({
                base: d.frameBase,
                frames: d.nFrames,
                speed: d.speed,
                playType: d.playType,
                anchor: d.anchor,
                alpha: d.alpha,
                tint: d.tint,
                scale: d.scale,
            }, {
                stageTarget: st,
                z: z,
            });
            anim.visible = false; // will turn on first update
            return anim;
        }
        /**
         * Computes the set of current keys to be displayed.
         */
        static getCurrentKeys(aspect, animatable, out) {
            out.clear();
            // simple case: default only
            if (animatable.defaultOnly) {
                out.add(Anim.DefaultKey);
                return;
            }
            // otherwise, gotta do body part calculus
            let activity = aspect.get(Component.Activity);
            let body = aspect.get(Component.Body);
            for (let [part, partID] of body.getParts()) {
                // Check early on with what we have loaded. Don't add it if we don't. We're not
                // warning here as it would happen every frame, but these should be fixed at
                // some point assuming we want a complete set of animations.
                let key = Anim.getKey(activity.action, part, partID);
                // TODO: remove "state" and see whether works.
                if (animatable.state.animations.has(key)) {
                    out.add(key);
                }
            }
        }
        static getCoreKey(aspect, animatable) {
            // easy case: only one key!
            if (animatable.defaultOnly) {
                return Anim.DefaultKey;
            }
            // otherwise, depends on activity and partID
            let activity = aspect.get(Component.Activity);
            let body = aspect.get(Component.Body);
            let corePartID = body.getPart(Part.Core);
            return Anim.getKey(activity.action, Part.Core, corePartID);
        }
        onAdd(aspect) {
            let animatable = aspect.get(Component.Animatable);
            // loop through all provided animation types for the action
            for (let [key, data] of animatable.animations.entries()) {
                let anim = AnimationRenderer.buildAnimation(animatable.stageTarget, animatable.z, data);
                let tint = data.tint != null ? data.tint : animatable.globalTint;
                let scale = data.scale != null ? data.scale : animatable.globalScale;
                // apply scale immediately (because it doesn't change, like
                // tint does; if it starts to, put below near where getTint()
                // is)
                anim.scale.set(scale, scale);
                let [action, part, partID] = Anim.splitKey(key);
                animatable.state.animations.set(key, {
                    animation: anim,
                    align: data.align,
                    tint: tint,
                    scale: scale,
                    action: action,
                    part: part,
                    partID: partID,
                });
            }
            // we don't actually add to the stage yet as we'll need to decide
            // each frame what gets displayed.
            // let ticker know about it
            this.ecs.addComponent(aspect.entity, new Component.AnimationTickable());
        }
        onRemove(aspect) {
            let state = aspect.get(Component.Animatable).state;
            for (let key of state.activeKeys.keys()) {
                let cont = state.animations.get(key);
                this.stage.remove(cont.animation);
            }
        }
        getTint(aspect, defaultTint) {
            // TODO: make constants somewhere
            let red = 0xff0000;
            let flash = 0xffff00;
            // NOTE: could disable red on dead, but I think it looks kind of
            // good, even though it might logically not make quite as much
            // sense.
            // Tint red if damage flash enabled.
            if (aspect.has(Component.DamagedFlash)) {
                return red;
            }
            // default
            return defaultTint;
        }
        // private getBrightness(aspect: Engine.Aspect): number {
        // 	let dark = 0.0;
        // 	let normal = 1.0;
        // 	let bright = 3.0;
        // 	// if dead, don't flash or anything
        // 	if (aspect.has(Component.Dead)) {
        // 		return normal;
        // 	}
        // 	// damage immunity
        // 	if (aspect.has(Component.Invincible)) {
        // 		let inv = aspect.get(Component.Invincible);
        // 		let elapsed = this.ecs.gametime - inv.startTime;
        // 		let portion = Tween.linearCycle(elapsed, -1, 400);
        // 		return portion*dark + (1-portion)*normal;
        // 	}
        // 	// charge
        // 	if (aspect.has(Component.Armed)) {
        // 		let armed = aspect.get(Component.Armed);
        // 		let portion = 0.0;
        // 		switch(armed.state) {
        // 			case Weapon.SwingState.ChargeCharging:
        // 			case Weapon.SwingState.ChargeReady:
        // 				portion = Tween.linearCycle(armed.elapsed, -1, 200);
        // 				break;
        // 		}
        // 		return portion*bright + (1-portion)*normal;
        // 	}
        // 	return normal;
        // }
        // private applyFilters(aspect: Engine.Aspect, animation: Stage.Animation): void {
        // 	// brightness (currently only filter)
        // 	// let brightness = this.getBrightness(aspect);
        // 	// set every frame (inefficient?)
        // 	// (animation.filterCache.get(Stage.Animation.BrightnessFilter) as PIXI.filters.ColorMatrixFilter)
        // 	//	.brightness(brightness);
        // }
        maybeHide(aspect, animatable) {
            if (animatable.hideOnDeath) {
                animatable.visible = !aspect.has(Component.Dead);
            }
        }
        /**
         * Changes individual animation as necessary based on active components.
         */
        mutateAnimation(delta, aspect, ac, visible) {
            ac.animation.visible = visible;
            if (visible) {
                ac.animation.tint = this.getTint(aspect, ac.tint);
                // this.applyFilters(aspect, animation);
            }
        }
        updateAnimations(delta, aspect, next) {
            // Extract (and sometimes mutate) flags that signal details on how
            // we should render animations.
            let animatable = aspect.get(Component.Animatable);
            let state = animatable.state;
            // reset
            let reset = animatable.reset;
            animatable.reset = false;
            // hide
            let visible = animatable.visible;
            // For each key in prevKeys:
            //	- if it's not in the new keys, remove from the stage
            // For each key left in the new keys:
            //	- if it's not in the old keys, add it to the stage
            // (could do a set difference instead and avoid double-checking
            // objects, but avoiding duplicating objects probably faster)
            for (let prevKey of state.activeKeys.keys()) {
                if (next.has(prevKey)) {
                    let ac = state.animations.get(prevKey);
                    this.mutateAnimation(delta, aspect, ac, visible);
                    // TODO: maybe move reset to animation ticker (if it's
                    // clean to) so we don't skip the first frame upon reset.
                    // Reset (if requested).
                    if (reset) {
                        ac.animation.reset();
                    }
                }
                else {
                    // No longer displayed; remove from stage.
                    this.stage.remove(state.animations.get(prevKey).animation);
                }
            }
            for (let newKey of next.keys()) {
                if (!state.activeKeys.has(newKey)) {
                    // Reset animation frame progression and add to stage.
                    let ac = state.animations.get(newKey);
                    ac.animation.reset();
                    this.mutateAnimation(delta, aspect, ac, visible);
                    this.stage.add(ac.animation);
                }
            }
        }
        updatePositions(aspect) {
            // Always update the position.
            let animatable = aspect.get(Component.Animatable);
            let state = animatable.state;
            let position = aspect.get(Component.Position);
            let coreKey = AnimationRenderer.getCoreKey(aspect, animatable);
            let rot = angleFlip(position.angle); // us: CCW; pixi: CW
            // First, update the core animation's position / rotation.
            if (!state.animations.has(coreKey)) {
                console.error('DEBUG: All entity animations:');
                for (let anim of state.animations.keys()) {
                    console.error(' - "' + anim + '"');
                }
                throw new Error('Entity lacks animation: "' + coreKey + '";\n');
            }
            let coreAnim = state.animations.get(coreKey).animation;
            coreAnim.position.set(position.p.x, position.p.y);
            coreAnim.rotation = rot;
            // Next, extract its origin for use later.
            let coreOrig = this.cacheTexOrigPos;
            coreAnim.getTextureOrigin(coreOrig);
            // Then, update the others.
            for (let [key, cont] of state.animations.entries()) {
                if (key == coreKey) {
                    continue;
                }
                // Position depends on tracking type.
                switch (cont.align.alignType) {
                    case Anim.AlignType.Center: {
                        cont.animation.position.set(position.p.x, position.p.y);
                        break;
                    }
                    case Anim.AlignType.TextureOrigin: {
                        // rotate the alignment extra offset by animation's
                        // rotation
                        let ao = this.cacheAlignOffset;
                        ao.copyFrom_(cont.align.extraOffset).rotate_(rot).add_(coreOrig);
                        cont.animation.position.set(ao.x, ao.y);
                        break;
                    }
                }
                // Rotation is always set the same throughout (can change).
                cont.animation.rotation = rot;
            }
        }
        // private animDirty(aspect: Engine.Aspect, animatable: Component.Animatable): boolean {
        // 	let activityDirty = aspect.has(Component.Activity) && aspect.get(Component.Activity).dirty;
        // 	let bodyDirty = aspect.has(Component.Body) && aspect.get(Component.Body).dirty;
        // 	return animatable.dirty || activityDirty || bodyDirty;
        // }
        update(delta, entities, dirty) {
            for (let entity of dirty) {
                let aspect = entities.get(entity);
                let animatable = aspect.get(Component.Animatable);
                // let animDirty = this.animDirty(aspect, animatable);
                // pre
                // shortcut to avoid most of updates for invisible things
                let state = animatable.state;
                this.maybeHide(aspect, animatable);
                if ((state.curVisible === animatable.visible) && !animatable.visible) {
                    continue;
                }
                // getCurrent Keys
                let nextKeys = this.cacheTodoKeys;
                AnimationRenderer.getCurrentKeys(aspect, animatable, nextKeys);
                // update anims
                this.updateAnimations(delta, aspect, nextKeys);
                // updatePositions
                // TODO: find a way to only update positions when only positions
                // changed (majority case). may require more extensive
                // bookkeeping of dirty components (specifically, to notice
                // removed ones like Dead or DamagedFlash so we can avoid
                // running the above methods).
                this.updatePositions(aspect);
                // maybe add ticker so it's updated. w/ dirty check, we didn't
                // do so for mere position changes, but we're deprecating
                // reading dirty flag so trying just always adding it.
                // if (animDirty && (!aspect.has(Component.AnimationTickable))) {
                if (!aspect.has(Component.AnimationTickable)) {
                    this.ecs.addComponent(entity, new Component.AnimationTickable());
                }
                // post
                setClone(nextKeys, state.activeKeys);
                state.curVisible = animatable.visible;
            }
        }
    }
    __decorate([
        override
    ], AnimationRenderer.prototype, "onAdd", null);
    __decorate([
        override
    ], AnimationRenderer.prototype, "onRemove", null);
    System.AnimationRenderer = AnimationRenderer;
})(System || (System = {}));
var Ontology;
(function (Ontology) {
    /**
     * Coarse level `Thing` categories multiplex behavior.
     */
    let Thing;
    (function (Thing) {
        Thing[Thing["UNSPECIFIED"] = 0] = "UNSPECIFIED";
        Thing[Thing["Player"] = 1] = "Player";
        Thing[Thing["Enemy"] = 2] = "Enemy";
        Thing[Thing["Destructible"] = 3] = "Destructible";
        Thing[Thing["Item"] = 4] = "Item";
    })(Thing = Ontology.Thing || (Ontology.Thing = {}));
    let Item;
    (function (Item) {
        Item[Item["Health"] = 0] = "Health";
        Item[Item["Doughnut"] = 1] = "Doughnut";
        Item[Item["UpgradeSword"] = 2] = "UpgradeSword";
        Item[Item["UpgradeShield"] = 3] = "UpgradeShield";
        Item[Item["UpgradeHP4"] = 4] = "UpgradeHP4";
        Item[Item["UpgradeStabCombo"] = 5] = "UpgradeStabCombo";
        Item[Item["UpgradeSpeed"] = 6] = "UpgradeSpeed";
        Item[Item["UpgradeBow"] = 7] = "UpgradeBow";
        Item[Item["UpgradeAOECombo"] = 8] = "UpgradeAOECombo";
        Item[Item["UpgradeHP5"] = 9] = "UpgradeHP5";
        Item[Item["TransformToBlop"] = 10] = "TransformToBlop";
        Item[Item["TransformToPlayer"] = 11] = "TransformToPlayer";
    })(Item = Ontology.Item || (Ontology.Item = {}));
})(Ontology || (Ontology = {}));
/// <reference path="../core/base.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/ontology.ts" />
var System;
(function (System) {
    /**
     * System-level utility functions.
     */
    class Util {
        /**
         * Adds or extends `c` (some Timebomb subclass) to `aspect` to last for
         * `duration` from now.
         *
         * @param ecs
         * @param aspect
         * @param c should be a subclass of Timebomb, but I think Typescript is
         * confused, so using 'any'
         * @param duration
         */
        static addOrExtend(ecs, entity, c, duration) {
            let comps = ecs.getComponents(entity);
            if (comps.has(c)) {
                let existing = comps.get(c);
                existing.startTime = ecs.gametime;
                existing.duration = duration;
            }
            else {
                ecs.addComponent(entity, new c(duration));
            }
        }
        /**
         * Gets the broad class of thing this entity is.
         * @param ecs
         * @param entity
         */
        static getThing(ecs, entity) {
            let comps = ecs.getComponents(entity);
            if (comps.has(Component.PlayerInput)) {
                return Ontology.Thing.Player;
            }
            if (comps.has(Component.Enemy)) {
                return Ontology.Thing.Enemy;
            }
            if (comps.has(Component.Item)) {
                return Ontology.Thing.Item;
            }
            if (comps.has(Component.Destructible)) {
                return Ontology.Thing.Destructible;
            }
            return Ontology.Thing.UNSPECIFIED;
        }
        /**
         * Returns angle from `a` to `b`, or 0 if either doesn't have the
         * necessary components (position).
         * @param ecs
         * @param a
         * @param b
         */
        static angleAtoB(ecs, a, b) {
            let aComps = ecs.getComponents(a);
            let bComps = ecs.getComponents(b);
            if (aComps == null || bComps == null || (!aComps.has(Component.Position)) || (!bComps.has(Component.Position))) {
                return 0;
            }
            let aPos = aComps.get(Component.Position);
            let bPos = bComps.get(Component.Position);
            return angleClamp(aPos.p.pixiAngleTo(bPos.p));
        }
        static logEntityLayerCounts(entities) {
            Util.logDirtyLayerCounts(entities, entities.keys());
        }
        static logDirtyLayerCounts(entities, dirty) {
            // NOTE: consider lodash map w/ Counter.from(...)
            let c = new Counter();
            for (let e of dirty) {
                let aspect = entities.get(e);
                let val;
                if (aspect.has(Component.DebugKVLayer)) {
                    val = aspect.get(Component.DebugKVLayer).layer;
                }
                else {
                    val = 'unknown';
                }
                c.increment(val);
            }
            // NOTE: consider adding sorting to counter + even graphic
            // representation.
            for (let [k, v] of c.entries()) {
                console.log(k + ': ' + v);
            }
        }
    }
    System.Util = Util;
})(System || (System = {}));
/// <reference path="../core/base.ts" />
/// <reference path="../core/util.ts" />
/// <reference path="../gj7/constants.ts" />
/// <reference path="../engine/ecs.ts" />
/**
 * Any collision box can have one or more collision types, which are used by the
 * collision detection system to determine subsets of boxes to check.
 */
var CollisionType;
(function (CollisionType) {
    /**
     * Used to mark a value that shouldn't appear in the game.
     */
    CollisionType[CollisionType["Invalid"] = 0] = "Invalid";
    /**
     * Moves. Need to update position.
     */
    CollisionType[CollisionType["Mobile"] = 1] = "Mobile";
    /**
     * Should worry about collisions with other SOLID + MOBILE objects.
     */
    CollisionType[CollisionType["Solid"] = 2] = "Solid";
    /**
     * Attacks seek vulnerable boxes (*evil smiley*)
     */
    CollisionType[CollisionType["Attack"] = 3] = "Attack";
    /**
     * Vulnerable boxes can be damaged by attacks.
     */
    CollisionType[CollisionType["Vulnerable"] = 4] = "Vulnerable";
    /**
     * Destructible boxes further mark Vulnerable boxes because a player OR
     * enemy can destroy them (whereas, with enemy friendly fire off, most
     * vulnerable boxes are only player-attackable).
     */
    CollisionType[CollisionType["Destructible"] = 5] = "Destructible";
    /**
     * Shield boxes stop damage coming from attacks.
     */
    CollisionType[CollisionType["Shield"] = 6] = "Shield";
    /**
     * Player-tagged boxes either come from the player (e.g., Attack+Player) or
     * are the player (e.g., Mobile+Solid+Vulnerable+Player). This distinction
     * is important for disabling friendly fire and having only the player be
     * able to hit cauldrons for checkpoints.
     */
    CollisionType[CollisionType["Player"] = 7] = "Player";
    /**
     * Logic boxes do things when the player is in them (things like events,
     * scripts, camera movement).
     */
    CollisionType[CollisionType["Logic"] = 8] = "Logic";
    /**
     * Physics is similar to Logic, but player and enemies can encounter them
     * (e.g., slow regions).
     */
    CollisionType[CollisionType["Physics"] = 9] = "Physics";
    /**
     * Something the player can pick up.
     */
    CollisionType[CollisionType["Item"] = 10] = "Item";
    /**
     * Marks attacks that can damage the player at any time, but can only
     * damage non-player entities if they are *doing* something (i.e., not
     * "idle", "moving", or "charging").
     */
    CollisionType[CollisionType["Environment"] = 11] = "Environment";
    /**
     * Marks attacks that can damage player or enemies at any time.
     */
    CollisionType[CollisionType["Explosion"] = 12] = "Explosion";
    /**
     * Marks a projectile; stopped by walls.
     */
    CollisionType[CollisionType["Projectile"] = 13] = "Projectile";
    /**
     * Marks a wall; stops projectiles.
     */
    CollisionType[CollisionType["Wall"] = 14] = "Wall";
})(CollisionType || (CollisionType = {}));
class MapMutationNotifier {
    constructor(listener) {
        this.listener = listener;
        this.m = new Map();
    }
    get size() {
        return this.m.size;
    }
    set(key, val) {
        this.m.set(key, val);
        this.listener.dirty();
        return this;
    }
    keys() {
        return this.m.keys();
    }
    get(key) {
        return this.m.get(key);
    }
    clear() {
        if (this.m.size > 0) {
            this.m.clear();
            this.listener.dirty();
        }
    }
    entries() {
        return this.m.entries();
    }
}
class SetMutationNotifier {
    constructor(listener) {
        this.listener = listener;
        this.s = new Set();
    }
    add(t) {
        if (!this.s.has(t)) {
            this.s.add(t);
            this.listener.dirty();
        }
        return this;
    }
    has(t) {
        return this.s.has(t);
    }
    get size() {
        return this.s.size;
    }
    clear() {
        if (this.s.size > 0) {
            this.s.clear();
            this.listener.dirty();
        }
    }
}
var Component;
(function (Component) {
    /**
     * IMPORTANT! Game currently assumes `localVertices`, `cTypes`, `shape`,
     * and `offset` never change.
     */
    class CollisionShape extends Engine.Component {
        constructor(localVertices, cTypes, shape = Physics.Shape.Polygon, offset = new Point()) {
            super();
            this.cTypes = new Set();
            // cache distances set in constructor (reachability distances)
            this.sqMaxDistance = -1;
            this.maxDistance = -1;
            //
            // mutable state (signaling dirty component)
            //
            /**
             * "Fresh" collisions are cleared and then added every frame. They are
             * only not added if the colliding entity appears in the "resolved"
             * list.
             */
            this.collisionsFresh = new MapMutationNotifier(this);
            /**
             * "Resolved" collisions are for the lifetime of the entity. This is
             * meant for an attack, which should only damage another entity once.
             */
            this.collisionsResolved = new SetMutationNotifier(this);
            this._disabled = false;
            // for when the vertices, edges, and axes are valid
            this._cacheComputedPoint = new Point(-Infinity, -Infinity);
            this._cacheComputedAngle = -Infinity;
            // just a normal cache var
            this.cacheFullPos = new Point();
            // defensively copy in main settings
            let sides = localVertices.length;
            this._sides = sides;
            this.localVertices = new Array(sides);
            for (let i = 0; i < sides; i++) {
                this.localVertices[i] = localVertices[i].copy();
            }
            setClone(cTypes, this.cTypes);
            this.shape = shape;
            this.offset = offset.copy();
            // Rectangles only have two unique axes.
            this._axes = shape === Physics.Shape.Rectangle ? sides / 2 : sides;
            // init the arrays that we want
            this._globalVertices = new Array(sides);
            this._globalEdges = new Array(this._axes);
            this._globalAxes = new Array(this._axes);
            for (let arr of [this._globalVertices, this._globalEdges, this._globalAxes]) {
                for (let i = 0; i < arr.length; i++) {
                    arr[i] = new Point();
                }
            }
            // max distance here ignores offset; offset is taken into account
            // in code that uses the max distance by first computing the
            // shapes' centers with pos + offset.
            let maxDSq = -1;
            for (let i = 0; i < sides; i++) {
                maxDSq = Math.max(maxDSq, localVertices[i].l2Squared());
            }
            this.sqMaxDistance = maxDSq;
            this.maxDistance = Math.sqrt(maxDSq);
            // cache for toString()
            this._repr = '[' + this.localVertices + '] ' + setString(this.cTypes, (c) => CollisionType[c]);
        }
        // optimization used for faster debug collision box rendering
        get rectDims() {
            if (this.shape !== Physics.Shape.Rectangle) {
                console.warn('Should not get rectDims for non-rectangle. Check .shape first.');
                return null;
            }
            return new Point(Math.abs(this.localVertices[0].x) * 2, Math.abs(this.localVertices[0].y) * 2);
        }
        /**
         * Can be used to make the collision box inactive without having to
         * destroy and recreate it. Disabled boxes don't collide with anything.
         */
        get disabled() { return this._disabled; }
        set disabled(v) {
            if (this._disabled !== v) {
                this._disabled = v;
                this.dirty();
            }
        }
        recomputeGlobalVertices(worldPos, angle) {
            for (let i = 0; i < this._sides; i++) {
                this._globalVertices[i].copyFrom_(this.localVertices[i]).rotate_(-angle).add_(worldPos);
            }
        }
        /**
         * Recomputes internals if needed.
         */
        maybeRecomputeInternals(pos, angle) {
            // See whether computations are needed.
            if (this._cacheComputedPoint.equals(pos) && this._cacheComputedAngle === angle) {
                return;
            }
            // We do need to do the computations. Note that internally we must
            // add any offset to the provided position. (Can move this
            // outwards if we want to allow the offset to vary.)
            this.cacheFullPos.copyFrom_(pos).add_(this.offset);
            this.recomputeGlobalVertices(this.cacheFullPos, angle);
            Physics.getEdges(this._globalVertices, this._globalEdges, this._axes);
            Physics.getNormals(this._globalEdges, this._globalAxes);
            // Save so we don't have to do next time.
            this._cacheComputedPoint.copyFrom_(pos);
            this._cacheComputedAngle = angle;
        }
        /**
         * Gets the vertices of this collision box (for SAT).
         * @param pos
         * @param angle
         */
        getVertices(pos, angle) {
            this.maybeRecomputeInternals(pos, angle);
            return this._globalVertices;
        }
        /**
         * Gets the axes (AKA normals) (for SAT).
         * @param pos
         * @param angle
         */
        getAxes(pos, angle) {
            this.maybeRecomputeInternals(pos, angle);
            return this._globalAxes;
        }
        /**
         * Factory for rectangle-shaped collision boxes.
         */
        static buildRectangle(dims, cTypes, offset = new Point()) {
            return new CollisionShape([
                new Point(-dims.x / 2, -dims.y / 2),
                new Point(dims.x / 2, -dims.y / 2),
                new Point(dims.x / 2, dims.y / 2),
                new Point(-dims.x / 2, dims.y / 2),
            ], cTypes, Physics.Shape.Rectangle, offset);
        }
        toString() {
            return this._repr;
        }
    }
    Component.CollisionShape = CollisionShape;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="util.ts" />
/// <reference path="../component/block.ts" />
/// <reference path="../component/collision-shape.ts" />
var System;
(function (System) {
    /**
     * Note that we cycle through *block* entities here.
     */
    class CollisionBlock extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.CollisionShape.name,
                Component.Block.name,
            ]);
        }
        update(delta, entities) {
            for (let [entity, aspect] of entities.entries()) {
                let cShape = aspect.get(Component.CollisionShape);
                let block = aspect.get(Component.Block);
                let defenderType = System.Util.getThing(this.ecs, block.blocker);
                for (let otherEntity of cShape.collisionsFresh.keys()) {
                    let otherComps = this.ecs.getComponents(otherEntity);
                    // sanity checking -- other entity should have collision box
                    if (!otherComps.has(Component.CollisionShape)) {
                        console.error('Colliding entities did both have CollisionBox components?!?');
                        continue;
                    }
                    // only worry about weapon collision boxes
                    let otherBox = otherComps.get(Component.CollisionShape);
                    if (!otherBox.cTypes.has(CollisionType.Attack)) {
                        continue;
                    }
                    // sanity checking -- entity with weapon collision box
                    // should also have attack component
                    if (!otherComps.has(Component.Attack)) {
                        console.error('Weapon CollisionBox did have an Attack component?!?');
                        continue;
                    }
                    // attack might be unblockable
                    let attack = otherComps.get(Component.Attack);
                    if (attack.info.unblockable) {
                        continue;
                    }
                    let attackerComps = this.ecs.getComponents(attack.attacker);
                    // extract original damage for use later. we could skip all
                    // the rest if the original damage was == 0, but it's nice
                    // to do so we can remove the attack instead of continuously
                    // colliding with it. (this is for projectiles sticking
                    // around on walls w/ 0 damage).
                    let origDamage = attack.info.damage;
                    // super simple strategy: reduce damage of attack by the
                    // shield's armor.
                    //	- if the attack damage is reduced to zero, remove the
                    //	  attack entirely and have attacker Blocked)
                    //	- if not, make the block resolved
                    //	- either way, defender should be Recoil'ed
                    attack.info.damage = Math.max(0, attack.info.damage - block.shield.block.armor);
                    if (attack.info.damage == 0) {
                        // shield fully defended attack
                        // remove attack
                        attack.fuse = true;
                        // only modify attacker if the attack was linked to it
                        // (and not a projectile)
                        if (attack.info.movement === Weapon.AttackMovement.Track) {
                            // attacker is blocked. apply changes unless the
                            // duration has been set to zero or negative.
                            if (attack.info.blockedDuration > 0) {
                                // add blocked component
                                System.Util.addOrExtend(this.ecs, attack.attacker, Component.Blocked, attack.info.blockedDuration);
                                // make immobile
                                System.Util.addOrExtend(this.ecs, attack.attacker, Component.Immobile, attack.info.blockedDuration);
                            }
                            // send attacker back
                            if (attackerComps.has(Component.Input)) {
                                (attackerComps.get(Component.Input)).bounce = true;
                            }
                        }
                    }
                    else {
                        // shield reduced attack damage but still > 0
                        // make block resolved
                        otherBox.collisionsResolved.add(entity);
                    }
                    // only do recoil and "blocking" event if the original damage
                    if (origDamage <= 0) {
                        continue;
                    }
                    // recoil defender
                    if (!this.ecs.getComponents(block.blocker).has(Component.Recoil)) {
                        this.ecs.addComponent(block.blocker, new Component.Recoil());
                    }
                    // and dispatch block event
                    let eType = Events.EventTypes.Block;
                    let eArgs = {
                        shield: block.shield,
                        defenderType: defenderType,
                        angleAtoB: System.Util.angleAtoB(this.ecs, attack.attacker, block.blocker),
                    };
                    this.eventsManager.dispatch({ name: eType, args: eArgs });
                }
            }
        }
    }
    System.CollisionBlock = CollisionBlock;
})(System || (System = {}));
var Events;
(function (Events) {
    /**
     * List of all game event types.
     */
    let EventTypes;
    (function (EventTypes) {
        EventTypes[EventTypes["Damage"] = 0] = "Damage";
        EventTypes[EventTypes["Charge"] = 1] = "Charge";
        EventTypes[EventTypes["Swing"] = 2] = "Swing";
        EventTypes[EventTypes["Checkpoint"] = 3] = "Checkpoint";
        EventTypes[EventTypes["ThingDead"] = 4] = "ThingDead";
        /**
         * Fired when player enters or leaves a zone.
         */
        EventTypes[EventTypes["ZoneTransition"] = 5] = "ZoneTransition";
        /**
         * Fired when an attack is blocked.
         */
        EventTypes[EventTypes["Block"] = 6] = "Block";
        /**
         * Trigger for events before enemy stagger (like pause/slowmotion). A
         * handler that catches this will fire the EnemyStagger event.
         */
        EventTypes[EventTypes["EnemyStaggerPre"] = 7] = "EnemyStaggerPre";
        /**
         * Fired when an enemy is staggered.
         */
        EventTypes[EventTypes["EnemyStagger"] = 8] = "EnemyStagger";
        /**
         * Fired when player picks up a health item.
         */
        EventTypes[EventTypes["ItemCollected"] = 9] = "ItemCollected";
        /**
         * A little specific, but: emit blood on the ground.
         */
        EventTypes[EventTypes["Bleed"] = 10] = "Bleed";
        /**
         * Player has fulfilled OR unfulfilled exit conditions for level.
         */
        EventTypes[EventTypes["ExitConditions"] = 11] = "ExitConditions";
        /**
         * A menu keypress was registered.
         */
        EventTypes[EventTypes["MenuKeypress"] = 12] = "MenuKeypress";
        /**
         * A debug keypress was registered (not done for all debug keys, only
         * newer ones)
         */
        EventTypes[EventTypes["DebugKeypress"] = 13] = "DebugKeypress";
        /**
         * Starts the "end of level" sequence.
         */
        EventTypes[EventTypes["StartExitSequence"] = 14] = "StartExitSequence";
        /**
         * Asks for the scene switch.
         */
        EventTypes[EventTypes["SwitchScene"] = 15] = "SwitchScene";
        /**
         * When the gameplay starts at the beginning of a level.
         */
        EventTypes[EventTypes["GameplayStart"] = 16] = "GameplayStart";
        /**
         * Gates open and produce sounds and my design for this engine isn't
         * great yet.
         */
        EventTypes[EventTypes["GateOpen"] = 17] = "GateOpen";
        /**
         * Trigger to check all gates (and close any as needed).
         */
        EventTypes[EventTypes["CheckGates"] = 18] = "CheckGates";
        /**
         * Trigger to show instructions.
         */
        EventTypes[EventTypes["ShowInstructions"] = 19] = "ShowInstructions";
        /**
         * Trigger for game logic stuff DANG stop making events just use this!
         */
        EventTypes[EventTypes["GameLogic"] = 20] = "GameLogic";
        /**
         * BOOM
         */
        EventTypes[EventTypes["Explosion"] = 21] = "Explosion";
        /**
         * For the end sequence.
         */
        EventTypes[EventTypes["SwapBodies"] = 22] = "SwapBodies";
        /**
         * For giving/revoking player control.
         */
        EventTypes[EventTypes["PlayerControl"] = 23] = "PlayerControl";
    })(EventTypes = Events.EventTypes || (Events.EventTypes = {}));
    let Phase;
    (function (Phase) {
        Phase[Phase["TitleScreenShow"] = 0] = "TitleScreenShow";
        Phase[Phase["CreditsShow"] = 1] = "CreditsShow";
        Phase[Phase["RecapShow"] = 2] = "RecapShow";
    })(Phase = Events.Phase || (Events.Phase = {}));
})(Events || (Events = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    class Health extends Engine.Component {
        constructor(maximum, current = maximum) {
            super();
            this.maximum = maximum;
            this.current = current;
        }
        get maximum() { return this._maximum; }
        set maximum(v) {
            if (v !== this._maximum) {
                this._maximum = v;
                this.dirty();
            }
        }
        get current() { return this._current; }
        set current(v) {
            if (v !== this._current) {
                this._current = v;
                this.dirty();
            }
        }
        toString() {
            return this.current + ' / ' + this.maximum;
        }
    }
    Component.Health = Health;
})(Component || (Component = {}));
var Physics;
(function (Physics) {
    Physics.STOP = 0;
    Physics.LEFT = 1;
    Physics.RIGHT = -1;
    Physics.UP = -1;
    Physics.DOWN = 1;
    let MovementType;
    (function (MovementType) {
        /**
         * RotateMove means the rotational velocity is used to rotate the
         * entity when it requests x-direction movement. WSAD-only controls
         * would use this.
         */
        MovementType[MovementType["RotateMove"] = 0] = "RotateMove";
        /**
         * InstantTurn means the entity is able to pick a target rotation
         * instantaneously (ignores rotational velocity). Mouse + keyboard
         * controls would use this.
         */
        MovementType[MovementType["InstantTurn"] = 1] = "InstantTurn";
        /**
         * Strafe means the rotation and movement direction are indepenent of
         * eachother. Input (e.g., WSAD) controls movement in 8 directions;
         * rotation controls aiming attacks and blocks.
         */
        MovementType[MovementType["Strafe"] = 2] = "Strafe";
    })(MovementType = Physics.MovementType || (Physics.MovementType = {}));
    let RegionType;
    (function (RegionType) {
        RegionType[RegionType["Slow"] = 0] = "Slow";
    })(RegionType = Physics.RegionType || (Physics.RegionType = {}));
})(Physics || (Physics = {}));
/// <reference path="../core/base.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/physics.ts" />
var Component;
(function (Component) {
    class Input extends Engine.Component {
        constructor(movement) {
            super();
            // state
            this.intent = new Point();
            this.attack = false;
            this.quickAttack = false;
            this.block = false;
            this.switchWeapon = false;
            this.controls = false;
            /**
             * API: InputType.InstantTurn only --- selects target angle
             */
            this.targetAngle = 0;
            /**
             * API: Collision applied force sent here instead of forceQueue because
             * it happens so often (e.g., if colliding, every single frame).
             */
            this.collisionForce = new Point();
            /**
             * API: Game logic systems add forces to the forceQueue. Whatever
             * system is handing movement should empty the queue and apply all
             * forces every frame.
             */
            this.forceQueue = new Array();
            /**
             * API: Game logic systems add friction coefficients to the
             * frictionQueue. Whatever system is handing movement should empty the
             * queue and apply friction coefficients every frame.
             */
            this.frictionQueue = new Array();
            /**
             * API: whether to rebound in reverse direction.
             */
            this.bounce = false;
            this.movement = clone(movement);
            this.movement.attackMobility = this.movement.attackMobility || false;
        }
        toString() {
            return this.intent +
                ' [' + Physics.MovementType[this.movement.movementType] + ']' +
                ' (atk: ' + this.attack + ')' +
                ' (quickAttack: ' + this.quickAttack + ')' +
                ' (block: ' + this.block + ')' +
                ' (switch: ' + this.switchWeapon + ')' +
                ' (fq.len: ' + this.frictionQueue.length + ')';
        }
    }
    Component.Input = Input;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    /**
     * Handles computing *total* exp needed to reach levels from a function
     * that gives only exp needed *between* individual levels.
     */
    class LevelComputer {
        constructor(expToLevel) {
            this.expToLevel = expToLevel;
        }
        /**
         * Given total exp, returns current level and progress towards next
         * level through `out`).
         * @param totalExpAcquired
         * @param out
         */
        getData(totalExpAcquired, out) {
            let candidateLevel = 0; // level n + 1
            let expToReach = 0; // total exp to reach level n + 1
            let prevExpToReach = 0; // total exp to reach level n
            while (totalExpAcquired >= expToReach) {
                candidateLevel++;
                prevExpToReach = expToReach;
                expToReach += this.expToLevel(candidateLevel);
            }
            // now, expToReach > totalExpAcquired:
            //						 level is n
            //								  n + 1 is candidateLevel
            //	   expToReach total for level n + 1
            // prevExpToReach total for level n
            out.level = candidateLevel - 1;
            out.expProgress = totalExpAcquired - prevExpToReach;
        }
    }
    /**
     * Denotes something that can gain levels.
     */
    class LevelGainer extends Engine.Component {
        /**
         *
         * @param expToLevel A function with Input: level n; output: exp
         * needed to go from level n - 1 to level n.
         * @param exp
         */
        constructor(expToLevel, exp = 0) {
            super();
            this.expToLevel = expToLevel;
            this.exp = exp;
            this.lastComputedExp = -1;
            this._levelData = {
                level: -1,
                expProgress: -1,
            };
            this.levelComputer = new LevelComputer(expToLevel);
        }
        /**
         * Uses current exp and expToLevel function to return the entity's
         * level and progress to next level.
         */
        get levelData() {
            // recompute if needed
            if (this.lastComputedExp != this.exp) {
                this.levelComputer.getData(this.exp, this._levelData);
                this.lastComputedExp = this.exp;
            }
            return this._levelData;
        }
        /**
         * Uses current exp and expToLevel function to return the entity's
         * level.
         */
        get level() {
            return this.levelData.level;
        }
        /**
         * Returns exp needed to go from start of current level to next
         * level.
         */
        get expNext() {
            return this.expToLevel(this.level + 1);
        }
        /**
         * Returns current progress from start of current level to next level.
         */
        get expProgress() {
            return this.levelData.expProgress;
        }
        toString() {
            return 'level ' + this.level + ' (' + this.expProgress + '/' + this.expNext + ')';
        }
    }
    Component.LevelGainer = LevelGainer;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/attributes.ts" />
/// <reference path="../gj7/events.ts" />
/// <reference path="util.ts" />
/// <reference path="../component/attack.ts" />
/// <reference path="../component/collision-shape.ts" />
/// <reference path="../component/health.ts" />
/// <reference path="../component/input.ts" />
/// <reference path="../component/level-gainer.ts" />
/// <reference path="../component/stagger.ts" />
var System;
(function (System) {
    // Actions enemies can take and be immune from environmental damage.
    const envImmuneEnemyActions = new Set([
        Action.Moving, Action.Idle, Action.Charging,
    ]);
    // settings map for behavior mapping. can pull into yet another JSON file
    // if we want, but seems like it won't need to change much.
    let hitBehaviorMap = new Map([
        [Attributes.HitBehavior.Player, {
                knockback: {
                    flash: true,
                    immobilize: false,
                    invincible: true,
                },
                // NOTE: player shouldn't get staggered.
                stagger: {
                    flash: true,
                    immobilize: false,
                    invincible: true,
                }
            }],
        [Attributes.HitBehavior.StandardEnemy, {
                knockback: {
                    flash: true,
                    immobilize: true,
                    invincible: false,
                },
                stagger: {
                    flash: true,
                    immobilize: true,
                    invincible: true,
                }
            }],
    ]);
    /**
     * Note that the System.CollisionDamage iterates through *things that can
     * be damaged*, NOT through damaging (attack) objects.
     */
    class CollisionDamage extends Engine.System {
        constructor() {
            super(...arguments);
            /**
             * Note that the System.CollisionDamage iterates through *things that can
             * be damaged*, NOT through damaging (attack) objects.
             */
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.CollisionShape.name,
                Component.Health.name,
            ]);
            this.dirtyComponents = new Set([
                Component.CollisionShape.name,
            ]);
        }
        /**
         * Returns whether the aspect is immune from damage.
         * @param aspect
         */
        isDamageImmune(aspect) {
            return aspect.has(Component.Invincible) || aspect.has(Component.Dead);
        }
        /**
         * Returns whether this entity is an Attack with all required
         * properties.
         * @param entity
         */
        isValidAttack(entity) {
            let otherComps = this.ecs.getComponents(entity);
            // sanity checking
            if (!otherComps.has(Component.CollisionShape) || !otherComps.has(Component.Position)) {
                console.error('Attack did not have either CollisionBox Position component. Ignoring.');
                return false;
            }
            // only worry about "Attack" collision types
            let otherBox = otherComps.get(Component.CollisionShape);
            if (!otherBox.cTypes.has(CollisionType.Attack)) {
                return false;
            }
            // If it had an "Attack" collision type, it should also have an
            // Attack Component. Sanity check this.
            if (!otherComps.has(Component.Attack)) {
                console.error('Weapon CollisionBox did have an Attack component?!?');
                return false;
            }
            // all checks pass
            return true;
        }
        /**
         * Special check for damage checks that cannot be done at collision
         * time; e.g., Environmental collisions that hit enemies, but only when
         * they're doing certain things.
         */
        canDamage(victim, attackEntity) {
            // play can always be damaged
            if (victim.has(Component.PlayerInput)) {
                return true;
            }
            // non-environmental attacks can always damage
            let otherCShape = this.ecs.getComponents(attackEntity).get(Component.CollisionShape);
            if (!otherCShape.cTypes.has(CollisionType.Environment)) {
                return true;
            }
            // non-player and environmental attack. must check victim action.
            if (!victim.has(Component.Activity)) {
                console.warn('Victim has no Component.Activity. Assuming non-damagable by Environment.');
                return false;
            }
            let action = victim.get(Component.Activity).action;
            return !envImmuneEnemyActions.has(action);
        }
        /**
         * Apply damage to `victim` from `attackEntity`.
         * @param victim
         * @param attackEntity
         * @returns amount of damage dealt
         */
        applyDamage(victim, attackEntity) {
            // pre-extraction
            let pos = victim.get(Component.Position);
            let health = victim.get(Component.Health);
            let otherComps = this.ecs.getComponents(attackEntity);
            let otherBox = otherComps.get(Component.CollisionShape);
            let attackComp = otherComps.get(Component.Attack);
            let angleVtoA = System.Util.angleAtoB(this.ecs, victim.entity, attackComp.attacker);
            let angleAtoV = angleClamp(angleVtoA + Math.PI);
            // Deal damage. Note that damage could be 0 (if the attack was
            // blocked).
            health.current = Math.max(0, health.current - attackComp.info.damage);
            // Collisions are only added in the collision detection system if
            // it hasn't been resolved by either entity. so that means (a) we
            // don't need to check resolution beforehand here, and (b) we only
            // need to worry about updating a single resolution map. For (b),
            // we'll choose to update the weapon's resolution map as it has a
            // much shorter lifespan.
            otherBox.collisionsResolved.add(victim.entity);
            // Mark as hit on attack (for combo purposes).
            attackComp.hit = true;
            // Only spawn damage event when nonzero damage
            if (attackComp.info.damage > 0) {
                // Damage event (text and sound effect)
                let eName = Events.EventTypes.Damage;
                let eArgs = {
                    location: pos.p.copy(),
                    angleAtoV: angleAtoV,
                    internalDamage: attackComp.info.damage,
                    attackInfo: attackComp.info,
                    victim: victim.entity,
                    victimType: System.Util.getThing(this.ecs, victim.entity),
                };
                this.eventsManager.dispatch({ name: eName, args: eArgs });
            }
            return attackComp.info.damage;
        }
        /**
         * Helper to apply knockback when we know we want it.
         * @param victim
         */
        applyKnockback(victim) {
            // figure out timing
            if (!victim.has(Component.Attributes)) {
                console.error('Tried to knockback entity but lacked Attributes Component (for timing).');
                return;
            }
            let attribs = victim.get(Component.Attributes);
            if (attribs.data.hitSettings == null) {
                console.error('Tried to knockback entity but lacked hitSettings Attribute data.');
                return;
            }
            // extend or add the Knockback component.
            System.Util.addOrExtend(this.ecs, victim.entity, Component.Knockback, attribs.data.hitSettings.knockbackAnimDuration);
            // Always reset the animation on a knockback. (This is
            // unnecessary for the first knockback, which already starts a
            // new animation, but is required for subsequent consecutive
            // knockbacks to play their animation from the start).
            if (victim.has(Component.Animatable)) {
                let anim = victim.get(Component.Animatable);
                anim.reset = true;
            }
        }
        /**
         * Helper to apply stagger when we know we want it.
         * @param victim
         */
        applyStagger(victim, attackEntity) {
            // pre-extraction
            let otherComps = this.ecs.getComponents(attackEntity);
            let attack = otherComps.get(Component.Attack);
            let angleVtoA = System.Util.angleAtoB(this.ecs, victim.entity, attack.attacker);
            let angleAtoV = angleClamp(angleVtoA + Math.PI);
            // figure out timing
            if (!victim.has(Component.Attributes)) {
                console.error('Tried to stagger entity but lacked Attributes Component.');
                return;
            }
            let attribs = victim.get(Component.Attributes);
            if (attribs.data.hitSettings == null) {
                console.error('Tried to stagger entity but lacked hitSettings Attribute data.');
                return;
            }
            // add stagger
            this.ecs.addComponent(victim.entity, new Component.Stagger(attribs.data.hitSettings.staggerDuration));
            // stagger enemy event
            if (!victim.has(Component.PlayerInput)) {
                // only show heavy effects once
                let heavyEffects = !attack.heavyEffectsShown;
                attack.heavyEffectsShown = true;
                let eName = Events.EventTypes.EnemyStaggerPre;
                let eArgs = {
                    angleAtoV: angleAtoV,
                    vLocation: victim.get(Component.Position).p.copy(),
                    heavyEffects: heavyEffects,
                };
                this.eventsManager.dispatch({ name: eName, args: eArgs });
            }
        }
        /**
         * Determine knockback, stagger, or neither.
         * @param attackEntity
         */
        applyKnockbackStagger(victim, attackEntity) {
            // pre-extraction
            let isKnockbackable = victim.has(Component.Knockbackable);
            let isStaggerable = victim.has(Component.Staggerable);
            let otherComps = this.ecs.getComponents(attackEntity);
            let attack = otherComps.get(Component.Attack);
            // compute what we want
            let doStagger = isStaggerable && attack.info.damage > 0 && attack.info.attackType == Weapon.AttackType.Combo;
            let doKnockback = isKnockbackable && attack.info.damage > 0 && (!doStagger);
            // Handle extra knockback stuff.
            if (doKnockback) {
                this.applyKnockback(victim);
            }
            // Handle stagger stuff.
            if (doStagger) {
                this.applyStagger(victim, attackEntity);
            }
            // return whether we knockback'd or stagger'd
            return [doKnockback, doStagger];
        }
        applyForces(victim, attackEntity, doKnockback, doStagger) {
            // pre-check: nothing to do
            if (!doKnockback && !doStagger) {
                return;
            }
            // pre-extraction
            let pos = victim.get(Component.Position);
            let otherComps = this.ecs.getComponents(attackEntity);
            let attack = otherComps.get(Component.Attack);
            let attackerComps = this.ecs.getComponents(attack.attacker);
            let angleVtoA = System.Util.angleAtoB(this.ecs, victim.entity, attack.attacker);
            // Must be able to send forces and compute angles.
            if ((!victim.has(Component.Input)) ||
                (attackerComps == null) ||
                (!attackerComps.has(Component.Position))) {
                return;
            }
            // scale magnitude based on whether attack was blocked.
            let scale = attack.info.damage > 0 ? 1.0 : CollisionDamage.BLOCK_FORCE_DAMPEN;
            let input = victim.get(Component.Input);
            let attackerPos = attackerComps.get(Component.Position);
            // get the force to use. by default we'll just use the
            // knockback force (i.e., also if the attack was
            // blocked), unless we saw a stagger was caused.
            let forceMag = doStagger ? attack.info.staggerForce : attack.info.knockbackForce;
            // Decide in what direction the force should be applied.
            let force = Physics.forceFromPoints(attackerPos.p, pos.p, forceMag * scale);
            input.forceQueue.push(force);
            // Decide how the victim should be angled.
            // Make victim face attacker
            pos.angle = angleVtoA;
        }
        applyBehaviors(victim, doKnockback, doStagger) {
            // pre-check: nothing to do
            if (!doKnockback && !doStagger) {
                return;
            }
            // pre-check: confusing state
            if (doKnockback && doStagger) {
                console.error('Tried to apply knockback AND stagger on same frame?');
                return;
            }
            // pull out attribute info
            if (!victim.has(Component.Attributes)) {
                console.error('Tried to apply knockback or stagger to entity but lacked Attributes Component (for timing).');
                return;
            }
            let attribs = victim.get(Component.Attributes);
            // figure out behavior, props, and duration to use.
            let details = hitBehaviorMap.get(attribs.data.hitSettings.hitBehavior);
            let props = doKnockback ? details.knockback : details.stagger;
            let duration = doKnockback ?
                attribs.data.hitSettings.knockbackBehaviorDuration :
                attribs.data.hitSettings.staggerDuration + attribs.data.hitSettings.staggerReturnDuration;
            // maybe damage flash
            if (props.flash) {
                System.Util.addOrExtend(this.ecs, victim.entity, Component.DamagedFlash, duration);
            }
            // maybe make immobile
            if (props.immobilize) {
                System.Util.addOrExtend(this.ecs, victim.entity, Component.Immobile, duration);
            }
            // maybe make invincible
            if (props.invincible) {
                System.Util.addOrExtend(this.ecs, victim.entity, Component.Invincible, duration);
            }
        }
        applyFx(victim, dealt) {
            // don't bleed if no damage dealt
            if (dealt <= 0) {
                return;
            }
            // get attributes
            if (!victim.has(Component.Attributes)) {
                return;
            }
            let attribs = victim.get(Component.Attributes);
            // bleed (if applicable)
            System.Bleeding.begin(this.ecs, victim.entity, attribs.data.hitBlood);
        }
        update(delta, entities, dirty) {
            for (let entity of dirty) {
                let aspect = entities.get(entity);
                // initial check for damage immunity
                if (this.isDamageImmune(aspect)) {
                    continue;
                }
                // cycle through everything that hit this object.
                let cShape = aspect.get(Component.CollisionShape);
                for (let otherEntity of cShape.collisionsFresh.keys()) {
                    // damage immunity status may change during this loop
                    if (this.isDamageImmune(aspect)) {
                        continue;
                    }
                    // attacks are frequently spawned and removed; ensure valid
                    if (!this.isValidAttack(otherEntity)) {
                        continue;
                    }
                    if (!this.canDamage(aspect, otherEntity)) {
                        continue;
                    }
                    // Apply damage (note: two attacks per frame can hit).
                    let dealt = this.applyDamage(aspect, otherEntity);
                    // NOTE: Legacy (exp) feature would go here: on the victim,
                    // add the attack.attacker to the list of thing that last
                    // hit it. Then the Death system can issue exp to those on
                    // the list the frame that it dies.
                    // Compute and apply knockback, stagger, or neither.
                    let [doKnockback, doStagger] = this.applyKnockbackStagger(aspect, otherEntity);
                    // Apply "hit" forces to this entity.
                    this.applyForces(aspect, otherEntity, doKnockback, doStagger);
                    // Apply behaviors (flash, invincible, immobile).
                    this.applyBehaviors(aspect, doKnockback, doStagger);
                    // Apply effects (blood).
                    this.applyFx(aspect, dealt);
                    // NOTE: consider (for arrows) removing attack one it hits
                    // something. (Alternatively, make stick around.)
                }
            }
        }
    }
    /**
     * How much blocks dampen the force applied by.
     *
     * If we decide to go this route, there are a few places we could put
     * this number instead to make it more configurable:
     *
     *	- make it part of weapons
     *	- make it part of shields
     *	- make it a game-level constant
     *
     * What we do will depend on how much we want to tweak this for
     * different enemies.
     *
     * Note: set to 1.0 to make blocks not dampen force at all. Set to 0.0
     * to make blocks completely remove attacks' force.
     */
    CollisionDamage.BLOCK_FORCE_DAMPEN = 0.5;
    System.CollisionDamage = CollisionDamage;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/collision-shape.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/input.ts" />
var System;
(function (System) {
    class CollisionMovement extends Engine.System {
        constructor() {
            super(...arguments);
            // Note that we only run collision resolution on entities with Input
            // Components because those without aren't going anywhere.
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.CollisionShape.name,
                Component.Input.name,
            ]);
        }
        leastCollidingAxis(p1, input, cInfo) {
            // turn the axis (a normal) into a vector pointing in the required direction.
            let v = new Point(cInfo.axis.x, cInfo.axis.y);
            // scale by the amount
            v.scale_(-cInfo.amount);
            // move
            p1.p = p1.p.add_(v);
            // new: trying input shit
            // TODO: can we check whether we're *inside* a box and push out if
            // so? right now this force keeps you stuck insdie a collision box
            // if you get pushed into one
            // input.collisionForce.copyFrom_(cInfo.axis).scale_(-20*cInfo.amount);
        }
        /**
         *
         * @param position
         * @param box
         * @returns whether it collided with a non-mobile solid objects
         */
        resolveCollisions(position, input, box) {
            let hitSolidStationary = false;
            for (let [colliderEntity, cInfo] of box.collisionsFresh.entries()) {
                let colliderComps = this.ecs.getComponents(colliderEntity);
                let colliderBox = colliderComps.get(Component.CollisionShape);
                if (!colliderBox.cTypes.has(CollisionType.Solid)) {
                    continue;
                }
                // old: AABB collision resolution
                // this.leastCollidingAABBAxis(position, box, colliderComps.get(Component.Position), colliderBox);
                // new: SAT collision resolution
                this.leastCollidingAxis(position, input, cInfo);
                if (!colliderBox.cTypes.has(CollisionType.Mobile)) {
                    hitSolidStationary = true;
                }
            }
            return hitSolidStationary;
        }
        update(delta, entities) {
            for (let aspect of entities.values()) {
                let position = aspect.get(Component.Position);
                let input = aspect.get(Component.Input);
                let cShape = aspect.get(Component.CollisionShape);
                // resolve collisions. NOTE: order here probably matters for
                // good behavior (i.e. who pushes who.)
                if (cShape.cTypes.has(CollisionType.Mobile) && cShape.cTypes.has(CollisionType.Solid) &&
                    cShape.collisionsFresh.size > 0) {
                    // resolve collisions itself
                    let hitSolidStationary = this.resolveCollisions(position, input, cShape);
                    // bounce if hit something solid+stationary and dead
                    if (hitSolidStationary &&
                        aspect.has(Component.Dead)) {
                        let input = aspect.get(Component.Input);
                        input.bounce = true;
                    }
                }
            }
        }
    }
    System.CollisionMovement = CollisionMovement;
})(System || (System = {}));
/// <reference path="../core/lang.ts" />
/// <reference path="../core/util.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/constants.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/collision-shape.ts" />
var System;
(function (System) {
    // Helper classes and functions that will be used by the collision detection
    // system.
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    /**
     * Manages a list of collision boxes (`implementers`) that all match some
     * criteria (`required`).
     */
    class CollisionSet {
        constructor(required) {
            this.required = required;
            this.implementers = new Set();
        }
    }
    /**
     * Collides left and right.
     */
    class Collider {
        constructor(ecs, debugName, left, right) {
            this.ecs = ecs;
            this.debugName = debugName;
            this.left = left;
            this.right = right;
            // Really only need one of these because single-threaded, but this is
            // simplest for now.
            this.sat = new Physics.SAT(4);
            this.cacheCol = new Physics.CollisionInfo();
            this.cacheC1 = new Point();
            this.cacheC2 = new Point();
            this.spatialHash = ecs.getSystem(System.SpatialHash);
        }
        getCandidates(l, p1, b1) {
            let res = new Set();
            for (let cell of p1.cells) {
                for (let r of this.spatialHash.grid.get(cell).values()) {
                    // no self collide and must be in correct set.
                    if (l != r && this.right.implementers.has(r)) {
                        res.add(r);
                    }
                }
            }
            return res;
        }
        /**
         * Appends to allColliders and returns [nCheap, nExpensive] collision
         * checks
         */
        update(allColliders) {
            let cheapCollisionChecks = 0;
            let expensiveCollisionChecks = 0;
            for (let l of this.left.implementers) {
                let c1 = this.ecs.getComponents(l);
                let p1 = c1.get(Component.Position);
                let s1 = c1.get(Component.CollisionShape);
                // Don't bother checking if left is disabled.
                if (s1.disabled) {
                    continue;
                }
                for (let r of this.getCandidates(l, p1, s1)) {
                    let c2 = this.ecs.getComponents(r);
                    let p2 = c2.get(Component.Position);
                    let s2 = c2.get(Component.CollisionShape);
                    // Don't bother checking if right is disabled.
                    if (s2.disabled) {
                        continue;
                    }
                    // Try cheaper collision method first.
                    cheapCollisionChecks++;
                    // cacheC1 and cacheC2 become the center points of each of
                    // the shapes.
                    this.cacheC1.copyFrom_(p1.p).add_(s1.offset);
                    this.cacheC2.copyFrom_(p2.p).add_(s2.offset);
                    // a   > b + c
                    // a^2 > (b + c)^2
                    // a^2 > b^2 + c^2 + 2bc
                    if (this.cacheC1.sqDistTo(this.cacheC2) > s1.sqMaxDistance + s2.sqMaxDistance + 2 * s1.maxDistance * s2.maxDistance) {
                        continue;
                    }
                    expensiveCollisionChecks++;
                    // Could pre-check if collision already resolved here, but
                    // it's probably actually cheaper to check collisions first
                    // because most things *won't* be colliding.
                    // SAT
                    let v1 = s1.getVertices(p1.p, p1.angle);
                    let a1 = s1.getAxes(p1.p, p1.angle);
                    let v2 = s2.getVertices(p2.p, p2.angle);
                    let a2 = s2.getAxes(p2.p, p2.angle);
                    if (!this.sat.collides(v1, a1, v2, a2, this.cacheCol)) {
                        continue;
                    }
                    // Don't add if collision already resolved by at least one
                    // of the entities.
                    if (s1.collisionsResolved.has(r) || s2.collisionsResolved.has(l)) {
                        continue;
                    }
                    // Collliiiiidddeeee.
                    s1.collisionsFresh.set(r, this.cacheCol.copy());
                    s2.collisionsFresh.set(l, this.cacheCol.copy().rev());
                    allColliders.push(s1, s2);
                }
            }
            return [cheapCollisionChecks, expensiveCollisionChecks];
        }
    }
    // Bookkeeping setup here
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    class CollisionDetection extends Engine.System {
        constructor(cheapPanel, expensivePanel) {
            super();
            this.cheapPanel = cheapPanel;
            this.expensivePanel = expensivePanel;
            this.prevColliders = [];
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.CollisionShape.name,
            ]);
            this.colliders = [];
        }
        init() {
            // NOTE: Even with cleanup, the below thing are redundant! The
            // player will be checked many times for hitting other stuff. Due
            // to the new spatial hashing, we now only care about the number of
            // "left-hand-side" things we check, but we'll spatially retrieve
            // everything on the right hand side and check all of it (at least
            // a boolean check). Due to this, we might want to consider some
            // scheme like:
            // - (1) check all mobile stuff against other things. To figure out
            //   whether a mobile thing can collide with another thing:
            // - (2) check a set of rules (akin to the subset matching below)
            //   (could also do "excludes")
            // - (3) once any rule passes (it could for multiple reasons), run
            //   the expensive collision checks
            //
            // as it stands, players and projectiles are going to spatially
            // grab stuff around them and iterate over the same set of things
            // SEVERAL TIMES.
            // running into things
            this.colliders.push(new Collider(this.ecs, 'mobile+solid / solid', new CollisionSet(new Set([CollisionType.Mobile, CollisionType.Solid])), new CollisionSet(new Set([CollisionType.Solid]))));
            // attacks that move (i.e., not bramble) hitting stuff (players, enemies, destructibles, ...)
            this.colliders.push(new Collider(this.ecs, 'mobile+attack / vulnerable', new CollisionSet(new Set([CollisionType.Mobile, CollisionType.Attack])), new CollisionSet(new Set([CollisionType.Vulnerable]))));
            // mobile things (e.g., player, enemies) running into attacks (e.g., bramble)
            this.colliders.push(new Collider(this.ecs, 'mobile+vulnerable / attack+environment', new CollisionSet(new Set([CollisionType.Mobile, CollisionType.Vulnerable])), new CollisionSet(new Set([CollisionType.Attack, CollisionType.Environment]))));
            // blocking (may need to refine if we need 'player' tag for this as
            // well)
            this.colliders.push(new Collider(this.ecs, 'shield / attack', new CollisionSet(new Set([CollisionType.Shield])), new CollisionSet(new Set([CollisionType.Attack]))));
            // player or enemies (may want destructables eventually?) going
            // into game logic areas
            this.colliders.push(new Collider(this.ecs, 'player / logic', new CollisionSet(new Set([CollisionType.Mobile, CollisionType.Solid])), new CollisionSet(new Set([CollisionType.Logic]))));
            // item pickups!
            this.colliders.push(new Collider(this.ecs, 'player / item', new CollisionSet(new Set([CollisionType.Player, CollisionType.Solid])), new CollisionSet(new Set([CollisionType.Item]))));
            // players or enemies going into physics regions
            this.colliders.push(new Collider(this.ecs, 'physics / mobile', new CollisionSet(new Set([CollisionType.Physics])), new CollisionSet(new Set([CollisionType.Mobile]))));
            // projectiles hitting stuff that stops them
            this.colliders.push(new Collider(this.ecs, 'projectile / wall', new CollisionSet(new Set([CollisionType.Projectile])), new CollisionSet(new Set([CollisionType.Wall]))));
        }
        onAdd(aspect) {
            let box = aspect.get(Component.CollisionShape);
            for (let collider of this.colliders) {
                for (let cSet of [collider.left, collider.right]) {
                    if (setContains(box.cTypes, cSet.required)) {
                        cSet.implementers.add(aspect.entity);
                    }
                }
            }
        }
        onRemove(aspect) {
            for (let collider of this.colliders) {
                for (let cSet of [collider.left, collider.right]) {
                    if (cSet.implementers.has(aspect.entity)) {
                        cSet.implementers.delete(aspect.entity);
                    }
                }
            }
        }
        update(delta, entities, dirty, clockTower) {
            // clear all "fresh" collisions
            while (this.prevColliders.length > 0) {
                this.prevColliders.pop().collisionsFresh.clear();
            }
            // Now use our own internal bookkeeping to run collision detection
            // between subsets as needed.
            let expensiveCollisionChecks = 0;
            let cheapCollisionChecks = 0;
            for (let collider of this.colliders) {
                clockTower.start(Measurement.T_COLL_COLLIDERS, collider.debugName);
                let [c, e] = collider.update(this.prevColliders);
                cheapCollisionChecks += c;
                expensiveCollisionChecks += e;
                clockTower.end(Measurement.T_COLL_COLLIDERS, collider.debugName);
            }
            // // re-enable when need to check stuff
            // if (this.cheapPanel !== null) {
            // 	this.cheapPanel.update(cheapCollisionChecks, 8000);
            // }
            // if (this.expensivePanel !== null) {
            // 	this.expensivePanel.update(expensiveCollisionChecks, 300);
            // }
        }
    }
    __decorate([
        override
    ], CollisionDetection.prototype, "init", null);
    __decorate([
        override
    ], CollisionDetection.prototype, "onAdd", null);
    __decorate([
        override
    ], CollisionDetection.prototype, "onRemove", null);
    System.CollisionDetection = CollisionDetection;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    /**
     * Dummy will never be added to any entities. It exists for systems which
     * run without entities.
     */
    class Dummy extends Engine.Component {
    }
    Component.Dummy = Dummy;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    class PlayerInput extends Engine.Component {
    }
    Component.PlayerInput = PlayerInput;
})(Component || (Component = {}));
/// <reference path="../core/lang.ts" />
/// <reference path="../core/base.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/dummy.ts" />
/// <reference path="../component/input.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/player-input.ts" />
var System;
(function (System) {
    // .........................................................................
    // Helper classes
    // .........................................................................
    /**
     * Options for a button that can be either pressed or held and released.
     */
    let GameButtonAction;
    (function (GameButtonAction) {
        GameButtonAction[GameButtonAction["Nothing"] = 0] = "Nothing";
        GameButtonAction[GameButtonAction["Press"] = 1] = "Press";
        GameButtonAction[GameButtonAction["HoldStart"] = 2] = "HoldStart";
        GameButtonAction[GameButtonAction["HoldRelease"] = 3] = "HoldRelease";
    })(GameButtonAction || (GameButtonAction = {}));
    /**
     * Helps determine state for a button (e.g. keyboard or mouse) that can be
     * either pressed or held and released.
     */
    class GameButton {
        constructor(
        /**
         * Cutoff for pressing (< this) and holding (> this) a button, in ms of
         * the duration held.
         */
        HOLD_THRESHOLD = 150) {
            this.HOLD_THRESHOLD = HOLD_THRESHOLD;
            this.action = GameButtonAction.Nothing;
            this.isDown = false;
            this.timeDown = 0;
        }
        determineAction(down, delta) {
            // wasn't down and now isn't: nothing happens
            if (!this.isDown && !down) {
                return GameButtonAction.Nothing;
            }
            // wasn't down and now is: start press
            if (!this.isDown && down) {
                this.isDown = true;
                this.timeDown = 0;
                // don't yet know what kind of press this is, so don't signal
                // any press happened (!)
                return GameButtonAction.Nothing;
            }
            // was down and now is: continue hold
            if (this.isDown && down) {
                this.timeDown += delta;
                // if this is when the hold threshold was crossed, signal start
                // of the hold.
                if (this.timeDown >= this.HOLD_THRESHOLD && this.timeDown - delta < this.HOLD_THRESHOLD) {
                    return GameButtonAction.HoldStart;
                }
            }
            // was down and now isn't: release! make decision about action.
            if (this.isDown && !down) {
                this.isDown = false;
                // use previous holding time (don't increment this.timeDown
                // before checking). in addition to being technically more
                // accurate (could have been released just after last update),
                // this way we know whether a HoldStart action was already
                // emitted (only if the previous this.timeDown was above the
                // threshold)
                if (this.timeDown < this.HOLD_THRESHOLD) {
                    return GameButtonAction.Press;
                }
                else {
                    return GameButtonAction.HoldRelease;
                }
            }
        }
        update(down, delta) {
            this.action = this.determineAction(down, delta);
        }
    }
    class AttackButton extends GameButton {
        constructor() {
            super(...arguments);
            this.quickAttacking = false;
            this.attacking = false;
        }
        update(down, delta) {
            super.update(down, delta);
            switch (this.action) {
                case GameButtonAction.Nothing:
                    this.quickAttacking = false;
                    this.attacking = false;
                    break;
                case GameButtonAction.Press:
                    this.quickAttacking = true;
                    this.attacking = false;
                    break;
                case GameButtonAction.HoldStart:
                    this.quickAttacking = false;
                    this.attacking = true;
                    break;
                case GameButtonAction.HoldRelease:
                    this.quickAttacking = false;
                    this.attacking = false;
                    break;
            }
        }
    }
    __decorate([
        override
    ], AttackButton.prototype, "update", null);
    // .........................................................................
    // Subsystems
    // .........................................................................
    function clampReal(raw) {
        let lim = 0.12;
        if ((raw > 0 && raw < lim) || (raw < 0 && raw > -lim)) {
            return 0;
        }
        return raw;
    }
    // function debugReportGamepad(gp: Gamepad): void {
    // 	console.log("Gamepad connected at index " + gp.index + ": " +
    // 		gp.id + ". It has " + gp.buttons.length + " buttons and " +
    // 		gp.axes.length + " axes.");
    // }
    class InputGamepad extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
            this.prevMenu = false;
            this.prevDebug = false;
            this.prevQuickAttack = false;
            this.prevSwitchWeapon = false;
            this.intentMove = new Point();
            this.intentFace = new Point();
            this.quickAttack = false;
            this.block = false;
            this.switchWeapon = false;
            this.idleFrames = 2;
            this.idleFor = 0;
            this.gamepadDetectionShown = false;
            /**
             * Idle is set if the gamepad has no inputs for idleFrames frames. When
             * this happens, the systems using the gamepad know they can ignore the
             * gamepad until a button is pressed again and read from the mouse and
             * keyboard. Without this, the gamepad would "zero-out" all of the
             * inputs and not let any mouse / keyboard.
             */
            this.idle = true;
            /**
             * Last time input read from gamepad. Used so that mousedoens't
             * overwrite facing state if mouse isn't being used.
             */
            this.lastActiveWallTimestamp = 0;
        }
        update(delta, entities) {
            // poll + sanity check
            let gps = navigator.getGamepads();
            if (gps == null || gps[0] == null) {
                this.idle = true;
                return;
            }
            let gp = gps[0];
            if (!gp.connected || gp.buttons.length < 18 || gp.axes.length < 4) {
                this.idle = true;
                return;
            }
            // show notification first time gamepad used
            if (!this.gamepadDetectionShown) {
                this.ecs.getSystem(System.GUIManager).runSequence('notification', new Map([['notification', 'gamepad detected']]));
                this.gamepadDetectionShown = true;
            }
            // input. L and R analog stick, with d-pad overwriting if used.
            this.intentMove.set_(clampReal(gp.axes[0]), clampReal(gp.axes[1]));
            this.intentFace.set_(clampReal(gp.axes[2]), -clampReal(gp.axes[3]));
            if (gp.buttons[12].pressed || gp.buttons[13].pressed ||
                gp.buttons[14].pressed || gp.buttons[15].pressed) {
                this.intentMove.set_(-gp.buttons[14].value + gp.buttons[15].value, gp.buttons[13].value - gp.buttons[12].value);
            }
            // if no explicit direction from right stick, use movement input.
            if (this.intentFace.isZero()) {
                this.intentFace.copyFrom_(this.intentMove);
                this.intentFace.y = -this.intentFace.y;
            }
            // buttons
            let curQuickAttack = gp.buttons[0].pressed || gp.buttons[1].pressed || gp.buttons[2].pressed || gp.buttons[5].pressed;
            this.quickAttack = !this.prevQuickAttack && curQuickAttack;
            this.prevQuickAttack = curQuickAttack;
            let curSwitchWeapon = gp.buttons[3].pressed;
            this.switchWeapon = !this.prevSwitchWeapon && curSwitchWeapon;
            this.prevSwitchWeapon = curSwitchWeapon;
            this.block = gp.buttons[4].pressed || gp.buttons[6].pressed || gp.buttons[7].pressed;
            // events
            let curMenu = gp.buttons[9].pressed || gp.buttons[17].pressed;
            if (!this.prevMenu && curMenu) {
                this.eventsManager.dispatch({
                    name: Events.EventTypes.MenuKeypress,
                    args: { key: 'ENTER' },
                });
            }
            this.prevMenu = curMenu;
            let curDebug = gp.buttons[8].pressed;
            if (!this.prevDebug && curDebug) {
                this.eventsManager.dispatch({
                    name: Events.EventTypes.DebugKeypress,
                    args: { key: 'BACKTICK' },
                });
            }
            this.prevDebug = curDebug;
            // idle computation
            if (this.intentMove.isZero() &&
                this.intentFace.isZero() &&
                !curQuickAttack &&
                !curSwitchWeapon &&
                !curMenu &&
                !curDebug) {
                // nothing pressed. max out at this.idleFrames so we don't just
                // keep counting.
                this.idleFor = Math.min(this.idleFor + 1, this.idleFrames);
            }
            else {
                // active!
                this.idleFor = 0;
                this.lastActiveWallTimestamp = this.ecs.walltime;
            }
            this.idle = this.idleFor >= this.idleFrames;
        }
    }
    System.InputGamepad = InputGamepad;
    /**
     * Kind of a weird system. Updated on its own so that it runs once per
     * frame. But then the results are used by one or more other systems rather
     * than updating components direction. More of a "subsystem."
     */
    class InputKeyboard extends Engine.System {
        constructor(keyboard) {
            super();
            this.keyboard = keyboard;
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
            // state exported for other systems' use
            this.intent = new Point();
            this.quickAttacking = false;
            this.attacking = false;
            this.blocking = false;
            this.switching = false;
            this.controls = false;
            // private attackButton = new AttackButton()
            this.prev_quickAttacking = false;
            this.prev_left = false;
            this.prev_right = false;
            this.prev_down = false;
            this.prev_up = false;
            this.prev_switching = false;
            this.prev_controls = false;
            this.prev_intent = new Point();
        }
        /**
         * Returns -1 if a wins, 1 if b wins, 0 if neither wins, and prev if we
         * should use what happened last frame.
         */
        static resolve_pair(prev_a, a, prev_b, b, prev) {
            // Easy cases: only one pressed.
            if (!a && !b) {
                return 0;
            }
            else if (a && !b) {
                return -1;
            }
            else if (!a && b) {
                return 1;
            }
            // Difficult cases: both are pressed.
            if (prev_a && !prev_b) {
                // b is new press; use b.
                return 1;
            }
            else if (!prev_a && prev_b) {
                // a is the new press; use a.
                return -1;
            }
            else if (!prev_a && !prev_b) {
                // frame-perfect double-press. pick b arbitrarily.
                return 1;
            }
            else {
                // both pressed previously, both pressed now. can't do anything
                // but keep doing what we were doing.
                return prev;
            }
        }
        update(delta, entities) {
            // raw input reads
            let switching = this.keyboard.gamekeys.get(GameKey.E).isDown;
            let controls = this.keyboard.gamekeys.get(GameKey.Enter).isDown;
            let left = this.keyboard.gamekeys.get(GameKey.A).isDown;
            let right = this.keyboard.gamekeys.get(GameKey.D).isDown;
            let up = this.keyboard.gamekeys.get(GameKey.W).isDown;
            let down = this.keyboard.gamekeys.get(GameKey.S).isDown;
            let quickAttacking = this.keyboard.gamekeys.get(GameKey.Space).isDown;
            this.blocking = this.keyboard.gamekeys.get(GameKey.ShiftLeft).isDown;
            // resolve input pairs
            this.intent.x = InputKeyboard.resolve_pair(this.prev_left, left, this.prev_right, right, this.prev_intent.x);
            this.intent.y = InputKeyboard.resolve_pair(this.prev_up, up, this.prev_down, down, this.prev_intent.y);
            // metered pressing
            this.controls = controls && !this.prev_controls;
            this.switching = switching && !this.prev_switching;
            // old: using the "button" mechanic for holding down of various
            // lengths timing. this caused too much lag for the quick press
            // actions, so canning it.
            // this.attackButton.update(this.keyboard.keys.get(GameKey.Space).isDown, delta);
            // this.attacking = this.attackButton.attacking;
            // this.stabbing = this.attackButton.stabbing;
            // quick attack just when pressed (w/ rate limiting)
            this.quickAttacking = quickAttacking && !this.prev_quickAttacking;
            // tmp: no 'swing' attacking (will do some power or retaliation
            // attack eventually; maybe just the same as stabbing in that
            // case?)
            this.attacking = false;
            // bookkeeping
            this.intent.copyTo(this.prev_intent);
            this.prev_quickAttacking = quickAttacking;
            this.prev_left = left;
            this.prev_right = right;
            this.prev_up = up;
            this.prev_down = down;
            this.prev_controls = controls;
            this.prev_switching = switching;
        }
    }
    System.InputKeyboard = InputKeyboard;
    /**
     * Sets mutate to the value of from.
     * @param mutate
     * @param from
     */
    function setFromPIXI(mutate, from) {
        mutate.set_(from.x, from.y);
    }
    /**
     * Another 'subsystem' that updates independently.
     */
    class InputMouse extends Engine.System {
        constructor(mouse, hud, world) {
            super(false, true);
            this.mouse = mouse;
            this.hud = hud;
            this.world = world;
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
            // Properties exposed to other systems.
            this.worldPosition = new Point();
            this.quickAttacking = false;
            this.blocking = false;
            // for metering and setting timestamp
            this.prevQuickAttacking = false;
            this.prevBlocking = false;
            this.curHUDPosition = new Point();
            this.prevHUDPosition = new Point();
            this.lastActiveWallTimestamp = 0;
            /**
             * Used internally to let PIXI do the translation.
             */
            this.cacheWorldPosition = new PIXI.Point();
        }
        update(delta, entities) {
            // transform and set position
            this.world.toLocal(this.mouse.hudPosition, this.hud, this.cacheWorldPosition, true);
            this.worldPosition.set_(this.cacheWorldPosition.x, this.cacheWorldPosition.y);
            // button inputs
            let curQuickAttacking = this.mouse.leftDown;
            this.quickAttacking = curQuickAttacking && (!this.prevQuickAttacking);
            this.blocking = this.mouse.rightDown;
            // active computation
            setFromPIXI(this.curHUDPosition, this.mouse.hudPosition);
            if (curQuickAttacking != this.prevQuickAttacking ||
                this.blocking != this.prevBlocking ||
                !this.curHUDPosition.equals(this.prevHUDPosition)) {
                this.lastActiveWallTimestamp = this.ecs.walltime;
            }
            // update cached state
            this.prevHUDPosition.copyFrom_(this.curHUDPosition);
            this.prevQuickAttacking = curQuickAttacking;
            this.prevBlocking = this.blocking;
        }
    }
    System.InputMouse = InputMouse;
    // .........................................................................
    // Systems
    // .........................................................................
    /**
     *
     * @param from base position
     * @param over list of entities to check over --- each must have
     * Component.Position!
     * @param within maximum distance (from `from`) for which a non-null entity
     * is returned
     * @param skipDead whether to skip entities that have Component.Dead
     */
    function getClosest(ecs, from, over, within, skipDead) {
        // keep track of smallest distance and pick closest entity.
        let closest = null;
        let closestDist = Infinity;
        for (let entity of over) {
            let comps = ecs.getComponents(entity);
            if (skipDead && comps.has(Component.Dead)) {
                continue;
            }
            let entityPos = comps.get(Component.Position);
            let dist = from.distTo(entityPos.p);
            if (dist < closestDist) {
                closestDist = dist;
                closest = entity;
            }
        }
        return closestDist < within ? closest : null;
    }
    /**
     * When debug is on, can use this to pick entities for inspection.
     */
    class DebugEntitySelector extends Engine.System {
        constructor(inputMouse) {
            super(true, true);
            this.inputMouse = inputMouse;
            this.componentsRequired = new Set([
                Component.Position.name,
            ]);
        }
        update(delta, entities) {
            // get closest thing
            let mouseWorld = this.inputMouse.worldPosition;
            let spatialHash = this.ecs.getSystem(System.SpatialHash);
            let cell = System.getPointCell(mouseWorld);
            let ents = spatialHash.grid.get(cell);
            if (ents == null) {
                return;
            }
            let closestEntity = getClosest(this.ecs, mouseWorld, ents.values(), DebugEntitySelector.MAX_ENTITY_DIST, false);
            if (closestEntity == null) {
                return;
            }
            // mark as debug inspection w/ current timestamp
            let comps = this.ecs.getComponents(closestEntity);
            if (comps.has(Component.DebugInspection)) {
                (comps.get(Component.DebugInspection))
                    .pickTime = this.ecs.walltime;
            }
            else {
                this.ecs.addComponent(closestEntity, new Component.DebugInspection(this.ecs.walltime));
            }
        }
    }
    DebugEntitySelector.MAX_ENTITY_DIST = 200;
    System.DebugEntitySelector = DebugEntitySelector;
    class PlayerInputGamepad extends Engine.System {
        constructor(inputGamepad) {
            super();
            this.inputGamepad = inputGamepad;
            this.componentsRequired = new Set([
                Component.Input.name,
                Component.Position.name,
                Component.PlayerInput.name,
            ]);
        }
        update(delta, entities) {
            // if gamepad is idle, don't overwrite keyboard/mouse input state.
            if (this.inputGamepad.idle) {
                return;
            }
            for (let aspect of entities.values()) {
                let input = aspect.get(Component.Input);
                // movement
                input.intent.copyFrom_(this.inputGamepad.intentMove);
                // facing. only mutate target angle if there's some intent
                // pressed.
                if (!this.inputGamepad.intentMove.isZero() || !this.inputGamepad.intentFace.isZero()) {
                    input.targetAngle = Math.atan2(this.inputGamepad.intentFace.y, this.inputGamepad.intentFace.x);
                    // 0 -> 2pi for movement system
                    if (input.targetAngle <= 0) {
                        input.targetAngle += Constants.TWO_PI;
                    }
                }
                input.quickAttack = this.inputGamepad.quickAttack;
                input.block = this.inputGamepad.block;
                input.switchWeapon = this.inputGamepad.switchWeapon;
            }
        }
    }
    System.PlayerInputGamepad = PlayerInputGamepad;
    /**
     * Default game movement class.
     */
    class PlayerInputMouseKeyboard extends Engine.System {
        constructor(inputMouse, inputKeyboard, inputGamepad, enemySelector) {
            // note: consider starting disabled (!) until we fade-in the level
            super(true);
            this.inputMouse = inputMouse;
            this.inputKeyboard = inputKeyboard;
            this.inputGamepad = inputGamepad;
            this.enemySelector = enemySelector;
            // instance
            this.componentsRequired = new Set([
                Component.Input.name,
                Component.PlayerInput.name,
            ]);
        }
        update(delta, entities) {
            // set all input aspects (probably only 1) with the mouse angle and
            // the values computed by the input keyboard.
            for (let aspect of entities.values()) {
                let mouseWorld = this.inputMouse.worldPosition;
                let input = aspect.get(Component.Input);
                let position = aspect.get(Component.Position);
                // lockon: retrieve world position and modify if within some
                // delta of an enemy.
                let closestEnemy = getClosest(this.ecs, mouseWorld, this.enemySelector.latest(), PlayerInputMouseKeyboard.MAX_LOCKON_DIST, true);
                if (closestEnemy != null) {
                    let enemyComps = this.ecs.getComponents(closestEnemy);
                    let enemyPos = enemyComps.get(Component.Position);
                    mouseWorld.copyFrom_(enemyPos.p);
                    // set component so lockon system can render graphic
                    if (!enemyComps.has(Component.LockOn)) {
                        this.ecs.addComponent(closestEnemy, new Component.LockOn());
                    }
                    else {
                        (enemyComps.get(Component.LockOn)).fresh = true;
                    }
                }
                // Compute mouse angle only if (manhattan) distance above some
                // threshold. This is to avoid the entity freaking out when near
                // the mouse point.
                const thresh = PlayerInputMouseKeyboard.MIN_ANG_DIST;
                if (position.p.manhattanTo(mouseWorld) > thresh) {
                    // compute mouse angle. use only if mouse more active than
                    // gamepad.
                    if (this.inputMouse.lastActiveWallTimestamp > this.inputGamepad.lastActiveWallTimestamp) {
                        input.targetAngle = position.p.pixiAngleTo(mouseWorld);
                    }
                    // Usual movement. Y intent used; X intent ignored in Movement
                    // system.
                    this.inputKeyboard.intent.copyTo(input.intent);
                }
                else {
                    // Too close. Don't move (and not X intent now either,
                    // though currently unused anywhere).
                    input.intent.set_(0, 0);
                }
                input.quickAttack = this.inputKeyboard.quickAttacking || this.inputMouse.quickAttacking;
                input.block = this.inputKeyboard.blocking || this.inputMouse.blocking;
                input.switchWeapon = this.inputKeyboard.switching;
                input.controls = this.inputKeyboard.controls;
            }
        }
    }
    // static
    PlayerInputMouseKeyboard.MIN_ANG_DIST = 5;
    PlayerInputMouseKeyboard.MAX_LOCKON_DIST = 100;
    System.PlayerInputMouseKeyboard = PlayerInputMouseKeyboard;
    class PlayerInputWSAD extends Engine.System {
        constructor(inputKeyboard) {
            super();
            this.inputKeyboard = inputKeyboard;
            this.componentsRequired = new Set([
                Component.Input.name,
                Component.PlayerInput.name,
            ]);
        }
        update(delta, entities) {
            // set all input aspects (probably only 1) with the values computed
            // by the input keyboard.
            for (let aspect of entities.values()) {
                let input = aspect.get(Component.Input);
                this.inputKeyboard.intent.copyTo(input.intent);
                input.attack = this.inputKeyboard.attacking;
                input.block = this.inputKeyboard.blocking;
                input.switchWeapon = this.inputKeyboard.switching;
                input.controls = this.inputKeyboard.controls;
            }
        }
    }
    System.PlayerInputWSAD = PlayerInputWSAD;
})(System || (System = {}));
/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/dummy.ts" />
/// <reference path="../system/player-input.ts" />
var System;
(function (System) {
    class CrosshairRenderer extends Engine.System {
        constructor(inputMouse, stage) {
            super();
            this.inputMouse = inputMouse;
            this.stage = stage;
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
            this.dobj = null;
        }
        onDisabled(entities) {
            if (this.dobj != null) {
                this.stage.remove(this.dobj);
                this.dobj = null;
            }
        }
        ensureDobj() {
            if (this.dobj != null) {
                return;
            }
            // settings
            let color = 0x000000;
            let opacity = 0.7;
            let length = 30;
            let width = 6;
            // create
            let g = new PIXI.Graphics();
            g.beginFill(color, opacity);
            g.drawRect(-length / 2, -width / 2, length, width);
            g.drawRect(-width / 2, -length / 2, width, length);
            g.endFill();
            let s = new Stage.Sprite(g.generateCanvasTexture(), ZLevelWorld.DEBUG, StageTarget.World);
            s.anchor.set(0.5, 0.5);
            this.dobj = s;
            this.stage.add(s);
        }
        update(delta, entities) {
            this.ensureDobj();
            this.dobj.position.set(this.inputMouse.worldPosition.x, this.inputMouse.worldPosition.y);
        }
    }
    __decorate([
        override
    ], CrosshairRenderer.prototype, "onDisabled", null);
    System.CrosshairRenderer = CrosshairRenderer;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../core/keyboard.ts" />
/// <reference path="../component/dummy.ts" />
var System;
(function (System) {
    class Debug extends Engine.System {
        constructor(keyboard) {
            super(false, true);
            this.keyboard = keyboard;
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
            this.prevToggle = false;
            this.systemsToToggle = [
                System.DebugCamera.name,
                // System.DebugPositionRenderer.name,
                System.DebugCollisionRenderer.name,
                // System.DebugMouseRenderer.name,
                // System.DebugComponentRenderer.name,
                System.DebugEntitySelector.name,
                System.DebugInspectionRenderer.name,
                System.DebugTimingRenderer.name,
            ];
            this.keyboard.register(new GameKey(GameKey.Tilde));
        }
        toggle() {
            for (let sysName of this.systemsToToggle) {
                this.ecs.toggleSystemByName(sysName);
            }
        }
        update(delta, entities) {
            let curToggle = this.keyboard.gamekeys.get(GameKey.Tilde).isDown;
            if (!this.prevToggle && curToggle) {
                this.toggle();
            }
            this.prevToggle = curToggle;
        }
    }
    System.Debug = Debug;
})(System || (System = {}));
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
var System;
(function (System) {
    class DefendAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            /**
             * How long it's been in the current state.
             */
            this.elapsed = 0;
            this.startedBlock = false;
            this.ongoingBlock = undefined;
            this._state = Shield.BlockState.Idle;
        }
        /**
         * What state it is in.
         */
        get state() {
            return this._state;
        }
        set state(next) {
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
    class Defend extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.Input.name,
                Component.Shielded.name,
            ]);
        }
        makeAspect() {
            return new DefendAspect();
        }
        startBlock(blocker, refpos, shield) {
            // TODO: consider using object pool(s) for blocks.
            // create new block
            let block = this.ecs.addEntity();
            this.ecs.addComponent(block, new Component.Position(new Point(refpos.p.x, refpos.p.y), refpos.angle));
            let blockComponent = new Component.Block(blocker, -1, shield);
            this.ecs.addComponent(block, blockComponent);
            this.ecs.addComponent(block, Component.CollisionShape.buildRectangle(shield.block.cboxDims.copy(), new Set([CollisionType.Mobile, CollisionType.Shield])));
            this.ecs.addComponent(block, new Component.Tracker(blocker, shield.block.cboxOffset.copy(), true));
            // TODO: dispatch block event?
            // track block component so we can destroy it later
            return blockComponent;
        }
        updateState(delta, aspect) {
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
        update(delta, entities) {
            for (let aspect of entities.values()) {
                this.updateState(delta, aspect);
            }
        }
    }
    __decorate([
        override
    ], Defend.prototype, "makeAspect", null);
    System.Defend = Defend;
})(System || (System = {}));
/// <reference path="../core/lang.ts" />
/// <reference path="../core/base.ts" />
/// <reference path="../core/keyboard.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/stage.ts" />
/// <reference path="../system/player-input.ts" />
var System;
(function (System) {
    class DebugCamera extends Engine.System {
        constructor(keyboard, stage, disabled) {
            super(disabled, true);
            this.keyboard = keyboard;
            this.stage = stage;
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
            this.prev_in = false;
            this.prev_out = false;
            this.prev_left = false;
            this.prev_right = false;
            this.prev_down = false;
            this.prev_up = false;
            this.prev_intent = new Point();
            this.intent = new Point();
            this.prev_zoom = 0;
        }
        update(delta, entities) {
            // first figure out the player's intent
            let left = this.keyboard.gamekeys.get(GameKey.Left).isDown;
            let right = this.keyboard.gamekeys.get(GameKey.Right).isDown;
            let up = this.keyboard.gamekeys.get(GameKey.Up).isDown;
            let down = this.keyboard.gamekeys.get(GameKey.Down).isDown;
            let zoomin = this.keyboard.gamekeys.get(GameKey.Equal).isDown;
            let zoomout = this.keyboard.gamekeys.get(GameKey.Minus).isDown;
            this.intent.x = System.InputKeyboard.resolve_pair(this.prev_left, left, this.prev_right, right, this.prev_intent.x);
            this.intent.y = System.InputKeyboard.resolve_pair(this.prev_up, up, this.prev_down, down, this.prev_intent.y);
            let zoom = System.InputKeyboard.resolve_pair(this.prev_out, zoomout, this.prev_in, zoomin, this.prev_zoom);
            // bookkeeping
            this.intent.copyTo(this.prev_intent);
            this.prev_zoom = zoom;
            this.prev_left = left;
            this.prev_right = right;
            this.prev_up = up;
            this.prev_down = down;
            this.prev_in = zoomin;
            this.prev_out = zoomout;
            // act on stage
            this.stage.x -= 5 * this.intent.x;
            this.stage.y -= 5 * this.intent.y;
            let scale = this.stage.scale.x + 0.01 * zoom;
            this.stage.scale.set(scale, scale);
            // stage loc
            // console.debug('stage at:' + this.stage.x + ', ' + this.stage.y +
            //	'; scale: (' + this.stage.scale.x + ', ' + this.stage.scale.y + ')');
        }
    }
    System.DebugCamera = DebugCamera;
})(System || (System = {}));
// Generic functions for working with polygons.
var Physics;
(function (Physics) {
    let Shape;
    (function (Shape) {
        Shape[Shape["Rectangle"] = 0] = "Rectangle";
        Shape[Shape["Polygon"] = 1] = "Polygon";
    })(Shape = Physics.Shape || (Physics.Shape = {}));
    /**
     * Gets the vertices for a rectangle of `dims` dimensions, rotated at
     * `angle`, and at position `offset` from origin. Stores vertices in `out`.
     *
     * @param dims Dimensions of the rectangle
     * @param angle Angle the rectangle is rotated to
     * @param out Array to save the vertices in
     * @param offset (optional) Added to all points, e.g., position
     */
    function rectVertices(dims, angle, out, offset = new Point()) {
        // p2
        // +--------+--------+ p3
        // |		| center |
        // +--------o--------+	<-- midline
        // |		|		 |
        // +--------+--------+ p4
        // p1
        // compute center. current graphics (x, y) are pos + offset in
        // global space, so that's 0,0 in local space.
        // let center_x = dims.x/2;
        // let center_y = -dims.y/2;
        let center_x = 0;
        let center_y = 0;
        // compute angle between midline and corner (say, p3). this is also
        // constant (wrt box dims) so could cache if we want.
        let midToCorner = Math.atan2(dims.y / 2, dims.x / 2);
        // compute diagonal between center and any point (say, p3). this is
        // constant (wrt box dims) so could cache if we want. (note that
        // sin(angle) can be 0, so use cos if its. better way to do this w/o
        // conditionals?)
        let diag;
        let sinMidCorner = Math.sin(midToCorner);
        if (sinMidCorner == 0) {
            diag = (dims.x / 2) / Math.cos(midToCorner);
        }
        else {
            diag = (dims.y / 2) / Math.sin(midToCorner);
        }
        // compute the angle between x axis and p3.
        let beta_3 = angle + midToCorner;
        // compute x and y distances from center to p3.
        let dx_3 = diag * Math.cos(beta_3);
        let dy_3 = diag * Math.sin(beta_3);
        // now p4
        let beta_4 = angle - midToCorner;
        let dx_4 = diag * Math.cos(beta_4);
        let dy_4 = diag * Math.sin(beta_4);
        // p1 and p2 are swapped distances as p3 and p4,
        // respectively.
        // p1--p4
        out[0].set_(offset.x + center_x - dx_3, offset.y + center_y + dy_3);
        out[1].set_(offset.x + center_x - dx_4, offset.y + center_y + dy_4);
        out[2].set_(offset.x + center_x + dx_3, offset.y + center_y - dy_3);
        out[3].set_(offset.x + center_x + dx_4, offset.y + center_y - dy_4);
    }
    Physics.rectVertices = rectVertices;
    /**
     * Given the vertices of a polygon, computes the edges and returns them
     * through `out`.
     *
     * @param vertices Input: the vertices of a n-sided polygon (length n)
     * @param out Output: the edges of that n-sided polygon (length n or limit)
     * @param limit (optional) limits only provided this many out points
     */
    function getEdges(vertices, out, limit = null) {
        // as many sides as points
        let n = limit || vertices.length;
        if (out.length != n) {
            throw new Error('Must provide ' + n + ' edges for output.');
        }
        // each side uses two points
        // we just wrap
        for (let i = 0; i < n; i++) {
            let p1 = vertices[i];
            let p2 = vertices[(i + 1) % vertices.length];
            let edge = out[i];
            p2.sub(p1, edge);
            let mag = Math.sqrt(edge.x * edge.x + edge.y * edge.y);
            edge.x /= mag;
            edge.y /= mag;
        }
    }
    Physics.getEdges = getEdges;
    /**
     * Given a set of vectors, returns their normals through `out`.
     *
     * @param vectors Input: the vectors (length n)
     * @param out Output: the normals of the provided vectors (length n)
     */
    function getNormals(vectors, out) {
        // as many normals as vectors
        let n = vectors.length;
        if (out.length != n) {
            throw new Error('Must provide as many normals as vectors.');
        }
        for (let i = 0; i < n; i++) {
            let v = vectors[i];
            let n = out[i];
            n.x = -v.y;
            n.y = v.x;
        }
    }
    Physics.getNormals = getNormals;
})(Physics || (Physics = {}));
/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="../core/lang.ts" />
/// <reference path="../core/polygon.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/stage.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/collision-shape.ts" />
/**
 * Flattens an array of points into a single [x1, y1, x2, y2, ...] array.
 */
function flattenPoints(input) {
    let res = new Array(input.length * 2);
    for (let i = 0; i < input.length; i++) {
        res[i * 2] = input[i].x;
        res[i * 2 + 1] = input[i].y;
    }
    return res;
}
var System;
(function (System) {
    class DebugCollisionAspect extends Engine.Aspect {
    }
    class DebugCollisionRenderer extends Engine.System {
        constructor(stage, disabled) {
            super(disabled, true);
            this.stage = stage;
            this.cacheVertices = new Array(4);
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.CollisionShape.name,
            ]);
            this.dirtyComponents = new Set([
                Component.Position.name,
                Component.CollisionShape.name,
            ]);
        }
        makeAspect() {
            return new DebugCollisionAspect();
        }
        /**
         * Rectangle-only version that enjoys texture reuse.
         */
        stretchParticle(box) {
            let dobj = Stage.Sprite.build('particles/particle1.png', ZLevelWorld.DEBUG, StageTarget.World, new Point(0, 0), // legit position simply set on update
            new Point(0.5, 0.5));
            dobj.width = box.rectDims.x;
            dobj.height = box.rectDims.y;
            return dobj;
        }
        /**
         * Arbitrary polygon version, but makes new texture per object.
         */
        fromGraphics(box) {
            // OMG thought: can we just compute vertices once, then reposition
            // + rotate whenever object moves?
            // get vertices w/ (0,0) as coordinate (local)
            let vertices = flattenPoints(box.localVertices);
            // draw
            let g = new PIXI.Graphics();
            g.beginFill(0xffffff, 1.0);
            g.drawPolygon(vertices);
            g.endFill();
            let s = new Stage.Sprite(g.generateCanvasTexture(), ZLevelWorld.DEBUG, StageTarget.World);
            s.anchor.set(0.5, 0.5);
            return s;
        }
        makeDisplayObj(box) {
            // faster (i think), but only works for rectangles.
            if (box.shape === Physics.Shape.Rectangle) {
                return this.stretchParticle(box);
            }
            // for other polygons, draw as graphics and save to texture.
            return this.fromGraphics(box);
        }
        onAdd(aspect) {
            // get components
            let position = aspect.get(Component.Position);
            let box = aspect.get(Component.CollisionShape);
            // create resources. save to aspect.
            aspect.textureBox = this.makeDisplayObj(box);
            aspect.textureBox.alpha = 0.5;
            aspect.textureBox.visible = !this.disabled;
            // do first update so everything shows up initially
            this.updateDisplayObj(aspect.textureBox, position.p, box, position.angle);
            // add to stage
            this.stage.add(aspect.textureBox);
        }
        onRemove(aspect) {
            this.stage.remove(aspect.textureBox);
        }
        onDisabled(entities) {
            for (let aspect of entities.values()) {
                aspect.textureBox.visible = false;
            }
        }
        onEnabled(entities) {
            for (let aspect of entities.values()) {
                aspect.textureBox.visible = true;
            }
        }
        getDebugColor(box) {
            // color determined by colliding status.
            let color = 0x0000ff; // default: blue
            if (box.collisionsResolved.size > 0) {
                // green if only resolved collisions exist
                color = 0x00ff00;
            }
            if (box.collisionsFresh.size > 0) {
                // red if any fresh collisions exist
                color = 0xff0000;
            }
            if (box.disabled) {
                // grey if disabled
                color = 0x333333;
            }
            return color;
        }
        updateDisplayObj(dobj, pos, box, angle) {
            dobj.position.x = pos.x + box.offset.x;
            dobj.position.y = pos.y + box.offset.y;
            dobj.rotation = angleFlip(angle);
            dobj.tint = this.getDebugColor(box);
        }
        update(delta, entities, dirty) {
            for (let entity of dirty) {
                let aspect = entities.get(entity);
                let position = aspect.get(Component.Position);
                let box = aspect.get(Component.CollisionShape);
                // update internal position / rotation / color
                this.updateDisplayObj(aspect.textureBox, position.p, box, position.angle);
            }
        }
    }
    __decorate([
        override
    ], DebugCollisionRenderer.prototype, "makeAspect", null);
    __decorate([
        override
    ], DebugCollisionRenderer.prototype, "onAdd", null);
    __decorate([
        override
    ], DebugCollisionRenderer.prototype, "onRemove", null);
    __decorate([
        override
    ], DebugCollisionRenderer.prototype, "onDisabled", null);
    __decorate([
        override
    ], DebugCollisionRenderer.prototype, "onEnabled", null);
    System.DebugCollisionRenderer = DebugCollisionRenderer;
})(System || (System = {}));
var Measurement;
(function (Measurement) {
    Measurement.T_OVERALL = 'Overall';
    Measurement.T_SYSTEMS = 'Systems';
    Measurement.T_COLL_COLLIDERS = 'Coll/Colliders';
    Measurement.T_ALL = [
        Measurement.T_OVERALL,
        Measurement.T_SYSTEMS,
        Measurement.T_COLL_COLLIDERS,
    ];
    /**
     * A clock that only reports averages.
     *
     * Use start() and end() to time stuff several times. Then report() gets the
     * average and resets everything.
     */
    class AverageClock {
        constructor() {
            this.startTime = -1;
            this.elapsedSum = 0;
            this.elapsedNum = 0;
        }
        start() {
            // Cool hack from stats.js to prefer performance and fall back to
            // Date. Haven't looked into why but what the hell seems good.
            this.startTime = (performance || Date).now();
        }
        end() {
            this.elapsedSum += (performance || Date).now() - this.startTime;
            this.elapsedNum++;
        }
        /**
         * Manually add an entry (for when measuring in tight loop).
         * @param sum total time
         * @param num number of times it happened
         */
        manualAdd(sum, num) {
            this.elapsedSum += sum;
            this.elapsedNum += num;
        }
        /**
         * Returns average to 4 decimal places.
         */
        report() {
            let avg = this.elapsedSum / this.elapsedNum;
            this.elapsedSum = 0;
            this.elapsedNum = 0;
            return round(avg, 4);
        }
    }
    /**
     * A set of clocks that add to some kind of 100%.
     *
     * Use start(...) and end(...) to time stuff. Then report() gets all the
     * averages and resets everything.
     */
    class ClockGroup {
        constructor() {
            this.clocks = new Map();
        }
        start(clockName) {
            if (!this.clocks.has(clockName)) {
                this.clocks.set(clockName, new AverageClock());
            }
            this.clocks.get(clockName).start();
        }
        end(clockName) {
            this.clocks.get(clockName).end();
        }
        manualAdd(clockName, sum, num) {
            if (!this.clocks.has(clockName)) {
                this.clocks.set(clockName, new AverageClock());
            }
            this.clocks.get(clockName).manualAdd(sum, num);
        }
        report() {
            let res = [];
            for (let [clockName, clock] of this.clocks.entries()) {
                res.push({
                    name: clockName,
                    time: clock.report(),
                });
            }
            res.sort((a, b) => { return b.time - a.time; }); // biggest first
            return res;
        }
    }
    /**
     * For when we don't actually want any measurement.
     */
    class FakeClockTower {
        init() { }
        start(clockGroup, component) { }
        end(clockGroup, component) { }
        manualAdd(clockGroup, component, sum, num) { }
        report() { return new Map(); }
    }
    Measurement.FakeClockTower = FakeClockTower;
    /**
     * The collection of all clock groups.
     *
     * Use start(...) and end(...) to time stuff.
     *
     * Handles interface with game (tracking time to decide when to report) and
     * reporting (generating reports and updating graphs).
     */
    class ClockCentral {
        constructor() {
            this.clockGroups = new Map();
        }
        init() {
            for (let val of Measurement.T_ALL) {
                this.clockGroups.set(val, new ClockGroup());
            }
        }
        start(clockGroup, component) {
            this.clockGroups.get(clockGroup).start(component);
        }
        end(clockGroup, component) {
            this.clockGroups.get(clockGroup).end(component);
        }
        manualAdd(clockGroup, component, sum, num) {
            this.clockGroups.get(clockGroup).manualAdd(component, sum, num);
        }
        report() {
            let m = new Map();
            for (let [name, group] of this.clockGroups.entries()) {
                m.set(name, group.report());
            }
            return m;
        }
    }
    Measurement.ClockCentral = ClockCentral;
})(Measurement || (Measurement = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    class LockOn extends Engine.Component {
        constructor(fresh = true) {
            super();
            this.fresh = fresh;
        }
    }
    Component.LockOn = LockOn;
})(Component || (Component = {}));
/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../engine/measurement.ts" />
/// <reference path="../graphics/stage.ts" />
/// <reference path="../component/lockon.ts" />
function sumTimes(total, val) {
    return total + val.time;
}
var System;
(function (System) {
    /**
     * Renders timing breakdown of various game stuff.
     */
    class DebugTimingRenderer extends Engine.System {
        constructor(stage, clocks, viewportSize, display = 15) {
            super(true, true);
            this.stage = stage;
            this.clocks = clocks;
            this.viewportSize = viewportSize;
            this.display = display;
            // settings
            this.redrawEveryFrames = 120;
            this.width = 150;
            this.height = 15;
            this.spacing = 3;
            this.buffer = 5;
            // state
            this.sinceLastRedraw = this.redrawEveryFrames; // immediate at start
            this.sectionViews = new Map();
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
        }
        ensureSectionView(section) {
            // build if needed
            if (!this.sectionViews.has(section)) {
                let header = new PIXI.Text(section, {
                    fontFamily: 'Josefin Sans',
                    fill: '#ffffff',
                    fontSize: this.height,
                });
                header.alpha = 0.9;
                header.anchor.set(1, 0);
                header.position.set(this.viewportSize.x - this.buffer, 0);
                // add + track
                let cont = new Stage.Container(ZLevelHUD.DEBUG, StageTarget.HUD);
                cont.addChild(header);
                this.stage.add(cont);
                this.sectionViews.set(section, {
                    cont: cont,
                    header: header,
                    records: new Map(),
                });
            }
            // get
            return this.sectionViews.get(section);
        }
        ensureRecordView(sectionView, recordName) {
            // create if needed
            if (!sectionView.records.has(recordName)) {
                // color stays same for recordName
                let tintStr = '#ffffff';
                let tintNum = parseInt(tintStr.slice(1), 16);
                // create the bar
                let bar = Stage.buildPIXISprite('particles/particle1.png', new Point(0, 0), // legit position simply set on update
                new Point(1, 0));
                bar.width = 1; // tmp
                bar.height = this.height;
                bar.alpha = 0.9;
                bar.tint = tintNum;
                // create left text
                let txt = new PIXI.Text(recordName, {
                    fontFamily: 'Josefin Sans',
                    fill: tintStr,
                    fontSize: this.height,
                });
                txt.alpha = 0.9;
                txt.anchor.set(1, 0);
                // add + track
                let cont = new Stage.Container(ZLevelHUD.DEBUG, StageTarget.HUD);
                cont.addChild(bar);
                cont.addChild(txt);
                sectionView.records.set(recordName, {
                    cont: cont,
                    bar: bar,
                    leftText: txt,
                });
                sectionView.cont.addChild(cont);
            }
            // return
            return sectionView.records.get(recordName);
        }
        updateView(rv, record, totalTime, i) {
            let cont = rv.cont;
            cont.visible = true;
            cont.position.x = this.viewportSize.x - this.buffer;
            // this.height + this.buffer extra to make room for header
            cont.position.y = this.height + this.buffer + (this.height + this.spacing) * i;
            let bar = rv.bar;
            let portion = (record.time / totalTime);
            let barW = portion * this.width;
            bar.width = barW;
            let txt = rv.leftText;
            txt.text = record.name +
                ' [' + round(record.time, 2) + 'ms] ' +
                ' (' + round(portion * 100, 1) + '%)';
            txt.position.x = -(barW + this.spacing);
        }
        redraw() {
            // retrieve report, iterate through sections
            let m = this.clocks.report();
            let startY = 0;
            for (let [section, records] of m.entries()) {
                this.redrawSection(section, startY, records);
                startY += this.sectionViews.get(section).cont.height + this.buffer * 2;
            }
        }
        redrawSection(section, startY, records) {
            let sectionView = this.ensureSectionView(section);
            sectionView.cont.visible = true;
            // offset entire section
            sectionView.cont.y = startY;
            // compute total time
            let totalTime = 0;
            for (let record of records) {
                totalTime += record.time;
            }
            // bookkeep all existing names so we know what to hide.
            // NOTE: making a new obj and crossing fingers stack allocated vs
            // dealing with bad existing set API
            let prevRecordNames = new Set(mapKeyArr(sectionView.records));
            // update all records in top-N
            for (let i = 0; i < records.length && i < this.display; i++) {
                let record = records[i];
                // build if necessary
                let rv = this.ensureRecordView(sectionView, record.name);
                // update
                this.updateView(rv, record, totalTime, i);
                prevRecordNames.delete(record.name);
            }
            // for any we didn't update, hide it.
            for (let entry of prevRecordNames.values()) {
                sectionView.records.get(entry).cont.visible = false;
            }
            prevRecordNames.clear();
        }
        onDisabled(entities) {
            for (let sectionView of this.sectionViews.values()) {
                sectionView.cont.visible = false;
            }
            this.sinceLastRedraw = this.redrawEveryFrames; // immediately draw on enabled
        }
        update(delta, entities) {
            // redraw every N frames
            this.sinceLastRedraw += 1;
            if (this.sinceLastRedraw >= this.redrawEveryFrames) {
                this.redraw();
                this.sinceLastRedraw = 0;
            }
        }
    }
    __decorate([
        override
    ], DebugTimingRenderer.prototype, "onDisabled", null);
    System.DebugTimingRenderer = DebugTimingRenderer;
})(System || (System = {}));
/// <reference path="../gj7/sound.ts" />
var Tween;
(function (Tween) {
    //
    // Tween methods
    //
    /**
     * Duration used to signal no end. (Behavior not defined for most tween
     * Methods; this is used internally elsewhere.)
     */
    Tween.Infinite = -1;
    /**
     * ---------------------------------
     *								   .
     *							   .
     *						  .
     *					  .
     *				 .
     *			.
     *		.
     * .
     * ---------------------------------
     *
     * @param elapsed
     * @param duration
     *
     * Returns how much to tween \in [0, 1].
     */
    function linear(elapsed, duration) {
        return elapsed / duration;
    }
    Tween.linear = linear;
    function easeInCubic(elapsed, duration) {
        let p = elapsed / duration;
        return p * p * p;
    }
    Tween.easeInCubic = easeInCubic;
    ;
    /**
     * ---------------------------------
     *								   .
     *					   .
     *				.
     *		   .
     *		.
     *	  .
     *	.
     * .
     * ---------------------------------
     *
     * @param elapsed
     * @param duration
     *
     * Returns how much to tween \in [0, 1].
     */
    function easeOutCubic(elapsed, duration) {
        let portion = elapsed / duration - 1;
        return portion * portion * portion + 1;
    }
    Tween.easeOutCubic = easeOutCubic;
    ;
    const eobCCUB = 2.70158;
    const eobCSQ = 1.70158;
    function easeOutBack(elapsed, duration) {
        let p = elapsed / duration;
        return 1 + eobCCUB * Math.pow(p - 1, 3) + eobCSQ * Math.pow(p - 1, 2);
    }
    Tween.easeOutBack = easeOutBack;
    const TWOTHIRDSPI = (Math.PI / 3) * 2;
    function easeOutElastic(elapsed, duration) {
        let p = elapsed / duration;
        if (p <= 0) {
            return 0;
        }
        if (p >= 1) {
            return 1;
        }
        return Math.pow(2, -10 * p) * Math.sin((10 * p - 0.75) * TWOTHIRDSPI) + 1;
    }
    Tween.easeOutElastic = easeOutElastic;
    const bncN1 = 7.5625;
    const bncD1 = 2.75;
    function easeOutBounce(elapsed, duration) {
        let p = elapsed / duration;
        if (p < 1 / bncD1) {
            return bncN1 * p * p;
        }
        else if (p < 2 / bncD1) {
            return bncN1 * (p -= (1.5 / bncD1)) * p + .75;
        }
        else if (p < 2.5 / bncD1) {
            return bncN1 * (p -= (2.25 / bncD1)) * p + .9375;
        }
        else {
            return bncN1 * (p -= (2.625 / bncD1)) * p + .984375;
        }
    }
    Tween.easeOutBounce = easeOutBounce;
    function sine(elapsed, _, period) {
        return Math.sin(period * elapsed);
    }
    Tween.sine = sine;
    /**
     *		^		  ^
     *	  /	  \		/	\	  . . .
     *	 /	   \   /	 \	 /
     * x		 v		   v
     *
     * NOTE: if we have other cycles in the future, can probably pass the
     * underlying method as a parameter!
     *
     * @param elapsed
     * @param _ duration (unused)
     * @param period
     */
    function linearCycle(elapsed, _, period) {
        let progress = (elapsed % period) / period;
        if (progress <= 0.5) {
            // ascending wave --- progress is from 0 up to 1
            return progress / 0.5;
        }
        else {
            // descending wave --- progress is from 1 down to 0
            return 1 - ((progress - 0.5) / 0.5);
        }
    }
    Tween.linearCycle = linearCycle;
    /**
     * Flahses between 0 and 1 at `period` interval.
     * @param elapsed
     * @param _ duration (unused)
     * @param period
     */
    function flashBetween(elapsed, _, period) {
        return Math.round(elapsed / period) % 2 == 0 ? 0 : 1;
    }
    Tween.flashBetween = flashBetween;
    /**
     * Returns a function that will wait a given time, then interpolate the
     * remainder using the provided subMethod.
     * @param wait
     * @param subMethod
     */
    function delay(wait, subMethod) {
        return function (elapsed, duration, period) {
            if (elapsed < wait) {
                return 0.0;
            }
            return subMethod(elapsed - wait, duration - wait, period);
        };
    }
    Tween.delay = delay;
    Tween.methods = {
        sine: sine,
        linear: linear,
        linearCycle: linearCycle,
        easeInCubic: easeInCubic,
        easeOutCubic: easeOutCubic,
        easeOutBack: easeOutBack,
        easeOutBounce: easeOutBounce,
        easeOutElastic: easeOutElastic,
        flashBetween: flashBetween,
    };
})(Tween || (Tween = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    class CameraFollowable extends Engine.Component {
    }
    Component.CameraFollowable = CameraFollowable;
})(Component || (Component = {}));
/// <reference path="../core/base.ts" />
/// <reference path="../core/tween.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/stage.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/camera-followable.ts" />
var System;
(function (System) {
    /**
     * Simple class that tries to follow something marked followable. Should
     * only have one of those.
     */
    class FollowCamera extends Engine.System {
        constructor(stage, viewportDims, sceneInfoProvider, zones) {
            super();
            this.stage = stage;
            this.viewportDims = viewportDims;
            this.sceneInfoProvider = sceneInfoProvider;
            this.zones = zones;
            // settings
            this.roomWeight = 0.7;
            this.interpFrames = 60;
            // cached state (would be in aspect, but only at most one entity for
            // this system, so just storing here).
            this.interpStartPos = new Point(-1, -1);
            this.interpFramesReamining = 0;
            this.lastInRoom = true;
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.CameraFollowable.name,
            ]);
        }
        update(delta, entities) {
            // should be exactly one player (just follow first if more than one).
            if (entities.size == 0) {
                return;
            }
            let aspect = entities.values().next().value;
            // this is where the follow target is
            let position = aspect.get(Component.Position);
            // by default we follow the player
            let centerX = position.p.x;
            let centerY = position.p.y;
            // however! if any room has the player in it, weight to the center
            // of the room instead. this supports only one room.
            let inRoom = false;
            for (let zoneEntity of this.zones.latest()) {
                let zoneComps = this.ecs.getComponents(zoneEntity);
                let zoneComp = zoneComps.get(Component.Zone);
                if (!zoneComp.zoneTypes.has(Logic.ZoneType.Camera) ||
                    !zoneComp.containsPlayer) {
                    continue;
                }
                // camera zone with player! extract and break immediately.
                let roomPos = zoneComps.get(Component.Position);
                let roomBox = zoneComps.get(Component.CollisionShape);
                let roomCenterX = roomPos.p.x;
                let roomCenterY = roomPos.p.y;
                centerX = this.roomWeight * roomCenterX + (1.0 - this.roomWeight) * centerX;
                centerY = this.roomWeight * roomCenterY + (1.0 - this.roomWeight) * centerY;
                inRoom = true;
                break;
            }
            // transitioning between rooms makes us interpolate. also update
            // this state.
            let interpStart = false;
            if (this.lastInRoom != inRoom) {
                this.interpFramesReamining = this.interpFrames;
                this.interpStartPos.set_(this.stage.x, this.stage.y);
                interpStart = true;
            }
            this.lastInRoom = inRoom;
            // approach: figure out desired position and either move there
            // directly or interpolate.
            // first figure out size of viewport
            let w = this.viewportDims.x / this.stage.scale.x;
            let h = this.viewportDims.y / this.stage.scale.y;
            // we want the stage to be cornered at this location
            let targetX = centerX - w / 2;
            let targetY = centerY - h / 2;
            // clamping
            let levelDims = this.sceneInfoProvider.mapDims;
            targetX = Math.min(Math.max(targetX, 0), levelDims.x - w);
            targetY = Math.min(Math.max(targetY, 0), levelDims.y - h);
            // stage coordinates get scaled with its scale. (also stage
            // coordinates are negative because we're moving the stage
            // *under* the viewport (i.e. in reverse)).
            targetX = (-targetX) * this.stage.scale.x;
            targetY = (-targetY) * this.stage.scale.y;
            // if starting the game, or in a room, move directly
            if ((this.stage.x == 0 && this.stage.y == 0) || this.interpFramesReamining == 0) {
                this.stage.x = targetX;
                this.stage.y = targetY;
            }
            else {
                // for transitions, interpolate. isn't totally vanilla easing
                // because the target is changing per frame as the player
                // moves.
                let elapsed = this.interpFrames - this.interpFramesReamining;
                let p = Tween.easeOutCubic(elapsed, this.interpFrames);
                this.stage.x = this.interpStartPos.x + p * (targetX - this.interpStartPos.x);
                this.stage.y = this.interpStartPos.y + p * (targetY - this.interpStartPos.y);
                ;
                this.interpFramesReamining--;
            }
        }
    }
    System.FollowCamera = FollowCamera;
})(System || (System = {}));
/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
var System;
(function (System) {
    /**
     * Subclass Selector and provide componentsRequired to produce a specific
     * Selector.
     *
     * Selector abstracts out the pattern of code (systems, scripts) wanting to
     * be able to iterate over a set of entities that all have a set of required
     * components, just like Systems do. The problem was that one-off
     * implementations were creating duplicate code, and bugs (like iterators
     * being exhausted and a second caller coming up dry) had to be fixed
     * multiple places. This is an intermediary solution. If the number of these
     * keeps growing, we might want to build Selectors as a concept into the ECS
     * itself.
     */
    class Selector extends Engine.System {
        constructor() {
            super(...arguments);
            this._latest = new Map();
        }
        /**
         * Iterator over the Entities matched this frame by this Selector.
         */
        latest() {
            return this._latest.keys();
        }
        update(delta, entities) {
            this._latest = entities;
        }
    }
    System.Selector = Selector;
    /**
     * Selects ATTACKERS that could make combo attacks.
     */
    class ComboableSelector extends Selector {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Comboable.name,
                Component.Armed.name,
            ]);
        }
    }
    System.ComboableSelector = ComboableSelector;
    class SpawnableSelector extends Selector {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Spawnable.name,
            ]);
        }
    }
    System.SpawnableSelector = SpawnableSelector;
    class EnemySelector extends Selector {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Enemy.name,
                Component.Position.name,
            ]);
        }
    }
    System.EnemySelector = EnemySelector;
    class StaticRenderableSelector extends Selector {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.StaticRenderable.name,
                Component.Position.name,
            ]);
        }
    }
    System.StaticRenderableSelector = StaticRenderableSelector;
    class PlayerSelector extends Selector {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.PlayerInput.name,
            ]);
        }
    }
    System.PlayerSelector = PlayerSelector;
    class ItemSelector extends Selector {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Item.name,
            ]);
        }
    }
    System.ItemSelector = ItemSelector;
    class ZoneSelector extends Selector {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.CollisionShape.name,
                Component.Position.name,
                Component.Zone.name,
            ]);
        }
    }
    System.ZoneSelector = ZoneSelector;
    class GateSelector extends Selector {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Activity.name,
                Component.Gate.name,
            ]);
        }
    }
    System.GateSelector = GateSelector;
    class CheckpointSelector extends Selector {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Checkpoint.name,
            ]);
        }
    }
    System.CheckpointSelector = CheckpointSelector;
})(System || (System = {}));
/// <reference path="../core/util.ts" />
/// <reference path="../system/selector.ts" />
/// <reference path="../component/collision-shape.ts" />
/// <reference path="../component/activity.ts" />
/// <reference path="../component/dead.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/input.ts" />
var System;
(function (System) {
    // functions
    function attacking(aspect) {
        if (!aspect.has(Component.Armed)) {
            return false;
        }
        let armed = aspect.get(Component.Armed);
        return armed.state == Weapon.SwingState.QuickAttack ||
            armed.state == Weapon.SwingState.QuickAttack2 ||
            armed.state == Weapon.SwingState.Swing;
    }
    /**
     * Euler integration: obvious thing you'd think of (if you were Newton).
     * @param p
     * @param v
     * @param a
     * @param t
     * @param out_p
     * @param out_v
     */
    function integrateExplicitEuler(p, v, a, t, out_p, out_v) {
        // update position with *current* veloctiy
        // x_{t+1} = x_t + v_t * delta
        out_p.x = p.x + v.x * t;
        out_p.y = p.y + v.y * t;
        // update velocity with current acceleration
        // v_{t+1} = v_t + a_t * delta
        out_v.x = v.x + a.x * t;
        out_v.y = v.y + a.y * t;
        // clamp small velocities
        // if (out_v.l2Squared() < 2000) {
        //	out_v.x = 0;
        //	out_v.y = 0;
        // }
    }
    /**
     * Semi-implicit Euler integration: better because... symplectic?
     * https://gafferongames.com/post/integration_basics/
     *
     * @param p
     * @param v
     * @param a
     * @param t
     * @param out_p
     * @param out_v
     */
    function integrateSemiImplicitEuler(p, v, a, t, out_p, out_v) {
        // update velocity with current acceleration
        // v_{t+1} = v_t + a_t * delta
        out_v.x = v.x + a.x * t;
        out_v.y = v.y + a.y * t;
        // update position with *new* veloctiy
        // x_{t+1} = x_t + v_t * delta
        out_p.x = p.x + out_v.x * t;
        out_p.y = p.y + out_v.y * t;
        // clamp small velocities
        // if (out_v.l2Squared() < 2000) {
        //	out_v.x = 0;
        //	out_v.y = 0;
        // }
    }
    /**
     * Verlet integration --- rebranded 200 years later!
     * @param p
     * @param prev_p
     * @param a
     * @param t
     * @param out_p
     * @param out_v
     */
    function integrateVerlet(p, prev_p, a, t, out_p, out_v) {
        // verlet integration formula
        let tsq = t * t;
        out_p.x = 2 * p.x - prev_p.x + a.x * tsq;
        out_p.y = 2 * p.y - prev_p.y + a.y * tsq;
        // compute velocity
        p.sub(prev_p, out_v);
    }
    // classes
    class MovementAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            this.v = new Point();
            this.start_p = new Point();
            this.prev_p = new Point();
            this.prev_p_init = false;
        }
    }
    class Movement extends Engine.System {
        constructor() {
            // constants
            super(...arguments);
            // members
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.Input.name,
            ]);
            // to avoid creating new objects.
            // Used to accumulate acceleration.
            this.cacheIntent = new Point();
            this.cacheA = new Point();
            this.cacheNextP = new Point();
            this.cacheNextV = new Point();
        }
        // functions
        makeAspect() {
            return new MovementAspect();
        }
        update(delta, entities) {
            // physics gets arbitrary smaller delta
            delta = delta / 100;
            for (let aspect of entities.values()) {
                let position = aspect.get(Component.Position);
                let input = aspect.get(Component.Input);
                // squash out invalid input
                input.intent.clampEach_(-1, 1);
                // prelim bookkeeping for the first frame of the game. ugh, i
                // wish we could remove this branch easily... Question from
                // future Max: onAdd(...) doesn't work for this?
                if (!aspect.prev_p_init) {
                    aspect.prev_p.copyFrom_(position.p);
                    aspect.start_p.copyFrom_(position.p);
                    aspect.prev_p_init = true;
                }
                // our quest for the rest of the method is to accumulate
                // acceleration from various forces.
                let a = this.cacheA;
                a.set_(0, 0);
                let immobile = aspect.has(Component.Immobile);
                let dead = aspect.has(Component.Dead);
                let dampened = false; // updated below
                let inputOnly = false; // updated below
                let customDecel = false; // updated below
                let action = null;
                // Unless one of these, handle input-driven movement.
                // TODO: Can we refactor this check (used in swing and defence
                // as well, I think, as well as maybe other places) into a
                // common place and call "incapacitated" or something?
                if (!dead && !immobile) {
                    // Handle rotation. This is done differently depending on the
                    // inputType.
                    switch (input.movement.movementType) {
                        case Physics.MovementType.RotateMove: {
                            position.angle += input.intent.x * input.movement.rotateSpeed;
                            break;
                        }
                        // Intentional fall-through; both Strafe and
                        // InstantTurn allow instantaneously affecting the
                        // facing angle.
                        case Physics.MovementType.Strafe:
                        case Physics.MovementType.InstantTurn: {
                            // allow AIs not to turn. note: in hind sight, this
                            // is stupid because it ignores input target angles
                            // of 0 from the player too.
                            position.angle = input.targetAngle || position.angle;
                            break;
                        }
                        // Can't tell whether this way of doing code maintenance is
                        // smart or dumb.
                        default: {
                            throw new Error('Update this switch for new InputType.');
                        }
                    }
                    // Move slowly during various actions. Swinging is already
                    // weird: you get a lunge force from your attack, but no
                    // movement itself. However, your max speed may be
                    // increased. It's probably going to get even weirder with
                    // sawtooths' curvy long Swing follow attacks.
                    let moveAccel = input.movement.accel;
                    if (aspect.has(Component.Activity)) {
                        let activity = aspect.get(Component.Activity);
                        action = activity.action;
                        switch (activity.action) {
                            case Action.Idle:
                                // NOTE: consider pulling out of dead /
                                // immobile check.
                                customDecel = true;
                                break;
                            case Action.Charging:
                            case Action.Sheathing:
                            case Action.BlockRaising:
                            case Action.BlockHolding:
                            case Action.BlockLowering:
                            case Action.QuickAttacking:
                            case Action.QuickAttacking2:
                            case Action.ComboAttacking:
                            case Action.Recoiling:
                                dampened = true;
                                moveAccel *= 0.25;
                                break;
                            // TODO: can we just take the big check above
                            // (dead, staggered, staggerreturning, etc.) as
                            // move here? OR (perhaps even better) refactor as
                            // proposed above.
                            case Action.Swinging:
                                if (!input.movement.attackMobility) {
                                    dampened = true;
                                    moveAccel *= 0.0;
                                }
                                break;
                            case Action.Blocked:
                                dampened = true;
                                moveAccel *= 0.0;
                                break;
                        }
                    }
                    // Handle forward movement (and other Action checks).
                    switch (input.movement.movementType) {
                        // Intentional fall-through; for both RotateMove and
                        // InstantTurn, facing direction is tied to movement
                        // direction.
                        case Physics.MovementType.RotateMove:
                        case Physics.MovementType.InstantTurn: {
                            if (input.intent.y != 0) {
                                // normal forward movement (priority)
                                // TODO: why do we need a -cos here?
                                a.x += input.intent.y * moveAccel * -Math.cos(position.angle);
                                a.y += input.intent.y * moveAccel * Math.sin(position.angle);
                                inputOnly = true;
                            }
                            else if (input.intent.x != 0) {
                                // sideways movement
                                let rot = position.angle - Constants.HALF_PI;
                                a.x += input.intent.x * moveAccel * Math.cos(rot);
                                a.y += input.intent.x * moveAccel * -Math.sin(rot);
                                inputOnly = true;
                            }
                            break;
                        }
                        // Strafing doesn't tie movement direction to angle.
                        case Physics.MovementType.Strafe: {
                            // could just normalize, but that would disallow
                            // AIs doing slower movement.
                            this.cacheIntent.copyFrom_(input.intent);
                            let mag = this.cacheIntent.l2();
                            if (mag > 1.0) {
                                this.cacheIntent.scale_(1 / mag);
                            }
                            if (mag > 0) {
                                a.add_(this.cacheIntent.scale_(moveAccel));
                                inputOnly = true;
                            }
                            break;
                        }
                    }
                }
                // Before adding all more complex forces and integrating: we
                // know that if something is static, and we've allowed for its
                // rotational movement (above), we're done because it's simply
                // going to keeps its starting position.
                if (input.movement.static) {
                    position.p = aspect.prev_p;
                    continue;
                }
                // bounce
                if (input.bounce) {
                    aspect.v.scale_(-1 * Movement.BOUNCE_DAMPEN);
                }
                input.bounce = false;
                // add externally applied forces
                while (input.forceQueue.length > 0) {
                    let force = input.forceQueue.pop().scale_(input.movement.invMass);
                    a.add_(force);
                    inputOnly = false;
                }
                a.add_(input.collisionForce);
                input.collisionForce.set_(0, 0);
                // drag is Movement.K_DRAG by default, or the custom decel if
                // conditions are met.
                let k_drag = customDecel ? input.movement.decel : Movement.K_DRAG;
                // apply any external drags
                while (input.frictionQueue.length > 0) {
                    k_drag += input.frictionQueue.pop();
                }
                // apply drag
                a.x += -k_drag * aspect.v.x;
                a.y += -k_drag * aspect.v.y;
                // integrate
                // ---
                // integrateExplicitEuler(position.p, aspect.v, a, delta, this.cacheNextP, this.cacheNextV);
                integrateSemiImplicitEuler(position.p, aspect.v, a, delta, this.cacheNextP, this.cacheNextV);
                // integrateVerlet(position.p, aspect.prev_p, a, delta, this.cacheNextP, this.cacheNextV);
                // find top speed and cutoff if action known and matches a
                // limit.
                if (action != null) {
                    // pick max speed if matching action
                    let maxSpeed = null;
                    switch (action) {
                        case Action.Moving:
                            maxSpeed = input.movement.maxMoveSpeed;
                            break;
                        case Action.Swinging:
                            if (input.movement.maxSwingSpeed != null) {
                                maxSpeed = input.movement.maxSwingSpeed;
                            }
                            break;
                    }
                    // apply any max speed chosen
                    if (maxSpeed != null) {
                        let vL2 = this.cacheNextV.l2();
                        if (vL2 > maxSpeed) {
                            this.cacheNextV.scale_(maxSpeed / vL2);
                        }
                    }
                }
                // find min speed. raise to that if (1) under (and *only*
                // under) input forces, (2) not dampened by special actions.
                let vL2 = this.cacheNextV.l2();
                if (inputOnly && !dampened && vL2 < input.movement.minMoveSpeed) {
                    this.cacheNextV.scale_(input.movement.minMoveSpeed / vL2);
                }
                // bookkeep
                aspect.prev_p.copyFrom_(position.p);
                position.p = this.cacheNextP;
                aspect.v.copyFrom_(this.cacheNextV);
                // debug bookkeeeping
                position.debugSpeed = this.cacheNextV.l2();
            }
        }
    }
    // drag coefficient
    Movement.K_DRAG = 0.3;
    // dampen scale on bounce
    Movement.BOUNCE_DAMPEN = 0.3;
    __decorate([
        override
    ], Movement.prototype, "makeAspect", null);
    System.Movement = Movement;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/constants.ts" />
var Component;
(function (Component) {
    class StaticRenderable extends Engine.Component {
        /**
         * Manual dimensions should only be set if they should be altered from
         * the original. If they are not provided, or if (0,0) is provided, the
         * original will be used.
         * @param img
         * @param z
         * @param stageTarget
         * @param manualDims
         */
        constructor(img, z, stageTarget, anchor = new Point(0.5, 0.5), manualDims = new Point()) {
            super();
            this.img = img;
            this.z = z;
            this.stageTarget = stageTarget;
            this.anchor = anchor;
            this.manualDims = manualDims;
        }
        toString() {
            return this.img;
        }
    }
    Component.StaticRenderable = StaticRenderable;
})(Component || (Component = {}));
/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/stage.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/static-renderable.ts" />
var System;
(function (System) {
    class StaticRendererAspect extends Engine.Aspect {
    }
    /**
     * StaticRenderer assumes objects never change (positions, z-levels,
     * anything). This makes it fast to have lots of them as they don't burn
     * any cycles on update.
     */
    class StaticRenderer extends Engine.System {
        constructor(stage) {
            super();
            this.stage = stage;
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.StaticRenderable.name,
            ]);
        }
        makeAspect() {
            return new StaticRendererAspect();
        }
        onAdd(aspect) {
            // Get component(s)
            let renderable = aspect.get(Component.StaticRenderable);
            let position = aspect.get(Component.Position);
            // Create resources. Save to aspect.
            let sprite = new Stage.Sprite(PIXI.Texture.fromFrame(renderable.img), renderable.z, renderable.stageTarget);
            if (!renderable.manualDims.equalsCoords(0, 0)) {
                sprite.width = renderable.manualDims.x;
                sprite.height = renderable.manualDims.y;
            }
            sprite.anchor.set(renderable.anchor.x, renderable.anchor.y);
            sprite.position.set(position.p.x, position.p.y);
            sprite.rotation = angleFlip(position.angle);
            aspect.dobj = sprite;
            // Save aspect state to outer renderer.
            this.stage.add(aspect.dobj);
        }
        onRemove(aspect) {
            this.stage.remove(aspect.dobj);
        }
        update(delta, entities) {
            // Optimizing for fast unchanging objects, this doesn't do anything
            // in update!
        }
    }
    __decorate([
        override
    ], StaticRenderer.prototype, "makeAspect", null);
    __decorate([
        override
    ], StaticRenderer.prototype, "onAdd", null);
    __decorate([
        override
    ], StaticRenderer.prototype, "onRemove", null);
    System.StaticRenderer = StaticRenderer;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/stagger.ts" />
/// <reference path="timebomb.ts" />
var System;
(function (System) {
    class Stagger extends System.Timebomb {
        constructor() {
            super(...arguments);
            this.tbComp = Component.Stagger;
            this.componentsRequired = new Set([
                Component.Stagger.name,
            ]);
        }
    }
    System.Stagger = Stagger;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="timebomb.ts" />
var Component;
(function (Component) {
    class Knockback extends Component.Timebomb {
        constructor(duration) {
            super(duration, Destruct.Component);
            this.duration = duration;
        }
    }
    Component.Knockback = Knockback;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/knockback.ts" />
/// <reference path="timebomb.ts" />
var System;
(function (System) {
    class Knockback extends System.Timebomb {
        constructor() {
            super(...arguments);
            this.tbComp = Component.Knockback;
            this.componentsRequired = new Set([
                Component.Knockback.name,
            ]);
        }
    }
    System.Knockback = Knockback;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="timebomb.ts" />
var Component;
(function (Component) {
    /**
     * If you were *Blocked* means that you were *attacking* and your attack
     * got fully blocked.
     */
    class Blocked extends Component.Timebomb {
        constructor(duration) {
            super(duration, Destruct.Component);
            this.duration = duration;
        }
    }
    Blocked.DEFAULT_DURATION = 750;
    Component.Blocked = Blocked;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="timebomb.ts" />
var Component;
(function (Component) {
    /**
     * If you were *Blocked* means that you were *attacking* and your
     * attack got fully blocked.
     */
    class Recoil extends Component.Timebomb {
        constructor(duration = Recoil.DEFAULT_DURATION) {
            super(duration, Destruct.Component);
            this.duration = duration;
        }
    }
    Recoil.DEFAULT_DURATION = 300;
    Component.Recoil = Recoil;
})(Component || (Component = {}));
/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../engine/events.ts" />
/// <reference path="../gj7/physics.ts" />
/// <reference path="../gj7/weapon.ts" />
/// <reference path="../component/activity.ts" />
/// <reference path="../component/armed.ts" />
/// <reference path="../component/attack.ts" />
/// <reference path="../component/blocked.ts" />
/// <reference path="../component/input.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/shielded.ts" />
/// <reference path="../component/recoil.ts" />
/// <reference path="../component/stagger.ts" />
var System;
(function (System) {
    /**
     * State for the entity / input / armed (weapon) tuple.
     */
    class SwingAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            /**
             * How long it's been in the current state.
             */
            this.elapsed = 0;
            this.startedAttack = false;
            this.startedQuickAttack = false;
            this.startedComboAttack = false;
            this.ongoingAttack = undefined;
            /**
             * Whether the state has changed on this frame.
             */
            this.changed = false;
            this.eventsDispatched = false;
            this._state = Weapon.SwingState.Idle;
        }
        /**
         * What state it is in.
         */
        get state() {
            return this._state;
        }
        set state(next) {
            this.elapsed = 0;
            this.startedAttack = false;
            this.startedQuickAttack = false;
            this.startedComboAttack = false;
            this.eventsDispatched = false;
            this._state = next;
            // TODO: set ongoingAttack?
        }
    }
    /**
     * Swing mediates input (intent to swing) with actually spawning an attack,
     * as well as managing the attack process.
     */
    class Swing extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.Input.name,
                Component.Armed.name,
            ]);
        }
        makeAspect() {
            return new SwingAspect();
        }
        /**
         * This should laregely only be called from within the Swing system as
         * it handles the logic of deciding when attacks can be created based
         * on required delays and state changes. However, it's exposed for
         * special circumstances, like an entity creating its "quick attack"
         * (explosion) once when it's dead.
         */
        startAttack(attacker, attackerPos, attackerInput, attackInfo, partID) {
            let attack = this.ecs.addEntity();
            // position
            let pos = new Component.Position(new Point(attackerPos.p.x, attackerPos.p.y), attackerPos.angle);
            this.ecs.addComponent(attack, pos);
            // attack
            let attackComp = new Component.Attack(attacker, attackInfo);
            this.ecs.addComponent(attack, attackComp);
            this.ecs.addComponent(attack, new Component.ActiveAttack());
            // add comboable to attack if entity is comboable and attack is one that could have combos (non-ranged only)
            if (this.ecs.getComponents(attacker).has(Component.Comboable) &&
                attackInfo.movement == Weapon.AttackMovement.Track) {
                this.ecs.addComponent(attack, new Component.FromComboable());
            }
            // collision. avoid self-colliding by resolving collision box w/
            // attacker now
            let weaponCShape = Component.CollisionShape.buildRectangle(attackInfo.cboxDims.copy(), new Set(attackInfo.cTypes));
            weaponCShape.collisionsResolved.add(attacker);
            this.ecs.addComponent(attack, weaponCShape);
            // attacker movement (for lunge forces)
            attackerInput.forceQueue.push(Physics.forceFromAngle(attackerPos.angle, attackInfo.lungeForce));
            // attack movement
            switch (attackInfo.movement) {
                // Track means attack moves with entity (like a sword swing)
                case Weapon.AttackMovement.Track: {
                    this.ecs.addComponent(attack, new Component.Tracker(attacker, attackInfo.cboxOffset.copy(), true));
                    break;
                }
                // Launch means the attack moves on its own (like an arrow)
                case Weapon.AttackMovement.Launch: {
                    // alter position by cbox offset
                    if (attackInfo.cboxOffset != null) {
                        pos.p = pos.p.add_(attackInfo.cboxOffset.copy().rotate_(-pos.angle));
                    }
                    // movement
                    let input = new Component.Input({
                        movementType: Physics.MovementType.RotateMove,
                        accel: 1,
                        minMoveSpeed: attackInfo.velocity,
                        maxMoveSpeed: attackInfo.velocity,
                        decel: 0,
                        invMass: 1.0,
                        rotateSpeed: 0.05,
                    });
                    input.intent.y = Physics.UP;
                    this.ecs.addComponent(attack, input);
                    // rendering. add both moving and idle animations: moving
                    // when it's moving, idle when/if it gets stopped.
                    this.ecs.addComponent(attack, new Component.Activity({
                        startAction: Action[Action.Moving],
                    }));
                    let body = new Component.Body();
                    body.setParts(new Map([[Part.Core, PartID.Default]]));
                    this.ecs.addComponent(attack, body);
                    let animatable = new Component.Animatable(ZLevelWorld.Object, StageTarget.World);
                    for (let [key, data] of attackInfo.animDatas.entries()) {
                        animatable.animations.set(key, data);
                    }
                    this.ecs.addComponent(attack, animatable);
                    break;
                }
            }
            return attackComp;
        }
        /**
         * Dispatch events on the first frame of each state.
         * @param aspect
         * @param attackInfo
         */
        maybeDispatchEvent(aspect, attackInfo, eventType) {
            if (aspect.eventsDispatched) {
                return;
            }
            let eName = eventType;
            let eArgs = {
                attackInfo: attackInfo,
                location: aspect.get(Component.Position).p,
            };
            this.eventsManager.dispatch({ name: eName, args: eArgs });
            aspect.eventsDispatched = true;
        }
        updateState(delta, aspect) {
            // (honestly, this is a FSM, and could write functions to trigger edges)
            //
            // + Idle (state used when idling / walking)  <----+
            // |											   |
            // | (press)									   |
            // v											   |
            // + ChargeCharging								   |
            // |  - min duration or early release			   |
            // |											   |
            //[?]----------- early release? -------------------+
            // |
            // | (min duration elapsed)
            // v
            // + ChargeReady
            // |  - whenever released
            // v
            // + Swing
            // |  - duration (total)
            // |  - attack delay
            // |
            // | (after duration (total) elapsed)
            // v
            // + Sheathe
            // |  - duration
            // |
            // | (after duration elapsed)
            // v
            // + [back to Idle] --^
            aspect.elapsed += delta;
            let pos = aspect.get(Component.Position);
            let input = aspect.get(Component.Input);
            let armed = aspect.get(Component.Armed);
            let weapon = armed.active;
            let comboable = null;
            if (aspect.has(Component.Comboable)) {
                comboable = aspect.get(Component.Comboable);
            }
            let blocking = aspect.has(Component.Shielded) &&
                (aspect.get(Component.Shielded)).state != Shield.BlockState.Idle;
            // TODO: refactor into common check (maybe relies on
            // Activity.Action).
            // special check --- no swinging when staggered, dead, blocked,
            // recoil, or blocking; always move back to 'idle'
            if (aspect.has(Component.Knockback) ||
                aspect.has(Component.Stagger) ||
                aspect.has(Component.StaggerReturn) ||
                aspect.has(Component.Dead) ||
                aspect.has(Component.Blocked) ||
                aspect.has(Component.Recoil) ||
                blocking) {
                // remove attack if it exists
                if (aspect.startedAttack || aspect.startedQuickAttack || aspect.startedComboAttack) {
                    aspect.ongoingAttack.fuse = true;
                }
                // set to idle
                aspect.state = Weapon.SwingState.Idle;
                armed.state = Weapon.SwingState.Idle;
                return;
            }
            switch (aspect.state) {
                // In idle state, as long as not blocking, can swing any time
                // after cooldown has elapsed.
                case Weapon.SwingState.Idle: {
                    // check shielded component, if applicable.
                    if (aspect.elapsed >= weapon.timing.idleCooldown) {
                        if (input.quickAttack) {
                            aspect.state = Weapon.SwingState.QuickAttack;
                        }
                        else if (input.attack) {
                            aspect.state = Weapon.SwingState.ChargeCharging;
                        }
                        else if (input.switchWeapon) {
                            armed.activeIdx = (armed.activeIdx + 1) % armed.inventory.length;
                            armed.active = armed.inventory[armed.activeIdx];
                            // play sound
                            if (armed.inventory.length > 1) {
                                let audio = this.ecs.getSystem(System.Audio);
                                if (armed.active.partID == PartID.Bow) {
                                    audio.play(['switchToBow']);
                                }
                                else if (armed.active.partID == PartID.Sword) {
                                    audio.play(['switchToSword']);
                                }
                            }
                            // reset anims
                            if (aspect.has(Component.Animatable)) {
                                aspect.get(Component.Animatable).reset = true;
                            }
                        }
                    }
                    break;
                }
                // In charge state, must wait minimum duration, and then can be
                // ready to swing. If minimum duration not waited, return to
                // idle.
                case Weapon.SwingState.ChargeCharging: {
                    // events dispatched as soon as state changed
                    // charge may be happening more than i thought. just using
                    // swing for now.
                    // this.maybeDispatchEvent(aspect, weapon.swingAttack, Events.EventTypes.Charge);
                    if (aspect.elapsed >= weapon.timing.minChargeDuration) {
                        aspect.state = Weapon.SwingState.ChargeReady;
                    }
                    else if (!input.attack) {
                        aspect.state = Weapon.SwingState.Idle;
                    }
                    break;
                }
                case Weapon.SwingState.ChargeReady: {
                    if (!input.attack) {
                        aspect.state = Weapon.SwingState.Swing;
                    }
                    break;
                }
                // In swing state, create the attack after the attack delay has
                // passed. The swing lasts a set amount of time.
                case Weapon.SwingState.Swing: {
                    if (weapon.swingAttack == null) {
                        throw new Error('SwingAttack initiated for weapon without one!');
                    }
                    // events dispatched as soon as state changed
                    this.maybeDispatchEvent(aspect, weapon.swingAttack, Events.EventTypes.Swing);
                    if (!aspect.startedAttack && aspect.elapsed >= weapon.timing.swingAttackDelay) {
                        aspect.ongoingAttack = this.startAttack(aspect.entity, pos, input, weapon.swingAttack, weapon.partID);
                        aspect.startedAttack = true;
                    }
                    if (aspect.elapsed >= weapon.timing.swingDuration) {
                        aspect.state = Weapon.SwingState.Sheathe;
                    }
                    break;
                }
                // In sheathe state, just wait to transition back to idle.
                case Weapon.SwingState.Sheathe: {
                    if (aspect.elapsed >= weapon.timing.sheatheDuration) {
                        aspect.state = Weapon.SwingState.Idle;
                    }
                    break;
                }
                // In the quick attack states, create the attack after the
                // attack delay has passed. The quick attack lasts a set amount
                // of time. A new quick attack can be spawned before the first
                // one fully expires. NOTE: intentional fall-through here.
                case Weapon.SwingState.QuickAttack:
                case Weapon.SwingState.QuickAttack2: {
                    if (weapon.quickAttack == null) {
                        throw new Error('QuickAttack initiated for weapon without one!');
                    }
                    // events dispatched as soon as state changed
                    this.maybeDispatchEvent(aspect, weapon.quickAttack, Events.EventTypes.Swing);
                    // because this block handles both cases (QuickAttack and
                    // QuickAttack2), determine what the other one is.
                    let other = aspect.state == Weapon.SwingState.QuickAttack ?
                        Weapon.SwingState.QuickAttack2 :
                        Weapon.SwingState.QuickAttack;
                    // spawn attack object if we haven't and
                    // quickAttackAttackDelay has passed
                    if (!aspect.startedQuickAttack && aspect.elapsed >= weapon.timing.quickAttackAttackDelay) {
                        aspect.ongoingAttack = this.startAttack(aspect.entity, pos, input, weapon.quickAttack, weapon.partID);
                        aspect.startedQuickAttack = true;
                    }
                    // switch to next attack if there's input and and quickAttackNextWait has passed
                    if (input.quickAttack && aspect.elapsed >= weapon.timing.quickAttackNextWait) {
                        // switch to combo if conditions are met
                        if (input.quickAttack && comboable !== null && comboable.comboReady) {
                            aspect.state = Weapon.SwingState.Combo;
                        }
                        else {
                            // or just do another quick attack if not
                            aspect.state = other;
                        }
                    }
                    if (aspect.elapsed >= weapon.timing.quickAttackDuration) {
                        aspect.state = Weapon.SwingState.Idle;
                    }
                    break;
                }
                case Weapon.SwingState.Combo: {
                    if (weapon.comboAttack == null) {
                        throw new Error('ComboAttack initiated for weapon without one!');
                    }
                    // events dispatched as soon as state changed
                    this.maybeDispatchEvent(aspect, weapon.comboAttack, Events.EventTypes.Swing);
                    // spawn attack object if we haven't and comboAttackDelay
                    // has passed
                    if (!aspect.startedComboAttack && aspect.elapsed >= weapon.timing.comboAttackDelay) {
                        aspect.ongoingAttack = this.startAttack(aspect.entity, pos, input, weapon.comboAttack, weapon.partID);
                        aspect.startedComboAttack = true;
                    }
                    if (aspect.elapsed >= weapon.timing.comboDuration) {
                        aspect.state = Weapon.SwingState.Idle;
                    }
                    break;
                }
            }
            // Always update armed state (`state` and `elapsed`) to match (for
            // other observing systems).
            armed.state = aspect.state;
            armed.elapsed = aspect.elapsed;
        }
        update(delta, entities) {
            for (let aspect of entities.values()) {
                this.updateState(delta, aspect);
            }
        }
    }
    __decorate([
        override
    ], Swing.prototype, "makeAspect", null);
    System.Swing = Swing;
})(System || (System = {}));
/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="anim.ts" />
/// <reference path="stage.ts" />
var Stage;
(function (Stage) {
    let PlayDirection;
    (function (PlayDirection) {
        PlayDirection[PlayDirection["Forward"] = 0] = "Forward";
        PlayDirection[PlayDirection["Backward"] = 1] = "Backward";
    })(PlayDirection || (PlayDirection = {}));
    /**
     * A blob of Animatable game state (containg all animations and some prev
     * state).
     *
     * Dev note: While this is given to the Component.Animatable now, it was
     * previously the AnimationRenderer Aspect, and conceptually belongs there;
     * it's heavy-weight transient state. It's been moved to
     * Component.Animatable during the "dirty component" feature development so
     * that it may be shared across the 2 animation renderer systems.
     */
    class AnimatableState {
        constructor() {
            this.curVisible = false;
            this.activeKeys = new Set();
            this.animations = new Map();
        }
    }
    Stage.AnimatableState = AnimatableState;
    /**
     * Animation is my own implementation of PIXI.extras.AnimatedSprite that
     * supports a couple key features it is missing:
     *
     *	  (a) a clearly-defined spec for frame timing. PIXI gives "change this
     *		  number in this direction to change the speed." That's it, even
     *		  within the code's comments. We give "ms / frame".
     *
     *	  (b) different play types (e.g. Loop and PingPong).
     *
     * In exchange, though, their timing is more sophisticated, using core
     * objects (PIXI.ticker) and lag. They also support callback functions for
     * events like frame changes or animation completions, but that doesn't fit
     * with this engine's procedural style.
     *
     * Animation is constructed from:
     *
     *	 - Component.Animatable	   ----	   per-entity data that is the same
     *									   across all of its Animations
     *
     *	 - AnimationData		   ----	   per-Animation data
     */
    class Animation extends PIXI.Sprite {
        /**
         * All properties passed are assumed immutable.
         */
        constructor(textures, z, stageTarget, frameDuration, playType) {
            super(textures[0]);
            this.textures = textures;
            this.z = z;
            this.stageTarget = stageTarget;
            this.frameDuration = frameDuration;
            this.playType = playType;
            this.neverUpdate = false;
            this.nFrames = this.textures.length;
            this.reset();
            // build basic filters TODO(later): this is ugly
            // let brightnessFilter = new PIXI.filters.ColorMatrixFilter();
            // this.filterCache.set(Animation.BrightnessFilter, brightnessFilter);
            // this.filters = [brightnessFilter];
            this.neverUpdate = this.nFrames < 2;
        }
        get frame() {
            return this.curFrameIndex;
        }
        // public filterCache = new Map<FilterName, PIXI.Filter>()
        static loadTextures(base, frames) {
            // Kind of hack here: allowing 0-frame animations to have
            // non-numeric names.
            // compute paths to load textures
            let nTextures = frames == 0 ? 1 : frames;
            let textures = new Array(nTextures);
            if (frames == 0) {
                textures[0] = PIXI.Texture.fromFrame(base + '.png');
            }
            else {
                for (let i = 1; i <= frames; i++) {
                    textures[i - 1] = PIXI.Texture.fromFrame(base + i + '.png');
                }
            }
            return textures;
        }
        static build(bd, dd) {
            // build animation from textures and further mutate
            let textures = Animation.loadTextures(bd.base, bd.frames);
            let anim = new Animation(textures, dd.z, dd.stageTarget, bd.speed, bd.playType);
            anim.anchor.set(bd.anchor.x, bd.anchor.y);
            anim.alpha = bd.alpha;
            anim.tint = bd.tint != null ? bd.tint : 0xffffff;
            anim.scale.set(bd.scale, bd.scale);
            return anim;
        }
        /**
         * NOTE: sets this.curFrameIndex. Shouldn't do elsewhere. (Probably
         * should use setter to enforce this...)
         */
        switchFrames(index) {
            if (index < 0 || index >= this.textures.length) {
                throw new Error('Desired texture index ' + index + ' out of ' +
                    'bounds. Must be between 0 and ' + this.textures.length);
            }
            if (index !== this.curFrameIndex) {
                this._texture = this.textures[index];
                this._textureID = -1;
                this.curFrameIndex = index;
            }
        }
        reset() {
            this.timeInCurrentFrame = 0;
            this.playDirection = PlayDirection.Forward;
            this.switchFrames(0);
        }
        /**
         * Gets the true origin (bottom-left corner) of the texture displayed on screen, accounting
         * for anchor and rotation.
         */
        getTextureOrigin(out) {
            // sin / cos of angle used below
            const sin_t = Math.sin(this.rotation);
            const cos_t = Math.cos(this.rotation);
            const sin_a = cos_t;
            const cos_a = sin_t;
            // Let's talk about anchoring. Anchoring works like:
            //
            // (0, 0) ---------- (1, 0)
            //	 |				   |
            //	 |				   |
            //	 |	  (0.5, 0.5)   |
            //	 |				   |
            //	 |				   |
            // (0, 1) ---------- (1, 1)
            // anchor scales w & h to make vectors from texture origin to anchor
            const w = this.width * this.anchor.x;
            const h = this.height * (1 - this.anchor.y);
            // compute vector components
            const wx = w * cos_t;
            const wy = w * sin_t;
            const hx = h * cos_a;
            const hy = h * sin_a;
            // backtrack from anchor to texture origin
            out.x = this.position.x - wx - hx;
            out.y = this.position.y - wy + hy;
        }
        computeNextFrameIdx() {
            switch (this.playType) {
                // start over at beginning after end reached
                case Anim.PlayType.Loop: {
                    return this.curFrameIndex === this.nFrames - 1 ?
                        0 : this.curFrameIndex + 1;
                }
                // reverse directions if on either end
                case Anim.PlayType.PingPong: {
                    if (this.playDirection === PlayDirection.Forward &&
                        this.curFrameIndex === this.nFrames - 1) {
                        this.playDirection = PlayDirection.Backward;
                    }
                    else if (this.playDirection === PlayDirection.Backward &&
                        this.curFrameIndex === 0) {
                        this.playDirection = PlayDirection.Forward;
                    }
                    // update based on direction
                    let delta = this.playDirection === PlayDirection.Forward ?
                        1 : -1;
                    return this.curFrameIndex + delta;
                }
                // hold last frame
                case Anim.PlayType.PlayAndHold: {
                    return this.curFrameIndex === this.nFrames - 1 ?
                        this.nFrames - 1 : this.curFrameIndex + 1;
                }
            }
        }
        noUpdateNeeded() {
            return this.neverUpdate ||
                (this.playType === Anim.PlayType.PlayAndHold &&
                    this.curFrameIndex === this.nFrames - 1);
        }
        /**
         * Returns whether the update needs to continue to happen in the
         * future (barring current frame changes w/ a rest(...)).
         */
        update(delta) {
            // quick sanity check
            if (this.scale == null) {
                throw new Error('Scale should not be null');
            }
            if (this.neverUpdate) {
                return false;
            }
            this.timeInCurrentFrame += delta;
            // If we haven't played this frame for long enough (and we haven't
            // been told to reset), stay in it.
            if (this.timeInCurrentFrame < this.frameDuration) {
                return !this.noUpdateNeeded();
            }
            // Otherwise, we proceed to the next frame.
            // Figure out timing for next frame. policy options:
            //
            // (a) start at 0. this would avoid shortchanging the new frame,
            // but would make overall timings inconsistent as we'd be
            // rounding up to the nearest frame.
            //
            //	   this.timeInCurrentFrame = 0;
            //
            // (b) discount with amount of time over previous frame. keeps
            // frames progressing on time but shortchanges next frame.
            //
            //	   this.timeInCurrentFrame -= this.frameDuration;
            //
            // going with (a) for now so that animations look consistent.
            this.timeInCurrentFrame = 0;
            let nextFrameIndex = this.computeNextFrameIdx();
            // update internals
            this.switchFrames(nextFrameIndex);
            return !this.noUpdateNeeded();
        }
    }
    // filter names TODO(later): this is ugly
    Animation.BrightnessFilter = 'BrightnessFilter';
    Stage.Animation = Animation;
})(Stage || (Stage = {}));
/// <reference path="../../lib/pixi-particles.d.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/particles.ts" />
/// <reference path="../graphics/animation.ts" />
var System;
(function (System) {
    class ParticleRenderer extends Engine.System {
        constructor(stage, particleConfig, particleConfigJSONS) {
            super();
            this.emitters = new Map();
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
            // mutate json configs as needed
            this.mutateConfigs(particleConfigJSONS);
            // build all emitters
            for (let emitterID in particleConfig) {
                let config = particleConfig[emitterID];
                // build textures
                let textures = [];
                for (let texture of config.textures) {
                    textures.push(...Stage.Animation.loadTextures(texture.base, texture.frames));
                }
                // build emitter. how we do it changes based on whether it's an animated particle.
                let emitter;
                if (config.anim != null) {
                    // animated particle
                    emitter = new PIXI.particles.Emitter(stage, {
                        framerate: config.anim.framerate,
                        loop: true,
                        textures: textures,
                    }, clone(particleConfigJSONS.get(config.config)));
                    emitter.particleConstructor = PIXI.particles.AnimatedParticle;
                }
                else {
                    // non-animated particle
                    emitter = new PIXI.particles.Emitter(stage, textures, clone(particleConfigJSONS.get(config.config)));
                }
                // save
                this.emitters.set(emitterID, {
                    emitter: emitter,
                });
            }
        }
        /**
         * Returns whether emitterID known.
         */
        check(emitterID) {
            if (!this.emitters.has(emitterID)) {
                console.error('Unknown emitterID: "' + emitterID + '"');
                console.error('Known emitters: ' + mapKeyString(this.emitters));
                return false;
            }
            return true;
        }
        /**
         * Disables everything not in emitterIDs; enables everything in
         * emitterIDs.
         */
        enableOnly(emitterIDs) {
            let eids = new Set(emitterIDs);
            // loop over everything we know of, disable if not in eids, enable
            // if it is.
            for (let id of this.emitters.keys()) {
                if (eids.has(id)) {
                    this.enable(id);
                }
                else {
                    this.disable(id, true);
                }
            }
        }
        /**
         * How to enable an emitter. (no-op if already enabled.)
         */
        enable(emitterID) {
            // sanity check
            if (!this.check(emitterID)) {
                return;
            }
            let pkg = this.emitters.get(emitterID);
            if (pkg.emitter.emit) {
                // console.warn('Emitter "' + emitterID + '" is already enabled');
                return;
            }
            pkg.emitter.emit = true;
        }
        disable(emitterID, cleanup = false) {
            // sanity check
            if (!this.check(emitterID)) {
                return;
            }
            let pkg = this.emitters.get(emitterID);
            pkg.emitter.emit = false;
            if (cleanup) {
                pkg.emitter.cleanup();
            }
        }
        mutateConfigs(particleConfigJSONS) {
            for (let json of particleConfigJSONS.values()) {
                // first, sanity checks / overrides for our game engine
                json.emit = false;
                json.autoUpdate = false;
            }
        }
        // once we have some on/off logic running (right not onClear called
        // before first scene so turns all off immediately)
        // @override
        // public onClear(): void {
        // 	// disable + cleanup all
        // 	for (let eid of this.emitters.keys()) {
        // 		this.disable(eid, true);
        // 	}
        // }
        update(delta, entities) {
            // get player pos
            let playerPos = null;
            let player = this.ecs.getSystem(System.PlayerSelector).latest().next().value;
            if (player != null) {
                playerPos = this.ecs.getComponents(player).get(Component.Position).p;
            }
            for (let pkg of this.emitters.values()) {
                pkg.emitter.update(delta * 0.001);
                if (playerPos != null) {
                    pkg.emitter.spawnPos.set(playerPos.x, playerPos.y);
                }
            }
        }
    }
    System.ParticleRenderer = ParticleRenderer;
})(System || (System = {}));
/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="../core/base.ts" />
var Typography;
(function (Typography) {
    function convertTextSpec(textSpec, overrideText) {
        return {
            text: overrideText || textSpec.text || '<WHOOPS UNSET>',
            style: clone(textSpec.style),
            anchor: (textSpec.anchor ? Point.from(textSpec.anchor) : new Point(0.5, 0.5)),
            alpha: (textSpec.alpha != null ? textSpec.alpha : 1),
        };
    }
    Typography.convertTextSpec = convertTextSpec;
})(Typography || (Typography = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/typography.ts" />
var Component;
(function (Component) {
    /**
     * TextRenderable denotes entities that should be rendered as text. Only
     * bare bones info is given here (not even sure it belongs in ECS); the
     * system that renders it will turn it into all the necessary properties.
     */
    class TextRenderable extends Engine.Component {
        constructor(textData, displayData) {
            super();
            this.textData = textData;
            this.displayData = displayData;
        }
    }
    Component.TextRenderable = TextRenderable;
})(Component || (Component = {}));
/// <reference path="../system/audio.ts" />
/// <reference path="../graphics/anim.ts" />
/// <reference path="../graphics/typography.ts" />
/// <reference path="../component/position.ts" />
var GUI;
(function (GUI) {
    let AssetType;
    (function (AssetType) {
        AssetType[AssetType["Text"] = 0] = "Text";
        AssetType[AssetType["Sprite"] = 1] = "Sprite";
    })(AssetType = GUI.AssetType || (GUI.AssetType = {}));
    /**
     * Note: If it's weird to refer to a component here, can move into the
     * system.
     */
    function convertPositionSpec(spec, overridePos) {
        let pos = new Point();
        let angle = 0;
        if (spec != null) {
            pos.setFrom_(spec.position);
            angle = spec.rotation || 0;
        }
        if (overridePos != null) {
            pos.copyFrom_(overridePos);
        }
        return new Component.Position(pos, angle);
    }
    GUI.convertPositionSpec = convertPositionSpec;
})(GUI || (GUI = {}));
/// <reference path="../core/tween.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/gui.ts" />
var Component;
(function (Component) {
    class Tweenable extends Engine.Component {
        constructor() {
            super(...arguments);
            /**
             * Write to this to enqueue tweens. A system performing tweens will
             * dequeue from it and make the tween happen.
             */
            this.tweenQueue = [];
            /**
             * Set this flag to request that all tweens (ongoing and waiting) are
             * cleared. A system performing tweens will read it and reset it, and
             * (hopefully) clear its ongoing tweens as a result.
             *
             * Note that by settings this, you're asking the tweens to be just
             * completely dropped; in other words, their target values won't
             * reached.
             */
            this.clear = false;
            /**
             * True values for tween-able settings. Tweening system should write to
             * this, and renderers will read from it.
             */
            this.groundTruth = {
                alpha: 1.0,
                color: 16777215,
            };
        }
    }
    Component.Tweenable = Tweenable;
})(Component || (Component = {}));
/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="../core/lang.ts" />
/// <reference path="../core/tween.ts" />
/// <reference path="../core/util.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/text-renderable.ts" />
/// <reference path="../component/tweenable.ts" />
var System;
(function (System) {
    class TextRendererAspect extends Engine.Aspect {
    }
    class TextRenderer extends Engine.System {
        constructor(stage, gameScale, translator) {
            super();
            this.stage = stage;
            this.gameScale = gameScale;
            this.translator = translator;
            this.cachePos = new Point();
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.TextRenderable.name,
            ]);
        }
        makeAspect() {
            return new TextRendererAspect();
        }
        /**
         * Applies scale to positions and sizes of the aspect. The "raw" data
         * is held in components (Position, TextRenderable, ...) and the
         * upscaled values will be held in the actual display object.
         */
        applyScale(aspect) {
            let pos = aspect.get(Component.Position);
            let tr = aspect.get(Component.TextRenderable);
            // scale pos
            this.cachePos.copyFrom_(pos.p).scale_(this.gameScale);
            // if the obj is in the world coordinate system, figure out the
            // world coordinates that correspond to the desired HUD coordinates
            if (tr.displayData.stageTarget === StageTarget.World) {
                this.translator.HUDtoWorld(this.cachePos);
            }
            aspect.dobj.position.set(this.cachePos.x, this.cachePos.y);
            aspect.dobj.rotation = angleFlip(pos.angle);
            // style
            let textRenderable = aspect.get(Component.TextRenderable);
            let base = textRenderable.textData.style;
            let target = aspect.dobj.style;
            let props = ['fontSize', 'dropShadowDistance'];
            for (let prop of props) {
                if (base[prop] != null && (typeof base[prop] === 'number')) {
                    target[prop] = base[prop] * this.gameScale;
                }
            }
        }
        onAdd(aspect) {
            // Do conversion, create resources, save to aspect.
            let textRenderable = aspect.get(Component.TextRenderable);
            let gameText = new Stage.GameText(textRenderable.textData.text, textRenderable.textData.style, textRenderable.displayData.z, textRenderable.displayData.stageTarget);
            gameText.anchor.set(textRenderable.textData.anchor.x, textRenderable.textData.anchor.y);
            gameText.alpha = textRenderable.textData.alpha;
            aspect.dobj = gameText;
            // Game scale-aware mutations.
            this.applyScale(aspect);
            // Pre-bookkeep starting values. (NOTE: this, as in GUI Sprite, is gross b/c of the
            // ordering requirement w/ the Tweenable component).
            if (aspect.has(Component.Tweenable)) {
                let tweenable = aspect.get(Component.Tweenable);
                tweenable.groundTruth.alpha = textRenderable.textData.alpha;
                tweenable.groundTruth.color = parseInt(textRenderable.textData.style.fill.slice(1), 16);
            }
            // Send aspect display obj to outer renderer.
            this.stage.add(aspect.dobj);
        }
        onRemove(aspect) {
            this.stage.remove(aspect.dobj);
        }
        update(delta, entities) {
            for (let aspect of entities.values()) {
                // Copy in latest settings.
                // Game scale-aware mutations.
                this.applyScale(aspect);
                // If this is tweenable, read settings from it.
                if (aspect.has(Component.Tweenable)) {
                    let tweenable = aspect.get(Component.Tweenable);
                    // NOTE: consider eventually refactoring with GUI sprite
                    // renderer.
                    aspect.dobj.alpha = tweenable.groundTruth.alpha;
                    aspect.dobj.style.fill = tweenable.groundTruth.color;
                }
            }
        }
    }
    __decorate([
        override
    ], TextRenderer.prototype, "makeAspect", null);
    __decorate([
        override
    ], TextRenderer.prototype, "onAdd", null);
    __decorate([
        override
    ], TextRenderer.prototype, "onRemove", null);
    System.TextRenderer = TextRenderer;
})(System || (System = {}));
/// <reference path="../core/base.ts" />
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    /**
     * Tracker denotes an entity that tracks the position of another entity (the
     * `target`).
     */
    class Tracker extends Engine.Component {
        /**
         *	target			   --- the thing to track. Tracks at its center.
         *
         *	offset			   --- offset that the Tracker's location is
         *						   positioned relative to the target's computed
         *						   origin
         *
         *	trackRotation	   --- if set, `offset` will be computed relative to
         *						   the target's rotation.
         *
         *	internalOffset	   --- the final offset that will be applied to make
         *						   this entity line up as desired (e.g., make
         *						   something besides its center its center
         *						   track)
         */
        constructor(target, offset = new Point(), trackRotation = true, internalOffset = new Point()) {
            super();
            this.target = target;
            this.trackRotation = trackRotation;
            this.offset = offset.copy();
            this.internalOffset = internalOffset.copy();
        }
        toString() {
            return 'target: ' + this.target +
                ', offset: ' + this.offset +
                ', trackRot: ' + this.trackRotation +
                ', internalOffset: ' + this.internalOffset;
        }
    }
    Component.Tracker = Tracker;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/tracker.ts" />
var System;
(function (System) {
    class Tracking extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.Tracker.name,
            ]);
            this.cacheP = new Point();
        }
        update(delta, entities) {
            let offset = this.cacheP;
            for (let aspect of entities.values()) {
                // extract
                let position = aspect.get(Component.Position);
                let tracker = aspect.get(Component.Tracker);
                let targetComps = this.ecs.getComponents(tracker.target);
                // sanity check in case target went out of scope
                if (targetComps == null) {
                    continue;
                }
                let targetPos = targetComps.get(Component.Position);
                // compute offset
                offset.set_(0, 0);
                if (!tracker.trackRotation) {
                    // the offset doesn't track rotation
                    offset.copyFrom_(tracker.offset);
                }
                else {
                    // the offset tracks rotation. when rotated, both (x and y)
                    // components of the offset contribute to each of the (x and
                    // y) directions.
                    let a = targetPos.angle;
                    let aPrime = a - Constants.HALF_PI;
                    offset.set_(Math.cos(a) * tracker.offset.x + Math.cos(aPrime) * tracker.offset.y, -Math.sin(a) * tracker.offset.x + -Math.sin(aPrime) * tracker.offset.y);
                    position.angle = targetPos.angle;
                }
                // save
                position.p = offset.add_(targetPos.p).add_(tracker.internalOffset);
            }
        }
    }
    System.Tracking = Tracking;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    /**
     * Denotes an entity that can execute combo attacks. Flag is set by Combo
     * System and read by Swing system.
     */
    class Comboable extends Engine.Component {
        /**
         * @param hits How many hits it takes to have a combo
         * @param consecutiveWindow Allowed time between consecutive hits
         * @param activeWindow How long combo is active after conditions met
         */
        constructor(hits, consecutiveWindow, activeWindow) {
            super();
            this.hits = hits;
            this.consecutiveWindow = consecutiveWindow;
            this.activeWindow = activeWindow;
            this.comboReady = false;
            this.attacks = [];
        }
        toString() {
            return 'ready: ' + (this.comboReady ? Constants.CHECKMARK : Constants.XMARK);
        }
    }
    Component.Comboable = Comboable;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/attack.ts" />
/// <reference path="../component/comboable.ts" />
var System;
(function (System) {
    /**
     * Tracks attacks to track Combo-able entities' combo status.
    */
    class Combo extends Engine.System {
        constructor(comboables) {
            super();
            this.comboables = comboables;
            this.componentsRequired = new Set([
                Component.Attack.name,
                Component.FromComboable.name,
            ]);
        }
        elapsed(attack) {
            if (attack.startTime === -1) {
                return 0;
            }
            return this.ecs.gametime - attack.startTime;
        }
        check(comboable) {
            // condition 5: num hits (keeping <= this num handled in insertion)
            if (comboable.attacks.length !== comboable.hits) {
                return false;
            }
            // edge case: if 0 for some reason, we just say always yes (can't
            // compute any durations with this)
            if (comboable.attacks.length === 0) {
                return true;
            }
            // most recent attack in back. if that's out of the active window,
            // we know combo can't be ready.
            let latestAttack = comboable.attacks[comboable.attacks.length - 1];
            let latestElasped = this.elapsed(latestAttack);
            if (latestElasped > comboable.activeWindow) {
                return false;
            }
            // check through all attacks. if any didn't hit, or were out of the
            // consecutive window, combo conditions aren't fulfilled. (latest
            // attack trivially passes consecutive window check as it will have
            // 0 diff w/ itself.)
            let recentElapsed = latestElasped;
            for (let i = comboable.attacks.length - 1; i >= 0; i--) {
                let cur = comboable.attacks[i];
                if (!cur.hit) {
                    return false;
                }
                let curElapsed = this.elapsed(cur);
                if (curElapsed - recentElapsed > comboable.consecutiveWindow) {
                    return false;
                }
                recentElapsed = curElapsed;
            }
            // all conditions passed: comboable ready
            return true;
        }
        // five criteria:
        //	- [x] 1. consecutive hits
        //	- [x] 2. consecutive window
        //	- [x] 3. active window
        //	- [x] 4. quick attacks only
        //	- [x] 5. #hits fulfilled
        update(delta, entities) {
            // cycle through attacks
            for (let [entity, aspect] of entities.entries()) {
                let attack = this.ecs.getComponents(entity).get(Component.Attack);
                // we are only concerend with sword quick attacks (for now)
                // (condition 4). (add non-hitting ones so we can track them
                // and cancel combos)
                if (attack.info.attackType !== Weapon.AttackType.Quick) {
                    continue;
                }
                // we are only concerned with attacks whose attackers are
                // combo'able
                let attacker = attack.attacker;
                let attackerComps = this.ecs.getComponents(attack.attacker);
                if (attackerComps == null || !attackerComps.has(Component.Comboable)) {
                    continue;
                }
                let comboable = attackerComps.get(Component.Comboable);
                // check to see whether this attack is tracked already. add it
                // to the back if not, and prune any extras.
                if (comboable.attacks.indexOf(attack) === -1) {
                    comboable.attacks.push(attack);
                    while (comboable.attacks.length > comboable.hits) {
                        comboable.attacks.splice(0, 1);
                    }
                }
            }
            // now, we want to update all comboable attackers regardless of
            // whether we saw any attacks.
            // for (let )
            for (let entity of this.comboables.latest()) {
                let comboable = this.ecs.getComponents(entity).get(Component.Comboable);
                // check remaining conditions
                comboable.comboReady = this.check(comboable);
            }
        }
    }
    System.Combo = Combo;
})(System || (System = {}));
/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="../../lib/pixi-layers.d.ts" />
/// <reference path="../../lib/pixi-packer-parser.d.ts" />
/// <reference path="game.ts" />
/// <reference path="../core/keyboard.ts" />
/// <reference path="../core/mouse.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../engine/events.ts" />
/// <reference path="../engine/saving.ts" />
/// <reference path="../system/audio.ts" />
/// <reference path="../graphics/stage.ts" />
/// <reference path="../gj7/sound.ts" />
/// <reference path="../gj7/conversion.ts" />
/// <reference path="../system/ai-cow.ts" />
/// <reference path="../system/ai-brawler.ts" />
/// <reference path="../system/activity.ts" />
/// <reference path="../system/attack.ts" />
/// <reference path="../system/block.ts" />
/// <reference path="../system/body.ts" />
/// <reference path="../system/animation-renderer.ts" />
/// <reference path="../system/collision-block.ts" />
/// <reference path="../system/collision-damage.ts" />
/// <reference path="../system/collision-movement.ts" />
/// <reference path="../system/collision-detection.ts" />
/// <reference path="../system/crosshair.ts" />
/// <reference path="../system/debug.ts" />
/// <reference path="../system/defend.ts" />
/// <reference path="../system/debug-camera.ts" />
/// <reference path="../system/debug-collision-renderer.ts" />
/// <reference path="../system/debug-timing-renderer.ts" />
/// <reference path="../system/follow-camera.ts" />
/// <reference path="../system/movement.ts" />
/// <reference path="../system/player-input.ts" />
/// <reference path="../system/selector.ts" />
/// <reference path="../system/static-renderer.ts" />
/// <reference path="../system/stagger.ts" />
/// <reference path="../system/knockback.ts" />
/// <reference path="../system/swing.ts" />
/// <reference path="../system/particle-renderer.ts" />
/// <reference path="../system/text-renderer.ts" />
/// <reference path="../system/tracking.ts" />
/// <reference path="../system/combo.ts" />
// for debugging
let g;
var Game;
(function (Game) {
    let baseRes = new Point(640, 360);
    function getResConfig(scale) {
        return {
            viewport: baseRes.copy().scale_(scale),
            gamescale: scale,
            zoom: 0.3 * scale,
        };
    }
    let userConfig = {
        resScale: 2,
    };
    function setRes(resNum) {
        // set the scale
        userConfig.resScale = resNum;
        // update the buttons
        for (let i = 1; i <= 6; i++) {
            let className = resNum == i ? 'resButton active' : 'resButton';
            let el = document.getElementById('res' + i);
            if (el != null) {
                el.className = className;
            }
        }
    }
    Game.setRes = setRes;
    /**
     * Must be activated by user gesture.
     *
     * @param el the element to take fulscreen. (not typing because typescript
     * gets mad about such unpure things like cross browser compat stuff.)
     */
    function openFullscreen(el) {
        if (el.requestFullscreen) {
            el.requestFullscreen();
        }
        else if (el.mozRequestFullScreen) { /* Firefox */
            el.mozRequestFullScreen();
        }
        else if (el.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            el.webkitRequestFullscreen();
        }
        else if (el.msRequestFullscreen) { /* IE/Edge */
            el.msRequestFullscreen();
        }
    }
    class Sandbox3 {
        constructor(config, updateStats, renderStats) {
            this.config = config;
            this.updateStats = updateStats;
            this.renderStats = renderStats;
            // game-scoped vars: suff we can make now
            this.stage = new Stage.MainStage();
            this.eventsManager = new Events.Manager();
            this.ecs = new Engine.ECS(this.eventsManager);
            this.scriptRunner = new Script.Runner(this.ecs, this.eventsManager);
            this.particleJSONS = new Map();
            this.mode = this.config.mode === 'release' ? Game.Mode.RELEASE : Game.Mode.DEBUG;
        }
        /**
         * In main.ts, the overall config.json is loaded. That tells us a bunch
         * of additional resources to load. Here, we load them all.
         */
        load2(ready) {
            // save for later --- we'll signal when we're done
            this.r = ready;
            // queue up loading of all subconfigs
            for (let key in this.config.subConfigs) {
                let fn = this.config.subConfigs[key];
                PIXI.loader.add(fn, fn);
            }
            // single sheet with texture packer: load single sheet (loading json
            // triggers loading texture)
            // let fn = 'assets/sheets/sheet.json'
            // PIXI.loader.add(fn, fn);
            // multi sheet with pixi packer and parser. This add spritesheet parsing
            // middleware and loads up json, which triggers loading all textures.
            PIXI.loader.use(pixiPackerParser(PIXI));
            let fn = 'assets/new-sheets/main_en_full.json';
            PIXI.loader.add(fn, fn);
            // kick off loading
            PIXI.loader.once('complete', this.parse, this);
            PIXI.loader.onProgress.detachAll();
            PIXI.loader.onProgress.add((loader) => {
                // console.log('Loader 2: ' + loader.progress);
                let pMin = 5;
                let pMax = 30;
                let val = Math.round(pMin + pMax * (loader.progress / 100));
                document.getElementById('progressBar').setAttribute('value', '' + val);
                document.getElementById('loading').innerText = 'Loading Fallgate [' + val + '%]';
            });
            PIXI.loader.load();
        }
        parse(loader, resources) {
            this.parseConfigs(resources);
            this.parseGamemap(resources);
            this.load3();
        }
        parseConfigs(resources) {
            this.subConfigs = {
                attributes: Conversion.jsonToAttributes(resources[this.config.subConfigs.attributes].data),
                controls: resources[this.config.subConfigs.controls].data,
                credits: resources[this.config.subConfigs.credits].data,
                factory: resources[this.config.subConfigs.factory].data,
                fx: Conversion.jsonToFXConfigs(resources[this.config.subConfigs.fx].data),
                gui: resources[this.config.subConfigs.gui].data,
                instructions: resources[this.config.subConfigs.instructions].data,
                particles: resources[this.config.subConfigs.particles].data,
                progression: resources[this.config.subConfigs.scenes].data.progression,
                scenes: Conversion.jsonToScenes(resources[this.config.subConfigs.scenes].data.scenes),
                seasons: Conversion.jsonToSeasons(resources[this.config.subConfigs.seasons].data),
                shields: Conversion.jsonToShields(resources[this.config.subConfigs.shields].data),
                sounds: Conversion.jsonToSounds(resources[this.config.subConfigs.sounds].data),
                weapons: Conversion.jsonToWeapons(resources[this.config.subConfigs.weapons].data),
            };
        }
        parseGamemap(resources) {
            this.gm = new GameMap.GameMap(this.ecs, this.subConfigs.weapons, this.subConfigs.shields, this.subConfigs.attributes);
            // deprecated: parse map as one blob
            // this.gm.parseMap(resources[this.config.mapJson].data);
            // new: parse factory now, then parse objects later (in scene)
            this.gm.parseFactory(this.subConfigs.factory);
        }
        /**
         * Some config files (like the map or particles) have yet more config
         * files that they specify. Hence, we do a third round of loading.
         */
        load3() {
            // load json and pngs for scenes. We track what we request for
            // bookkeeping becacuse PIXI's loader doesn't seem to have a  "has"
            // method, but it crashes if you add something twice.
            let requested = new Set();
            for (let scene of this.subConfigs.scenes.values()) {
                let assets = [
                    scene.map.json,
                    scene.map.bottom,
                    scene.map.top,
                    scene.blueprint,
                ];
                if (scene.map.bottom_tiles != null) {
                    for (let tile of scene.map.bottom_tiles) {
                        assets.push(tile.img);
                    }
                }
                if (scene.map.top_tiles != null) {
                    for (let tile of scene.map.top_tiles) {
                        assets.push(tile.img);
                    }
                }
                for (let asset of assets) {
                    if (asset == null || asset.length === 0 || requested.has(asset)) {
                        continue;
                    }
                    PIXI.loader.add(asset, asset);
                    requested.add(asset);
                }
            }
            // also load individual particle config jsons
            for (let emitterID in this.subConfigs.particles) {
                let pjson = this.subConfigs.particles[emitterID].config;
                if (requested.has(pjson)) {
                    continue;
                }
                PIXI.loader.add(pjson, pjson);
                requested.add(pjson);
                this.particleJSONS.set(pjson, null);
            }
            // kick it off
            PIXI.loader.once('complete', this.parseLoad3, this);
            PIXI.loader.onProgress.detachAll();
            PIXI.loader.onProgress.add((loader) => {
                // console.log('Loader 3: ' + loader.progress);
                let pMin = 35;
                let pMax = 65;
                let val = Math.round(pMin + pMax * (loader.progress / 100));
                document.getElementById('progressBar').setAttribute('value', '' + val);
                document.getElementById('loading').innerText = 'Loading Fallgate [' + val + '%]';
            });
            PIXI.loader.load();
        }
        parseLoad3(loader, resources) {
            // note that we'll load in the first scene later
            this.sceneManager = new Scene.Manager(this.ecs, this.scriptRunner, this.gm, this.subConfigs.scenes, this.subConfigs.seasons, this.subConfigs.progression, this.subConfigs.credits, resources, this.mode);
            // save contents of individual particle config JSON files.
            for (let pjson of mapKeyArr(this.particleJSONS)) {
                this.particleJSONS.set(pjson, resources[pjson].data);
            }
            // this kicks off audio to do its own loading
            this.audio = new System.Audio(this.subConfigs.sounds).load();
            // yay done ready to build game
            this.makeStartButton();
        }
        makeStartButton() {
            // remove loading sign / progress bar.
            document.getElementById('loading').remove();
            document.getElementById('progressBar').remove();
            // add start game button
            let startButton = document.createElement('button');
            startButton.className = 'startButton';
            startButton.innerText = 'Start game';
            startButton.onclick = (mouseEvent) => {
                this.maybeStartGame();
            };
            let loader = document.getElementById('loader');
            loader.appendChild(document.createElement('br'));
            loader.appendChild(startButton);
        }
        maybeStartGame() {
            // fade out all loader content
            // NOTE: doesn't work. maybe chrome chugging too hard.
            // document.getElementById('loader').style.opacity = "0";
            // kick off game
            this.setup();
        }
        /**
         * Called once loading is complete and user has provided sufficient
         * settings to build the game!
         */
        setup() {
            // get corresponding config for game mode
            let resConfig = getResConfig(userConfig.resScale);
            // PIXI setup
            this.pixi_renderer = PIXI.autoDetectRenderer(resConfig.viewport.x, resConfig.viewport.y, {
                backgroundColor: Constants.BGColor
            });
            // Remove loading / setup HTML elements
            document.getElementById('loader').remove();
            // Add HTML elements for web renderer and debug reports.
            this.pixi_renderer.view.className = 'game';
            this.pixi_renderer.view.id = 'game';
            let gameParent = document.getElementById('gameParent');
            gameParent.appendChild(this.pixi_renderer.view);
            // sound effects toggle
            let musicButton = document.createElement('button');
            musicButton.className = 'fsButton';
            musicButton.innerText = 'Toggle music';
            musicButton.onclick = (ev) => {
                this.ecs.getSystem(System.Audio).toggleMusic();
            };
            gameParent.appendChild(musicButton);
            // sound effects toggle
            let effectsButton = document.createElement('button');
            effectsButton.className = 'fsButton';
            effectsButton.innerText = 'Toggle sound effects';
            effectsButton.onclick = (ev) => {
                this.ecs.getSystem(System.Audio).toggleEffects();
            };
            gameParent.appendChild(effectsButton);
            // speedrun timer (!)
            let srButton = document.createElement('button');
            srButton.className = 'fsButton';
            srButton.innerText = 'Toggle speedrun timer';
            srButton.onclick = (ev) => {
                this.ecs.toggleSystem(System.BookkeeperRenderer);
            };
            gameParent.appendChild(srButton);
            // clear save data
            let saveClearButton = document.createElement('button');
            saveClearButton.className = 'fsButton';
            saveClearButton.innerText = 'Clear save data';
            saveClearButton.onclick = (ev) => {
                if (confirm("Are you sure you want to clear your Fallgate save data?\n\n" +
                    "This will will remove all of your progress through the game.\n\n" +
                    "If you choose OK, you can then reload the game to start over.")) {
                    this.ecs.getSystem(System.GUIManager).runSequence('notification', new Map([['notification', 'save data cleared']]));
                    Saving.clear();
                }
            };
            gameParent.appendChild(saveClearButton);
            // full screen
            let fsButton = document.createElement('button');
            fsButton.className = 'fsButton';
            fsButton.innerText = 'Open in fullscreen';
            fsButton.onclick = (ev) => {
                openFullscreen(this.pixi_renderer.view);
            };
            gameParent.appendChild(fsButton);
            // extra panels (and global game ref) added in debug mode only
            let cheapCollPanel = null;
            let expensiveCollPanel = null;
            if (this.mode == Game.Mode.DEBUG) {
                // setup
                let statsParent = document.getElementById('statsRow');
                // render and update panels
                let panels = [this.updateStats, this.renderStats];
                for (let p of panels) {
                    p.dom.className = 'stats';
                    p.dom.style.position = 'relative'; // override hardcode
                    statsParent.appendChild(p.dom);
                }
                // Add addl. debug stats panels
                let customStats = new Stats();
                cheapCollPanel = customStats.addPanel(new Stats.Panel('cCks', '#f8f', '#212'));
                expensiveCollPanel = customStats.addPanel(new Stats.Panel('xCks', '#ff8', '#221'));
                customStats.showPanel(3);
                customStats.dom.className = 'stats';
                customStats.dom.style.position = 'relative'; // override hardcode
                statsParent.appendChild(customStats.dom);
            }
            // TODO: move back to debug-only.
            // give the console a reference to the game
            g = this;
            // Prevent right click even so we can correctly handle right mouse
            // button events.
            let gameEl = document.getElementById('game');
            gameEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
            // Time measurement.
            if (this.mode == Game.Mode.DEBUG) {
                this.clockCentral = new Measurement.ClockCentral();
            }
            else {
                this.clockCentral = new Measurement.FakeClockTower();
            }
            this.clockCentral.init();
            // disable pixi's interaction manager, which causes both pixi's
            // ticks to fire AND expensive object traversals when it intercepts
            // mouse events.
            let im = this.pixi_renderer.plugins.interaction;
            im.destroy();
            // init our events manager
            this.eventsManager.init(this.ecs, this.scriptRunner);
            // common resources for systems
            let world = this.stage.camera_get(StageTarget.World);
            let hud = this.stage.camera_get(StageTarget.HUD);
            let translator = new Stage.Translator(hud, world, resConfig.viewport.copy(), resConfig.gamescale);
            let keyboard = new Keyboard(this.eventsManager);
            let mouse = new Mouse(resConfig.viewport.copy());
            // Set up lighting layer and texture it renders to. Lightbulbs are
            // added later.
            //
            // lightingLayer = Layer (container)
            // - internally, lights should be ADD'ed (blend mode)
            // - renders to a texture
            // - clear color set to grey (overall darkening color)
            //
            // lightingSprite = Sprite (rendered view of lights layer)
            // - uses render texture of lighting layer
            // - should be MULTIPLY'd with the world to light it
            //
            // lightbulb = Graphics|Sprite (light source)
            // - parentLayer must be set to lighting so it becomes a light
            // - must be ALSO added to a container (addChild) so it is visible
            // - both of the above are required for it to function as a light
            //   (!)
            let lightingLayer = new Stage.Layer(ZLevelHUD.Lighting, StageTarget.HUD);
            lightingLayer.on('display', function (el) {
                el.blendMode = PIXI.BLEND_MODES.ADD;
            });
            lightingLayer.useRenderTexture = true;
            lightingLayer.clearColor = [0.5, 0.5, 0.5, 1];
            this.stage.add(lightingLayer);
            let lightingSprite = new Stage.Sprite(lightingLayer.getRenderTexture(), ZLevelHUD.Lighting, StageTarget.HUD);
            lightingSprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;
            this.stage.add(lightingSprite);
            // set default zoom level
            world.scale.set(resConfig.zoom, resConfig.zoom);
            // make systems! note that priorities here don't affect render order
            // (which has its own mapping via z stages and z levels)
            let debugDefaultDisabled = true;
            // libs (not really systems; don't do per-frame updates; just
            // provide APIs)
            let delaySpeaker = new System.DelaySpeaker();
            let gui = new System.GUIManager(this.subConfigs.gui, delaySpeaker);
            this.ecs.addSystem(5, delaySpeaker);
            this.ecs.addSystem(5, gui);
            // subsystems
            let inputKeyboard = new System.InputKeyboard(keyboard);
            let inputMouse = new System.InputMouse(mouse, hud, world);
            let inputGamepad = new System.InputGamepad();
            let playerSelector = new System.PlayerSelector();
            let enemySelector = new System.EnemySelector();
            let zoneSelector = new System.ZoneSelector();
            let comboableSelector = new System.ComboableSelector();
            let gateSelector = new System.GateSelector();
            let spawnableSelector = new System.SpawnableSelector();
            let itemSelector = new System.ItemSelector();
            let checkpointSelector = new System.CheckpointSelector();
            let staticRenderableSelector = new System.StaticRenderableSelector();
            this.ecs.addSystem(5, inputKeyboard);
            this.ecs.addSystem(5, inputMouse);
            this.ecs.addSystem(5, inputGamepad);
            this.ecs.addSystem(5, playerSelector);
            this.ecs.addSystem(5, enemySelector);
            this.ecs.addSystem(5, zoneSelector);
            this.ecs.addSystem(5, comboableSelector);
            this.ecs.addSystem(5, gateSelector);
            this.ecs.addSystem(5, spawnableSelector);
            this.ecs.addSystem(5, itemSelector);
            this.ecs.addSystem(5, checkpointSelector);
            this.ecs.addSystem(5, staticRenderableSelector);
            // input/ai -- affect entity state (idle vs moving)
            // this.ecs.addSystem(10, new System.PlayerInputWSAD(inputKeyboard));
            this.ecs.addSystem(10, new System.PlayerInputMouseKeyboard(inputMouse, inputKeyboard, inputGamepad, enemySelector));
            this.ecs.addSystem(10, new System.Pause(keyboard));
            // this.ecs.addSystem(10, new System.ControlsScreen(this.stage, viewportSize));
            // this.ecs.addSystem(10, new System.AICow());
            // this.ecs.addSystem(10, new System.AIArcher(aiGameState));
            // this.ecs.addSystem(10, new System.AIBrawler(playerSelector));
            this.ecs.addSystem(10, new System.AISystem(playerSelector));
            if (this.mode == Game.Mode.DEBUG) {
                this.ecs.addSystem(10, new System.Debug(keyboard));
                this.ecs.addSystem(10, new System.DebugGameSpeed(keyboard));
                this.ecs.addSystem(10, new System.DebugEntitySelector(inputMouse));
            }
            // always allowing level restarts due to potential softlocks and no
            // saving
            this.ecs.addSystem(10, new System.DebugSceneRestart(keyboard, this.sceneManager));
            // gamepad runs after mouse/keyboard because it will either
            // overwrite or leave alone the state set by them.
            this.ecs.addSystem(12, new System.PlayerInputGamepad(inputGamepad));
            // clean up unique-intended things
            if (this.mode == Game.Mode.DEBUG) {
                this.ecs.addSystem(15, new System.DebugInspectionUniquifier());
            }
            // process inputs that create new entities -- depend on entity state (reads stagger, death, each other)
            //										   -- modifies entity state (writes attack state, block state)
            this.ecs.addSystem(20, new System.Swing());
            this.ecs.addSystem(20, new System.Defend());
            // movements
            this.ecs.addSystem(40, new System.Tracking()); // must come after swing (positions attack objects)
            this.ecs.addSystem(40, new System.Movement());
            // detect collisions
            this.ecs.addSystem(45, new System.SpatialHash()); // must come before collision detection
            this.ecs.addSystem(50, new System.CollisionDetection(cheapCollPanel, expensiveCollPanel)); // must come after movement (to avoid sinking in objects)
            // resolve collisions -- affect entity state (writes stagger, death, blocked, recoil)
            this.ecs.addSystem(60, new System.CollisionMovement());
            this.ecs.addSystem(60, new System.CollisionBlock());
            this.ecs.addSystem(60, new System.CollisionZone());
            this.ecs.addSystem(60, new System.CollisionItem(this.gm));
            this.ecs.addSystem(60, new System.CollisionPhysicsRegion());
            this.ecs.addSystem(60, new System.CollisionProjectile());
            this.ecs.addSystem(60, new System.PersistentDamage());
            // damage collision happens after block
            this.ecs.addSystem(65, new System.CollisionDamage());
            // zone checking happens after zone collision
            this.ecs.addSystem(65, new System.EnemyZoneChecker());
            // timebombs -- affect entity state (writes stagger, recoil, blocked)
            this.ecs.addSystem(70, new System.Attack());
            this.ecs.addSystem(70, new System.Block());
            this.ecs.addSystem(70, new System.Blocked());
            this.ecs.addSystem(70, new System.Stagger());
            this.ecs.addSystem(70, new System.StaggerReturn());
            this.ecs.addSystem(70, new System.DamagedFlash());
            this.ecs.addSystem(70, new System.Recoil());
            this.ecs.addSystem(70, new System.Knockback());
            this.ecs.addSystem(70, new System.Immobile());
            this.ecs.addSystem(70, new System.Invincible());
            this.ecs.addSystem(70, new System.Bleeding());
            // other misc game logic
            this.ecs.addSystem(75, new System.Combo(comboableSelector));
            this.ecs.addSystem(75, new System.Death());
            // camera
            this.ecs.addSystem(80, new System.Zoom(world, resConfig.zoom));
            this.ecs.addSystem(80, new System.DebugCamera(keyboard, world, debugDefaultDisabled));
            this.ecs.addSystem(80, new System.FollowCamera(world, resConfig.viewport.copy(), this.sceneManager.infoProvider, zoneSelector));
            let fxCamera = new System.FxCamera(world);
            this.ecs.addSystem(82, fxCamera);
            // pre-rendering: determine part / partID matchups
            this.ecs.addSystem(85, new System.Activity());
            this.ecs.addSystem(87, new System.Body());
            // pre-rendering: tween!
            this.ecs.addSystem(89, new System.Tweener());
            // rendering
            let fxAnimations = new System.FxAnimations(this.gm, this.subConfigs.fx);
            this.ecs.addSystem(90, fxAnimations);
            this.ecs.addSystem(90, new System.Sparkle(this.gm));
            this.ecs.addSystem(90, new System.LockOn(this.stage));
            this.ecs.addSystem(90, new System.StaticRenderer(this.stage));
            this.ecs.addSystem(90, new System.AnimationRenderer(this.stage));
            this.ecs.addSystem(90, new System.Lighting(this.stage, translator, lightingLayer, resConfig.gamescale));
            this.ecs.addSystem(90, new System.EnemyHUDRenderer(gui, this.subConfigs.gui.sequences['enemyHUD'], translator, playerSelector));
            this.ecs.addSystem(90, new System.PlayerHUDRenderer());
            this.ecs.addSystem(90, new System.TextRenderer(this.stage, resConfig.gamescale, translator));
            this.ecs.addSystem(90, new System.GUISpriteRenderer(this.stage, resConfig.gamescale, translator));
            // sounds (audible... rendering?) and sounds+FX
            this.ecs.addSystem(90, new System.SoundsFootsteps());
            this.ecs.addSystem(90, this.audio);
            this.ecs.addSystem(90, new System.LowHealth());
            this.ecs.addSystem(90, new System.ParticleRenderer(world.getChildAt(world.mapping.get(ZLevelWorld.Particles)), this.subConfigs.particles, this.particleJSONS));
            // ticking animations (still part of rendering, but comes after
            // AnimationRenderer)
            this.ecs.addSystem(95, new System.AnimationTicker());
            this.ecs.addSystem(100, new System.CrosshairRenderer(inputMouse, this.stage));
            // debug rendering
            if (this.mode == Game.Mode.DEBUG) {
                // this.ecs.addSystem(100, new System.DebugPositionRenderer(this.stage, debugDefaultDisabled));
                this.ecs.addSystem(100, new System.DebugCollisionRenderer(this.stage, debugDefaultDisabled));
                // this.ecs.addSystem(100, new System.DebugComponentRenderer(this.stage));
                // create a two-col layout for rendering debug HTML components
                document.getElementById('gameContent').className = 'left';
                let debugCol = document.createElement('div');
                debugCol.id = 'debugColumn';
                debugCol.className = 'right';
                document.getElementById('contentParent').appendChild(debugCol);
                this.ecs.addSystem(100, new System.DebugHTMLComponents(debugCol));
                this.ecs.addSystem(100, new System.DebugInspectionRenderer(this.stage));
                this.ecs.addSystem(100, new System.DebugTimingRenderer(this.stage, this.clockCentral, resConfig.viewport.copy()));
            }
            // speedrun timer!
            this.ecs.addSystem(100, new System.BookkeeperRenderer(this.stage, resConfig.viewport.copy()));
            // libraries
            this.ecs.addSystem(110, new System.Bookkeeper());
            this.ecs.addSystem(110, new System.Fade(this.stage, resConfig.viewport.copy()));
            // event handlers
            this.eventsManager.add(new Handler.Camera(fxCamera));
            this.eventsManager.add(new Handler.TextHandler(translator, gui));
            this.eventsManager.add(new Handler.Checkpoint(this.gm));
            this.eventsManager.add(new Handler.Death(playerSelector, spawnableSelector));
            // this.eventsManager.add(new Handler.Debug());
            this.eventsManager.add(new Handler.SoundEffects(delaySpeaker));
            this.eventsManager.add(new Handler.SlowMotion());
            this.eventsManager.add(new Handler.Overlay());
            this.eventsManager.add(new Handler.FX(fxAnimations));
            this.eventsManager.add(new Handler.ExitConditionsComplete(gateSelector, zoneSelector, this.gm));
            this.eventsManager.add(new Handler.NextToExit());
            this.eventsManager.add(new Handler.ExitSequence(this.sceneManager));
            this.eventsManager.add(new Handler.LevelExiter(this.sceneManager));
            this.eventsManager.add(new Handler.GateManager());
            this.eventsManager.add(new Handler.Bookkeeping());
            this.eventsManager.add(new Handler.Instructions(this.subConfigs.instructions));
            this.eventsManager.add(new Handler.Controls(this.subConfigs.controls));
            this.eventsManager.add(new Handler.Control());
            this.eventsManager.add(new Handler.EndSequence(this.gm));
            if (this.mode == Game.Mode.DEBUG) {
                this.eventsManager.add(new Handler.ExitHandlerDev());
            }
            // modify core game stuff w/ systems that need crosstalk
            this.audio.boundsGetter = world;
            this.audio.viewportSize = resConfig.viewport.copy();
            // Tell scene manager to load any level progress that was saved, or just the
            // first level in the progression (which is the title sceen) if no save data
            // was found.
            let [sceneName, trackIDs, bookkeeperStr] = Saving.load();
            if (sceneName != null) {
                // we have to play the music first because otherwise the sceneManager
                // may load the lack of tracks, then immediately save them.
                if (trackIDs != null) {
                    this.ecs.getSystem(System.Audio).playMusic(trackIDs);
                }
                // load all stats
                this.ecs.getSystem(System.Bookkeeper).load(bookkeeperStr);
                this.sceneManager.switchToName(sceneName);
            }
            else {
                // First level.
                this.sceneManager.nextLevel();
            }
            // Start update loop.
            this.r.done();
            g = this;
        }
        /**
         * start (timer)
         * @param phase
         */
        s(phase) {
            this.clockCentral.start(Measurement.T_OVERALL, phase);
        }
        /**
         * end (timer)
         * @param phase
         */
        e(phase) {
            this.clockCentral.end(Measurement.T_OVERALL, phase);
        }
        update(wallDelta, rawGameDelta) {
            // TODO: use decorators for timing instead if possible
            // game logic
            this.s('update');
            let gameDelta = this.ecs.update(wallDelta, rawGameDelta, this.clockCentral);
            this.e('update');
            // TODO: should the below (events and scripts) respect the slowdown
            // that the ecs does to the game timestep w/ slowmotion? if so, it
            // should return the actual delta it used so the others below can
            // use the same thing.
            // events (so, more game logic)
            this.s('events');
            this.eventsManager.update(gameDelta);
            this.e('events');
            // scripts (so, more game logic)
            this.s('scripting');
            this.scriptRunner.update(gameDelta);
            this.e('scripting');
            // final game logic (cleanup of entites, etc.)
            this.s('cleanup');
            this.ecs.finishUpdate();
            this.e('cleanup');
            // rendering happens in the render() function. It should bookkeep
            // its own time there.
        }
        render() {
            // render
            this.s('render');
            this.stage.render(this.pixi_renderer);
            this.e('render');
        }
    }
    Game.Sandbox3 = Sandbox3;
})(Game || (Game = {}));
/// <reference path="../lib/stats.d.ts" />
/// <reference path="../lib/pixi.js.d.ts" />
/// <reference path="core/base.ts" />
/// <reference path="game/game.ts" />
/// <reference path="game/sandbox3.ts" />
/**
 * Where execution begins and where the main loop happens. This is currently
 * chrome-specific.
 */
var Main;
(function (Main) {
    class Ready {
        done() {
            // kick off both update and rendering
            setTimeout(update);
            requestAnimationFrame(render);
        }
    }
    class Preloader {
        constructor() {
            // global PIXI settings we set first
            PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
            // kick off the loading!
            let loader = PIXI.loader;
            loader.add(Constants.FN_CONFIG);
            loader.once('complete', this.launch, this);
            PIXI.loader.onProgress.detachAll();
            PIXI.loader.onProgress.add((loader) => {
                // console.log('Loader 1: ' + loader.progress);
                let pMin = 0;
                let pMax = 5;
                let val = Math.round(pMin + pMax * (loader.progress / 100));
                document.getElementById('progressBar').setAttribute('value', '' + val);
                document.getElementById('loading').innerText = 'Loading Fallgate [' + val + '%]';
            });
            loader.load();
        }
        launch(loader, config) {
            new Loop(config[Constants.FN_CONFIG].data);
        }
    }
    class Loop {
        constructor(config) {
            this.targetUpdate = 16.666;
            this.updateStats = new Stats();
            this.renderStats = new Stats();
            this.lastFrameStart = -1;
            Loop.instance = this;
            // This is where we pick the game to run.
            let ready = new Ready();
            this.game = new Game.Sandbox3(config, this.updateStats, this.renderStats);
            this.game.load2(ready);
        }
        /**
         * Main game update function. Called after `statsSkipFrames` frames and
         * forever after.
         */
        update() {
            let frameStart = (performance || Date).now();
            // track wall time for game systems that run when the ECS gametime
            // is frozen.
            let wallDelta = this.lastFrameStart != -1 ?
                frameStart - this.lastFrameStart :
                Constants.DELTA_MS;
            this.lastFrameStart = frameStart;
            // pre: start stats tracking
            this.updateStats.begin();
            // note: implement lag / catchup sometime later. need to measure
            // timing too if we want this.
            this.game.update(wallDelta, Constants.DELTA_MS);
            // post: tell stats done
            this.updateStats.end();
            // Pick when to run update again. Attempt to run every
            // `this.targetUpdate` ms, but if going too slow, just run as soon
            // as possible.
            let elapsed = (performance || Date).now() - frameStart;
            let nextDelay = Math.max(this.targetUpdate - elapsed, 0);
            setTimeout(update, nextDelay);
        }
        render() {
            this.renderStats.begin();
            this.game.render();
            this.renderStats.end();
            // as chrome to call this again
            requestAnimationFrame(render);
        }
    }
    /**
     * Update
     * @param ts timestamp
     */
    let update = function () {
        Loop.instance.update();
    };
    let render = function (ts) {
        Loop.instance.render();
    };
    // Execution begins here.
    new Preloader();
})(Main || (Main = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    class AnimationTickable extends Engine.Component {
    }
    Component.AnimationTickable = AnimationTickable;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/sound.ts" />
var Component;
(function (Component) {
    /**
     * Audible denotes that an entity has sound effects associated with it,
     * mapping from events it can undergo to Track IDs for what sounds to play.
     */
    class Audible extends Engine.Component {
        constructor(sounds) {
            super();
            this.sounds = clone(sounds);
        }
    }
    Component.Audible = Audible;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    class Bleeding extends Component.Timebomb {
        constructor(blood) {
            super(blood.duration, Destruct.Component);
            this.frequency = blood.frequency;
            this.fx = clone(blood.fx);
        }
    }
    Component.Bleeding = Bleeding;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    /**
     * Marks an entity as a checkpoint.
     */
    class Checkpoint extends Engine.Component {
        constructor(gateID) {
            super();
            this.gateID = gateID;
        }
    }
    Component.Checkpoint = Checkpoint;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="timebomb.ts" />
var Component;
(function (Component) {
    class DamagedFlash extends Component.Timebomb {
        constructor(duration) {
            super(duration, Destruct.Component);
            this.duration = duration;
        }
    }
    Component.DamagedFlash = DamagedFlash;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    /**
     * Inspect this entity.
     */
    class DebugInspection extends Engine.Component {
        /**
         *
         * @param pickTime game time when this debug inspection was picked
         * (done so systems can prune old ones)
         */
        constructor(pickTime) {
            super();
            this.pickTime = pickTime;
        }
    }
    Component.DebugInspection = DebugInspection;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    /**
     * So we know where in the factory.json this was specified.
     */
    class DebugKVLayer extends Engine.Component {
        constructor(layer) {
            super();
            this.layer = layer;
        }
        toString() {
            return this.layer;
        }
    }
    Component.DebugKVLayer = DebugKVLayer;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    /**
     * For debugging stuff we determined from a tile.
     */
    class DebugTileInfo extends Engine.Component {
        constructor(info) {
            super();
            this.info = info;
        }
        toString() { return this.info; }
    }
    Component.DebugTileInfo = DebugTileInfo;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    /**
     * Denotes destructible things.
     */
    class Destructible extends Engine.Component {
    }
    Component.Destructible = Destructible;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    /**
     * Denotes baddies.
     */
    class Enemy extends Engine.Component {
        constructor(settings) {
            super();
            /**
             * Denots whether the enemy has been zone checked
             */
            this.zoneChecked = false;
            /**
             * Denotes what Gate the entity is linked to, or null if none.
             */
            this.gateID = null;
            this.enemyName = Probability.uniformChoice(settings.names);
            this.kind = settings.kind;
            this.gatekeeper = settings.gatekeeper || false;
            this.boss = settings.boss || false;
            this.hudDisabled = settings.hudDisabled || false;
            this.finalBoss = settings.finalBoss || false;
        }
        toString() {
            return this.enemyName + ' (' + this.kind + ')' +
                ' boss: ' + (this.boss ? Constants.CHECKMARK : Constants.XMARK) +
                ' gatekeeper: ' + (this.gatekeeper ? Constants.CHECKMARK : Constants.XMARK) +
                ' zoneChecked: ' + (this.zoneChecked ? Constants.CHECKMARK : Constants.XMARK) +
                ' gateID: ' + this.gateID;
        }
    }
    Component.Enemy = Enemy;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    /**
     * This is gross; sorry. An attack from a Comboable attacker.
     */
    class FromComboable extends Engine.Component {
    }
    Component.FromComboable = FromComboable;
})(Component || (Component = {}));
/// <reference path="../core/base.ts" />
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    /**
     * Gates mark segment and level boundaries.
     */
    class Gate extends Engine.Component {
        constructor(start, exit, id) {
            super();
            this.start = start;
            this.exit = exit;
            this.id = id;
        }
        toString() {
            return 'id: ' + this.id +
                ', exit: ' + (this.exit ? Constants.CHECKMARK : Constants.XMARK) +
                ', start: ' + (this.start ? Constants.CHECKMARK : Constants.XMARK);
        }
    }
    Component.Gate = Gate;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/gui.ts" />
var Component;
(function (Component) {
    class GUISprite extends Engine.Component {
        constructor(baseSpec, displaySpec) {
            super();
            this.baseData = Anim.convertBaseSpec(baseSpec);
            this.displayData = Anim.convertDisplaySpec(displaySpec);
        }
    }
    Component.GUISprite = GUISprite;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="timebomb.ts" />
var Component;
(function (Component) {
    class Immobile extends Component.Timebomb {
        constructor(duration) {
            super(duration, Destruct.Component);
            this.duration = duration;
        }
    }
    Component.Immobile = Immobile;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="timebomb.ts" />
var Component;
(function (Component) {
    class Invincible extends Component.Timebomb {
        constructor(duration) {
            super(duration, Destruct.Component);
            this.duration = duration;
        }
    }
    Component.Invincible = Invincible;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/ontology.ts" />
var Component;
(function (Component) {
    /**
     * An Item Component  marks an entity as an item and denotes item
     * properties.
     */
    class Item extends Engine.Component {
        constructor(data) {
            super();
            this.data = data;
            this.behavior = data.classificiation;
            this.instructionID = data.instructionID;
            this.gateID = data.gateID;
        }
        toString() {
            return 'behavior: ' + Ontology.Item[this.behavior] +
                ', gateID: ' + this.gateID +
                ', instructionID: ' + this.instructionID;
        }
    }
    Component.Item = Item;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    class Knockbackable extends Engine.Component {
    }
    Component.Knockbackable = Knockbackable;
})(Component || (Component = {}));
var Graphics;
(function (Graphics) {
    let LightbulbSize;
    (function (LightbulbSize) {
        LightbulbSize[LightbulbSize["Small"] = 0] = "Small";
        LightbulbSize[LightbulbSize["Medium"] = 1] = "Medium";
        LightbulbSize[LightbulbSize["Large"] = 2] = "Large";
    })(LightbulbSize = Graphics.LightbulbSize || (Graphics.LightbulbSize = {}));
    function convertLightbulbSpec(spec) {
        // set default, and check enum conversion
        let size = 'Medium';
        if (spec.size != null) {
            size = spec.size;
        }
        let ls = LightbulbSize[size];
        if (ls == null) {
            throw new Error('Got invalid LightbulbSpec.size: "' + size + '"');
        }
        // set default, and perform hex string parsing
        let baseTint = '#FFFFFF';
        if (spec.baseTint != null) {
            baseTint = spec.baseTint;
        }
        let bt = parseInt(baseTint.slice(1), 16);
        // set default
        let flicker = spec.flicker || false;
        return {
            size: ls,
            baseTint: bt,
            flicker: flicker,
        };
    }
    Graphics.convertLightbulbSpec = convertLightbulbSpec;
})(Graphics || (Graphics = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/lighting.ts" />
var Component;
(function (Component) {
    class Lightbulb extends Engine.Component {
        constructor(specs) {
            super();
            this.configs = [];
            for (let spec of specs) {
                this.configs.push(Graphics.convertLightbulbSpec(spec));
            }
        }
    }
    Component.Lightbulb = Lightbulb;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    class PersistentDamage extends Engine.Component {
        constructor(attackInfo) {
            super();
            this.attackInfo = attackInfo;
        }
    }
    Component.PersistentDamage = PersistentDamage;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/physics.ts" />
var Component;
(function (Component) {
    /**
     * A physics region has some effect on things moving through it.
     */
    class PhysicsRegion extends Engine.Component {
        constructor(region) {
            super();
            this.region = clone(region);
        }
    }
    Component.PhysicsRegion = PhysicsRegion;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    class Sparkle extends Engine.Component {
    }
    Component.Sparkle = Sparkle;
})(Component || (Component = {}));
/// <reference path="../core/base.ts" />
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    /**
     * Marks where an entity should be respawned.
     */
    class Spawnable extends Engine.Component {
        constructor(position, angle = 0) {
            super();
            this.angle = angle;
            this.position = position.copy();
        }
    }
    Component.Spawnable = Spawnable;
})(Component || (Component = {}));
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    /**
     * Denotes something that can be staggered.
     */
    class Staggerable extends Engine.Component {
    }
    Component.Staggerable = Staggerable;
})(Component || (Component = {}));
/// <reference path="../core/base.ts" />
/// <reference path="../engine/ecs.ts" />
var Component;
(function (Component) {
    /**
     * Zones are where players trigger game logic.
     */
    class Zone extends Engine.Component {
        constructor(zoneSpec) {
            super();
            /**
             * Binary indicator of whether the player is in the zone.
             */
            this.containsPlayer = false;
            // convert and set.
            let zd = Logic.convertZoneSpec(zoneSpec);
            this.active = zd.active;
            this.zoneTypes = zd.zoneTypes;
            this.gateID = zd.gateID;
            this.instructionID = zd.instructionID;
            this.controlID = zd.controlID;
        }
        toString() {
            return 'active: ' + (this.active ? Constants.CHECKMARK : Constants.XMARK) +
                ', player: ' + (this.containsPlayer ? Constants.CHECKMARK : Constants.XMARK) +
                ', gateID: ' + this.gateID +
                ', instrID: ' + this.instructionID +
                ', ctrlID: ' + this.controlID;
        }
    }
    Component.Zone = Zone;
})(Component || (Component = {}));
// Debug colors. These are CSS color names' hex values, shuffled.
let DEBUG_COLORS = [
    '#4169e1',
    '#da70d6',
    '#6e6e6e',
    '#8b7d7b',
    '#0000ee',
    '#912cee',
    '#8b636c',
    '#ff3e96',
    '#b22222',
    '#fcfcfc',
    '#7a378b',
    '#8b5f65',
    '#adadad',
    '#6a5acd',
    '#eed8ae',
    '#8b8378',
    '#eeaeee',
    '#c1cdc1',
    '#00868b',
    '#76ee00',
    '#20b2aa',
    '#4876ff',
    '#404040',
    '#d2691e',
    '#c1ffc1',
    '#e0eee0',
    '#8a8a8a',
    '#8b3626',
    '#009acd',
    '#2f4f4f',
    '#cd3700',
    '#ffe4e1',
    '#3b3b3b',
    '#000000',
    '#551a8b',
    '#2e8b57',
    '#4f94cd',
    '#ff83fa',
    '#eed5b7',
    '#d8bfd8',
    '#8b1c62',
    '#000080',
    '#8c8c8c',
    '#7fffd4',
    '#eedfcc',
    '#6c7b8b',
    '#b23aee',
    '#faebd7',
    '#8b7d6b',
    '#eed2ee',
    '#cd6090',
    '#008b45',
    '#ff69b4',
    '#616161',
    '#ff7f24',
    '#008b00',
    '#708090',
    '#ffb5c5',
    '#aeeeee',
    '#707070',
    '#9c9c9c',
    '#b0e0e6',
    '#e0eeee',
    '#48d1cc',
    '#ee3a8c',
    '#6e7b8b',
    '#8a2be2',
    '#cd00cd',
    '#ffd700',
    '#858585',
    '#8b8b7a',
    '#8b0000',
    '#ee82ee',
    '#8b7b8b',
    '#cdc5bf',
    '#ffa54f',
    '#ffb6c1',
    '#6ca6cd',
    '#fff68f',
    '#e8e8e8',
    '#e9967a',
    '#9acd32',
    '#838b8b',
    '#9fb6cd',
    '#8b4513',
    '#cd950c',
    '#ffc1c1',
    '#878787',
    '#9370db',
    '#949494',
    '#ababab',
    '#cdb79e',
    '#607b8b',
    '#54ff9f',
    '#cccccc',
    '#bfbfbf',
    '#bebebe',
    '#27408b',
    '#ffd39b',
    '#a8a8a8',
    '#cd8500',
    '#c1cdcd',
    '#3d3d3d',
    '#474747',
    '#363636',
    '#ee9a00',
    '#cd5c5c',
    '#dedede',
    '#ffa07a',
    '#ee7942',
    '#cae1ff',
    '#98fb98',
    '#7fff00',
    '#9e9e9e',
    '#cdaf95',
    '#cd0000',
    '#00ced1',
    '#d3d3d3',
    '#f2f2f2',
    '#fafad2',
    '#cd9b1d',
    '#a4d3ee',
    '#f7f7f7',
    '#97ffff',
    '#2e2e2e',
    '#008b8b',
    '#828282',
    '#4a4a4a',
    '#0d0d0d',
    '#8b5742',
    '#00eeee',
    '#3cb371',
    '#ffefdb',
    '#d1eeee',
    '#96cdcd',
    '#030303',
    '#f5f5f5',
    '#ffa500',
    '#8b475d',
    '#b03060',
    '#b4eeb4',
    '#ffe7ba',
    '#ff7256',
    '#66cd00',
    '#454545',
    '#ee0000',
    '#8b2252',
    '#8b3a3a',
    '#eedd82',
    '#ffe4b5',
    '#d1d1d1',
    '#d2b48c',
    '#8b3a62',
    '#cd3333',
    '#292929',
    '#1e90ff',
    '#f5fffa',
    '#6b6b6b',
    '#ff4500',
    '#c71585',
    '#ee6a50',
    '#121212',
    '#b3b3b3',
    '#d9d9d9',
    '#00ee00',
    '#8fbc8f',
    '#cd853f',
    '#faf0e6',
    '#1c86ee',
    '#698b22',
    '#8b5a2b',
    '#4d4d4d',
    '#bcd2ee',
    '#7cfc00',
    '#dda0dd',
    '#545454',
    '#eec900',
    '#cd661d',
    '#8f8f8f',
    '#87cefa',
    '#4682b4',
    '#98f5ff',
    '#1a1a1a',
    '#dbdbdb',
    '#7ec0ee',
    '#838b83',
    '#7ccd7c',
    '#ffffff',
    '#b9d3ee',
    '#00cdcd',
    '#cd6839',
    '#cd9b9b',
    '#cd96cd',
    '#1c1c1c',
    '#7a67ee',
    '#5d478b',
    '#4a708b',
    '#b8860b',
    '#fff8dc',
    '#40e0d0',
    '#fff5ee',
    '#eee685',
    '#ee2c2c',
    '#b8b8b8',
    '#ffaeb9',
    '#4f4f4f',
    '#8b7500',
    '#1874cd',
    '#00ffff',
    '#595959',
    '#d6d6d6',
    '#ff00ff',
    '#ffebcd',
    '#969696',
    '#ff7f00',
    '#666666',
    '#228b22',
    '#333333',
    '#53868b',
    '#d4d4d4',
    '#bf3eff',
    '#636363',
    '#191970',
    '#43cd80',
    '#ebebeb',
    '#00ff00',
    '#f5f5dc',
    '#7a8b8b',
    '#00bfff',
    '#262626',
    '#8470ff',
    '#bbffff',
    '#ee9a49',
    '#9b30ff',
    '#eecbad',
    '#e3e3e3',
    '#cdb5cd',
    '#eee9bf',
    '#ff1493',
    '#ff6347',
    '#ffdead',
    '#cdba96',
    '#ffc125',
    '#8b864e',
    '#adff2f',
    '#bfefff',
    '#c7c7c7',
    '#556b2f',
    '#6b8e23',
    '#8b4726',
    '#daa520',
    '#cdad00',
    '#ff6a6a',
    '#8b6969',
    '#ee7600',
    '#698b69',
    '#87ceff',
    '#cd1076',
    '#cd2626',
    '#ff7f50',
    '#fafafa',
    '#ff8c00',
    '#ee00ee',
    '#cdb38b',
    '#8b008b',
    '#ff3030',
    '#436eee',
    '#575757',
    '#ffec8b',
    '#b2dfee',
    '#9aff9a',
    '#36648b',
    '#00cd00',
    '#db7093',
    '#c0ff3e',
    '#8b0a50',
    '#cdc673',
    '#8b6914',
    '#b0b0b0',
    '#00cd66',
    '#bababa',
    '#ededed',
    '#5c5c5c',
    '#8b8b83',
    '#ff34b3',
    '#548b54',
    '#8b1a1a',
    '#66cdaa',
    '#bdb76b',
    '#cdc9c9',
    '#ffefd5',
    '#9ac0cd',
    '#cd8162',
    '#ee1289',
    '#79cdcd',
    '#00b2ee',
    '#cd919e',
    '#8b2500',
    '#8b4c39',
    '#fffaf0',
    '#7d26cd',
    '#eead0e',
    '#8b3e2f',
    '#a020f0',
    '#080808',
    '#8b814c',
    '#ff0000',
    '#c6e2ff',
    '#6495ed',
    '#00008b',
    '#668b8b',
    '#eeb422',
    '#cd6600',
    '#cfcfcf',
    '#ab82ff',
    '#757575',
    '#ee6aa7',
    '#ba55d3',
    '#ffbbff',
    '#deb887',
    '#8b8682',
    '#e066ff',
    '#cd7054',
    '#8b8878',
    '#a6a6a6',
    '#eee8aa',
    '#a3a3a3',
    '#ee7621',
    '#5e5e5e',
    '#ffffe0',
    '#737373',
    '#76eec6',
    '#663399',
    '#b4cdcd',
    '#00ff7f',
    '#9bcd9b',
    '#e0e0e0',
    '#cd4f39',
    '#9400d3',
    '#bc8f8f',
    '#f08080',
    '#bcee68',
    '#787878',
    '#cdcdb4',
    '#ee9572',
    '#cdcd00',
    '#778899',
    '#caff70',
    '#eecfa1',
    '#8b8386',
    '#7a7a7a',
    '#212121',
    '#8b4789',
    '#458b74',
    '#1f1f1f',
    '#cd5b45',
    '#8968cd',
    '#b0e2ff',
    '#00fa9a',
    '#e5e5e5',
    '#f0ffff',
    '#ffc0cb',
    '#eec591',
    '#cd6889',
    '#a1a1a1',
    '#f0e68c',
    '#3a5fcd',
    '#050505',
    '#cd2990',
    '#ee5c42',
    '#171717',
    '#eea9b8',
    '#8db6cd',
    '#ee30a7',
    '#68228b',
    '#7ac5cd',
    '#b452cd',
    '#8b2323',
    '#b3ee3a',
    '#cdc8b1',
    '#a2b5cd',
    '#cd69c9',
    '#483d8b',
    '#9a32cd',
    '#6e8b3d',
    '#f0fff0',
    '#fffafa',
    '#00e5ee',
    '#eee8cd',
    '#0000cd',
    '#d15fee',
    '#303030',
    '#8b8b00',
    '#424242',
    '#68838b',
    '#ee799f',
    '#eee0e5',
    '#b0c4de',
    '#b5b5b5',
    '#ee3b3b',
    '#cd3278',
    '#fff0f5',
    '#32cd32',
    '#00ee76',
    '#eedc82',
    '#7d7d7d',
    '#63b8ff',
    '#2b2b2b',
    '#eee5de',
    '#999999',
    '#db7093',
    '#00c5cd',
    '#cdc1c5',
    '#8b7e66',
    '#ee6363',
    '#006400',
    '#c4c4c4',
    '#836fff',
    '#cdc9a5',
    '#525252',
    '#8b8989',
    '#ee4000',
    '#141414',
    '#eeeee0',
    '#9932cc',
    '#383838',
    '#cdc0b0',
    '#0a0a0a',
    '#00f5ff',
    '#696969',
    '#7f7f7f',
    '#ffff00',
    '#8b668b',
    '#a2cd5a',
    '#5cacee',
    '#f0f8ff',
    '#cdcdc1',
    '#104e8b',
    '#8b5a00',
    '#0f0f0f',
    '#fffacd',
    '#9f79ee',
    '#0000ff',
    '#ffb90f',
    '#ffe1ff',
    '#f4a460',
    '#90ee90',
    '#473c8b',
    '#6959cd',
    '#ff8c69',
    '#8b4500',
    '#eed5d2',
    '#8b7355',
    '#cd8c95',
    '#ee8262',
    '#919191',
    '#5f9ea0',
    '#e6e6fa',
    '#ff8247',
    '#8ee5ee',
    '#4eee94',
    '#ff82ab',
    '#cdaa7d',
    '#f0f0f0',
    '#c2c2c2',
    '#ffe4c4',
    '#fffff0',
    '#eea2ad',
    '#fa8072',
    '#66cdaa',
    '#696969',
    '#cdbe70',
    '#a0522d',
    '#e0ffff',
    '#eeeed1',
    '#8deeee',
    '#bdbdbd',
    '#f8f8ff',
    '#7b68ee',
    '#cdb7b5',
    '#add8e6',
    '#87ceeb',
    '#8b7765',
    '#d02090',
    '#afeeee',
    '#458b00',
    '#00688b',
    '#fdf5e6',
    '#8b795e',
    '#eeee00',
    '#ff4040',
    '#242424',
    '#dcdcdc',
    '#cd5555',
    '#528b8b',
    '#eeb4b4',
    '#8b6508',
    '#8b8970',
    '#f5deb3',
    '#a52a2a',
    '#ee7ae9',
    '#ff6eb4',
    '#eee9e9',
    '#ffdab9',
    '#c9c9c9',
];
/// <reference path="../core/base.ts" />
var Physics;
(function (Physics) {
    /**
     * Computes force that goes in the direction from p1 to p2 and has the
     * provided magnitude.
     *
     * @param p1
     * @param p2
     * @param magnitude
     */
    function forceFromPoints(p1, p2, magnitude) {
        return p2.subNew(p1).normalize_().scale_(magnitude);
    }
    Physics.forceFromPoints = forceFromPoints;
    /**
     * Computes force that goes in the direction pointed to from angle and has
     * the provided magnitude. (Takes into account negative y direction.)
     * @param angle
     * @param magnitude
     */
    function forceFromAngle(angle, magnitude) {
        return (new Point(Math.cos(angle), -Math.sin(angle))).scale_(magnitude);
    }
    Physics.forceFromAngle = forceFromAngle;
})(Physics || (Physics = {}));
var Probability;
(function (Probability) {
    /**
     * Probably actually *not* uniform, but probably good enough for games.
     * Returns an integer uniform between min and max, both inclusive.
     * @param min lower bound, inclusive
     * @param max upper bound, inclusive
     */
    function uniformInt(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    }
    Probability.uniformInt = uniformInt;
    /**
     * Also probably not uniform.
     * @param min lower bound, inclusive
     * @param max upper bound, exclusive
     */
    function uniformReal(min, max) {
        return min + Math.random() * (max - min);
    }
    Probability.uniformReal = uniformReal;
    /**
     * Choose one element at random from `a`. (Randomness questionable.)
     * @param a
     */
    function uniformChoice(a) {
        return a[uniformInt(0, a.length - 1)];
    }
    Probability.uniformChoice = uniformChoice;
})(Probability || (Probability = {}));
// Separating axis theorem collision detection implementation.
var Physics;
(function (Physics) {
    /**
     * Projects `vertices` (of polygon) onto `vector`, storing min and max
     * scales in `out`.
     *
     * Since a projection onto a vector will just be a scaling of that vector,
     * this just tracks the different scales and returns the minimum and maximum
     * scale. This is the length of the vector occupied by the polygon with the
     * given vertices.
     *
     * @param vertices Input: vertices of a polygon
     * @param vector Input: the vector to project the vertices on to
     * @param out Output: the minimum and maximum scales
     */
    function projectMinMax(vertices, vector, out) {
        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i < vertices.length; i++) {
            let vertex = vertices[i];
            let scale = vertex.dot(vector);
            min = Math.min(min, scale);
            max = Math.max(max, scale);
        }
        out.set_(min, max);
    }
    /**
     * Projects vertices (of polygon) onto each vector in succession (first all
     * in vectors1, then all in vectors2). For each vector, records the min and
     * max scale as a point. These (min, max) pairs are returned in `out`.
     *
     * @param vertices Input: vertices of polygon (length n)
     * @param vectors Input: first set of vectors to project onto (length v1)
     * @param vectors Input: second set of vectors to project onto (length v2)
     * @param out Output: (min, max) scales, one for each vector (only v1+v2 set)
     */
    function projectMinMaxMany(vertices, vectors1, vectors2, out) {
        for (let i = 0; i < vectors1.length; i++) {
            projectMinMax(vertices, vectors1[i], out[i]);
        }
        for (let i = 0; i < vectors2.length; i++) {
            projectMinMax(vertices, vectors2[i], out[vectors1.length + i]);
        }
    }
    class CollisionInfo {
        constructor(axis = new Point(), amount = 0) {
            this.axis = axis;
            this.amount = amount;
        }
        copy() {
            return new CollisionInfo(this.axis.copy(), this.amount);
        }
        /**
         * Reverses the direction of the collision (by changing the sign of the
         * amount). Return this.
         */
        rev() {
            this.amount = -this.amount;
            return this;
        }
    }
    Physics.CollisionInfo = CollisionInfo;
    class SAT {
        /**
         * Creates a SAT collision detector that can check collisions between
         * at most two n-sided polygons (used to allocate buffer space).
         * @param n
         */
        constructor(n) {
            let bufferSize = n + n;
            this.cacheRanges1 = new Array(bufferSize);
            this.cacheRanges2 = new Array(bufferSize);
            for (let arr of [this.cacheRanges1, this.cacheRanges2]) {
                for (let i = 0; i < bufferSize; i++) {
                    arr[i] = new Point();
                }
            }
        }
        /**
         * Separating axis theorem collision detection between two sets of
         * vertices onto two sets of axes.
         *
         * If there is a collision, returns the axis and amount of the axis with
         * the smallest overlap.
         * @param vertices1 from shape 1
         * @param axes1 from shape 1
         * @param vertices2 from shape 2
         * @param axes2 from shape 2
         * @param out
         */
        collides(vertices1, axes1, vertices2, axes2, out) {
            projectMinMaxMany(vertices1, axes1, axes2, this.cacheRanges1);
            projectMinMaxMany(vertices2, axes1, axes2, this.cacheRanges2);
            let comparisons = axes1.length + axes2.length;
            let smOverlap = Infinity;
            let smOverlapIdx = -1;
            let smDir = -1;
            for (let i = 0; i < comparisons; i++) {
                let p = this.cacheRanges1[i];
                let q = this.cacheRanges2[i];
                // case 1: OK
                //	 p.x		p.y	  Q.x		  Q.y
                // ---+==========+-----+===========+--------
                //
                // case 2: OK
                //	 Q.x		Q.y	  p.x		  p.y
                // ---+==========+-----+===========+--------
                //
                // case 3: COLLIDING
                //	 p.x		Q.x	  p.y		  Q.y
                // ---+==========+=====+===========+--------
                //
                // case 4: COLLIDING
                //	 Q.x		p.x	  Q.y		  p.y
                // ---+==========+=====+===========+--------
                if (p.y < q.x || q.y < p.x) {
                    // non-overlap on any axis means safe
                    return false;
                }
                // overlap on this axis. track it + direction  in case we have
                // a collision and this is the axis w/ smallest amt.
                let diff1 = p.y - q.x;
                let diff2 = q.y - p.x;
                let overlap, direction;
                if (diff1 < diff2) {
                    overlap = diff1;
                    direction = 1;
                }
                else {
                    overlap = diff2;
                    direction = -1;
                }
                if (overlap < smOverlap) {
                    smOverlap = overlap;
                    smOverlapIdx = i;
                    smDir = direction;
                }
            }
            // set collision info w/ smallest (kinda gross b/c two arrays...)
            let smAxis = smOverlapIdx < axes1.length ? axes1[smOverlapIdx] : axes2[smOverlapIdx - axes1.length];
            out.axis.copyFrom_(smAxis);
            out.amount = smOverlap * smDir;
            // and return that we did collide
            return true;
        }
    }
    Physics.SAT = SAT;
})(Physics || (Physics = {}));
/// <reference path="../engine/ecs.ts" />
var Script;
(function (Script_1) {
    /**
     * Runs scripts.
     */
    class Runner {
        constructor(ecs, eventsManager) {
            this.ecs = ecs;
            this.eventsManager = eventsManager;
            this.scripts = new Array();
        }
        /**
         * Add a script to the active set of running scripts. This init()s the
         * script.
         *
         * @param script
         */
        run(script) {
            script._init(this.ecs, this.eventsManager, this);
            script.init();
            this.scripts.push(script);
        }
        /**
         * Stops all scripts from running immediately.
         */
        clear() {
            arrayClear(this.scripts);
        }
        /**
         * Called every frame to run code blocks for any scripts that are
         * ready, update long-running blocks of scripts, and clean up finished
         * scripts.
         *
         * @param delta Tick time in ms
         */
        update(delta) {
            // loop through scripts, updating them, and removing any that have
            // finished. looping backwards for easy removal during loop.
            for (let i = this.scripts.length - 1; i >= 0; i--) {
                this.scripts[i].update(delta);
                if (this.scripts[i].finished) {
                    this.scripts.splice(i, 1);
                }
            }
        }
    }
    Script_1.Runner = Runner;
    /**
     * Actual Scripts subclass this to script game events. It pairs time delays
     * (in ms) with code to run once after that amount of time has elapsed.
     *
     * Scripts should be the opposite of Systems: they should only need to run
     * on a few frames (as opposed to every frame), they should not bookkeep
     * subsets of entities (though they can use subsystems to do this), and they
     * should be created and then cleaned up (as opposed to persisting
     * throughout the game).
     */
    class Script {
        constructor() {
            //
            // init'd later
            //
            /**
             * Used as desired by script to store functions that need to be
             * updated.
             */
            this.active = new Array();
            /**
             * Contains total time elapsed since script was started.
             */
            this.elapsed = 0;
        }
        //
        // init'd now
        //
        /**
         * This marks whether the script has finished executing and can be
         * cleaned up. The script runner observes this.
         */
        get finished() {
            return this.todo.length === 0 && this.active.length == 0;
        }
        /**
         * The script runner calls this to pass in the ECS, and it allows the
         * script to do internal bookkeeping setup.
         *
         * (Most things creating Scripts will have the ECS anyway, but it's
         * cleaner to avoid having them all have to pass it in.)
         */
        _init(ecs, eventsManager, runner) {
            this.ecs = ecs;
            this.eventsManager = eventsManager;
            this.runner = runner;
            this.todo = mapKeyArr(this.code);
            this.todo.sort(sortNumeric);
        }
        /**
         * Let the script do any custom initialization.
         */
        init() { }
        update(delta) {
            this.elapsed += delta;
            let nToRemove = 0;
            for (let delay of this.todo) {
                // If the appropriate delay has passed, call the function, and
                // mark that we should remove it (can't remove during iteration
                // because that screws up the iterator).
                if (this.elapsed >= delay) {
                    let pkg = this.code.get(delay);
                    pkg.func.apply(this, pkg.args);
                    nToRemove++;
                }
                else {
                    // Since our delays are sorted, once we can't do one of
                    // them, we won't be able to do the rest.
                    break;
                }
            }
            // remove any code we've finished
            for (let i = 0; i < nToRemove; i++) {
                this.todo.shift();
            }
            // run any active functions, and remove them if they've finished
            for (let i = this.active.length - 1; i >= 0; i--) {
                if (this.active[i].call(this, delta)) {
                    this.active.splice(i, 1);
                }
            }
        }
    }
    Script_1.Script = Script;
})(Script || (Script = {}));
/// <reference path="../core/lang.ts" />
/// <reference path="../core/base.ts" />
/// <reference path="../core/util.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/anim.ts" />
/// <reference path="../graphics/animation.ts" />
/// <reference path="../gj7/conversion.ts" />
/// <reference path="../gj7/weapon.ts" />
/// <reference path="../gj7/item.ts" />
/// <reference path="../gj7/shield.ts" />
/// <reference path="../gj7/sound.ts" />
/// <reference path="../gj7/attributes.ts" />
/// <reference path="../component/activity.ts" />
/// <reference path="../component/animatable.ts" />
/// <reference path="../component/armed.ts" />
/// <reference path="../component/camera-followable.ts" />
/// <reference path="../component/collision-shape.ts" />
/// <reference path="../component/body.ts" />
/// <reference path="../component/enemy.ts" />
/// <reference path="../component/health.ts" />
/// <reference path="../component/input.ts" />
/// <reference path="../component/player-input.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/static-renderable.ts" />
/// <reference path="../component/shielded.ts" />
var GameMap;
(function (GameMap_1) {
    /**
     * Helper to turn a comma-separated list of numbers into an array of
     * numbers. Also ensures the length is as desired.
     */
    function parseNums(s, propName, lenWant) {
        let res = new Array();
        for (let chunk of s.split(',')) {
            res.push(parseFloat(chunk.trim()));
        }
        if (res.length != lenWant) {
            throw new Error('Property "' + propName + '" expects ' + lenWant +
                ' numbers, but "' + s + '" only has ' + res.length + '.');
        }
        return res;
    }
    /**
     * Helper to turn a comma-separated list of strings into an array of
     * strings. Also ensures each is one of the provided options.
     */
    function parseStrings(s, propName, options) {
        let res = new Array();
        for (let raw_chunk of s.split(',')) {
            let chunk = raw_chunk.trim();
            // Man, I really want array and set semantics. Ah well. O(n) check.
            if (options.indexOf(chunk) === -1) {
                throw new Error('Property "' + propName + '" expects one of [' +
                    options.join(', ') + '], but "' + chunk + '" was given.');
            }
            res.push(chunk);
        }
        return res;
    }
    /**
     * TODO: maybe pull into Weapons class.
     *
     * @param entity
     * @param ecs
     * @param weapon
     */
    function addWeapon(entity, ecs, weapon) {
        if (!ecs.getComponents(entity).has(Component.Armed)) {
            let armed = new Component.Armed(weapon);
            ecs.addComponent(entity, armed);
        }
        else {
            let armed = ecs.getComponents(entity).get(Component.Armed);
            armed.inventory.push(weapon);
        }
    }
    /**
     * TODO: maybe pull into Shields class.
     * @param entity
     * @param ecs
     * @param weapon
     */
    function addShield(entity, ecs, shield) {
        if (!ecs.getComponents(entity).has(Component.Shielded)) {
            ecs.addComponent(entity, new Component.Shielded(shield));
        }
        else {
            let shielded = ecs.getComponents(entity).get(Component.Shielded);
            shielded.inventory.push(shield);
        }
    }
    /**
     * Helper as temporary hack to add weapons until we get the weapon system
     * straightened away (might be something super simple that multiplexes into
     * functions like these).
     */
    function addBow(entity, ecs, props) {
        // add the bow w/ all timing info for swing and attack info for attack.
        let timing = {
            idleCooldown: 0,
            minChargeDuration: 300,
            swingDuration: 500,
            swingAttackDelay: 0,
            sheatheDuration: 300,
            quickAttackNextWait: -1,
            quickAttackDuration: -1,
            quickAttackAttackDelay: -1,
            comboDuration: -1,
            comboAttackDelay: -1,
        };
        let swingAtk = {
            cboxDims: new Point(10, 10),
            cboxOffset: new Point(0, 0),
            movement: Weapon.AttackMovement.Launch,
            damage: 10,
            attackType: Weapon.AttackType.Swing,
            cTypes: [CollisionType.Attack, CollisionType.Mobile, CollisionType.Player],
            knockbackForce: 5000,
            staggerForce: 5000,
            lungeForce: 0,
            duration: 10000,
            velocity: 10000.0,
        };
        let weapon = {
            timing: timing,
            swingAttack: swingAtk,
            partID: PartID.Bow,
        };
        addWeapon(entity, ecs, weapon);
        // add bow animations to the character's entity
        let animatable = ensureAnimatable(entity, ecs, props);
        // attack
        let newAlign = {
            alignType: Anim.AlignType.TextureOrigin,
            extraOffset: new Point(0, 0),
        };
        animatable.animations.set(Anim.getKey(Action.Charging, Part.Weapon, PartID.Bow), Anim.getData('sprites/weapons/bowCharge', 4, 75, Anim.PlayType.PlayAndHold, new Point(0, 1), newAlign));
        animatable.animations.set(Anim.getKey(Action.Swinging, Part.Weapon, PartID.Bow), Anim.getData('sprites/weapons/bowSwing', 1, 500, Anim.PlayType.PlayAndHold, new Point(0, 1), newAlign));
        animatable.animations.set(Anim.getKey(Action.Sheathing, Part.Weapon, PartID.Bow), Anim.getData('sprites/weapons/bowSheathe', 2, 75, Anim.PlayType.PlayAndHold, new Point(0, 1), newAlign));
        let oldAlign = {
            alignType: Anim.AlignType.TextureOrigin,
            extraOffset: new Point(24, 8),
        };
        // blocking
        animatable.animations.set(Anim.getKey(Action.BlockRaising, Part.Weapon, PartID.Bow), Anim.getData('sprites/weapons/bowRaise', 2, 100, Anim.PlayType.PlayAndHold, new Point(0, 1), oldAlign));
        animatable.animations.set(Anim.getKey(Action.BlockHolding, Part.Weapon, PartID.Bow), Anim.getData('sprites/weapons/bowHold', 1, 100, Anim.PlayType.PlayAndHold, new Point(0, 1), oldAlign));
        animatable.animations.set(Anim.getKey(Action.BlockLowering, Part.Weapon, PartID.Bow), Anim.getData('sprites/weapons/bowLower', 1, 100, Anim.PlayType.PlayAndHold, new Point(0, 1), oldAlign));
        // std
        animatable.animations.set(Anim.getKey(Action.Moving, Part.Weapon, PartID.Bow), Anim.getData('sprites/weapons/bowWalk', 8, 100, Anim.PlayType.Loop, new Point(0, 1), oldAlign));
        animatable.animations.set(Anim.getKey(Action.Idle, Part.Weapon, PartID.Bow), Anim.getData('sprites/weapons/bowIdle', 1, 100, Anim.PlayType.Loop, new Point(0, 1), oldAlign));
    }
    /**
     * Helper as temporary hack to add weapons until we get the weapon system
     * straightened away (might be something super simple that multiplexes into
     * functions like these).
     */
    function addAxe(entity, ecs, props) {
        // add the sword w/ all timing info for swing and attack info for attack.
        let timing = {
            idleCooldown: 0,
            minChargeDuration: 400,
            swingDuration: 1300,
            swingAttackDelay: 0,
            sheatheDuration: 150,
            quickAttackNextWait: -1,
            quickAttackDuration: -1,
            quickAttackAttackDelay: -1,
            comboDuration: -1,
            comboAttackDelay: -1,
        };
        let swingAtk = {
            cboxDims: new Point(120, 90),
            cboxOffset: new Point(-40, 0),
            movement: Weapon.AttackMovement.Track,
            damage: 20,
            attackType: Weapon.AttackType.Swing,
            cTypes: [CollisionType.Attack, CollisionType.Mobile, CollisionType.Player],
            knockbackForce: 50000,
            staggerForce: 50000,
            lungeForce: 0,
            duration: 300,
        };
        let weapon = {
            timing: timing,
            swingAttack: swingAtk,
            partID: PartID.Axe
        };
        addWeapon(entity, ecs, weapon);
        // add axe animations to the character's entity
        let animatable = ensureAnimatable(entity, ecs, props);
        // attack
        let newAlign = {
            alignType: Anim.AlignType.TextureOrigin,
            extraOffset: new Point(0, 0),
        };
        animatable.animations.set(Anim.getKey(Action.Charging, Part.Weapon, PartID.Axe), Anim.getData('sprites/weapons/axeCharge', 3, 150, Anim.PlayType.PlayAndHold, new Point(0, 1), newAlign));
        animatable.animations.set(Anim.getKey(Action.Swinging, Part.Weapon, PartID.Axe), Anim.getData('sprites/weapons/axeSwing', 4, 100, Anim.PlayType.PlayAndHold, new Point(0, 1), newAlign));
        animatable.animations.set(Anim.getKey(Action.Sheathing, Part.Weapon, PartID.Axe), Anim.getData('sprites/weapons/axeSheathe', 1, 150, Anim.PlayType.PlayAndHold, new Point(0, 1), newAlign));
        let oldAlign = {
            alignType: Anim.AlignType.TextureOrigin,
            extraOffset: new Point(24, 8)
        };
        // blocking
        animatable.animations.set(Anim.getKey(Action.BlockRaising, Part.Weapon, PartID.Axe), Anim.getData('sprites/weapons/axeRaise', 2, 100, Anim.PlayType.PlayAndHold, new Point(0, 1), oldAlign));
        animatable.animations.set(Anim.getKey(Action.BlockHolding, Part.Weapon, PartID.Axe), Anim.getData('sprites/weapons/axeHold', 1, 100, Anim.PlayType.PlayAndHold, new Point(0, 1), oldAlign));
        animatable.animations.set(Anim.getKey(Action.BlockLowering, Part.Weapon, PartID.Axe), Anim.getData('sprites/weapons/axeLower', 1, 100, Anim.PlayType.PlayAndHold, new Point(0, 1), oldAlign));
        // std
        animatable.animations.set(Anim.getKey(Action.Moving, Part.Weapon, PartID.Axe), Anim.getData('sprites/weapons/axeWalk', 8, 100, Anim.PlayType.Loop, new Point(0, 1), oldAlign));
        animatable.animations.set(Anim.getKey(Action.Idle, Part.Weapon, PartID.Axe), Anim.getData('sprites/weapons/axeIdle', 1, 100, Anim.PlayType.Loop, new Point(0, 1), oldAlign));
    }
    /**
     * Created as core properties on every object by tiled. (There are more, but
     * only adding here as needed.)
     *
     * TODO: consider refactoring w/ ObjectJson.
     */
    class CoreData {
    }
    /**
     * Values are copy-able wrappers around data.
     *
     * The extendWith() method is new; right now, its implementation is just to
     * completely replace with the child for everything except Complex<T>
     * Values that are Array<T>; for those, it merges (copies of) the two
     * arrays.
     */
    class Value {
        extendWith(child) {
            return child.copy();
        }
    }
    /**
     * CoreVal is kind of an exception to normal Values; it represents *all* of
     * the values that are core to objects.
     */
    class CoreValue extends Value {
        constructor(orig) {
            super();
            this.data = this.copyRaw(orig);
        }
        copyRaw(orig) {
            let res = new CoreData();
            res.x = orig.x;
            res.y = orig.y;
            res.rotation = orig.rotation;
            res.width = orig.width;
            res.height = orig.height;
            return res;
        }
        val() {
            return this.copyRaw(this.data);
        }
        copy() {
            return new CoreValue(this.data);
        }
    }
    class Primitive extends Value {
        constructor(data) {
            super();
            this.data = data;
        }
        val() {
            return this.data;
        }
        copy() {
            return new Primitive(this.data);
        }
    }
    class PrimitiveArray extends Value {
        constructor(orig) {
            super();
            this.data = arrayCopy(orig);
        }
        val() {
            return arrayCopy(this.data);
        }
        copy() {
            return new PrimitiveArray(this.data);
        }
    }
    /**
     * Complex is a Value that can hold arbitrary objects with an absolute gem
     * of a deep copying solution.
     *
     * Warning: the following values won't copy as expected:
     * - undefined -> (won't exist)
     * - Infinity  -> null
     * - NaN	   -> null
     *
     * However, we shouldn't have any of those values anyway. Note that null
     * does copy correctly.
     */
    class Complex extends Value {
        constructor(orig) {
            // defensively copy when made
            super();
            this.data = clone(orig);
        }
        val() {
            // defensively copy when returning value
            return clone(this.data);
        }
        copy() {
            // don't need to defensively copy here because it happens in the
            // constructor.
            return new Complex(this.data);
        }
        /**
         * The one, shining, beautiful reason this whole dang method got
         * exposed: if this is an array of some kind, merge the two arrays.
         */
        extendWith(child) {
            // NOTE: There's like WAY too much copying going on here. We copy
            // both things here, plus we then copy them below (happens in
            // Complex constructor). Where this is actually used, we need zero
            // copying. However, it's probably a better contract for copying to
            // happen, so meh.
            let p = this.copy();
            let c = child.copy();
            if (!(p.data instanceof Array) || !(c.data instanceof Array)) {
                return c;
            }
            p.data.push(...c.data);
            return new Complex(p.data);
        }
    }
    /**
     * A property is given to objects in the map editor. Each property has:
     *
     *	(a) a name -- this is case-insensitive. It is the 'key' given in the map
     *		editor
     *
     *	(b) a way of interpreting its parameters. This is the function that
     *		turns the 'value' given in the map editor into something the engine
     *		expects to work with
     *
     *	(c) an effect when applied to an entity. Once the full list of
     *		Properties is calculated they are all applied to an object.
     */
    class Property {
        init() {
            this.name = this.constructor.name;
        }
    }
    /**
     * CoreProperty is kind of an exception to a normal `Property`s. It
     * represents all of the properties that are on an object (not a layer) by
     * default.
     *
     * It's given a name and added to the map so that it may be retrieved at
     * apply() time. It is not parsed like normal properties; it's a special
     * case and parsed always on every object.
     *
     * Note that this has two purposes:
     *
     * (1) apply core components that every object should have (like position)
     *
     * (2) hold core data that other properties might need (like width/height
     * for collision boxes)
     */
    class CoreProperty extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(obj) {
            return new CoreValue(obj);
        }
        apply(entity, ecs, props) {
            let coreData = props.get(CoreProperty.name).val();
            let rawX = coreData.x;
            let rawY = coreData.y;
            let w = coreData.width;
            let h = coreData.height;
            let gameAngle = angleFlip(Constants.DEG2RAD * coreData.rotation);
            // Apply bjorn (collision boxes grown downwards instead of up).
            if (props.has(Bjorn.name)) {
                h = -h;
            }
            // Tiled rotates object CW from bottom-left point. We rotate
            // objects CCW from center. We need to figure out where the object
            // actually is.
            // From tiled position (bottom-left = (rawX, rawY)), rotate vector
            // to center of object (baseAngle) by tiled angle (gameAngle)
            // (result = centerAngle), then travel along it (hyp) to find its
            // rotated center location.
            let baseAngle = Math.atan2(h, w);
            let centerAngle = baseAngle + gameAngle;
            let hyp = Math.sqrt((w * w + h * h) / 4);
            let centerX = rawX + Math.cos(centerAngle) * hyp;
            let centerY = rawY - Math.sin(centerAngle) * hyp; // "up" = -y
            // Make position component
            ecs.addComponent(entity, new Component.Position(new Point(centerX, centerY), gameAngle));
            // If respawn marked, also make that component.
            if (props.has(Respawn.name) && props.get(Respawn.name).val()) {
                ecs.addComponent(entity, new Component.Spawnable(new Point(centerX, centerY)));
            }
        }
    }
    class Animations extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Complex(params);
        }
        apply(entity, ecs, props) {
            let specs = props.get(Animations.name).val();
            let animatable = ensureAnimatable(entity, ecs, props);
            for (let spec of specs) {
                let [k, d] = Anim.convertSpec(spec);
                animatable.animations.set(k, d);
            }
            // only add activity and body components if it has anything besides
            // the default animation.
            if (!animatable.defaultOnly) {
                // activity may already have been added by explicit spec.
                if (!ecs.getComponents(entity).has(Component.Activity)) {
                    ecs.addComponent(entity, new Component.Activity({}));
                }
                // body
                ecs.addComponent(entity, new Component.Body());
            }
        }
    }
    class AnimationCustomize extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Complex(params);
        }
        apply(entity, ecs, props) {
            let customize = props.get(AnimationCustomize.name).val();
            let animatable = ensureAnimatable(entity, ecs, props);
            if (customize.tint != null) {
                animatable.globalTint = parseInt(customize.tint.slice(1), 16);
            }
            if (customize.scale != null) {
                animatable.globalScale = customize.scale;
            }
            if (customize.hideOnDeath != null) {
                animatable.hideOnDeath = customize.hideOnDeath;
            }
        }
    }
    class Activity extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Complex(params);
        }
        apply(entity, ecs, props) {
            // This overwites any default given in the animations.
            let activitySpec = props.get(Activity.name).val();
            ecs.removeComponentIfExists(entity, Component.Activity);
            ecs.addComponent(entity, new Component.Activity(activitySpec));
        }
    }
    class AISpec extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            // pull out the behavior and the provided AI parameters (whose type
            // varies based on the behavior chosen)
            let behavior = AI.Behavior[params.behavior];
            return new Complex({
                behavior: behavior,
                params: params.params,
            });
        }
        apply(entity, ecs, props) {
            let aiSpec = props.get(AISpec.name).val();
            ecs.addComponent(entity, new Component.AIComponent(aiSpec.behavior, aiSpec.params));
        }
    }
    class Attributes extends Property {
        constructor(attributes) {
            super();
            this.attributes = attributes;
            this.options = [];
            this.otherPropsRequired = [];
            this.options = mapKeyArr(attributes);
        }
        parseParams(params) {
            // ensure params in options
            if (this.options.indexOf(params) === -1) {
                throw new Error('Property "' + Attributes.name + '" expects one of [' +
                    this.options.join(', ') + '], but "' + params + '" was given.');
            }
            return new Primitive(params);
        }
        apply(entity, ecs, props) {
            let entityName = props.get(Attributes.name).val();
            ecs.addComponent(entity, new Component.Attributes(this.attributes.get(entityName)));
        }
    }
    /**
     * Ensures that `entity` has an Animatable component by creating it if
     * needed.
     */
    function ensureAnimatable(entity, ecs, props) {
        let components = ecs.getComponents(entity);
        let animatable;
        if (components.has(Component.Animatable)) {
            animatable = components.get(Component.Animatable);
        }
        else {
            // determine the draw layer
            let drawLayer = ZLevelWorld.Object;
            if (props.has(DrawLayer.name)) {
                drawLayer = props.get(DrawLayer.name).val();
            }
            // create component and add to object
            animatable = new Component.Animatable(drawLayer, StageTarget.World);
            ecs.addComponent(entity, animatable);
        }
        return animatable;
    }
    class Audible extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Complex(params);
        }
        apply(entity, ecs, props) {
            let entitySounds = props.get(Audible.name).val();
            ecs.addComponent(entity, new Component.Audible(entitySounds));
        }
    }
    class Bjorn extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Primitive(params);
        }
        apply(entity, ecs, props) {
            // Bjorn only affects other properties.
            // God damnit, Bjorn.
        }
    }
    class Checkpoint extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Primitive(params);
        }
        apply(entity, ecs, props) {
            if (!props.get(Checkpoint.name).val()) {
                // console.warn('Warning: Useless k/v "' + this.name + '" found but disabled.');
                return;
            }
            let gateID = null;
            if (props.has(GateID.name)) {
                gateID = props.get(GateID.name).val();
            }
            ecs.addComponent(entity, new Component.Checkpoint(gateID));
        }
    }
    class CollisionGenerate extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [CollisionTypes.name];
        }
        parseParams(params) {
            return new Primitive(params);
        }
        apply(entity, ecs, props) {
            // First, see whether this is turned on at all.
            if (!props.get(CollisionGenerate.name).val()) {
                // console.warn('Warning: Useless k/v "' + this.name + '" found but disabled.');
                return;
            }
            // Get the size and collision info for the object.
            let coreData = props.get(CoreProperty.name).val();
            let cTypes = props.get(CollisionTypes.name).val();
            // Build the collision box.
            ecs.addComponent(entity, Component.CollisionShape.buildRectangle(new Point(coreData.width, coreData.height), new Set(cTypes)));
        }
    }
    class CollisionManual extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [CollisionTypes.name];
        }
        parseParams(params) {
            return new PrimitiveArray(parseNums(params, this.name, 4));
        }
        apply(entity, ecs, props) {
            let data = props.get(CollisionManual.name).val();
            let cTypes = props.get(CollisionTypes.name).val();
            ecs.addComponent(entity, Component.CollisionShape.buildRectangle(new Point(data[2], data[3]), new Set(cTypes), new Point(data[0], -data[1])));
        }
    }
    class CollisionTypes extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            let res = [];
            for (let param of params) {
                let cType = CollisionType[param];
                if (cType == null) {
                    throw new Error('Property ' + this.name + '" expects a valid ' +
                        'CollisionType, one of: [' + enumSortedNames(ZLevelWorld).join(', ') +
                        '] but ' + param + '" was given as one type.');
                }
                res.push(cType);
            }
            return new PrimitiveArray(res);
        }
        apply(entity, ecs, props) {
            // Nothing happens here; application is done in one of the collision
            // creation classes (CollisionGenerate, CollisionManual).
        }
    }
    class Comboable extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Complex(params);
        }
        apply(entity, ecs, props) {
            let comboInfo = props.get(Comboable.name).val();
            ecs.addComponent(entity, new Component.Comboable(comboInfo.hits, comboInfo.consecutiveWindow, comboInfo.activeWindow));
        }
    }
    class Destructible extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Primitive(params);
        }
        apply(entity, ecs, props) {
            if (!props.get(Destructible.name).val()) {
                // console.warn('Warning: Useless k/v "' + this.name + '" found but disabled.');
                return;
            }
            ecs.addComponent(entity, new Component.Destructible());
        }
    }
    class DrawLayer extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            let z = ZLevelWorld[params];
            if (z == null) {
                // Bad value! Build up options for nice error reporting...
                throw new Error('Property "' + this.name + '" expects a valid ' +
                    'ZLevelWorld, one of: [' + enumSortedNames(ZLevelWorld).join(', ') +
                    '] but "' + params + '" was given.');
            }
            // return the value
            return new Primitive(z);
        }
        apply(entity, ecs, props) {
            // Nothing happens here; application is done in one of the animation
            // or static image component creations.
        }
    }
    class Enemy extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Complex(params);
        }
        apply(entity, ecs, props) {
            let data = props.get(Enemy.name).val();
            let enemy = new Component.Enemy(data);
            ecs.addComponent(entity, enemy);
            // enemy lighting set to default value if Lightbulbs prop not
            // provided.
            if (!props.has(Lightbulbs.name)) {
                ecs.addComponent(entity, new Component.Lightbulb([{}]));
            }
        }
    }
    class Gate extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Complex(params);
        }
        apply(entity, ecs, props) {
            let gate = props.get(Gate.name).val();
            if (props.has(GateID.name)) {
                gate.id = props.get(GateID.name).val();
            }
            let start = gate.start || false;
            let exit = gate.exit || false;
            if (gate.id != null && (start || exit)) {
                throw new Error('Start and exit gates cannot have GateIDs.');
            }
            if (start && exit) {
                throw new Error('Gate cannot be both start and exit.');
            }
            if (start) {
                gate.id = 'START';
            }
            if (exit) {
                gate.id = 'EXIT';
            }
            ecs.addComponent(entity, new Component.Gate(start, exit, gate.id));
        }
    }
    class GateID extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Primitive(params);
        }
        apply(entity, ecs, props) {
            // Application is done in Gate, Zone, Item, or Checkpoint
        }
    }
    class Health extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Primitive(parseInt(params));
        }
        apply(entity, ecs, props) {
            let health = props.get(Health.name).val();
            ecs.addComponent(entity, new Component.Health(health));
        }
    }
    class Img extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Primitive(params);
        }
        apply(entity, ecs, props) {
            let path = props.get(Img.name).val();
            let drawLayer = ZLevelWorld.Object;
            if (props.has(DrawLayer.name)) {
                drawLayer = props.get(DrawLayer.name).val();
            }
            ecs.addComponent(entity, new Component.StaticRenderable(path, drawLayer, StageTarget.World));
        }
    }
    class Item extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            // validity check
            let item = Ontology.Item[params.classification];
            if (item == null) {
                // Bad value! Build up options for nice error reporting...
                throw new Error('Property "' + this.name + '" expects a valid ' +
                    'Ontology.Item, one of: [' + enumSortedNames(Ontology.Item).join(', ') +
                    '] but "' + params.classification + '" was given.');
            }
            return new Complex({
                classificiation: item,
                instructionID: params.instructionID,
            });
        }
        apply(entity, ecs, props) {
            let behavior = props.get(Item.name).val();
            if (props.has(GateID.name)) {
                behavior.gateID = props.get(GateID.name).val();
            }
            ecs.addComponent(entity, new Component.Item(behavior));
            // bob! (but not for hearts)
            if (behavior.classificiation != Ontology.Item.Health) {
                let t = new Component.Tweenable();
                t.tweenQueue.push({
                    prop: 'y',
                    spec: {
                        val: 20,
                        valType: 'rel',
                        duration: -1,
                        period: 0.002,
                        method: 'sine',
                    },
                });
                ecs.addComponent(entity, t);
            }
            // sparkle
            ecs.addComponent(entity, new Component.Sparkle());
        }
    }
    class Knockbackable extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Primitive(params);
        }
        apply(entity, ecs, props) {
            if (!props.get(Knockbackable.name).val()) {
                // console.warn('Warning: Useless k/v "' + this.name + '" found but disabled.');
                return;
            }
            ecs.addComponent(entity, new Component.Knockbackable());
        }
    }
    class Lightbulbs extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Complex(params);
        }
        apply(entity, ecs, props) {
            let specs = props.get(Lightbulbs.name).val();
            ecs.addComponent(entity, new Component.Lightbulb(specs));
        }
    }
    class Move extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Complex(params);
        }
        apply(entity, ecs, props) {
            let movement = props.get(Move.name).val();
            ecs.addComponent(entity, new Component.Input(movement));
        }
    }
    /**
     * Prop used in blueprint.json infrastructure (no effect here).
     */
    class ParentLayer extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Primitive(params);
        }
        apply(entity, ecs, props) {
            // nothing to do --- this logic is for the blueprint.json
        }
    }
    class PhysicsRegion extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Complex(params);
        }
        apply(entity, ecs, props) {
            let region = props.get(PhysicsRegion.name).val();
            ecs.addComponent(entity, new Component.PhysicsRegion(region));
        }
    }
    class Player extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Primitive(params);
        }
        apply(entity, ecs, props) {
            if (!props.get(Player.name).val()) {
                // console.warn('Warning: Useless k/v "' + this.name + '" found but disabled.');
                return;
            }
            ecs.addComponent(entity, new Component.PlayerInput());
            ecs.addComponent(entity, new Component.CameraFollowable());
            // ecs.addComponent(entity, new Component.DebugInspection(ecs.walltime));
            // addBow(entity, ecs, props);
            // addAxe(entity, ecs, props);
            // player lighting hardcoded
            ecs.addComponent(entity, new Component.Lightbulb([{
                    size: 'Large',
                }]));
        }
    }
    class PersistentDamage extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Complex(params);
        }
        apply(entity, ecs, props) {
            let data = props.get(PersistentDamage.name).val();
            let pd = new Component.PersistentDamage(Conversion.jsonToAttackInfo(data, Weapon.AttackType.Quick));
            ecs.addComponent(entity, pd);
        }
    }
    class Respawn extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Primitive(params);
        }
        apply(entity, ecs, props) {
            // Respawn is applied in the initial setup (CoreProperty) if it is
            // found.
        }
    }
    class Shields extends Property {
        constructor(shields) {
            super();
            this.shields = shields;
            this.options = [];
            this.otherPropsRequired = [];
            this.options = mapKeyArr(shields);
        }
        parseParams(params) {
            return new PrimitiveArray(parseStrings(params, this.name, this.options));
        }
        apply(entity, ecs, props) {
            let animatable = ensureAnimatable(entity, ecs, props);
            let shieldNames = props.get(Shields.name).val();
            for (let shieldName of shieldNames) {
                let sd = this.shields.get(shieldName);
                // data
                addShield(entity, ecs, sd.shield);
                // animations
                for (let [animKey, animData] of sd.animations.entries()) {
                    animatable.animations.set(animKey, animData);
                }
            }
        }
    }
    class Staggerable extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Primitive(params);
        }
        apply(entity, ecs, props) {
            if (!props.get(Staggerable.name).val()) {
                // console.warn('Warning: Useless k/v "' + this.name + '" found but disabled.');
                return;
            }
            ecs.addComponent(entity, new Component.Staggerable());
        }
    }
    class Weapons extends Property {
        constructor(weapons) {
            super();
            this.weapons = weapons;
            this.options = [];
            this.otherPropsRequired = [];
            this.options = mapKeyArr(weapons);
        }
        parseParams(params) {
            return new PrimitiveArray(parseStrings(params, this.name, this.options));
        }
        apply(entity, ecs, props) {
            let animatable = ensureAnimatable(entity, ecs, props);
            let weaponNames = props.get(Weapons.name).val();
            for (let weaponName of weaponNames) {
                let wd = this.weapons.get(weaponName);
                // data
                addWeapon(entity, ecs, wd.weapon);
                // animations
                for (let [animKey, animData] of wd.animations.entries()) {
                    animatable.animations.set(animKey, animData);
                }
            }
        }
    }
    class Zone extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [CollisionTypes.name];
        }
        parseParams(params) {
            return new Complex(params);
        }
        apply(entity, ecs, props) {
            let zoneSpec = props.get(Zone.name).val();
            if (props.has(GateID.name)) {
                zoneSpec.gateID = props.get(GateID.name).val();
            }
            ecs.addComponent(entity, new Component.Zone(zoneSpec));
        }
    }
    /**
     * Map of string->T class for case-insensitive string keys.
     */
    class LowerKeyMap {
        constructor() {
            this.map = new Map();
        }
        has(key) {
            return this.map.has(key.toLowerCase());
        }
        get(key) {
            return this.map.get(key.toLowerCase());
        }
        set(key, val) {
            this.map.set(key.toLowerCase(), val);
        }
    }
    /**
     * For storing the set of all existing properties (indexed by case-
     * insensitive name).
     */
    class PropertyMap extends LowerKeyMap {
        build(list) {
            for (let prop of list) {
                prop.init();
                this.set(prop.name, prop);
            }
            return this;
        }
    }
    /**
     * For storing parsed property values (prop name -> prop val). The
     * properties themselves (with their parseParams(...) and apply(...)
     * functions) are stored in a PropertyMap.
     */
    class ValMap extends LowerKeyMap {
        copy() {
            let res = new ValMap();
            for (let [k, v] of this.map.entries()) {
                res.set(k, v.copy());
            }
            return res;
        }
        /**
         * Parses a property map json, using the full set of validProps. Mutates
         * this (replacing overlapping ones with any newfound properties).
         * @returns this
         */
        parse(validProps, json) {
            for (let key in json) {
                if (validProps.has(key)) {
                    // The property is valid.
                    this.set(key, validProps.get(key).parseParams(json[key]));
                }
                else {
                    // Blue screen of death (currently as exception).
                    throw new Error('Error: Unimplemented key: "' + key + '"');
                }
            }
            return this;
        }
        /**
         * Returns `this`.
         */
        extendWith(child) {
            for (let key of child.keys()) {
                if (!this.has(key)) {
                    // if prop didn't exist, just use child's
                    this.set(key, child.get(key));
                }
                else {
                    // if prop did exist, use the Value extendWith() method.
                    // This is almost always just an override (for simplicity);
                    // the exception is for arrays, where the arrays are
                    // merged.
                    this.set(key, this.get(key).extendWith(child.get(key)));
                }
            }
            return this;
        }
        /**
         * Ensures that all 'otherPropsRequired' constraints are met. layerName
         * is just for debugging. Throws exception if not.
         */
        check(validProps, layerName) {
            for (let propName of this.map.keys()) {
                let prop = validProps.get(propName);
                for (let other of prop.otherPropsRequired) {
                    if (!this.has(other)) {
                        throw new Error('Property "' + propName + '" also requires ' +
                            'property "' + other + '" but the second one was ' +
                            'not found. This happened in the layer "' + layerName + '".');
                    }
                }
            }
        }
        keys() {
            return this.map.keys();
        }
    }
    // inventory of helpful vertices
    const V_Full = {
        vertices: [new Point(-32, -32), new Point(32, -32), new Point(32, 32), new Point(-32, 32)],
        shape: Physics.Shape.Rectangle,
    };
    const V_TriangleBulgeBR = {
        vertices: [new Point(-32, 32), new Point(32, 32), new Point(32, -32), new Point(-12, -12)],
        shape: Physics.Shape.Polygon,
    };
    const V_TriangleBR = {
        vertices: [new Point(-32, 32), new Point(32, 32), new Point(32, -32)],
        shape: Physics.Shape.Polygon,
    };
    // inventory of helpful collsion types
    const C_Bramble = new Set([
        CollisionType.Solid, CollisionType.Attack, CollisionType.Environment,
    ]);
    const C_Wall = new Set([
        CollisionType.Solid, CollisionType.Wall,
    ]);
    const TerrainMapping = new Map([
        // bramble
        ['bramble,bramble,none,none', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0 }],
        ['bramble,none,bramble,none', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0 }],
        ['none,none,bramble,bramble', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0 }],
        ['none,bramble,none,bramble', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0 }],
        ['none,none,none,bramble', { coll: { shape: V_TriangleBulgeBR, cTypes: C_Bramble }, angle: 0 }],
        ['none,bramble,none,none', { coll: { shape: V_TriangleBulgeBR, cTypes: C_Bramble }, angle: -90 }],
        ['bramble,none,none,none', { coll: { shape: V_TriangleBulgeBR, cTypes: C_Bramble }, angle: 180 }],
        ['none,none,bramble,none', { coll: { shape: V_TriangleBulgeBR, cTypes: C_Bramble }, angle: 90 }],
        // OOB
        ['bramble,bramble,bramble,bramble', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],
        ['none,bramble,bramble,bramble', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],
        ['bramble,none,bramble,bramble', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],
        ['bramble,bramble,none,bramble', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],
        ['bramble,bramble,bramble,none', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],
        // forest walls
        ['none,forestWalls,none,forestWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        ['forestWalls,none,forestWalls,none', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        ['none,none,forestWalls,forestWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        ['forestWalls,forestWalls,none,none', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        ['none,none,none,forestWalls', { coll: { shape: V_TriangleBR, cTypes: C_Wall }, angle: 0 }],
        ['none,forestWalls,none,none', { coll: { shape: V_TriangleBR, cTypes: C_Wall }, angle: -90 }],
        ['forestWalls,none,none,none', { coll: { shape: V_TriangleBR, cTypes: C_Wall }, angle: 180 }],
        ['none,none,forestWalls,none', { coll: { shape: V_TriangleBR, cTypes: C_Wall }, angle: 90 }],
        ['none,forestWalls,forestWalls,forestWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        ['forestWalls,none,forestWalls,forestWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        ['forestWalls,forestWalls,none,forestWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        ['forestWalls,forestWalls,forestWalls,none', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        // OOB
        ['forestWalls,forestWalls,forestWalls,forestWalls', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],
        // castle walls
        ['none,castleWalls,none,castleWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        ['castleWalls,none,castleWalls,none', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        ['none,none,castleWalls,castleWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        ['castleWalls,castleWalls,none,none', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        ['none,none,none,castleWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        ['none,castleWalls,none,none', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        ['castleWalls,none,none,none', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        ['none,none,castleWalls,none', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        ['none,castleWalls,castleWalls,castleWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        ['castleWalls,none,castleWalls,castleWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        ['castleWalls,castleWalls,none,castleWalls', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        ['castleWalls,castleWalls,castleWalls,none', { coll: { shape: V_Full, cTypes: C_Wall }, angle: 0 }],
        // OOB
        ['castleWalls,castleWalls,castleWalls,castleWalls', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],
    ]);
    /**
     * Parses roundabout map info on GIDs, tilesets, and terrains stored in
     * json file exported from Tiled. After constrcution supports lookup from
     * global ID (found in json data arrays) to more useful things.
     */
    class TileDataStructure {
        constructor(tilesets) {
            this.gid2tilesetName = new Map();
            this.gid2localIDs = new Map();
            /**
             * Map from tileset.name -> {local ID -> terrain.name}
             */
            this.tilesetLocalIDs = new Map();
            if (tilesets == null) {
                console.warn('No tilesets provided in map.');
                return;
            }
            for (let tileset of tilesets) {
                // seems like non-terrain tilesets won't have... well...
                // terrains.
                if (tileset.terrains == null) {
                    continue;
                }
                // build up local ID map w/ terrains
                let localIDs = new Map();
                for (let i = 0; i < tileset.terrains.length; i++) {
                    let terrain = tileset.terrains[i];
                    localIDs.set(i, terrain.name);
                }
                this.tilesetLocalIDs.set(tileset.name, localIDs);
                // build up global ID map w/ tiles
                for (let tileIDstr in tileset.tiles) {
                    let gid = tileset.firstgid + parseInt(tileIDstr);
                    this.gid2tilesetName.set(gid, tileset.name);
                    this.gid2localIDs.set(gid, tileset.tiles[tileIDstr].terrain);
                }
            }
        }
        descriptor(gid) {
            let terrainNames = this.terrainNames(gid);
            // tmp: log for fun
            // console.log(terrainNames);
            if (terrainNames == null || (!TerrainMapping.has(terrainNames))) {
                return [terrainNames, null];
            }
            return [terrainNames, TerrainMapping.get(terrainNames)];
        }
        terrainNames(gid) {
            if (!this.gid2localIDs.has(gid)) {
                return null;
            }
            let localIDs = this.gid2localIDs.get(gid);
            if (!this.gid2tilesetName.has(gid)) {
                return null;
            }
            let tilesetName = this.gid2tilesetName.get(gid);
            if (!this.tilesetLocalIDs.has(tilesetName)) {
                return null;
            }
            let lid = this.tilesetLocalIDs.get(tilesetName);
            return [
                lid.has(localIDs[0]) ? lid.get(localIDs[0]) : 'none',
                lid.has(localIDs[1]) ? lid.get(localIDs[1]) : 'none',
                lid.has(localIDs[2]) ? lid.get(localIDs[2]) : 'none',
                lid.has(localIDs[3]) ? lid.get(localIDs[3]) : 'none',
            ].join(',');
        }
    }
    class GameMap {
        constructor(ecs, weapons, shields, attributes) {
            this.ecs = ecs;
            /**
             * Scene-specific factory overrides.
             */
            this.blueprint = new Map();
            /**
             * All properties.
             */
            let propertyList = [
                new CoreProperty(),
                new Activity(),
                new AISpec(),
                new Animations(),
                new AnimationCustomize(),
                new Audible(),
                new Attributes(attributes),
                new Bjorn(),
                new Checkpoint(),
                new CollisionGenerate(),
                new CollisionManual(),
                new CollisionTypes(),
                new Comboable(),
                new Destructible(),
                new DrawLayer(),
                new Enemy(),
                new Gate(),
                new GateID(),
                new Health(),
                new Img(),
                new Item(),
                new Knockbackable(),
                new Lightbulbs(),
                new Move(),
                new ParentLayer(),
                new PhysicsRegion(),
                new PersistentDamage(),
                new Player(),
                new Respawn(),
                new Shields(shields),
                new Staggerable(),
                new Weapons(weapons),
                new Zone(),
            ];
            /**
             * All properties, with name -> property.
             */
            this.propertyMap = (new PropertyMap()).build(propertyList);
        }
        /**
         * NEW: LAYER DEFINITIONS (v2.0)
         *
         * Builds up factory from a json file of layer -> {k: v} dicts.
         * @param json "layerName": { k: v, k: v, ... }
         */
        parseFactory(json) {
            this.factory = Conversion.inheritanceBuild(json, 'parentLayer', (layerJson) => { return (new ValMap()).parse(this.propertyMap, layerJson); }, (parent, child) => {
                return parent.copy().extendWith(child);
            });
        }
        setBlueprint(json) {
            // clear anything that exists
            this.blueprint.clear();
            // copy in current factory layers
            for (let [layerName, valMap] of this.factory.entries()) {
                this.blueprint.set(layerName, valMap.copy());
            }
            // may have no blueprint.json. that's OK! just use the factory.
            if (json == null) {
                return;
            }
            // blueprint.json rules:
            // - each layer must have a unique name (not in factory.json)
            // - each layer must have a parentLayer property that refers to
            //	 something in factory.json
            for (let layerName in json) {
                // sanity checks
                if (this.factory.has(layerName)) {
                    throw new Error('blueprint.json had same layer "' + layerName + '" as layer in factory.json');
                }
                let layer = json[layerName];
                if (!layer.hasOwnProperty('parentLayer')) {
                    throw new Error('blueprint.json layer "' + layerName + '" did not have required "parentLayer" layer property');
                }
                let parentLayerName = layer.parentLayer;
                if (!this.factory.has(parentLayerName)) {
                    throw new Error('blueprint.json parentLayer "' + parentLayerName + '" does not exist in factory.json');
                }
                // make copy of parent layer from factory, extend & override
                let overrideLayer = this.factory.get(parentLayerName).copy();
                overrideLayer.parse(this.propertyMap, layer);
                this.blueprint.set(layerName, overrideLayer);
            }
        }
        /**
         * NEW: OBJECT DEFINITIONS (v2.0)
         *
         * @param json
         */
        parseBareMap(json) {
            let tds = new TileDataStructure(json.tilesets);
            for (let layer of json.layers) {
                // for layers that have known objects, produce them.
                if (layer.type === 'objectgroup' && layer.hasOwnProperty('objects') && this.blueprint.has(layer.name)) {
                    for (let object of layer.objects) {
                        this.parseObject(object, this.blueprint.get(layer.name), layer.name);
                    }
                }
                // parse tile layers and construct collision boxes.
                if (layer.type === 'tilelayer') {
                    this.parseTiles(tds, layer, json.tilewidth, json.tileheight);
                }
            }
            // build collision boxes around map.
            this.buildBorder(json.height * json.tileheight, json.width * json.tilewidth);
        }
        /**
         * Builds border around map so player doesn't walk out.
         */
        buildBorder(height, width, thickness = 64) {
            const cTypes = new Set([CollisionType.Solid, CollisionType.Wall]);
            // [dims(w, h), p(x, y)] of [left, top, right, bottom]
            const worklist = [
                [new Point(thickness, height), new Point(-thickness / 2, height / 2)],
                [new Point(width, thickness), new Point(width / 2, -thickness / 2)],
                [new Point(thickness, height), new Point(width + thickness / 2, height / 2)],
                [new Point(width, thickness), new Point(width / 2, height + thickness / 2)],
            ];
            for (let [dims, p] of worklist) {
                let e = this.ecs.addEntity();
                this.ecs.addComponent(e, Component.CollisionShape.buildRectangle(dims, cTypes));
                this.ecs.addComponent(e, new Component.Position(p));
            }
        }
        /**
         * Parses tiles from `layer` in order to build collision objects in
         * bulk.
         */
        parseTiles(tds, layer, tilewidth, tileheight) {
            // pick out objects to use
            let objectLayer = null;
            let objectMap = new Map([
                ['bramble', 'brambleTile'],
                ['forestWalls', 'wallTile'],
            ]);
            if (objectMap.has(layer.name)) {
                objectLayer = objectMap.get(layer.name);
            }
            else {
                return;
            }
            // populate
            for (let i = 0; i < layer.data.length; i++) {
                let gid = layer.data[i];
                // ignore empty spots.
                if (gid === 0) {
                    continue;
                }
                // lookup if we know how + want to make this one, and produce
                // it if so.
                let [terrains, desctiptor] = tds.descriptor(gid);
                if (desctiptor == null) {
                    continue;
                }
                // maybe override layer if the terrain tile descriptor says to
                let curObjectLayer = objectLayer;
                if (desctiptor.objLayerOverride != null) {
                    curObjectLayer = desctiptor.objLayerOverride;
                }
                let objJson = {
                    height: 0.01,
                    width: 0.01,
                    rotation: desctiptor.angle,
                    x: (i % layer.width) * tilewidth + tilewidth / 2,
                    y: Math.floor(i / layer.width) * tileheight + tileheight / 2,
                };
                let e = this.produce(curObjectLayer, objJson);
                // this.ecs.addComponent(e, new Component.DebugTileInfo(terrains));
                this.ecs.addComponent(e, new Component.CollisionShape(desctiptor.coll.shape.vertices, desctiptor.coll.cTypes, desctiptor.coll.shape.shape));
            }
        }
        /**
         * Ask the factory to produce a unit.
         *
         * @param layerName
         * @param json Note that the width and height can be dummy values (like
         *	   0) and this is still OK (I think) (if you're curious why, read
         *	   the code and update this comment).
         */
        produce(layerName, json) {
            // sanity check
            if (!this.blueprint.has(layerName)) {
                throw new Error('Attempted to create object "' + layerName +
                    '" which was not in factory/blueprint.');
            }
            return this.parseObject(json, this.blueprint.get(layerName), layerName);
        }
        parseObject(json, layerProps, layerName) {
            // This is the ground-truth set of all properties we can deal with.
            let validProps = this.propertyMap;
            // copy over properties from the layer
            let objProps = layerProps.copy();
            // parse core props for object
            objProps.set(CoreProperty.name, validProps.get(CoreProperty.name).parseParams(json));
            // use object-specific properties as overrides and additions
            if (json.hasOwnProperty('properties')) {
                objProps.parse(validProps, json.properties);
            }
            // check if list of props are valid
            objProps.check(validProps, layerName);
            // make the object!
            // create entity
            let entity = this.ecs.addEntity();
            // apply custom properties to object. all properties may be applied
            // in any order.
            for (let propName of objProps.keys()) {
                validProps.get(propName).apply(entity, this.ecs, objProps);
            }
            // add in a final debug layer to know where it came from.
            this.ecs.addComponent(entity, new Component.DebugKVLayer(layerName));
            // pass the entity back for callers that want it
            return entity;
        }
    }
    GameMap_1.GameMap = GameMap;
})(GameMap || (GameMap = {}));
// Game logic relevant things. If you think of a better name I'm all ears.
var Logic;
(function (Logic) {
    let ZoneType;
    (function (ZoneType) {
        ZoneType[ZoneType["Camera"] = 0] = "Camera";
        ZoneType[ZoneType["NearExit"] = 1] = "NearExit";
        ZoneType[ZoneType["NextToExit"] = 2] = "NextToExit";
        ZoneType[ZoneType["EnemyGateGroup"] = 3] = "EnemyGateGroup";
    })(ZoneType = Logic.ZoneType || (Logic.ZoneType = {}));
    /**
     * Convert external zone spec to internal zone info.
     * @param zoneSpec
     */
    function convertZoneSpec(zoneSpec) {
        // built up set of zone types
        let zts = new Set();
        if (zoneSpec.zoneTypes != null) {
            for (let rzt of zoneSpec.zoneTypes) {
                let zt = ZoneType[rzt];
                if (zt == null) {
                    throw new Error('Unknown ZoneType: "' + rzt + '".');
                }
                zts.add(zt);
            }
        }
        // default active to true
        let active = true;
        if (zoneSpec.active != null) {
            active = zoneSpec.active;
        }
        return {
            zoneTypes: zts,
            active: active,
            gateID: zoneSpec.gateID || null,
            instructionID: zoneSpec.instructionID || null,
            controlID: zoneSpec.controlID || null,
        };
    }
    Logic.convertZoneSpec = convertZoneSpec;
})(Logic || (Logic = {}));
/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="../gj7/gamemap.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../engine/saving.ts" />
var Scene;
(function (Scene) {
    /**
     * Gets the name of a script, handling defaults if not provided.
     */
    function getStartScriptName(scripts, gameMode) {
        // use whatever is provided if possible
        if (scripts != null && scripts.start != null) {
            return scripts.start;
        }
        // defaults
        if (this.gameMode === Game.Mode.DEBUG) {
            return 'StartLevelDev';
        }
        else {
            return 'StartLevel';
        }
    }
    /**
     * Provides information on scenes.
     *
     * NOTE: This is pretty awkward. All the properties are publically
     * accessible. This smells like OO-garbage. Consider dumping.
     */
    class InfoProvider {
        constructor(manager) {
            this.manager = manager;
        }
        get mapDims() {
            return this.manager.mapDims;
        }
        get levelNum() {
            return this.manager.activeScene.level.number;
        }
        get levelName() {
            return this.manager.activeScene.level.name;
        }
        get act() {
            return this.manager.activeScene.scripts.act;
        }
        get startScriptName() {
            return getStartScriptName(this.manager.activeScene.scripts, this.manager.gameMode);
        }
    }
    Scene.InfoProvider = InfoProvider;
    function sanityCheckMap(map) {
        // because our map spec got more complicated
        if (map.bottom == null && map.bottom_tiles == null) {
            throw new Error('Map requires either .bottom or .bottom_tiles to be defined.');
        }
        if (map.bottom != null && map.bottom_tiles != null) {
            console.warn('Map should not have both .bottom and .bottom_tiles defined.');
        }
        if (map.top != null && map.top_tiles != null) {
            console.warn('Map should not have both .top and .top_tiles defined.');
        }
    }
    function getMapDims(map) {
        // use single image map if it's there.
        let bImg = map.bottom;
        if (bImg != null) {
            return new Point(PIXI.utils.TextureCache[bImg].width, PIXI.utils.TextureCache[bImg].height);
        }
        // else we have bg image tiles. figure out total width and height.
        let maxW = 0, maxH = 0;
        for (let tile of map.bottom_tiles) {
            maxW = Math.max(maxW, tile.pos[0] + PIXI.utils.TextureCache[tile.img].width);
            maxH = Math.max(maxH, tile.pos[1] + PIXI.utils.TextureCache[tile.img].height);
        }
        return new Point(maxW, maxH);
    }
    /**
     * Manages scenes. Part of the engine, ish, but also just kind of a plugin,
     * that acts on it, really.
     *
     * Use the `infoProvider` to get info about the active scene.
     *
     * (I know, I know, "Manager" classes are gross. I started to write this as
     * a function, but... right now I'll take not having to pass tones of
     * objects around over some kind of preceived design cleanliness.)
     */
    class Manager {
        constructor(ecs, scriptRunner, gm, scenes, seasons, progression, credits, resources, gameMode) {
            this.ecs = ecs;
            this.scriptRunner = scriptRunner;
            this.gm = gm;
            this.scenes = scenes;
            this.seasons = seasons;
            this.progression = progression;
            this.credits = credits;
            this.gameMode = gameMode;
            this.infoProvider = new InfoProvider(this);
            this.mapDims = new Point();
            this.activeScene = null;
            this._activeIdx = -1;
            this.mapJsons = new Map();
            this.blueprintJsons = new Map();
            // cache map and blueprint jsons for our own
            for (let [name, scene] of this.scenes.entries()) {
                if (scene.map.json != null && scene.map.json.length > 0) {
                    this.mapJsons.set(name, resources[scene.map.json].data);
                }
                if (scene.blueprint != null && scene.blueprint.length > 0) {
                    this.blueprintJsons.set(name, resources[scene.blueprint].data);
                }
            }
        }
        get activeIdx() {
            return this._activeIdx;
        }
        nextLevel() {
            this.switchToRelative(1);
        }
        /**
         * Player can trigger this explicitly.
         */
        resetScene() {
            this.switchToRelative(0, true);
        }
        /**
         * Built for debugging.
         * @param n Name of scene to switch to
         */
        switchToName(n) {
            for (let i = 0; i < this.progression.length; i++) {
                if (this.progression[i] === n) {
                    this.switchTo(i);
                    return;
                }
            }
            console.warn('Scene "' + n + '" not found. Ignoring request.');
        }
        switchToRelative(increment, softReset = false) {
            // mod doesn't work for negative numbers
            let idx = (this.activeIdx + increment) % this.progression.length;
            if (idx < 0) {
                idx = this.progression.length + idx;
            }
            this.switchTo(idx, softReset);
        }
        /**
         * Adds BG or FG (set by `z`) image(s) to the game. At most one of
         * `single` or `tiles` (neither OK, but not both) should be provided.
         */
        addImgs(single, tiles, z) {
            let queue = [];
            if (single != null) {
                // single image case
                queue.push([new Point(0, 0), single]);
            }
            if (tiles != null) {
                // tiled image case
                for (let tile of tiles) {
                    queue.push([new Point(tile.pos[0], tile.pos[1]), tile.img]);
                }
            }
            // add 'em to the game!
            for (let [pos, img] of queue) {
                let e = this.ecs.addEntity();
                this.ecs.addComponent(e, new Component.Position(pos));
                this.ecs.addComponent(e, new Component.StaticRenderable(img, z, StageTarget.World, new Point(0, 0)));
            }
        }
        switchTo(idx, softReset = false) {
            // set new one as active
            this._activeIdx = idx;
            let active = this.progression[this.activeIdx];
            // load blueprint json. if none specified, we pass in null, which
            // is OK.
            let blueprintJson = null;
            if (this.blueprintJsons.has(active)) {
                blueprintJson = this.blueprintJsons.get(active);
            }
            this.gm.setBlueprint(blueprintJson);
            // destroy all entities. (placed after factory & blueprint parsing
            // because some systems will try to refill their entity pool during
            // their onClear(), and at the first level of the game, the factory
            // must exist for them to do so!)
            this.scriptRunner.clear();
            this.ecs.clear();
            // load json-defined map if possible
            if (this.mapJsons.has(active)) {
                console.log('Loading map "' + active + '".');
                this.gm.parseBareMap(this.mapJsons.get(active));
            }
            this.activeScene = this.scenes.get(active);
            let map = this.activeScene.map;
            // figure out the size of the bottom image as our map size.
            sanityCheckMap(map);
            this.mapDims = getMapDims(map);
            // put in bottom and top image(s)
            this.addImgs(map.bottom, map.bottom_tiles, ZLevelWorld.BG);
            this.addImgs(map.top, map.top_tiles, ZLevelWorld.Top);
            // do any particle modifications if specified
            let particleIDs = this.activeScene.level.particleIDs;
            if (particleIDs != null) {
                this.ecs.getSystem(System.ParticleRenderer).enableOnly(particleIDs);
            }
            // do any music modifications if specified
            let audioSystem = this.ecs.getSystem(System.Audio);
            let trackIDs = this.activeScene.level.trackIDs;
            if (trackIDs != null) {
                audioSystem.playMusic(trackIDs);
            }
            let bookkeeper = this.ecs.getSystem(System.Bookkeeper);
            // save progress
            Saving.save(active, audioSystem.getPlaying(), bookkeeper.serialize());
            // run startup script. also decide whether to tell bookkeeper about
            // this level (only for "normal" levels)
            let ssName = getStartScriptName(this.activeScene.scripts, this.gameMode);
            let setIdx = true;
            switch (ssName) {
                case 'StartLevel': {
                    this.scriptRunner.run(new Script.StartLevel(this.infoProvider, this.gm));
                    break;
                }
                case 'StartLevelDev': {
                    this.scriptRunner.run(new Script.StartLevelDev(this.infoProvider, this.gm));
                    break;
                }
                case 'StartLevelMultipartFirst': {
                    this.scriptRunner.run(new Script.StartLevelMultipartFirst(this.infoProvider, this.gm));
                    break;
                }
                case 'StartLevelMultipartMid': {
                    this.scriptRunner.run(new Script.StartLevelMultipartMid(this.infoProvider, this.gm));
                    setIdx = false;
                    break;
                }
                case 'StartLevelMultipartLast': {
                    this.scriptRunner.run(new Script.StartLevelMultipartLast(this.infoProvider, this.gm));
                    setIdx = false;
                    break;
                }
                case 'StartLevelTitle': {
                    this.scriptRunner.run(new Script.StartLevelTitle());
                    setIdx = false;
                    break;
                }
                case 'StartLevelCredits': {
                    this.scriptRunner.run(new Script.StartLevelCredits(this.credits));
                    setIdx = false;
                    break;
                }
                case 'StartLevelRecap': {
                    this.scriptRunner.run(new Script.StartLevelRecap());
                    setIdx = false;
                    break;
                }
                case 'StartLevelAct': {
                    this.scriptRunner.run(new Script.StartLevelAct(this.seasons.get(this.activeScene.scripts.act)));
                    setIdx = false;
                    break;
                }
                default: {
                    throw new Error('Unrecognized start script: ' + ssName);
                }
            }
            // fresh start for new level
            if (setIdx && !softReset) {
                bookkeeper.setActive(idx);
            }
            if (softReset) {
                bookkeeper.softReset();
            }
        }
    }
    Scene.Manager = Manager;
})(Scene || (Scene = {}));
/// <reference path="../core/base.ts" />
/// <reference path="../graphics/stage.ts" />
var Stage;
(function (Stage) {
    /**
     * Stretches a single texture to be the bar.
     *
     * TODO: this is gross because both this and the sprite repeat the z and
     * stageTarget.
     */
    class TextureBar extends PIXI.Container {
        constructor(img, z, stageTarget, position, dimensions) {
            super();
            this.img = img;
            this.z = z;
            this.stageTarget = stageTarget;
            this.dimensions = dimensions;
            this.portion = 1.0;
            this.sprite = Stage.Sprite.build(img, z, stageTarget, new Point(0, 0));
            this.sprite.width = this.dimensions.x * this.portion;
            this.sprite.height = this.dimensions.y;
            this.addChild(this.sprite);
            this.position.set(position.x, position.y);
        }
        update() {
            this.sprite.width = this.dimensions.x * this.portion;
        }
    }
    Stage.TextureBar = TextureBar;
    /**
     * From its position, bar draws up and to the right.
     */
    class PixelBar extends PIXI.Container {
        constructor(settings) {
            super();
            this.settings = settings;
            this.portion = 1.0;
            this.lastPortion = -1;
            this.outline = new PIXI.Graphics();
            this.fill = new PIXI.Graphics();
            // static adjustments (probably move)
            this.outline.alpha = 0.5;
            this.fill.alpha = 0.8;
            this.addChild(this.outline);
            this.addChild(this.fill);
        }
        draw() {
            // clear prev
            this.outline.clear();
            this.fill.clear();
            // draw outline
            this.outline.beginFill(this.settings.outlineColor);
            this.outline.drawRect(0, 0, this.settings.dimensions.x, -this.settings.dimensions.y);
            this.outline.endFill();
            // draw fill
            let width = this.portion * (this.settings.dimensions.x - 2);
            this.fill.beginFill(this.settings.fillColor);
            this.fill.drawRect(1, -1, width, -this.settings.dimensions.y + 2);
            this.fill.endFill();
        }
        update() {
            // redraw if needed
            if (this.portion != this.lastPortion) {
                this.draw();
                this.lastPortion = this.portion;
            }
            // TODO: effects here somehow
            // TODO: how to do stuff like trigger particles?
        }
    }
    Stage.PixelBar = PixelBar;
})(Stage || (Stage = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/gamemap.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/animatable.ts" />
var FX;
(function (FX) {
    /**
     * Each Emitter controls emitting a single type of particles. It holds a
     * pool of those particles and fields requests to display them.
    */
    class Emitter {
        constructor(ecs, factory, id, duration, poolSize) {
            this.ecs = ecs;
            this.factory = factory;
            this.id = id;
            this.duration = duration;
            this.poolSize = poolSize;
            this.active = new Array();
            this.pool = new Array();
            this.baseFactoryObj = {
                x: 0,
                y: 0,
                rotation: 0,
                width: 0,
                height: 0,
            };
            // sanity checking
            if (duration < -1) {
                console.error('Invalid duration for fx "' + id + '": ' + duration);
                return;
            }
            // NOTE: trying to avoid this here b/c otherwise we do it twice on game startup (because
            // onClear() called once at beginning of game to start first level).
            // this.refillPools();
        }
        refillPools() {
            // drain any existing pools. When we transition levels, we still
            // have our active and pool reservoirs, but the entities are all
            // stale because they refer to non-existing entities!
            arrayClear(this.active);
            arrayClear(this.pool);
            // fill the pool
            for (let i = 0; i < this.poolSize; i++) {
                // build obj. note: not doing a check for
                // Component.Animatable.name because we'll crash if we don't
                // have it anyway.
                let entity = this.factory.produce(this.id, this.baseFactoryObj);
                let comps = this.ecs.getComponents(entity);
                let anim = comps.get(Component.Animatable);
                anim.pause = true;
                anim.visible = false;
                // put in pool
                this.pool.push({
                    effect: entity,
                    elapsed: 0,
                });
            }
        }
        /**
         * API to emit particles
         * @param x
         * @param y
         * @param direction optional number in [0, 2pi]; if null, picks
         * randomly
         */
        emit(x, y, direction = null) {
            // edge case: if nothing in pool, no emissions, ever.
            if (this.poolSize == 0) {
                return;
            }
            // if nothing in the pool, reclaim oldest active item.
            if (this.pool.length === 0) {
                this.reclaim(0);
            }
            // we have at least one item in the pool; activate and move to
            // active list
            let pkg = this.pool.pop();
            let comps = this.ecs.getComponents(pkg.effect);
            let pos = comps.get(Component.Position);
            let anim = comps.get(Component.Animatable);
            pos.setP(x, y);
            pos.angle = direction || Probability.uniformReal(0, Constants.TWO_PI);
            anim.reset = true;
            anim.visible = true;
            anim.pause = false;
            pkg.elapsed = 0;
            this.active.push(pkg);
        }
        /**
         * Reclaims element i from active and returns to pool.
         * @param i index of active list
         */
        reclaim(i) {
            let pkg = this.active[i];
            let comps = this.ecs.getComponents(pkg.effect);
            let anim = comps.get(Component.Animatable);
            anim.visible = false;
            anim.pause = true;
            this.active.splice(i, 1);
            this.pool.push(pkg);
        }
        /**
         * Engine calls this every frame.
         * @param delta
         */
        update(delta) {
            // if we have infinitely-lasting particles, don't ever worry about
            // reclaiming
            if (this.duration === -1) {
                return;
            }
            // reclaim loop
            for (let i = this.active.length - 1; i >= 0; i--) {
                // update elapsed
                let pkg = this.active[i];
                pkg.elapsed += delta;
                // recycle to pool if needed
                if (pkg.elapsed > this.duration) {
                    this.reclaim(i);
                }
            }
        }
    }
    FX.Emitter = Emitter;
})(FX || (FX = {}));
var Handler;
(function (Handler) {
    /**
     * Sending events to the bookkeeeper.
     */
    class Bookkeeping extends Events.Handler {
        constructor() {
            super(...arguments);
            this.dispatcher = new Map([
                [Events.EventTypes.ThingDead, this.thingDead],
                [Events.EventTypes.GameplayStart, this.startLevel],
            ]);
            // NOTE: ending the level had a race condition with other functions
            // waiting on the same event. we just compute the end level time there
            // :-)
        }
        thingDead(et, args) {
            let bookkeeper = this.ecs.getSystem(System.Bookkeeper);
            switch (args.thingType) {
                case Ontology.Thing.Enemy:
                    bookkeeper.enemyKilled();
                    break;
                case Ontology.Thing.Destructible:
                    bookkeeper.destructibleSmashed();
                    break;
                case Ontology.Thing.Player:
                    bookkeeper.playerDied();
                    break;
            }
        }
        startLevel(et, args) {
            this.ecs.getSystem(System.Bookkeeper).startLevel();
        }
    }
    Handler.Bookkeeping = Bookkeeping;
})(Handler || (Handler = {}));
/// <reference path="../core/tween.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/stage.ts" />
var System;
(function (System) {
    /**
     * TODO: consider pulling somewhere else so this isn't globally called
     * `System.ShakeType`
     */
    let ShakeType;
    (function (ShakeType) {
        ShakeType[ShakeType["JumpEaseBack"] = 0] = "JumpEaseBack";
        ShakeType[ShakeType["Wobble"] = 1] = "Wobble";
    })(ShakeType = System.ShakeType || (System.ShakeType = {}));
    /**
     * Modifies final camera position to add addl. effects (like screen
     * shakes).
     */
    class FxCamera extends Engine.System {
        constructor(stage) {
            super();
            this.stage = stage;
            // state
            this.cacheDelta = new Point();
            // -1 means nothing active
            this.frameIdx = -1;
            // shake parameters (passed in; these are dummy default values)
            this.angle = 0;
            this.nFrames = 0;
            this.magnitude = 0;
            this.shakeType = ShakeType.JumpEaseBack;
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
        }
        /**
         * API for requesting fx (currently only shake)
         * @param angle direction to shake *towards* in radians
         */
        shake(angle, nFrames, magnitude, shakeType) {
            this.frameIdx = 0;
            // we reverse the angle internally because cameras are backwards!
            // (because it's just moving the stage under the viewport)
            this.angle = angleClamp(angle + Math.PI);
            this.nFrames = nFrames;
            this.magnitude = magnitude;
            this.shakeType = shakeType;
        }
        /**
         * Sets this.cacheDelta
         */
        wobble() {
            // a sin(bx)
            // a = amplitude
            // b = period (multiplier)
            // hard settings (can pass in if desired)
            let b = 0.4;
            // amplitude diminishes over time
            let a = this.magnitude * (1.0 - Tween.easeOutCubic(this.frameIdx, this.nFrames));
            let len = a * Math.sin(b * this.frameIdx);
            this.cacheDelta.x = Math.cos(this.angle) * len;
            this.cacheDelta.y = -Math.sin(this.angle) * len;
        }
        /**
         * Sets this.cacheDelta
         */
        jumpEaseBack() {
            // move in the specified direction. y is flipped because i can
            // never remember what coordinate system anything is in.
            let portion = 1.0 - Tween.easeOutCubic(this.frameIdx, this.nFrames);
            let len = portion * this.magnitude;
            this.cacheDelta.x = Math.cos(this.angle) * len;
            this.cacheDelta.y = -Math.sin(this.angle) * len;
        }
        update(delta, entities) {
            // check whether we have any ongoing shakes
            if (this.frameIdx == -1) {
                return;
            }
            // use specified shake type to compute offset
            switch (this.shakeType) {
                case ShakeType.JumpEaseBack: {
                    this.jumpEaseBack();
                    break;
                }
                case ShakeType.Wobble: {
                    this.wobble();
                    break;
                }
                default: {
                    throw new Error('Unimplemented shake type: ' + this.shakeType);
                }
            }
            // apply delta
            this.stage.x += this.cacheDelta.x;
            this.stage.y += this.cacheDelta.y;
            // increment our frame index and disable if necessary
            this.frameIdx++;
            if (this.frameIdx >= this.nFrames) {
                this.frameIdx = -1;
            }
        }
    }
    System.FxCamera = FxCamera;
})(System || (System = {}));
/// <reference path="../system/fx-camera.ts" />
var Handler;
(function (Handler) {
    class Camera extends Events.Handler {
        /**
         * TODO: is this really the best way to get systems? I haven't had to
         * get a system before, so there's no API for it. This could be solved
         * with some kind of message bus. It'd be overkill right now.
         * @param fxCamera
         */
        constructor(fxCamera) {
            super();
            this.fxCamera = fxCamera;
            // Settings
            this.enemyStaggerMagnitude = 100;
            this.enemyStaggerFrames = 40;
            this.enemyStaggerType = System.ShakeType.JumpEaseBack;
            this.playerHitMagnitude = 75;
            this.playerHitFrames = 60;
            this.playerHitType = System.ShakeType.Wobble;
            this.playerBlocksMagnitude = 15;
            this.playerBlocksFrames = 30;
            this.playerBlocksType = System.ShakeType.JumpEaseBack;
            this.explosionMagnitude = 90;
            this.explosionFrames = 60;
            this.explosionType = System.ShakeType.Wobble;
            this.dispatcher = new Map([
                [Events.EventTypes.EnemyStaggerPre, this.enemyStaggerShake],
                [Events.EventTypes.Damage, this.damageShake],
                [Events.EventTypes.Block, this.blockShake],
                [Events.EventTypes.Explosion, this.explosionShake],
            ]);
        }
        blockShake(et, args) {
            // currently only shaking when player blocks
            if (args.defenderType !== Ontology.Thing.Player) {
                return;
            }
            this.fxCamera.shake(args.angleAtoB, this.playerBlocksFrames, this.playerBlocksMagnitude, this.playerBlocksType);
        }
        explosionShake(et, args) {
            this.fxCamera.shake(Constants.HALF_PI, this.explosionFrames, this.explosionMagnitude, this.explosionType);
        }
        damageShake(et, args) {
            // currently only shaking when player hit
            if (args.victimType !== Ontology.Thing.Player) {
                return;
            }
            this.fxCamera.shake(0, this.playerHitFrames, this.playerHitMagnitude, this.playerHitType);
        }
        enemyStaggerShake(et, args) {
            if (!args.heavyEffects) {
                return;
            }
            this.fxCamera.shake(args.angleAtoV, this.enemyStaggerFrames, this.enemyStaggerMagnitude, this.enemyStaggerType);
        }
    }
    Handler.Camera = Camera;
})(Handler || (Handler = {}));
/// <reference path="../engine/script.ts" />
var Script;
(function (Script) {
    /**
     * This is a simple test script to demonstrate different ways data can be
     * provided to a script (compile-time member, passed member, or calling
     * args), as well as what a `code` map can look like.
     */
    class TestScript extends Script.Script {
        /**
         * Passed member
         * @param cs
         */
        constructor(cs) {
            super();
            this.cs = cs;
            /**
             * Compile-time member.
             */
            this.secret = 42;
            // Settings for pinger. NOTE: can probably use closures for this kind
            // of state (!)---may finally be the perfect way to run closures (both
            // getting local state but also running in a controlled way during the
            // designated update period) (?!?).
            this.sinceLastPing = 0;
            this.pingCount = 0;
            this.maxPings = 10;
            /**
             * This code runs the `hello()` function after 5s (5000ms).
             */
            this.code = new Map([
                [2000, { func: this.hello, args: { n1: 12, s1: 'foobleu' } }],
                [3000, { func: this.kickoff, args: null }],
            ]);
        }
        /**
         * Hello takes args that are defined at compile time. It can also read
         * from all members, which could be defined at runtime.
         * @param args
         */
        hello(args) {
            console.log('hello from TestScript');
            console.log('my secret is ' + this.secret);
            console.log('my constructor secret is ' + this.cs);
            console.log('my first arg is ' + args.n1);
            console.log('my second arg is ' + args.s1);
        }
        pinger(delta) {
            this.sinceLastPing += delta;
            if (this.sinceLastPing > 100) {
                console.log('ping ' + this.pingCount);
                this.pingCount += 1;
                this.sinceLastPing = 0;
                if (this.pingCount > this.maxPings) {
                    return true;
                }
            }
            return false;
        }
        kickoff() {
            console.log('TestScript kicking off pinger');
            this.active.push(this.pinger);
        }
    }
    Script.TestScript = TestScript;
})(Script || (Script = {}));
/// <reference path="../script/test.ts" />
var Handler;
(function (Handler) {
    /**
     * Handles logic for what happens when the player activates a checkpoint.
     *
     * (Could eventually refactor into some kind of "core gj7 logic" handler.)
     */
    class Checkpoint extends Events.Handler {
        constructor(gm) {
            super();
            this.gm = gm;
            this.dispatcher = new Map([
                [Events.EventTypes.Checkpoint, this.checkpoint],
            ]);
        }
        checkpoint(et, args) {
            // sound effect (separate handler)
            // text (separate handler)
            let playerSelector = this.ecs.getSystem(System.PlayerSelector);
            let enemySelector = this.ecs.getSystem(System.EnemySelector);
            // make player go here next
            let checkpointComps = this.ecs.getComponents(args.checkpoint);
            let cauldronPos = checkpointComps.get(Component.Position);
            for (let player of playerSelector.latest()) {
                let playerComps = this.ecs.getComponents(player);
                let spawnable = playerComps.get(Component.Spawnable);
                spawnable.position.copyFrom_(cauldronPos.p).add_(Checkpoint.SPAWN_OFFSET);
            }
            // make all dead enemies no longer able to be respawned
            for (let enemy of enemySelector.latest()) {
                let enemyComps = this.ecs.getComponents(enemy);
                // if it's not dead, let it keep any spawnable prop it has
                if (!enemyComps.has(Component.Dead)) {
                    continue;
                }
                this.ecs.removeComponentIfExists(enemy, Component.Spawnable);
            }
            // and add the new 'checkpoint on' entity
            this.ecs.removeEntity(args.checkpoint);
            this.gm.produce('checkpointsActiveTemplate', {
                x: cauldronPos.p.x,
                y: cauldronPos.p.y,
                rotation: 0,
                width: 1,
                height: 1,
            });
        }
    }
    Checkpoint.SPAWN_OFFSET = new Point(16, -64);
    Handler.Checkpoint = Checkpoint;
})(Handler || (Handler = {}));
var Handler;
(function (Handler) {
    /**
     * For giving / revoking player control.
     */
    class Control extends Events.Handler {
        constructor() {
            super(...arguments);
            this.dispatcher = new Map([
                [Events.EventTypes.PlayerControl, this.handlePlayerControl],
            ]);
        }
        stopPlayer() {
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
        handlePlayerControl(et, args) {
            if (args.allow) {
                this.ecs.enableSystem(System.PlayerInputMouseKeyboard);
                this.ecs.enableSystem(System.PlayerInputGamepad);
            }
            else {
                this.ecs.disableSystem(System.PlayerInputMouseKeyboard);
                this.ecs.disableSystem(System.PlayerInputGamepad);
                this.stopPlayer();
            }
        }
    }
    Handler.Control = Control;
})(Handler || (Handler = {}));
/// <reference path="../script/test.ts" />
var Handler;
(function (Handler) {
    class Death extends Events.Handler {
        constructor(playerSelector, spawnableSelector) {
            super();
            this.playerSelector = playerSelector;
            this.spawnableSelector = spawnableSelector;
            this.dispatcher = new Map([
                [Events.EventTypes.ThingDead, this.thingDead],
            ]);
        }
        thingDead(et, args) {
            // enemy death
            if (args.thingType === Ontology.Thing.Enemy) {
                this.scriptRunner.run(new Script.EnemyDeath(args.thing));
                return;
            }
            // player death
            if (args.thingType === Ontology.Thing.Player) {
                this.scriptRunner.run(new Script.PlayerDeath(this.playerSelector, this.spawnableSelector));
                return;
            }
            // "other" deaths
            this.scriptRunner.run(new Script.OtherDeath(args.thing));
        }
    }
    Handler.Death = Death;
})(Handler || (Handler = {}));
/// <reference path="../script/test.ts" />
var Handler;
(function (Handler) {
    /**
     * Handles swapping bodies.
     */
    class EndSequence extends Events.Handler {
        constructor(gm) {
            super();
            this.gm = gm;
            this.dispatcher = new Map([
                [Events.EventTypes.SwapBodies, this.swapBodies],
                [Events.EventTypes.ThingDead, this.maybeTriggerScript],
            ]);
            // enemies may either be legit dead enemies, or bodies placed by this
            // handler swapping back from humanoid bodies
            this.toHumanoidMap = new Map([
                // blop <-> archer
                ['blop-1', 'archerBody'],
                ['blop1Body', 'archerBody'],
                // sen <-> king
                ['sentinel', 'kingBody'],
                ['senBody', 'kingBody'],
            ]);
            this.toEnemyMap = new Map([
                // blop <-> archer
                ['archerBody', 'blop1Body'],
                // sen <-> king
                ['kingBody', 'senBody'],
            ]);
        }
        // triggers the end-sequence script if enemy dead was final boss
        maybeTriggerScript(et, args) {
            let comps = this.ecs.getComponents(args.thing);
            if (!comps.has(Component.Enemy)) {
                return;
            }
            let enemy = comps.get(Component.Enemy);
            if (!enemy.finalBoss) {
                return;
            }
            this.scriptRunner.run(new Script.EndSequence());
        }
        swap(selectors, map) {
            for (let selector of selectors) {
                for (let entity of selector.latest()) {
                    if (!this.ecs.getComponents(entity).has(Component.DebugKVLayer)) {
                        continue;
                    }
                    let layer = this.ecs.getComponents(entity).get(Component.DebugKVLayer).layer;
                    if (!map.has(layer)) {
                        continue;
                    }
                    let pos = this.ecs.getComponents(entity).get(Component.Position);
                    let newLayer = map.get(layer);
                    this.gm.produce(newLayer, {
                        x: pos.p.x,
                        y: pos.p.y,
                        width: 1,
                        height: 1,
                        rotation: Constants.RAD2DEG * pos.angle,
                    });
                    this.ecs.removeEntity(entity);
                }
            }
        }
        swapBodies(et, args) {
            if (args.toHumanoid) {
                this.swap([
                    this.ecs.getSystem(System.EnemySelector),
                    this.ecs.getSystem(System.StaticRenderableSelector)
                ], this.toHumanoidMap);
            }
            else {
                this.swap([this.ecs.getSystem(System.StaticRenderableSelector)], this.toEnemyMap);
            }
        }
    }
    Handler.EndSequence = EndSequence;
})(Handler || (Handler = {}));
/// <reference path="../engine/events.ts" />
/// <reference path="../component/enemy.ts" />
/// <reference path="../system/selector.ts" />
var Handler;
(function (Handler) {
    class ExitConditionsComplete extends Events.Handler {
        constructor(gateSelector, zoneSelector, factory) {
            super();
            this.gateSelector = gateSelector;
            this.zoneSelector = zoneSelector;
            this.factory = factory;
            this.partyEntities = new Array();
            this.dispatcher = new Map([
                [Events.EventTypes.ExitConditions, this.exitConditionsChange],
            ]);
        }
        clear() {
            arrayClear(this.partyEntities);
        }
        exitConditionsChange(et, args) {
            if (args.fulfilled) {
                this.party(args.silent);
            }
            else {
                this.unparty();
            }
        }
        party(silent) {
            // launch the tween (if not silent)
            if (!silent) {
                this.ecs.getSystem(System.GUIManager).runSequence('exitReady');
            }
            for (let gateE of this.gateSelector.latest()) {
                let comps = this.ecs.getComponents(gateE);
                let gateC = comps.get(Component.Gate);
                if (!gateC.exit) {
                    continue;
                }
                let castle = comps.has(Component.DebugKVLayer) && comps.get(Component.DebugKVLayer).layer.endsWith('CastleGate');
                let knightY = castle ? 107 : 175;
                // add trumpet players
                let pos = comps.get(Component.Position);
                let degAngle = -(Constants.RAD2DEG * pos.angle);
                let knights = [
                    pos.p.copy().add_(new Point(130, knightY).rotate_(-pos.angle)),
                    pos.p.copy().add_(new Point(-130, knightY).rotate_(-pos.angle)),
                ];
                for (let knight of knights) {
                    let e = this.factory.produce('trumpetKnight', {
                        x: knight.x,
                        y: knight.y,
                        // TODO: needing to specify the w/h here is annoying.
                        // can we put some key in the core object properties
                        // (or in the factory production?) that lets us
                        // sidestep the tiled rotation business and just do
                        // our own game-centered positioning?
                        width: 1,
                        height: 1,
                        rotation: degAngle + 90,
                    });
                    this.partyEntities.push(e);
                }
                // add flags
                let flagY = castle ? 50 : 107;
                let flags = [{
                        pos: pos.p.copy().add_(new Point(120, flagY).rotate_(-pos.angle)),
                        layer: 'flagRight',
                    }, {
                        pos: pos.p.copy().add_(new Point(-120, flagY).rotate_(-pos.angle)),
                        layer: 'flagLeft',
                    }];
                for (let flag of flags) {
                    let e = this.factory.produce(flag.layer, {
                        x: flag.pos.x,
                        y: flag.pos.y,
                        width: 1,
                        height: 1,
                        rotation: degAngle,
                    });
                    this.partyEntities.push(e);
                }
                // add red carpet
                if (!castle) {
                    let e = this.factory.produce('carpet', {
                        x: pos.p.x,
                        y: pos.p.y,
                        width: 1,
                        height: 1,
                        rotation: degAngle,
                    });
                    this.partyEntities.push(e);
                }
            }
            // enable exit zones
            this.toggleExitZones(true);
        }
        unparty() {
            // remove any party entities
            while (this.partyEntities.length > 0) {
                this.ecs.removeEntity(this.partyEntities.pop());
            }
            // disable exit zones
            this.toggleExitZones(false);
        }
        toggleExitZones(setTo) {
            // enable exit regions
            for (let zone of this.zoneSelector.latest()) {
                let zoneComps = this.ecs.getComponents(zone);
                let zoneComp = zoneComps.get(Component.Zone);
                if (zoneComp.zoneTypes.has(Logic.ZoneType.NearExit) ||
                    zoneComp.zoneTypes.has(Logic.ZoneType.NextToExit)) {
                    zoneComp.active = setTo;
                }
            }
        }
    }
    __decorate([
        override
    ], ExitConditionsComplete.prototype, "clear", null);
    Handler.ExitConditionsComplete = ExitConditionsComplete;
    class NextToExit extends Events.Handler {
        constructor() {
            super(...arguments);
            this.dispatcher = new Map([
                [Events.EventTypes.ZoneTransition, this.playerZoneTransition],
            ]);
            /**
             * To avoid double-triggering the exit on rare circumstances (w/ certain
             * approach angles into the exit gate).
             */
            this.triggered = false;
        }
        clear() {
            this.triggered = false;
        }
        playerZoneTransition(et, args) {
            let zone = this.ecs.getComponents(args.zone).get(Component.Zone);
            if (!zone.zoneTypes.has(Logic.ZoneType.NextToExit) || this.triggered) {
                return;
            }
            if (args.enter) {
                this.firer.dispatch({
                    name: Events.EventTypes.StartExitSequence,
                    args: {},
                });
                this.triggered = true;
            }
        }
    }
    __decorate([
        override
    ], NextToExit.prototype, "clear", null);
    Handler.NextToExit = NextToExit;
    /**
     * NOTE: may want to turn into script so we can only enable exiting after a
     * certain time.
     */
    class ExitSequence extends Events.Handler {
        constructor(sceneManager) {
            super();
            this.sceneManager = sceneManager;
            this.dispatcher = new Map([
                [Events.EventTypes.StartExitSequence, this.handleStartExitSequence],
                [Events.EventTypes.MenuKeypress, this.menuKeypress],
            ]);
            this.levelSwitchEnabled = false;
            this.guiBookkeep = [];
        }
        clear() {
            arrayClear(this.guiBookkeep);
        }
        /**
         * Depending on the level type we either
         * (a) show the level report (normal)
         * (b) skip the level report and directly end (for multi-part levels
         *     where this isn't the last segment)
         */
        handleStartExitSequence(et, args) {
            let ssName = this.sceneManager.infoProvider.startScriptName;
            switch (ssName) {
                // intentional fallthrough for both multipart non-final levels
                case 'StartLevelMultipartFirst':
                case 'StartLevelMultipartMid':
                    this.ecs.getSystem(System.Bookkeeper).endLevel();
                    this.levelSwitchEnabled = true;
                    this.clearReportExitLevel();
                    break;
                // for all other cases, show the level report
                default:
                    this.showLevelReport();
                    break;
            }
        }
        showLevelReport() {
            // disable player HUD and input, and mark in cutscene for AIs
            this.ecs.disableSystem(System.PlayerHUDRenderer);
            this.firer.dispatch({
                name: Events.EventTypes.PlayerControl,
                args: { allow: false },
            });
            this.ecs.getSystem(System.AISystem).inCutscene = true;
            // zoom in
            this.ecs.getSystem(System.Zoom).request(2, 2000, Tween.easeOutCubic);
            // Map from text tween IDs (in the gui.json) to text to replace
            // their contents with.
            let bookkeeper = this.ecs.getSystem(System.Bookkeeper);
            bookkeeper.endLevel();
            let report = bookkeeper.report();
            this.guiBookkeep.push(...this.ecs.getSystem(System.GUIManager).runSequence('endLevel', new Map([
                ['exitLevelName', this.sceneManager.infoProvider.levelName],
                ['exitLevelNumber', 'Level ' + this.sceneManager.infoProvider.levelNum],
                ['exitKillsText', report.enemiesKilled],
                ['exitDeathsText', report.playerDeaths],
                ['exitSecretsText', report.secretsFound],
                ['exitTimeTextBig', report.timeTakenBig],
                ['exitTimeTextSmall', report.timeTakenSmall],
            ])));
            // NOTE: may want a delay here
            this.levelSwitchEnabled = true;
            // play sound
            this.ecs.getSystem(System.Audio).play(['title-sheen']);
        }
        menuKeypress(et, args) {
            this.clearReportExitLevel();
        }
        clearReportExitLevel() {
            if (this.levelSwitchEnabled) {
                this.levelSwitchEnabled = false;
                // exit tweens
                let guiManager = this.ecs.getSystem(System.GUIManager);
                while (this.guiBookkeep.length > 0) {
                    guiManager.tween(this.guiBookkeep.pop(), 'exit');
                }
                // zoom out
                this.ecs.getSystem(System.Zoom).request(1, 3000, Tween.linear);
                // remove collision boxes on exit gates
                let gateSelector = this.ecs.getSystem(System.GateSelector);
                for (let gateE of gateSelector.latest()) {
                    let gateComps = this.ecs.getComponents(gateE);
                    let gate = gateComps.get(Component.Gate);
                    if (!gate.exit) {
                        continue;
                    }
                    this.ecs.removeComponentIfExists(gateE, Component.CollisionShape);
                }
                // make player walk towards exit
                let playerSelector = this.ecs.getSystem(System.PlayerSelector);
                let player = playerSelector.latest().next().value;
                let fwdParams = {
                    faceExit: true,
                    beforeWaitTime: 500,
                    forwardTime: 900,
                };
                this.ecs.addComponent(player, new Component.AIComponent(AI.Behavior.Forward, fwdParams, true));
                // trigger the scene switching
                let nextArgs = {
                    prep: true,
                };
                this.firer.dispatch({ name: Events.EventTypes.SwitchScene, args: nextArgs }, 1000);
            }
        }
    }
    __decorate([
        override
    ], ExitSequence.prototype, "clear", null);
    Handler.ExitSequence = ExitSequence;
    class LevelExiter extends Events.Handler {
        constructor(sceneManager) {
            super();
            this.sceneManager = sceneManager;
            this.dispatcher = new Map([
                [Events.EventTypes.SwitchScene, this.sceneSwitcher],
            ]);
        }
        /**
         * Either preps for a scene switch (fade out + request scene switch),
         * or does the actual scene switch, depending on how args.prep is set.
         */
        sceneSwitcher(t, args) {
            if (args.prep) {
                // fade out
                this.ecs.getSystem(System.Fade).request(1, 500);
                // ask for the legit scene switch
                let nextArgs = {
                    prep: false,
                    increment: args.increment,
                };
                this.firer.dispatch({
                    name: Events.EventTypes.SwitchScene,
                    args: nextArgs,
                }, 500);
            }
            else {
                // do the legit scene switch
                let increment = args.increment || 1;
                this.sceneManager.switchToRelative(increment);
            }
        }
    }
    Handler.LevelExiter = LevelExiter;
    /**
     * Only registered in debug mode. Lets you switch levels at any time.
     */
    class ExitHandlerDev extends Events.Handler {
        constructor() {
            super(...arguments);
            this.dispatcher = new Map([
                [Events.EventTypes.DebugKeypress, this.switchLevelAndRemove],
            ]);
            this.keyIncrement = new Map([
                [GameKey.B, -1],
                [GameKey.N, 1],
            ]);
        }
        switchLevelAndRemove(et, args) {
            if (this.keyIncrement.has(args.key)) {
                // trigger scene switching
                let nextArgs = {
                    prep: true,
                    increment: this.keyIncrement.get(args.key),
                };
                this.firer.dispatch({ name: Events.EventTypes.SwitchScene, args: nextArgs });
            }
        }
    }
    Handler.ExitHandlerDev = ExitHandlerDev;
    class ExitHandlerTitle extends Events.Handler {
        constructor() {
            super(...arguments);
            this.gui = [];
            this.dispatcher = new Map([
                [Events.EventTypes.GameLogic, this.addGUI],
                [Events.EventTypes.SwitchScene, this.onSceneSwitch],
                [Events.EventTypes.MenuKeypress, this.startGame],
            ]);
            this.transient = true;
        }
        clear() {
            arrayClear(this.gui);
        }
        addGUI(et, args) {
            if (args.phase !== Events.Phase.TitleScreenShow) {
                return;
            }
            let guiM = this.ecs.getSystem(System.GUIManager);
            this.gui.push(...guiM.runSequence('titleScreen'));
        }
        /**
         * Provided only because in debug mode we sometimes skip past the title
         * screen, which means, the startGame() below will never have ran. This
         * stops it from trying to run on the next level.
         */
        onSceneSwitch() {
            this.finished = true;
        }
        startGame() {
            // remove gui
            let guiM = this.ecs.getSystem(System.GUIManager);
            while (this.gui.length > 0) {
                guiM.tween(this.gui.pop(), 'exit');
            }
            // make player start walking
            Script.startPlayerMovement(this.ecs, 100, 6000);
            // go to next level after a bit more
            let nextArgs = {
                prep: true,
            };
            this.firer.dispatch({ name: Events.EventTypes.SwitchScene, args: nextArgs }, 5000);
            // don't run again until we start the game again
            this.finished = true;
        }
    }
    __decorate([
        override
    ], ExitHandlerTitle.prototype, "clear", null);
    Handler.ExitHandlerTitle = ExitHandlerTitle;
    // settings
    // control how often new credits appear
    let timeSlope = 200; // per-line multiplier
    let timeIntercept = 14000; // lump sum add
    let timeNextIntercept = 4000;
    let creditsLineTween = {
        visuals: [{
                prop: 'y',
                spec: {
                    valType: 'rel',
                    val: -1000,
                    duration: 8000,
                    method: 'linear',
                    delay: 0,
                }
            }],
        sounds: [],
    };
    function linesIn(s) {
        let total = 1;
        for (let i = 0; i < s.length; i++) {
            if (s[i] == '\n') {
                total += 1;
            }
        }
        return total;
    }
    class ExitHandlerCredits extends Events.Handler {
        constructor(credits) {
            super();
            this.credits = credits;
            this.dispatcher = new Map([
                [Events.EventTypes.GameLogic, this.addGUI],
                [Events.EventTypes.SwitchScene, this.onSceneSwitch],
                [Events.EventTypes.MenuKeypress, this.finishCredits],
            ]);
            this.transient = true;
        }
        addGUI(et, args) {
            if (args.phase !== Events.Phase.CreditsShow) {
                return;
            }
            let guiM = this.ecs.getSystem(System.GUIManager);
            // add the persistent bg stuff
            for (let sid of ['creditsWash', 'creditsLetterBoxTop', 'creditsLetterBoxBot']) {
                guiM.createSprite(sid);
            }
            // enqueue all credits lines
            let nextDelay = 0;
            for (let i = 0; i < this.credits.lines.length; i++) {
                let spec = clone(creditsLineTween);
                spec.visuals[0].spec.delay = nextDelay;
                spec.destruct = nextDelay + 20000;
                let nLines = linesIn(this.credits.lines[i]);
                spec.visuals[0].spec.duration = nLines * timeSlope + timeIntercept;
                nextDelay += nLines * timeSlope + timeNextIntercept;
                guiM.tweenManual(guiM.createText('creditsLine', this.credits.lines[i]), spec);
            }
        }
        /**
         * Provided only because in debug mode we sometimes skip past a screen,
         * which means the startGame() below will never have ran. This stops it
         * from trying to run on the next level.
         */
        onSceneSwitch() {
            this.finished = true;
        }
        finishCredits() {
            // go to next level (title)
            let nextArgs = {
                prep: true,
            };
            this.firer.dispatch({ name: Events.EventTypes.SwitchScene, args: nextArgs });
            // don't run again until we hit credits again
            this.finished = true;
        }
    }
    Handler.ExitHandlerCredits = ExitHandlerCredits;
    class ExitHandlerRecap extends Events.Handler {
        constructor() {
            super(...arguments);
            this.dispatcher = new Map([
                [Events.EventTypes.GameLogic, this.addGUI],
                [Events.EventTypes.SwitchScene, this.onSceneSwitch],
                [Events.EventTypes.MenuKeypress, this.finishRecap],
            ]);
            this.transient = true;
            this.guiBookkeep = [];
        }
        addGUI(et, args) {
            if (args.phase !== Events.Phase.RecapShow) {
                return;
            }
            // recap
            let bookkeeper = this.ecs.getSystem(System.Bookkeeper);
            let [recap, doughnutArray] = bookkeeper.recap();
            let guiM = this.ecs.getSystem(System.GUIManager);
            this.guiBookkeep.push(...guiM.runSequence('recap', new Map([
                ['recapTimeValue', recap.timeTaken],
                ['recapTimeValueBig', recap.timeTakenBig],
                ['recapTimeValueSmall', recap.timeTakenSmall],
                ['recapKillsValue', recap.enemiesKilled],
                ['recapDeathsValue', recap.playerDeaths],
                ['recapDoughnutsValue', recap.secretsFound],
            ])));
            // donut display
            let d = {
                cols: 8,
                xOffscreen: 700,
                xStart: 400,
                xSpacing: 25,
                yStart: 135,
                ySpacing: 25,
                delayStart: 2000,
                delaySpacing: 50,
                duration: 500,
            };
            let all_found = true;
            for (let i = 0; i < doughnutArray.length; i++) {
                all_found = all_found && doughnutArray[i];
                let col = i % d.cols;
                let row = Math.floor(i / d.cols);
                let x = d.xStart + col * d.xSpacing;
                let y = d.yStart + row * d.ySpacing;
                let sid = doughnutArray[i] ? 'recapDoughnutOn' : 'recapDoughnutOff';
                let e = guiM.createSprite(sid, null, new Point(d.xOffscreen, y));
                let delay = d.delayStart + i * d.delaySpacing;
                let sounds = doughnutArray[i] ? [{ options: ['pop-1', 'pop-2', 'pop-3'], delay: delay }] : [];
                guiM.tweenManual(e, {
                    visuals: [{
                            prop: 'x',
                            spec: {
                                val: x,
                                valType: 'abs',
                                delay: delay,
                                duration: d.duration,
                                method: 'easeOutBack',
                            },
                        },
                    ],
                    sounds: sounds,
                });
            }
            // optionally add doughnut% indicator
            if (all_found) {
                let dids = [
                    guiM.createText('recapDoughnutPercent'),
                    guiM.createSprite('recapSparkle'),
                ];
                for (let did of dids) {
                    guiM.tween(did, 'enter');
                }
            }
        }
        /**
         * Provided only because in debug mode we sometimes skip past a screen,
         * which means the finishRecap() below will never have ran. This
         * stops it from trying to run on the next level.
         */
        onSceneSwitch() {
            this.finished = true;
        }
        finishRecap() {
            // note: not doing exit tweens, just fading
            // go to next level (credits)
            let nextArgs = {
                prep: true,
            };
            this.firer.dispatch({ name: Events.EventTypes.SwitchScene, args: nextArgs });
            // don't run again until we hit recap again
            this.finished = true;
        }
    }
    Handler.ExitHandlerRecap = ExitHandlerRecap;
})(Handler || (Handler = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/fx.ts" />
var System;
(function (System) {
    class FxAnimations extends Engine.System {
        constructor(factory, fxConfigs) {
            super();
            this.factory = factory;
            this.fxConfigs = fxConfigs;
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
            this.emitters = new Map();
        }
        init() {
            // create all emitters --- only done here because ecs not defined
            // in constructor
            for (let [name, config] of this.fxConfigs.entries()) {
                this.emitters.set(name, new FX.Emitter(this.ecs, this.factory, config.factory, config.duration, config.pool));
            }
        }
        onClear() {
            for (let emitter of this.emitters.values()) {
                emitter.refillPools();
            }
        }
        /**
         * API to request animatable effects to be emitted.
         *
         * @param fxName Name of the fx (i.e., key in fx.json). Note that this
         * is NOT necessarily the name of the object in the factory.json.
         * @param x
         * @param y
         * @param direction optional number in [0, 2pi]; if null, picks
         * randomly
         */
        emit(fxName, x, y, direction = null) {
            // It may seem weird that we're doing this right upon request
            // instead of waiting until our update, but nowthing will be shown
            // until the animation system updates as well. If we want this to
            // be even more synchronous, can buffer emit requests here OR in
            // the FX.Emitter.
            if (!this.emitters.has(fxName)) {
                throw new Error('Requested invalid fx name: "' + fxName + '".');
            }
            this.emitters.get(fxName).emit(x, y, direction);
        }
        update(delta, entities) {
            for (let emitter of this.emitters.values()) {
                emitter.update(delta);
            }
        }
    }
    __decorate([
        override
    ], FxAnimations.prototype, "onClear", null);
    System.FxAnimations = FxAnimations;
})(System || (System = {}));
/// <reference path="../engine/events.ts" />
/// <reference path="../component/attributes.ts" />
/// <reference path="../system/fx-animations.ts" />
var Handler;
(function (Handler) {
    /**
     * Spawns animation events.
    */
    class FX extends Events.Handler {
        constructor(fxAnimations) {
            super();
            this.fxAnimations = fxAnimations;
            this.dispatcher = new Map([
                [Events.EventTypes.Damage, this.hit],
                [Events.EventTypes.ThingDead, this.death],
                [Events.EventTypes.Bleed, this.bleed],
            ]);
        }
        bleed(et, args) {
            for (let fx of args.fx) {
                this.fxAnimations.emit(fx, args.location.x, args.location.y);
            }
        }
        //
        // TODO: refactor the below
        //
        hit(et, args) {
            // find if any hit effects were requested
            let comps = this.ecs.getComponents(args.victim);
            if (!comps.has(Component.Attributes)) {
                // console.log('no attribute components. creature: ' + args.victimType);
                return;
            }
            let attributes = comps.get(Component.Attributes);
            // play any hits animation FX found
            if (attributes.data.hitFX == null) {
                return;
            }
            for (let fx of attributes.data.hitFX) {
                let direction = null;
                if (fx.face != null && fx.face) {
                    direction = args.angleAtoV;
                }
                this.fxAnimations.emit(fx.fxName, args.location.x, args.location.y, direction);
            }
        }
        death(et, args) {
            // find if any death effects were requested
            let comps = this.ecs.getComponents(args.thing);
            if (!comps.has(Component.Attributes)) {
                // console.log('no attribute components. thing type: ' + args.thingType);
                return;
            }
            let attributes = comps.get(Component.Attributes);
            // play any death animation FX found
            if (attributes.data.deathFX == null) {
                return;
            }
            for (let fx of attributes.data.deathFX) {
                this.fxAnimations.emit(fx, args.location.x, args.location.y);
            }
        }
    }
    Handler.FX = FX;
})(Handler || (Handler = {}));
/// <reference path="../engine/events.ts" />
/// <reference path="../component/enemy.ts" />
/// <reference path="../system/selector.ts" />
var Handler;
(function (Handler) {
    /**
     * Opens and closes gates.
     */
    class GateManager extends Events.Handler {
        constructor() {
            super(...arguments);
            this.dispatcher = new Map([
                [Events.EventTypes.ThingDead, this.eventCheckGates],
                [Events.EventTypes.ItemCollected, this.eventCheckGates],
                [Events.EventTypes.CheckGates, this.manualCheckGates],
            ]);
            /**
             * Map from {gateID -> no. enemies alive w/ that gateID}
             */
            this.gateBookkepingCache = new Counter();
        }
        ensureOpen(gateComps, silent) {
            let gate = gateComps.get(Component.Gate);
            // ensure it's shown as open
            let wasOpen = false;
            if (gateComps.has(Component.Activity)) {
                let activity = gateComps.get(Component.Activity);
                wasOpen = activity.action === Action.Opening;
                if (!wasOpen) {
                    activity.action = Action.Opening;
                }
            }
            // maybe send event to make noise
            if (!silent && !wasOpen) {
                this.firer.dispatch({
                    name: Events.EventTypes.GateOpen,
                    args: {},
                });
            }
            // ensure collision box disabled on non-exit gate
            if (!gate.exit) {
                if (gateComps.has(Component.CollisionShape)) {
                    gateComps.get(Component.CollisionShape).disabled = true;
                }
            }
            // if it's the exit gate, trigger the fulfilled event if it wasn't
            // open
            if (!wasOpen && gate.exit) {
                let eType = Events.EventTypes.ExitConditions;
                let eArgs = {
                    silent: silent,
                    fulfilled: true,
                };
                this.firer.dispatch({
                    name: eType,
                    args: eArgs,
                });
            }
        }
        ensureClosed(gateComps) {
            // ensure shown as closed
            if (gateComps.has(Component.Activity)) {
                gateComps.get(Component.Activity).action = Action.Idle;
            }
            // ensure collision box enabled
            if (gateComps.has(Component.CollisionShape)) {
                gateComps.get(Component.CollisionShape).disabled = false;
            }
            // if it's the exit gate, remove any fulfilled effects
            let gate = gateComps.get(Component.Gate);
            if (gate.exit) {
                let eType = Events.EventTypes.ExitConditions;
                let eArgs = {
                    silent: true,
                    fulfilled: false,
                };
                this.firer.dispatch({
                    name: eType,
                    args: eArgs,
                });
            }
        }
        /**
         * Gets gateID indicated on a non-gate (e.g., an enemy or item).
         * Returns null if entity is dead or has no valid gateID. Else returns
         * the gateID.
         */
        getMarkedGateID(entity) {
            let comps = this.ecs.getComponents(entity);
            // dead check appleis to enemies and items
            if (comps.has(Component.Dead)) {
                return null;
            }
            // now switch based on thing
            if (comps.has(Component.Enemy)) {
                // enemies might be gatekeepers, in which case they count
                // towards the exit gate.
                let enemy = comps.get(Component.Enemy);
                if (enemy.gatekeeper) {
                    return 'EXIT';
                }
                return enemy.gateID;
            }
            else if (comps.has(Component.Item)) {
                // items simply have a gateID or not.
                return comps.get(Component.Item).gateID;
            }
            else if (comps.has(Component.Checkpoint)) {
                return comps.get(Component.Checkpoint).gateID;
            }
            // if none of the above, no valid gate ID
            console.warn('Checked gateID of non-implemented entity!');
            return null;
        }
        checkGates(silent) {
            let enemySelector = this.ecs.getSystem(System.EnemySelector);
            let itemSelector = this.ecs.getSystem(System.ItemSelector);
            let checkpointSelector = this.ecs.getSystem(System.CheckpointSelector);
            let gateSelector = this.ecs.getSystem(System.GateSelector);
            // first, do gateID -> no. enemies alive bookkeeping
            this.gateBookkepingCache.clear();
            // cycle through enemies and items once
            for (let selector of [enemySelector, itemSelector, checkpointSelector]) {
                for (let entity of selector.latest()) {
                    let gateID = this.getMarkedGateID(entity);
                    if (gateID != null) {
                        this.gateBookkepingCache.increment(gateID);
                    }
                }
            }
            // check all gates, open or close if necessary
            for (let gateEntity of gateSelector.latest()) {
                let gateComps = this.ecs.getComponents(gateEntity);
                let gate = gateComps.get(Component.Gate);
                let alive = this.gateBookkepingCache.get(gate.id);
                if (alive > 0) {
                    this.ensureClosed(gateComps);
                }
                else {
                    this.ensureOpen(gateComps, silent);
                }
            }
        }
        eventCheckGates(t) {
            this.checkGates(false);
        }
        manualCheckGates(t, args) {
            this.checkGates(true);
        }
    }
    Handler.GateManager = GateManager;
})(Handler || (Handler = {}));
var Handler;
(function (Handler) {
    class Overlay extends Events.Handler {
        constructor() {
            super(...arguments);
            this.dispatcher = new Map([
                [Events.EventTypes.EnemyStagger, this.flashWhite],
                [Events.EventTypes.Damage, this.bloodScreen],
            ]);
        }
        bloodScreen(et, args) {
            // player only
            if (args.victimType !== Ontology.Thing.Player) {
                return;
            }
            this.ecs.getSystem(System.GUIManager).runSequence('hit');
        }
        flashWhite(et, args) {
            if (!args.heavyEffects) {
                return;
            }
            this.ecs.getSystem(System.GUIManager).runSequence('combo');
        }
    }
    Handler.Overlay = Overlay;
})(Handler || (Handler = {}));
var Handler;
(function (Handler) {
    /**
     * TODO: maybe pull various settings out into a config file or something.
     */
    class SlowMotion extends Events.Handler {
        constructor() {
            super(...arguments);
            this.dispatcher = new Map([
                [Events.EventTypes.ThingDead, this.thingDeadMaybeSlowdown],
                [Events.EventTypes.EnemyStaggerPre, this.enemyStaggerSlowdown],
            ]);
        }
        enemyStaggerSlowdown(et, args) {
            // slowmotion (pause) first
            if (args.heavyEffects) {
                this.ecs.slowMotion.request(SlowMotion.PAUSE, 250);
            }
            // fire for rest of effects
            let nextArgs = args;
            this.firer.dispatch({ name: Events.EventTypes.EnemyStagger, args: args }, 1);
        }
        thingDeadMaybeSlowdown(et, args) {
            // (feature currently disabled)
            // only slowdown when *enemies* dead (not random crap like crates)
            // if (args.thingType !== Ontology.Thing.Enemy) {
            // 	return;
            // }
            // this.ecs.slowMotion.request(SlowMotion.PAUSE, 0);
        }
    }
    // used as factor when we want basically infinite slowdown = no time
    // passes
    SlowMotion.PAUSE = 10000;
    Handler.SlowMotion = SlowMotion;
})(Handler || (Handler = {}));
/// <reference path="../engine/events.ts" />
/// <reference path="../system/audio.ts" />
var Handler;
(function (Handler) {
    class SoundEffects extends Events.Handler {
        constructor(delaySpeaker) {
            super();
            this.delaySpeaker = delaySpeaker;
            this.dispatcher = new Map([
                [Events.EventTypes.Damage, this.damageSound],
                [Events.EventTypes.Charge, this.chargeSound],
                [Events.EventTypes.Swing, this.swingSound],
                [Events.EventTypes.ThingDead, this.deathSound],
                [Events.EventTypes.Block, this.blockSound],
                [Events.EventTypes.Checkpoint, this.checkpointSound],
                [Events.EventTypes.ItemCollected, this.itemSound],
                [Events.EventTypes.GateOpen, this.gateOpenSound],
                [Events.EventTypes.EnemyStagger, this.staggerSound],
            ]);
        }
        blockSound(et, args) {
            if (args.shield.sounds != null && args.shield.sounds.block != null) {
                this.ecs.getSystem(System.Audio).play(args.shield.sounds.block);
            }
        }
        damageSound(et, args) {
            // play any sound from the weapon's attack
            let atk = args.attackInfo;
            if (atk.sounds != null) {
                this.ecs.getSystem(System.Audio).play(atk.sounds.hit, args.location);
            }
            // and also play any sound from the victim taking damage
            let vComps = this.ecs.getComponents(args.victim);
            if (vComps.has(Component.Audible)) {
                let audible = vComps.get(Component.Audible);
                if (audible.sounds.damaged != null) {
                    this.ecs.getSystem(System.Audio).play(audible.sounds.damaged, args.location);
                }
            }
        }
        chargeSound(et, args) {
            let atk = args.attackInfo;
            if (atk.sounds != null) {
                this.ecs.getSystem(System.Audio).play(atk.sounds.charge, args.location);
            }
        }
        swingSound(et, args) {
            let atk = args.attackInfo;
            if (atk.sounds != null) {
                this.ecs.getSystem(System.Audio).play(atk.sounds.swing, args.location);
            }
        }
        deathSound(et, args) {
            let vComps = this.ecs.getComponents(args.thing);
            if (vComps.has(Component.Audible)) {
                let audible = vComps.get(Component.Audible);
                if (audible.sounds.killed != null) {
                    // hack for explostions to always play
                    let location = args.location;
                    if (vComps.has(Component.AIComponent) &&
                        vComps.get(Component.AIComponent).behavior === AI.Behavior.Sawtooth) {
                        location = null;
                    }
                    this.ecs.getSystem(System.Audio).play(audible.sounds.killed, location);
                }
            }
            // special case player death
            if (args.thingType == Ontology.Thing.Player) {
                this.delaySpeaker.enqueue({
                    options: ['vanquished'],
                    delay: 1000,
                });
            }
        }
        checkpointSound(et, args) {
            this.ecs.getSystem(System.Audio).play(['checkpoint']);
            this.delaySpeaker.enqueue({
                options: ['checkpoint-voice'],
                delay: 400,
            });
        }
        itemSound(et, args) {
            if (!SoundEffects.itemSounds.has(args.itemType)) {
                return;
            }
            this.ecs.getSystem(System.Audio).play(SoundEffects.itemSounds.get(args.itemType));
        }
        /**
         * NOTE: this is a stupid design pattern.
         */
        gateOpenSound(et, args) {
            this.ecs.getSystem(System.Audio).play(['gateOpen']);
        }
        staggerSound(et, args) {
            this.ecs.getSystem(System.Audio).play(['stagger']);
        }
    }
    SoundEffects.itemSounds = new Map([
        [Ontology.Item.Health, ['gainHealth']],
        [Ontology.Item.Doughnut, ['doughnut']],
    ]);
    Handler.SoundEffects = SoundEffects;
})(Handler || (Handler = {}));
/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
var Handler;
(function (Handler) {
    class TextHandler extends Events.Handler {
        constructor(translator, gui) {
            super();
            this.translator = translator;
            this.gui = gui;
            this.dispatcher = new Map([
                [Events.EventTypes.Damage, this.floatText],
                [Events.EventTypes.ItemCollected, this.item],
                [Events.EventTypes.EnemyStagger, this.stagger],
                [Events.EventTypes.Checkpoint, this.checkpoint],
            ]);
        }
        /**
         * Show text for when a fun thing like a stagger happens.
         */
        funText(txt, worldPos) {
            let hudBasePos = this.translator.worldToHUDBase(TextHandler.FLOAT_DISPLAY_OFFSET.copy().add_(worldPos));
            this.gui.tween(this.gui.createText('flashText', txt, hudBasePos), 'enter');
        }
        stagger(et, args) {
            this.funText('STAGGER', args.vLocation);
        }
        item(et, args) {
            if (!TextHandler.itemText.has(args.itemType)) {
                return;
            }
            this.funText(TextHandler.itemText.get(args.itemType), args.location);
        }
        checkpoint(et, args) {
            this.funText('CHECKPOINT', args.location);
        }
        /**
         * Show damage text (currently disabled).
         */
        floatText(et, args) {
            // Don't display 0 damage.
            if (args.internalDamage == 0) {
                return;
            }
            let loc = this.translator.worldToHUDBase(TextHandler.FLOAT_DISPLAY_OFFSET.copy().add_(args.location));
            let displayDamage = '' + (args.internalDamage);
            let e = this.gui.createText('floatText', displayDamage, loc);
            this.gui.tween(e, 'enter');
        }
    }
    TextHandler.FLOAT_DISPLAY_OFFSET = new Point(30, -30);
    TextHandler.itemText = new Map([
        [Ontology.Item.Health, 'HEALTH'],
        [Ontology.Item.Doughnut, 'DOUGHNUT'],
    ]);
    Handler.TextHandler = TextHandler;
})(Handler || (Handler = {}));
/// <reference path="../engine/events.ts" />
/// <reference path="../gj7/tutorial.ts" />
var Handler;
(function (Handler) {
    /**
     * Displaying instructions! (Note that the Bookkeeper sends the actual
     * events to ensure they aren't shown twice.)
     */
    class Instructions extends Events.Handler {
        constructor(instructions) {
            super();
            this.instructions = instructions;
            this.guiEnts = [];
            this.dispatcher = new Map([
                [Events.EventTypes.ZoneTransition, this.onZoneEnter],
                [Events.EventTypes.ShowInstructions, this.showInstructions],
                [Events.EventTypes.MenuKeypress, this.maybeHideInstructions],
            ]);
        }
        clear() {
            arrayClear(this.guiEnts);
        }
        /**
         * Note that this handler function is kind of an exception to what this
         * class handles because it gets the raw underlying event. However, it
         * still then goes through the bookkeeper to do the mediating logic.
         */
        onZoneEnter(et, args) {
            if (!args.enter) {
                return;
            }
            let iid = this.ecs.getComponents(args.zone).get(Component.Zone).instructionID;
            if (iid == null) {
                return;
            }
            this.ecs.getSystem(System.Bookkeeper).maybeShowInstruction(iid);
        }
        showInstructions(et, args) {
            let instr = this.instructions[args.instructionsID];
            if (instr == null) {
                throw new Error('Unknown instructions ID: "' + args.instructionsID + '"');
            }
            let textReplacements = new Map([
                ['instructTitle', instr.title],
                ['instructText', instr.txt],
            ]);
            let imgReplacements = new Map([
                ['instructIcon', instr.img],
            ]);
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
        maybeHideInstructions(et, args) {
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
    __decorate([
        override
    ], Instructions.prototype, "clear", null);
    Handler.Instructions = Instructions;
    /**
     * Displaying Controls. (Note that these are always shown so there's no
     * need to mediate w/ Bookkeeper.)
     */
    class Controls extends Events.Handler {
        constructor(controls) {
            super();
            this.controls = controls;
            this.guiEnts = [];
            this.dispatcher = new Map([
                [Events.EventTypes.ZoneTransition, this.onZoneTransition],
            ]);
        }
        clear() {
            arrayClear(this.guiEnts);
        }
        /**
         * Shows a specific control
         */
        showControl(control) {
            // construct replacements
            let textReplacements = new Map([
                ['controlsText', control.txt],
            ]);
            // show GUI and bookkeep
            this.guiEnts.push(...this.ecs.getSystem(System.GUIManager)
                .runSequence('controls', textReplacements));
        }
        /**
         * Hides any/all controls.
         */
        hideControl() {
            let guiM = this.ecs.getSystem(System.GUIManager);
            while (this.guiEnts.length > 0) {
                guiM.tween(this.guiEnts.pop(), 'exit');
            }
        }
        onZoneTransition(et, args) {
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
            }
            else {
                // NOTE: hide right now just hides everything. If we end up
                // wanting to distinguish between specific controls to
                // show/hide, we can bookkeep per-control and actually hide
                // them only.
                this.hideControl();
            }
        }
    }
    __decorate([
        override
    ], Controls.prototype, "clear", null);
    Handler.Controls = Controls;
})(Handler || (Handler = {}));
/// <reference path="../engine/script.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../system/selector.ts" />
var Script;
(function (Script) {
    function disableCollisionsHelper(ecs, thing) {
        let comps = ecs.getComponents(thing);
        // NOTE: edge case here because this function can be delayed: don't
        // disable collisions if the thing isn't still dead (i.e., has been
        // respawned).
        if (!comps.has(Component.Dead)) {
            return;
        }
        if (comps.has(Component.CollisionShape)) {
            let cShape = comps.get(Component.CollisionShape);
            cShape.disabled = true;
        }
    }
    /**
     * Delayed actions when "other" (non-player / non-enemy) dies.
     */
    class OtherDeath extends Script.Script {
        constructor(thing) {
            super();
            this.thing = thing;
            this.code = new Map([
                [0, { func: this.disableCollisions, args: null }],
            ]);
        }
        disableCollisions() {
            disableCollisionsHelper(this.ecs, this.thing);
        }
    }
    Script.OtherDeath = OtherDeath;
    /**
     * Delayed actions when enemy dies.
     */
    class EnemyDeath extends Script.Script {
        constructor(enemy) {
            super();
            this.enemy = enemy;
            this.code = new Map([
                [0, { func: this.disableCollisions, args: null }],
            ]);
        }
        disableCollisions() {
            disableCollisionsHelper(this.ecs, this.enemy);
        }
    }
    Script.EnemyDeath = EnemyDeath;
    /**
     * Delayed actions when player dies.
     */
    class PlayerDeath extends Script.Script {
        constructor(playerSelector, spawnableSelector) {
            super();
            this.playerSelector = playerSelector;
            this.spawnableSelector = spawnableSelector;
            this.code = new Map([
                [0, { func: this.vanquished, args: null }],
                [1, { func: this.zoomIn, args: null }],
                [2000, { func: this.disablePlayerCollisions, args: null }],
                [2890, { func: this.zoomOut, args: null }],
                [3000, { func: this.respawn, args: null }],
            ]);
        }
        vanquished() {
            this.ecs.getSystem(System.GUIManager).runSequence('vanquished');
        }
        zoomIn() {
            this.ecs.getSystem(System.Zoom).request(1.3, 2890, Tween.linear);
        }
        disablePlayerCollisions() {
            disableCollisionsHelper(this.ecs, this.playerSelector.latest().next().value);
        }
        respawn() {
            // respawn things (player, enemies, crates, ...)
            this.reviveHealReposition(this.spawnableSelector.latest());
            // close gates as needed
            this.eventsManager.dispatch({
                name: Events.EventTypes.CheckGates,
                args: {},
            });
        }
        reviveHealReposition(iter) {
            for (let entity of iter) {
                let comps = this.ecs.getComponents(entity);
                // Don't apply if entity is not spawnable
                if (!comps.has(Component.Spawnable)) {
                    continue;
                }
                // remove dead
                this.ecs.removeComponentIfExists(entity, Component.Dead);
                // make health max
                if (comps.has(Component.Health)) {
                    let health = comps.get(Component.Health);
                    health.current = health.maximum;
                }
                // move to spawn point
                let position = comps.get(Component.Position);
                let spawnable = comps.get(Component.Spawnable);
                position.p = spawnable.position;
                position.angle = spawnable.angle;
                // enable collision box
                if (comps.has(Component.CollisionShape)) {
                    let cShape = comps.get(Component.CollisionShape);
                    cShape.disabled = false;
                }
            }
        }
        zoomOut() {
            this.ecs.getSystem(System.Zoom).request(1, 500, Tween.easeOutCubic);
        }
    }
    Script.PlayerDeath = PlayerDeath;
})(Script || (Script = {}));
/// <reference path="../engine/script.ts" />
var Script;
(function (Script) {
    class EndSequence extends Script.Script {
        constructor() {
            super(...arguments);
            this.code = new Map([
                [0, { func: this.begin, args: null }],
                [3000, { func: this.zoomOut, args: null }],
                [4000, { func: this.swapBodies, args: [true] }],
                [4200, { func: this.swapBodies, args: [false] }],
                [6000, { func: this.swapBodies, args: [true] }],
                [6400, { func: this.swapBodies, args: [false] }],
                [8000, { func: this.swapBodies, args: [true] }],
                [8800, { func: this.swapBodies, args: [false] }],
                [10000, { func: this.swapBodies, args: [true] }],
                [12980, { func: this.blackOut, args: [true] }],
                [16000, { func: this.nextScene, args: [true] }],
            ]);
        }
        begin() {
            // stop level timer
            this.ecs.getSystem(System.Bookkeeper).endLevel();
            // zoom in close
            this.ecs.getSystem(System.Zoom).request(2.6, 750, Tween.easeInCubic);
            // cut player controls
            this.eventsManager.dispatch({
                name: Events.EventTypes.PlayerControl,
                args: { allow: false },
            });
            // kill any other remaining enemies so they don't get you while
            // you're paused.
            for (let enemy of this.ecs.getSystem(System.EnemySelector).latest()) {
                let eComps = this.ecs.getComponents(enemy);
                if (eComps.has(Component.Health)) {
                    eComps.get(Component.Health).current = 0;
                }
            }
            // cut music
            let audio = this.ecs.getSystem(System.Audio);
            audio.playMusic([]);
            // start ending sounds
            audio.play(['end-sound']);
        }
        zoomOut() {
            this.ecs.getSystem(System.Zoom).request(0.6, 10000, Tween.easeInCubic);
        }
        swapBodies(toHumanoid) {
            // send body swap request
            let eArgs = {
                toHumanoid: toHumanoid,
            };
            this.eventsManager.dispatch({
                name: Events.EventTypes.SwapBodies,
                args: eArgs,
            });
            // gui blood
            if (toHumanoid) {
                this.ecs.getSystem(System.GUIManager).runSequence('hit');
            }
            // sound
            let audio = this.ecs.getSystem(System.Audio);
            audio.play(['heartbeat']);
        }
        blackOut() {
            this.ecs.getSystem(System.GUIManager).createSprite('blackoutWash');
        }
        nextScene() {
            let eArgs = {
                prep: false,
            };
            this.eventsManager.dispatch({
                name: Events.EventTypes.SwitchScene,
                args: eArgs,
            });
        }
    }
    Script.EndSequence = EndSequence;
})(Script || (Script = {}));
/// <reference path="../engine/script.ts" />
var Script;
(function (Script) {
    //
    // common functions for different start scripts
    //
    /**
     * Things that happen before a single frame is run in the new level.
     */
    function startLevelInit(allowAllAIs) {
        // disable player input (start w/ this b/c sometimes we start a level
        // w/o having exited a previous one, like at the start of the game)
        this.eventsManager.dispatch({
            name: Events.EventTypes.PlayerControl,
            args: { allow: false },
        });
        // maybe disable non-cutscene AIs
        if (!allowAllAIs) {
            this.ecs.getSystem(System.AISystem).inCutscene = true;
        }
        // fade in here
        this.ecs.getSystem(System.Fade).request(0, 1000);
    }
    /**
     * Adds "next to exit" zones at the entrances of the exit gates.
     *
     * Has to run after 1 update frame has run so that the gate selectors have a
     * frame to select their gates.
     */
    function addExitRegions(gm) {
        for (let gate of this.ecs.getSystem(System.GateSelector).latest()) {
            let comps = this.ecs.getComponents(gate);
            let gateComp = comps.get(Component.Gate);
            let pos = comps.get(Component.Position);
            let zonePos = pos.p.copy().add_(new Point(0, 100).rotate_(-pos.angle));
            let degAngle = -(Constants.RAD2DEG * pos.angle);
            if (gateComp.exit) {
                gm.produce('nextToExitv2', {
                    height: 1,
                    width: 1,
                    rotation: degAngle + 90,
                    x: zonePos.x,
                    y: zonePos.y,
                });
            }
        }
    }
    function openStartGate() {
        // this looks kinda nice so yeah
        let gateSelector = this.ecs.getSystem(System.GateSelector);
        for (let gateEntity of gateSelector.latest()) {
            let gateComps = this.ecs.getComponents(gateEntity);
            let gateComp = gateComps.get(Component.Gate);
            if (!gateComp.start) {
                continue;
            }
            let activity = gateComps.get(Component.Activity);
            activity.action = Action.Opening;
            // send event to make noise
            this.eventsManager.dispatch({
                name: Events.EventTypes.GateOpen,
                args: {},
            });
        }
    }
    function startPlayerMovement(ecs, beforeWaitTime, forwardTime) {
        // turn on the player's cutscene AI
        let playerSelector = ecs.getSystem(System.PlayerSelector);
        for (let playerEntity of playerSelector.latest()) {
            let fwdParams = {
                beforeWaitTime: beforeWaitTime,
                faceExit: false,
                forwardTime: forwardTime,
            };
            ecs.addComponent(playerEntity, new Component.AIComponent(AI.Behavior.Forward, fwdParams, true));
        }
    }
    Script.startPlayerMovement = startPlayerMovement;
    function _startPlayerMovement(beforeWaitTime, forwardTime) {
        startPlayerMovement(this.ecs, beforeWaitTime, forwardTime);
    }
    function startGameplay() {
        let playerSelector = this.ecs.getSystem(System.PlayerSelector);
        for (let playerEntity of playerSelector.latest()) {
            // set spawn point to be here (outside of the start gate)
            let playerComps = this.ecs.getComponents(playerEntity);
            if (playerComps.has(Component.Spawnable)) {
                let spawnable = playerComps.get(Component.Spawnable);
                let pos = playerComps.get(Component.Position);
                spawnable.position.copyFrom_(pos.p);
            }
            // remove AI
            this.ecs.removeComponentIfExists(playerEntity, Component.AIComponent);
        }
        // give back player input system
        this.eventsManager.dispatch({
            name: Events.EventTypes.PlayerControl,
            args: { allow: true },
        });
        let eArgs = {};
        this.eventsManager.dispatch({
            name: Events.EventTypes.GameplayStart,
            args: eArgs,
        });
        // ename normal AIs
        this.ecs.getSystem(System.AISystem).inCutscene = false;
    }
    function addHUD() {
        this.ecs.enableSystem(System.PlayerHUDRenderer);
    }
    class StartLevelBase extends Script.Script {
        constructor(infoProvider) {
            super();
            this.infoProvider = infoProvider;
        }
    }
    /**
     * Standard start level script with visual effects and delays.
     */
    class StartLevel extends StartLevelBase {
        constructor(infoProvider, gm) {
            super(infoProvider);
            this.infoProvider = infoProvider;
            this.gm = gm;
            this.code = new Map([
                [1, { func: addExitRegions, args: [this.gm] }],
                [500, { func: _startPlayerMovement, args: [100, 1000] }],
                [600, { func: openStartGate, args: this }],
                [1000, { func: this.triggerGUI, args: null }],
                [1001, { func: this.zoomIn, args: null }],
                [4000, { func: this.zoomOut, args: null }],
                [5000, { func: startGameplay, args: this }],
                [6000, { func: addHUD, args: null }],
            ]);
        }
        init() {
            startLevelInit.call(this);
        }
        triggerGUI() {
            this.ecs.getSystem(System.GUIManager).runSequence('startLevel', new Map([
                ['startLevelName', this.infoProvider.levelName],
                ['startLevelNumber', 'Level ' + this.infoProvider.levelNum],
            ]));
        }
        zoomIn() {
            this.ecs.getSystem(System.Zoom).request(1.4, 2000, Tween.easeOutCubic);
        }
        zoomOut() {
            this.ecs.getSystem(System.Zoom).request(1, 3000, Tween.easeInCubic);
        }
    }
    __decorate([
        override
    ], StartLevel.prototype, "init", null);
    Script.StartLevel = StartLevel;
    /**
     * Development start level script to quickly get to testing.
     */
    class StartLevelDev extends StartLevelBase {
        constructor(infoProvider, gm) {
            super(infoProvider);
            this.infoProvider = infoProvider;
            this.gm = gm;
            this.code = new Map([
                [1, { func: addExitRegions, args: [this.gm] }],
                [2, { func: _startPlayerMovement, args: [0, 800] }],
                [3, { func: openStartGate, args: null }],
                [4, { func: addHUD, args: null }],
                [800, { func: startGameplay, args: null }],
            ]);
        }
        init() {
            startLevelInit.call(this);
        }
    }
    __decorate([
        override
    ], StartLevelDev.prototype, "init", null);
    Script.StartLevelDev = StartLevelDev;
    /**
     * Used to start first scenes of multi-part levels (e.g., castle).
     */
    class StartLevelMultipartFirst extends StartLevel {
    }
    Script.StartLevelMultipartFirst = StartLevelMultipartFirst;
    /**
     * Used to start middle (non-first/last) scenes of multi-part levels (e.g.,
     * castle).
     */
    class StartLevelMultipartMid extends StartLevelDev {
    }
    Script.StartLevelMultipartMid = StartLevelMultipartMid;
    /**
     * Used to start last scenes of multi-part levels (e.g., castle).
     */
    class StartLevelMultipartLast extends StartLevelDev {
    }
    Script.StartLevelMultipartLast = StartLevelMultipartLast;
    /**
     * For season (AKA act) transition GUI screens.
     */
    class StartLevelAct extends Script.Script {
        constructor(season) {
            super();
            this.season = season;
            this.code = new Map([
                [0, { func: this.startActGUI, args: null }],
                [7000, { func: this.nextLevel, args: null }],
            ]);
        }
        init() {
            startLevelInit.call(this);
        }
        startActGUI() {
            this.ecs.getSystem(System.GUIManager).runSequence('seasonTransition', objToMap(this.season.text), objToMap(this.season.sprites));
        }
        nextLevel() {
            // go to next scene
            let eArgs = {
                prep: true,
            };
            this.eventsManager.dispatch({
                name: Events.EventTypes.SwitchScene,
                args: eArgs,
            });
        }
    }
    __decorate([
        override
    ], StartLevelAct.prototype, "init", null);
    Script.StartLevelAct = StartLevelAct;
    class StartLevelTitle extends Script.Script {
        constructor() {
            super(...arguments);
            this.code = new Map([
                [0, { func: this.triggerStartEvent, args: null }],
                [6400, { func: this.shakeCamera, args: null }],
            ]);
        }
        init() {
            // general setup
            startLevelInit.call(this, true);
            // register event handler we'll need
            this.eventsManager.add(new Handler.ExitHandlerTitle());
            // for second playthrough: clear bookkeeper of timing and
            // instructions shown caches
            this.ecs.getSystem(System.Bookkeeper).reset();
        }
        triggerStartEvent() {
            let args = {
                phase: Events.Phase.TitleScreenShow,
            };
            this.eventsManager.dispatch({
                name: Events.EventTypes.GameLogic,
                args: args,
            });
        }
        /**
         * Timing should line up with fallgate logo hitting bottom of its y
         * tween.
         */
        shakeCamera() {
            this.ecs.getSystem(System.FxCamera).shake(Constants.HALF_PI, 60, 90, System.ShakeType.Wobble);
        }
    }
    __decorate([
        override
    ], StartLevelTitle.prototype, "init", null);
    Script.StartLevelTitle = StartLevelTitle;
    class StartLevelCredits extends Script.Script {
        constructor(credits) {
            super();
            this.credits = credits;
            this.code = new Map([
                [0, { func: this.triggerStartEvent, args: null }],
            ]);
        }
        init() {
            // general setup
            startLevelInit.call(this);
            // register event handler we'll need
            this.eventsManager.add(new Handler.ExitHandlerCredits(this.credits));
        }
        triggerStartEvent() {
            let args = {
                phase: Events.Phase.CreditsShow,
            };
            this.eventsManager.dispatch({
                name: Events.EventTypes.GameLogic,
                args: args,
            });
        }
    }
    __decorate([
        override
    ], StartLevelCredits.prototype, "init", null);
    Script.StartLevelCredits = StartLevelCredits;
    class StartLevelRecap extends Script.Script {
        constructor() {
            super(...arguments);
            this.code = new Map([
                [0, { func: this.triggerStartEvent, args: null }],
            ]);
        }
        init() {
            // general setup
            startLevelInit.call(this);
            // register event handler we'll need
            this.eventsManager.add(new Handler.ExitHandlerRecap());
            // we don't want this here or credits or next title screen
            this.ecs.disableSystem(System.PlayerHUDRenderer);
        }
        triggerStartEvent() {
            let args = {
                phase: Events.Phase.RecapShow,
            };
            this.eventsManager.dispatch({
                name: Events.EventTypes.GameLogic,
                args: args,
            });
        }
    }
    __decorate([
        override
    ], StartLevelRecap.prototype, "init", null);
    Script.StartLevelRecap = StartLevelRecap;
})(Script || (Script = {}));
/// <reference path="../engine/script.ts" />
var Script;
(function (Script) {
    class TestTween extends Script.Script {
        constructor() {
            super(...arguments);
            this.code = new Map([
            // [1000, {func: this.v1, args: null}],
            // [1000, {func: this.v2, args: null}],
            ]);
        }
        v2() {
            console.log('starting make tween script (v2)');
            let gui = this.ecs.getSystem(System.GUIManager);
            let iid = gui.createSprite('test1');
            gui.tween(iid, 'start');
        }
        v1() {
            console.log('starting make tween script (v1)');
            let e = this.ecs.addEntity();
            let guiSpec = {
                baseSpec: {
                    base: "sprites/player/playerWalk",
                    frames: 8,
                    speed: 50,
                    playType: "Loop",
                },
                startPos: {
                    position: [0, 0],
                    rotation: 0,
                },
                displaySpec: {
                    stageTarget: "HUD",
                    z: 'DEBUG',
                },
                tweens: {
                    start: {
                        visuals: [],
                        sounds: [],
                    }
                }
            };
            let guiSprite = new Component.GUISprite(guiSpec.baseSpec, guiSpec.displaySpec);
            let pos = new Component.Position(new Point(0, 0));
            let tweenable = new Component.Tweenable();
            tweenable.tweenQueue.push({
                prop: 'x',
                spec: {
                    val: 640,
                    valType: 'rel',
                    duration: 2000,
                    delay: 1000,
                    method: 'easeOutCubic',
                }
            });
            tweenable.tweenQueue.push({
                prop: 'y',
                spec: {
                    val: 360,
                    valType: 'rel',
                    duration: 2000,
                    delay: 3000,
                    method: 'easeOutCubic',
                }
            });
            tweenable.tweenQueue.push({
                prop: 'x',
                spec: {
                    val: -640,
                    valType: 'rel',
                    duration: 2000,
                    delay: 5000,
                    method: 'easeOutCubic',
                }
            });
            tweenable.tweenQueue.push({
                prop: 'y',
                spec: {
                    val: -360,
                    valType: 'rel',
                    duration: 2000,
                    delay: 7000,
                    method: 'easeOutCubic',
                }
            });
            tweenable.tweenQueue.push({
                prop: 'x',
                spec: {
                    val: 320,
                    valType: 'abs',
                    duration: 2000,
                    delay: 9000,
                    method: 'easeOutCubic',
                }
            });
            tweenable.tweenQueue.push({
                prop: 'y',
                spec: {
                    val: 180,
                    valType: 'abs',
                    duration: 2000,
                    delay: 9000,
                    method: 'easeOutCubic',
                }
            });
            tweenable.tweenQueue.push({
                prop: 'angle',
                spec: {
                    val: 0.01,
                    valType: 'abs',
                    duration: -1,
                    delay: 9000,
                    method: 'linear',
                }
            });
            this.ecs.addComponent(e, guiSprite);
            this.ecs.addComponent(e, pos);
            this.ecs.addComponent(e, tweenable);
        }
    }
    Script.TestTween = TestTween;
})(Script || (Script = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/physics.ts" />
/// <reference path="../component/dead.ts" />
/// <reference path="../component/input.ts" />
/// <reference path="../component/position.ts" />
var System;
(function (System) {
    class AIArcher {
        static update(delta, ecs, aspect) {
            let input = aspect.get(Component.Input);
            let position = aspect.get(Component.Position);
            let shortest = Infinity;
            let closest = AIArcher.cacheClosest;
            // Find closest non-dead moving thing.
            for (let mover of aspect.playerSelector.latest()) {
                // Don't go after self.
                if (mover == aspect.entity) {
                    continue;
                }
                // Don't go after dead things
                let moverComps = ecs.getComponents(mover);
                if (ecs.getComponents(mover).has(Component.Dead)) {
                    continue;
                }
                // find dist
                let moverPos = moverComps.get(Component.Position);
                let dist = position.p.sqDistTo(moverPos.p);
                // use if closest
                if (dist < shortest) {
                    closest.copyFrom_(moverPos.p);
                    shortest = dist;
                }
            }
            // See if we found anything (if not, archer is last thing
            // alive. Congrats, archer!
            if (shortest === Infinity) {
                // Should do some kind of celebration here or something.
                input.attack = false;
                input.intent.y = Physics.STOP;
                return;
            }
            let minArcherDist = 500000;
            // We found something. Move away if too close.
            if (shortest <= minArcherDist) {
                input.intent.y = Physics.DOWN;
            }
            else {
                input.intent.y = Physics.STOP;
            }
            // Always face closest thing.
            input.targetAngle = position.p.pixiAngleTo(closest);
            // If far enough away, keep shooting.
            if (shortest > minArcherDist) {
                input.attack = !input.attack;
            }
            else {
                input.attack = false;
            }
        }
    }
    AIArcher.cacheClosest = new Point();
    System.AIArcher = AIArcher;
})(System || (System = {}));
var System;
(function (System) {
    let CowardState;
    (function (CowardState) {
        CowardState[CowardState["Wait"] = 0] = "Wait";
        CowardState[CowardState["Flee"] = 1] = "Flee";
        CowardState[CowardState["Approach"] = 2] = "Approach";
        CowardState[CowardState["Attack"] = 3] = "Attack";
    })(CowardState || (CowardState = {}));
    /**
     * Returns the difference (angle in radians) between two angles (each
     * in radians). Accounts for the horrid > 180 diff / 359˚-1˚ problem.
     */
    function angleDiff(a, b) {
        // TODO: lol this is hard do this right
        let raw = Math.abs(a - b);
        if (raw < Math.PI) {
            return raw;
        }
        return Constants.TWO_PI - raw;
    }
    class CowardFSM extends AI.BaseFSM {
        constructor(ecs, aspect) {
            // start in wait state
            super(ecs, aspect, CowardState.Wait);
            this.sysName = AICoward.name;
            this.states = new Map([
                [CowardState.Wait, {
                        pre: AI.noop,
                        body: this.wait,
                        next: this.next,
                    }],
                [CowardState.Flee, {
                        pre: AI.noop,
                        body: this.flee,
                        next: this.next,
                    }],
                [CowardState.Approach, {
                        pre: AI.noop,
                        body: this.approach,
                        next: this.next,
                    }],
                [CowardState.Attack, {
                        pre: AI.noop,
                        body: this.stopAndAttack,
                        next: this.next,
                    }],
            ]);
        }
        next() {
            // wait if far enough away
            let params = this.getParams();
            let playerDistance = this.playerDist();
            if (playerDistance > params.reactRadius) {
                return CowardState.Wait;
            }
            // if player close and facing, flee
            let playerAngle = this.getPlayerAngle();
            let playerToThisAngle = this.getPlayerPos().pixiAngleTo(this.getPos());
            let testAngle = angleDiff(playerAngle, playerToThisAngle);
            let cutoff = Constants.DEG2RAD * params.playerLookDegrees;
            // console.log('pl: ' + deg(playerAngle) + ', pl->this: ' + deg(playerToThisAngle) + ', diff: ' + deg(testAngle), ', cutoff: ' + cutoff);
            if (testAngle < cutoff) {
                return CowardState.Flee;
            }
            // else, move in for attack
            if (playerDistance < params.attackRadius) {
                return CowardState.Attack;
            }
            return CowardState.Approach;
        }
        flee() {
            this.facePlayer(Math.PI);
            this.moveForward();
            this.noAttack();
        }
        approach() {
            this.facePlayer();
            this.moveForward();
            this.noAttack();
        }
    }
    class AICoward {
        /**
         * Ensures that the AIAspect's blackboard has the AISpider blackboard.
         */
        static ensureBlackboard(ecs, aspect) {
            // create if needed
            if (!aspect.blackboards.has(AICoward.name)) {
                let bb = {
                    fsm: new CowardFSM(ecs, aspect),
                };
                aspect.blackboards.set(AICoward.name, bb);
            }
            // return it
            return aspect.blackboards.get(AICoward.name);
        }
        /**
         * AI System calls to update.
         * @param delta
         * @param ecs
         * @param aspect
         */
        static update(delta, ecs, aspect) {
            let blackboard = AICoward.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
            // for debugging, update the component w/ the FSM state
            let aiComp = aspect.get(Component.AIComponent);
            aiComp.debugState = CowardState[blackboard.fsm.cur];
        }
    }
    System.AICoward = AICoward;
})(System || (System = {}));
/// <reference path="../core/fsm.ts" />
/// <reference path="ai.ts" />
var System;
(function (System) {
    //
    // FollowSawtooth FSM
    //
    let FollowSawtoothState;
    (function (FollowSawtoothState) {
        FollowSawtoothState[FollowSawtoothState["Idle"] = 0] = "Idle";
        FollowSawtoothState[FollowSawtoothState["Pursue"] = 1] = "Pursue";
        FollowSawtoothState[FollowSawtoothState["Countdown"] = 2] = "Countdown";
        FollowSawtoothState[FollowSawtoothState["Explode"] = 3] = "Explode";
    })(FollowSawtoothState || (FollowSawtoothState = {}));
    class FollowSawtoothFSM extends AI.BaseFSM {
        constructor(ecs, aspect) {
            // start in wait state
            super(ecs, aspect, FollowSawtoothState.Idle);
            this.sysName = AIFollowSawtooth.name;
            this.states = new Map([
                [FollowSawtoothState.Idle, {
                        pre: AI.noop,
                        body: this.wait,
                        next: this.rangeDetectNext,
                    }],
                [FollowSawtoothState.Pursue, {
                        pre: AI.noop,
                        body: this.pursue,
                        next: this.pursueNext,
                    }],
                [FollowSawtoothState.Countdown, {
                        pre: this.countdownPre,
                        body: this.wait,
                        next: this.countdownNext,
                    }],
                [FollowSawtoothState.Explode, {
                        pre: this.explodePre,
                        body: this.wait,
                        next: this.explodeNext,
                    }],
            ]);
        }
        rangeDetectNext() {
            if (this.dead()) {
                return FollowSawtoothState.Countdown;
            }
            if (this.alivePlayerInRange(this.getParams().pursueRadius)) {
                return FollowSawtoothState.Pursue;
            }
            return FollowSawtoothState.Idle;
        }
        pursue() {
            // always try to face and move
            this.facePlayer();
            this.noAttack();
            this.moveForward();
        }
        pursueNext() {
            if (this.dead()) {
                return FollowSawtoothState.Countdown;
            }
            return FollowSawtoothState.Pursue;
        }
        countdownPre() {
            // play sound but only for sufficiently long countdowns
            if (this.getParams().countdownTime >= 1000) {
                this.ecs.getSystem(System.Audio).play(['sawtoothBeep']);
            }
        }
        countdownNext() {
            if (this.elapsedInCur < this.getParams().countdownTime) {
                return FollowSawtoothState.Countdown;
            }
            return FollowSawtoothState.Explode;
        }
        explodeNext() {
            // only need this because of respawning! (it will appear not dead
            // and needs to revert back to idle)
            if (this.dead()) {
                return FollowSawtoothState.Explode;
            }
            else {
                let activity = this.aspect.get(Component.Activity);
                activity.manual = false;
                return FollowSawtoothState.Idle;
            }
        }
    }
    class AIFollowSawtooth {
        /**
         * Ensures that the AIAspect's blackboard has the AISawtooth blackboard.
         */
        static ensureBlackboard(ecs, aspect) {
            // create if needed
            if (!aspect.blackboards.has(AIFollowSawtooth.name)) {
                let bb = {
                    fsm: new FollowSawtoothFSM(ecs, aspect),
                };
                aspect.blackboards.set(AIFollowSawtooth.name, bb);
            }
            // return it
            return aspect.blackboards.get(AIFollowSawtooth.name);
        }
        /**
         * AI System calls to update.
         * @param delta
         * @param ecs
         * @param aspect
         */
        static update(delta, ecs, aspect) {
            let blackboard = AIFollowSawtooth.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
            // for debugging, update the component w/ the FSM state
            let aiComp = aspect.get(Component.AIComponent);
            aiComp.debugState = FollowSawtoothState[blackboard.fsm.cur];
        }
    }
    System.AIFollowSawtooth = AIFollowSawtooth;
})(System || (System = {}));
var System;
(function (System) {
    let ForwardState;
    (function (ForwardState) {
        ForwardState[ForwardState["WaitBefore"] = 0] = "WaitBefore";
        ForwardState[ForwardState["Forward"] = 1] = "Forward";
        ForwardState[ForwardState["WaitAfter"] = 2] = "WaitAfter";
    })(ForwardState || (ForwardState = {}));
    class ForwardFSM extends AI.BaseFSM {
        constructor(ecs, aspect) {
            // start in wait state
            super(ecs, aspect, ForwardState.WaitBefore);
            this.sysName = AIForward.name;
            this.states = new Map([
                [ForwardState.WaitBefore, {
                        pre: AI.noop,
                        body: this.wait,
                        next: this.waitNext,
                    }],
                [ForwardState.Forward, {
                        pre: this.maybeFaceExit,
                        body: this.moveForward,
                        next: this.fwdNext,
                    }],
                [ForwardState.WaitAfter, {
                        pre: AI.noop,
                        body: this.wait,
                        next: () => { return ForwardState.WaitAfter; },
                    }],
            ]);
        }
        waitNext() {
            let fwdParams = this.getParams();
            return this.elapsedInCur <= fwdParams.beforeWaitTime ? ForwardState.WaitBefore : ForwardState.Forward;
        }
        maybeFaceExit() {
            // check whether we're supposed to face the exit
            let fwdParams = this.getParams();
            if (!fwdParams.faceExit) {
                return;
            }
            // just face the first exit we find (assumes instant turn).
            let gateSelector = this.ecs.getSystem(System.GateSelector);
            for (let gateE of gateSelector.latest()) {
                let gateComps = this.ecs.getComponents(gateE);
                let gate = gateComps.get(Component.Gate);
                if (gate.exit) {
                    this.faceTarget(gateComps.get(Component.Position).p);
                }
            }
        }
        fwdNext() {
            let fwdParams = this.getParams();
            return this.elapsedInCur <= fwdParams.forwardTime ? ForwardState.Forward : ForwardState.WaitAfter;
        }
    }
    class AIForward {
        /**
         * Ensures that the AIAspect's blackboard has the AISpider blackboard.
         */
        static ensureBlackboard(ecs, aspect) {
            // create if needed
            if (!aspect.blackboards.has(AIForward.name)) {
                let bb = {
                    fsm: new ForwardFSM(ecs, aspect),
                };
                aspect.blackboards.set(AIForward.name, bb);
            }
            // return it
            return aspect.blackboards.get(AIForward.name);
        }
        /**
         * AI System calls to update.
         * @param delta
         * @param ecs
         * @param aspect
         */
        static update(delta, ecs, aspect) {
            let blackboard = AIForward.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
            // for debugging, update the component w/ the FSM state
            let aiComp = aspect.get(Component.AIComponent);
            aiComp.debugState = ForwardState[blackboard.fsm.cur];
        }
    }
    System.AIForward = AIForward;
})(System || (System = {}));
var System;
(function (System) {
    let SwingTimerState;
    (function (SwingTimerState) {
        SwingTimerState[SwingTimerState["InitialWait"] = 0] = "InitialWait";
        SwingTimerState[SwingTimerState["Wait"] = 1] = "Wait";
        SwingTimerState[SwingTimerState["Attack"] = 2] = "Attack";
    })(SwingTimerState || (SwingTimerState = {}));
    class SwingTimerFSM extends AI.BaseFSM {
        constructor(ecs, aspect) {
            // start in initial wait state
            super(ecs, aspect, SwingTimerState.InitialWait);
            this.sysName = AISwingTimer.name;
            this.states = new Map([
                [SwingTimerState.InitialWait, {
                        pre: AI.noop,
                        body: this.noAttack,
                        next: this.initialWaitNext,
                    }],
                [SwingTimerState.Wait, {
                        pre: AI.noop,
                        body: this.noAttack,
                        next: this.waitNext,
                    }],
                [SwingTimerState.Attack, {
                        pre: AI.noop,
                        body: () => { this.aspect.get(Component.Input).attack = true; },
                        next: this.attackNext,
                    }],
            ]);
        }
        initialWaitNext() {
            let swingTimerParams = this.getParams();
            return this.elapsedInCur <= swingTimerParams.initialWait ? SwingTimerState.InitialWait : SwingTimerState.Wait;
        }
        waitNext() {
            let swingTimerParams = this.getParams();
            return this.elapsedInCur <= swingTimerParams.wait ? SwingTimerState.Wait : SwingTimerState.Attack;
        }
        attackNext() {
            let swingTimerParams = this.getParams();
            return this.elapsedInCur <= swingTimerParams.attack ? SwingTimerState.Attack : SwingTimerState.Wait;
        }
    }
    class AISwingTimer {
        /**
         * Ensures that the AIAspect's blackboard has the AISpider blackboard.
         */
        static ensureBlackboard(ecs, aspect) {
            // create if needed
            if (!aspect.blackboards.has(AISwingTimer.name)) {
                let bb = {
                    fsm: new SwingTimerFSM(ecs, aspect),
                };
                aspect.blackboards.set(AISwingTimer.name, bb);
            }
            // return it
            return aspect.blackboards.get(AISwingTimer.name);
        }
        /**
         * AI System calls to update.
         * @param delta
         * @param ecs
         * @param aspect
         */
        static update(delta, ecs, aspect) {
            let blackboard = AISwingTimer.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
            // for debugging, update the component w/ the FSM state
            let aiComp = aspect.get(Component.AIComponent);
            aiComp.debugState = SwingTimerState[blackboard.fsm.cur];
        }
    }
    System.AISwingTimer = AISwingTimer;
})(System || (System = {}));
/// <reference path="../core/fsm.ts" />
/// <reference path="ai.ts" />
/// <reference path="util.ts" />
var System;
(function (System) {
    //
    // Mimic FSM
    //
    let MimicState;
    (function (MimicState) {
        MimicState[MimicState["Hide"] = 0] = "Hide";
        MimicState[MimicState["Smash"] = 1] = "Smash";
        MimicState[MimicState["Pursue"] = 2] = "Pursue";
        MimicState[MimicState["GoHome"] = 3] = "GoHome";
        MimicState[MimicState["Attack"] = 4] = "Attack";
    })(MimicState || (MimicState = {}));
    class MimicFSM extends AI.BaseFSM {
        constructor(ecs, aspect) {
            // start in wait state
            super(ecs, aspect, MimicState.Hide);
            this.sysName = AIMimic.name;
            this.states = new Map([
                [MimicState.Hide, {
                        pre: AI.noop,
                        body: this.wait,
                        next: this.hideNext,
                    }],
                [MimicState.Smash, {
                        pre: AI.noop,
                        body: this.smashDo,
                        next: this.smashNext,
                    }],
                [MimicState.Pursue, {
                        pre: AI.noop,
                        body: this.pursueDo,
                        next: this.aggressiveNext,
                    }],
                [MimicState.GoHome, {
                        pre: AI.noop,
                        body: this.goHomeDo,
                        next: this.goHomeNext,
                    }],
                [MimicState.Attack, {
                        pre: AI.noop,
                        body: this.stopAndAttack,
                        next: this.attackNext,
                    }],
            ]);
        }
        /**
         *	Get player's distance from our home
         */
        playerHomeDist() {
            return this.playerDistTo(this.getBlackboard().home);
        }
        /**
         * Helper for more aggressive states (pursuing and attacking) to
         * determine next state.
         */
        aggressiveNext() {
            let params = this.getParams();
            // if player's far enough away from our home, just go back home
            if (this.playerHomeDist() > params.pursuitDistance) {
                return MimicState.GoHome;
            }
            // if we're facing the player and in attack range, then attack
            if (this.facingPlayer() && this.alivePlayerInRange(params.attackRange)) {
                return MimicState.Attack;
            }
            // otherwise player is in pursuit distance but we need to face
            // and/or move. stay in pursuit.
            return MimicState.Pursue;
        }
        //
        // hide
        //
        hideNext() {
            // jump out and attack player if hiding and they get near us. (not
            // using home distance because crate can be pushed.)
            if (this.playerDist() <= this.getParams().noticeDistance) {
                return MimicState.Smash;
            }
            // otherwise stay hiding
            return MimicState.Hide;
        }
        //
        // smash
        //
        smashDo() {
            let input = this.aspect.get(Component.Input);
            input.quickAttack = true;
        }
        smashNext() {
            return MimicState.Pursue;
        }
        //
        // pursue
        //
        pursueDo() {
            // stop the smashing
            let input = this.aspect.get(Component.Input);
            input.quickAttack = false;
            // always try to face
            this.facePlayer();
            this.noAttack();
            // if not close enough to attack, also pursue
            if (!this.alivePlayerInRange(this.getParams().attackRange)) {
                this.moveForward();
            }
        }
        //
        // goHome
        //
        goHomeDo() {
            this.faceTarget(this.getBlackboard().home);
            this.noAttack();
            this.moveForward();
        }
        goHomeNext() {
            // we may need to pursue the player
            if (this.playerHomeDist() <= this.getParams().pursuitDistance) {
                return MimicState.Pursue;
            }
            // if we made it home, yay.
            if (this.closeTo(this.getBlackboard().home)) {
                return MimicState.Hide;
            }
            // otherwise keep going home
            return MimicState.GoHome;
        }
        //
        // attack!
        //
        attackNext() {
            // always finish out swings (attacks).
            if (this.swinging()) {
                return MimicState.Attack;
            }
            // otherwise, rely on general "aggressive next" check
            return this.aggressiveNext();
        }
    }
    class AIMimic {
        /**
         * Ensures that the AIAspect's blackboard has the AIMimic blackboard.
         */
        static ensureBlackboard(ecs, aspect) {
            // create if needed
            if (!aspect.blackboards.has(AIMimic.name)) {
                let position = aspect.get(Component.Position);
                let bb = {
                    home: position.p.copy(),
                    fsm: new MimicFSM(ecs, aspect),
                };
                aspect.blackboards.set(AIMimic.name, bb);
            }
            // return it
            return aspect.blackboards.get(AIMimic.name);
        }
        /**
         * AI System calls to update.
         * @param delta
         * @param ecs
         * @param aspect
         */
        static update(delta, ecs, aspect) {
            let blackboard = AIMimic.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
            // for debugging, update the component w/ the FSM state
            let aiComp = aspect.get(Component.AIComponent);
            aiComp.debugState = MimicState[blackboard.fsm.cur];
        }
    }
    System.AIMimic = AIMimic;
})(System || (System = {}));
/// <reference path="../core/fsm.ts" />
/// <reference path="ai.ts" />
var System;
(function (System) {
    //
    // Sawtooth FSM
    //
    let SawtoothState;
    (function (SawtoothState) {
        SawtoothState[SawtoothState["Idle"] = 0] = "Idle";
        SawtoothState[SawtoothState["Kite"] = 1] = "Kite";
        SawtoothState[SawtoothState["DodgeDodge"] = 2] = "DodgeDodge";
        SawtoothState[SawtoothState["DodgeWait"] = 3] = "DodgeWait";
        SawtoothState[SawtoothState["Attack"] = 4] = "Attack";
        SawtoothState[SawtoothState["Cooldown"] = 5] = "Cooldown";
        SawtoothState[SawtoothState["Escape"] = 6] = "Escape";
        SawtoothState[SawtoothState["Countdown"] = 7] = "Countdown";
        SawtoothState[SawtoothState["Explode"] = 8] = "Explode";
    })(SawtoothState || (SawtoothState = {}));
    class SawtoothFSM extends AI.BaseFSM {
        constructor(ecs, aspect) {
            // start in wait state
            super(ecs, aspect, SawtoothState.Idle);
            this.sysName = AISawtooth.name;
            this.states = new Map([
                [SawtoothState.Idle, {
                        pre: AI.noop,
                        body: this.wait,
                        next: this.rangeDetectNext,
                    }],
                [SawtoothState.Kite, {
                        pre: AI.noop,
                        body: this.kiteBody,
                        next: this.rangeDetectNext,
                    }],
                [SawtoothState.DodgeDodge, {
                        pre: this.dodgePre,
                        body: this.dodgeDodgeBody,
                        next: this.dodgeDodgeNext,
                    }],
                [SawtoothState.DodgeWait, {
                        pre: AI.noop,
                        body: this.wait,
                        next: this.dodgeWaitNext,
                    }],
                [SawtoothState.Attack, {
                        pre: AI.noop,
                        body: this.attackBody,
                        next: this.attackNext,
                    }],
                [SawtoothState.Cooldown, {
                        pre: AI.noop,
                        body: this.wait,
                        next: this.cooldownNext,
                    }],
                [SawtoothState.Escape, {
                        pre: AI.noop,
                        body: this.escape,
                        next: this.escapeNext,
                    }],
                [SawtoothState.Countdown, {
                        pre: this.countdownPre,
                        body: this.wait,
                        next: this.countdownNext,
                    }],
                [SawtoothState.Explode, {
                        pre: this.explodePre,
                        body: this.wait,
                        next: this.explodeNext,
                    }],
            ]);
        }
        rangeDetectNext() {
            if (this.dead()) {
                return SawtoothState.Countdown;
            }
            if (this.alivePlayerInRange(this.getParams().aggressiveRadius)) {
                return SawtoothState.DodgeDodge;
            }
            if (this.alivePlayerInRange(this.getParams().kiteRadius)) {
                return SawtoothState.Kite;
            }
            return SawtoothState.Idle;
        }
        kiteBody() {
            this.facePlayer();
            this.moveBackwards(this.getParams().kiteSpeedScale);
        }
        dodgePre() {
            this.aspect.get(Component.Input).intent.y = 0;
            // face player at start if moving laterally
            if (!this.getParams().dodgeRotate) {
                this.facePlayer();
            }
            // pick dodge direction
            let bb = this.getBlackboard();
            bb.dodgeDirection = Probability.uniformChoice([-1, 1]);
            // increment no. dodges
            bb.dodgesPerformed++;
        }
        dodgeDodgeBody() {
            // rotate every frame if set to
            if (this.getParams().dodgeRotate) {
                this.facePlayer();
            }
            // move in dodge direction
            this.aspect.get(Component.Input).intent.x = this.getBlackboard().dodgeDirection;
        }
        dodgeDodgeNext() {
            if (this.dead()) {
                return SawtoothState.Countdown;
            }
            if (this.elapsedInCur <= this.getParams().dodgeDodgeTime) {
                return SawtoothState.DodgeDodge;
            }
            // only go to dodgewait if we may do another dodge
            let bb = this.getBlackboard();
            let params = this.getParams();
            if (bb.dodgesPerformed < params.dodges) {
                return SawtoothState.DodgeWait;
            }
            // exit directly from dodge to attack
            bb.dodgesPerformed = 0;
            return SawtoothState.Attack;
        }
        dodgeWaitNext() {
            if (this.dead()) {
                return SawtoothState.Countdown;
            }
            if (this.elapsedInCur <= this.getParams().dodgeWaitTime) {
                return SawtoothState.DodgeWait;
            }
            let bb = this.getBlackboard();
            // we've finished the cooldown. we may want to go back to idle or
            // kite, so check the range.
            let rangeCheckState = this.rangeDetectNext();
            if (rangeCheckState != SawtoothState.DodgeDodge) {
                bb.dodgesPerformed = 0;
                return rangeCheckState;
            }
            // we came to dodgewait because we could do another dodge, so do that.
            // or to attack.
            return SawtoothState.DodgeDodge;
        }
        attackBody() {
            this.facePlayer();
            this.moveForward(this.getParams().attackSpeedScale);
            this.attack();
        }
        attackNext() {
            if (this.dead()) {
                return SawtoothState.Countdown;
            }
            // keep attacking utnil sheathing or blocked, after which go to
            // cooldown
            let activity = this.aspect.get(Component.Activity).action;
            switch (activity) {
                case Action.Blocked:
                case Action.Sheathing:
                    return SawtoothState.Cooldown;
                default:
                    return SawtoothState.Attack;
            }
        }
        cooldownNext() {
            if (this.dead()) {
                return SawtoothState.Countdown;
            }
            if (this.elapsedInCur < this.getParams().cooldownTime) {
                return SawtoothState.Cooldown;
            }
            // if palyer went away, go back to idle / kite
            let rangeCheckState = this.rangeDetectNext();
            if (rangeCheckState !== SawtoothState.DodgeDodge) {
                return rangeCheckState;
            }
            // if player is still near after cooldown, escape!
            return SawtoothState.Escape;
        }
        escape() {
            this.facePlayer();
            this.moveBackwards(this.getParams().escapeSpeedScale);
        }
        escapeNext() {
            if (this.dead()) {
                return SawtoothState.Countdown;
            }
            if (this.elapsedInCur < this.getParams().escapeTime) {
                return SawtoothState.Escape;
            }
            return this.rangeDetectNext();
        }
        countdownPre() {
            // play sound but only for sufficiently long countdowns
            if (this.getParams().countdownTime >= 1000) {
                this.ecs.getSystem(System.Audio).play(['sawtoothBeep']);
            }
        }
        countdownNext() {
            if (this.elapsedInCur < this.getParams().countdownTime) {
                return SawtoothState.Countdown;
            }
            return SawtoothState.Explode;
        }
        explodeNext() {
            // only need this because of respawning! (it will appear not dead
            // and needs to revert back to idle)
            if (this.dead()) {
                return SawtoothState.Explode;
            }
            else {
                let activity = this.aspect.get(Component.Activity);
                activity.manual = false;
                return SawtoothState.Idle;
            }
        }
    }
    //
    // actual AI class
    //
    class AISawtooth {
        /**
         * Ensures that the AIAspect's blackboard has the AISawtooth blackboard.
         */
        static ensureBlackboard(ecs, aspect) {
            // create if needed
            if (!aspect.blackboards.has(AISawtooth.name)) {
                let bb = {
                    dodgesPerformed: 0,
                    dodgeDirection: -1,
                    fsm: new SawtoothFSM(ecs, aspect),
                };
                aspect.blackboards.set(AISawtooth.name, bb);
            }
            // return it
            return aspect.blackboards.get(AISawtooth.name);
        }
        /**
         * AI System calls to update.
         * @param delta
         * @param ecs
         * @param aspect
         */
        static update(delta, ecs, aspect) {
            let blackboard = AISawtooth.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
            // for debugging, update the component w/ the FSM state
            let aiComp = aspect.get(Component.AIComponent);
            aiComp.debugState = SawtoothState[blackboard.fsm.cur];
        }
    }
    System.AISawtooth = AISawtooth;
})(System || (System = {}));
/// <reference path="../core/fsm.ts" />
/// <reference path="ai.ts" />
var System;
(function (System) {
    //
    // Sentinel FSM
    //
    let SentinelState;
    (function (SentinelState) {
        SentinelState[SentinelState["AtHome"] = 0] = "AtHome";
        SentinelState[SentinelState["GoHome"] = 1] = "GoHome";
        SentinelState[SentinelState["Pursue"] = 2] = "Pursue";
        SentinelState[SentinelState["Attack"] = 3] = "Attack";
    })(SentinelState || (SentinelState = {}));
    class SentinelFSM extends AI.BaseFSM {
        constructor(ecs, aspect) {
            // start in wait state
            super(ecs, aspect, SentinelState.AtHome);
            this.sysName = AISentinel.name;
            //
            // actual FSM defined now
            //
            this.states = new Map([
                [SentinelState.AtHome, {
                        pre: AI.noop,
                        body: this.wait,
                        next: this.atHomeNext,
                    }],
                [SentinelState.GoHome, {
                        pre: AI.noop,
                        body: this.goHomeDo,
                        next: this.goHomeNext,
                    }],
                [SentinelState.Pursue, {
                        pre: AI.noop,
                        body: this.pursueDo,
                        next: this.aggressiveNext,
                    }],
                [SentinelState.Attack, {
                        pre: this.noBlock,
                        body: this.stopAndAttack,
                        next: this.attackNext,
                    }],
            ]);
        }
        /**
         *	Get player's distance from our home
         */
        playerHomeDist() {
            return this.playerDistTo(this.getBlackboard().home);
        }
        /**
         * Helper for more aggressive states (pursuing and attacking) to
         * determine next state.
         */
        aggressiveNext() {
            let params = this.getParams();
            // if player's dead, or it's far enough away from our home and
            // we're allowed to forget, just go back home
            if (this.playerDead() || (params.forget && this.playerHomeDist() > params.pursuitDistance)) {
                return SentinelState.GoHome;
            }
            // if we're facing the player and in attack range, then attack
            if (this.facingPlayer() && this.alivePlayerInRange(params.attackRange)) {
                return SentinelState.Attack;
            }
            // otherwise player is in pursuit distance but we need to face
            // and/or move. stay in pursuit.
            return SentinelState.Pursue;
        }
        //
        // atHome
        //
        atHomeNext() {
            // pursue player if in pursuit distance from home
            if (this.playerHomeDist() <= this.getParams().pursuitDistance) {
                return SentinelState.Pursue;
            }
            // otherwise stay home
            return SentinelState.AtHome;
        }
        //
        // goHome
        //
        goHomeDo() {
            this.faceTarget(this.getBlackboard().home);
            this.noAttack();
            this.moveForward();
        }
        goHomeNext() {
            // we may need to pursue the player
            if (this.playerHomeDist() <= this.getParams().pursuitDistance) {
                return SentinelState.Pursue;
            }
            // if we made it home, yay.
            if (this.closeTo(this.getBlackboard().home)) {
                return SentinelState.AtHome;
            }
            // otherwise keep going home
            return SentinelState.GoHome;
        }
        //
        // pursue(ing player) (includes facing)
        //
        playerBowOut() {
            let pComps = this.getPlayerComps();
            if (!pComps.has(Component.Armed)) {
                return false;
            }
            let armed = pComps.get(Component.Armed);
            return armed.active.partID === PartID.Bow;
        }
        pursueDo() {
            // always try to face
            this.facePlayer();
            this.noAttack();
            // if player has bow out, defend
            this.aspect.get(Component.Input).block = this.playerBowOut();
            // if not close enough to attack, also pursue
            if (!this.alivePlayerInRange(this.getParams().attackRange)) {
                this.moveForward();
            }
        }
        //
        // attack!
        //
        noBlock() {
            this.aspect.get(Component.Input).block = false;
        }
        attackNext() {
            // always finish out swings (attacks).
            if (this.swinging()) {
                return SentinelState.Attack;
            }
            // otherwise, rely on general "aggressive next" check
            return this.aggressiveNext();
        }
    }
    //
    // actual AI class
    //
    class AISentinel {
        /**
         * Ensures that the AIAspect's blackboard has the AISentinel blackboard.
         */
        static ensureBlackboard(ecs, aspect) {
            // create if needed
            if (!aspect.blackboards.has(AISentinel.name)) {
                let position = aspect.get(Component.Position);
                let bb = {
                    home: position.p.copy(),
                    fsm: new SentinelFSM(ecs, aspect),
                };
                aspect.blackboards.set(AISentinel.name, bb);
            }
            // return it
            return aspect.blackboards.get(AISentinel.name);
        }
        /**
         * AI System calls to update.
         * @param delta
         * @param ecs
         * @param aspect
         */
        static update(delta, ecs, aspect) {
            let blackboard = AISentinel.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
            // for debugging, update the component w/ the FSM state
            let aiComp = aspect.get(Component.AIComponent);
            aiComp.debugState = SentinelState[blackboard.fsm.cur];
        }
    }
    System.AISentinel = AISentinel;
})(System || (System = {}));
/// <reference path="../core/fsm.ts" />
/// <reference path="ai.ts" />
/// <reference path="util.ts" />
var System;
(function (System) {
    //
    // Spider FSM
    //
    let SpiderState;
    (function (SpiderState) {
        SpiderState[SpiderState["Wait"] = 0] = "Wait";
        SpiderState[SpiderState["Move"] = 1] = "Move";
        SpiderState[SpiderState["Face"] = 2] = "Face";
        SpiderState[SpiderState["Attack"] = 3] = "Attack";
    })(SpiderState || (SpiderState = {}));
    class SpiderFSM extends AI.BaseFSM {
        constructor(ecs, aspect) {
            // start in wait state
            super(ecs, aspect, SpiderState.Wait);
            this.sysName = AISpider.name;
            /**
             * This is the actual FSM: mapping between states and functions.
             */
            this.states = new Map([
                [SpiderState.Wait, {
                        pre: this.waitPre,
                        body: this.wait,
                        next: this.waitNext,
                    }],
                [SpiderState.Move, {
                        pre: this.movePre,
                        body: this.moveDo,
                        next: this.moveNext,
                    }],
                [SpiderState.Face, {
                        pre: AI.noop,
                        body: this.faceDo,
                        next: this.aggressiveNext,
                    }],
                [SpiderState.Attack, {
                        pre: AI.noop,
                        body: this.stopAndAttack,
                        next: this.attackNext,
                    }],
            ]);
        }
        waitswapUnlessPreemp(cur, other, preemp, maxDuration) {
            // if player in range, preemp state
            if (this.alivePlayerInRange(this.getParams().attackRange)) {
                return preemp;
            }
            // if elapsed over duration, switch to other
            if (this.elapsedInCur >= maxDuration) {
                return other;
            }
            // else, just stay as self
            return cur;
        }
        //
        // wait
        //
        waitPre() {
            // pick uniform wait time between param set min and max
            let params = this.getParams();
            this.getBlackboard().waitDuration = Probability.uniformInt(params.waitMin, params.waitMax);
        }
        waitNext() {
            return this.waitswapUnlessPreemp(SpiderState.Wait, SpiderState.Move, SpiderState.Face, this.getBlackboard().waitDuration);
        }
        //
        // move
        //
        movePre() {
            let blackbaord = this.aspect.blackboards.get(AISpider.name);
            // pick move angle
            blackbaord.moveAngle = angleClamp(Math.random() * Constants.TWO_PI);
            // pick move duration
            let params = this.getParams();
            blackbaord.moveDuration = Probability.uniformInt(params.moveMin, params.moveMax);
        }
        moveDo() {
            // go forward at angle
            let input = this.aspect.get(Component.Input);
            input.targetAngle = this.getBlackboard().moveAngle;
            input.intent.y = Physics.UP;
        }
        moveNext() {
            if (this.hittingWall()) {
                return SpiderState.Wait;
            }
            return this.waitswapUnlessPreemp(SpiderState.Move, SpiderState.Wait, SpiderState.Face, this.getBlackboard().moveDuration);
        }
        //
        // check used both in Face and Attack
        //
        /**
         * Checks whether to exit 'agressive' states and go back to Wait, or to
         * try attacking (Face / Attack)
         */
        aggressiveNext() {
            // if the player's not in range, go back to wait. otherwise, try to
            // face or attack.
            let playerInRange = this.alivePlayerInRange(this.getParams().attackRange);
            if (!playerInRange) {
                return SpiderState.Wait;
            }
            else {
                return this.facingPlayer() ? SpiderState.Attack : SpiderState.Face;
            }
        }
        //
        // attack facing (wants to attack, has to try to face player)
        //
        faceDo() {
            this.facePlayer();
            this.noAttack();
        }
        //
        // attack attacking: do a swing! (or a barrel roll)
        //
        attackNext() {
            // always finish out swings (attacks). if not swinging, use the
            // general aggressive next check.
            if (this.swinging()) {
                return SpiderState.Attack;
            }
            return this.aggressiveNext();
        }
    }
    //
    // actual AI class itself
    //
    class AISpider {
        /**
         * Ensures that the AIAspect's blackboard has the AISpider blackboard.
         */
        static ensureBlackboard(ecs, aspect) {
            // create if needed
            if (!aspect.blackboards.has(AISpider.name)) {
                let bb = {
                    fsm: new SpiderFSM(ecs, aspect),
                    waitDuration: -1,
                    moveAngle: -1,
                    moveDuration: -1,
                };
                aspect.blackboards.set(AISpider.name, bb);
            }
            // return it
            return aspect.blackboards.get(AISpider.name);
        }
        /**
         * AI System calls to update.
         * @param delta
         * @param ecs
         * @param aspect
         */
        static update(delta, ecs, aspect) {
            let blackboard = AISpider.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
            // for debugging, update the component w/ the FSM state
            let aiComp = aspect.get(Component.AIComponent);
            aiComp.debugState = SpiderState[blackboard.fsm.cur];
        }
    }
    System.AISpider = AISpider;
})(System || (System = {}));
/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/animatable.ts" />
var System;
(function (System) {
    /**
     * Ticks animations that need ticking.
     */
    class AnimationTicker extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Animatable.name,
                Component.AnimationTickable.name,
            ]);
        }
        update(delta, entities) {
            // tick everything that's selected
            for (let aspect of entities.values()) {
                let animatable = aspect.get(Component.Animatable);
                let keepUpdating = false;
                if (!animatable.pause) {
                    for (let key of animatable.state.activeKeys) {
                        let ac = animatable.state.animations.get(key);
                        // tick
                        keepUpdating = ac.animation.update(delta) || keepUpdating;
                        // expose core frame (for, e.g., footsteps)
                        if (ac.part === Part.Core) {
                            animatable.coreFrame = ac.animation.frame;
                        }
                    }
                }
                // if all animations don't require updates, well, don't update
                // them.
                if (!keepUpdating) {
                    this.ecs.removeComponent(aspect.entity, Component.AnimationTickable);
                }
            }
        }
    }
    System.AnimationTicker = AnimationTicker;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/dead.ts" />
/// <reference path="../component/bleeding.ts" />
var System;
(function (System) {
    class DeathBloodAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            this.timeSinceLastEmission = 0;
        }
    }
    class Bleeding extends System.Timebomb {
        constructor() {
            super(...arguments);
            this.tbComp = Component.Bleeding;
            this.componentsRequired = new Set([
                Component.Bleeding.name,
                Component.Position.name,
            ]);
        }
        /**
         * API other systems can use to start something bleeding.
         * @param blood
         */
        static begin(ecs, entity, blood) {
            // may not have blood component
            if (blood == null) {
                return;
            }
            // may have existing blood component; in this case, mutate it.
            let comps = ecs.getComponents(entity);
            if (comps.has(Component.Bleeding)) {
                let bleeding = comps.get(Component.Bleeding);
                bleeding.startTime = ecs.gametime;
                bleeding.duration = blood.duration;
                bleeding.fx = clone(blood.fx);
                return;
            }
            // no existing blood component: spawn new one.
            ecs.addComponent(entity, new Component.Bleeding(blood));
        }
        makeAspect() {
            return new DeathBloodAspect();
        }
        update(delta, entities) {
            // let timebomb bookkeep overall time stuff
            super.update(delta, entities);
            // then handle the blood particles separately
            for (let aspect of entities.values()) {
                let pos = aspect.get(Component.Position);
                let bleeding = aspect.get(Component.Bleeding);
                aspect.timeSinceLastEmission += delta;
                // emit if requisite period has passed
                if (aspect.timeSinceLastEmission >= bleeding.frequency) {
                    let eName = Events.EventTypes.Bleed;
                    let eArgs = {
                        fx: bleeding.fx,
                        location: pos.p.copy(),
                    };
                    this.eventsManager.dispatch({ name: eName, args: eArgs });
                    aspect.timeSinceLastEmission = 0;
                }
            }
        }
    }
    __decorate([
        override
    ], Bleeding.prototype, "makeAspect", null);
    __decorate([
        override
    ], Bleeding.prototype, "update", null);
    System.Bleeding = Bleeding;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/blocked.ts" />
/// <reference path="timebomb.ts" />
var System;
(function (System) {
    class Blocked extends System.Timebomb {
        constructor() {
            super(...arguments);
            this.tbComp = Component.Blocked;
            this.componentsRequired = new Set([
                Component.Blocked.name,
            ]);
        }
    }
    System.Blocked = Blocked;
})(System || (System = {}));
/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="../engine/ecs.ts" />
var System;
(function (System) {
    class BookkeeperRenderer extends Engine.System {
        constructor(stage, viewportDims, startDisabled = true) {
            super(startDisabled);
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
            // dobjs: { [key: string]: Stage.GameText } = {
            this.dobjs = {
                curLabel: null,
                curHms: null,
                curDecimal: null,
                totLabel: null,
                totHms: null,
                totDecimal: null,
            };
            let baseStyle = {
                align: 'right',
                fontFamily: [
                    "Consolas", "Mono", "Courier New", "Monospace",
                ],
                fontSize: 1,
                fontWeight: "bold",
                fill: "#e7e7e7",
                dropShadow: true,
                dropShadowColor: "#000000",
                dropShadowDistance: 2,
                dropShadowBlur: 5,
                dropShadowAngle: 2.35,
                dropShadowAlpha: 0.4
            };
            let labelStyle = clone(baseStyle);
            labelStyle.fontSize = 18;
            let hmsStyle = clone(baseStyle);
            hmsStyle.fontSize = 25;
            let decimalStyle = clone(baseStyle);
            decimalStyle.fontSize = 18;
            let buffer = 8; // space to pad bottom and side of screen
            let spacingH = 54; // in between LEVEL and TOTAL sections
            let decimalW = 42; // width of decimal section
            let textH = 18; // height of label text to put stuff above
            let squeezeY = 2; // amount to pull larger font text down to align
            this.dobjs.curLabel = new Stage.GameText('LEVEL', labelStyle, ZLevelHUD.DEBUG, StageTarget.HUD);
            this.dobjs.curLabel.position.set(viewportDims.x - buffer, viewportDims.y - buffer - spacingH);
            this.dobjs.curHms = new Stage.GameText('', hmsStyle, ZLevelHUD.DEBUG, StageTarget.HUD);
            this.dobjs.curHms.position.set(viewportDims.x - buffer - decimalW, viewportDims.y - buffer - textH - spacingH + squeezeY);
            this.dobjs.curDecimal = new Stage.GameText('', decimalStyle, ZLevelHUD.DEBUG, StageTarget.HUD);
            this.dobjs.curDecimal.position.set(viewportDims.x - buffer, viewportDims.y - buffer - textH - spacingH);
            this.dobjs.totLabel = new Stage.GameText('TOTAL', labelStyle, ZLevelHUD.DEBUG, StageTarget.HUD);
            this.dobjs.totLabel.position.set(viewportDims.x - buffer, viewportDims.y - buffer);
            this.dobjs.totHms = new Stage.GameText('', hmsStyle, ZLevelHUD.DEBUG, StageTarget.HUD);
            this.dobjs.totHms.position.set(viewportDims.x - buffer - decimalW, viewportDims.y - buffer - textH + squeezeY);
            this.dobjs.totDecimal = new Stage.GameText('', decimalStyle, ZLevelHUD.DEBUG, StageTarget.HUD);
            this.dobjs.totDecimal.position.set(viewportDims.x - buffer, viewportDims.y - buffer - textH);
            for (let dobjName in this.dobjs) {
                let dobj = this.dobjs[dobjName];
                dobj.anchor.set(1, 1);
                dobj.visible = !startDisabled;
                stage.add(dobj);
            }
        }
        onDisabled(entities) {
            for (let dobjName in this.dobjs) {
                this.dobjs[dobjName].visible = false;
            }
        }
        onEnabled(entities) {
            for (let dobjName in this.dobjs) {
                this.dobjs[dobjName].visible = true;
            }
        }
        update(delta, entities) {
            let source = this.ecs.getSystem(System.Bookkeeper);
            let [level, total] = source.debugElapsed();
            let [levelHms, levelDecimal] = level;
            this.dobjs.curHms.text = levelHms;
            this.dobjs.curDecimal.text = levelDecimal;
            let [totalHms, totalDecimal] = total;
            this.dobjs.totHms.text = totalHms;
            this.dobjs.totDecimal.text = totalDecimal;
        }
    }
    __decorate([
        override
    ], BookkeeperRenderer.prototype, "onDisabled", null);
    __decorate([
        override
    ], BookkeeperRenderer.prototype, "onEnabled", null);
    System.BookkeeperRenderer = BookkeeperRenderer;
})(System || (System = {}));
/// <reference path="../core/util.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/constants.ts" />
var System;
(function (System) {
    function numericToDisplay(r) {
        let [timeBig, timeSmall] = msToUserTimeTwoPart(r.timeTaken);
        return {
            playerDeaths: '' + r.playerDeaths,
            enemiesKilled: '' + r.enemiesKilled,
            secretsFound: '' + (r.secretsFound > 0 ? Constants.CHECKMARK : 'no'),
            timeTaken: msToUserTime(r.timeTaken),
            timeTakenBig: timeBig,
            timeTakenSmall: timeSmall,
        };
    }
    function numericToReport(r, nLevels) {
        // similar to per-level display, but show aggregate doughnuts
        let base = numericToDisplay(r);
        base.secretsFound = r.secretsFound + '/' + nLevels;
        return base;
    }
    function mergeNumericReports(a, b) {
        // base cases
        if (a == null && b == null) {
            throw new Error('Cannot merge two null reports');
        }
        if (a == null) {
            return b;
        }
        if (b == null) {
            return a;
        }
        // legit merging
        return {
            playerDeaths: a.playerDeaths + b.playerDeaths,
            enemiesKilled: a.enemiesKilled + b.enemiesKilled,
            secretsFound: a.secretsFound + b.secretsFound,
            timeTaken: a.timeTaken + b.timeTaken,
        };
    }
    class LevelInfo {
        constructor() {
            this.playerDeaths = 0;
            this.enemiesKilled = 0;
            this.destructiblesSmashed = 0;
            this.secretsFound = 0;
            this.startTime = -1;
            /**
             * Holds summed elapsed durations. Normally this will just be added to
             * with (end - start) and then reported. But for multi-segment levels,
             * it will contain a running total of all segments.
             */
            this.sumElapsed = 0;
        }
        /**
         * Call whenever beginning gameplay for a level (or a segment). Will
         * only start timer if it hasn't been started yet.
         */
        begin() {
            if (this.startTime === -1) {
                this.startTime = (performance || Date).now();
            }
            return this;
        }
        /**
         * Call whenever ending gameplay for a level (or a segment).
         */
        end() {
            if (this.startTime === -1) {
                console.error('Ending level with unset start time (-1); bookkeeping bug.');
            }
            let endTime = (performance || Date).now();
            this.sumElapsed += endTime - this.startTime;
            this.startTime = -1;
            return this;
        }
        reset() {
            this.startTime = -1;
            this.playerDeaths = 0;
            this.enemiesKilled = 0;
            this.destructiblesSmashed = 0;
            this.secretsFound = 0;
            this.sumElapsed = 0;
            return this;
        }
        /**
         * Can be recovered with (new LevelInfo).from(s).
         */
        serialize() {
            return JSON.stringify(this);
        }
        /**
         * Create LevelInfo from serialized version.
         */
        from(sLevelInfo) {
            let raw = JSON.parse(sLevelInfo);
            this.playerDeaths = raw.playerDeaths;
            this.enemiesKilled = raw.enemiesKilled;
            this.destructiblesSmashed = raw.destructibleSmashed;
            this.secretsFound = raw.secretsFound;
            this.startTime = raw.startTime;
            this.sumElapsed = raw.sumElapsed;
            return this;
        }
        /**
         * Resets doughnuts only.
         */
        softReset() {
            this.secretsFound = 0;
        }
        /**
         * Returns amount of time elapsed in the level after it has ended, or 0
         * if this hasn't been tracked.
         */
        elapsed() {
            if (this.sumElapsed === 0) {
                console.error('Got level duration as 0; bookkeeping bug.');
            }
            return this.sumElapsed;
        }
        report() {
            return numericToDisplay(this.reportNumeric());
        }
        reportNumeric() {
            return {
                playerDeaths: this.playerDeaths,
                enemiesKilled: this.enemiesKilled,
                secretsFound: this.secretsFound,
                timeTaken: this.elapsed(),
            };
        }
        /**
         * Return ms of time passed in this level, including sum of previous
         * parts and current (ongoing) time. For debug rendering.
         */
        debugElapsed() {
            let cur = 0;
            if (this.startTime != -1) {
                cur = (performance || Date).now() - this.startTime;
            }
            return this.sumElapsed + cur;
        }
    }
    /**
     * Just keeping things in order, you know.
     *
     * TODO: This doens't even need to be a "Library;" it never updates or does
     * anything on clear or anything else. Just needs to be universally
     * accessible.
     */
    class Bookkeeper extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
            this.debugTimeCache = 0;
            this.curLevelNum = 0;
            this.levelInfos = new Map();
            this.instructionsShown = new Set();
            this.dummyReport = {
                enemiesKilled: '<whoops>',
                playerDeaths: '<whoops>',
                secretsFound: '<whoops>',
                timeTaken: '<whoops>',
                timeTakenBig: '<whoops>',
                timeTakenSmall: '<whoops>',
            };
        }
        /**
         * Should be called only when switching to a new level that requires
         * bookkeeping. (Or, on a game re-playthrough, the same level again.)
         */
        setActive(levelNum) {
            // for debug view: sum last time to running total
            if (this.levelInfos.has(this.curLevelNum) && this.curLevelNum != levelNum) {
                this.debugTimeCache += this.levelInfos.get(this.curLevelNum).elapsed();
            }
            if (!this.levelInfos.has(levelNum)) {
                this.levelInfos.set(levelNum, new LevelInfo());
            }
            this.curLevelNum = levelNum;
            return this.levelInfos.get(levelNum).reset();
        }
        /**
         * Resets doughnuts only.
         */
        softReset() {
            if (this.levelInfos.has(this.curLevelNum)) {
                this.levelInfos.get(this.curLevelNum).softReset();
            }
        }
        /**
         * Called when gameplay starts. This can be called on the same level
         * multiple times.
         */
        startLevel() {
            // for debugging and jumping around mid-castle levels and not
            // crashing the game.
            if (!this.levelInfos.has(this.curLevelNum)) {
                console.warn('Level not found. Improper use of bookkeeper. Should be for debugging only.');
                this.setActive(this.curLevelNum);
            }
            this.levelInfos.get(this.curLevelNum).begin();
        }
        /**
         * Called when gameplay ends. This can be called on the same level
         * multiple times.
         */
        endLevel() {
            if (!this.levelInfos.has(this.curLevelNum)) {
                console.error('Bookkeeper could not end level ' + this.curLevelNum + ' because it did not know about it?');
                return;
            }
            this.levelInfos.get(this.curLevelNum).end();
        }
        /**
         * Sanity check before mutating any stats. Returns whether sanity check
         * passed.
         */
        mutateStatCheck() {
            if (!this.levelInfos.has(this.curLevelNum)) {
                console.error('Tried to mutate stat but Bookkeeper does not have current level?');
                return false;
            }
            return true;
        }
        incrementStat(statName) {
            if (!this.mutateStatCheck()) {
                return;
            }
            this.levelInfos.get(this.curLevelNum)[statName] += 1;
        }
        zeroStat(statName) {
            if (!this.mutateStatCheck()) {
                return;
            }
            this.levelInfos.get(this.curLevelNum)[statName] = 0;
        }
        playerDied() {
            this.incrementStat('playerDeaths');
            this.zeroStat('secretsFound');
        }
        enemyKilled() {
            this.incrementStat('enemiesKilled');
        }
        destructibleSmashed() {
            this.incrementStat('destructiblesSmashed');
        }
        /**
         * Sets that the secret was found.
         */
        secretFound() {
            this.incrementStat('secretsFound');
        }
        /**
         * Returns whether the player is currently in posession of the secret.
         */
        getSecretFound() {
            // special case for when level infos don't exist yet
            return this.levelInfos.has(this.curLevelNum) ?
                this.levelInfos.get(this.curLevelNum).secretsFound > 0 :
                false;
        }
        maybeShowInstruction(instructionID) {
            // don't show twice
            if (this.instructionsShown.has(instructionID)) {
                return;
            }
            // show
            let n = Events.EventTypes.ShowInstructions;
            let a = {
                instructionsID: instructionID,
            };
            this.eventsManager.dispatch({ name: n, args: a });
            this.instructionsShown.add(instructionID);
        }
        report() {
            if (!this.levelInfos.has(this.curLevelNum)) {
                console.error('Tried to get level report but Bookkeeper does not know about level?');
                return this.dummyReport;
            }
            return this.levelInfos.get(this.curLevelNum).report();
        }
        recap() {
            let keys = mapKeyArr(this.levelInfos);
            keys.sort(sortNumeric);
            let total = null;
            let donutArray = [];
            for (let key of keys) {
                let cur = this.levelInfos.get(key);
                donutArray.push(cur.secretsFound > 0);
                total = mergeNumericReports(total, cur.reportNumeric());
            }
            return [numericToReport(total, this.levelInfos.size), donutArray];
        }
        debugElapsed() {
            let cur = 0;
            if (this.levelInfos.has(this.curLevelNum)) {
                cur = this.levelInfos.get(this.curLevelNum).debugElapsed();
            }
            let total = this.debugTimeCache + cur;
            return [msToUserTimeTwoPart(cur), msToUserTimeTwoPart(total)];
        }
        /**
         * Returns serialized strings for instructions shown, level infos.
         *
         * Can be loaded with load().
         */
        serialize() {
            // cur level
            let sCurLevel = this.curLevelNum + '';
            // instrs shown
            let sInstructions = 'none';
            if (this.instructionsShown.size > 0) {
                sInstructions = Array.from(this.instructionsShown).join(';');
            }
            // level infos
            let sLevelInfos = 'none';
            if (this.levelInfos.size > 0) {
                let arrLevelInfos = [];
                for (let [n, lvlInfo] of this.levelInfos.entries()) {
                    arrLevelInfos.push(n + ':' + lvlInfo.serialize());
                }
                sLevelInfos = arrLevelInfos.join(';');
            }
            return [sCurLevel, sInstructions, sLevelInfos].join('|');
        }
        load(s) {
            this.reset();
            // cur level num. this will be the previous level, as the save operation
            // happens before the bookkeeper updates. This also doesn't matter most of
            // the time, because the game will usually immediately call setActive and
            // set the level number anew after loading this. This is all true EXCEPT for
            // multi-part levels (castle), where the level num stays the same for
            // multiple scenes. In that case, we need to load this here so we know that
            // the current levelInfo is active, and not to add it to our total time
            // cache (below).
            let [sCurLevel, sInstructions, sLevelInfos] = s.split('|');
            this.curLevelNum = parseInt(sCurLevel);
            // instrs shown
            if (sInstructions != 'none') {
                this.instructionsShown = new Set(sInstructions.split(';'));
            }
            // level infos
            if (sLevelInfos != 'none') {
                for (let sLevelInfo of sLevelInfos.split(';')) {
                    let sep = sLevelInfo.indexOf(':');
                    let n = parseInt(sLevelInfo.substring(0, sep));
                    let levelInfo = (new LevelInfo()).from(sLevelInfo.substring(sep + 1));
                    this.levelInfos.set(n, levelInfo);
                    // we add to the total elapsed time, EXCEPT for the current level
                    // (the time cache should only hold the sum of previous levels).
                    // This should only happen for multi-part levels, where the level
                    // num stays the same for multiple scenes.
                    if (n != this.curLevelNum) {
                        this.debugTimeCache += levelInfo.elapsed();
                    }
                }
            }
        }
        /**
         * Should be called when the game starts over.
         */
        reset() {
            this.debugTimeCache = 0;
            this.instructionsShown.clear();
            this.levelInfos.clear();
        }
        update(delta, entities) { }
    }
    System.Bookkeeper = Bookkeeper;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/ontology.ts" />
/// <reference path="../component/collision-shape.ts" />
/// <reference path="../component/item.ts" />
var System;
(function (System) {
    /**
     * Note that this is ITEM-centric collision detection. If we did
     * PLAYER-centric collision detection, that would more easily extend (e.g.,
     * to having multiple players). This version is conceptually simpler
     * (because each item will only collide with the player), but more brittle
     * (because it just grabs the player when it happens).
    */
    class CollisionItem extends Engine.System {
        constructor(gm) {
            super();
            this.gm = gm;
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.CollisionShape.name,
                Component.Item.name,
            ]);
            this.handlers = new Map([
                [Ontology.Item.Health, this.handleHealth],
                [Ontology.Item.Doughnut, this.handleDoughnut],
                [Ontology.Item.UpgradeSword, this.handleUpgradeSword],
                [Ontology.Item.UpgradeShield, this.handleUpgradeShield],
                [Ontology.Item.UpgradeHP4, this.handleUpgradeHP4],
                [Ontology.Item.UpgradeStabCombo, this.handleUpgradeStabCombo],
                [Ontology.Item.UpgradeSpeed, this.handleUpgradeSpeed],
                [Ontology.Item.UpgradeBow, this.handleUpgradeBow],
                [Ontology.Item.UpgradeAOECombo, this.handleUpgradeAOE],
                [Ontology.Item.UpgradeHP5, this.handleUpgradeHP5],
                [Ontology.Item.TransformToBlop, this.handleTransformToBlop],
                [Ontology.Item.TransformToPlayer, this.handleTransformToPlayer],
            ]);
        }
        /**
         * Disabling rather than removing to allow respawns.
         */
        disableItem(aspect) {
            aspect.get(Component.CollisionShape).disabled = true;
            this.ecs.addComponent(aspect.entity, new Component.Dead());
        }
        handleHealth(aspect) {
            // sanity checking: ensure item has health property; ensure
            // collided with player
            if (!aspect.has(Component.Health)) {
                console.error('Health item did not have required components?!');
                return;
            }
            let cShape = aspect.get(Component.CollisionShape);
            let player = cShape.collisionsFresh.keys().next().value;
            let playerComps = this.ecs.getComponents(player);
            if (!playerComps.has(Component.PlayerInput, Component.Health)) {
                console.error('Player did not have required components?!');
                return;
            }
            // if the player is at full health, don't pick up the item
            let playerHealth = playerComps.get(Component.Health);
            if (playerHealth.current == playerHealth.maximum) {
                return false;
            }
            // player needs health; pickup item to add health to player
            let itemHealth = aspect.get(Component.Health);
            playerHealth.current = Math.min(playerHealth.current + itemHealth.maximum, playerHealth.maximum);
            return true;
        }
        handleDoughnut(aspect) {
            // track
            this.ecs.getSystem(System.Bookkeeper).secretFound();
            // TODO: need a sound
            return true;
        }
        handleUpgrade(aspect, newLayer, sound, delay = 0) {
            // remove player and replace with one from new layer
            let player = aspect.get(Component.CollisionShape).collisionsFresh.keys().next().value;
            let playerPos = this.ecs.getComponents(player).get(Component.Position);
            this.ecs.removeEntity(player);
            this.gm.produce(newLayer, {
                height: 1,
                width: 1,
                x: playerPos.p.x,
                y: playerPos.p.y,
                rotation: Constants.RAD2DEG * playerPos.angle,
            });
            // play sound, if any
            if (sound) {
                this.ecs.getSystem(System.DelaySpeaker).enqueue({
                    delay: delay,
                    options: [sound],
                });
            }
            // flash
            this.ecs.getSystem(System.GUIManager).runSequence('upgrade');
            return true;
        }
        // TODO: just do partial argument binding and have one function. don't
        // want to look this up right now.
        handleUpgradeSword(aspect) {
            return this.handleUpgrade(aspect, 'player-Sword', 'title-sheen');
        }
        handleUpgradeShield(aspect) {
            return this.handleUpgrade(aspect, 'player-Shield', 'title-sheen');
        }
        handleUpgradeHP4(aspect) {
            return this.handleUpgrade(aspect, 'player-Health4', 'title-sheen');
        }
        handleUpgradeStabCombo(aspect) {
            return this.handleUpgrade(aspect, 'player-StabCombo-Slow', 'title-sheen');
        }
        handleUpgradeSpeed(aspect) {
            return this.handleUpgrade(aspect, 'player-StabCombo-Fast', 'title-sheen');
        }
        handleUpgradeBow(aspect) {
            return this.handleUpgrade(aspect, 'player-Bow', 'title-sheen');
        }
        handleUpgradeAOE(aspect) {
            return this.handleUpgrade(aspect, 'player-AOECombo', 'title-sheen');
        }
        handleUpgradeHP5(aspect) {
            return this.handleUpgrade(aspect, 'player-Health5', 'title-sheen');
        }
        handleTransformToBlop(aspect) {
            return this.handleUpgrade(aspect, 'blopPlayer', 'to-blop', 0);
        }
        handleTransformToPlayer(aspect) {
            return this.handleUpgrade(aspect, 'player-Health5', 'to-human', 0);
        }
        update(delta, entities) {
            for (let aspect of entities.values()) {
                let pos = aspect.get(Component.Position);
                let cShape = aspect.get(Component.CollisionShape);
                let item = aspect.get(Component.Item);
                if (cShape.collisionsFresh.size === 0) {
                    continue;
                }
                // if we got a collision, dispatch behavior based on item. the
                // behavior returns whether to continue with the item
                // acquisition.
                if (!this.handlers.get(item.behavior).call(this, aspect)) {
                    return;
                }
                // disable item
                this.disableItem(aspect);
                // if instruction is set, let bookkeeper decide whether to do
                // it.
                if (item.instructionID != null) {
                    this.ecs.getSystem(System.Bookkeeper).maybeShowInstruction(item.instructionID);
                }
                // fire event (for text, sound, etc.)
                let eArgs = {
                    itemType: item.behavior,
                    location: pos.p.copy(),
                };
                this.eventsManager.dispatch({
                    name: Events.EventTypes.ItemCollected,
                    args: eArgs,
                });
            }
        }
    }
    System.CollisionItem = CollisionItem;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/physics.ts" />
/// <reference path="../component/collision-shape.ts" />
/// <reference path="../component/physics-region.ts" />
var System;
(function (System) {
    class CollisionPhysicsRegion extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.CollisionShape.name,
                Component.PhysicsRegion.name,
            ]);
        }
        /**
         * RegionType.Slow
         */
        frictionMover(mover, scale) {
            let moverComps = this.ecs.getComponents(mover);
            if (!moverComps.has(Component.Input)) {
                return;
            }
            let input = moverComps.get(Component.Input);
            if (input.movement.resistSlow) {
                return;
            }
            input.frictionQueue.push(scale);
        }
        alterMover(mover, region) {
            // alter based on region type
            if (region.regionType === Physics.RegionType.Slow) {
                this.frictionMover(mover, region.scale);
            }
        }
        update(delta, entities) {
            for (let aspect of entities.values()) {
                let cShape = aspect.get(Component.CollisionShape);
                let pr = aspect.get(Component.PhysicsRegion);
                for (let mover of cShape.collisionsFresh.keys()) {
                    this.alterMover(mover, pr.region);
                }
            }
        }
    }
    System.CollisionPhysicsRegion = CollisionPhysicsRegion;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/collision-shape.ts" />
var System;
(function (System) {
    /**
     * Checking projectiles colliding with walls.
     */
    class CollisionProjectile extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.CollisionShape.name,
                Component.Attack.name,
                Component.Input.name,
            ]);
        }
        update(delta, entities) {
            for (let [entity, aspect] of entities.entries()) {
                // get projectile collision boxes
                let cShape = aspect.get(Component.CollisionShape);
                if (!cShape.cTypes.has(CollisionType.Projectile)) {
                    continue;
                }
                // see whether they hit a wall
                let hitWall = false;
                for (let collider of cShape.collisionsFresh.keys()) {
                    let colliderComps = this.ecs.getComponents(collider);
                    // sanity check collider has a collision box
                    if (!colliderComps.has(Component.CollisionShape)) {
                        continue;
                    }
                    let colliderCShape = colliderComps.get(Component.CollisionShape);
                    if (colliderCShape.cTypes.has(CollisionType.Wall)) {
                        hitWall = true;
                        break;
                    }
                }
                if (!hitWall) {
                    continue;
                }
                // omg we hit a wall. stop it, and make its damage 0 (so the
                // attack still makes it get removed).
                this.ecs.removeComponentIfExists(entity, Component.Input);
                let atk = aspect.get(Component.Attack);
                atk.info.damage = 0;
                // ... and play hit sounds!
                if (atk.info.sounds != null && atk.info.sounds.hit != null) {
                    this.ecs.getSystem(System.Audio).play(atk.info.sounds.hit, aspect.get(Component.Position).p);
                }
            }
        }
    }
    System.CollisionProjectile = CollisionProjectile;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/events.ts" />
/// <reference path="../component/collision-shape.ts" />
/// <reference path="../component/zone.ts" />
var System;
(function (System) {
    class CollisionZone extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.CollisionShape.name,
                Component.Zone.name,
            ]);
        }
        update(delta, entities) {
            for (let [entity, aspect] of entities.entries()) {
                let cShape = aspect.get(Component.CollisionShape);
                let zone = aspect.get(Component.Zone);
                // if the zone is inactive, we don't check presence or signal
                // events.
                if (!zone.active) {
                    continue;
                }
                // Handle players and other stuff in zone.
                let playerFound = false;
                for (let collider of cShape.collisionsFresh.keys()) {
                    let colliderComps = this.ecs.getComponents(collider);
                    if (colliderComps.has(Component.PlayerInput)) {
                        playerFound = true;
                        break;
                    }
                }
                // Compute the new player in zone state, and signal an event if
                // the state has changed.
                if (zone.containsPlayer != playerFound) {
                    let eName = Events.EventTypes.ZoneTransition;
                    let eArgs = {
                        enter: playerFound,
                        zone: entity,
                    };
                    this.eventsManager.dispatch({ name: eName, args: eArgs });
                }
                // always set latest player in zone state
                zone.containsPlayer = playerFound;
            }
        }
    }
    System.CollisionZone = CollisionZone;
})(System || (System = {}));
/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/player-input.ts" />
/// <reference path="../component/input.ts" />
var System;
(function (System) {
    /**
     * Holds the actual display.
     */
    class ControlsScreenAspect extends Engine.Aspect {
        constructor(screenSize) {
            super();
            this.overlay = Stage.Sprite.build('HUD/controlsScreen.png', ZLevelHUD.Overlay, StageTarget.HUD, new Point(), new Point(0.5, 0.5));
            this.visible = true;
            this.overlay.position.set(screenSize.x / 2, screenSize.y / 2);
        }
        get visible() {
            return this._visible;
        }
        set visible(v) {
            this.overlay.alpha = v ? 1.0 : 0.0;
            this._visible = v;
        }
    }
    /**
     * Handles bringing up the controls screen.
     */
    class ControlsScreen extends Engine.System {
        constructor(stage, screenSize) {
            super();
            this.stage = stage;
            this.screenSize = screenSize;
            this.componentsRequired = new Set([
                Component.Input.name,
                Component.PlayerInput.name,
            ]);
        }
        makeAspect() {
            return new ControlsScreenAspect(this.screenSize);
        }
        onAdd(aspect) {
            // send the aspect's display object to the outer renderer.
            this.stage.add(aspect.overlay);
        }
        update(delta, entities) {
            // Currently should be only one (just the player).
            for (let aspect of entities.values()) {
                let input = aspect.get(Component.Input);
                if (input.controls) {
                    aspect.visible = !aspect.visible;
                }
            }
        }
    }
    __decorate([
        override
    ], ControlsScreen.prototype, "makeAspect", null);
    __decorate([
        override
    ], ControlsScreen.prototype, "onAdd", null);
    System.ControlsScreen = ControlsScreen;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/damaged-flash.ts" />
/// <reference path="timebomb.ts" />
var System;
(function (System) {
    class DamagedFlash extends System.Timebomb {
        constructor() {
            super(...arguments);
            this.tbComp = Component.DamagedFlash;
            this.componentsRequired = new Set([
                Component.DamagedFlash.name,
            ]);
        }
    }
    System.DamagedFlash = DamagedFlash;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/health.ts" />
var System;
(function (System) {
    class DeathAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            this.prevHealth = -1;
        }
    }
    /**
     * Detects death and triggers stuff..
     */
    class Death extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Health.name,
            ]);
            this.dirtyComponents = new Set([
                Component.Health.name,
            ]);
        }
        makeAspect() {
            return new DeathAspect();
        }
        die(aspect) {
            // pre extraction
            let thing = System.Util.getThing(this.ecs, aspect.entity);
            // add dead component so other systems can know about this.
            this.ecs.addComponent(aspect.entity, new Component.Dead());
            // do any death bleeding
            if (aspect.has(Component.Attributes)) {
                let attr = aspect.get(Component.Attributes);
                System.Bleeding.begin(this.ecs, aspect.entity, attr.data.deathBlood);
            }
            // NOTE: Legacy (exp) feature would go here: issue exp to
            // list of most recent (frame) attackers.
            // issue event
            let loc = new Point(-1, -1);
            if (aspect.has(Component.Position)) {
                loc.copyFrom_(aspect.get(Component.Position).p);
            }
            let eType = Events.EventTypes.ThingDead;
            let eArgs = {
                location: loc,
                thing: aspect.entity,
                thingType: thing,
            };
            this.eventsManager.dispatch({ name: eType, args: eArgs });
            // special event if checkpoint. (may want to just always
            // issue dead event and have handlers pick).
            if (aspect.has(Component.Checkpoint)) {
                let eType = Events.EventTypes.Checkpoint;
                let eArgs = {
                    checkpoint: aspect.entity,
                    location: loc,
                };
                this.eventsManager.dispatch({
                    name: eType,
                    args: eArgs,
                });
            }
        }
        update(delta, entities, dirty) {
            for (let entity of dirty) {
                let aspect = entities.get(entity);
                let health = aspect.get(Component.Health);
                // detect death the first frame it happens and issue events.
                if ((aspect.prevHealth !== 0 && health.current === 0) ||
                    (health.current === 0 && !aspect.has(Component.Dead))) {
                    this.die(aspect);
                }
                // bookkeep
                aspect.prevHealth = health.current;
            }
        }
    }
    __decorate([
        override
    ], Death.prototype, "makeAspect", null);
    System.Death = Death;
})(System || (System = {}));
/// <reference path="../core/keyboard.ts" />
/// <reference path="../engine/ecs.ts" />
var System;
(function (System) {
    class DebugGameSpeed extends Engine.System {
        constructor(keyboard) {
            super(false, true);
            this.keyboard = keyboard;
            // state
            this.prevDigits = [false, false, false, false];
            this.digitKeys = [GameKey.Digit1, GameKey.Digit2, GameKey.Digit3, GameKey.Digit4];
            this.slowScales = [1, 2, 4, 8];
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
        }
        update(delta, entities) {
            // same with digits. damn, really should have "button press" as an
            // input abstraction... maybe...
            for (let i = 0; i < this.digitKeys.length; i++) {
                let wantDigit = this.keyboard.gamekeys.get(this.digitKeys[i]).isDown;
                if (wantDigit && !(this.prevDigits[i])) {
                    this.ecs.slowMotion.debugFactor = this.slowScales[i];
                }
                this.prevDigits[i] = wantDigit;
            }
        }
    }
    System.DebugGameSpeed = DebugGameSpeed;
})(System || (System = {}));
/// <reference path="../component/debug-inspection.ts" />
var System;
(function (System) {
    class DebugHTMLComponentsAspect extends Engine.Aspect {
        constructor() {
            super();
            this.cellmap = new Map();
            this.rowkeys = new Array();
            this.title = document.createElement('h2');
            this.table = document.createElement('table');
        }
    }
    function fillRow(row, cName, cToString) {
        let k = document.createElement('td');
        k.innerText = cName;
        let v = document.createElement('td');
        v.innerText = cToString;
        v.className = 'lcvVal';
        row.appendChild(k);
        row.appendChild(v);
        return v;
    }
    /**
     * Renders components for an entity (the entity marked by the
     * Component.DebugInspection) as an HTML table.
     */
    class DebugHTMLComponents extends Engine.System {
        /**
         *
         * @param el The element to render our debug views to.
         */
        constructor(el) {
            super(false, true);
            this.el = el;
            this.componentsRequired = new Set([
                Component.DebugInspection.name,
            ]);
            // for fun
            let decoration = document.createElement('h2');
            decoration.style.fontStyle = 'italic';
            decoration.innerText = '\u{26A1} Lightning Component Viewer v1.0';
            el.appendChild(decoration);
        }
        makeAspect() {
            return new DebugHTMLComponentsAspect();
        }
        onAdd(aspect) {
            aspect.title.innerText = aspect.entity.toString();
            this.el.appendChild(aspect.title);
            this.el.appendChild(aspect.table);
        }
        onRemove(aspect) {
            this.el.removeChild(aspect.title);
            this.el.removeChild(aspect.table);
        }
        updateTable(aspect) {
            let ti = 0;
            for (let [cName, cToString] of aspect.debugComponentTable()) {
                let pastTable = ti >= aspect.rowkeys.length;
                // - check whether stale table row(s) exist
                //	 known: if table row key < component
                //	 do: remove (keep ti) while row key < component
                while (!pastTable && aspect.rowkeys[ti] < cName) {
                    aspect.cellmap.delete(aspect.rowkeys[ti]);
                    aspect.rowkeys.splice(ti, 1);
                    aspect.table.deleteRow(ti);
                }
                // - check component missing table row
                //	 known: if table row key > component
                //	 do: add table row at the location, increment ti
                if (pastTable || aspect.rowkeys[ti] > cName) {
                    // todo: refactor w/ above
                    let row = aspect.table.insertRow(ti);
                    let vCell = fillRow(row, cName, cToString);
                    aspect.cellmap.set(cName, vCell);
                    aspect.rowkeys.splice(ti, 0, cName);
                    ti++;
                    continue;
                }
                // - check match
                //	 known: if table row key === component
                //	 do: update entry
                if (aspect.rowkeys[ti] === cName) {
                    // update contents
                    aspect.cellmap.get(cName).innerText = cToString;
                    ti++;
                    continue;
                }
                // Should never get here.
                throw new Error('Coding assumption error!');
            }
        }
        render(aspect) {
            this.updateTable(aspect);
        }
        update(delta, entities) {
            if (entities.size == 0) {
                return;
            }
            else if (entities.size > 1) {
                this.el.innerText = 'ERROR: > 1 Entities w/ Component.DebugInspection.';
                return;
            }
            // render first (and only)
            this.render(entities.values().next().value);
        }
    }
    __decorate([
        override
    ], DebugHTMLComponents.prototype, "makeAspect", null);
    __decorate([
        override
    ], DebugHTMLComponents.prototype, "onAdd", null);
    __decorate([
        override
    ], DebugHTMLComponents.prototype, "onRemove", null);
    System.DebugHTMLComponents = DebugHTMLComponents;
})(System || (System = {}));
/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/lockon.ts" />
var System;
(function (System) {
    class DebugInspectionAspect extends Engine.Aspect {
        constructor() {
            super();
            this.dobj = Stage.Sprite.build('HUD/target1.png', ZLevelWorld.DEBUG, StageTarget.World, new Point(), new Point(0.5, 0.5));
            this.dobj.visible = true;
            this.dobj.tint = DebugInspectionAspect.TINT;
        }
    }
    DebugInspectionAspect.ROTATE_DELTA = 0.2;
    DebugInspectionAspect.TINT = 0xff0000;
    /**
     * Renders a graphic around entities with the Component.DebugInspection.
     */
    class DebugInspectionRenderer extends Engine.System {
        constructor(stage) {
            super(true, true);
            this.stage = stage;
            this.componentsRequired = new Set([
                Component.DebugInspection.name,
                Component.Position.name,
            ]);
        }
        makeAspect() {
            return new DebugInspectionAspect();
        }
        onAdd(aspect) {
            this.stage.add(aspect.dobj);
        }
        onRemove(aspect) {
            this.stage.remove(aspect.dobj);
        }
        onDisabled(entities) {
            for (let aspect of entities.values()) {
                aspect.dobj.visible = false;
            }
        }
        update(delta, entities) {
            for (let aspect of entities.values()) {
                let position = aspect.get(Component.Position);
                // update position and rotate
                aspect.dobj.visible = true;
                aspect.dobj.position.set(position.p.x, position.p.y);
                aspect.dobj.rotation = angleClamp(aspect.dobj.rotation + DebugInspectionAspect.ROTATE_DELTA);
            }
        }
    }
    __decorate([
        override
    ], DebugInspectionRenderer.prototype, "makeAspect", null);
    __decorate([
        override
    ], DebugInspectionRenderer.prototype, "onAdd", null);
    __decorate([
        override
    ], DebugInspectionRenderer.prototype, "onRemove", null);
    __decorate([
        override
    ], DebugInspectionRenderer.prototype, "onDisabled", null);
    System.DebugInspectionRenderer = DebugInspectionRenderer;
})(System || (System = {}));
/// <reference path="../component/debug-inspection.ts" />
var System;
(function (System) {
    /**
     * Ensures only one entity has the Component.DebugInspection on it.
     */
    class DebugInspectionUniquifier extends Engine.System {
        constructor() {
            super(false, true);
            this.componentsRequired = new Set([
                Component.DebugInspection.name,
            ]);
        }
        update(delta, entities) {
            if (entities.size == 0) {
                return;
            }
            // get one with biggest timestamp
            let latestTime = -1;
            let latestEntity = null;
            for (let [entity, aspect] of entities.entries()) {
                let di = aspect.get(Component.DebugInspection);
                if (di.pickTime > latestTime) {
                    latestTime = di.pickTime;
                    latestEntity = entity;
                }
            }
            // prune debug inspection component off of the others
            for (let [entity, aspect] of entities.entries()) {
                if (entity !== latestEntity) {
                    this.ecs.removeComponent(entity, Component.DebugInspection);
                }
            }
        }
    }
    System.DebugInspectionUniquifier = DebugInspectionUniquifier;
})(System || (System = {}));
/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/stage.ts" />
/// <reference path="../component/position.ts" />
var System;
(function (System) {
    class DebugPositionAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            this.cleared = true;
        }
    }
    class DebugPositionRenderer extends Engine.System {
        constructor(stage, disabled) {
            super(disabled);
            this.stage = stage;
            this.componentsRequired = new Set([
                Component.Position.name,
            ]);
        }
        makeAspect() {
            return new DebugPositionAspect();
        }
        onAdd(aspect) {
            // get components
            let position = aspect.get(Component.Position);
            // create resources. save to aspect.
            aspect.pos = new Stage.Graphics(ZLevelWorld.DEBUG, StageTarget.World);
            aspect.vector = new Stage.Graphics(ZLevelWorld.DEBUG, StageTarget.World);
            for (let graphics of [aspect.pos, aspect.vector]) {
                graphics.position.set(position.p.x, position.p.y);
            }
            // save aspect state to outer renderer.
            this.stage.add(aspect.pos);
            this.stage.add(aspect.vector);
        }
        onRemove(aspect) {
            this.stage.remove(aspect.pos);
            this.stage.remove(aspect.vector);
        }
        onDisabled(entities) {
            for (let aspect of entities.values()) {
                aspect.pos.clear();
                aspect.vector.clear();
                aspect.cleared = true;
            }
        }
        maybeDraw(aspect, pos) {
            if (!aspect.cleared) {
                return;
            }
            // draw location + angle in red
            aspect.pos.clear();
            aspect.pos.beginFill(0xff0000, 0.7);
            aspect.pos.drawCircle(0, 0, 3);
            aspect.pos.endFill();
            aspect.cleared = false;
        }
        update(delta, entities) {
            // Update internal positions. (Currently assuming dims never changes.)
            for (let aspect of entities.values()) {
                let position = aspect.get(Component.Position);
                // always update internal positions
                aspect.pos.x = position.p.x;
                aspect.pos.y = position.p.y;
                aspect.vector.x = position.p.x;
                aspect.vector.y = position.p.y;
                // maybe redraw location and RO (only if cleared)
                this.maybeDraw(aspect, position);
                // always redraw vector because i don't trust pixi's rotation
                let len = 25;
                aspect.vector.clear();
                aspect.vector.lineStyle(3, 0xff0000, 0.7);
                aspect.vector.moveTo(0, 0);
                aspect.vector.lineTo(len * Math.cos(position.angle), -len * Math.sin(position.angle));
                // aspect.vector.lineTo(len, 0);
            }
        }
    }
    __decorate([
        override
    ], DebugPositionRenderer.prototype, "makeAspect", null);
    __decorate([
        override
    ], DebugPositionRenderer.prototype, "onAdd", null);
    __decorate([
        override
    ], DebugPositionRenderer.prototype, "onRemove", null);
    __decorate([
        override
    ], DebugPositionRenderer.prototype, "onDisabled", null);
    System.DebugPositionRenderer = DebugPositionRenderer;
})(System || (System = {}));
/// <reference path="../core/keyboard.ts" />
/// <reference path="../engine/ecs.ts" />
var System;
(function (System) {
    class DebugSceneRestart extends Engine.System {
        constructor(keyboard, sceneManager) {
            super(false, true);
            this.keyboard = keyboard;
            this.sceneManager = sceneManager;
            // state
            this.prevKey = false;
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
        }
        update(delta, entities) {
            let wantReset = this.keyboard.gamekeys.get(GameKey.J).isDown;
            if (wantReset && !this.prevKey) {
                this.sceneManager.resetScene();
            }
            this.prevKey = wantReset;
        }
    }
    System.DebugSceneRestart = DebugSceneRestart;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/sound.ts" />
var System;
(function (System) {
    /**
     * Simply plays sounds after a delay.
     *
     * TODO: shouldn't really be system.
     */
    class DelaySpeaker extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
            this.soundQueue = [];
        }
        enqueue(sd) {
            this.soundQueue.push(clone(sd));
        }
        update(delta, entities) {
            for (let i = this.soundQueue.length - 1; i >= 0; i--) {
                // check if ready and play
                if (this.soundQueue[i].delay == null || this.soundQueue[i].delay < delta) {
                    this.ecs.getSystem(System.Audio).play(this.soundQueue[i].options, this.soundQueue[i].location);
                    this.soundQueue.splice(i, 1);
                }
                else {
                    // else, decrement wait time
                    this.soundQueue[i].delay -= delta;
                }
            }
        }
    }
    System.DelaySpeaker = DelaySpeaker;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
var System;
(function (System) {
    class EnemyHUDRendererAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            /**
             * Map from GUI element name to info
             */
            this.txtPieces = new Map();
            this.spritePieces = new Map();
            this.prevVisible = false;
            this.cacheBarID = null;
        }
    }
    class EnemyHUDRenderer extends Engine.System {
        // NOTE: use Component.Lockon to judge visibility
        constructor(gui, guiSequence, translator, playerSelector) {
            super();
            this.gui = gui;
            this.guiSequence = guiSequence;
            this.translator = translator;
            this.playerSelector = playerSelector;
            this.cacheEnemyHUDBasePos = new Point();
            // positioning based on player location
            this.aboveOffset = new Point(0, -25);
            this.belowOffset = new Point(0, 50);
            // how much to multiply max health by to get total bar size
            this.widthMultiplier = 10;
            // bar sprite IDs that need to be altered
            this.barSpriteIDs = new Set([
                'enemyHUDNormalHealth', 'enemyHUDGatekeeperHealth', 'enemyHUDBossHealth'
            ]);
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.Health.name,
                Component.Enemy.name,
            ]);
        }
        makeAspect() {
            return new EnemyHUDRendererAspect();
        }
        /**
         * Health value (current or maximum) to coordinate (x) value in base HUD
         * coordinates.
         */
        healthToCoord(health) {
            return health * this.widthMultiplier;
        }
        setBarWidth(bar, health) {
            let sComps = this.ecs.getComponents(bar);
            let gs = sComps.get(Component.GUISprite);
            gs.baseData.width = this.healthToCoord(health.current);
        }
        computeBarID(enemy) {
            if (enemy.boss) {
                return 'enemyHUDBossHealth';
            }
            if (enemy.gatekeeper || enemy.gateID != null) {
                return 'enemyHUDGatekeeperHealth';
            }
            return 'enemyHUDNormalHealth';
        }
        createSpritePkg(spriteID, overridePos = null) {
            // cache inner HUD offset so that we know how to reposition this
            // piece later when we move the whole HUD based on the enemy's
            // position.
            let s = this.gui.createSprite(spriteID, null, overridePos);
            let sComps = this.ecs.getComponents(s);
            // start invisible
            if (sComps.has(Component.Tweenable)) {
                sComps.get(Component.Tweenable).groundTruth.alpha = 0;
            }
            return {
                entity: s,
                offset: sComps.get(Component.Position).p.copy(),
                startAlpha: sComps.get(Component.GUISprite).baseData.alpha,
            };
        }
        /**
         * NOTE: not cleaning anything up (no onRemove(...)) because
         * System.GUIManager takes care of it at the end of the level (and
         * otherwise we end up with a race condition there).
         * @param aspect
         */
        onAdd(aspect) {
            // Construct using System.GUIManager
            // get info
            let enemy = aspect.get(Component.Enemy);
            let health = aspect.get(Component.Health);
            let textOverrides = new Map([
                ['enemyHUDName', enemy.enemyName],
                ['enemyHUDKind', enemy.kind],
            ]);
            for (let txtID of this.guiSequence.text) {
                let override = null;
                if (textOverrides.has(txtID)) {
                    override = textOverrides.get(txtID);
                }
                let e = this.gui.createText(txtID, override);
                let eComps = this.ecs.getComponents(e);
                // TODO: tween
                // this.gui.tween(e, 'enter');
                aspect.txtPieces.set(txtID, {
                    entity: e,
                    offset: eComps.get(Component.Position).p.copy(),
                    startAlpha: eComps.get(Component.TextRenderable).textData.alpha,
                });
                // start invisible
                if (eComps.has(Component.Tweenable)) {
                    eComps.get(Component.Tweenable).groundTruth.alpha = 0;
                }
            }
            // pick bar type based on enemy status
            let barID = this.computeBarID(enemy);
            aspect.cacheBarID = barID;
            for (let spriteID of this.guiSequence.sprites.concat([barID])) {
                let overridePos = null;
                if (spriteID === 'enemyHUDCapRight') {
                    overridePos = new Point(this.healthToCoord(health.maximum), 0);
                }
                let spritePkg = this.createSpritePkg(spriteID, overridePos);
                let sComps = this.ecs.getComponents(spritePkg.entity);
                // maybe override the width
                if (spriteID === 'enemyHUDUnderBar') {
                    sComps.get(Component.GUISprite).baseData.width = this.healthToCoord(health.maximum);
                }
                aspect.spritePieces.set(spriteID, spritePkg);
            }
        }
        update(delta, entities) {
            // get player pos for angle computations
            let player = this.playerSelector.latest().next().value;
            if (player == null) {
                console.warn('Player not found; skipping enemy hud update');
                return;
            }
            let playerPos = this.ecs.getComponents(player).get(Component.Position).p;
            for (let aspect of entities.values()) {
                // check whether manually disabled
                let enemy = aspect.get(Component.Enemy);
                if (enemy.hudDisabled) {
                    continue;
                }
                // get data
                let health = aspect.get(Component.Health);
                let enemyPos = aspect.get(Component.Position).p;
                let angle = playerPos.angleTo(enemyPos);
                let offset = this.aboveOffset;
                if (angle < Math.PI) {
                    offset = this.belowOffset;
                }
                // maybe update barID (the "check at frame 1" detection is
                // really causing annoyances... gateID not set by aspect
                // creation)
                let barID = this.computeBarID(enemy);
                if (barID != aspect.cacheBarID) {
                    // destroy
                    if (aspect.cacheBarID != null && aspect.spritePieces.has(aspect.cacheBarID)) {
                        this.gui.destroy(aspect.spritePieces.get(aspect.cacheBarID).entity);
                        aspect.spritePieces.delete(aspect.cacheBarID);
                    }
                    // create new one
                    aspect.spritePieces.set(barID, this.createSpritePkg(barID));
                    aspect.cacheBarID = barID;
                }
                // detect visibility
                let visible = aspect.has(Component.LockOn) || aspect.has(Component.DamagedFlash);
                // translate to HUD coordinates
                this.translator.worldToHUDBase(this.cacheEnemyHUDBasePos.copyFrom_(enemyPos));
                // now update the HUD entities' positions
                let worklist = [aspect.spritePieces, aspect.txtPieces];
                for (let w of worklist) {
                    for (let [id, pkg] of w.entries()) {
                        // update the width of any of the bars
                        if (this.barSpriteIDs.has(id)) {
                            this.setBarWidth(pkg.entity, health);
                        }
                        // update HUD entity pos as enemy pos + player-aware
                        // distance offset + HUD entity offset
                        let eComps = this.ecs.getComponents(pkg.entity);
                        // safety check in case pkg.entity isn't tracked (level
                        // warping bug).
                        if (eComps == null) {
                            continue;
                        }
                        let pos = eComps.get(Component.Position);
                        pos.p = this.cacheEnemyHUDBasePos.copy().add_(offset).add_(pkg.offset);
                        // if no tweenable comp, nothing else we can do in this
                        // inner loop
                        if (!eComps.has(Component.Tweenable)) {
                            continue;
                        }
                        let tweenable = eComps.get(Component.Tweenable);
                        // ensure visibility if we need it
                        if ((!aspect.prevVisible) && visible) {
                            // clear any queued up fade-out tweens because
                            // otherwise they'd override this or happen too
                            // fast after mouse-off
                            tweenable.clear = true;
                            tweenable.tweenQueue.push({
                                prop: 'alpha',
                                spec: {
                                    delay: 0,
                                    duration: 200,
                                    val: pkg.startAlpha,
                                    valType: 'abs',
                                    method: 'linear',
                                }
                            });
                        }
                        // do exit tween if just became not locked-on
                        if (aspect.prevVisible && (!visible)) {
                            tweenable.tweenQueue.push({
                                prop: 'alpha',
                                spec: {
                                    delay: 1500,
                                    duration: 500,
                                    val: 0,
                                    valType: 'abs',
                                    method: 'linear',
                                }
                            });
                        }
                    }
                }
                // update state
                aspect.prevVisible = visible;
            }
        }
    }
    __decorate([
        override
    ], EnemyHUDRenderer.prototype, "makeAspect", null);
    __decorate([
        override
    ], EnemyHUDRenderer.prototype, "onAdd", null);
    System.EnemyHUDRenderer = EnemyHUDRenderer;
})(System || (System = {}));
var System;
(function (System) {
    /**
     * Checks enemies the first frame they exist to assign them to zones.
     * (Still runs over them all frames after, but then doesn't do much.)
     *
     * ALSO runs after N frames to check exit gate conditions in general. This
     * has to happen *somewhere,* so might as well here.
     *
     * Ugh.
     */
    class EnemyZoneChecker extends Engine.System {
        constructor() {
            super(...arguments);
            this.exitCheckFramesRemaining = 5;
            this.componentsRequired = new Set([
                Component.Enemy.name,
                Component.CollisionShape.name,
            ]);
        }
        onClear() {
            this.exitCheckFramesRemaining = 5;
        }
        update(delta, entities) {
            // manual exit check
            if (this.exitCheckFramesRemaining >= 0) {
                if (this.exitCheckFramesRemaining === 0) {
                    let eName = Events.EventTypes.CheckGates;
                    let eArgs = {};
                    this.eventsManager.dispatch({
                        name: eName,
                        args: eArgs,
                    });
                }
                this.exitCheckFramesRemaining--;
            }
            // enemy zone check
            for (let [entity, aspect] of entities.entries()) {
                // zoneChecked computation
                let enemy = aspect.get(Component.Enemy);
                if (enemy.zoneChecked) {
                    continue;
                }
                enemy.zoneChecked = true;
                // finding the gateID (if any) computation
                let cShape = aspect.get(Component.CollisionShape);
                for (let collider of cShape.collisionsFresh.keys()) {
                    let colliderComps = this.ecs.getComponents(collider);
                    if (colliderComps.has(Component.Zone)) {
                        let zone = colliderComps.get(Component.Zone);
                        // enemy might intersect w/ multiple zones. keep the
                        // first one with a non-null gateID.
                        if (zone.gateID != null) {
                            enemy.gateID = zone.gateID;
                            break;
                        }
                    }
                }
            }
        }
    }
    System.EnemyZoneChecker = EnemyZoneChecker;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../core/keyboard.ts" />
/// <reference path="../component/dummy.ts" />
var System;
(function (System) {
    let FadeTarget;
    (function (FadeTarget) {
        /**
         * Shows game.
         */
        FadeTarget[FadeTarget["Reveal"] = 0] = "Reveal";
        /**
         * Black curtain over screen.
         */
        FadeTarget[FadeTarget["Black"] = 1] = "Black";
    })(FadeTarget = System.FadeTarget || (System.FadeTarget = {}));
    /**
     * TODO: use shader instead of graphics object.
     */
    class Fade extends Engine.System {
        constructor(stage, viewportDims) {
            super();
            this.stage = stage;
            this.curAlpha = 0;
            this.inStage = false;
            this.elapsed = -1;
            this.duration = -1;
            this.targetAlpha = -1;
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
            this.curtain = new Stage.Graphics(ZLevelHUD.Curtain, StageTarget.HUD);
            this.curtain.beginFill(0x000000, 1.0);
            this.curtain.drawRect(0, 0, viewportDims.x, viewportDims.y);
            this.curtain.endFill();
            // start game w/ black screen
            this.curtain.alpha = 1;
            this.stage.add(this.curtain);
            this.inStage = true;
        }
        /**
         * API.
         * @param targetAlpha alpha of the CURTAIN: 1.0 = black screen, 0.0 =
         * no curtain.
         */
        request(targetAlpha, duration = 500) {
            this.elapsed = 0;
            this.duration = duration;
            this.targetAlpha = targetAlpha;
            this.curtain.alpha = this.curAlpha;
            if (!this.inStage) {
                this.stage.add(this.curtain);
                this.inStage = true;
            }
        }
        update(delta, entities) {
            // check whether any active tweens
            if (this.duration === -1) {
                return;
            }
            // tick
            this.elapsed += delta;
            // if finished, set final state
            if (this.elapsed >= this.duration) {
                this.curAlpha = this.targetAlpha;
                if (this.curAlpha === 0) {
                    this.stage.remove(this.curtain);
                    this.inStage = false;
                }
                this.elapsed = -1;
                this.duration = -1;
                this.targetAlpha = -1;
                return;
            }
            // otherwise, do the normal tween NOTE: If we want to support
            // partial tweens, or re-tweening from, e.g., 1 to 1 with no
            // visible difference, we need to track the starting alpha value
            // and tween between that and the target alpha.
            let portion = Tween.easeInCubic(this.elapsed, this.duration);
            this.curAlpha = this.targetAlpha === 1 ? portion : 1 - portion;
            this.curtain.alpha = this.curAlpha;
        }
    }
    System.Fade = Fade;
})(System || (System = {}));
/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/animation.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/gui-sprite.ts" />
/// <reference path="../component/tweenable.ts" />
var System;
(function (System) {
    class GUISpriteRendererAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            this.origScale = 1;
        }
    }
    class GUISpriteRenderer extends Engine.System {
        constructor(stage, gameScale, translator) {
            super();
            this.stage = stage;
            this.gameScale = gameScale;
            this.translator = translator;
            this.cachePos = new Point();
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.GUISprite.name,
            ]);
        }
        makeAspect() {
            return new GUISpriteRendererAspect();
        }
        applyScale(aspect) {
            let pos = aspect.get(Component.Position);
            let gs = aspect.get(Component.GUISprite);
            // scale pos
            this.cachePos.copyFrom_(pos.p).scale_(this.gameScale);
            // if the obj is in the world coordinate system, figure out the
            // world coordinates that correspond to the desired HUD coordinates
            if (gs.displayData.stageTarget === StageTarget.World) {
                this.translator.HUDtoWorld(this.cachePos);
            }
            aspect.dobj.position.set(this.cachePos.x, this.cachePos.y);
            aspect.dobj.rotation = angleFlip(pos.angle);
            // fallback scale used when width or height not defined as an
            // override
            let sScale = aspect.origScale * this.gameScale;
            // scale width
            if (gs.baseData.width != null) {
                aspect.dobj.width = gs.baseData.width * this.gameScale;
            }
            else {
                aspect.dobj.scale.x = sScale;
            }
            // scale height
            if (gs.baseData.height != null) {
                aspect.dobj.height = gs.baseData.height * this.gameScale;
            }
            else {
                aspect.dobj.scale.y = sScale;
            }
        }
        onAdd(aspect) {
            // Get component(s).
            let guiSprite = aspect.get(Component.GUISprite);
            // Create resources, save to aspect.
            aspect.dobj = Stage.Animation.build(guiSprite.baseData, guiSprite.displayData);
            aspect.origScale = guiSprite.baseData.scale;
            // Apply game scale-aware changes.
            this.applyScale(aspect);
            // Bookkeep thing to tween ground truth if applicable.
            // NOTE: this seem kind of gross, and there's now an ordered dependence between when the
            // different components are made (tweenable must come first). Can we resolve this with a
            // better design (e.g., not the "groundTruth" on Component.Tweenable?)
            if (aspect.has(Component.Tweenable)) {
                let tweenable = aspect.get(Component.Tweenable);
                tweenable.groundTruth.alpha = aspect.dobj.alpha;
            }
            // Send aspect to stage.
            this.stage.add(aspect.dobj);
        }
        onRemove(aspect) {
            this.stage.remove(aspect.dobj);
        }
        update(delta, entities) {
            for (let aspect of entities.values()) {
                // Copy in latest settings.
                // Game scale-aware mutations.
                this.applyScale(aspect);
                // If this is tweenable, read settings from it.
                if (aspect.has(Component.Tweenable)) {
                    let tweenable = aspect.get(Component.Tweenable);
                    // TODO: this more fully.
                    aspect.dobj.alpha = tweenable.groundTruth.alpha;
                }
                // update the animation always
                aspect.dobj.update(delta);
            }
        }
    }
    __decorate([
        override
    ], GUISpriteRenderer.prototype, "makeAspect", null);
    __decorate([
        override
    ], GUISpriteRenderer.prototype, "onAdd", null);
    __decorate([
        override
    ], GUISpriteRenderer.prototype, "onRemove", null);
    System.GUISpriteRenderer = GUISpriteRenderer;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/gui.ts" />
/// <reference path="delay-speaker.ts" />
/// <reference path="../component/gui-sprite.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/tweenable.ts" />
var System;
(function (System) {
    /**
     * Used to manage GUI entities, safely storing references to them so they
     * can be manipulated with scripts.
     *
     * NOTE: It doesn't appear this should really be a system. We really just
     * want to register for an 'onClear()' call.
     */
    class GUIManager extends Engine.System {
        constructor(guiFile, delaySpeaker) {
            super();
            this.guiFile = guiFile;
            this.delaySpeaker = delaySpeaker;
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
            /**
             * Holds next valid ID to use.
             */
            this.entities = new Map();
            this.destructQueue = [];
        }
        createCommon(assetType, id, overridePos) {
            // create and snag entity
            let entity = this.ecs.addEntity();
            this.entities.set(entity, {
                assetType: assetType,
                id: id,
            });
            // Add position component.
            let startPosSpec = assetType === GUI.AssetType.Sprite ?
                this.guiFile.sprites[id].startPos :
                this.guiFile.text[id].startPos;
            this.ecs.addComponent(entity, GUI.convertPositionSpec(startPosSpec, overridePos));
            // Add tweenable component.
            this.ecs.addComponent(entity, new Component.Tweenable());
            return entity;
        }
        //
        // API
        //
        /**
         * Shortuct to call 'enter' tween on all text and sprite elements of
         * `id` sequence.
         * @param id
         * @param textOverrides map from textID -> override text
         */
        runSequence(id, textOverrides = new Map(), imgOverrides = new Map()) {
            // start txt and sprite tweens, overriding any requested text
            let seq = this.guiFile.sequences[id];
            if (seq == null) {
                throw new Error('Unknown GUI sequence: "' + id + '"');
            }
            let res = [];
            for (let txtID of seq.text) {
                let override = null;
                if (textOverrides.has(txtID)) {
                    override = textOverrides.get(txtID);
                }
                let e = this.createText(txtID, override);
                this.tween(e, 'enter');
                res.push(e);
            }
            for (let spriteID of seq.sprites) {
                let override = null;
                if (imgOverrides.has(spriteID)) {
                    override = imgOverrides.get(spriteID);
                }
                let e = this.createSprite(spriteID, override);
                this.tween(e, 'enter');
                res.push(e);
            }
            return res;
        }
        createText(id, overrideText, overridePos) {
            // get entity (w/ position and tweenable already attached)
            let entity = this.createCommon(GUI.AssetType.Text, id, overridePos);
            // add the text renderable component
            let spec = this.guiFile.text[id];
            this.ecs.addComponent(entity, new Component.TextRenderable(Typography.convertTextSpec(spec.textSpec, overrideText), Anim.convertDisplaySpec(spec.displaySpec)));
            return entity;
        }
        createSprite(id, overrideImg, overridePos) {
            // get entity (w/ position and tweenable already attached)
            let entity = this.createCommon(GUI.AssetType.Sprite, id, overridePos);
            // add the gui sprite component
            let spec = clone(this.guiFile.sprites[id]);
            if (overrideImg != null) {
                spec.baseSpec.base = overrideImg;
            }
            // default to 1 scale here (b/c defaulting pulled out of conversion
            // for animated sprite global scaling)
            if (spec.baseSpec.scale == null) {
                spec.baseSpec.scale = 1;
            }
            this.ecs.addComponent(entity, new Component.GUISprite(spec.baseSpec, spec.displaySpec));
            return entity;
        }
        /**
         * Only for built-in tweens (provided in gui.json).
         */
        tween(entity, tween) {
            // get gui entity
            if (!this.entities.has(entity)) {
                throw new Error('Cannot tween untracked GUI entity: ' + entity);
            }
            ;
            let props = this.entities.get(entity);
            // get the set of tweens
            let tweenMap = props.assetType === GUI.AssetType.Text ?
                this.guiFile.text[props.id].tweens : this.guiFile.sprites[props.id].tweens;
            if (tweenMap[tween] == null) {
                throw new Error('Unknown tween name "' + tween + '" for gui element "' + props.id + '"');
            }
            let tweenSpec = tweenMap[tween];
            // apply
            this.tweenManual(entity, tweenSpec);
        }
        /**
         * Apply custom, engine-generated tween to entity. (Also used as lib
         * function within this class to apply file-specified tween.)
         */
        tweenManual(entity, tweenSpec) {
            let tweenable = this.ecs.getComponents(entity).get(Component.Tweenable);
            // enqueue all visual tweens
            for (let tp of tweenSpec.visuals) {
                tweenable.tweenQueue.push(tp);
            }
            // enqueue all audio effects
            for (let sd of tweenSpec.sounds) {
                this.delaySpeaker.enqueue(sd);
            }
            // If this tween requested destruction at some delay, at that
            // trigger.
            if (tweenSpec.destruct != null) {
                this.destructQueue.push({
                    entity: entity,
                    remaining: tweenSpec.destruct,
                });
            }
        }
        destroy(entity) {
            if (!this.entities.has(entity)) {
                throw new Error('Cannot remove untracked gui element: ' + entity);
            }
            this.entities.delete(entity);
            this.ecs.removeEntity(entity);
        }
        //
        // System stuff
        //
        onClear() {
            this.entities.clear();
            arrayClear(this.destructQueue);
        }
        update(delta, entities) {
            // check for ones that should be destroyed
            for (let i = this.destructQueue.length - 1; i >= 0; i--) {
                // destroy if time limit reached
                if (this.destructQueue[i].remaining <= delta) {
                    this.destroy(this.destructQueue[i].entity);
                    this.destructQueue.splice(i, 1);
                    continue;
                }
                // else just count down
                this.destructQueue[i].remaining -= delta;
            }
        }
    }
    __decorate([
        override
    ], GUIManager.prototype, "onClear", null);
    System.GUIManager = GUIManager;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/immobile.ts" />
/// <reference path="timebomb.ts" />
var System;
(function (System) {
    class Immobile extends System.Timebomb {
        constructor() {
            super(...arguments);
            this.tbComp = Component.Immobile;
            this.componentsRequired = new Set([
                Component.Immobile.name,
            ]);
        }
    }
    System.Immobile = Immobile;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/invincible.ts" />
/// <reference path="timebomb.ts" />
var System;
(function (System) {
    class Invincible extends System.Timebomb {
        constructor() {
            super(...arguments);
            this.tbComp = Component.Invincible;
            this.componentsRequired = new Set([
                Component.Invincible.name,
            ]);
        }
    }
    System.Invincible = Invincible;
})(System || (System = {}));
/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../graphics/lighting.ts" />
/// <reference path="../component/lightbulb.ts" />
var System;
(function (System) {
    class LightingAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            this.dobjs = [];
        }
    }
    /**
     * Illuminates the game.
     */
    class Lighting extends Engine.System {
        constructor(stage, translator, lightingLayer, gamescale) {
            super();
            this.stage = stage;
            this.translator = translator;
            this.lightingLayer = lightingLayer;
            this.gamescale = gamescale;
            // config: texture and scale to render each lightbulb size. note: could
            // also add anchoring config here if we end up using the cone.
            this.sizeTextures = new Map([
                [Graphics.LightbulbSize.Small, ['fx/light128.png', 0.5]],
                [Graphics.LightbulbSize.Medium, ['fx/light256.png', 0.5]],
                [Graphics.LightbulbSize.Large, ['fx/light256.png', 1]],
            ]);
            this.componentsRequired = new Set([
                Component.Lightbulb.name,
                Component.Position.name,
            ]);
        }
        makeAspect() {
            return new LightingAspect();
        }
        onAdd(aspect) {
            // get lightbulb settings
            let lightbulb = aspect.get(Component.Lightbulb);
            // create resources and save to necessary layers.
            for (let config of lightbulb.configs) {
                let [tex, rawScale] = this.sizeTextures.get(config.size);
                let scale = rawScale * this.gamescale;
                let sprite = new Stage.Sprite(PIXI.Texture.fromFrame(tex), ZLevelHUD.Lighting, StageTarget.HUD);
                sprite.scale.set(scale, scale);
                sprite.tint = config.baseTint;
                sprite.anchor.set(0.5, 0.5);
                sprite.alpha = 0.9;
                sprite.parentLayer = this.lightingLayer;
                this.stage.add(sprite);
                aspect.dobjs.push(sprite);
            }
            // set positions correctly so they're right on the first frame
            this.updatePositions(aspect);
        }
        onRemove(aspect) {
            for (let dobj of aspect.dobjs) {
                dobj.parentLayer = null;
                this.stage.remove(dobj);
            }
        }
        updatePositions(aspect) {
            let pos = this.translator.worldToHUD(aspect.get(Component.Position).p);
            for (let dobj of aspect.dobjs) {
                dobj.position.set(pos.x, pos.y);
            }
        }
        updateFlickers(aspect) {
            let configs = aspect.get(Component.Lightbulb).configs;
            for (let i = 0; i < configs.length; i++) {
                // flicker by +/- 0.1 every ~3 frames
                if (configs[i].flicker && Math.random() > 0.66) {
                    let [_, baseScale] = this.sizeTextures.get(configs[i].size);
                    let scale = baseScale + (Math.random() * 0.2 - 0.1);
                    aspect.dobjs[i].scale.set(scale, scale);
                }
            }
        }
        update(delta, entities) {
            for (let aspect of entities.values()) {
                this.updatePositions(aspect);
                this.updateFlickers(aspect);
            }
        }
    }
    __decorate([
        override
    ], Lighting.prototype, "makeAspect", null);
    __decorate([
        override
    ], Lighting.prototype, "onAdd", null);
    __decorate([
        override
    ], Lighting.prototype, "onRemove", null);
    System.Lighting = Lighting;
})(System || (System = {}));
/// <reference path="../../lib/pixi.js.d.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/lockon.ts" />
var System;
(function (System) {
    /**
     * Cleans-up old LockOn Components and renders a marker around the active
     * one. Actual lock-on mechanic is in PlayerInputMouseKeyboard System.
     */
    class LockOn extends Engine.System {
        constructor(stage) {
            super();
            this.stage = stage;
            this.componentsRequired = new Set([
                Component.LockOn.name,
                Component.Position.name,
            ]);
            this.dobj = Stage.Sprite.build('HUD/target1.png', ZLevelWorld.LockOn, StageTarget.World, new Point(), new Point(0.5, 0.5));
            this.dobj.visible = false;
            this.stage.add(this.dobj);
        }
        update(delta, entities) {
            let foundAspect = null;
            // clean up old lockon components. note that we take this
            // opportunity mark the fresh one as not fresh (done every frame).
            for (let [entity, aspect] of entities.entries()) {
                let lockon = aspect.get(Component.LockOn);
                if (lockon.fresh) {
                    // we found the fresh one to use
                    foundAspect = aspect;
                    lockon.fresh = false;
                }
                else {
                    // we found an old one to cleanup
                    this.ecs.removeComponent(entity, Component.LockOn);
                }
            }
            // might be nothing to lockon to. if so, done.
            if (foundAspect == null) {
                this.dobj.visible = false;
                return;
            }
            // if something found, get its position, and then show the target
            // around it.
            let pos = foundAspect.get(Component.Position);
            this.dobj.visible = true;
            this.dobj.position.set(pos.p.x, pos.p.y);
            this.dobj.rotation = angleClamp(this.dobj.rotation + LockOn.ROTATE_DELTA);
        }
    }
    // settings
    /**
     * Amount that lockon graphic rotates per frame, in radians.
     */
    LockOn.ROTATE_DELTA = 0.1;
    System.LockOn = LockOn;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/health.ts" />
var System;
(function (System) {
    class LowHealth extends Engine.System {
        constructor() {
            super(...arguments);
            // settings
            this.runEvery = 3000;
            // state
            this.sinceLast = 0;
            this.componentsRequired = new Set([
                Component.Health.name,
                Component.PlayerInput.name,
            ]);
        }
        update(delta, entities) {
            // determine whether to run
            let run = false;
            for (let aspect of entities.values()) {
                let health = aspect.get(Component.Health);
                if (health.current === 1 && health.current < health.maximum) {
                    run = true;
                    break;
                }
            }
            if (!run) {
                return;
            }
            // run: countdown and then show effect
            this.sinceLast += delta;
            if (this.sinceLast >= this.runEvery) {
                this.ecs.getSystem(System.GUIManager).runSequence('lowHealth');
                this.ecs.getSystem(System.Audio).play(['heartbeat']);
                this.sinceLast = 0;
            }
        }
    }
    System.LowHealth = LowHealth;
})(System || (System = {}));
/// <reference path="../core/keyboard.ts" />
/// <reference path="../engine/ecs.ts" />
var System;
(function (System) {
    class Pause extends Engine.System {
        constructor(keyboard) {
            super(false, true);
            this.keyboard = keyboard;
            // state
            this.prevPause = false;
            this.guiElements = [];
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
        }
        update(delta, entities) {
            // detect new pause button presses to toggle
            let wantPause = this.keyboard.gamekeys.get(GameKey.P).isDown;
            if (wantPause && !this.prevPause) {
                // toggle
                this.ecs.slowMotion.debugPaused = !this.ecs.slowMotion.debugPaused;
                // do gui stuff
                let gui = this.ecs.getSystem(System.GUIManager);
                if (this.ecs.slowMotion.debugPaused) {
                    this.guiElements.push(...gui.runSequence('paused'));
                }
                else {
                    while (this.guiElements.length > 0) {
                        gui.tween(this.guiElements.pop(), 'exit');
                    }
                }
            }
            this.prevPause = wantPause;
        }
    }
    System.Pause = Pause;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/persistent-damage.ts" />
/// <reference path="../component/attack.ts" />
var System;
(function (System) {
    class PersistentDamage extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.PersistentDamage.name,
                Component.CollisionShape.name,
            ]);
            this.dirtyComponents = new Set([
                Component.CollisionShape.name,
            ]);
        }
        onAdd(aspect) {
            // we simply add an attack component onto this same object so it
            // *becomes* the attack as well (mind blown).
            let pd = aspect.get(Component.PersistentDamage);
            this.ecs.addComponent(aspect.entity, new Component.Attack(aspect.entity, pd.attackInfo));
        }
        /**
         * Clear any resolved collisions of the collision box so that the
         * attack can keep damaging stuff forever (in contrast to stuff like
         * swords that don't get to damage things frame after frame).
         */
        update(delta, entities, dirty) {
            for (let entity of dirty) {
                let aspect = entities.get(entity);
                aspect.get(Component.CollisionShape).collisionsResolved.clear();
            }
        }
    }
    __decorate([
        override
    ], PersistentDamage.prototype, "onAdd", null);
    System.PersistentDamage = PersistentDamage;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
var System;
(function (System) {
    class PlayerHUDRendererAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            this.core = [];
            // hearts
            this.hearts = [];
            this.curHealth = 0;
            // board
            this.boardBase = null;
            this.board = null;
            // weapon board
            this.weaponBoardName = null;
            this.weaponBoard = null;
            // sword
            this.swordIconBase = null;
            this.swordIcon = null;
            // bow
            this.bowIcon = null;
            // selector
            this.selectorTarget = 'none';
            this.selector = null;
            // doughnuts
            this.doughnutInactive = null;
            this.doughnutActiveBG = null;
            this.doughnutActiveDoughnut = null;
        }
        /**
         * Removes and nulls everything.
         */
        destroyEverything(gui) {
            // core
            while (this.core.length > 0) {
                gui.destroy(this.core.pop());
            }
            // hearts
            while (this.hearts.length > 0) {
                gui.destroy(this.hearts.pop());
            }
            // board
            if (this.board != null) {
                gui.destroy(this.board);
                this.board = null;
            }
            // weapon board
            if (this.weaponBoardName != null) {
                gui.destroy(this.weaponBoard);
                this.weaponBoard = null;
                this.weaponBoardName = null;
            }
            // sword icon
            if (this.swordIconBase != null) {
                gui.destroy(this.swordIcon);
                this.swordIcon = null;
                this.swordIconBase = null;
            }
            // bow icon
            if (this.bowIcon != null) {
                gui.destroy(this.bowIcon);
                this.bowIcon = null;
            }
            if (this.selector != null) {
                gui.destroy(this.selector);
                this.selector = null;
                this.selectorTarget = 'none';
            }
            // doughnut
            this.destroyInactiveDoughnut(gui);
            this.destroyActiveDoughnut(gui);
        }
        destroyInactiveDoughnut(gui) {
            if (this.doughnutInactive != null) {
                gui.destroy(this.doughnutInactive);
                this.doughnutInactive = null;
            }
        }
        destroyActiveDoughnut(gui) {
            if (this.doughnutActiveBG != null) {
                gui.destroy(this.doughnutActiveBG);
                this.doughnutActiveBG = null;
            }
            if (this.doughnutActiveDoughnut != null) {
                gui.destroy(this.doughnutActiveDoughnut);
                this.doughnutActiveDoughnut = null;
            }
        }
    }
    function getBoardBase(maxHP) {
        switch (maxHP) {
            case 3:
                return 'HUD/playerHUDBoard3Hearts';
            case 4:
                return 'HUD/playerHUDBoard4Hearts';
            case 5:
                return 'HUD/playerHUDBoard5Hearts';
            default:
                return 'HUD/PlayerHUDv3Board';
        }
    }
    /**
     * Gets the weapon backing board that should be displayed based on the
     * weapons the player has.
     */
    function getWeaponBoardName(aspect) {
        if (!aspect.has(Component.Armed)) {
            return null;
        }
        let armed = aspect.get(Component.Armed);
        switch (armed.inventory.length) {
            case 0:
                return null;
            case 1:
                return 'playerHUDBoardSword';
            case 2:
                return 'playerHUDBoardBow';
            default:
                // if > 2 for some reason, just use the sword + bow one
                return 'playerHUDBoardBow';
        }
    }
    /**
     * Returns sword asset to be displayed in weapon indicator (hot swapped as
     * gui asset)
     */
    function getSwordIconBase(aspect) {
        if (!aspect.has(Component.Armed)) {
            return null;
        }
        let armed = aspect.get(Component.Armed);
        // we know sword weapons based on their combo
        for (let weapon of armed.inventory) {
            if (weapon.comboAttack != null) {
                if (weapon.comboAttack.damage == 2) {
                    return 'HUD/hudStab';
                }
                else if (weapon.comboAttack.damage == 3) {
                    return 'HUD/hudAOE';
                }
                // otherwise unk combo, just continue
            }
        }
        // no combo; return base
        return 'HUD/hudSword';
    }
    /**
     * Returns whether to display the bow icon.
     */
    function getDisplayBowAndSelector(aspect) {
        return aspect.has(Component.Armed) && aspect.get(Component.Armed).inventory.length > 1;
    }
    /**
     * Returns where the selector should be pointing (including 'none' for "it
     * shouldn't exist").
     */
    function getSelectorTarget(aspect) {
        if (!getDisplayBowAndSelector(aspect)) {
            return 'none';
        }
        return aspect.get(Component.Armed).active.comboAttack == null ? 'bow' : 'sword';
    }
    function getSelectorY(target) {
        // only valid here are 'bow' and 'sword', but we'll do a 0 default
        // because why not.
        switch (target) {
            case 'sword':
                return 59;
            case 'bow':
                return 96;
            default:
                return 0;
        }
    }
    function buildSelectorTween(y) {
        return {
            visuals: [{
                    prop: 'y',
                    spec: {
                        valType: 'abs',
                        val: y,
                        duration: 500,
                        method: 'easeOutCubic',
                        delay: 0,
                    }
                }],
            sounds: [],
        };
    }
    class PlayerHUDRenderer extends Engine.System {
        constructor() {
            // start disabled (!) until we finish the start script stuff
            super(true);
            this.coreSpriteIDs = [
                'playerHUDFrameBG',
                'playerHUDFrame',
                'playerHUDPortrait',
            ];
            this.componentsRequired = new Set([
                Component.Health.name,
                Component.PlayerInput.name,
            ]);
        }
        makeAspect() {
            return new PlayerHUDRendererAspect();
        }
        onDisabled(entities) {
            let gui = this.ecs.getSystem(System.GUIManager);
            for (let aspect of entities.values()) {
                aspect.destroyEverything(gui);
            }
        }
        onRemove(aspect) {
            aspect.destroyEverything(this.ecs.getSystem(System.GUIManager));
        }
        ensureCore(aspect) {
            // assuming we either have all or none
            if (aspect.core.length == this.coreSpriteIDs.length) {
                return;
            }
            let gui = this.ecs.getSystem(System.GUIManager);
            for (let sid of this.coreSpriteIDs) {
                aspect.core.push(gui.createSprite(sid));
            }
        }
        updateBoard(aspect) {
            let gui = this.ecs.getSystem(System.GUIManager);
            // see whether replacement necessary
            let health = aspect.get(Component.Health);
            let bb = getBoardBase(health.maximum);
            if (bb === aspect.boardBase) {
                return;
            }
            // replace
            if (aspect.board != null) {
                gui.destroy(aspect.board);
            }
            aspect.board = gui.createSprite('playerHUDBoard', bb);
            aspect.boardBase = bb;
        }
        updateWeaponBoard(aspect) {
            let gui = this.ecs.getSystem(System.GUIManager);
            let boardName = getWeaponBoardName(aspect);
            if (boardName != aspect.weaponBoardName) {
                // remove if exists
                if (aspect.weaponBoardName != null) {
                    gui.destroy(aspect.weaponBoard);
                }
                // update with new one
                aspect.weaponBoardName = boardName;
                if (boardName == null) {
                    aspect.weaponBoard = null;
                }
                else {
                    aspect.weaponBoard = gui.createSprite(boardName);
                }
            }
        }
        updateWeaponIcons(aspect) {
            let gui = this.ecs.getSystem(System.GUIManager);
            // update sword
            let swordIconBase = getSwordIconBase(aspect);
            if (swordIconBase != aspect.swordIconBase) {
                // remove if exists
                if (aspect.swordIconBase != null) {
                    gui.destroy(aspect.swordIcon);
                }
                // update with new one
                aspect.swordIconBase = swordIconBase;
                if (swordIconBase == null) {
                    aspect.swordIcon = null;
                }
                else {
                    aspect.swordIcon = gui.createSprite('playerHUDSwordIcon', swordIconBase);
                }
            }
            // update bow
            if (getDisplayBowAndSelector(aspect)) {
                // ensure bow displayed
                if (aspect.bowIcon == null) {
                    aspect.bowIcon = gui.createSprite('playerHUDBowIcon');
                }
            }
            else {
                // don't want bow displayed; remove if it's there
                if (aspect.bowIcon != null) {
                    gui.destroy(aspect.bowIcon);
                    aspect.bowIcon = null;
                }
            }
        }
        updateSelector(aspect) {
            let gui = this.ecs.getSystem(System.GUIManager);
            let target = getSelectorTarget(aspect);
            if (target == 'none') {
                // no selector wanted; ensure it's gone
                if (aspect.selector != null) {
                    gui.destroy(aspect.selector);
                    aspect.selector = null;
                    aspect.selectorTarget = target;
                }
                return;
            }
            // we want a selector. ensure it exists. if we simply create it, we
            // put it in the right place immediately and don't do any tweening.
            if (aspect.selector == null) {
                aspect.selector = gui.createSprite('playerHUDWeaponSelector', null, new Point(6, getSelectorY(target)));
                aspect.selectorTarget = target;
                return;
            }
            // at this point, we want a selector and we already have one. now
            // we just do a tween if the target has changed.
            if (aspect.selectorTarget != target) {
                gui.tweenManual(aspect.selector, buildSelectorTween(getSelectorY(target)));
                aspect.selectorTarget = target;
            }
        }
        updateHearts(aspect) {
            let gui = this.ecs.getSystem(System.GUIManager);
            let health = aspect.get(Component.Health);
            // replace with 'off' hearts, as needed
            while (health.current < aspect.curHealth) {
                let i = aspect.curHealth - 1;
                gui.destroy(aspect.hearts[i]);
                aspect.hearts[i] = gui.createSprite('playerHUDHeartOff', null, new Point(55 + i * 17.5, 9));
                aspect.curHealth--;
            }
            // replace with 'on' hearts, as needed
            while (health.current > aspect.curHealth) {
                let i = aspect.curHealth;
                if (aspect.hearts[i] != null) {
                    gui.destroy(aspect.hearts[i]);
                }
                aspect.hearts[i] = gui.createSprite('playerHUDHeartOn', null, new Point(55 + i * 17.5, 9));
                aspect.curHealth++;
            }
        }
        getDoughnutAcquired() {
            return this.ecs.getSystem(System.Bookkeeper).getSecretFound();
        }
        updateDoughnut(aspect) {
            let gui = this.ecs.getSystem(System.GUIManager);
            let acquired = this.getDoughnutAcquired();
            if (!acquired) {
                // want only inactive thing displayed.
                // remove any active indicators
                aspect.destroyActiveDoughnut(gui);
                // create the inactive thing if necessary
                if (aspect.doughnutInactive == null) {
                    aspect.doughnutInactive = gui.createSprite('playerHUDDoughnutInactive');
                }
            }
            else {
                // want active things displayed;
                // remoave any inactive indicator
                aspect.destroyInactiveDoughnut(gui);
                // create active indicators
                if (aspect.doughnutActiveBG == null) {
                    aspect.doughnutActiveBG = gui.createSprite('playerHUDDoughnutActiveBG');
                }
                if (aspect.doughnutActiveDoughnut == null) {
                    aspect.doughnutActiveDoughnut = gui.createSprite('playerHUDDoughnutActiveDoughnut');
                }
            }
        }
        update(delta, entities) {
            for (let aspect of entities.values()) {
                this.ensureCore(aspect);
                this.updateBoard(aspect);
                this.updateHearts(aspect);
                this.updateWeaponBoard(aspect);
                this.updateWeaponIcons(aspect);
                this.updateSelector(aspect);
                this.updateDoughnut(aspect);
            }
        }
    }
    __decorate([
        override
    ], PlayerHUDRenderer.prototype, "makeAspect", null);
    __decorate([
        override
    ], PlayerHUDRenderer.prototype, "onDisabled", null);
    __decorate([
        override
    ], PlayerHUDRenderer.prototype, "onRemove", null);
    System.PlayerHUDRenderer = PlayerHUDRenderer;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/recoil.ts" />
/// <reference path="timebomb.ts" />
var System;
(function (System) {
    class Recoil extends System.Timebomb {
        constructor() {
            super(...arguments);
            this.tbComp = Component.Recoil;
            this.componentsRequired = new Set([
                Component.Recoil.name,
            ]);
        }
    }
    System.Recoil = Recoil;
})(System || (System = {}));
/// <reference path="../component/audible.ts" />
var System;
(function (System) {
    class SoundsFootstepsAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            this.lastHandledFrame = -1;
        }
    }
    class SoundsFootsteps extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Activity.name,
                Component.Audible.name,
                Component.Animatable.name,
                Component.AnimationTickable.name,
                Component.Position.name,
            ]);
        }
        makeAspect() {
            return new SoundsFootstepsAspect();
        }
        update(delta, entities) {
            for (let [entity, aspect] of entities.entries()) {
                let position = aspect.get(Component.Position);
                let activity = aspect.get(Component.Activity);
                let anim = aspect.get(Component.Animatable);
                let audible = aspect.get(Component.Audible);
                // we only handle movements
                if (activity.action !== Action.Moving) {
                    aspect.lastHandledFrame = -1;
                    continue;
                }
                // we only handle move sounds
                if (audible.sounds.move == null) {
                    continue;
                }
                // In the future, we'll detect surface. Just using default for
                // now.
                let surface = audible.sounds.move.default;
                if (surface == null) {
                    continue;
                }
                // Check whether the current frame matches a sound.
                if (surface.emitOnFrames.indexOf(anim.coreFrame) === -1) {
                    // Resetting lets you play on the original frame again.
                    aspect.lastHandledFrame = -1;
                    continue;
                }
                // don't play the same frame's sound multiple times
                if (aspect.lastHandledFrame === anim.coreFrame) {
                    continue;
                }
                // play and update the frame
                this.ecs.getSystem(System.Audio).play(surface.sounds, position.p);
                aspect.lastHandledFrame = anim.coreFrame;
            }
        }
    }
    __decorate([
        override
    ], SoundsFootsteps.prototype, "makeAspect", null);
    System.SoundsFootsteps = SoundsFootsteps;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/sparkle.ts" />
var System;
(function (System) {
    class SparkleAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            this.sparkle = null;
        }
    }
    class Sparkle extends Engine.System {
        constructor(gm) {
            super();
            this.gm = gm;
            this.componentsRequired = new Set([
                Component.Sparkle.name,
                Component.Position.name,
            ]);
            this.dirtyComponents = new Set([
                Component.Dead.name,
            ]);
            this.layer = 'fxSparkle';
        }
        makeAspect() {
            return new SparkleAspect();
        }
        onAdd(aspect) {
            let pos = aspect.get(Component.Position);
            let s = this.gm.produce(this.layer, {
                height: 1,
                width: 1,
                rotation: Constants.RAD2DEG * angleFlip(pos.angle),
                x: pos.p.x,
                y: pos.p.y,
            });
            this.ecs.addComponent(s, new Component.Tracker(aspect.entity));
            aspect.sparkle = s;
        }
        update(delta, entities, dirty) {
            // if the thing sparkling is "dead" (e.g., item picked up), remove
            // the sparkle.
            for (let e of dirty) {
                let aspect = entities.get(e);
                let sparkleAnim = this.ecs.getComponents(aspect.sparkle).get(Component.Animatable);
                sparkleAnim.visible = !aspect.has(Component.Dead);
            }
        }
    }
    __decorate([
        override
    ], Sparkle.prototype, "makeAspect", null);
    __decorate([
        override
    ], Sparkle.prototype, "onAdd", null);
    System.Sparkle = Sparkle;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/collision-shape.ts" />
var System;
(function (System) {
    const GRID_SIZE = 100;
    function renderCell(cell) {
        return cell.x + ',' + cell.y;
    }
    function coordToCell(p) {
        return new Point(Math.floor(p.x / GRID_SIZE) * GRID_SIZE, Math.floor(p.y / GRID_SIZE) * GRID_SIZE);
    }
    function getBoxCells(p, cShape) {
        let res = [];
        let min = p.copy().addScalar_(-cShape.maxDistance);
        let max = p.copy().addScalar_(cShape.maxDistance);
        let minCell = coordToCell(min);
        for (let x = minCell.x; x <= max.x; x += GRID_SIZE) {
            for (let y = minCell.y; y <= max.y; y += GRID_SIZE) {
                res.push(renderCell(new Point(x, y)));
            }
        }
        return res;
    }
    function getPointCell(p) {
        return renderCell(coordToCell(p));
    }
    System.getPointCell = getPointCell;
    class SpatialHashAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            this.lastPoint = new Point(-Infinity, -Infinity);
            this.lastAngle = Infinity;
        }
    }
    class SpatialHash extends Engine.System {
        constructor() {
            super(...arguments);
            this.grid = new Map();
            this.componentsRequired = new Set([
                Component.Position.name,
            ]);
            this.dirtyComponents = new Set([
                Component.Position.name,
            ]);
        }
        onAdd(aspect) {
            this.recomputeCells(aspect);
        }
        makeAspect() {
            return new SpatialHashAspect();
        }
        onRemove(aspect) {
            // remove from any previous cells
            let pos = aspect.get(Component.Position);
            while (pos.cells.length > 0) {
                this.grid.get(pos.cells.pop()).delete(aspect.entity);
            }
        }
        recomputeCells(aspect) {
            let pos = aspect.get(Component.Position);
            // remove from any previous cells
            while (pos.cells.length > 0) {
                this.grid.get(pos.cells.pop()).delete(aspect.entity);
            }
            // get current cells
            let cells;
            if (aspect.has(Component.CollisionShape)) {
                cells = getBoxCells(pos.p, aspect.get(Component.CollisionShape));
            }
            else {
                cells = [getPointCell(pos.p)];
            }
            // add to new cells
            for (let cell of cells) {
                if (!this.grid.has(cell)) {
                    this.grid.set(cell, new Set());
                }
                this.grid.get(cell).add(aspect.entity);
            }
            pos.cells = cells;
            aspect.lastPoint.copyFrom_(pos.p);
            aspect.lastAngle = pos.angle;
        }
        update(delta, entities, dirtyEntities) {
            for (let entity of dirtyEntities.values()) {
                if (entity == null) {
                    throw new Error('WTF');
                }
                let aspect = entities.get(entity);
                if (aspect == null) {
                    throw new Error('WTF2');
                }
                this.recomputeCells(aspect);
            }
        }
    }
    __decorate([
        override
    ], SpatialHash.prototype, "onAdd", null);
    __decorate([
        override
    ], SpatialHash.prototype, "makeAspect", null);
    __decorate([
        override
    ], SpatialHash.prototype, "onRemove", null);
    System.SpatialHash = SpatialHash;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
/// <reference path="../component/stagger-return.ts" />
/// <reference path="timebomb.ts" />
var System;
(function (System) {
    class StaggerReturn extends System.Timebomb {
        constructor() {
            super(...arguments);
            this.tbComp = Component.StaggerReturn;
            this.componentsRequired = new Set([
                Component.StaggerReturn.name,
            ]);
        }
    }
    System.StaggerReturn = StaggerReturn;
})(System || (System = {}));
/// <reference path="../core/lang.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/gui.ts" />
/// <reference path="../component/position.ts" />
/// <reference path="../component/tweenable.ts" />
var System;
(function (System) {
    class TweenerAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            this.waitingTweens = [];
            this.activeTweens = new Map();
        }
    }
    class Tweener extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.Tweenable.name,
            ]);
        }
        makeAspect() {
            return new TweenerAspect();
        }
        getVal(aspect, prop) {
            // position is special because we always use the component as a
            // ground truth. simply set it there.
            if (prop === 'y' || prop === 'x' || prop === 'angle') {
                let pos = aspect.get(Component.Position);
                if (prop === 'y') {
                    return pos.p.y;
                }
                else if (prop === 'x') {
                    return pos.p.x;
                }
                else if (prop === 'angle') {
                    return pos.angle;
                }
            }
            // otherwise, get from groundTruth map
            let tweenable = aspect.get(Component.Tweenable);
            return tweenable.groundTruth[prop];
        }
        setVal(aspect, prop, val) {
            // position is special because we always use the component as a
            // ground truth. simply set it there.
            if (prop === 'y' || prop === 'x' || prop === 'angle') {
                let pos = aspect.get(Component.Position);
                if (prop === 'y') {
                    pos.setY(val);
                }
                else if (prop === 'x') {
                    pos.setX(val);
                }
                else if (prop === 'angle') {
                    pos.angle = val;
                }
                return;
            }
            // it's a non-position prop: use the groundTruth map instead.
            let tweenable = aspect.get(Component.Tweenable);
            tweenable.groundTruth[prop] = val;
        }
        activate(aspect, tweenable, tweenPackage) {
            // convert TweenOptionsSepc to TweenState
            let start = this.getVal(aspect, tweenPackage.prop);
            // note that when extracting the number, we may have to convert
            // from a hex string if it's a color.
            let specVal = -1;
            if (typeof tweenPackage.spec.val === 'string') {
                specVal = parseInt(tweenPackage.spec.val.slice(1), 16);
            }
            else {
                specVal = tweenPackage.spec.val;
            }
            let target = tweenPackage.spec.valType === 'abs' ?
                specVal : start + specVal;
            // include some sanity checks
            let method = Tween.methods[tweenPackage.spec.method];
            if (method === null) {
                throw new Error('Unrecognized tween method: "' + tweenPackage.spec.method + '"');
            }
            if (tweenPackage.spec.duration <= -2) {
                throw new Error('Bad tween duration: "' + tweenPackage.spec.duration + '"');
            }
            let state = {
                start: start,
                target: target,
                elapsed: 0,
                duration: tweenPackage.spec.duration,
                period: tweenPackage.spec.period,
                method: method,
            };
            aspect.activeTweens.set(tweenPackage.prop, state);
        }
        update(delta, entities) {
            for (let aspect of entities.values()) {
                // NOTE: eventually do lifetime checking for auto-destruction
                // (is this the place? just use timebomb?)
                let tweenable = aspect.get(Component.Tweenable);
                // Nuclear flag: clear just says "destroy all tweens". Easy
                // enough.
                if (tweenable.clear) {
                    arrayClear(aspect.waitingTweens);
                    aspect.activeTweens.clear();
                    tweenable.clear = false;
                    // NOTE: we keep going so we can accept new tweens
                }
                // progress active tweens
                let deleteProps = [];
                for (let [prop, state] of aspect.activeTweens.entries()) {
                    // tick
                    state.elapsed += delta;
                    // check for finished
                    if (state.duration != Tween.Infinite && state.elapsed > state.duration) {
                        this.setVal(aspect, prop, state.target);
                        deleteProps.push(prop);
                        continue;
                    }
                    // otherwise, compute and set prop val
                    let portion = state.method(state.elapsed, state.duration, state.period);
                    this.setVal(aspect, prop, state.start + portion * (state.target - state.start));
                }
                // clean up finished tweens
                while (deleteProps.length > 0) {
                    aspect.activeTweens.delete(deleteProps.pop());
                }
                // drain the queue and send to the wait list
                while (tweenable.tweenQueue.length > 0) {
                    aspect.waitingTweens.push(clone(tweenable.tweenQueue.pop()));
                }
                // progress wait list forward until something is ready to go.
                for (let i = aspect.waitingTweens.length - 1; i >= 0; i--) {
                    let tp = aspect.waitingTweens[i];
                    if (tp.spec.delay == null || tp.spec.delay < delta) {
                        // no wait or ready: remove from waiting list.
                        this.activate(aspect, tweenable, tp);
                        aspect.waitingTweens.splice(i, 1);
                    }
                    else {
                        // tick delay down;
                        tp.spec.delay -= delta;
                    }
                }
            }
        }
    }
    __decorate([
        override
    ], Tweener.prototype, "makeAspect", null);
    System.Tweener = Tweener;
})(System || (System = {}));
/// <reference path="../engine/ecs.ts" />
var System;
(function (System) {
    /**
     * NOTE: This is another "non-System System" that doesn't need to track
     * entities or components, but wants to run every frame sometimes. I guess
     * it's really a script. But making scripts from arbitrary locations is
     * annoying because they can't have access to stuff (like the world stage)
     * that they need.
     *
     * Is there a better way to federate access to global resources that aren't
     * component-like?
     */
    class Zoom extends Engine.System {
        constructor(stage, defaultZoom) {
            super();
            this.stage = stage;
            this.defaultZoom = defaultZoom;
            this.active = null;
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
        }
        onClear() {
            this.stage.scale.set(this.defaultZoom, this.defaultZoom);
            this.active = null;
        }
        /**
         * Request a zoom at `scale` across `duration` using `method`. No need
         * to think about different game zoom levels; that's taken care of
         * within this.
         * @param scale
         * @param duration
         * @param method
         * @param period optional: for insane zoooms that involve periods
         */
        request(scale, duration, method, period) {
            let current = this.stage.scale.x;
            let target = scale * this.defaultZoom;
            this.active = {
                startScale: current,
                targetScale: target,
                elapsed: 0,
                duration: duration,
                period: period,
                method: method,
            };
        }
        update(delta, entities) {
            // nothing to do if no active zoom
            if (this.active == null) {
                return;
            }
            // tick forward
            this.active.elapsed += delta;
            // maybe remove
            if (this.active.elapsed >= this.active.duration) {
                this.stage.scale.set(this.active.targetScale, this.active.targetScale);
                this.active = null;
                return;
            }
            // otherwise, pick new level based on tween
            let portion = this.active.method(this.active.elapsed, this.active.duration, this.active.period);
            let current = this.active.startScale + portion * (this.active.targetScale - this.active.startScale);
            this.stage.scale.set(current, current);
        }
    }
    __decorate([
        override
    ], Zoom.prototype, "onClear", null);
    System.Zoom = Zoom;
})(System || (System = {}));
