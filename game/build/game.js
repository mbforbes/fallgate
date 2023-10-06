var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Constants;
(function (Constants) {
    Constants.HALF_PI = 0.5 * Math.PI;
    Constants.TWO_PI = 2 * Math.PI;
    Constants.RAD2DEG = 180 / Math.PI;
    Constants.DEG2RAD = Math.PI / 180;
})(Constants || (Constants = {}));
function round(num, places = 2) {
    let d = Math.pow(10, places);
    return Math.round(num * d) / d;
}
function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function angleClamp(angle) {
    angle %= Constants.TWO_PI;
    if (angle < 0) {
        angle += Constants.TWO_PI;
    }
    return angle;
}
function angleFlip(angle) {
    return angleClamp(-angle);
}
function sortNumeric(a, b) {
    return a - b;
}
class Point {
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
    constructor(_x = 0, _y = 0) {
        this._x = _x;
        this._y = _y;
    }
    static from(array) {
        return new Point(array[0], array[1]);
    }
    manhattanTo(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return Math.abs(dx) + Math.abs(dy);
    }
    sqDistTo(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return dx * dx + dy * dy;
    }
    distTo(other) {
        return Math.sqrt(this.sqDistTo(other));
    }
    angleTo(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return angleClamp(Math.atan2(dy, dx));
    }
    pixiAngleTo(other) {
        const dx = other.x - this.x;
        const dy = -(other.y - this.y);
        return angleClamp(Math.atan2(dy, dx));
    }
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
    l2Squared() {
        return this.dot(this);
    }
    l2() {
        return Math.sqrt(this.l2Squared());
    }
    scale_(alpha) {
        this.x *= alpha;
        this.y *= alpha;
        return this;
    }
    clampEach_(min, max) {
        this.x = Math.min(Math.max(this.x, min), max);
        this.y = Math.min(Math.max(this.y, min), max);
        return this;
    }
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
    add_(other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }
    addScalar_(s) {
        this.x += s;
        this.y += s;
        return this;
    }
    subNew(other) {
        let res = new Point();
        this.sub(other, res);
        return res;
    }
    sub(other, out) {
        out.x = this.x - other.x;
        out.y = this.y - other.y;
    }
    copy() {
        return new Point(this.x, this.y);
    }
    copyTo(other) {
        other.x = this.x;
        other.y = this.y;
    }
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
var Game;
(function (Game) {
    let Mode;
    (function (Mode) {
        Mode[Mode["DEBUG"] = 0] = "DEBUG";
        Mode[Mode["RELEASE"] = 1] = "RELEASE";
    })(Mode = Game.Mode || (Game.Mode = {}));
})(Game || (Game = {}));
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
        this.register(new GameKey(GameKey.Enter, 'Enter', true));
        this.register(new GameKey(GameKey.Space, ' '));
        this.register(new GameKey(GameKey.ShiftLeft, 'Shift'));
        this.register(new GameKey(GameKey.W, 'w'));
        this.register(new GameKey(GameKey.S, 's'));
        this.register(new GameKey(GameKey.A, 'a'));
        this.register(new GameKey(GameKey.D, 'd'));
        this.register(new GameKey(GameKey.E, 'e'));
        this.register(new GameKey(GameKey.P, 'p'));
        this.register(new GameKey(GameKey.Digit1));
        this.register(new GameKey(GameKey.Digit2));
        this.register(new GameKey(GameKey.Digit3));
        this.register(new GameKey(GameKey.Digit4));
        this.register(new GameKey(GameKey.J, 'j'));
        this.register(new GameKey(GameKey.N));
        this.register(new GameKey(GameKey.B));
        this.register(new GameKey(GameKey.Equal));
        this.register(new GameKey(GameKey.Minus));
        this.register(new GameKey(GameKey.Left));
        this.register(new GameKey(GameKey.Right));
        this.register(new GameKey(GameKey.Up));
        this.register(new GameKey(GameKey.Down));
    }
    getCode(event) {
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
        let code = this.getCode(event);
        if (this.gamekeys.has(code)) {
            let key = this.gamekeys.get(code);
            if (key.menu && !key.isDown) {
                this.eventsManager.dispatch({
                    name: Events.EventTypes.MenuKeypress,
                    args: { key: key.code },
                });
            }
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
class GameKey {
    constructor(code, key = null, menu = false) {
        this.code = code;
        this.key = key;
        this.menu = menu;
        this.isDown = false;
    }
}
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
        let d = document;
        if (d.fullscreenElement || d.webkitFullscreenElement) {
            let gameRatio = this.resolution.x / this.resolution.y;
            let screenRatio = screen.width / screen.height;
            let heightLimiting = screenRatio >= gameRatio;
            let scaleFactor = 1;
            let offsetX = 0;
            let offsetY = 0;
            if (heightLimiting) {
                scaleFactor = screen.height / this.resolution.y;
                let scaleWidth = scaleFactor * this.resolution.x;
                offsetX = Math.max(0, (screen.width - scaleWidth) / 2) / scaleFactor;
            }
            else {
                scaleFactor = screen.width / this.resolution.x;
                let scaleHeight = scaleFactor * this.resolution.y;
                offsetY = Math.max(0, (screen.height - scaleHeight) / 2) / scaleFactor;
            }
            this.hudPosition.set(-offsetX + event.pageX / scaleFactor, -offsetY + event.pageY / scaleFactor);
        }
        else {
            this.hudPosition.set(event.offsetX, event.offsetY);
        }
    }
}
function setContains(a, b) {
    for (let want of b) {
        if (!a.has(want)) {
            return false;
        }
    }
    return true;
}
function setClone(source, dest) {
    dest.clear();
    for (let v of source) {
        dest.add(v);
    }
}
function setString(s, func) {
    let res = [];
    for (let el of s) {
        res.push(func(el));
    }
    return res.join(', ');
}
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
function objOverride(base, extension, property) {
    if (extension[property] == null) {
        return;
    }
    if (base[property] == null) {
        base[property] = extension[property];
        return;
    }
    for (let key in extension[property]) {
        base[property][key] = extension[property][key];
    }
}
function objToMap(obj) {
    let res = new Map();
    for (let key in obj) {
        res.set(key, obj[key]);
    }
    return res;
}
function mapString(m, keyFunc, valFunc) {
    let res = [];
    for (let key of m.keys()) {
        res.push(keyFunc(key) + ' (' + valFunc(m.get(key)) + ')');
    }
    return res.join(', ');
}
function mapKeyString(m) {
    return mapKeyArr(m).join(', ');
}
function mapAdd(m, other) {
    for (let [key, val] of other.entries()) {
        m.set(key, val);
    }
}
function mapClone(source, dest) {
    dest.clear();
    for (let [key, val] of source.entries()) {
        dest.set(key, val);
    }
}
function mapKeyArr(m) {
    let res = [];
    for (let key of m.keys()) {
        res.push(key);
    }
    return res;
}
function arrayClear(arr) {
    while (arr.length > 0) {
        arr.pop();
    }
}
function arrayCopy(array) {
    let res = new Array();
    for (let el of array) {
        res.push(el);
    }
    return res;
}
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
function enumSortedNames(e) {
    let nums = enumSortedVals(e);
    let names = [];
    for (let num of nums) {
        names.push(e[num]);
    }
    return names;
}
function msToUserTime(ms) {
    let full_s = ms / 1000;
    let m = Math.floor(full_s / 60);
    let s = (full_s % 60).toFixed(3);
    let mStr = m > 0 ? m + 'm ' : '';
    return mStr + s + 's';
}
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
var Events;
(function (Events) {
    class Firer {
        constructor(manager) {
            this.manager = manager;
        }
        dispatch(pkg, delay = 0) {
            this.manager.dispatch(pkg, delay);
        }
    }
    Events.Firer = Firer;
    class Manager {
        constructor() {
            this.multiplexer = new Map();
            this.handlers = new Array();
            this.queue = new Array();
            this.toRemove = new Array();
            this.firer = new Firer(this);
        }
        dispatch(pkg, delay = 0) {
            this.queue.push({ pkg: pkg, remaining: delay });
        }
        init(ecs, scriptRunner) {
            this.ecs = ecs;
            this.scriptRunner = scriptRunner;
        }
        add(handler) {
            handler.init(this.ecs, this.scriptRunner, this.firer);
            for (let et of handler.eventsHandled()) {
                this.register(et, handler);
            }
            this.handlers.push(handler);
        }
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
        update(delta) {
            for (let i = this.queue.length - 1; i >= 0; i--) {
                this.queue[i].remaining -= delta;
                if (this.queue[i].remaining <= 0) {
                    this.publish(this.queue[i].pkg);
                    this.queue.splice(i, 1);
                }
            }
            for (let handler of this.handlers) {
                handler.update();
                if (handler.finished) {
                    this.toRemove.push(handler);
                }
            }
            while (this.toRemove.length > 0) {
                this.remove(this.toRemove.pop());
            }
        }
        publish(pkg) {
            if (!this.multiplexer.has(pkg.name)) {
                return;
            }
            for (let handler of this.multiplexer.get(pkg.name)) {
                handler.push(pkg);
            }
        }
        remove(handler) {
            for (let et of handler.eventsHandled()) {
                this.deregister(et, handler);
            }
            this.handlers.splice(this.handlers.indexOf(handler), 1);
        }
        deregister(et, handler) {
            let hs = this.multiplexer.get(et);
            hs.splice(hs.indexOf(handler), 1);
        }
        register(et, handler) {
            if (!this.multiplexer.has(et)) {
                this.multiplexer.set(et, []);
            }
            this.multiplexer.get(et).push(handler);
        }
    }
    Events.Manager = Manager;
    class Handler {
        constructor() {
            this.incoming = new Array();
            this.finished = false;
            this.transient = false;
        }
        setup() { }
        clear() { }
        init(ecs, scriptRunner, firer) {
            this.ecs = ecs;
            this.scriptRunner = scriptRunner;
            this.firer = firer;
            this.setup();
        }
        eventsHandled() {
            return this.dispatcher.keys();
        }
        push(pkg) {
            this.incoming.push(pkg);
        }
        update() {
            while (this.incoming.length > 0) {
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
    class SlowMotion {
        constructor() {
            this.active = new Array();
            this.frameIdx = 0;
            this.debugPaused = false;
            this.debugFactor = 1;
        }
        request(factor, duration) {
            this.active.push({ remaining: duration, factor: factor });
        }
        update(delta) {
            if (this.debugPaused) {
                return 0;
            }
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
            largest = Math.max(largest, this.debugFactor);
            this.frameIdx = (this.frameIdx + 1) % largest;
            return this.frameIdx == 0 ? delta : 0;
        }
    }
    Engine.SlowMotion = SlowMotion;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    class ComponentContainer {
        constructor() {
            this.rawMap = new Map();
            this.rawKeys = new Set();
            this.rawSortedKeys = new Array();
        }
        add(component) {
            let name = component.name;
            if (this.rawMap.has(name)) {
                throw new Error('Can\'t add component "' + name + '"; already exists.');
            }
            this.rawMap.set(name, component);
            this.rawKeys.add(name);
            this.rawSortedKeys.push(name);
            this.rawSortedKeys.sort();
        }
        delete(c) {
            if (!this.rawMap.has(c.name)) {
                throw new Error('Can\'t delete component "' + c.name + '"; doesn\'t exist.');
            }
            this.rawMap.delete(c.name);
            this.rawKeys.delete(c.name);
            this.rawSortedKeys.splice(this.rawSortedKeys.indexOf(c.name), 1);
        }
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
    class ComponentViewer {
        constructor(cc) {
            this.cc = cc;
        }
        get(c) {
            return this.cc.get(c);
        }
        has(...cs) {
            return this.cc.has(...cs);
        }
    }
    Engine.ComponentViewer = ComponentViewer;
    class ECS {
        get gametime() {
            return this._gametime;
        }
        get walltime() {
            return this._walltime;
        }
        constructor(eventsManager) {
            this.eventsManager = eventsManager;
            this.slowMotion = new Engine.SlowMotion();
            this.nextEntityID = 0;
            this.entities = new Map();
            this.systems = new Map();
            this.entitiesToDestroy = new Array();
            this.priorities = [];
            this.updateMap = new Map();
            this.systemNames = new Map();
            this.dirtySystemsCare = new Map();
            this.dirtyEntities = new Map();
            this._gametime = 0;
            this._walltime = 0;
        }
        addEntity() {
            let entity = this.nextEntityID;
            this.nextEntityID++;
            let cc = new ComponentContainer();
            this.entities.set(entity, {
                container: cc,
                viewer: new ComponentViewer(cc),
            });
            return entity;
        }
        removeEntity(entity) {
            this.entitiesToDestroy.push(entity);
        }
        destroyEntity(entity) {
            for (let system of this.systems.keys()) {
                this.removeEntityFromSystem(entity, system);
            }
            this.entities.delete(entity);
        }
        removeEntityFromSystem(entity, system) {
            let aspects = this.systems.get(system);
            if (aspects.has(entity)) {
                let aspect = aspects.get(entity);
                aspects.delete(entity);
                system.onRemove(aspect);
                if (this.dirtyEntities.has(system)) {
                    let dirty = this.dirtyEntities.get(system);
                    if (dirty.has(entity)) {
                        dirty.delete(entity);
                    }
                }
            }
        }
        clear() {
            for (let entity of mapKeyArr(this.entities)) {
                this.destroyEntity(entity);
            }
            arrayClear(this.entitiesToDestroy);
            this.nextEntityID = 0;
            for (let system of this.systems.keys()) {
                system.onClear();
            }
            this.eventsManager.clear();
        }
        componentDirty(entity, component) {
            if (!this.dirtySystemsCare.has(component.name)) {
                return;
            }
            for (let sys of this.dirtySystemsCare.get(component.name)) {
                if (this.systems.get(sys).has(entity)) {
                    this.dirtyEntities.get(sys).add(entity);
                }
            }
        }
        addComponent(entity, component) {
            this.entities.get(entity).container.add(component);
            component.signal = () => {
                this.componentDirty(entity, component);
            };
            for (let system of this.systems.keys()) {
                this.check(entity, system);
            }
            component.signal();
        }
        removeComponent(entity, c) {
            let component = this.entities.get(entity).container.get(c);
            this.entities.get(entity).container.delete(c);
            for (let system of this.systems.keys()) {
                this.check(entity, system);
            }
            component.signal();
        }
        removeComponentIfExists(entity, c) {
            if (!this.entities.get(entity).container.has(c)) {
                return;
            }
            this.removeComponent(entity, c);
        }
        getComponents(entity) {
            if (!this.entities.has(entity)) {
                return null;
            }
            return this.entities.get(entity).viewer;
        }
        addSystem(priority, system) {
            if (system.componentsRequired.size == 0) {
                throw new Error("Can't add system " + system + "; empty components list.");
            }
            if (this.systems.has(system)) {
                throw new Error("Can't add system " + system + "; already exists.");
            }
            system.ecs = this;
            system.eventsManager = this.eventsManager;
            system.init();
            this.systems.set(system, new Map());
            for (let entity of this.entities.keys()) {
                this.check(entity, system);
            }
            this.priorities = Array.from((new Set(this.priorities)).add(priority));
            this.priorities.sort(sortNumeric);
            if (!this.updateMap.has(priority)) {
                this.updateMap.set(priority, new Set());
            }
            this.updateMap.get(priority).add(system);
            this.systemNames.set(system.name, system);
            for (let c of system.dirtyComponents) {
                if (!this.dirtySystemsCare.has(c)) {
                    this.dirtySystemsCare.set(c, new Set());
                }
                this.dirtySystemsCare.get(c).add(system);
            }
            this.dirtyEntities.set(system, new Set());
        }
        getSystem(s) {
            return this.systemNames.get(s.name);
        }
        toggleSystem(s) {
            this.toggleSystemInner(s.name, null);
        }
        toggleSystemByName(sName) {
            this.toggleSystemInner(sName, null);
        }
        disableSystem(s) {
            this.toggleSystemInner(s.name, false);
        }
        enableSystem(s) {
            this.toggleSystemInner(s.name, true);
        }
        toggleSystemInner(name, desired) {
            let sys = this.systemNames.get(name);
            if (!sys) {
                return;
            }
            if (desired || (desired == null && sys.disabled)) {
                sys.disabled = false;
                sys.onEnabled(this.systems.get(sys));
            }
            else {
                sys.disabled = true;
                sys.onDisabled(this.systems.get(sys));
            }
        }
        update(wallDelta, gameDelta, clockTower) {
            let delta = this.slowMotion.update(gameDelta);
            let debugOnly = delta == 0;
            this._walltime += wallDelta;
            this._gametime += delta;
            for (let priority of this.priorities) {
                let systems = this.updateMap.get(priority);
                for (let sys of systems.values()) {
                    clockTower.start(Measurement.T_SYSTEMS, sys.name);
                    if (!sys.disabled && (!debugOnly || sys.debug)) {
                        sys.update(delta, this.systems.get(sys), this.dirtyEntities.get(sys), clockTower);
                        this.dirtyEntities.get(sys).clear();
                    }
                    clockTower.end(Measurement.T_SYSTEMS, sys.name);
                }
            }
            return delta;
        }
        finishUpdate() {
            while (this.entitiesToDestroy.length > 0) {
                this.destroyEntity(this.entitiesToDestroy.pop());
            }
        }
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
        check(entity, system) {
            let have_container = this.entities.get(entity).container;
            let have = have_container.keys();
            let needed = system.componentsRequired;
            let aspects = this.systems.get(system);
            if (setContains(have, needed)) {
                if (!aspects.has(entity)) {
                    let aspect = system.makeAspect();
                    aspect.setCC_(have_container);
                    aspect.entity = entity;
                    aspects.set(entity, aspect);
                    system.onAdd(aspect);
                }
            }
            else {
                this.removeEntityFromSystem(entity, system);
            }
        }
    }
    Engine.ECS = ECS;
    class Aspect {
        constructor() {
            this.repr = '';
        }
        get(c) {
            return this.components.get(c);
        }
        has(...cs) {
            for (let c of cs) {
                if (!this.components.has(c)) {
                    return false;
                }
            }
            return true;
        }
        setCC_(cc) {
            this.components = cc;
        }
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
    class Component {
        dirty() {
            this.signal();
        }
        constructor() {
            this.signal = () => { };
            var component = this.constructor;
            this.name = component.name;
        }
        toString() {
            return Constants.CHECKMARK;
        }
    }
    Engine.Component = Component;
    class System {
        constructor(disabled = false, debug = false) {
            this.disabled = disabled;
            this.debug = debug;
            this.dirtyComponents = new Set();
            this.repr = '';
        }
        init() { }
        makeAspect() {
            return new Aspect();
        }
        onAdd(aspect) { }
        onRemove(aspect) { }
        onDisabled(entities) { }
        onEnabled(entities) { }
        onClear() { }
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
var System;
(function (System) {
    class Audio extends Engine.System {
        constructor(collection) {
            super();
            this.collection = collection;
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
            this.boundsGetter = null;
            this.viewportSize = null;
            this.cacheMinBounds = new Point();
            this.cacheMaxBounds = new Point();
            this.effectVolume = 1.0;
            this.musicVolume = 0.7;
            this.effectsOn = true;
            this.musicOn = true;
            this.sounds = new Map();
            this.music = new Map();
            this.queue = [];
            this.playedThisFrame = new Set();
            this.playingMusic = [];
        }
        load() {
            for (let [trackID, track] of this.collection.entries()) {
                let h;
                if (track.music) {
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
        playMusic(only) {
            let s = new Set(only);
            arrayClear(this.playingMusic);
            for (let track of s) {
                this.playingMusic.push(track);
            }
            if (!this.musicOn) {
                return;
            }
            for (let [trackID, hpkg] of this.music.entries()) {
                let h = hpkg.howl;
                if (s.has(trackID)) {
                    h.volume(hpkg.volume);
                    if (!h.playing()) {
                        h.seek(0);
                        h.play('main');
                    }
                }
                else {
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
        toggleEffects() {
            this.effectsOn = !this.effectsOn;
            let w = this.effectsOn ? 'on' : 'off';
            let f = this.effectsOn ? 'On' : 'Off';
            this.ecs.getSystem(System.GUIManager).runSequence('notification', new Map([['notification', 'sound effects ' + w]]), new Map([['notification', 'HUD/sound' + f]]));
        }
        getPlaying() {
            return Array.from(this.playingMusic);
        }
        play(options, location = null) {
            if (options == null) {
                return;
            }
            if (location == null || this.boundsGetter == null || this.viewportSize == null) {
                this.playHelper(options);
                return;
            }
            this.boundsGetter.getViewBounds(this.viewportSize, this.cacheMinBounds, this.cacheMaxBounds, 20);
            if (location.x < this.cacheMinBounds.x || location.x > this.cacheMaxBounds.x ||
                location.y < this.cacheMinBounds.y || location.y > this.cacheMaxBounds.y) {
                return;
            }
            this.playHelper(options);
        }
        playHelper(options) {
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
            this.queue.push(trackID);
        }
        onClear() {
            arrayClear(this.queue);
            this.playedThisFrame.clear();
        }
        update(delta, entities) {
            this.playedThisFrame.clear();
            while (this.queue.length > 0) {
                let trackID = this.queue.pop();
                if (this.playedThisFrame.has(trackID)) {
                    continue;
                }
                if (!this.effectsOn) {
                    continue;
                }
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
function override(target, propertyKey, descriptor) {
    var baseType = Object.getPrototypeOf(target);
    if (typeof baseType[propertyKey] !== 'function') {
        throw new Error('Method ' + propertyKey + ' of ' + target.constructor.name + ' does not override any base class method');
    }
}
var Constants;
(function (Constants) {
    Constants.FN_CONFIG = 'assets/data/config.json';
    Constants.BGColor = 0x050505;
    Constants.DELTA_MS = 16.669;
    Constants.CHECKMARK = '\u{2713}';
    Constants.XMARK = '\u{2717}';
})(Constants || (Constants = {}));
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
var StageTarget;
(function (StageTarget) {
    StageTarget[StageTarget["World"] = 0] = "World";
    StageTarget[StageTarget["HUD"] = 1] = "HUD";
})(StageTarget || (StageTarget = {}));
const ZLevelEnums = [
    ZLevelWorld,
    ZLevelHUD
];
const ParticleContainerZs = new Map([
    [StageTarget.World, new Set([ZLevelWorld.Particles, ZLevelWorld.Blood])],
    [StageTarget.HUD, new Set([ZLevelHUD.Particles])],
]);
var Stage;
(function (Stage) {
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
    function buildPIXISprite(img, position, anchor = new Point(0, 1)) {
        let sprite = new PIXI.Sprite(PIXI.Texture.fromFrame(img));
        sprite.anchor.set(anchor.x, anchor.y);
        sprite.position.set(position.x, position.y);
        return sprite;
    }
    Stage.buildPIXISprite = buildPIXISprite;
    class MainStage {
        constructor() {
            this.stage = new MainStageCore();
            this.mapping = new Map();
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
        camera_get(t) {
            return this.stage.getChildAt(t);
        }
    }
    Stage.MainStage = MainStage;
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
    class MultiZStage extends PIXI.Container {
        constructor(stagetTarget, z_enum) {
            super();
            this.mapping = new Map();
            var zs = enumSortedVals(z_enum);
            for (var i = 0; i < zs.length; i++) {
                this.mapping.set(zs[i], i);
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
            stage.addChild(obj);
        }
        remove(obj) {
            var idx = this.mapping.get(obj.z);
            var stage = this.getChildAt(idx);
            stage.removeChild(obj);
        }
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
        worldToHUD(point) {
            let wp = this.cacheWorldPos;
            let hp = this.cacheHUDPos;
            wp.set(point.x, point.y);
            this.hud.toLocal(wp, this.world, hp, true);
            point.set_(hp.x, hp.y);
            return point;
        }
        HUDtoHUDBase(point) {
            return point.set_(Math.round((point.x / this.viewportSize.x) * 640), Math.round((point.y / this.viewportSize.y) * 360));
        }
        worldToHUDBase(point) {
            return this.HUDtoHUDBase(this.worldToHUD(point));
        }
        HUDbaseToHUD(point) {
            return point.set_(Math.round((point.x / 640) * this.viewportSize.x), Math.round((point.y / 360) * this.viewportSize.y));
        }
        HUDtoWorld(point) {
            let wp = this.cacheWorldPos;
            let hp = this.cacheHUDPos;
            hp.set(point.x, point.y);
            this.world.toLocal(hp, this.hud, wp, true);
            point.set_(wp.x, wp.y);
            return point;
        }
        HUDBaseToWorld(point) {
            return this.HUDtoWorld(this.HUDbaseToHUD(point));
        }
    }
    Stage.Translator = Translator;
})(Stage || (Stage = {}));
var Part;
(function (Part) {
    Part[Part["Core"] = 0] = "Core";
    Part[Part["Weapon"] = 1] = "Weapon";
    Part[Part["Shield"] = 2] = "Shield";
    Part[Part["Fx"] = 3] = "Fx";
})(Part || (Part = {}));
var PartID;
(function (PartID) {
    PartID[PartID["Default"] = 0] = "Default";
    PartID[PartID["Sword"] = 1] = "Sword";
    PartID[PartID["Axe"] = 2] = "Axe";
    PartID[PartID["Bow"] = 3] = "Bow";
})(PartID || (PartID = {}));
var Component;
(function (Component) {
    class Body extends Engine.Component {
        constructor() {
            super(...arguments);
            this.coreDefaultOnly = false;
            this._parts = new Map();
        }
        updateParts(v) {
            mapClone(v, this._parts);
            this.dirty();
        }
        setParts(v) {
            if (v.size != this._parts.size) {
                this.updateParts(v);
                return;
            }
            for (let [nk, nv] of v.entries()) {
                if ((!this._parts.has(nk)) || this._parts.get(nk) !== nv) {
                    this.updateParts(v);
                    return;
                }
            }
        }
        getParts() {
            return this._parts.entries();
        }
        getPart(part) {
            return this._parts.get(part);
        }
        toString() {
            return mapString(this._parts, (p) => Part[p], (p) => PartID[p]);
        }
    }
    Component.Body = Body;
})(Component || (Component = {}));
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
        let res = clone(orig);
        res.block.cboxDims = orig.block.cboxDims.copy();
        res.block.cboxOffset = orig.block.cboxOffset.copy();
        return res;
    }
    Shield.cloneShield = cloneShield;
    function extendShield(parent, child) {
        let shield = cloneShield(parent.shield);
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
    function cloneAttackInfo(orig) {
        if (orig == null) {
            return null;
        }
        let res = clone(orig);
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
        let res = clone(orig);
        res.swingAttack = cloneAttackInfo(orig.swingAttack);
        res.quickAttack = cloneAttackInfo(orig.quickAttack);
        res.comboAttack = cloneAttackInfo(orig.comboAttack);
        return res;
    }
    Weapon.cloneWeapon = cloneWeapon;
    function extendWeapon(parent, child) {
        let weapon = cloneWeapon(parent.weapon);
        objOverride(weapon, child.weapon, 'timing');
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
    function inheritanceBuild(data, parentProp, jsonToObject, extendObject) {
        let res = new Map();
        let children = new Map();
        for (let objectName in data) {
            let jsonObject = data[objectName];
            if (jsonObject[parentProp] == null) {
                res.set(objectName, jsonToObject(jsonObject));
            }
            else {
                children.set(objectName, jsonObject);
            }
        }
        let prevNChildren = children.size;
        let toRemove = [];
        while (children.size > 0) {
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
            if (children.size == prevNChildren) {
                throw new Error('Missing chain from child to parent. ' +
                    'Remaining children: ' + mapKeyString(children));
            }
            prevNChildren = children.size;
        }
        return res;
    }
    Conversion.inheritanceBuild = inheritanceBuild;
    function jsonToWeapons(data) {
        return inheritanceBuild(data, 'parent', jsonToWeapon, Weapon.extendWeapon);
    }
    Conversion.jsonToWeapons = jsonToWeapons;
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
    function jsonToAttackInfo(data, attackType) {
        let cboxDims = data.cboxDims == null ? null : Point.from(data.cboxDims);
        let cboxOffset = data.cboxOffset == null ? null : Point.from(data.cboxOffset);
        let unblockable = data.unblockable == null ? false : data.unblockable;
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
            unblockable: unblockable,
            sounds: data.sounds,
            blockedDuration: data.blockedDuration || Component.Blocked.DEFAULT_DURATION,
            velocity: data.velocity,
            animDatas: animDatas,
        };
    }
    Conversion.jsonToAttackInfo = jsonToAttackInfo;
    function jsonToWeapon(data) {
        let mainPartID = null;
        let animations = new Map();
        if (data.mainAnimationBase && data.mainAnimations) {
            let mainPart = Part[data.mainAnimationBase.part];
            mainPartID = PartID[data.mainAnimationBase.partID];
            mapAdd(animations, jsonToAnimDict(data.mainAnimations, mainPart, mainPartID));
        }
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
    function jsonToShields(data) {
        return inheritanceBuild(data, 'parent', jsonToShield, Shield.extendShield);
    }
    Conversion.jsonToShields = jsonToShields;
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
    class FSM {
        constructor(start) {
            this.elapsedInCur = 0;
            this.init = false;
            this.cur = start;
        }
        update(delta) {
            if (this.init) {
                this.states.get(this.cur).pre.call(this);
                this.init = true;
            }
            let code = this.states.get(this.cur);
            code.body.call(this);
            let next = code.next.call(this);
            this.elapsedInCur += delta;
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
var Component;
(function (Component) {
    class AIComponent extends Engine.Component {
        constructor(behavior, params, cutscene = false) {
            super();
            this.behavior = behavior;
            this.cutscene = cutscene;
            this.debugState = '';
            this.params = clone(params);
        }
        toString() {
            return AI.Behavior[this.behavior] + ' (' + this.debugState + ')';
        }
    }
    Component.AIComponent = AIComponent;
})(Component || (Component = {}));
var AI;
(function (AI) {
    function wait(aspect) {
        let input = aspect.get(Component.Input);
        input.intent.set_(0, 0);
        input.targetAngle = null;
        input.attack = false;
    }
    AI.wait = wait;
    class BaseFSM extends AI.FSM {
        getBlackboard() {
            return this.aspect.blackboards.get(this.sysName);
        }
        getParams() {
            return (this.aspect.get(Component.AIComponent)).params;
        }
        constructor(ecs, aspect, startState) {
            super(startState);
            this.ecs = ecs;
            this.aspect = aspect;
            this.startState = startState;
        }
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
        getPlayer() {
            return this.aspect.playerSelector.latest().next().value;
        }
        getPlayerComps() {
            return this.ecs.getComponents(this.getPlayer());
        }
        playerDead() {
            let player = this.getPlayer();
            if (player == null) {
                return true;
            }
            return this.ecs.getComponents(player).has(Component.Dead);
        }
        stopAndAttack() {
            this.stopMovement();
            this.attack();
        }
        attack() {
            let input = this.aspect.get(Component.Input);
            let armed = this.aspect.get(Component.Armed);
            let prevAttacking = input.attack;
            if (!prevAttacking) {
                input.attack = true;
                return;
            }
            if (armed.state == Weapon.SwingState.ChargeReady) {
                input.attack = false;
                return;
            }
            input.attack = true;
        }
        explodePre() {
            let activity = this.aspect.get(Component.Activity);
            activity.manual = true;
            activity.action = Action.QuickAttacking;
            let attackInfo = this.aspect.get(Component.Armed).active.quickAttack;
            this.ecs.getSystem(System.Swing).startAttack(this.aspect.entity, this.aspect.get(Component.Position), this.aspect.get(Component.Input), attackInfo, PartID.Default);
            let eNameSwing = Events.EventTypes.Swing;
            let eArgsSwing = {
                attackInfo: attackInfo,
                location: this.aspect.get(Component.Position).p,
            };
            this.ecs.eventsManager.dispatch({ name: eNameSwing, args: eArgsSwing });
            let eNameExplode = Events.EventTypes.Explosion;
            let eArgsExplode = {};
            this.ecs.eventsManager.dispatch({ name: eNameExplode, args: eArgsExplode });
        }
        playerDist() {
            return this.playerDistTo(this.getPos());
        }
        playerDistTo(location) {
            return location.distTo(this.getPlayerPos());
        }
        alivePlayerInRange(range) {
            if (this.playerDead()) {
                return false;
            }
            return this.getPos().distTo(this.getPlayerPos()) < range;
        }
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
        moveForwardTank(scale) {
            let input = this.aspect.get(Component.Input);
            let pos = this.aspect.get(Component.Position);
            input.intent.y = -Math.sin(pos.angle);
            input.intent.x = Math.cos(pos.angle);
        }
        moveForwardStandard(scale) {
            this.aspect.get(Component.Input).intent.y = Physics.UP * scale;
        }
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
        moveBackwards(scale = 1.0) {
            this.aspect.get(Component.Input).intent.y = Physics.DOWN * scale;
        }
        noAttack() {
            let input = this.aspect.get(Component.Input);
            input.attack = false;
        }
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
        facePlayer(offset = 0) {
            this.faceTarget(this.getPlayerPos(), offset);
        }
        faceTarget(target, offset = 0) {
            let pos = this.aspect.get(Component.Position);
            let input = this.aspect.get(Component.Input);
            let desiredAngle = angleClamp(pos.p.pixiAngleTo(target) + offset);
            if (input.movement.movementType === Physics.MovementType.InstantTurn ||
                input.movement.movementType === Physics.MovementType.Strafe) {
                input.targetAngle = desiredAngle;
                return;
            }
            let theta = angleClamp(desiredAngle - pos.angle);
            if (theta < Math.PI) {
                input.intent.x = Physics.LEFT;
            }
            else {
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
    function noop() { }
    AI.noop = noop;
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
                let ai = aspect.get(Component.AIComponent);
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
var System;
(function (System) {
    let CowState;
    (function (CowState) {
        CowState[CowState["Graze"] = 0] = "Graze";
        CowState[CowState["WalkLeft"] = 1] = "WalkLeft";
        CowState[CowState["WalkRight"] = 2] = "WalkRight";
    })(CowState || (CowState = {}));
    class CowFSM extends AI.BaseFSM {
        cowNext() {
            if (this.elapsedInCur < this.activityInterval) {
                return this.cur;
            }
            return Probability.uniformChoice([
                CowState.Graze,
                CowState.WalkLeft,
                CowState.WalkRight,
            ]);
        }
        walkLeft() {
            this.aspect.get(Component.Input).intent.set_(-1, -1);
        }
        walkRight() {
            this.aspect.get(Component.Input).intent.set_(1, -1);
        }
        constructor(ecs, aspect) {
            super(ecs, aspect, CowState.WalkLeft);
            this.sysName = AICow.name;
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
    }
    class AICow {
        static ensureBlackboard(ecs, aspect) {
            if (!aspect.blackboards.has(AICow.name)) {
                let bb = {
                    fsm: new CowFSM(ecs, aspect),
                };
                aspect.blackboards.set(AICow.name, bb);
            }
            return aspect.blackboards.get(AICow.name);
        }
        static update(delta, ecs, aspect) {
            let blackboard = AICow.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
            let aiComp = aspect.get(Component.AIComponent);
            aiComp.debugState = CowState[blackboard.fsm.cur];
        }
    }
    System.AICow = AICow;
})(System || (System = {}));
var System;
(function (System) {
    let BrawlerState;
    (function (BrawlerState) {
        BrawlerState[BrawlerState["AtHome"] = 0] = "AtHome";
        BrawlerState[BrawlerState["GoHome"] = 1] = "GoHome";
        BrawlerState[BrawlerState["Pursue"] = 2] = "Pursue";
        BrawlerState[BrawlerState["Attack"] = 3] = "Attack";
    })(BrawlerState || (BrawlerState = {}));
    class BrawlerFSM extends AI.BaseFSM {
        playerHomeDist() {
            return this.playerDistTo(this.getBlackboard().home);
        }
        aggressiveNext() {
            let params = this.getParams();
            if (this.playerDead() || (params.forget && this.playerHomeDist() > params.pursuitDistance)) {
                return BrawlerState.GoHome;
            }
            if (this.facingPlayer() && this.alivePlayerInRange(params.attackRange)) {
                return BrawlerState.Attack;
            }
            return BrawlerState.Pursue;
        }
        atHomeNext() {
            if (this.playerHomeDist() <= this.getParams().pursuitDistance) {
                return BrawlerState.Pursue;
            }
            return BrawlerState.AtHome;
        }
        goHomeDo() {
            this.faceTarget(this.getBlackboard().home);
            this.noAttack();
            this.moveForward();
        }
        goHomeNext() {
            if (this.playerHomeDist() <= this.getParams().pursuitDistance) {
                return BrawlerState.Pursue;
            }
            if (this.closeTo(this.getBlackboard().home)) {
                return BrawlerState.AtHome;
            }
            return BrawlerState.GoHome;
        }
        pursueDo() {
            this.facePlayer();
            this.noAttack();
            if (!this.alivePlayerInRange(this.getParams().attackRange)) {
                this.moveForward();
            }
        }
        attackNext() {
            if (this.swinging()) {
                return BrawlerState.Attack;
            }
            return this.aggressiveNext();
        }
        constructor(ecs, aspect) {
            super(ecs, aspect, BrawlerState.AtHome);
            this.sysName = AIBrawler.name;
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
    }
    class AIBrawler {
        static ensureBlackboard(ecs, aspect) {
            if (!aspect.blackboards.has(AIBrawler.name)) {
                let position = aspect.get(Component.Position);
                let bb = {
                    home: position.p.copy(),
                    fsm: new BrawlerFSM(ecs, aspect),
                };
                aspect.blackboards.set(AIBrawler.name, bb);
            }
            return aspect.blackboards.get(AIBrawler.name);
        }
        static update(delta, ecs, aspect) {
            let blackboard = AIBrawler.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
            let aiComp = aspect.get(Component.AIComponent);
            aiComp.debugState = BrawlerState[blackboard.fsm.cur];
        }
    }
    System.AIBrawler = AIBrawler;
})(System || (System = {}));
var Action;
(function (Action) {
    Action[Action["INVALID"] = -1] = "INVALID";
    Action[Action["Idle"] = 0] = "Idle";
    Action[Action["Moving"] = 1] = "Moving";
    Action[Action["BlockRaising"] = 2] = "BlockRaising";
    Action[Action["BlockHolding"] = 3] = "BlockHolding";
    Action[Action["BlockLowering"] = 4] = "BlockLowering";
    Action[Action["Charging"] = 5] = "Charging";
    Action[Action["Swinging"] = 6] = "Swinging";
    Action[Action["Sheathing"] = 7] = "Sheathing";
    Action[Action["Dead"] = 8] = "Dead";
    Action[Action["Staggering"] = 9] = "Staggering";
    Action[Action["StaggerReturning"] = 10] = "StaggerReturning";
    Action[Action["Knockback"] = 11] = "Knockback";
    Action[Action["Blocked"] = 12] = "Blocked";
    Action[Action["Recoiling"] = 13] = "Recoiling";
    Action[Action["QuickAttacking"] = 14] = "QuickAttacking";
    Action[Action["QuickAttacking2"] = 15] = "QuickAttacking2";
    Action[Action["ComboAttacking"] = 16] = "ComboAttacking";
    Action[Action["Opening"] = 17] = "Opening";
})(Action || (Action = {}));
var Component;
(function (Component) {
    class Activity extends Engine.Component {
        get action() { return this._action; }
        set action(v) {
            if (this._action !== v) {
                this._action = v;
                this.dirty();
            }
        }
        get manual() { return this._manual; }
        set manual(v) {
            if (this._manual !== v) {
                this._manual = v;
                this.dirty();
            }
        }
        constructor(activitySpec) {
            super();
            this.idleOnly = false;
            this._manual = false;
            let settings = Anim.convertActivity(activitySpec);
            this.action = settings.startAction;
            this.manual = settings.manual;
        }
        toString() {
            return Action[this.action];
        }
    }
    Component.Activity = Activity;
})(Component || (Component = {}));
var Component;
(function (Component) {
    class Armed extends Engine.Component {
        constructor(active, state = Weapon.SwingState.Idle) {
            super();
            this.state = state;
            this.inventory = new Array();
            this.activeIdx = -1;
            this.elapsed = 0;
            this.active = Weapon.cloneWeapon(active);
            this.inventory.push(active);
            this.activeIdx = 0;
        }
    }
    Component.Armed = Armed;
})(Component || (Component = {}));
var Component;
(function (Component) {
    class Shielded extends Engine.Component {
        constructor(active, state = Shield.BlockState.Idle) {
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
var System;
(function (System) {
    class Activity extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Activity.name,
            ]);
        }
        determineAction(aspect) {
            if (aspect.has(Component.Dead)) {
                return Action.Dead;
            }
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
            if (aspect.has(Component.Input)) {
                let input = aspect.get(Component.Input);
                if (input.intent.y != 0 || input.intent.x != 0) {
                    return Action.Moving;
                }
            }
            return Action.Idle;
        }
        update(delta, entities) {
            for (let aspect of entities.values()) {
                let activity = aspect.get(Component.Activity);
                if (activity.manual) {
                    continue;
                }
                activity.action = this.determineAction(aspect);
            }
        }
    }
    System.Activity = Activity;
})(System || (System = {}));
var Component;
(function (Component) {
    class ActiveAttack extends Engine.Component {
    }
    Component.ActiveAttack = ActiveAttack;
})(Component || (Component = {}));
var Destruct;
(function (Destruct) {
    Destruct[Destruct["Component"] = 0] = "Component";
    Destruct[Destruct["Entity"] = 1] = "Entity";
})(Destruct || (Destruct = {}));
var Component;
(function (Component) {
    class Timebomb extends Engine.Component {
        constructor(duration, destruct, fuse = false, lastWish) {
            super();
            this.duration = duration;
            this.destruct = destruct;
            this.fuse = fuse;
            this.lastWish = lastWish;
            this.startTime = -1;
        }
        toString() {
            return 'total duration: ' + this.duration + 'ms';
        }
    }
    Component.Timebomb = Timebomb;
})(Component || (Component = {}));
var Component;
(function (Component) {
    class Attack extends Component.Timebomb {
        constructor(attacker, info) {
            super(info.duration, Destruct.Entity);
            this.attacker = attacker;
            this.hit = false;
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
var System;
(function (System) {
    class Timebomb extends Engine.System {
        update(delta, entities) {
            for (let [entity, aspect] of entities.entries()) {
                let tb = aspect.get(this.tbComp);
                if (tb.startTime === -1) {
                    tb.startTime = this.ecs.gametime;
                }
                let elapsed = this.ecs.gametime - tb.startTime;
                if ((elapsed >= tb.duration && tb.duration != -1) || tb.fuse) {
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
                    if (tb.lastWish) {
                        tb.lastWish(this.ecs, entity);
                    }
                }
            }
        }
    }
    System.Timebomb = Timebomb;
})(System || (System = {}));
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
var Component;
(function (Component) {
    class Dead extends Engine.Component {
    }
    Component.Dead = Dead;
})(Component || (Component = {}));
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
            this.cacheNewParts.clear();
            let coreID = PartID.Default;
            if (aspect.has(Component.Armed)) {
                let armed = aspect.get(Component.Armed);
                if (this.modActions.has(activity.action)) {
                    coreID = armed.active.partID;
                }
                this.cacheNewParts.set(Part.Weapon, armed.active.partID);
            }
            if (aspect.has(Component.Shielded)) {
                if (coreID != PartID.Bow) {
                    this.cacheNewParts.set(Part.Shield, PartID.Default);
                }
            }
            this.cacheNewParts.set(Part.Core, coreID);
            aspect.get(Component.Body).setParts(this.cacheNewParts);
        }
        update(delta, entities) {
            for (let aspect of entities.values()) {
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
        AlignType[AlignType["Center"] = 0] = "Center";
        AlignType[AlignType["TextureOrigin"] = 1] = "TextureOrigin";
    })(AlignType = Anim.AlignType || (Anim.AlignType = {}));
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
        let res = clone(orig);
        if (orig.anchor != null) {
            res.anchor = orig.anchor.copy();
        }
        if (orig.align != null && orig.align.extraOffset != null) {
            res.align.extraOffset = orig.align.extraOffset.copy();
        }
        return res;
    }
    Anim.cloneData = cloneData;
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
        let res = {
            startAction: Action.INVALID,
            manual: false,
        };
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
    function convertBaseSpec(baseSpec) {
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
    function convertSpec(spec) {
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
var Component;
(function (Component) {
    class Animatable extends Engine.Component {
        get reset() { return this._reset; }
        set reset(v) {
            if (this._reset !== v) {
                this._reset = v;
                this.dirty();
            }
        }
        get pause() { return this._pause; }
        set pause(v) {
            if (this._pause !== v) {
                this._pause = v;
                this.dirty();
            }
        }
        get visible() { return this._visible; }
        set visible(v) {
            if (this._visible !== v) {
                this._visible = v;
                this.dirty();
            }
        }
        constructor(z, stageTarget) {
            super();
            this.z = z;
            this.stageTarget = stageTarget;
            this.state = new Stage.AnimatableState();
            this.animations = new Map();
            this.hideOnDeath = false;
            this.globalTint = 0xffffff;
            this.globalScale = 1;
            this.coreFrame = -1;
            this._reset = false;
            this._pause = false;
            this._visible = true;
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
var Component;
(function (Component) {
    class Position extends Engine.Component {
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
        constructor(p, angle = 0) {
            super();
            this._p = new Point();
            this._revealP = new Point();
            this._angle = 0;
            this.cells = [];
            this.debugSpeed = 0;
            this.p = p;
            this.angle = angle;
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
    let HitBehavior;
    (function (HitBehavior) {
        HitBehavior[HitBehavior["Player"] = 0] = "Player";
        HitBehavior[HitBehavior["StandardEnemy"] = 1] = "StandardEnemy";
    })(HitBehavior = Attributes.HitBehavior || (Attributes.HitBehavior = {}));
})(Attributes || (Attributes = {}));
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
var Component;
(function (Component) {
    class Stagger extends Component.Timebomb {
        constructor(duration) {
            super(duration, Destruct.Component, false, (ecs, entity) => {
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
var System;
(function (System) {
    class AnimationRenderer extends Engine.System {
        static buildAnimation(st, z, d) {
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
            anim.visible = false;
            return anim;
        }
        static getCurrentKeys(aspect, animatable, out) {
            out.clear();
            if (animatable.defaultOnly) {
                out.add(Anim.DefaultKey);
                return;
            }
            let activity = aspect.get(Component.Activity);
            let body = aspect.get(Component.Body);
            for (let [part, partID] of body.getParts()) {
                let key = Anim.getKey(activity.action, part, partID);
                if (animatable.state.animations.has(key)) {
                    out.add(key);
                }
            }
        }
        static getCoreKey(aspect, animatable) {
            if (animatable.defaultOnly) {
                return Anim.DefaultKey;
            }
            let activity = aspect.get(Component.Activity);
            let body = aspect.get(Component.Body);
            let corePartID = body.getPart(Part.Core);
            return Anim.getKey(activity.action, Part.Core, corePartID);
        }
        constructor(stage) {
            super();
            this.stage = stage;
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.Animatable.name,
            ]);
            this.dirtyComponents = new Set([
                Component.Position.name,
                Component.Animatable.name,
                Component.Activity.name,
                Component.Body.name,
                Component.Dead.name,
                Component.DamagedFlash.name,
            ]);
            this.cacheTodoKeys = new Set();
            this.cacheTexOrigPos = new Point();
            this.cacheAlignOffset = new Point();
        }
        onAdd(aspect) {
            let animatable = aspect.get(Component.Animatable);
            for (let [key, data] of animatable.animations.entries()) {
                let anim = AnimationRenderer.buildAnimation(animatable.stageTarget, animatable.z, data);
                let tint = data.tint != null ? data.tint : animatable.globalTint;
                let scale = data.scale != null ? data.scale : animatable.globalScale;
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
            let red = 0xff0000;
            let flash = 0xffff00;
            if (aspect.has(Component.DamagedFlash)) {
                return red;
            }
            return defaultTint;
        }
        maybeHide(aspect, animatable) {
            if (animatable.hideOnDeath) {
                animatable.visible = !aspect.has(Component.Dead);
            }
        }
        mutateAnimation(delta, aspect, ac, visible) {
            ac.animation.visible = visible;
            if (visible) {
                ac.animation.tint = this.getTint(aspect, ac.tint);
            }
        }
        updateAnimations(delta, aspect, next) {
            let animatable = aspect.get(Component.Animatable);
            let state = animatable.state;
            let reset = animatable.reset;
            animatable.reset = false;
            let visible = animatable.visible;
            for (let prevKey of state.activeKeys.keys()) {
                if (next.has(prevKey)) {
                    let ac = state.animations.get(prevKey);
                    this.mutateAnimation(delta, aspect, ac, visible);
                    if (reset) {
                        ac.animation.reset();
                    }
                }
                else {
                    this.stage.remove(state.animations.get(prevKey).animation);
                }
            }
            for (let newKey of next.keys()) {
                if (!state.activeKeys.has(newKey)) {
                    let ac = state.animations.get(newKey);
                    ac.animation.reset();
                    this.mutateAnimation(delta, aspect, ac, visible);
                    this.stage.add(ac.animation);
                }
            }
        }
        updatePositions(aspect) {
            let animatable = aspect.get(Component.Animatable);
            let state = animatable.state;
            let position = aspect.get(Component.Position);
            let coreKey = AnimationRenderer.getCoreKey(aspect, animatable);
            let rot = angleFlip(position.angle);
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
            let coreOrig = this.cacheTexOrigPos;
            coreAnim.getTextureOrigin(coreOrig);
            for (let [key, cont] of state.animations.entries()) {
                if (key == coreKey) {
                    continue;
                }
                switch (cont.align.alignType) {
                    case Anim.AlignType.Center: {
                        cont.animation.position.set(position.p.x, position.p.y);
                        break;
                    }
                    case Anim.AlignType.TextureOrigin: {
                        let ao = this.cacheAlignOffset;
                        ao.copyFrom_(cont.align.extraOffset).rotate_(rot).add_(coreOrig);
                        cont.animation.position.set(ao.x, ao.y);
                        break;
                    }
                }
                cont.animation.rotation = rot;
            }
        }
        update(delta, entities, dirty) {
            for (let entity of dirty) {
                let aspect = entities.get(entity);
                let animatable = aspect.get(Component.Animatable);
                let state = animatable.state;
                this.maybeHide(aspect, animatable);
                if ((state.curVisible === animatable.visible) && !animatable.visible) {
                    continue;
                }
                let nextKeys = this.cacheTodoKeys;
                AnimationRenderer.getCurrentKeys(aspect, animatable, nextKeys);
                this.updateAnimations(delta, aspect, nextKeys);
                this.updatePositions(aspect);
                if (!aspect.has(Component.AnimationTickable)) {
                    this.ecs.addComponent(entity, new Component.AnimationTickable());
                }
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
var System;
(function (System) {
    class Util {
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
            for (let [k, v] of c.entries()) {
                console.log(k + ': ' + v);
            }
        }
    }
    System.Util = Util;
})(System || (System = {}));
var CollisionType;
(function (CollisionType) {
    CollisionType[CollisionType["Invalid"] = 0] = "Invalid";
    CollisionType[CollisionType["Mobile"] = 1] = "Mobile";
    CollisionType[CollisionType["Solid"] = 2] = "Solid";
    CollisionType[CollisionType["Attack"] = 3] = "Attack";
    CollisionType[CollisionType["Vulnerable"] = 4] = "Vulnerable";
    CollisionType[CollisionType["Destructible"] = 5] = "Destructible";
    CollisionType[CollisionType["Shield"] = 6] = "Shield";
    CollisionType[CollisionType["Player"] = 7] = "Player";
    CollisionType[CollisionType["Logic"] = 8] = "Logic";
    CollisionType[CollisionType["Physics"] = 9] = "Physics";
    CollisionType[CollisionType["Item"] = 10] = "Item";
    CollisionType[CollisionType["Environment"] = 11] = "Environment";
    CollisionType[CollisionType["Explosion"] = 12] = "Explosion";
    CollisionType[CollisionType["Projectile"] = 13] = "Projectile";
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
    class CollisionShape extends Engine.Component {
        get rectDims() {
            if (this.shape !== Physics.Shape.Rectangle) {
                console.warn('Should not get rectDims for non-rectangle. Check .shape first.');
                return null;
            }
            return new Point(Math.abs(this.localVertices[0].x) * 2, Math.abs(this.localVertices[0].y) * 2);
        }
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
        maybeRecomputeInternals(pos, angle) {
            if (this._cacheComputedPoint.equals(pos) && this._cacheComputedAngle === angle) {
                return;
            }
            this.cacheFullPos.copyFrom_(pos).add_(this.offset);
            this.recomputeGlobalVertices(this.cacheFullPos, angle);
            Physics.getEdges(this._globalVertices, this._globalEdges, this._axes);
            Physics.getNormals(this._globalEdges, this._globalAxes);
            this._cacheComputedPoint.copyFrom_(pos);
            this._cacheComputedAngle = angle;
        }
        getVertices(pos, angle) {
            this.maybeRecomputeInternals(pos, angle);
            return this._globalVertices;
        }
        getAxes(pos, angle) {
            this.maybeRecomputeInternals(pos, angle);
            return this._globalAxes;
        }
        static buildRectangle(dims, cTypes, offset = new Point()) {
            return new CollisionShape([
                new Point(-dims.x / 2, -dims.y / 2),
                new Point(dims.x / 2, -dims.y / 2),
                new Point(dims.x / 2, dims.y / 2),
                new Point(-dims.x / 2, dims.y / 2),
            ], cTypes, Physics.Shape.Rectangle, offset);
        }
        constructor(localVertices, cTypes, shape = Physics.Shape.Polygon, offset = new Point()) {
            super();
            this.cTypes = new Set();
            this.sqMaxDistance = -1;
            this.maxDistance = -1;
            this.collisionsFresh = new MapMutationNotifier(this);
            this.collisionsResolved = new SetMutationNotifier(this);
            this._disabled = false;
            this._cacheComputedPoint = new Point(-Infinity, -Infinity);
            this._cacheComputedAngle = -Infinity;
            this.cacheFullPos = new Point();
            let sides = localVertices.length;
            this._sides = sides;
            this.localVertices = new Array(sides);
            for (let i = 0; i < sides; i++) {
                this.localVertices[i] = localVertices[i].copy();
            }
            setClone(cTypes, this.cTypes);
            this.shape = shape;
            this.offset = offset.copy();
            this._axes = shape === Physics.Shape.Rectangle ? sides / 2 : sides;
            this._globalVertices = new Array(sides);
            this._globalEdges = new Array(this._axes);
            this._globalAxes = new Array(this._axes);
            for (let arr of [this._globalVertices, this._globalEdges, this._globalAxes]) {
                for (let i = 0; i < arr.length; i++) {
                    arr[i] = new Point();
                }
            }
            let maxDSq = -1;
            for (let i = 0; i < sides; i++) {
                maxDSq = Math.max(maxDSq, localVertices[i].l2Squared());
            }
            this.sqMaxDistance = maxDSq;
            this.maxDistance = Math.sqrt(maxDSq);
            this._repr = '[' + this.localVertices + '] ' + setString(this.cTypes, (c) => CollisionType[c]);
        }
        toString() {
            return this._repr;
        }
    }
    Component.CollisionShape = CollisionShape;
})(Component || (Component = {}));
var System;
(function (System) {
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
                    if (!otherComps.has(Component.CollisionShape)) {
                        console.error('Colliding entities did both have CollisionBox components?!?');
                        continue;
                    }
                    let otherBox = otherComps.get(Component.CollisionShape);
                    if (!otherBox.cTypes.has(CollisionType.Attack)) {
                        continue;
                    }
                    if (!otherComps.has(Component.Attack)) {
                        console.error('Weapon CollisionBox did have an Attack component?!?');
                        continue;
                    }
                    let attack = otherComps.get(Component.Attack);
                    if (attack.info.unblockable) {
                        continue;
                    }
                    let attackerComps = this.ecs.getComponents(attack.attacker);
                    let origDamage = attack.info.damage;
                    attack.info.damage = Math.max(0, attack.info.damage - block.shield.block.armor);
                    if (attack.info.damage == 0) {
                        attack.fuse = true;
                        if (attack.info.movement === Weapon.AttackMovement.Track) {
                            if (attack.info.blockedDuration > 0) {
                                System.Util.addOrExtend(this.ecs, attack.attacker, Component.Blocked, attack.info.blockedDuration);
                                System.Util.addOrExtend(this.ecs, attack.attacker, Component.Immobile, attack.info.blockedDuration);
                            }
                            if (attackerComps.has(Component.Input)) {
                                (attackerComps.get(Component.Input)).bounce = true;
                            }
                        }
                    }
                    else {
                        otherBox.collisionsResolved.add(entity);
                    }
                    if (origDamage <= 0) {
                        continue;
                    }
                    if (!this.ecs.getComponents(block.blocker).has(Component.Recoil)) {
                        this.ecs.addComponent(block.blocker, new Component.Recoil());
                    }
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
    let EventTypes;
    (function (EventTypes) {
        EventTypes[EventTypes["Damage"] = 0] = "Damage";
        EventTypes[EventTypes["Charge"] = 1] = "Charge";
        EventTypes[EventTypes["Swing"] = 2] = "Swing";
        EventTypes[EventTypes["Checkpoint"] = 3] = "Checkpoint";
        EventTypes[EventTypes["ThingDead"] = 4] = "ThingDead";
        EventTypes[EventTypes["ZoneTransition"] = 5] = "ZoneTransition";
        EventTypes[EventTypes["Block"] = 6] = "Block";
        EventTypes[EventTypes["EnemyStaggerPre"] = 7] = "EnemyStaggerPre";
        EventTypes[EventTypes["EnemyStagger"] = 8] = "EnemyStagger";
        EventTypes[EventTypes["ItemCollected"] = 9] = "ItemCollected";
        EventTypes[EventTypes["Bleed"] = 10] = "Bleed";
        EventTypes[EventTypes["ExitConditions"] = 11] = "ExitConditions";
        EventTypes[EventTypes["MenuKeypress"] = 12] = "MenuKeypress";
        EventTypes[EventTypes["DebugKeypress"] = 13] = "DebugKeypress";
        EventTypes[EventTypes["StartExitSequence"] = 14] = "StartExitSequence";
        EventTypes[EventTypes["SwitchScene"] = 15] = "SwitchScene";
        EventTypes[EventTypes["GameplayStart"] = 16] = "GameplayStart";
        EventTypes[EventTypes["GateOpen"] = 17] = "GateOpen";
        EventTypes[EventTypes["CheckGates"] = 18] = "CheckGates";
        EventTypes[EventTypes["ShowInstructions"] = 19] = "ShowInstructions";
        EventTypes[EventTypes["GameLogic"] = 20] = "GameLogic";
        EventTypes[EventTypes["Explosion"] = 21] = "Explosion";
        EventTypes[EventTypes["SwapBodies"] = 22] = "SwapBodies";
        EventTypes[EventTypes["PlayerControl"] = 23] = "PlayerControl";
    })(EventTypes = Events.EventTypes || (Events.EventTypes = {}));
    let Phase;
    (function (Phase) {
        Phase[Phase["TitleScreenShow"] = 0] = "TitleScreenShow";
        Phase[Phase["CreditsShow"] = 1] = "CreditsShow";
        Phase[Phase["RecapShow"] = 2] = "RecapShow";
    })(Phase = Events.Phase || (Events.Phase = {}));
})(Events || (Events = {}));
var Component;
(function (Component) {
    class Health extends Engine.Component {
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
        constructor(maximum, current = maximum) {
            super();
            this.maximum = maximum;
            this.current = current;
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
        MovementType[MovementType["RotateMove"] = 0] = "RotateMove";
        MovementType[MovementType["InstantTurn"] = 1] = "InstantTurn";
        MovementType[MovementType["Strafe"] = 2] = "Strafe";
    })(MovementType = Physics.MovementType || (Physics.MovementType = {}));
    let RegionType;
    (function (RegionType) {
        RegionType[RegionType["Slow"] = 0] = "Slow";
    })(RegionType = Physics.RegionType || (Physics.RegionType = {}));
})(Physics || (Physics = {}));
var Component;
(function (Component) {
    class Input extends Engine.Component {
        constructor(movement) {
            super();
            this.intent = new Point();
            this.attack = false;
            this.quickAttack = false;
            this.block = false;
            this.switchWeapon = false;
            this.controls = false;
            this.targetAngle = 0;
            this.collisionForce = new Point();
            this.forceQueue = new Array();
            this.frictionQueue = new Array();
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
var Component;
(function (Component) {
    class LevelComputer {
        constructor(expToLevel) {
            this.expToLevel = expToLevel;
        }
        getData(totalExpAcquired, out) {
            let candidateLevel = 0;
            let expToReach = 0;
            let prevExpToReach = 0;
            while (totalExpAcquired >= expToReach) {
                candidateLevel++;
                prevExpToReach = expToReach;
                expToReach += this.expToLevel(candidateLevel);
            }
            out.level = candidateLevel - 1;
            out.expProgress = totalExpAcquired - prevExpToReach;
        }
    }
    class LevelGainer extends Engine.Component {
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
        get levelData() {
            if (this.lastComputedExp != this.exp) {
                this.levelComputer.getData(this.exp, this._levelData);
                this.lastComputedExp = this.exp;
            }
            return this._levelData;
        }
        get level() {
            return this.levelData.level;
        }
        get expNext() {
            return this.expToLevel(this.level + 1);
        }
        get expProgress() {
            return this.levelData.expProgress;
        }
        toString() {
            return 'level ' + this.level + ' (' + this.expProgress + '/' + this.expNext + ')';
        }
    }
    Component.LevelGainer = LevelGainer;
})(Component || (Component = {}));
var System;
(function (System) {
    const envImmuneEnemyActions = new Set([
        Action.Moving, Action.Idle, Action.Charging,
    ]);
    let hitBehaviorMap = new Map([
        [Attributes.HitBehavior.Player, {
                knockback: {
                    flash: true,
                    immobilize: false,
                    invincible: true,
                },
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
    class CollisionDamage extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.CollisionShape.name,
                Component.Health.name,
            ]);
            this.dirtyComponents = new Set([
                Component.CollisionShape.name,
            ]);
        }
        isDamageImmune(aspect) {
            return aspect.has(Component.Invincible) || aspect.has(Component.Dead);
        }
        isValidAttack(entity) {
            let otherComps = this.ecs.getComponents(entity);
            if (!otherComps.has(Component.CollisionShape) || !otherComps.has(Component.Position)) {
                console.error('Attack did not have either CollisionBox Position component. Ignoring.');
                return false;
            }
            let otherBox = otherComps.get(Component.CollisionShape);
            if (!otherBox.cTypes.has(CollisionType.Attack)) {
                return false;
            }
            if (!otherComps.has(Component.Attack)) {
                console.error('Weapon CollisionBox did have an Attack component?!?');
                return false;
            }
            return true;
        }
        canDamage(victim, attackEntity) {
            if (victim.has(Component.PlayerInput)) {
                return true;
            }
            let otherCShape = this.ecs.getComponents(attackEntity).get(Component.CollisionShape);
            if (!otherCShape.cTypes.has(CollisionType.Environment)) {
                return true;
            }
            if (!victim.has(Component.Activity)) {
                console.warn('Victim has no Component.Activity. Assuming non-damagable by Environment.');
                return false;
            }
            let action = victim.get(Component.Activity).action;
            return !envImmuneEnemyActions.has(action);
        }
        applyDamage(victim, attackEntity) {
            let pos = victim.get(Component.Position);
            let health = victim.get(Component.Health);
            let otherComps = this.ecs.getComponents(attackEntity);
            let otherBox = otherComps.get(Component.CollisionShape);
            let attackComp = otherComps.get(Component.Attack);
            let angleVtoA = System.Util.angleAtoB(this.ecs, victim.entity, attackComp.attacker);
            let angleAtoV = angleClamp(angleVtoA + Math.PI);
            health.current = Math.max(0, health.current - attackComp.info.damage);
            otherBox.collisionsResolved.add(victim.entity);
            attackComp.hit = true;
            if (attackComp.info.damage > 0) {
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
        applyKnockback(victim) {
            if (!victim.has(Component.Attributes)) {
                console.error('Tried to knockback entity but lacked Attributes Component (for timing).');
                return;
            }
            let attribs = victim.get(Component.Attributes);
            if (attribs.data.hitSettings == null) {
                console.error('Tried to knockback entity but lacked hitSettings Attribute data.');
                return;
            }
            System.Util.addOrExtend(this.ecs, victim.entity, Component.Knockback, attribs.data.hitSettings.knockbackAnimDuration);
            if (victim.has(Component.Animatable)) {
                let anim = victim.get(Component.Animatable);
                anim.reset = true;
            }
        }
        applyStagger(victim, attackEntity) {
            let otherComps = this.ecs.getComponents(attackEntity);
            let attack = otherComps.get(Component.Attack);
            let angleVtoA = System.Util.angleAtoB(this.ecs, victim.entity, attack.attacker);
            let angleAtoV = angleClamp(angleVtoA + Math.PI);
            if (!victim.has(Component.Attributes)) {
                console.error('Tried to stagger entity but lacked Attributes Component.');
                return;
            }
            let attribs = victim.get(Component.Attributes);
            if (attribs.data.hitSettings == null) {
                console.error('Tried to stagger entity but lacked hitSettings Attribute data.');
                return;
            }
            this.ecs.addComponent(victim.entity, new Component.Stagger(attribs.data.hitSettings.staggerDuration));
            if (!victim.has(Component.PlayerInput)) {
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
        applyKnockbackStagger(victim, attackEntity) {
            let isKnockbackable = victim.has(Component.Knockbackable);
            let isStaggerable = victim.has(Component.Staggerable);
            let otherComps = this.ecs.getComponents(attackEntity);
            let attack = otherComps.get(Component.Attack);
            let doStagger = isStaggerable && attack.info.damage > 0 && attack.info.attackType == Weapon.AttackType.Combo;
            let doKnockback = isKnockbackable && attack.info.damage > 0 && (!doStagger);
            if (doKnockback) {
                this.applyKnockback(victim);
            }
            if (doStagger) {
                this.applyStagger(victim, attackEntity);
            }
            return [doKnockback, doStagger];
        }
        applyForces(victim, attackEntity, doKnockback, doStagger) {
            if (!doKnockback && !doStagger) {
                return;
            }
            let pos = victim.get(Component.Position);
            let otherComps = this.ecs.getComponents(attackEntity);
            let attack = otherComps.get(Component.Attack);
            let attackerComps = this.ecs.getComponents(attack.attacker);
            let angleVtoA = System.Util.angleAtoB(this.ecs, victim.entity, attack.attacker);
            if ((!victim.has(Component.Input)) ||
                (attackerComps == null) ||
                (!attackerComps.has(Component.Position))) {
                return;
            }
            let scale = attack.info.damage > 0 ? 1.0 : CollisionDamage.BLOCK_FORCE_DAMPEN;
            let input = victim.get(Component.Input);
            let attackerPos = attackerComps.get(Component.Position);
            let forceMag = doStagger ? attack.info.staggerForce : attack.info.knockbackForce;
            let force = Physics.forceFromPoints(attackerPos.p, pos.p, forceMag * scale);
            input.forceQueue.push(force);
            pos.angle = angleVtoA;
        }
        applyBehaviors(victim, doKnockback, doStagger) {
            if (!doKnockback && !doStagger) {
                return;
            }
            if (doKnockback && doStagger) {
                console.error('Tried to apply knockback AND stagger on same frame?');
                return;
            }
            if (!victim.has(Component.Attributes)) {
                console.error('Tried to apply knockback or stagger to entity but lacked Attributes Component (for timing).');
                return;
            }
            let attribs = victim.get(Component.Attributes);
            let details = hitBehaviorMap.get(attribs.data.hitSettings.hitBehavior);
            let props = doKnockback ? details.knockback : details.stagger;
            let duration = doKnockback ?
                attribs.data.hitSettings.knockbackBehaviorDuration :
                attribs.data.hitSettings.staggerDuration + attribs.data.hitSettings.staggerReturnDuration;
            if (props.flash) {
                System.Util.addOrExtend(this.ecs, victim.entity, Component.DamagedFlash, duration);
            }
            if (props.immobilize) {
                System.Util.addOrExtend(this.ecs, victim.entity, Component.Immobile, duration);
            }
            if (props.invincible) {
                System.Util.addOrExtend(this.ecs, victim.entity, Component.Invincible, duration);
            }
        }
        applyFx(victim, dealt) {
            if (dealt <= 0) {
                return;
            }
            if (!victim.has(Component.Attributes)) {
                return;
            }
            let attribs = victim.get(Component.Attributes);
            System.Bleeding.begin(this.ecs, victim.entity, attribs.data.hitBlood);
        }
        update(delta, entities, dirty) {
            for (let entity of dirty) {
                let aspect = entities.get(entity);
                if (this.isDamageImmune(aspect)) {
                    continue;
                }
                let cShape = aspect.get(Component.CollisionShape);
                for (let otherEntity of cShape.collisionsFresh.keys()) {
                    if (this.isDamageImmune(aspect)) {
                        continue;
                    }
                    if (!this.isValidAttack(otherEntity)) {
                        continue;
                    }
                    if (!this.canDamage(aspect, otherEntity)) {
                        continue;
                    }
                    let dealt = this.applyDamage(aspect, otherEntity);
                    let [doKnockback, doStagger] = this.applyKnockbackStagger(aspect, otherEntity);
                    this.applyForces(aspect, otherEntity, doKnockback, doStagger);
                    this.applyBehaviors(aspect, doKnockback, doStagger);
                    this.applyFx(aspect, dealt);
                }
            }
        }
    }
    CollisionDamage.BLOCK_FORCE_DAMPEN = 0.5;
    System.CollisionDamage = CollisionDamage;
})(System || (System = {}));
var System;
(function (System) {
    class CollisionMovement extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.CollisionShape.name,
                Component.Input.name,
            ]);
        }
        leastCollidingAxis(p1, input, cInfo) {
            let v = new Point(cInfo.axis.x, cInfo.axis.y);
            v.scale_(-cInfo.amount);
            p1.p = p1.p.add_(v);
        }
        resolveCollisions(position, input, box) {
            let hitSolidStationary = false;
            for (let [colliderEntity, cInfo] of box.collisionsFresh.entries()) {
                let colliderComps = this.ecs.getComponents(colliderEntity);
                let colliderBox = colliderComps.get(Component.CollisionShape);
                if (!colliderBox.cTypes.has(CollisionType.Solid)) {
                    continue;
                }
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
                if (cShape.cTypes.has(CollisionType.Mobile) && cShape.cTypes.has(CollisionType.Solid) &&
                    cShape.collisionsFresh.size > 0) {
                    let hitSolidStationary = this.resolveCollisions(position, input, cShape);
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
var System;
(function (System) {
    class CollisionSet {
        constructor(required) {
            this.required = required;
            this.implementers = new Set();
        }
    }
    class Collider {
        constructor(ecs, debugName, left, right) {
            this.ecs = ecs;
            this.debugName = debugName;
            this.left = left;
            this.right = right;
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
                    if (l != r && this.right.implementers.has(r)) {
                        res.add(r);
                    }
                }
            }
            return res;
        }
        update(allColliders) {
            let cheapCollisionChecks = 0;
            let expensiveCollisionChecks = 0;
            for (let l of this.left.implementers) {
                let c1 = this.ecs.getComponents(l);
                let p1 = c1.get(Component.Position);
                let s1 = c1.get(Component.CollisionShape);
                if (s1.disabled) {
                    continue;
                }
                for (let r of this.getCandidates(l, p1, s1)) {
                    let c2 = this.ecs.getComponents(r);
                    let p2 = c2.get(Component.Position);
                    let s2 = c2.get(Component.CollisionShape);
                    if (s2.disabled) {
                        continue;
                    }
                    cheapCollisionChecks++;
                    this.cacheC1.copyFrom_(p1.p).add_(s1.offset);
                    this.cacheC2.copyFrom_(p2.p).add_(s2.offset);
                    if (this.cacheC1.sqDistTo(this.cacheC2) > s1.sqMaxDistance + s2.sqMaxDistance + 2 * s1.maxDistance * s2.maxDistance) {
                        continue;
                    }
                    expensiveCollisionChecks++;
                    let v1 = s1.getVertices(p1.p, p1.angle);
                    let a1 = s1.getAxes(p1.p, p1.angle);
                    let v2 = s2.getVertices(p2.p, p2.angle);
                    let a2 = s2.getAxes(p2.p, p2.angle);
                    if (!this.sat.collides(v1, a1, v2, a2, this.cacheCol)) {
                        continue;
                    }
                    if (s1.collisionsResolved.has(r) || s2.collisionsResolved.has(l)) {
                        continue;
                    }
                    s1.collisionsFresh.set(r, this.cacheCol.copy());
                    s2.collisionsFresh.set(l, this.cacheCol.copy().rev());
                    allColliders.push(s1, s2);
                }
            }
            return [cheapCollisionChecks, expensiveCollisionChecks];
        }
    }
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
            this.colliders.push(new Collider(this.ecs, 'mobile+solid / solid', new CollisionSet(new Set([CollisionType.Mobile, CollisionType.Solid])), new CollisionSet(new Set([CollisionType.Solid]))));
            this.colliders.push(new Collider(this.ecs, 'mobile+attack / vulnerable', new CollisionSet(new Set([CollisionType.Mobile, CollisionType.Attack])), new CollisionSet(new Set([CollisionType.Vulnerable]))));
            this.colliders.push(new Collider(this.ecs, 'mobile+vulnerable / attack+environment', new CollisionSet(new Set([CollisionType.Mobile, CollisionType.Vulnerable])), new CollisionSet(new Set([CollisionType.Attack, CollisionType.Environment]))));
            this.colliders.push(new Collider(this.ecs, 'shield / attack', new CollisionSet(new Set([CollisionType.Shield])), new CollisionSet(new Set([CollisionType.Attack]))));
            this.colliders.push(new Collider(this.ecs, 'player / logic', new CollisionSet(new Set([CollisionType.Mobile, CollisionType.Solid])), new CollisionSet(new Set([CollisionType.Logic]))));
            this.colliders.push(new Collider(this.ecs, 'player / item', new CollisionSet(new Set([CollisionType.Player, CollisionType.Solid])), new CollisionSet(new Set([CollisionType.Item]))));
            this.colliders.push(new Collider(this.ecs, 'physics / mobile', new CollisionSet(new Set([CollisionType.Physics])), new CollisionSet(new Set([CollisionType.Mobile]))));
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
            while (this.prevColliders.length > 0) {
                this.prevColliders.pop().collisionsFresh.clear();
            }
            let expensiveCollisionChecks = 0;
            let cheapCollisionChecks = 0;
            for (let collider of this.colliders) {
                clockTower.start(Measurement.T_COLL_COLLIDERS, collider.debugName);
                let [c, e] = collider.update(this.prevColliders);
                cheapCollisionChecks += c;
                expensiveCollisionChecks += e;
                clockTower.end(Measurement.T_COLL_COLLIDERS, collider.debugName);
            }
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
var Component;
(function (Component) {
    class Dummy extends Engine.Component {
    }
    Component.Dummy = Dummy;
})(Component || (Component = {}));
var Component;
(function (Component) {
    class PlayerInput extends Engine.Component {
    }
    Component.PlayerInput = PlayerInput;
})(Component || (Component = {}));
var System;
(function (System) {
    let GameButtonAction;
    (function (GameButtonAction) {
        GameButtonAction[GameButtonAction["Nothing"] = 0] = "Nothing";
        GameButtonAction[GameButtonAction["Press"] = 1] = "Press";
        GameButtonAction[GameButtonAction["HoldStart"] = 2] = "HoldStart";
        GameButtonAction[GameButtonAction["HoldRelease"] = 3] = "HoldRelease";
    })(GameButtonAction || (GameButtonAction = {}));
    class GameButton {
        constructor(HOLD_THRESHOLD = 150) {
            this.HOLD_THRESHOLD = HOLD_THRESHOLD;
            this.action = GameButtonAction.Nothing;
            this.isDown = false;
            this.timeDown = 0;
        }
        determineAction(down, delta) {
            if (!this.isDown && !down) {
                return GameButtonAction.Nothing;
            }
            if (!this.isDown && down) {
                this.isDown = true;
                this.timeDown = 0;
                return GameButtonAction.Nothing;
            }
            if (this.isDown && down) {
                this.timeDown += delta;
                if (this.timeDown >= this.HOLD_THRESHOLD && this.timeDown - delta < this.HOLD_THRESHOLD) {
                    return GameButtonAction.HoldStart;
                }
            }
            if (this.isDown && !down) {
                this.isDown = false;
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
    function clampReal(raw) {
        let lim = 0.12;
        if ((raw > 0 && raw < lim) || (raw < 0 && raw > -lim)) {
            return 0;
        }
        return raw;
    }
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
            this.idle = true;
            this.lastActiveWallTimestamp = 0;
        }
        update(delta, entities) {
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
            if (!this.gamepadDetectionShown) {
                this.ecs.getSystem(System.GUIManager).runSequence('notification', new Map([['notification', 'gamepad detected']]));
                this.gamepadDetectionShown = true;
            }
            this.intentMove.set_(clampReal(gp.axes[0]), clampReal(gp.axes[1]));
            this.intentFace.set_(clampReal(gp.axes[2]), -clampReal(gp.axes[3]));
            if (gp.buttons[12].pressed || gp.buttons[13].pressed ||
                gp.buttons[14].pressed || gp.buttons[15].pressed) {
                this.intentMove.set_(-gp.buttons[14].value + gp.buttons[15].value, gp.buttons[13].value - gp.buttons[12].value);
            }
            if (this.intentFace.isZero()) {
                this.intentFace.copyFrom_(this.intentMove);
                this.intentFace.y = -this.intentFace.y;
            }
            let curQuickAttack = gp.buttons[0].pressed || gp.buttons[1].pressed || gp.buttons[2].pressed || gp.buttons[5].pressed;
            this.quickAttack = !this.prevQuickAttack && curQuickAttack;
            this.prevQuickAttack = curQuickAttack;
            let curSwitchWeapon = gp.buttons[3].pressed;
            this.switchWeapon = !this.prevSwitchWeapon && curSwitchWeapon;
            this.prevSwitchWeapon = curSwitchWeapon;
            this.block = gp.buttons[4].pressed || gp.buttons[6].pressed || gp.buttons[7].pressed;
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
            if (this.intentMove.isZero() &&
                this.intentFace.isZero() &&
                !curQuickAttack &&
                !curSwitchWeapon &&
                !curMenu &&
                !curDebug) {
                this.idleFor = Math.min(this.idleFor + 1, this.idleFrames);
            }
            else {
                this.idleFor = 0;
                this.lastActiveWallTimestamp = this.ecs.walltime;
            }
            this.idle = this.idleFor >= this.idleFrames;
        }
    }
    System.InputGamepad = InputGamepad;
    class InputKeyboard extends Engine.System {
        constructor(keyboard) {
            super();
            this.keyboard = keyboard;
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
            this.intent = new Point();
            this.quickAttacking = false;
            this.attacking = false;
            this.blocking = false;
            this.switching = false;
            this.controls = false;
            this.prev_quickAttacking = false;
            this.prev_left = false;
            this.prev_right = false;
            this.prev_down = false;
            this.prev_up = false;
            this.prev_switching = false;
            this.prev_controls = false;
            this.prev_intent = new Point();
        }
        static resolve_pair(prev_a, a, prev_b, b, prev) {
            if (!a && !b) {
                return 0;
            }
            else if (a && !b) {
                return -1;
            }
            else if (!a && b) {
                return 1;
            }
            if (prev_a && !prev_b) {
                return 1;
            }
            else if (!prev_a && prev_b) {
                return -1;
            }
            else if (!prev_a && !prev_b) {
                return 1;
            }
            else {
                return prev;
            }
        }
        update(delta, entities) {
            let switching = this.keyboard.gamekeys.get(GameKey.E).isDown;
            let controls = this.keyboard.gamekeys.get(GameKey.Enter).isDown;
            let left = this.keyboard.gamekeys.get(GameKey.A).isDown;
            let right = this.keyboard.gamekeys.get(GameKey.D).isDown;
            let up = this.keyboard.gamekeys.get(GameKey.W).isDown;
            let down = this.keyboard.gamekeys.get(GameKey.S).isDown;
            let quickAttacking = this.keyboard.gamekeys.get(GameKey.Space).isDown;
            this.blocking = this.keyboard.gamekeys.get(GameKey.ShiftLeft).isDown;
            this.intent.x = InputKeyboard.resolve_pair(this.prev_left, left, this.prev_right, right, this.prev_intent.x);
            this.intent.y = InputKeyboard.resolve_pair(this.prev_up, up, this.prev_down, down, this.prev_intent.y);
            this.controls = controls && !this.prev_controls;
            this.switching = switching && !this.prev_switching;
            this.quickAttacking = quickAttacking && !this.prev_quickAttacking;
            this.attacking = false;
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
    function setFromPIXI(mutate, from) {
        mutate.set_(from.x, from.y);
    }
    class InputMouse extends Engine.System {
        constructor(mouse, hud, world) {
            super(false, true);
            this.mouse = mouse;
            this.hud = hud;
            this.world = world;
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
            this.worldPosition = new Point();
            this.quickAttacking = false;
            this.blocking = false;
            this.prevQuickAttacking = false;
            this.prevBlocking = false;
            this.curHUDPosition = new Point();
            this.prevHUDPosition = new Point();
            this.lastActiveWallTimestamp = 0;
            this.cacheWorldPosition = new PIXI.Point();
        }
        update(delta, entities) {
            this.world.toLocal(this.mouse.hudPosition, this.hud, this.cacheWorldPosition, true);
            this.worldPosition.set_(this.cacheWorldPosition.x, this.cacheWorldPosition.y);
            let curQuickAttacking = this.mouse.leftDown;
            this.quickAttacking = curQuickAttacking && (!this.prevQuickAttacking);
            this.blocking = this.mouse.rightDown;
            setFromPIXI(this.curHUDPosition, this.mouse.hudPosition);
            if (curQuickAttacking != this.prevQuickAttacking ||
                this.blocking != this.prevBlocking ||
                !this.curHUDPosition.equals(this.prevHUDPosition)) {
                this.lastActiveWallTimestamp = this.ecs.walltime;
            }
            this.prevHUDPosition.copyFrom_(this.curHUDPosition);
            this.prevQuickAttacking = curQuickAttacking;
            this.prevBlocking = this.blocking;
        }
    }
    System.InputMouse = InputMouse;
    function getClosest(ecs, from, over, within, skipDead) {
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
    class DebugEntitySelector extends Engine.System {
        constructor(inputMouse) {
            super(true, true);
            this.inputMouse = inputMouse;
            this.componentsRequired = new Set([
                Component.Position.name,
            ]);
        }
        update(delta, entities) {
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
            if (this.inputGamepad.idle) {
                return;
            }
            for (let aspect of entities.values()) {
                let input = aspect.get(Component.Input);
                input.intent.copyFrom_(this.inputGamepad.intentMove);
                if (!this.inputGamepad.intentMove.isZero() || !this.inputGamepad.intentFace.isZero()) {
                    input.targetAngle = Math.atan2(this.inputGamepad.intentFace.y, this.inputGamepad.intentFace.x);
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
    class PlayerInputMouseKeyboard extends Engine.System {
        constructor(inputMouse, inputKeyboard, inputGamepad, enemySelector) {
            super(true);
            this.inputMouse = inputMouse;
            this.inputKeyboard = inputKeyboard;
            this.inputGamepad = inputGamepad;
            this.enemySelector = enemySelector;
            this.componentsRequired = new Set([
                Component.Input.name,
                Component.PlayerInput.name,
            ]);
        }
        update(delta, entities) {
            for (let aspect of entities.values()) {
                let mouseWorld = this.inputMouse.worldPosition;
                let input = aspect.get(Component.Input);
                let position = aspect.get(Component.Position);
                let closestEnemy = getClosest(this.ecs, mouseWorld, this.enemySelector.latest(), PlayerInputMouseKeyboard.MAX_LOCKON_DIST, true);
                if (closestEnemy != null) {
                    let enemyComps = this.ecs.getComponents(closestEnemy);
                    let enemyPos = enemyComps.get(Component.Position);
                    mouseWorld.copyFrom_(enemyPos.p);
                    if (!enemyComps.has(Component.LockOn)) {
                        this.ecs.addComponent(closestEnemy, new Component.LockOn());
                    }
                    else {
                        (enemyComps.get(Component.LockOn)).fresh = true;
                    }
                }
                const thresh = PlayerInputMouseKeyboard.MIN_ANG_DIST;
                if (position.p.manhattanTo(mouseWorld) > thresh) {
                    if (this.inputMouse.lastActiveWallTimestamp > this.inputGamepad.lastActiveWallTimestamp) {
                        input.targetAngle = position.p.pixiAngleTo(mouseWorld);
                    }
                    this.inputKeyboard.intent.copyTo(input.intent);
                }
                else {
                    input.intent.set_(0, 0);
                }
                input.quickAttack = this.inputKeyboard.quickAttacking || this.inputMouse.quickAttacking;
                input.block = this.inputKeyboard.blocking || this.inputMouse.blocking;
                input.switchWeapon = this.inputKeyboard.switching;
                input.controls = this.inputKeyboard.controls;
            }
        }
    }
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
            let color = 0x000000;
            let opacity = 0.7;
            let length = 30;
            let width = 6;
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
                System.DebugCollisionRenderer.name,
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
var System;
(function (System) {
    class DefendAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            this.elapsed = 0;
            this.startedBlock = false;
            this.ongoingBlock = undefined;
            this._state = Shield.BlockState.Idle;
        }
        get state() {
            return this._state;
        }
        set state(next) {
            this.elapsed = 0;
            this.startedBlock = false;
            this._state = next;
        }
    }
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
            let block = this.ecs.addEntity();
            this.ecs.addComponent(block, new Component.Position(new Point(refpos.p.x, refpos.p.y), refpos.angle));
            let blockComponent = new Component.Block(blocker, -1, shield);
            this.ecs.addComponent(block, blockComponent);
            this.ecs.addComponent(block, Component.CollisionShape.buildRectangle(shield.block.cboxDims.copy(), new Set([CollisionType.Mobile, CollisionType.Shield])));
            this.ecs.addComponent(block, new Component.Tracker(blocker, shield.block.cboxOffset.copy(), true));
            return blockComponent;
        }
        updateState(delta, aspect) {
            aspect.elapsed += delta;
            let pos = aspect.get(Component.Position);
            let input = aspect.get(Component.Input);
            let shielded = aspect.get(Component.Shielded);
            let shield = shielded.active;
            let attacking = aspect.has(Component.Armed) &&
                (aspect.get(Component.Armed)).state != Weapon.SwingState.Idle;
            if (aspect.has(Component.Dead) ||
                aspect.has(Component.Knockback) ||
                aspect.has(Component.Stagger) ||
                aspect.has(Component.StaggerReturn) ||
                aspect.has(Component.Blocked) ||
                attacking) {
                if (aspect.startedBlock) {
                    aspect.ongoingBlock.fuse = true;
                    aspect.state = Shield.BlockState.Idle;
                }
                aspect.state = Shield.BlockState.Idle;
                shielded.state = Shield.BlockState.Idle;
                return;
            }
            switch (aspect.state) {
                case Shield.BlockState.Idle: {
                    if (input.block) {
                        aspect.state = Shield.BlockState.Block;
                    }
                    break;
                }
                case Shield.BlockState.Block: {
                    if (!aspect.startedBlock) {
                        aspect.ongoingBlock = this.startBlock(aspect.entity, pos, shield);
                        aspect.startedBlock = true;
                    }
                    if (!input.block) {
                        aspect.ongoingBlock.fuse = true;
                        aspect.state = Shield.BlockState.Idle;
                    }
                    break;
                }
            }
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
            let left = this.keyboard.gamekeys.get(GameKey.Left).isDown;
            let right = this.keyboard.gamekeys.get(GameKey.Right).isDown;
            let up = this.keyboard.gamekeys.get(GameKey.Up).isDown;
            let down = this.keyboard.gamekeys.get(GameKey.Down).isDown;
            let zoomin = this.keyboard.gamekeys.get(GameKey.Equal).isDown;
            let zoomout = this.keyboard.gamekeys.get(GameKey.Minus).isDown;
            this.intent.x = System.InputKeyboard.resolve_pair(this.prev_left, left, this.prev_right, right, this.prev_intent.x);
            this.intent.y = System.InputKeyboard.resolve_pair(this.prev_up, up, this.prev_down, down, this.prev_intent.y);
            let zoom = System.InputKeyboard.resolve_pair(this.prev_out, zoomout, this.prev_in, zoomin, this.prev_zoom);
            this.intent.copyTo(this.prev_intent);
            this.prev_zoom = zoom;
            this.prev_left = left;
            this.prev_right = right;
            this.prev_up = up;
            this.prev_down = down;
            this.prev_in = zoomin;
            this.prev_out = zoomout;
            this.stage.x -= 5 * this.intent.x;
            this.stage.y -= 5 * this.intent.y;
            let scale = this.stage.scale.x + 0.01 * zoom;
            this.stage.scale.set(scale, scale);
        }
    }
    System.DebugCamera = DebugCamera;
})(System || (System = {}));
var Physics;
(function (Physics) {
    let Shape;
    (function (Shape) {
        Shape[Shape["Rectangle"] = 0] = "Rectangle";
        Shape[Shape["Polygon"] = 1] = "Polygon";
    })(Shape = Physics.Shape || (Physics.Shape = {}));
    function rectVertices(dims, angle, out, offset = new Point()) {
        let center_x = 0;
        let center_y = 0;
        let midToCorner = Math.atan2(dims.y / 2, dims.x / 2);
        let diag;
        let sinMidCorner = Math.sin(midToCorner);
        if (sinMidCorner == 0) {
            diag = (dims.x / 2) / Math.cos(midToCorner);
        }
        else {
            diag = (dims.y / 2) / Math.sin(midToCorner);
        }
        let beta_3 = angle + midToCorner;
        let dx_3 = diag * Math.cos(beta_3);
        let dy_3 = diag * Math.sin(beta_3);
        let beta_4 = angle - midToCorner;
        let dx_4 = diag * Math.cos(beta_4);
        let dy_4 = diag * Math.sin(beta_4);
        out[0].set_(offset.x + center_x - dx_3, offset.y + center_y + dy_3);
        out[1].set_(offset.x + center_x - dx_4, offset.y + center_y + dy_4);
        out[2].set_(offset.x + center_x + dx_3, offset.y + center_y - dy_3);
        out[3].set_(offset.x + center_x + dx_4, offset.y + center_y - dy_4);
    }
    Physics.rectVertices = rectVertices;
    function getEdges(vertices, out, limit = null) {
        let n = limit || vertices.length;
        if (out.length != n) {
            throw new Error('Must provide ' + n + ' edges for output.');
        }
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
    function getNormals(vectors, out) {
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
        stretchParticle(box) {
            let dobj = Stage.Sprite.build('particles/particle1.png', ZLevelWorld.DEBUG, StageTarget.World, new Point(0, 0), new Point(0.5, 0.5));
            dobj.width = box.rectDims.x;
            dobj.height = box.rectDims.y;
            return dobj;
        }
        fromGraphics(box) {
            let vertices = flattenPoints(box.localVertices);
            let g = new PIXI.Graphics();
            g.beginFill(0xffffff, 1.0);
            g.drawPolygon(vertices);
            g.endFill();
            let s = new Stage.Sprite(g.generateCanvasTexture(), ZLevelWorld.DEBUG, StageTarget.World);
            s.anchor.set(0.5, 0.5);
            return s;
        }
        makeDisplayObj(box) {
            if (box.shape === Physics.Shape.Rectangle) {
                return this.stretchParticle(box);
            }
            return this.fromGraphics(box);
        }
        onAdd(aspect) {
            let position = aspect.get(Component.Position);
            let box = aspect.get(Component.CollisionShape);
            aspect.textureBox = this.makeDisplayObj(box);
            aspect.textureBox.alpha = 0.5;
            aspect.textureBox.visible = !this.disabled;
            this.updateDisplayObj(aspect.textureBox, position.p, box, position.angle);
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
            let color = 0x0000ff;
            if (box.collisionsResolved.size > 0) {
                color = 0x00ff00;
            }
            if (box.collisionsFresh.size > 0) {
                color = 0xff0000;
            }
            if (box.disabled) {
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
    class AverageClock {
        constructor() {
            this.startTime = -1;
            this.elapsedSum = 0;
            this.elapsedNum = 0;
        }
        start() {
            this.startTime = (performance || Date).now();
        }
        end() {
            this.elapsedSum += (performance || Date).now() - this.startTime;
            this.elapsedNum++;
        }
        manualAdd(sum, num) {
            this.elapsedSum += sum;
            this.elapsedNum += num;
        }
        report() {
            let avg = this.elapsedSum / this.elapsedNum;
            this.elapsedSum = 0;
            this.elapsedNum = 0;
            return round(avg, 4);
        }
    }
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
            res.sort((a, b) => { return b.time - a.time; });
            return res;
        }
    }
    class FakeClockTower {
        init() { }
        start(clockGroup, component) { }
        end(clockGroup, component) { }
        manualAdd(clockGroup, component, sum, num) { }
        report() { return new Map(); }
    }
    Measurement.FakeClockTower = FakeClockTower;
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
function sumTimes(total, val) {
    return total + val.time;
}
var System;
(function (System) {
    class DebugTimingRenderer extends Engine.System {
        constructor(stage, clocks, viewportSize, display = 15) {
            super(true, true);
            this.stage = stage;
            this.clocks = clocks;
            this.viewportSize = viewportSize;
            this.display = display;
            this.redrawEveryFrames = 120;
            this.width = 150;
            this.height = 15;
            this.spacing = 3;
            this.buffer = 5;
            this.sinceLastRedraw = this.redrawEveryFrames;
            this.sectionViews = new Map();
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
        }
        ensureSectionView(section) {
            if (!this.sectionViews.has(section)) {
                let header = new PIXI.Text(section, {
                    fontFamily: 'Josefin Sans',
                    fill: '#ffffff',
                    fontSize: this.height,
                });
                header.alpha = 0.9;
                header.anchor.set(1, 0);
                header.position.set(this.viewportSize.x - this.buffer, 0);
                let cont = new Stage.Container(ZLevelHUD.DEBUG, StageTarget.HUD);
                cont.addChild(header);
                this.stage.add(cont);
                this.sectionViews.set(section, {
                    cont: cont,
                    header: header,
                    records: new Map(),
                });
            }
            return this.sectionViews.get(section);
        }
        ensureRecordView(sectionView, recordName) {
            if (!sectionView.records.has(recordName)) {
                let tintStr = '#ffffff';
                let tintNum = parseInt(tintStr.slice(1), 16);
                let bar = Stage.buildPIXISprite('particles/particle1.png', new Point(0, 0), new Point(1, 0));
                bar.width = 1;
                bar.height = this.height;
                bar.alpha = 0.9;
                bar.tint = tintNum;
                let txt = new PIXI.Text(recordName, {
                    fontFamily: 'Josefin Sans',
                    fill: tintStr,
                    fontSize: this.height,
                });
                txt.alpha = 0.9;
                txt.anchor.set(1, 0);
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
            return sectionView.records.get(recordName);
        }
        updateView(rv, record, totalTime, i) {
            let cont = rv.cont;
            cont.visible = true;
            cont.position.x = this.viewportSize.x - this.buffer;
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
            sectionView.cont.y = startY;
            let totalTime = 0;
            for (let record of records) {
                totalTime += record.time;
            }
            let prevRecordNames = new Set(mapKeyArr(sectionView.records));
            for (let i = 0; i < records.length && i < this.display; i++) {
                let record = records[i];
                let rv = this.ensureRecordView(sectionView, record.name);
                this.updateView(rv, record, totalTime, i);
                prevRecordNames.delete(record.name);
            }
            for (let entry of prevRecordNames.values()) {
                sectionView.records.get(entry).cont.visible = false;
            }
            prevRecordNames.clear();
        }
        onDisabled(entities) {
            for (let sectionView of this.sectionViews.values()) {
                sectionView.cont.visible = false;
            }
            this.sinceLastRedraw = this.redrawEveryFrames;
        }
        update(delta, entities) {
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
var Tween;
(function (Tween) {
    Tween.Infinite = -1;
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
    function linearCycle(elapsed, _, period) {
        let progress = (elapsed % period) / period;
        if (progress <= 0.5) {
            return progress / 0.5;
        }
        else {
            return 1 - ((progress - 0.5) / 0.5);
        }
    }
    Tween.linearCycle = linearCycle;
    function flashBetween(elapsed, _, period) {
        return Math.round(elapsed / period) % 2 == 0 ? 0 : 1;
    }
    Tween.flashBetween = flashBetween;
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
var Component;
(function (Component) {
    class CameraFollowable extends Engine.Component {
    }
    Component.CameraFollowable = CameraFollowable;
})(Component || (Component = {}));
var System;
(function (System) {
    class FollowCamera extends Engine.System {
        constructor(stage, viewportDims, sceneInfoProvider, zones) {
            super();
            this.stage = stage;
            this.viewportDims = viewportDims;
            this.sceneInfoProvider = sceneInfoProvider;
            this.zones = zones;
            this.roomWeight = 0.7;
            this.interpFrames = 60;
            this.interpStartPos = new Point(-1, -1);
            this.interpFramesReamining = 0;
            this.lastInRoom = true;
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.CameraFollowable.name,
            ]);
        }
        update(delta, entities) {
            if (entities.size == 0) {
                return;
            }
            let aspect = entities.values().next().value;
            let position = aspect.get(Component.Position);
            let centerX = position.p.x;
            let centerY = position.p.y;
            let inRoom = false;
            for (let zoneEntity of this.zones.latest()) {
                let zoneComps = this.ecs.getComponents(zoneEntity);
                let zoneComp = zoneComps.get(Component.Zone);
                if (!zoneComp.zoneTypes.has(Logic.ZoneType.Camera) ||
                    !zoneComp.containsPlayer) {
                    continue;
                }
                let roomPos = zoneComps.get(Component.Position);
                let roomBox = zoneComps.get(Component.CollisionShape);
                let roomCenterX = roomPos.p.x;
                let roomCenterY = roomPos.p.y;
                centerX = this.roomWeight * roomCenterX + (1.0 - this.roomWeight) * centerX;
                centerY = this.roomWeight * roomCenterY + (1.0 - this.roomWeight) * centerY;
                inRoom = true;
                break;
            }
            let interpStart = false;
            if (this.lastInRoom != inRoom) {
                this.interpFramesReamining = this.interpFrames;
                this.interpStartPos.set_(this.stage.x, this.stage.y);
                interpStart = true;
            }
            this.lastInRoom = inRoom;
            let w = this.viewportDims.x / this.stage.scale.x;
            let h = this.viewportDims.y / this.stage.scale.y;
            let targetX = centerX - w / 2;
            let targetY = centerY - h / 2;
            let levelDims = this.sceneInfoProvider.mapDims;
            targetX = Math.min(Math.max(targetX, 0), levelDims.x - w);
            targetY = Math.min(Math.max(targetY, 0), levelDims.y - h);
            targetX = (-targetX) * this.stage.scale.x;
            targetY = (-targetY) * this.stage.scale.y;
            if ((this.stage.x == 0 && this.stage.y == 0) || this.interpFramesReamining == 0) {
                this.stage.x = targetX;
                this.stage.y = targetY;
            }
            else {
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
var System;
(function (System) {
    class Selector extends Engine.System {
        constructor() {
            super(...arguments);
            this._latest = new Map();
        }
        latest() {
            return this._latest.keys();
        }
        update(delta, entities) {
            this._latest = entities;
        }
    }
    System.Selector = Selector;
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
var System;
(function (System) {
    function attacking(aspect) {
        if (!aspect.has(Component.Armed)) {
            return false;
        }
        let armed = aspect.get(Component.Armed);
        return armed.state == Weapon.SwingState.QuickAttack ||
            armed.state == Weapon.SwingState.QuickAttack2 ||
            armed.state == Weapon.SwingState.Swing;
    }
    function integrateExplicitEuler(p, v, a, t, out_p, out_v) {
        out_p.x = p.x + v.x * t;
        out_p.y = p.y + v.y * t;
        out_v.x = v.x + a.x * t;
        out_v.y = v.y + a.y * t;
    }
    function integrateSemiImplicitEuler(p, v, a, t, out_p, out_v) {
        out_v.x = v.x + a.x * t;
        out_v.y = v.y + a.y * t;
        out_p.x = p.x + out_v.x * t;
        out_p.y = p.y + out_v.y * t;
    }
    function integrateVerlet(p, prev_p, a, t, out_p, out_v) {
        let tsq = t * t;
        out_p.x = 2 * p.x - prev_p.x + a.x * tsq;
        out_p.y = 2 * p.y - prev_p.y + a.y * tsq;
        p.sub(prev_p, out_v);
    }
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
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Position.name,
                Component.Input.name,
            ]);
            this.cacheIntent = new Point();
            this.cacheA = new Point();
            this.cacheNextP = new Point();
            this.cacheNextV = new Point();
        }
        makeAspect() {
            return new MovementAspect();
        }
        update(delta, entities) {
            delta = delta / 100;
            for (let aspect of entities.values()) {
                let position = aspect.get(Component.Position);
                let input = aspect.get(Component.Input);
                input.intent.clampEach_(-1, 1);
                if (!aspect.prev_p_init) {
                    aspect.prev_p.copyFrom_(position.p);
                    aspect.start_p.copyFrom_(position.p);
                    aspect.prev_p_init = true;
                }
                let a = this.cacheA;
                a.set_(0, 0);
                let immobile = aspect.has(Component.Immobile);
                let dead = aspect.has(Component.Dead);
                let dampened = false;
                let inputOnly = false;
                let customDecel = false;
                let action = null;
                if (!dead && !immobile) {
                    switch (input.movement.movementType) {
                        case Physics.MovementType.RotateMove: {
                            position.angle += input.intent.x * input.movement.rotateSpeed;
                            break;
                        }
                        case Physics.MovementType.Strafe:
                        case Physics.MovementType.InstantTurn: {
                            position.angle = input.targetAngle || position.angle;
                            break;
                        }
                        default: {
                            throw new Error('Update this switch for new InputType.');
                        }
                    }
                    let moveAccel = input.movement.accel;
                    if (aspect.has(Component.Activity)) {
                        let activity = aspect.get(Component.Activity);
                        action = activity.action;
                        switch (activity.action) {
                            case Action.Idle:
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
                    switch (input.movement.movementType) {
                        case Physics.MovementType.RotateMove:
                        case Physics.MovementType.InstantTurn: {
                            if (input.intent.y != 0) {
                                a.x += input.intent.y * moveAccel * -Math.cos(position.angle);
                                a.y += input.intent.y * moveAccel * Math.sin(position.angle);
                                inputOnly = true;
                            }
                            else if (input.intent.x != 0) {
                                let rot = position.angle - Constants.HALF_PI;
                                a.x += input.intent.x * moveAccel * Math.cos(rot);
                                a.y += input.intent.x * moveAccel * -Math.sin(rot);
                                inputOnly = true;
                            }
                            break;
                        }
                        case Physics.MovementType.Strafe: {
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
                if (input.movement.static) {
                    position.p = aspect.prev_p;
                    continue;
                }
                if (input.bounce) {
                    aspect.v.scale_(-1 * Movement.BOUNCE_DAMPEN);
                }
                input.bounce = false;
                while (input.forceQueue.length > 0) {
                    let force = input.forceQueue.pop().scale_(input.movement.invMass);
                    a.add_(force);
                    inputOnly = false;
                }
                a.add_(input.collisionForce);
                input.collisionForce.set_(0, 0);
                let k_drag = customDecel ? input.movement.decel : Movement.K_DRAG;
                while (input.frictionQueue.length > 0) {
                    k_drag += input.frictionQueue.pop();
                }
                a.x += -k_drag * aspect.v.x;
                a.y += -k_drag * aspect.v.y;
                integrateSemiImplicitEuler(position.p, aspect.v, a, delta, this.cacheNextP, this.cacheNextV);
                if (action != null) {
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
                    if (maxSpeed != null) {
                        let vL2 = this.cacheNextV.l2();
                        if (vL2 > maxSpeed) {
                            this.cacheNextV.scale_(maxSpeed / vL2);
                        }
                    }
                }
                let vL2 = this.cacheNextV.l2();
                if (inputOnly && !dampened && vL2 < input.movement.minMoveSpeed) {
                    this.cacheNextV.scale_(input.movement.minMoveSpeed / vL2);
                }
                aspect.prev_p.copyFrom_(position.p);
                position.p = this.cacheNextP;
                aspect.v.copyFrom_(this.cacheNextV);
                position.debugSpeed = this.cacheNextV.l2();
            }
        }
    }
    Movement.K_DRAG = 0.3;
    Movement.BOUNCE_DAMPEN = 0.3;
    __decorate([
        override
    ], Movement.prototype, "makeAspect", null);
    System.Movement = Movement;
})(System || (System = {}));
var Component;
(function (Component) {
    class StaticRenderable extends Engine.Component {
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
var System;
(function (System) {
    class StaticRendererAspect extends Engine.Aspect {
    }
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
            let renderable = aspect.get(Component.StaticRenderable);
            let position = aspect.get(Component.Position);
            let sprite = new Stage.Sprite(PIXI.Texture.fromFrame(renderable.img), renderable.z, renderable.stageTarget);
            if (!renderable.manualDims.equalsCoords(0, 0)) {
                sprite.width = renderable.manualDims.x;
                sprite.height = renderable.manualDims.y;
            }
            sprite.anchor.set(renderable.anchor.x, renderable.anchor.y);
            sprite.position.set(position.p.x, position.p.y);
            sprite.rotation = angleFlip(position.angle);
            aspect.dobj = sprite;
            this.stage.add(aspect.dobj);
        }
        onRemove(aspect) {
            this.stage.remove(aspect.dobj);
        }
        update(delta, entities) {
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
var Component;
(function (Component) {
    class Blocked extends Component.Timebomb {
        constructor(duration) {
            super(duration, Destruct.Component);
            this.duration = duration;
        }
    }
    Blocked.DEFAULT_DURATION = 750;
    Component.Blocked = Blocked;
})(Component || (Component = {}));
var Component;
(function (Component) {
    class Recoil extends Component.Timebomb {
        constructor(duration = Recoil.DEFAULT_DURATION) {
            super(duration, Destruct.Component);
            this.duration = duration;
        }
    }
    Recoil.DEFAULT_DURATION = 300;
    Component.Recoil = Recoil;
})(Component || (Component = {}));
var System;
(function (System) {
    class SwingAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            this.elapsed = 0;
            this.startedAttack = false;
            this.startedQuickAttack = false;
            this.startedComboAttack = false;
            this.ongoingAttack = undefined;
            this.changed = false;
            this.eventsDispatched = false;
            this._state = Weapon.SwingState.Idle;
        }
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
        }
    }
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
        startAttack(attacker, attackerPos, attackerInput, attackInfo, partID) {
            let attack = this.ecs.addEntity();
            let pos = new Component.Position(new Point(attackerPos.p.x, attackerPos.p.y), attackerPos.angle);
            this.ecs.addComponent(attack, pos);
            let attackComp = new Component.Attack(attacker, attackInfo);
            this.ecs.addComponent(attack, attackComp);
            this.ecs.addComponent(attack, new Component.ActiveAttack());
            if (this.ecs.getComponents(attacker).has(Component.Comboable) &&
                attackInfo.movement == Weapon.AttackMovement.Track) {
                this.ecs.addComponent(attack, new Component.FromComboable());
            }
            let weaponCShape = Component.CollisionShape.buildRectangle(attackInfo.cboxDims.copy(), new Set(attackInfo.cTypes));
            weaponCShape.collisionsResolved.add(attacker);
            this.ecs.addComponent(attack, weaponCShape);
            attackerInput.forceQueue.push(Physics.forceFromAngle(attackerPos.angle, attackInfo.lungeForce));
            switch (attackInfo.movement) {
                case Weapon.AttackMovement.Track: {
                    this.ecs.addComponent(attack, new Component.Tracker(attacker, attackInfo.cboxOffset.copy(), true));
                    break;
                }
                case Weapon.AttackMovement.Launch: {
                    if (attackInfo.cboxOffset != null) {
                        pos.p = pos.p.add_(attackInfo.cboxOffset.copy().rotate_(-pos.angle));
                    }
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
            if (aspect.has(Component.Knockback) ||
                aspect.has(Component.Stagger) ||
                aspect.has(Component.StaggerReturn) ||
                aspect.has(Component.Dead) ||
                aspect.has(Component.Blocked) ||
                aspect.has(Component.Recoil) ||
                blocking) {
                if (aspect.startedAttack || aspect.startedQuickAttack || aspect.startedComboAttack) {
                    aspect.ongoingAttack.fuse = true;
                }
                aspect.state = Weapon.SwingState.Idle;
                armed.state = Weapon.SwingState.Idle;
                return;
            }
            switch (aspect.state) {
                case Weapon.SwingState.Idle: {
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
                            if (armed.inventory.length > 1) {
                                let audio = this.ecs.getSystem(System.Audio);
                                if (armed.active.partID == PartID.Bow) {
                                    audio.play(['switchToBow']);
                                }
                                else if (armed.active.partID == PartID.Sword) {
                                    audio.play(['switchToSword']);
                                }
                            }
                            if (aspect.has(Component.Animatable)) {
                                aspect.get(Component.Animatable).reset = true;
                            }
                        }
                    }
                    break;
                }
                case Weapon.SwingState.ChargeCharging: {
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
                case Weapon.SwingState.Swing: {
                    if (weapon.swingAttack == null) {
                        throw new Error('SwingAttack initiated for weapon without one!');
                    }
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
                case Weapon.SwingState.Sheathe: {
                    if (aspect.elapsed >= weapon.timing.sheatheDuration) {
                        aspect.state = Weapon.SwingState.Idle;
                    }
                    break;
                }
                case Weapon.SwingState.QuickAttack:
                case Weapon.SwingState.QuickAttack2: {
                    if (weapon.quickAttack == null) {
                        throw new Error('QuickAttack initiated for weapon without one!');
                    }
                    this.maybeDispatchEvent(aspect, weapon.quickAttack, Events.EventTypes.Swing);
                    let other = aspect.state == Weapon.SwingState.QuickAttack ?
                        Weapon.SwingState.QuickAttack2 :
                        Weapon.SwingState.QuickAttack;
                    if (!aspect.startedQuickAttack && aspect.elapsed >= weapon.timing.quickAttackAttackDelay) {
                        aspect.ongoingAttack = this.startAttack(aspect.entity, pos, input, weapon.quickAttack, weapon.partID);
                        aspect.startedQuickAttack = true;
                    }
                    if (input.quickAttack && aspect.elapsed >= weapon.timing.quickAttackNextWait) {
                        if (input.quickAttack && comboable !== null && comboable.comboReady) {
                            aspect.state = Weapon.SwingState.Combo;
                        }
                        else {
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
                    this.maybeDispatchEvent(aspect, weapon.comboAttack, Events.EventTypes.Swing);
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
var Stage;
(function (Stage) {
    let PlayDirection;
    (function (PlayDirection) {
        PlayDirection[PlayDirection["Forward"] = 0] = "Forward";
        PlayDirection[PlayDirection["Backward"] = 1] = "Backward";
    })(PlayDirection || (PlayDirection = {}));
    class AnimatableState {
        constructor() {
            this.curVisible = false;
            this.activeKeys = new Set();
            this.animations = new Map();
        }
    }
    Stage.AnimatableState = AnimatableState;
    class Animation extends PIXI.Sprite {
        get frame() {
            return this.curFrameIndex;
        }
        static loadTextures(base, frames) {
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
            let textures = Animation.loadTextures(bd.base, bd.frames);
            let anim = new Animation(textures, dd.z, dd.stageTarget, bd.speed, bd.playType);
            anim.anchor.set(bd.anchor.x, bd.anchor.y);
            anim.alpha = bd.alpha;
            anim.tint = bd.tint != null ? bd.tint : 0xffffff;
            anim.scale.set(bd.scale, bd.scale);
            return anim;
        }
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
            this.neverUpdate = this.nFrames < 2;
        }
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
        getTextureOrigin(out) {
            const sin_t = Math.sin(this.rotation);
            const cos_t = Math.cos(this.rotation);
            const sin_a = cos_t;
            const cos_a = sin_t;
            const w = this.width * this.anchor.x;
            const h = this.height * (1 - this.anchor.y);
            const wx = w * cos_t;
            const wy = w * sin_t;
            const hx = h * cos_a;
            const hy = h * sin_a;
            out.x = this.position.x - wx - hx;
            out.y = this.position.y - wy + hy;
        }
        computeNextFrameIdx() {
            switch (this.playType) {
                case Anim.PlayType.Loop: {
                    return this.curFrameIndex === this.nFrames - 1 ?
                        0 : this.curFrameIndex + 1;
                }
                case Anim.PlayType.PingPong: {
                    if (this.playDirection === PlayDirection.Forward &&
                        this.curFrameIndex === this.nFrames - 1) {
                        this.playDirection = PlayDirection.Backward;
                    }
                    else if (this.playDirection === PlayDirection.Backward &&
                        this.curFrameIndex === 0) {
                        this.playDirection = PlayDirection.Forward;
                    }
                    let delta = this.playDirection === PlayDirection.Forward ?
                        1 : -1;
                    return this.curFrameIndex + delta;
                }
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
        update(delta) {
            if (this.scale == null) {
                throw new Error('Scale should not be null');
            }
            if (this.neverUpdate) {
                return false;
            }
            this.timeInCurrentFrame += delta;
            if (this.timeInCurrentFrame < this.frameDuration) {
                return !this.noUpdateNeeded();
            }
            this.timeInCurrentFrame = 0;
            let nextFrameIndex = this.computeNextFrameIdx();
            this.switchFrames(nextFrameIndex);
            return !this.noUpdateNeeded();
        }
    }
    Animation.BrightnessFilter = 'BrightnessFilter';
    Stage.Animation = Animation;
})(Stage || (Stage = {}));
var System;
(function (System) {
    class ParticleRenderer extends Engine.System {
        constructor(stage, particleConfig, particleConfigJSONS) {
            super();
            this.emitters = new Map();
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
            this.mutateConfigs(particleConfigJSONS);
            for (let emitterID in particleConfig) {
                let config = particleConfig[emitterID];
                let textures = [];
                for (let texture of config.textures) {
                    textures.push(...Stage.Animation.loadTextures(texture.base, texture.frames));
                }
                let emitter;
                if (config.anim != null) {
                    emitter = new PIXI.particles.Emitter(stage, {
                        framerate: config.anim.framerate,
                        loop: true,
                        textures: textures,
                    }, clone(particleConfigJSONS.get(config.config)));
                    emitter.particleConstructor = PIXI.particles.AnimatedParticle;
                }
                else {
                    emitter = new PIXI.particles.Emitter(stage, textures, clone(particleConfigJSONS.get(config.config)));
                }
                this.emitters.set(emitterID, {
                    emitter: emitter,
                });
            }
        }
        check(emitterID) {
            if (!this.emitters.has(emitterID)) {
                console.error('Unknown emitterID: "' + emitterID + '"');
                console.error('Known emitters: ' + mapKeyString(this.emitters));
                return false;
            }
            return true;
        }
        enableOnly(emitterIDs) {
            let eids = new Set(emitterIDs);
            for (let id of this.emitters.keys()) {
                if (eids.has(id)) {
                    this.enable(id);
                }
                else {
                    this.disable(id, true);
                }
            }
        }
        enable(emitterID) {
            if (!this.check(emitterID)) {
                return;
            }
            let pkg = this.emitters.get(emitterID);
            if (pkg.emitter.emit) {
                return;
            }
            pkg.emitter.emit = true;
        }
        disable(emitterID, cleanup = false) {
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
                json.emit = false;
                json.autoUpdate = false;
            }
        }
        update(delta, entities) {
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
var Component;
(function (Component) {
    class TextRenderable extends Engine.Component {
        constructor(textData, displayData) {
            super();
            this.textData = textData;
            this.displayData = displayData;
        }
    }
    Component.TextRenderable = TextRenderable;
})(Component || (Component = {}));
var GUI;
(function (GUI) {
    let AssetType;
    (function (AssetType) {
        AssetType[AssetType["Text"] = 0] = "Text";
        AssetType[AssetType["Sprite"] = 1] = "Sprite";
    })(AssetType = GUI.AssetType || (GUI.AssetType = {}));
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
var Component;
(function (Component) {
    class Tweenable extends Engine.Component {
        constructor() {
            super(...arguments);
            this.tweenQueue = [];
            this.clear = false;
            this.groundTruth = {
                alpha: 1.0,
                color: 16777215,
            };
        }
    }
    Component.Tweenable = Tweenable;
})(Component || (Component = {}));
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
        applyScale(aspect) {
            let pos = aspect.get(Component.Position);
            let tr = aspect.get(Component.TextRenderable);
            this.cachePos.copyFrom_(pos.p).scale_(this.gameScale);
            if (tr.displayData.stageTarget === StageTarget.World) {
                this.translator.HUDtoWorld(this.cachePos);
            }
            aspect.dobj.position.set(this.cachePos.x, this.cachePos.y);
            aspect.dobj.rotation = angleFlip(pos.angle);
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
            let textRenderable = aspect.get(Component.TextRenderable);
            let gameText = new Stage.GameText(textRenderable.textData.text, textRenderable.textData.style, textRenderable.displayData.z, textRenderable.displayData.stageTarget);
            gameText.anchor.set(textRenderable.textData.anchor.x, textRenderable.textData.anchor.y);
            gameText.alpha = textRenderable.textData.alpha;
            aspect.dobj = gameText;
            this.applyScale(aspect);
            if (aspect.has(Component.Tweenable)) {
                let tweenable = aspect.get(Component.Tweenable);
                tweenable.groundTruth.alpha = textRenderable.textData.alpha;
                tweenable.groundTruth.color = parseInt(textRenderable.textData.style.fill.slice(1), 16);
            }
            this.stage.add(aspect.dobj);
        }
        onRemove(aspect) {
            this.stage.remove(aspect.dobj);
        }
        update(delta, entities) {
            for (let aspect of entities.values()) {
                this.applyScale(aspect);
                if (aspect.has(Component.Tweenable)) {
                    let tweenable = aspect.get(Component.Tweenable);
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
var Component;
(function (Component) {
    class Tracker extends Engine.Component {
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
                let position = aspect.get(Component.Position);
                let tracker = aspect.get(Component.Tracker);
                let targetComps = this.ecs.getComponents(tracker.target);
                if (targetComps == null) {
                    continue;
                }
                let targetPos = targetComps.get(Component.Position);
                offset.set_(0, 0);
                if (!tracker.trackRotation) {
                    offset.copyFrom_(tracker.offset);
                }
                else {
                    let a = targetPos.angle;
                    let aPrime = a - Constants.HALF_PI;
                    offset.set_(Math.cos(a) * tracker.offset.x + Math.cos(aPrime) * tracker.offset.y, -Math.sin(a) * tracker.offset.x + -Math.sin(aPrime) * tracker.offset.y);
                    position.angle = targetPos.angle;
                }
                position.p = offset.add_(targetPos.p).add_(tracker.internalOffset);
            }
        }
    }
    System.Tracking = Tracking;
})(System || (System = {}));
var Component;
(function (Component) {
    class Comboable extends Engine.Component {
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
var System;
(function (System) {
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
            if (comboable.attacks.length !== comboable.hits) {
                return false;
            }
            if (comboable.attacks.length === 0) {
                return true;
            }
            let latestAttack = comboable.attacks[comboable.attacks.length - 1];
            let latestElasped = this.elapsed(latestAttack);
            if (latestElasped > comboable.activeWindow) {
                return false;
            }
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
            return true;
        }
        update(delta, entities) {
            for (let [entity, aspect] of entities.entries()) {
                let attack = this.ecs.getComponents(entity).get(Component.Attack);
                if (attack.info.attackType !== Weapon.AttackType.Quick) {
                    continue;
                }
                let attacker = attack.attacker;
                let attackerComps = this.ecs.getComponents(attack.attacker);
                if (attackerComps == null || !attackerComps.has(Component.Comboable)) {
                    continue;
                }
                let comboable = attackerComps.get(Component.Comboable);
                if (comboable.attacks.indexOf(attack) === -1) {
                    comboable.attacks.push(attack);
                    while (comboable.attacks.length > comboable.hits) {
                        comboable.attacks.splice(0, 1);
                    }
                }
            }
            for (let entity of this.comboables.latest()) {
                let comboable = this.ecs.getComponents(entity).get(Component.Comboable);
                comboable.comboReady = this.check(comboable);
            }
        }
    }
    System.Combo = Combo;
})(System || (System = {}));
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
        userConfig.resScale = resNum;
        for (let i = 1; i <= 6; i++) {
            let className = resNum == i ? 'resButton active' : 'resButton';
            let el = document.getElementById('res' + i);
            if (el != null) {
                el.className = className;
            }
        }
    }
    Game.setRes = setRes;
    function openFullscreen(el) {
        if (el.requestFullscreen) {
            el.requestFullscreen();
        }
        else if (el.mozRequestFullScreen) {
            el.mozRequestFullScreen();
        }
        else if (el.webkitRequestFullscreen) {
            el.webkitRequestFullscreen();
        }
        else if (el.msRequestFullscreen) {
            el.msRequestFullscreen();
        }
    }
    class Sandbox3 {
        constructor(config, updateStats, renderStats) {
            this.config = config;
            this.updateStats = updateStats;
            this.renderStats = renderStats;
            this.stage = new Stage.MainStage();
            this.eventsManager = new Events.Manager();
            this.ecs = new Engine.ECS(this.eventsManager);
            this.scriptRunner = new Script.Runner(this.ecs, this.eventsManager);
            this.particleJSONS = new Map();
            this.mode = this.config.mode === 'release' ? Game.Mode.RELEASE : Game.Mode.DEBUG;
        }
        load2(ready) {
            this.r = ready;
            for (let key in this.config.subConfigs) {
                let fn = this.config.subConfigs[key];
                PIXI.loader.add(fn, fn);
            }
            PIXI.loader.use(pixiPackerParser(PIXI));
            let fn = 'assets/new-sheets/main_en_full.json';
            PIXI.loader.add(fn, fn);
            PIXI.loader.once('complete', this.parse, this);
            PIXI.loader.onProgress.detachAll();
            PIXI.loader.onProgress.add((loader) => {
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
            this.gm.parseFactory(this.subConfigs.factory);
        }
        load3() {
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
            for (let emitterID in this.subConfigs.particles) {
                let pjson = this.subConfigs.particles[emitterID].config;
                if (requested.has(pjson)) {
                    continue;
                }
                PIXI.loader.add(pjson, pjson);
                requested.add(pjson);
                this.particleJSONS.set(pjson, null);
            }
            PIXI.loader.once('complete', this.parseLoad3, this);
            PIXI.loader.onProgress.detachAll();
            PIXI.loader.onProgress.add((loader) => {
                let pMin = 35;
                let pMax = 65;
                let val = Math.round(pMin + pMax * (loader.progress / 100));
                document.getElementById('progressBar').setAttribute('value', '' + val);
                document.getElementById('loading').innerText = 'Loading Fallgate [' + val + '%]';
            });
            PIXI.loader.load();
        }
        parseLoad3(loader, resources) {
            this.sceneManager = new Scene.Manager(this.ecs, this.scriptRunner, this.gm, this.subConfigs.scenes, this.subConfigs.seasons, this.subConfigs.progression, this.subConfigs.credits, resources, this.mode);
            for (let pjson of mapKeyArr(this.particleJSONS)) {
                this.particleJSONS.set(pjson, resources[pjson].data);
            }
            this.audio = new System.Audio(this.subConfigs.sounds).load();
            this.makeStartButton();
        }
        makeStartButton() {
            document.getElementById('loading').remove();
            document.getElementById('progressBar').remove();
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
            this.setup();
        }
        setup() {
            let resConfig = getResConfig(userConfig.resScale);
            this.pixi_renderer = PIXI.autoDetectRenderer(resConfig.viewport.x, resConfig.viewport.y, {
                backgroundColor: Constants.BGColor
            });
            document.getElementById('loader').remove();
            this.pixi_renderer.view.className = 'game';
            this.pixi_renderer.view.id = 'game';
            let gameParent = document.getElementById('gameParent');
            gameParent.appendChild(this.pixi_renderer.view);
            let musicButton = document.createElement('button');
            musicButton.className = 'fsButton';
            musicButton.innerText = 'Toggle music';
            musicButton.onclick = (ev) => {
                this.ecs.getSystem(System.Audio).toggleMusic();
            };
            gameParent.appendChild(musicButton);
            let effectsButton = document.createElement('button');
            effectsButton.className = 'fsButton';
            effectsButton.innerText = 'Toggle sound effects';
            effectsButton.onclick = (ev) => {
                this.ecs.getSystem(System.Audio).toggleEffects();
            };
            gameParent.appendChild(effectsButton);
            let srButton = document.createElement('button');
            srButton.className = 'fsButton';
            srButton.innerText = 'Toggle speedrun timer';
            srButton.onclick = (ev) => {
                this.ecs.toggleSystem(System.BookkeeperRenderer);
            };
            gameParent.appendChild(srButton);
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
            let fsButton = document.createElement('button');
            fsButton.className = 'fsButton';
            fsButton.innerText = 'Open in fullscreen';
            fsButton.onclick = (ev) => {
                openFullscreen(this.pixi_renderer.view);
            };
            gameParent.appendChild(fsButton);
            let cheapCollPanel = null;
            let expensiveCollPanel = null;
            if (this.mode == Game.Mode.DEBUG) {
                let statsParent = document.getElementById('statsRow');
                let panels = [this.updateStats, this.renderStats];
                for (let p of panels) {
                    p.dom.className = 'stats';
                    p.dom.style.position = 'relative';
                    statsParent.appendChild(p.dom);
                }
                let customStats = new Stats();
                cheapCollPanel = customStats.addPanel(new Stats.Panel('cCks', '#f8f', '#212'));
                expensiveCollPanel = customStats.addPanel(new Stats.Panel('xCks', '#ff8', '#221'));
                customStats.showPanel(3);
                customStats.dom.className = 'stats';
                customStats.dom.style.position = 'relative';
                statsParent.appendChild(customStats.dom);
            }
            g = this;
            let gameEl = document.getElementById('game');
            gameEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
            if (this.mode == Game.Mode.DEBUG) {
                this.clockCentral = new Measurement.ClockCentral();
            }
            else {
                this.clockCentral = new Measurement.FakeClockTower();
            }
            this.clockCentral.init();
            let im = this.pixi_renderer.plugins.interaction;
            im.destroy();
            this.eventsManager.init(this.ecs, this.scriptRunner);
            let world = this.stage.camera_get(StageTarget.World);
            let hud = this.stage.camera_get(StageTarget.HUD);
            let translator = new Stage.Translator(hud, world, resConfig.viewport.copy(), resConfig.gamescale);
            let keyboard = new Keyboard(this.eventsManager);
            let mouse = new Mouse(resConfig.viewport.copy());
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
            world.scale.set(resConfig.zoom, resConfig.zoom);
            let debugDefaultDisabled = true;
            let delaySpeaker = new System.DelaySpeaker();
            let gui = new System.GUIManager(this.subConfigs.gui, delaySpeaker);
            this.ecs.addSystem(5, delaySpeaker);
            this.ecs.addSystem(5, gui);
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
            this.ecs.addSystem(10, new System.PlayerInputMouseKeyboard(inputMouse, inputKeyboard, inputGamepad, enemySelector));
            this.ecs.addSystem(10, new System.Pause(keyboard));
            this.ecs.addSystem(10, new System.AISystem(playerSelector));
            if (this.mode == Game.Mode.DEBUG) {
                this.ecs.addSystem(10, new System.Debug(keyboard));
                this.ecs.addSystem(10, new System.DebugGameSpeed(keyboard));
                this.ecs.addSystem(10, new System.DebugEntitySelector(inputMouse));
            }
            this.ecs.addSystem(10, new System.DebugSceneRestart(keyboard, this.sceneManager));
            this.ecs.addSystem(12, new System.PlayerInputGamepad(inputGamepad));
            if (this.mode == Game.Mode.DEBUG) {
                this.ecs.addSystem(15, new System.DebugInspectionUniquifier());
            }
            this.ecs.addSystem(20, new System.Swing());
            this.ecs.addSystem(20, new System.Defend());
            this.ecs.addSystem(40, new System.Tracking());
            this.ecs.addSystem(40, new System.Movement());
            this.ecs.addSystem(45, new System.SpatialHash());
            this.ecs.addSystem(50, new System.CollisionDetection(cheapCollPanel, expensiveCollPanel));
            this.ecs.addSystem(60, new System.CollisionMovement());
            this.ecs.addSystem(60, new System.CollisionBlock());
            this.ecs.addSystem(60, new System.CollisionZone());
            this.ecs.addSystem(60, new System.CollisionItem(this.gm));
            this.ecs.addSystem(60, new System.CollisionPhysicsRegion());
            this.ecs.addSystem(60, new System.CollisionProjectile());
            this.ecs.addSystem(60, new System.PersistentDamage());
            this.ecs.addSystem(65, new System.CollisionDamage());
            this.ecs.addSystem(65, new System.EnemyZoneChecker());
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
            this.ecs.addSystem(75, new System.Combo(comboableSelector));
            this.ecs.addSystem(75, new System.Death());
            this.ecs.addSystem(80, new System.Zoom(world, resConfig.zoom));
            this.ecs.addSystem(80, new System.DebugCamera(keyboard, world, debugDefaultDisabled));
            this.ecs.addSystem(80, new System.FollowCamera(world, resConfig.viewport.copy(), this.sceneManager.infoProvider, zoneSelector));
            let fxCamera = new System.FxCamera(world);
            this.ecs.addSystem(82, fxCamera);
            this.ecs.addSystem(85, new System.Activity());
            this.ecs.addSystem(87, new System.Body());
            this.ecs.addSystem(89, new System.Tweener());
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
            this.ecs.addSystem(90, new System.SoundsFootsteps());
            this.ecs.addSystem(90, this.audio);
            this.ecs.addSystem(90, new System.LowHealth());
            this.ecs.addSystem(90, new System.ParticleRenderer(world.getChildAt(world.mapping.get(ZLevelWorld.Particles)), this.subConfigs.particles, this.particleJSONS));
            this.ecs.addSystem(95, new System.AnimationTicker());
            this.ecs.addSystem(100, new System.CrosshairRenderer(inputMouse, this.stage));
            if (this.mode == Game.Mode.DEBUG) {
                this.ecs.addSystem(100, new System.DebugCollisionRenderer(this.stage, debugDefaultDisabled));
                document.getElementById('gameContent').className = 'left';
                let debugCol = document.createElement('div');
                debugCol.id = 'debugColumn';
                debugCol.className = 'right';
                document.getElementById('contentParent').appendChild(debugCol);
                this.ecs.addSystem(100, new System.DebugHTMLComponents(debugCol));
                this.ecs.addSystem(100, new System.DebugInspectionRenderer(this.stage));
                this.ecs.addSystem(100, new System.DebugTimingRenderer(this.stage, this.clockCentral, resConfig.viewport.copy()));
            }
            this.ecs.addSystem(100, new System.BookkeeperRenderer(this.stage, resConfig.viewport.copy()));
            this.ecs.addSystem(110, new System.Bookkeeper());
            this.ecs.addSystem(110, new System.Fade(this.stage, resConfig.viewport.copy()));
            this.eventsManager.add(new Handler.Camera(fxCamera));
            this.eventsManager.add(new Handler.TextHandler(translator, gui));
            this.eventsManager.add(new Handler.Checkpoint(this.gm));
            this.eventsManager.add(new Handler.Death(playerSelector, spawnableSelector));
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
            this.audio.boundsGetter = world;
            this.audio.viewportSize = resConfig.viewport.copy();
            let [sceneName, trackIDs, bookkeeperStr] = Saving.load();
            if (sceneName != null) {
                if (trackIDs != null) {
                    this.ecs.getSystem(System.Audio).playMusic(trackIDs);
                }
                this.ecs.getSystem(System.Bookkeeper).load(bookkeeperStr);
                this.sceneManager.switchToName(sceneName);
            }
            else {
                this.sceneManager.nextLevel();
            }
            this.r.done();
            g = this;
        }
        s(phase) {
            this.clockCentral.start(Measurement.T_OVERALL, phase);
        }
        e(phase) {
            this.clockCentral.end(Measurement.T_OVERALL, phase);
        }
        update(wallDelta, rawGameDelta) {
            this.s('update');
            let gameDelta = this.ecs.update(wallDelta, rawGameDelta, this.clockCentral);
            this.e('update');
            this.s('events');
            this.eventsManager.update(gameDelta);
            this.e('events');
            this.s('scripting');
            this.scriptRunner.update(gameDelta);
            this.e('scripting');
            this.s('cleanup');
            this.ecs.finishUpdate();
            this.e('cleanup');
        }
        render() {
            this.s('render');
            this.stage.render(this.pixi_renderer);
            this.e('render');
        }
    }
    Game.Sandbox3 = Sandbox3;
})(Game || (Game = {}));
var Main;
(function (Main) {
    class Ready {
        done() {
            setTimeout(update);
            requestAnimationFrame(render);
        }
    }
    class Preloader {
        constructor() {
            PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
            let loader = PIXI.loader;
            loader.add(Constants.FN_CONFIG);
            loader.once('complete', this.launch, this);
            PIXI.loader.onProgress.detachAll();
            PIXI.loader.onProgress.add((loader) => {
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
            let ready = new Ready();
            this.game = new Game.Sandbox3(config, this.updateStats, this.renderStats);
            this.game.load2(ready);
        }
        update() {
            let frameStart = (performance || Date).now();
            let wallDelta = this.lastFrameStart != -1 ?
                frameStart - this.lastFrameStart :
                Constants.DELTA_MS;
            this.lastFrameStart = frameStart;
            this.updateStats.begin();
            this.game.update(wallDelta, Constants.DELTA_MS);
            this.updateStats.end();
            let elapsed = (performance || Date).now() - frameStart;
            let nextDelay = Math.max(this.targetUpdate - elapsed, 0);
            setTimeout(update, nextDelay);
        }
        render() {
            this.renderStats.begin();
            this.game.render();
            this.renderStats.end();
            requestAnimationFrame(render);
        }
    }
    let update = function () {
        Loop.instance.update();
    };
    let render = function (ts) {
        Loop.instance.render();
    };
    new Preloader();
})(Main || (Main = {}));
var Component;
(function (Component) {
    class AnimationTickable extends Engine.Component {
    }
    Component.AnimationTickable = AnimationTickable;
})(Component || (Component = {}));
var Component;
(function (Component) {
    class Audible extends Engine.Component {
        constructor(sounds) {
            super();
            this.sounds = clone(sounds);
        }
    }
    Component.Audible = Audible;
})(Component || (Component = {}));
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
var Component;
(function (Component) {
    class Checkpoint extends Engine.Component {
        constructor(gateID) {
            super();
            this.gateID = gateID;
        }
    }
    Component.Checkpoint = Checkpoint;
})(Component || (Component = {}));
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
var Component;
(function (Component) {
    class DebugInspection extends Engine.Component {
        constructor(pickTime) {
            super();
            this.pickTime = pickTime;
        }
    }
    Component.DebugInspection = DebugInspection;
})(Component || (Component = {}));
var Component;
(function (Component) {
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
var Component;
(function (Component) {
    class DebugTileInfo extends Engine.Component {
        constructor(info) {
            super();
            this.info = info;
        }
        toString() { return this.info; }
    }
    Component.DebugTileInfo = DebugTileInfo;
})(Component || (Component = {}));
var Component;
(function (Component) {
    class Destructible extends Engine.Component {
    }
    Component.Destructible = Destructible;
})(Component || (Component = {}));
var Component;
(function (Component) {
    class Enemy extends Engine.Component {
        constructor(settings) {
            super();
            this.zoneChecked = false;
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
var Component;
(function (Component) {
    class FromComboable extends Engine.Component {
    }
    Component.FromComboable = FromComboable;
})(Component || (Component = {}));
var Component;
(function (Component) {
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
var Component;
(function (Component) {
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
        let size = 'Medium';
        if (spec.size != null) {
            size = spec.size;
        }
        let ls = LightbulbSize[size];
        if (ls == null) {
            throw new Error('Got invalid LightbulbSpec.size: "' + size + '"');
        }
        let baseTint = '#FFFFFF';
        if (spec.baseTint != null) {
            baseTint = spec.baseTint;
        }
        let bt = parseInt(baseTint.slice(1), 16);
        let flicker = spec.flicker || false;
        return {
            size: ls,
            baseTint: bt,
            flicker: flicker,
        };
    }
    Graphics.convertLightbulbSpec = convertLightbulbSpec;
})(Graphics || (Graphics = {}));
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
var Component;
(function (Component) {
    class PhysicsRegion extends Engine.Component {
        constructor(region) {
            super();
            this.region = clone(region);
        }
    }
    Component.PhysicsRegion = PhysicsRegion;
})(Component || (Component = {}));
var Component;
(function (Component) {
    class Sparkle extends Engine.Component {
    }
    Component.Sparkle = Sparkle;
})(Component || (Component = {}));
var Component;
(function (Component) {
    class Spawnable extends Engine.Component {
        constructor(position, angle = 0) {
            super();
            this.angle = angle;
            this.position = position.copy();
        }
    }
    Component.Spawnable = Spawnable;
})(Component || (Component = {}));
var Component;
(function (Component) {
    class Staggerable extends Engine.Component {
    }
    Component.Staggerable = Staggerable;
})(Component || (Component = {}));
var Component;
(function (Component) {
    class Zone extends Engine.Component {
        constructor(zoneSpec) {
            super();
            this.containsPlayer = false;
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
var Physics;
(function (Physics) {
    function forceFromPoints(p1, p2, magnitude) {
        return p2.subNew(p1).normalize_().scale_(magnitude);
    }
    Physics.forceFromPoints = forceFromPoints;
    function forceFromAngle(angle, magnitude) {
        return (new Point(Math.cos(angle), -Math.sin(angle))).scale_(magnitude);
    }
    Physics.forceFromAngle = forceFromAngle;
})(Physics || (Physics = {}));
var Probability;
(function (Probability) {
    function uniformInt(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    }
    Probability.uniformInt = uniformInt;
    function uniformReal(min, max) {
        return min + Math.random() * (max - min);
    }
    Probability.uniformReal = uniformReal;
    function uniformChoice(a) {
        return a[uniformInt(0, a.length - 1)];
    }
    Probability.uniformChoice = uniformChoice;
})(Probability || (Probability = {}));
var Physics;
(function (Physics) {
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
        rev() {
            this.amount = -this.amount;
            return this;
        }
    }
    Physics.CollisionInfo = CollisionInfo;
    class SAT {
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
                if (p.y < q.x || q.y < p.x) {
                    return false;
                }
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
            let smAxis = smOverlapIdx < axes1.length ? axes1[smOverlapIdx] : axes2[smOverlapIdx - axes1.length];
            out.axis.copyFrom_(smAxis);
            out.amount = smOverlap * smDir;
            return true;
        }
    }
    Physics.SAT = SAT;
})(Physics || (Physics = {}));
var Script;
(function (Script_1) {
    class Runner {
        constructor(ecs, eventsManager) {
            this.ecs = ecs;
            this.eventsManager = eventsManager;
            this.scripts = new Array();
        }
        run(script) {
            script._init(this.ecs, this.eventsManager, this);
            script.init();
            this.scripts.push(script);
        }
        clear() {
            arrayClear(this.scripts);
        }
        update(delta) {
            for (let i = this.scripts.length - 1; i >= 0; i--) {
                this.scripts[i].update(delta);
                if (this.scripts[i].finished) {
                    this.scripts.splice(i, 1);
                }
            }
        }
    }
    Script_1.Runner = Runner;
    class Script {
        constructor() {
            this.active = new Array();
            this.elapsed = 0;
        }
        get finished() {
            return this.todo.length === 0 && this.active.length == 0;
        }
        _init(ecs, eventsManager, runner) {
            this.ecs = ecs;
            this.eventsManager = eventsManager;
            this.runner = runner;
            this.todo = mapKeyArr(this.code);
            this.todo.sort(sortNumeric);
        }
        init() { }
        update(delta) {
            this.elapsed += delta;
            let nToRemove = 0;
            for (let delay of this.todo) {
                if (this.elapsed >= delay) {
                    let pkg = this.code.get(delay);
                    pkg.func.apply(this, pkg.args);
                    nToRemove++;
                }
                else {
                    break;
                }
            }
            for (let i = 0; i < nToRemove; i++) {
                this.todo.shift();
            }
            for (let i = this.active.length - 1; i >= 0; i--) {
                if (this.active[i].call(this, delta)) {
                    this.active.splice(i, 1);
                }
            }
        }
    }
    Script_1.Script = Script;
})(Script || (Script = {}));
var GameMap;
(function (GameMap_1) {
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
    function parseStrings(s, propName, options) {
        let res = new Array();
        for (let raw_chunk of s.split(',')) {
            let chunk = raw_chunk.trim();
            if (options.indexOf(chunk) === -1) {
                throw new Error('Property "' + propName + '" expects one of [' +
                    options.join(', ') + '], but "' + chunk + '" was given.');
            }
            res.push(chunk);
        }
        return res;
    }
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
    function addShield(entity, ecs, shield) {
        if (!ecs.getComponents(entity).has(Component.Shielded)) {
            ecs.addComponent(entity, new Component.Shielded(shield));
        }
        else {
            let shielded = ecs.getComponents(entity).get(Component.Shielded);
            shielded.inventory.push(shield);
        }
    }
    function addBow(entity, ecs, props) {
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
        let animatable = ensureAnimatable(entity, ecs, props);
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
        animatable.animations.set(Anim.getKey(Action.BlockRaising, Part.Weapon, PartID.Bow), Anim.getData('sprites/weapons/bowRaise', 2, 100, Anim.PlayType.PlayAndHold, new Point(0, 1), oldAlign));
        animatable.animations.set(Anim.getKey(Action.BlockHolding, Part.Weapon, PartID.Bow), Anim.getData('sprites/weapons/bowHold', 1, 100, Anim.PlayType.PlayAndHold, new Point(0, 1), oldAlign));
        animatable.animations.set(Anim.getKey(Action.BlockLowering, Part.Weapon, PartID.Bow), Anim.getData('sprites/weapons/bowLower', 1, 100, Anim.PlayType.PlayAndHold, new Point(0, 1), oldAlign));
        animatable.animations.set(Anim.getKey(Action.Moving, Part.Weapon, PartID.Bow), Anim.getData('sprites/weapons/bowWalk', 8, 100, Anim.PlayType.Loop, new Point(0, 1), oldAlign));
        animatable.animations.set(Anim.getKey(Action.Idle, Part.Weapon, PartID.Bow), Anim.getData('sprites/weapons/bowIdle', 1, 100, Anim.PlayType.Loop, new Point(0, 1), oldAlign));
    }
    function addAxe(entity, ecs, props) {
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
        let animatable = ensureAnimatable(entity, ecs, props);
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
        animatable.animations.set(Anim.getKey(Action.BlockRaising, Part.Weapon, PartID.Axe), Anim.getData('sprites/weapons/axeRaise', 2, 100, Anim.PlayType.PlayAndHold, new Point(0, 1), oldAlign));
        animatable.animations.set(Anim.getKey(Action.BlockHolding, Part.Weapon, PartID.Axe), Anim.getData('sprites/weapons/axeHold', 1, 100, Anim.PlayType.PlayAndHold, new Point(0, 1), oldAlign));
        animatable.animations.set(Anim.getKey(Action.BlockLowering, Part.Weapon, PartID.Axe), Anim.getData('sprites/weapons/axeLower', 1, 100, Anim.PlayType.PlayAndHold, new Point(0, 1), oldAlign));
        animatable.animations.set(Anim.getKey(Action.Moving, Part.Weapon, PartID.Axe), Anim.getData('sprites/weapons/axeWalk', 8, 100, Anim.PlayType.Loop, new Point(0, 1), oldAlign));
        animatable.animations.set(Anim.getKey(Action.Idle, Part.Weapon, PartID.Axe), Anim.getData('sprites/weapons/axeIdle', 1, 100, Anim.PlayType.Loop, new Point(0, 1), oldAlign));
    }
    class CoreData {
    }
    class Value {
        extendWith(child) {
            return child.copy();
        }
    }
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
    class Complex extends Value {
        constructor(orig) {
            super();
            this.data = clone(orig);
        }
        val() {
            return clone(this.data);
        }
        copy() {
            return new Complex(this.data);
        }
        extendWith(child) {
            let p = this.copy();
            let c = child.copy();
            if (!(p.data instanceof Array) || !(c.data instanceof Array)) {
                return c;
            }
            p.data.push(...c.data);
            return new Complex(p.data);
        }
    }
    class Property {
        init() {
            this.name = this.constructor.name;
        }
    }
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
            if (props.has(Bjorn.name)) {
                h = -h;
            }
            let baseAngle = Math.atan2(h, w);
            let centerAngle = baseAngle + gameAngle;
            let hyp = Math.sqrt((w * w + h * h) / 4);
            let centerX = rawX + Math.cos(centerAngle) * hyp;
            let centerY = rawY - Math.sin(centerAngle) * hyp;
            ecs.addComponent(entity, new Component.Position(new Point(centerX, centerY), gameAngle));
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
            if (!animatable.defaultOnly) {
                if (!ecs.getComponents(entity).has(Component.Activity)) {
                    ecs.addComponent(entity, new Component.Activity({}));
                }
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
    function ensureAnimatable(entity, ecs, props) {
        let components = ecs.getComponents(entity);
        let animatable;
        if (components.has(Component.Animatable)) {
            animatable = components.get(Component.Animatable);
        }
        else {
            let drawLayer = ZLevelWorld.Object;
            if (props.has(DrawLayer.name)) {
                drawLayer = props.get(DrawLayer.name).val();
            }
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
            if (!props.get(CollisionGenerate.name).val()) {
                return;
            }
            let coreData = props.get(CoreProperty.name).val();
            let cTypes = props.get(CollisionTypes.name).val();
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
                throw new Error('Property "' + this.name + '" expects a valid ' +
                    'ZLevelWorld, one of: [' + enumSortedNames(ZLevelWorld).join(', ') +
                    '] but "' + params + '" was given.');
            }
            return new Primitive(z);
        }
        apply(entity, ecs, props) {
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
            let item = Ontology.Item[params.classification];
            if (item == null) {
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
    class ParentLayer extends Property {
        constructor() {
            super(...arguments);
            this.otherPropsRequired = [];
        }
        parseParams(params) {
            return new Primitive(params);
        }
        apply(entity, ecs, props) {
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
                return;
            }
            ecs.addComponent(entity, new Component.PlayerInput());
            ecs.addComponent(entity, new Component.CameraFollowable());
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
                addShield(entity, ecs, sd.shield);
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
                addWeapon(entity, ecs, wd.weapon);
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
    class PropertyMap extends LowerKeyMap {
        build(list) {
            for (let prop of list) {
                prop.init();
                this.set(prop.name, prop);
            }
            return this;
        }
    }
    class ValMap extends LowerKeyMap {
        copy() {
            let res = new ValMap();
            for (let [k, v] of this.map.entries()) {
                res.set(k, v.copy());
            }
            return res;
        }
        parse(validProps, json) {
            for (let key in json) {
                if (validProps.has(key)) {
                    this.set(key, validProps.get(key).parseParams(json[key]));
                }
                else {
                    throw new Error('Error: Unimplemented key: "' + key + '"');
                }
            }
            return this;
        }
        extendWith(child) {
            for (let key of child.keys()) {
                if (!this.has(key)) {
                    this.set(key, child.get(key));
                }
                else {
                    this.set(key, this.get(key).extendWith(child.get(key)));
                }
            }
            return this;
        }
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
    const C_Bramble = new Set([
        CollisionType.Solid, CollisionType.Attack, CollisionType.Environment,
    ]);
    const C_Wall = new Set([
        CollisionType.Solid, CollisionType.Wall,
    ]);
    const TerrainMapping = new Map([
        ['bramble,bramble,none,none', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0 }],
        ['bramble,none,bramble,none', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0 }],
        ['none,none,bramble,bramble', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0 }],
        ['none,bramble,none,bramble', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0 }],
        ['none,none,none,bramble', { coll: { shape: V_TriangleBulgeBR, cTypes: C_Bramble }, angle: 0 }],
        ['none,bramble,none,none', { coll: { shape: V_TriangleBulgeBR, cTypes: C_Bramble }, angle: -90 }],
        ['bramble,none,none,none', { coll: { shape: V_TriangleBulgeBR, cTypes: C_Bramble }, angle: 180 }],
        ['none,none,bramble,none', { coll: { shape: V_TriangleBulgeBR, cTypes: C_Bramble }, angle: 90 }],
        ['bramble,bramble,bramble,bramble', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],
        ['none,bramble,bramble,bramble', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],
        ['bramble,none,bramble,bramble', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],
        ['bramble,bramble,none,bramble', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],
        ['bramble,bramble,bramble,none', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],
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
        ['forestWalls,forestWalls,forestWalls,forestWalls', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],
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
        ['castleWalls,castleWalls,castleWalls,castleWalls', { coll: { shape: V_Full, cTypes: C_Bramble }, angle: 0, objLayerOverride: 'OOBTile' }],
    ]);
    class TileDataStructure {
        constructor(tilesets) {
            this.gid2tilesetName = new Map();
            this.gid2localIDs = new Map();
            this.tilesetLocalIDs = new Map();
            if (tilesets == null) {
                console.warn('No tilesets provided in map.');
                return;
            }
            for (let tileset of tilesets) {
                if (tileset.terrains == null) {
                    continue;
                }
                let localIDs = new Map();
                for (let i = 0; i < tileset.terrains.length; i++) {
                    let terrain = tileset.terrains[i];
                    localIDs.set(i, terrain.name);
                }
                this.tilesetLocalIDs.set(tileset.name, localIDs);
                for (let tileIDstr in tileset.tiles) {
                    let gid = tileset.firstgid + parseInt(tileIDstr);
                    this.gid2tilesetName.set(gid, tileset.name);
                    this.gid2localIDs.set(gid, tileset.tiles[tileIDstr].terrain);
                }
            }
        }
        descriptor(gid) {
            let terrainNames = this.terrainNames(gid);
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
            this.blueprint = new Map();
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
            this.propertyMap = (new PropertyMap()).build(propertyList);
        }
        parseFactory(json) {
            this.factory = Conversion.inheritanceBuild(json, 'parentLayer', (layerJson) => { return (new ValMap()).parse(this.propertyMap, layerJson); }, (parent, child) => {
                return parent.copy().extendWith(child);
            });
        }
        setBlueprint(json) {
            this.blueprint.clear();
            for (let [layerName, valMap] of this.factory.entries()) {
                this.blueprint.set(layerName, valMap.copy());
            }
            if (json == null) {
                return;
            }
            for (let layerName in json) {
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
                let overrideLayer = this.factory.get(parentLayerName).copy();
                overrideLayer.parse(this.propertyMap, layer);
                this.blueprint.set(layerName, overrideLayer);
            }
        }
        parseBareMap(json) {
            let tds = new TileDataStructure(json.tilesets);
            for (let layer of json.layers) {
                if (layer.type === 'objectgroup' && layer.hasOwnProperty('objects') && this.blueprint.has(layer.name)) {
                    for (let object of layer.objects) {
                        this.parseObject(object, this.blueprint.get(layer.name), layer.name);
                    }
                }
                if (layer.type === 'tilelayer') {
                    this.parseTiles(tds, layer, json.tilewidth, json.tileheight);
                }
            }
            this.buildBorder(json.height * json.tileheight, json.width * json.tilewidth);
        }
        buildBorder(height, width, thickness = 64) {
            const cTypes = new Set([CollisionType.Solid, CollisionType.Wall]);
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
        parseTiles(tds, layer, tilewidth, tileheight) {
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
            for (let i = 0; i < layer.data.length; i++) {
                let gid = layer.data[i];
                if (gid === 0) {
                    continue;
                }
                let [terrains, desctiptor] = tds.descriptor(gid);
                if (desctiptor == null) {
                    continue;
                }
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
                this.ecs.addComponent(e, new Component.CollisionShape(desctiptor.coll.shape.vertices, desctiptor.coll.cTypes, desctiptor.coll.shape.shape));
            }
        }
        produce(layerName, json) {
            if (!this.blueprint.has(layerName)) {
                throw new Error('Attempted to create object "' + layerName +
                    '" which was not in factory/blueprint.');
            }
            return this.parseObject(json, this.blueprint.get(layerName), layerName);
        }
        parseObject(json, layerProps, layerName) {
            let validProps = this.propertyMap;
            let objProps = layerProps.copy();
            objProps.set(CoreProperty.name, validProps.get(CoreProperty.name).parseParams(json));
            if (json.hasOwnProperty('properties')) {
                objProps.parse(validProps, json.properties);
            }
            objProps.check(validProps, layerName);
            let entity = this.ecs.addEntity();
            for (let propName of objProps.keys()) {
                validProps.get(propName).apply(entity, this.ecs, objProps);
            }
            this.ecs.addComponent(entity, new Component.DebugKVLayer(layerName));
            return entity;
        }
    }
    GameMap_1.GameMap = GameMap;
})(GameMap || (GameMap = {}));
var Logic;
(function (Logic) {
    let ZoneType;
    (function (ZoneType) {
        ZoneType[ZoneType["Camera"] = 0] = "Camera";
        ZoneType[ZoneType["NearExit"] = 1] = "NearExit";
        ZoneType[ZoneType["NextToExit"] = 2] = "NextToExit";
        ZoneType[ZoneType["EnemyGateGroup"] = 3] = "EnemyGateGroup";
    })(ZoneType = Logic.ZoneType || (Logic.ZoneType = {}));
    function convertZoneSpec(zoneSpec) {
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
var Scene;
(function (Scene) {
    function getStartScriptName(scripts, gameMode) {
        if (scripts != null && scripts.start != null) {
            return scripts.start;
        }
        if (this.gameMode === Game.Mode.DEBUG) {
            return 'StartLevelDev';
        }
        else {
            return 'StartLevel';
        }
    }
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
        let bImg = map.bottom;
        if (bImg != null) {
            return new Point(PIXI.utils.TextureCache[bImg].width, PIXI.utils.TextureCache[bImg].height);
        }
        let maxW = 0, maxH = 0;
        for (let tile of map.bottom_tiles) {
            maxW = Math.max(maxW, tile.pos[0] + PIXI.utils.TextureCache[tile.img].width);
            maxH = Math.max(maxH, tile.pos[1] + PIXI.utils.TextureCache[tile.img].height);
        }
        return new Point(maxW, maxH);
    }
    class Manager {
        get activeIdx() {
            return this._activeIdx;
        }
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
            for (let [name, scene] of this.scenes.entries()) {
                if (scene.map.json != null && scene.map.json.length > 0) {
                    this.mapJsons.set(name, resources[scene.map.json].data);
                }
                if (scene.blueprint != null && scene.blueprint.length > 0) {
                    this.blueprintJsons.set(name, resources[scene.blueprint].data);
                }
            }
        }
        nextLevel() {
            this.switchToRelative(1);
        }
        resetScene() {
            this.switchToRelative(0, true);
        }
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
            let idx = (this.activeIdx + increment) % this.progression.length;
            if (idx < 0) {
                idx = this.progression.length + idx;
            }
            this.switchTo(idx, softReset);
        }
        addImgs(single, tiles, z) {
            let queue = [];
            if (single != null) {
                queue.push([new Point(0, 0), single]);
            }
            if (tiles != null) {
                for (let tile of tiles) {
                    queue.push([new Point(tile.pos[0], tile.pos[1]), tile.img]);
                }
            }
            for (let [pos, img] of queue) {
                let e = this.ecs.addEntity();
                this.ecs.addComponent(e, new Component.Position(pos));
                this.ecs.addComponent(e, new Component.StaticRenderable(img, z, StageTarget.World, new Point(0, 0)));
            }
        }
        switchTo(idx, softReset = false) {
            this._activeIdx = idx;
            let active = this.progression[this.activeIdx];
            let blueprintJson = null;
            if (this.blueprintJsons.has(active)) {
                blueprintJson = this.blueprintJsons.get(active);
            }
            this.gm.setBlueprint(blueprintJson);
            this.scriptRunner.clear();
            this.ecs.clear();
            if (this.mapJsons.has(active)) {
                console.log('Loading map "' + active + '".');
                this.gm.parseBareMap(this.mapJsons.get(active));
            }
            this.activeScene = this.scenes.get(active);
            let map = this.activeScene.map;
            sanityCheckMap(map);
            this.mapDims = getMapDims(map);
            this.addImgs(map.bottom, map.bottom_tiles, ZLevelWorld.BG);
            this.addImgs(map.top, map.top_tiles, ZLevelWorld.Top);
            let particleIDs = this.activeScene.level.particleIDs;
            if (particleIDs != null) {
                this.ecs.getSystem(System.ParticleRenderer).enableOnly(particleIDs);
            }
            let audioSystem = this.ecs.getSystem(System.Audio);
            let trackIDs = this.activeScene.level.trackIDs;
            if (trackIDs != null) {
                audioSystem.playMusic(trackIDs);
            }
            let bookkeeper = this.ecs.getSystem(System.Bookkeeper);
            Saving.save(active, audioSystem.getPlaying(), bookkeeper.serialize());
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
var Stage;
(function (Stage) {
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
    class PixelBar extends PIXI.Container {
        constructor(settings) {
            super();
            this.settings = settings;
            this.portion = 1.0;
            this.lastPortion = -1;
            this.outline = new PIXI.Graphics();
            this.fill = new PIXI.Graphics();
            this.outline.alpha = 0.5;
            this.fill.alpha = 0.8;
            this.addChild(this.outline);
            this.addChild(this.fill);
        }
        draw() {
            this.outline.clear();
            this.fill.clear();
            this.outline.beginFill(this.settings.outlineColor);
            this.outline.drawRect(0, 0, this.settings.dimensions.x, -this.settings.dimensions.y);
            this.outline.endFill();
            let width = this.portion * (this.settings.dimensions.x - 2);
            this.fill.beginFill(this.settings.fillColor);
            this.fill.drawRect(1, -1, width, -this.settings.dimensions.y + 2);
            this.fill.endFill();
        }
        update() {
            if (this.portion != this.lastPortion) {
                this.draw();
                this.lastPortion = this.portion;
            }
        }
    }
    Stage.PixelBar = PixelBar;
})(Stage || (Stage = {}));
var FX;
(function (FX) {
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
            if (duration < -1) {
                console.error('Invalid duration for fx "' + id + '": ' + duration);
                return;
            }
        }
        refillPools() {
            arrayClear(this.active);
            arrayClear(this.pool);
            for (let i = 0; i < this.poolSize; i++) {
                let entity = this.factory.produce(this.id, this.baseFactoryObj);
                let comps = this.ecs.getComponents(entity);
                let anim = comps.get(Component.Animatable);
                anim.pause = true;
                anim.visible = false;
                this.pool.push({
                    effect: entity,
                    elapsed: 0,
                });
            }
        }
        emit(x, y, direction = null) {
            if (this.poolSize == 0) {
                return;
            }
            if (this.pool.length === 0) {
                this.reclaim(0);
            }
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
        reclaim(i) {
            let pkg = this.active[i];
            let comps = this.ecs.getComponents(pkg.effect);
            let anim = comps.get(Component.Animatable);
            anim.visible = false;
            anim.pause = true;
            this.active.splice(i, 1);
            this.pool.push(pkg);
        }
        update(delta) {
            if (this.duration === -1) {
                return;
            }
            for (let i = this.active.length - 1; i >= 0; i--) {
                let pkg = this.active[i];
                pkg.elapsed += delta;
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
    class Bookkeeping extends Events.Handler {
        constructor() {
            super(...arguments);
            this.dispatcher = new Map([
                [Events.EventTypes.ThingDead, this.thingDead],
                [Events.EventTypes.GameplayStart, this.startLevel],
            ]);
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
var System;
(function (System) {
    let ShakeType;
    (function (ShakeType) {
        ShakeType[ShakeType["JumpEaseBack"] = 0] = "JumpEaseBack";
        ShakeType[ShakeType["Wobble"] = 1] = "Wobble";
    })(ShakeType = System.ShakeType || (System.ShakeType = {}));
    class FxCamera extends Engine.System {
        constructor(stage) {
            super();
            this.stage = stage;
            this.cacheDelta = new Point();
            this.frameIdx = -1;
            this.angle = 0;
            this.nFrames = 0;
            this.magnitude = 0;
            this.shakeType = ShakeType.JumpEaseBack;
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
        }
        shake(angle, nFrames, magnitude, shakeType) {
            this.frameIdx = 0;
            this.angle = angleClamp(angle + Math.PI);
            this.nFrames = nFrames;
            this.magnitude = magnitude;
            this.shakeType = shakeType;
        }
        wobble() {
            let b = 0.4;
            let a = this.magnitude * (1.0 - Tween.easeOutCubic(this.frameIdx, this.nFrames));
            let len = a * Math.sin(b * this.frameIdx);
            this.cacheDelta.x = Math.cos(this.angle) * len;
            this.cacheDelta.y = -Math.sin(this.angle) * len;
        }
        jumpEaseBack() {
            let portion = 1.0 - Tween.easeOutCubic(this.frameIdx, this.nFrames);
            let len = portion * this.magnitude;
            this.cacheDelta.x = Math.cos(this.angle) * len;
            this.cacheDelta.y = -Math.sin(this.angle) * len;
        }
        update(delta, entities) {
            if (this.frameIdx == -1) {
                return;
            }
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
            this.stage.x += this.cacheDelta.x;
            this.stage.y += this.cacheDelta.y;
            this.frameIdx++;
            if (this.frameIdx >= this.nFrames) {
                this.frameIdx = -1;
            }
        }
    }
    System.FxCamera = FxCamera;
})(System || (System = {}));
var Handler;
(function (Handler) {
    class Camera extends Events.Handler {
        constructor(fxCamera) {
            super();
            this.fxCamera = fxCamera;
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
            if (args.defenderType !== Ontology.Thing.Player) {
                return;
            }
            this.fxCamera.shake(args.angleAtoB, this.playerBlocksFrames, this.playerBlocksMagnitude, this.playerBlocksType);
        }
        explosionShake(et, args) {
            this.fxCamera.shake(Constants.HALF_PI, this.explosionFrames, this.explosionMagnitude, this.explosionType);
        }
        damageShake(et, args) {
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
var Script;
(function (Script) {
    class TestScript extends Script.Script {
        constructor(cs) {
            super();
            this.cs = cs;
            this.secret = 42;
            this.sinceLastPing = 0;
            this.pingCount = 0;
            this.maxPings = 10;
            this.code = new Map([
                [2000, { func: this.hello, args: { n1: 12, s1: 'foobleu' } }],
                [3000, { func: this.kickoff, args: null }],
            ]);
        }
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
var Handler;
(function (Handler) {
    class Checkpoint extends Events.Handler {
        constructor(gm) {
            super();
            this.gm = gm;
            this.dispatcher = new Map([
                [Events.EventTypes.Checkpoint, this.checkpoint],
            ]);
        }
        checkpoint(et, args) {
            let playerSelector = this.ecs.getSystem(System.PlayerSelector);
            let enemySelector = this.ecs.getSystem(System.EnemySelector);
            let checkpointComps = this.ecs.getComponents(args.checkpoint);
            let cauldronPos = checkpointComps.get(Component.Position);
            for (let player of playerSelector.latest()) {
                let playerComps = this.ecs.getComponents(player);
                let spawnable = playerComps.get(Component.Spawnable);
                spawnable.position.copyFrom_(cauldronPos.p).add_(Checkpoint.SPAWN_OFFSET);
            }
            for (let enemy of enemySelector.latest()) {
                let enemyComps = this.ecs.getComponents(enemy);
                if (!enemyComps.has(Component.Dead)) {
                    continue;
                }
                this.ecs.removeComponentIfExists(enemy, Component.Spawnable);
            }
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
            if (args.thingType === Ontology.Thing.Enemy) {
                this.scriptRunner.run(new Script.EnemyDeath(args.thing));
                return;
            }
            if (args.thingType === Ontology.Thing.Player) {
                this.scriptRunner.run(new Script.PlayerDeath(this.playerSelector, this.spawnableSelector));
                return;
            }
            this.scriptRunner.run(new Script.OtherDeath(args.thing));
        }
    }
    Handler.Death = Death;
})(Handler || (Handler = {}));
var Handler;
(function (Handler) {
    class EndSequence extends Events.Handler {
        constructor(gm) {
            super();
            this.gm = gm;
            this.dispatcher = new Map([
                [Events.EventTypes.SwapBodies, this.swapBodies],
                [Events.EventTypes.ThingDead, this.maybeTriggerScript],
            ]);
            this.toHumanoidMap = new Map([
                ['blop-1', 'archerBody'],
                ['blop1Body', 'archerBody'],
                ['sentinel', 'kingBody'],
                ['senBody', 'kingBody'],
            ]);
            this.toEnemyMap = new Map([
                ['archerBody', 'blop1Body'],
                ['kingBody', 'senBody'],
            ]);
        }
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
                        width: 1,
                        height: 1,
                        rotation: degAngle + 90,
                    });
                    this.partyEntities.push(e);
                }
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
            this.toggleExitZones(true);
        }
        unparty() {
            while (this.partyEntities.length > 0) {
                this.ecs.removeEntity(this.partyEntities.pop());
            }
            this.toggleExitZones(false);
        }
        toggleExitZones(setTo) {
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
        handleStartExitSequence(et, args) {
            let ssName = this.sceneManager.infoProvider.startScriptName;
            switch (ssName) {
                case 'StartLevelMultipartFirst':
                case 'StartLevelMultipartMid':
                    this.ecs.getSystem(System.Bookkeeper).endLevel();
                    this.levelSwitchEnabled = true;
                    this.clearReportExitLevel();
                    break;
                default:
                    this.showLevelReport();
                    break;
            }
        }
        showLevelReport() {
            this.ecs.disableSystem(System.PlayerHUDRenderer);
            this.firer.dispatch({
                name: Events.EventTypes.PlayerControl,
                args: { allow: false },
            });
            this.ecs.getSystem(System.AISystem).inCutscene = true;
            this.ecs.getSystem(System.Zoom).request(2, 2000, Tween.easeOutCubic);
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
            this.levelSwitchEnabled = true;
            this.ecs.getSystem(System.Audio).play(['title-sheen']);
        }
        menuKeypress(et, args) {
            this.clearReportExitLevel();
        }
        clearReportExitLevel() {
            if (this.levelSwitchEnabled) {
                this.levelSwitchEnabled = false;
                let guiManager = this.ecs.getSystem(System.GUIManager);
                while (this.guiBookkeep.length > 0) {
                    guiManager.tween(this.guiBookkeep.pop(), 'exit');
                }
                this.ecs.getSystem(System.Zoom).request(1, 3000, Tween.linear);
                let gateSelector = this.ecs.getSystem(System.GateSelector);
                for (let gateE of gateSelector.latest()) {
                    let gateComps = this.ecs.getComponents(gateE);
                    let gate = gateComps.get(Component.Gate);
                    if (!gate.exit) {
                        continue;
                    }
                    this.ecs.removeComponentIfExists(gateE, Component.CollisionShape);
                }
                let playerSelector = this.ecs.getSystem(System.PlayerSelector);
                let player = playerSelector.latest().next().value;
                let fwdParams = {
                    faceExit: true,
                    beforeWaitTime: 500,
                    forwardTime: 900,
                };
                this.ecs.addComponent(player, new Component.AIComponent(AI.Behavior.Forward, fwdParams, true));
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
        sceneSwitcher(t, args) {
            if (args.prep) {
                this.ecs.getSystem(System.Fade).request(1, 500);
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
                let increment = args.increment || 1;
                this.sceneManager.switchToRelative(increment);
            }
        }
    }
    Handler.LevelExiter = LevelExiter;
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
        onSceneSwitch() {
            this.finished = true;
        }
        startGame() {
            let guiM = this.ecs.getSystem(System.GUIManager);
            while (this.gui.length > 0) {
                guiM.tween(this.gui.pop(), 'exit');
            }
            Script.startPlayerMovement(this.ecs, 100, 6000);
            let nextArgs = {
                prep: true,
            };
            this.firer.dispatch({ name: Events.EventTypes.SwitchScene, args: nextArgs }, 5000);
            this.finished = true;
        }
    }
    __decorate([
        override
    ], ExitHandlerTitle.prototype, "clear", null);
    Handler.ExitHandlerTitle = ExitHandlerTitle;
    let timeSlope = 200;
    let timeIntercept = 14000;
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
            for (let sid of ['creditsWash', 'creditsLetterBoxTop', 'creditsLetterBoxBot']) {
                guiM.createSprite(sid);
            }
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
        onSceneSwitch() {
            this.finished = true;
        }
        finishCredits() {
            let nextArgs = {
                prep: true,
            };
            this.firer.dispatch({ name: Events.EventTypes.SwitchScene, args: nextArgs });
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
        onSceneSwitch() {
            this.finished = true;
        }
        finishRecap() {
            let nextArgs = {
                prep: true,
            };
            this.firer.dispatch({ name: Events.EventTypes.SwitchScene, args: nextArgs });
            this.finished = true;
        }
    }
    Handler.ExitHandlerRecap = ExitHandlerRecap;
})(Handler || (Handler = {}));
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
            for (let [name, config] of this.fxConfigs.entries()) {
                this.emitters.set(name, new FX.Emitter(this.ecs, this.factory, config.factory, config.duration, config.pool));
            }
        }
        onClear() {
            for (let emitter of this.emitters.values()) {
                emitter.refillPools();
            }
        }
        emit(fxName, x, y, direction = null) {
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
var Handler;
(function (Handler) {
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
        hit(et, args) {
            let comps = this.ecs.getComponents(args.victim);
            if (!comps.has(Component.Attributes)) {
                return;
            }
            let attributes = comps.get(Component.Attributes);
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
            let comps = this.ecs.getComponents(args.thing);
            if (!comps.has(Component.Attributes)) {
                return;
            }
            let attributes = comps.get(Component.Attributes);
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
var Handler;
(function (Handler) {
    class GateManager extends Events.Handler {
        constructor() {
            super(...arguments);
            this.dispatcher = new Map([
                [Events.EventTypes.ThingDead, this.eventCheckGates],
                [Events.EventTypes.ItemCollected, this.eventCheckGates],
                [Events.EventTypes.CheckGates, this.manualCheckGates],
            ]);
            this.gateBookkepingCache = new Counter();
        }
        ensureOpen(gateComps, silent) {
            let gate = gateComps.get(Component.Gate);
            let wasOpen = false;
            if (gateComps.has(Component.Activity)) {
                let activity = gateComps.get(Component.Activity);
                wasOpen = activity.action === Action.Opening;
                if (!wasOpen) {
                    activity.action = Action.Opening;
                }
            }
            if (!silent && !wasOpen) {
                this.firer.dispatch({
                    name: Events.EventTypes.GateOpen,
                    args: {},
                });
            }
            if (!gate.exit) {
                if (gateComps.has(Component.CollisionShape)) {
                    gateComps.get(Component.CollisionShape).disabled = true;
                }
            }
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
            if (gateComps.has(Component.Activity)) {
                gateComps.get(Component.Activity).action = Action.Idle;
            }
            if (gateComps.has(Component.CollisionShape)) {
                gateComps.get(Component.CollisionShape).disabled = false;
            }
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
        getMarkedGateID(entity) {
            let comps = this.ecs.getComponents(entity);
            if (comps.has(Component.Dead)) {
                return null;
            }
            if (comps.has(Component.Enemy)) {
                let enemy = comps.get(Component.Enemy);
                if (enemy.gatekeeper) {
                    return 'EXIT';
                }
                return enemy.gateID;
            }
            else if (comps.has(Component.Item)) {
                return comps.get(Component.Item).gateID;
            }
            else if (comps.has(Component.Checkpoint)) {
                return comps.get(Component.Checkpoint).gateID;
            }
            console.warn('Checked gateID of non-implemented entity!');
            return null;
        }
        checkGates(silent) {
            let enemySelector = this.ecs.getSystem(System.EnemySelector);
            let itemSelector = this.ecs.getSystem(System.ItemSelector);
            let checkpointSelector = this.ecs.getSystem(System.CheckpointSelector);
            let gateSelector = this.ecs.getSystem(System.GateSelector);
            this.gateBookkepingCache.clear();
            for (let selector of [enemySelector, itemSelector, checkpointSelector]) {
                for (let entity of selector.latest()) {
                    let gateID = this.getMarkedGateID(entity);
                    if (gateID != null) {
                        this.gateBookkepingCache.increment(gateID);
                    }
                }
            }
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
    class SlowMotion extends Events.Handler {
        constructor() {
            super(...arguments);
            this.dispatcher = new Map([
                [Events.EventTypes.ThingDead, this.thingDeadMaybeSlowdown],
                [Events.EventTypes.EnemyStaggerPre, this.enemyStaggerSlowdown],
            ]);
        }
        enemyStaggerSlowdown(et, args) {
            if (args.heavyEffects) {
                this.ecs.slowMotion.request(SlowMotion.PAUSE, 250);
            }
            let nextArgs = args;
            this.firer.dispatch({ name: Events.EventTypes.EnemyStagger, args: args }, 1);
        }
        thingDeadMaybeSlowdown(et, args) {
        }
    }
    SlowMotion.PAUSE = 10000;
    Handler.SlowMotion = SlowMotion;
})(Handler || (Handler = {}));
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
            let atk = args.attackInfo;
            if (atk.sounds != null) {
                this.ecs.getSystem(System.Audio).play(atk.sounds.hit, args.location);
            }
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
                    let location = args.location;
                    if (vComps.has(Component.AIComponent) &&
                        vComps.get(Component.AIComponent).behavior === AI.Behavior.Sawtooth) {
                        location = null;
                    }
                    this.ecs.getSystem(System.Audio).play(audible.sounds.killed, location);
                }
            }
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
        floatText(et, args) {
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
var Handler;
(function (Handler) {
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
            this.guiEnts.push(...this.ecs.getSystem(System.GUIManager)
                .runSequence('instructions', textReplacements, imgReplacements));
            this.firer.dispatch({
                name: Events.EventTypes.PlayerControl,
                args: { allow: false },
            });
            this.ecs.getSystem(System.AISystem).inCutscene = true;
        }
        maybeHideInstructions(et, args) {
            if (this.guiEnts.length > 0) {
                let guiM = this.ecs.getSystem(System.GUIManager);
                while (this.guiEnts.length > 0) {
                    guiM.tween(this.guiEnts.pop(), 'exit');
                }
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
        showControl(control) {
            let textReplacements = new Map([
                ['controlsText', control.txt],
            ]);
            this.guiEnts.push(...this.ecs.getSystem(System.GUIManager)
                .runSequence('controls', textReplacements));
        }
        hideControl() {
            let guiM = this.ecs.getSystem(System.GUIManager);
            while (this.guiEnts.length > 0) {
                guiM.tween(this.guiEnts.pop(), 'exit');
            }
        }
        onZoneTransition(et, args) {
            let cid = this.ecs.getComponents(args.zone).get(Component.Zone).controlID;
            if (cid == null) {
                return;
            }
            let control = this.controls[cid];
            if (control == null) {
                throw new Error('Unknown control ID: "' + cid + '"');
            }
            if (args.enter) {
                this.showControl(control);
            }
            else {
                this.hideControl();
            }
        }
    }
    __decorate([
        override
    ], Controls.prototype, "clear", null);
    Handler.Controls = Controls;
})(Handler || (Handler = {}));
var Script;
(function (Script) {
    function disableCollisionsHelper(ecs, thing) {
        let comps = ecs.getComponents(thing);
        if (!comps.has(Component.Dead)) {
            return;
        }
        if (comps.has(Component.CollisionShape)) {
            let cShape = comps.get(Component.CollisionShape);
            cShape.disabled = true;
        }
    }
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
            this.reviveHealReposition(this.spawnableSelector.latest());
            this.eventsManager.dispatch({
                name: Events.EventTypes.CheckGates,
                args: {},
            });
        }
        reviveHealReposition(iter) {
            for (let entity of iter) {
                let comps = this.ecs.getComponents(entity);
                if (!comps.has(Component.Spawnable)) {
                    continue;
                }
                this.ecs.removeComponentIfExists(entity, Component.Dead);
                if (comps.has(Component.Health)) {
                    let health = comps.get(Component.Health);
                    health.current = health.maximum;
                }
                let position = comps.get(Component.Position);
                let spawnable = comps.get(Component.Spawnable);
                position.p = spawnable.position;
                position.angle = spawnable.angle;
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
            this.ecs.getSystem(System.Bookkeeper).endLevel();
            this.ecs.getSystem(System.Zoom).request(2.6, 750, Tween.easeInCubic);
            this.eventsManager.dispatch({
                name: Events.EventTypes.PlayerControl,
                args: { allow: false },
            });
            for (let enemy of this.ecs.getSystem(System.EnemySelector).latest()) {
                let eComps = this.ecs.getComponents(enemy);
                if (eComps.has(Component.Health)) {
                    eComps.get(Component.Health).current = 0;
                }
            }
            let audio = this.ecs.getSystem(System.Audio);
            audio.playMusic([]);
            audio.play(['end-sound']);
        }
        zoomOut() {
            this.ecs.getSystem(System.Zoom).request(0.6, 10000, Tween.easeInCubic);
        }
        swapBodies(toHumanoid) {
            let eArgs = {
                toHumanoid: toHumanoid,
            };
            this.eventsManager.dispatch({
                name: Events.EventTypes.SwapBodies,
                args: eArgs,
            });
            if (toHumanoid) {
                this.ecs.getSystem(System.GUIManager).runSequence('hit');
            }
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
var Script;
(function (Script) {
    function startLevelInit(allowAllAIs) {
        this.eventsManager.dispatch({
            name: Events.EventTypes.PlayerControl,
            args: { allow: false },
        });
        if (!allowAllAIs) {
            this.ecs.getSystem(System.AISystem).inCutscene = true;
        }
        this.ecs.getSystem(System.Fade).request(0, 1000);
    }
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
        let gateSelector = this.ecs.getSystem(System.GateSelector);
        for (let gateEntity of gateSelector.latest()) {
            let gateComps = this.ecs.getComponents(gateEntity);
            let gateComp = gateComps.get(Component.Gate);
            if (!gateComp.start) {
                continue;
            }
            let activity = gateComps.get(Component.Activity);
            activity.action = Action.Opening;
            this.eventsManager.dispatch({
                name: Events.EventTypes.GateOpen,
                args: {},
            });
        }
    }
    function startPlayerMovement(ecs, beforeWaitTime, forwardTime) {
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
            let playerComps = this.ecs.getComponents(playerEntity);
            if (playerComps.has(Component.Spawnable)) {
                let spawnable = playerComps.get(Component.Spawnable);
                let pos = playerComps.get(Component.Position);
                spawnable.position.copyFrom_(pos.p);
            }
            this.ecs.removeComponentIfExists(playerEntity, Component.AIComponent);
        }
        this.eventsManager.dispatch({
            name: Events.EventTypes.PlayerControl,
            args: { allow: true },
        });
        let eArgs = {};
        this.eventsManager.dispatch({
            name: Events.EventTypes.GameplayStart,
            args: eArgs,
        });
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
    class StartLevelMultipartFirst extends StartLevel {
    }
    Script.StartLevelMultipartFirst = StartLevelMultipartFirst;
    class StartLevelMultipartMid extends StartLevelDev {
    }
    Script.StartLevelMultipartMid = StartLevelMultipartMid;
    class StartLevelMultipartLast extends StartLevelDev {
    }
    Script.StartLevelMultipartLast = StartLevelMultipartLast;
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
            startLevelInit.call(this, true);
            this.eventsManager.add(new Handler.ExitHandlerTitle());
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
            startLevelInit.call(this);
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
            startLevelInit.call(this);
            this.eventsManager.add(new Handler.ExitHandlerRecap());
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
var Script;
(function (Script) {
    class TestTween extends Script.Script {
        constructor() {
            super(...arguments);
            this.code = new Map([]);
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
var System;
(function (System) {
    class AIArcher {
        static update(delta, ecs, aspect) {
            let input = aspect.get(Component.Input);
            let position = aspect.get(Component.Position);
            let shortest = Infinity;
            let closest = AIArcher.cacheClosest;
            for (let mover of aspect.playerSelector.latest()) {
                if (mover == aspect.entity) {
                    continue;
                }
                let moverComps = ecs.getComponents(mover);
                if (ecs.getComponents(mover).has(Component.Dead)) {
                    continue;
                }
                let moverPos = moverComps.get(Component.Position);
                let dist = position.p.sqDistTo(moverPos.p);
                if (dist < shortest) {
                    closest.copyFrom_(moverPos.p);
                    shortest = dist;
                }
            }
            if (shortest === Infinity) {
                input.attack = false;
                input.intent.y = Physics.STOP;
                return;
            }
            let minArcherDist = 500000;
            if (shortest <= minArcherDist) {
                input.intent.y = Physics.DOWN;
            }
            else {
                input.intent.y = Physics.STOP;
            }
            input.targetAngle = position.p.pixiAngleTo(closest);
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
    function angleDiff(a, b) {
        let raw = Math.abs(a - b);
        if (raw < Math.PI) {
            return raw;
        }
        return Constants.TWO_PI - raw;
    }
    class CowardFSM extends AI.BaseFSM {
        constructor(ecs, aspect) {
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
            let params = this.getParams();
            let playerDistance = this.playerDist();
            if (playerDistance > params.reactRadius) {
                return CowardState.Wait;
            }
            let playerAngle = this.getPlayerAngle();
            let playerToThisAngle = this.getPlayerPos().pixiAngleTo(this.getPos());
            let testAngle = angleDiff(playerAngle, playerToThisAngle);
            let cutoff = Constants.DEG2RAD * params.playerLookDegrees;
            if (testAngle < cutoff) {
                return CowardState.Flee;
            }
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
        static ensureBlackboard(ecs, aspect) {
            if (!aspect.blackboards.has(AICoward.name)) {
                let bb = {
                    fsm: new CowardFSM(ecs, aspect),
                };
                aspect.blackboards.set(AICoward.name, bb);
            }
            return aspect.blackboards.get(AICoward.name);
        }
        static update(delta, ecs, aspect) {
            let blackboard = AICoward.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
            let aiComp = aspect.get(Component.AIComponent);
            aiComp.debugState = CowardState[blackboard.fsm.cur];
        }
    }
    System.AICoward = AICoward;
})(System || (System = {}));
var System;
(function (System) {
    let FollowSawtoothState;
    (function (FollowSawtoothState) {
        FollowSawtoothState[FollowSawtoothState["Idle"] = 0] = "Idle";
        FollowSawtoothState[FollowSawtoothState["Pursue"] = 1] = "Pursue";
        FollowSawtoothState[FollowSawtoothState["Countdown"] = 2] = "Countdown";
        FollowSawtoothState[FollowSawtoothState["Explode"] = 3] = "Explode";
    })(FollowSawtoothState || (FollowSawtoothState = {}));
    class FollowSawtoothFSM extends AI.BaseFSM {
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
            if (this.dead()) {
                return FollowSawtoothState.Explode;
            }
            else {
                let activity = this.aspect.get(Component.Activity);
                activity.manual = false;
                return FollowSawtoothState.Idle;
            }
        }
        constructor(ecs, aspect) {
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
    }
    class AIFollowSawtooth {
        static ensureBlackboard(ecs, aspect) {
            if (!aspect.blackboards.has(AIFollowSawtooth.name)) {
                let bb = {
                    fsm: new FollowSawtoothFSM(ecs, aspect),
                };
                aspect.blackboards.set(AIFollowSawtooth.name, bb);
            }
            return aspect.blackboards.get(AIFollowSawtooth.name);
        }
        static update(delta, ecs, aspect) {
            let blackboard = AIFollowSawtooth.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
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
            let fwdParams = this.getParams();
            if (!fwdParams.faceExit) {
                return;
            }
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
        static ensureBlackboard(ecs, aspect) {
            if (!aspect.blackboards.has(AIForward.name)) {
                let bb = {
                    fsm: new ForwardFSM(ecs, aspect),
                };
                aspect.blackboards.set(AIForward.name, bb);
            }
            return aspect.blackboards.get(AIForward.name);
        }
        static update(delta, ecs, aspect) {
            let blackboard = AIForward.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
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
        static ensureBlackboard(ecs, aspect) {
            if (!aspect.blackboards.has(AISwingTimer.name)) {
                let bb = {
                    fsm: new SwingTimerFSM(ecs, aspect),
                };
                aspect.blackboards.set(AISwingTimer.name, bb);
            }
            return aspect.blackboards.get(AISwingTimer.name);
        }
        static update(delta, ecs, aspect) {
            let blackboard = AISwingTimer.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
            let aiComp = aspect.get(Component.AIComponent);
            aiComp.debugState = SwingTimerState[blackboard.fsm.cur];
        }
    }
    System.AISwingTimer = AISwingTimer;
})(System || (System = {}));
var System;
(function (System) {
    let MimicState;
    (function (MimicState) {
        MimicState[MimicState["Hide"] = 0] = "Hide";
        MimicState[MimicState["Smash"] = 1] = "Smash";
        MimicState[MimicState["Pursue"] = 2] = "Pursue";
        MimicState[MimicState["GoHome"] = 3] = "GoHome";
        MimicState[MimicState["Attack"] = 4] = "Attack";
    })(MimicState || (MimicState = {}));
    class MimicFSM extends AI.BaseFSM {
        playerHomeDist() {
            return this.playerDistTo(this.getBlackboard().home);
        }
        aggressiveNext() {
            let params = this.getParams();
            if (this.playerHomeDist() > params.pursuitDistance) {
                return MimicState.GoHome;
            }
            if (this.facingPlayer() && this.alivePlayerInRange(params.attackRange)) {
                return MimicState.Attack;
            }
            return MimicState.Pursue;
        }
        hideNext() {
            if (this.playerDist() <= this.getParams().noticeDistance) {
                return MimicState.Smash;
            }
            return MimicState.Hide;
        }
        smashDo() {
            let input = this.aspect.get(Component.Input);
            input.quickAttack = true;
        }
        smashNext() {
            return MimicState.Pursue;
        }
        pursueDo() {
            let input = this.aspect.get(Component.Input);
            input.quickAttack = false;
            this.facePlayer();
            this.noAttack();
            if (!this.alivePlayerInRange(this.getParams().attackRange)) {
                this.moveForward();
            }
        }
        goHomeDo() {
            this.faceTarget(this.getBlackboard().home);
            this.noAttack();
            this.moveForward();
        }
        goHomeNext() {
            if (this.playerHomeDist() <= this.getParams().pursuitDistance) {
                return MimicState.Pursue;
            }
            if (this.closeTo(this.getBlackboard().home)) {
                return MimicState.Hide;
            }
            return MimicState.GoHome;
        }
        attackNext() {
            if (this.swinging()) {
                return MimicState.Attack;
            }
            return this.aggressiveNext();
        }
        constructor(ecs, aspect) {
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
    }
    class AIMimic {
        static ensureBlackboard(ecs, aspect) {
            if (!aspect.blackboards.has(AIMimic.name)) {
                let position = aspect.get(Component.Position);
                let bb = {
                    home: position.p.copy(),
                    fsm: new MimicFSM(ecs, aspect),
                };
                aspect.blackboards.set(AIMimic.name, bb);
            }
            return aspect.blackboards.get(AIMimic.name);
        }
        static update(delta, ecs, aspect) {
            let blackboard = AIMimic.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
            let aiComp = aspect.get(Component.AIComponent);
            aiComp.debugState = MimicState[blackboard.fsm.cur];
        }
    }
    System.AIMimic = AIMimic;
})(System || (System = {}));
var System;
(function (System) {
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
            if (!this.getParams().dodgeRotate) {
                this.facePlayer();
            }
            let bb = this.getBlackboard();
            bb.dodgeDirection = Probability.uniformChoice([-1, 1]);
            bb.dodgesPerformed++;
        }
        dodgeDodgeBody() {
            if (this.getParams().dodgeRotate) {
                this.facePlayer();
            }
            this.aspect.get(Component.Input).intent.x = this.getBlackboard().dodgeDirection;
        }
        dodgeDodgeNext() {
            if (this.dead()) {
                return SawtoothState.Countdown;
            }
            if (this.elapsedInCur <= this.getParams().dodgeDodgeTime) {
                return SawtoothState.DodgeDodge;
            }
            let bb = this.getBlackboard();
            let params = this.getParams();
            if (bb.dodgesPerformed < params.dodges) {
                return SawtoothState.DodgeWait;
            }
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
            let rangeCheckState = this.rangeDetectNext();
            if (rangeCheckState != SawtoothState.DodgeDodge) {
                bb.dodgesPerformed = 0;
                return rangeCheckState;
            }
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
            let rangeCheckState = this.rangeDetectNext();
            if (rangeCheckState !== SawtoothState.DodgeDodge) {
                return rangeCheckState;
            }
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
            if (this.dead()) {
                return SawtoothState.Explode;
            }
            else {
                let activity = this.aspect.get(Component.Activity);
                activity.manual = false;
                return SawtoothState.Idle;
            }
        }
        constructor(ecs, aspect) {
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
    }
    class AISawtooth {
        static ensureBlackboard(ecs, aspect) {
            if (!aspect.blackboards.has(AISawtooth.name)) {
                let bb = {
                    dodgesPerformed: 0,
                    dodgeDirection: -1,
                    fsm: new SawtoothFSM(ecs, aspect),
                };
                aspect.blackboards.set(AISawtooth.name, bb);
            }
            return aspect.blackboards.get(AISawtooth.name);
        }
        static update(delta, ecs, aspect) {
            let blackboard = AISawtooth.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
            let aiComp = aspect.get(Component.AIComponent);
            aiComp.debugState = SawtoothState[blackboard.fsm.cur];
        }
    }
    System.AISawtooth = AISawtooth;
})(System || (System = {}));
var System;
(function (System) {
    let SentinelState;
    (function (SentinelState) {
        SentinelState[SentinelState["AtHome"] = 0] = "AtHome";
        SentinelState[SentinelState["GoHome"] = 1] = "GoHome";
        SentinelState[SentinelState["Pursue"] = 2] = "Pursue";
        SentinelState[SentinelState["Attack"] = 3] = "Attack";
    })(SentinelState || (SentinelState = {}));
    class SentinelFSM extends AI.BaseFSM {
        playerHomeDist() {
            return this.playerDistTo(this.getBlackboard().home);
        }
        aggressiveNext() {
            let params = this.getParams();
            if (this.playerDead() || (params.forget && this.playerHomeDist() > params.pursuitDistance)) {
                return SentinelState.GoHome;
            }
            if (this.facingPlayer() && this.alivePlayerInRange(params.attackRange)) {
                return SentinelState.Attack;
            }
            return SentinelState.Pursue;
        }
        atHomeNext() {
            if (this.playerHomeDist() <= this.getParams().pursuitDistance) {
                return SentinelState.Pursue;
            }
            return SentinelState.AtHome;
        }
        goHomeDo() {
            this.faceTarget(this.getBlackboard().home);
            this.noAttack();
            this.moveForward();
        }
        goHomeNext() {
            if (this.playerHomeDist() <= this.getParams().pursuitDistance) {
                return SentinelState.Pursue;
            }
            if (this.closeTo(this.getBlackboard().home)) {
                return SentinelState.AtHome;
            }
            return SentinelState.GoHome;
        }
        playerBowOut() {
            let pComps = this.getPlayerComps();
            if (!pComps.has(Component.Armed)) {
                return false;
            }
            let armed = pComps.get(Component.Armed);
            return armed.active.partID === PartID.Bow;
        }
        pursueDo() {
            this.facePlayer();
            this.noAttack();
            this.aspect.get(Component.Input).block = this.playerBowOut();
            if (!this.alivePlayerInRange(this.getParams().attackRange)) {
                this.moveForward();
            }
        }
        noBlock() {
            this.aspect.get(Component.Input).block = false;
        }
        attackNext() {
            if (this.swinging()) {
                return SentinelState.Attack;
            }
            return this.aggressiveNext();
        }
        constructor(ecs, aspect) {
            super(ecs, aspect, SentinelState.AtHome);
            this.sysName = AISentinel.name;
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
    }
    class AISentinel {
        static ensureBlackboard(ecs, aspect) {
            if (!aspect.blackboards.has(AISentinel.name)) {
                let position = aspect.get(Component.Position);
                let bb = {
                    home: position.p.copy(),
                    fsm: new SentinelFSM(ecs, aspect),
                };
                aspect.blackboards.set(AISentinel.name, bb);
            }
            return aspect.blackboards.get(AISentinel.name);
        }
        static update(delta, ecs, aspect) {
            let blackboard = AISentinel.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
            let aiComp = aspect.get(Component.AIComponent);
            aiComp.debugState = SentinelState[blackboard.fsm.cur];
        }
    }
    System.AISentinel = AISentinel;
})(System || (System = {}));
var System;
(function (System) {
    let SpiderState;
    (function (SpiderState) {
        SpiderState[SpiderState["Wait"] = 0] = "Wait";
        SpiderState[SpiderState["Move"] = 1] = "Move";
        SpiderState[SpiderState["Face"] = 2] = "Face";
        SpiderState[SpiderState["Attack"] = 3] = "Attack";
    })(SpiderState || (SpiderState = {}));
    class SpiderFSM extends AI.BaseFSM {
        waitswapUnlessPreemp(cur, other, preemp, maxDuration) {
            if (this.alivePlayerInRange(this.getParams().attackRange)) {
                return preemp;
            }
            if (this.elapsedInCur >= maxDuration) {
                return other;
            }
            return cur;
        }
        waitPre() {
            let params = this.getParams();
            this.getBlackboard().waitDuration = Probability.uniformInt(params.waitMin, params.waitMax);
        }
        waitNext() {
            return this.waitswapUnlessPreemp(SpiderState.Wait, SpiderState.Move, SpiderState.Face, this.getBlackboard().waitDuration);
        }
        movePre() {
            let blackbaord = this.aspect.blackboards.get(AISpider.name);
            blackbaord.moveAngle = angleClamp(Math.random() * Constants.TWO_PI);
            let params = this.getParams();
            blackbaord.moveDuration = Probability.uniformInt(params.moveMin, params.moveMax);
        }
        moveDo() {
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
        aggressiveNext() {
            let playerInRange = this.alivePlayerInRange(this.getParams().attackRange);
            if (!playerInRange) {
                return SpiderState.Wait;
            }
            else {
                return this.facingPlayer() ? SpiderState.Attack : SpiderState.Face;
            }
        }
        faceDo() {
            this.facePlayer();
            this.noAttack();
        }
        attackNext() {
            if (this.swinging()) {
                return SpiderState.Attack;
            }
            return this.aggressiveNext();
        }
        constructor(ecs, aspect) {
            super(ecs, aspect, SpiderState.Wait);
            this.sysName = AISpider.name;
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
    }
    class AISpider {
        static ensureBlackboard(ecs, aspect) {
            if (!aspect.blackboards.has(AISpider.name)) {
                let bb = {
                    fsm: new SpiderFSM(ecs, aspect),
                    waitDuration: -1,
                    moveAngle: -1,
                    moveDuration: -1,
                };
                aspect.blackboards.set(AISpider.name, bb);
            }
            return aspect.blackboards.get(AISpider.name);
        }
        static update(delta, ecs, aspect) {
            let blackboard = AISpider.ensureBlackboard(ecs, aspect);
            blackboard.fsm.update(delta);
            let aiComp = aspect.get(Component.AIComponent);
            aiComp.debugState = SpiderState[blackboard.fsm.cur];
        }
    }
    System.AISpider = AISpider;
})(System || (System = {}));
var System;
(function (System) {
    class AnimationTicker extends Engine.System {
        constructor() {
            super(...arguments);
            this.componentsRequired = new Set([
                Component.Animatable.name,
                Component.AnimationTickable.name,
            ]);
        }
        update(delta, entities) {
            for (let aspect of entities.values()) {
                let animatable = aspect.get(Component.Animatable);
                let keepUpdating = false;
                if (!animatable.pause) {
                    for (let key of animatable.state.activeKeys) {
                        let ac = animatable.state.animations.get(key);
                        keepUpdating = ac.animation.update(delta) || keepUpdating;
                        if (ac.part === Part.Core) {
                            animatable.coreFrame = ac.animation.frame;
                        }
                    }
                }
                if (!keepUpdating) {
                    this.ecs.removeComponent(aspect.entity, Component.AnimationTickable);
                }
            }
        }
    }
    System.AnimationTicker = AnimationTicker;
})(System || (System = {}));
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
        static begin(ecs, entity, blood) {
            if (blood == null) {
                return;
            }
            let comps = ecs.getComponents(entity);
            if (comps.has(Component.Bleeding)) {
                let bleeding = comps.get(Component.Bleeding);
                bleeding.startTime = ecs.gametime;
                bleeding.duration = blood.duration;
                bleeding.fx = clone(blood.fx);
                return;
            }
            ecs.addComponent(entity, new Component.Bleeding(blood));
        }
        makeAspect() {
            return new DeathBloodAspect();
        }
        update(delta, entities) {
            super.update(delta, entities);
            for (let aspect of entities.values()) {
                let pos = aspect.get(Component.Position);
                let bleeding = aspect.get(Component.Bleeding);
                aspect.timeSinceLastEmission += delta;
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
var System;
(function (System) {
    class BookkeeperRenderer extends Engine.System {
        constructor(stage, viewportDims, startDisabled = true) {
            super(startDisabled);
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
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
            let buffer = 8;
            let spacingH = 54;
            let decimalW = 42;
            let textH = 18;
            let squeezeY = 2;
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
        let base = numericToDisplay(r);
        base.secretsFound = r.secretsFound + '/' + nLevels;
        return base;
    }
    function mergeNumericReports(a, b) {
        if (a == null && b == null) {
            throw new Error('Cannot merge two null reports');
        }
        if (a == null) {
            return b;
        }
        if (b == null) {
            return a;
        }
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
            this.sumElapsed = 0;
        }
        begin() {
            if (this.startTime === -1) {
                this.startTime = (performance || Date).now();
            }
            return this;
        }
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
        serialize() {
            return JSON.stringify(this);
        }
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
        softReset() {
            this.secretsFound = 0;
        }
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
        debugElapsed() {
            let cur = 0;
            if (this.startTime != -1) {
                cur = (performance || Date).now() - this.startTime;
            }
            return this.sumElapsed + cur;
        }
    }
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
        setActive(levelNum) {
            if (this.levelInfos.has(this.curLevelNum) && this.curLevelNum != levelNum) {
                this.debugTimeCache += this.levelInfos.get(this.curLevelNum).elapsed();
            }
            if (!this.levelInfos.has(levelNum)) {
                this.levelInfos.set(levelNum, new LevelInfo());
            }
            this.curLevelNum = levelNum;
            return this.levelInfos.get(levelNum).reset();
        }
        softReset() {
            if (this.levelInfos.has(this.curLevelNum)) {
                this.levelInfos.get(this.curLevelNum).softReset();
            }
        }
        startLevel() {
            if (!this.levelInfos.has(this.curLevelNum)) {
                console.warn('Level not found. Improper use of bookkeeper. Should be for debugging only.');
                this.setActive(this.curLevelNum);
            }
            this.levelInfos.get(this.curLevelNum).begin();
        }
        endLevel() {
            if (!this.levelInfos.has(this.curLevelNum)) {
                console.error('Bookkeeper could not end level ' + this.curLevelNum + ' because it did not know about it?');
                return;
            }
            this.levelInfos.get(this.curLevelNum).end();
        }
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
        secretFound() {
            this.incrementStat('secretsFound');
        }
        getSecretFound() {
            return this.levelInfos.has(this.curLevelNum) ?
                this.levelInfos.get(this.curLevelNum).secretsFound > 0 :
                false;
        }
        maybeShowInstruction(instructionID) {
            if (this.instructionsShown.has(instructionID)) {
                return;
            }
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
        serialize() {
            let sCurLevel = this.curLevelNum + '';
            let sInstructions = 'none';
            if (this.instructionsShown.size > 0) {
                sInstructions = Array.from(this.instructionsShown).join(';');
            }
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
            let [sCurLevel, sInstructions, sLevelInfos] = s.split('|');
            this.curLevelNum = parseInt(sCurLevel);
            if (sInstructions != 'none') {
                this.instructionsShown = new Set(sInstructions.split(';'));
            }
            if (sLevelInfos != 'none') {
                for (let sLevelInfo of sLevelInfos.split(';')) {
                    let sep = sLevelInfo.indexOf(':');
                    let n = parseInt(sLevelInfo.substring(0, sep));
                    let levelInfo = (new LevelInfo()).from(sLevelInfo.substring(sep + 1));
                    this.levelInfos.set(n, levelInfo);
                    if (n != this.curLevelNum) {
                        this.debugTimeCache += levelInfo.elapsed();
                    }
                }
            }
        }
        reset() {
            this.debugTimeCache = 0;
            this.instructionsShown.clear();
            this.levelInfos.clear();
        }
        update(delta, entities) { }
    }
    System.Bookkeeper = Bookkeeper;
})(System || (System = {}));
var System;
(function (System) {
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
        disableItem(aspect) {
            aspect.get(Component.CollisionShape).disabled = true;
            this.ecs.addComponent(aspect.entity, new Component.Dead());
        }
        handleHealth(aspect) {
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
            let playerHealth = playerComps.get(Component.Health);
            if (playerHealth.current == playerHealth.maximum) {
                return false;
            }
            let itemHealth = aspect.get(Component.Health);
            playerHealth.current = Math.min(playerHealth.current + itemHealth.maximum, playerHealth.maximum);
            return true;
        }
        handleDoughnut(aspect) {
            this.ecs.getSystem(System.Bookkeeper).secretFound();
            return true;
        }
        handleUpgrade(aspect, newLayer, sound, delay = 0) {
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
            if (sound) {
                this.ecs.getSystem(System.DelaySpeaker).enqueue({
                    delay: delay,
                    options: [sound],
                });
            }
            this.ecs.getSystem(System.GUIManager).runSequence('upgrade');
            return true;
        }
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
                if (!this.handlers.get(item.behavior).call(this, aspect)) {
                    return;
                }
                this.disableItem(aspect);
                if (item.instructionID != null) {
                    this.ecs.getSystem(System.Bookkeeper).maybeShowInstruction(item.instructionID);
                }
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
var System;
(function (System) {
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
                let cShape = aspect.get(Component.CollisionShape);
                if (!cShape.cTypes.has(CollisionType.Projectile)) {
                    continue;
                }
                let hitWall = false;
                for (let collider of cShape.collisionsFresh.keys()) {
                    let colliderComps = this.ecs.getComponents(collider);
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
                this.ecs.removeComponentIfExists(entity, Component.Input);
                let atk = aspect.get(Component.Attack);
                atk.info.damage = 0;
                if (atk.info.sounds != null && atk.info.sounds.hit != null) {
                    this.ecs.getSystem(System.Audio).play(atk.info.sounds.hit, aspect.get(Component.Position).p);
                }
            }
        }
    }
    System.CollisionProjectile = CollisionProjectile;
})(System || (System = {}));
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
                if (!zone.active) {
                    continue;
                }
                let playerFound = false;
                for (let collider of cShape.collisionsFresh.keys()) {
                    let colliderComps = this.ecs.getComponents(collider);
                    if (colliderComps.has(Component.PlayerInput)) {
                        playerFound = true;
                        break;
                    }
                }
                if (zone.containsPlayer != playerFound) {
                    let eName = Events.EventTypes.ZoneTransition;
                    let eArgs = {
                        enter: playerFound,
                        zone: entity,
                    };
                    this.eventsManager.dispatch({ name: eName, args: eArgs });
                }
                zone.containsPlayer = playerFound;
            }
        }
    }
    System.CollisionZone = CollisionZone;
})(System || (System = {}));
var System;
(function (System) {
    class ControlsScreenAspect extends Engine.Aspect {
        get visible() {
            return this._visible;
        }
        set visible(v) {
            this.overlay.alpha = v ? 1.0 : 0.0;
            this._visible = v;
        }
        constructor(screenSize) {
            super();
            this.overlay = Stage.Sprite.build('HUD/controlsScreen.png', ZLevelHUD.Overlay, StageTarget.HUD, new Point(), new Point(0.5, 0.5));
            this.visible = true;
            this.overlay.position.set(screenSize.x / 2, screenSize.y / 2);
        }
    }
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
            this.stage.add(aspect.overlay);
        }
        update(delta, entities) {
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
var System;
(function (System) {
    class DeathAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            this.prevHealth = -1;
        }
    }
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
            let thing = System.Util.getThing(this.ecs, aspect.entity);
            this.ecs.addComponent(aspect.entity, new Component.Dead());
            if (aspect.has(Component.Attributes)) {
                let attr = aspect.get(Component.Attributes);
                System.Bleeding.begin(this.ecs, aspect.entity, attr.data.deathBlood);
            }
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
                if ((aspect.prevHealth !== 0 && health.current === 0) ||
                    (health.current === 0 && !aspect.has(Component.Dead))) {
                    this.die(aspect);
                }
                aspect.prevHealth = health.current;
            }
        }
    }
    __decorate([
        override
    ], Death.prototype, "makeAspect", null);
    System.Death = Death;
})(System || (System = {}));
var System;
(function (System) {
    class DebugGameSpeed extends Engine.System {
        constructor(keyboard) {
            super(false, true);
            this.keyboard = keyboard;
            this.prevDigits = [false, false, false, false];
            this.digitKeys = [GameKey.Digit1, GameKey.Digit2, GameKey.Digit3, GameKey.Digit4];
            this.slowScales = [1, 2, 4, 8];
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
        }
        update(delta, entities) {
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
    class DebugHTMLComponents extends Engine.System {
        constructor(el) {
            super(false, true);
            this.el = el;
            this.componentsRequired = new Set([
                Component.DebugInspection.name,
            ]);
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
                while (!pastTable && aspect.rowkeys[ti] < cName) {
                    aspect.cellmap.delete(aspect.rowkeys[ti]);
                    aspect.rowkeys.splice(ti, 1);
                    aspect.table.deleteRow(ti);
                }
                if (pastTable || aspect.rowkeys[ti] > cName) {
                    let row = aspect.table.insertRow(ti);
                    let vCell = fillRow(row, cName, cToString);
                    aspect.cellmap.set(cName, vCell);
                    aspect.rowkeys.splice(ti, 0, cName);
                    ti++;
                    continue;
                }
                if (aspect.rowkeys[ti] === cName) {
                    aspect.cellmap.get(cName).innerText = cToString;
                    ti++;
                    continue;
                }
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
var System;
(function (System) {
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
            let latestTime = -1;
            let latestEntity = null;
            for (let [entity, aspect] of entities.entries()) {
                let di = aspect.get(Component.DebugInspection);
                if (di.pickTime > latestTime) {
                    latestTime = di.pickTime;
                    latestEntity = entity;
                }
            }
            for (let [entity, aspect] of entities.entries()) {
                if (entity !== latestEntity) {
                    this.ecs.removeComponent(entity, Component.DebugInspection);
                }
            }
        }
    }
    System.DebugInspectionUniquifier = DebugInspectionUniquifier;
})(System || (System = {}));
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
            let position = aspect.get(Component.Position);
            aspect.pos = new Stage.Graphics(ZLevelWorld.DEBUG, StageTarget.World);
            aspect.vector = new Stage.Graphics(ZLevelWorld.DEBUG, StageTarget.World);
            for (let graphics of [aspect.pos, aspect.vector]) {
                graphics.position.set(position.p.x, position.p.y);
            }
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
            aspect.pos.clear();
            aspect.pos.beginFill(0xff0000, 0.7);
            aspect.pos.drawCircle(0, 0, 3);
            aspect.pos.endFill();
            aspect.cleared = false;
        }
        update(delta, entities) {
            for (let aspect of entities.values()) {
                let position = aspect.get(Component.Position);
                aspect.pos.x = position.p.x;
                aspect.pos.y = position.p.y;
                aspect.vector.x = position.p.x;
                aspect.vector.y = position.p.y;
                this.maybeDraw(aspect, position);
                let len = 25;
                aspect.vector.clear();
                aspect.vector.lineStyle(3, 0xff0000, 0.7);
                aspect.vector.moveTo(0, 0);
                aspect.vector.lineTo(len * Math.cos(position.angle), -len * Math.sin(position.angle));
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
var System;
(function (System) {
    class DebugSceneRestart extends Engine.System {
        constructor(keyboard, sceneManager) {
            super(false, true);
            this.keyboard = keyboard;
            this.sceneManager = sceneManager;
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
var System;
(function (System) {
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
                if (this.soundQueue[i].delay == null || this.soundQueue[i].delay < delta) {
                    this.ecs.getSystem(System.Audio).play(this.soundQueue[i].options, this.soundQueue[i].location);
                    this.soundQueue.splice(i, 1);
                }
                else {
                    this.soundQueue[i].delay -= delta;
                }
            }
        }
    }
    System.DelaySpeaker = DelaySpeaker;
})(System || (System = {}));
var System;
(function (System) {
    class EnemyHUDRendererAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            this.txtPieces = new Map();
            this.spritePieces = new Map();
            this.prevVisible = false;
            this.cacheBarID = null;
        }
    }
    class EnemyHUDRenderer extends Engine.System {
        constructor(gui, guiSequence, translator, playerSelector) {
            super();
            this.gui = gui;
            this.guiSequence = guiSequence;
            this.translator = translator;
            this.playerSelector = playerSelector;
            this.cacheEnemyHUDBasePos = new Point();
            this.aboveOffset = new Point(0, -25);
            this.belowOffset = new Point(0, 50);
            this.widthMultiplier = 10;
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
            let s = this.gui.createSprite(spriteID, null, overridePos);
            let sComps = this.ecs.getComponents(s);
            if (sComps.has(Component.Tweenable)) {
                sComps.get(Component.Tweenable).groundTruth.alpha = 0;
            }
            return {
                entity: s,
                offset: sComps.get(Component.Position).p.copy(),
                startAlpha: sComps.get(Component.GUISprite).baseData.alpha,
            };
        }
        onAdd(aspect) {
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
                aspect.txtPieces.set(txtID, {
                    entity: e,
                    offset: eComps.get(Component.Position).p.copy(),
                    startAlpha: eComps.get(Component.TextRenderable).textData.alpha,
                });
                if (eComps.has(Component.Tweenable)) {
                    eComps.get(Component.Tweenable).groundTruth.alpha = 0;
                }
            }
            let barID = this.computeBarID(enemy);
            aspect.cacheBarID = barID;
            for (let spriteID of this.guiSequence.sprites.concat([barID])) {
                let overridePos = null;
                if (spriteID === 'enemyHUDCapRight') {
                    overridePos = new Point(this.healthToCoord(health.maximum), 0);
                }
                let spritePkg = this.createSpritePkg(spriteID, overridePos);
                let sComps = this.ecs.getComponents(spritePkg.entity);
                if (spriteID === 'enemyHUDUnderBar') {
                    sComps.get(Component.GUISprite).baseData.width = this.healthToCoord(health.maximum);
                }
                aspect.spritePieces.set(spriteID, spritePkg);
            }
        }
        update(delta, entities) {
            let player = this.playerSelector.latest().next().value;
            if (player == null) {
                console.warn('Player not found; skipping enemy hud update');
                return;
            }
            let playerPos = this.ecs.getComponents(player).get(Component.Position).p;
            for (let aspect of entities.values()) {
                let enemy = aspect.get(Component.Enemy);
                if (enemy.hudDisabled) {
                    continue;
                }
                let health = aspect.get(Component.Health);
                let enemyPos = aspect.get(Component.Position).p;
                let angle = playerPos.angleTo(enemyPos);
                let offset = this.aboveOffset;
                if (angle < Math.PI) {
                    offset = this.belowOffset;
                }
                let barID = this.computeBarID(enemy);
                if (barID != aspect.cacheBarID) {
                    if (aspect.cacheBarID != null && aspect.spritePieces.has(aspect.cacheBarID)) {
                        this.gui.destroy(aspect.spritePieces.get(aspect.cacheBarID).entity);
                        aspect.spritePieces.delete(aspect.cacheBarID);
                    }
                    aspect.spritePieces.set(barID, this.createSpritePkg(barID));
                    aspect.cacheBarID = barID;
                }
                let visible = aspect.has(Component.LockOn) || aspect.has(Component.DamagedFlash);
                this.translator.worldToHUDBase(this.cacheEnemyHUDBasePos.copyFrom_(enemyPos));
                let worklist = [aspect.spritePieces, aspect.txtPieces];
                for (let w of worklist) {
                    for (let [id, pkg] of w.entries()) {
                        if (this.barSpriteIDs.has(id)) {
                            this.setBarWidth(pkg.entity, health);
                        }
                        let eComps = this.ecs.getComponents(pkg.entity);
                        if (eComps == null) {
                            continue;
                        }
                        let pos = eComps.get(Component.Position);
                        pos.p = this.cacheEnemyHUDBasePos.copy().add_(offset).add_(pkg.offset);
                        if (!eComps.has(Component.Tweenable)) {
                            continue;
                        }
                        let tweenable = eComps.get(Component.Tweenable);
                        if ((!aspect.prevVisible) && visible) {
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
            for (let [entity, aspect] of entities.entries()) {
                let enemy = aspect.get(Component.Enemy);
                if (enemy.zoneChecked) {
                    continue;
                }
                enemy.zoneChecked = true;
                let cShape = aspect.get(Component.CollisionShape);
                for (let collider of cShape.collisionsFresh.keys()) {
                    let colliderComps = this.ecs.getComponents(collider);
                    if (colliderComps.has(Component.Zone)) {
                        let zone = colliderComps.get(Component.Zone);
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
var System;
(function (System) {
    let FadeTarget;
    (function (FadeTarget) {
        FadeTarget[FadeTarget["Reveal"] = 0] = "Reveal";
        FadeTarget[FadeTarget["Black"] = 1] = "Black";
    })(FadeTarget = System.FadeTarget || (System.FadeTarget = {}));
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
            this.curtain.alpha = 1;
            this.stage.add(this.curtain);
            this.inStage = true;
        }
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
            if (this.duration === -1) {
                return;
            }
            this.elapsed += delta;
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
            let portion = Tween.easeInCubic(this.elapsed, this.duration);
            this.curAlpha = this.targetAlpha === 1 ? portion : 1 - portion;
            this.curtain.alpha = this.curAlpha;
        }
    }
    System.Fade = Fade;
})(System || (System = {}));
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
            this.cachePos.copyFrom_(pos.p).scale_(this.gameScale);
            if (gs.displayData.stageTarget === StageTarget.World) {
                this.translator.HUDtoWorld(this.cachePos);
            }
            aspect.dobj.position.set(this.cachePos.x, this.cachePos.y);
            aspect.dobj.rotation = angleFlip(pos.angle);
            let sScale = aspect.origScale * this.gameScale;
            if (gs.baseData.width != null) {
                aspect.dobj.width = gs.baseData.width * this.gameScale;
            }
            else {
                aspect.dobj.scale.x = sScale;
            }
            if (gs.baseData.height != null) {
                aspect.dobj.height = gs.baseData.height * this.gameScale;
            }
            else {
                aspect.dobj.scale.y = sScale;
            }
        }
        onAdd(aspect) {
            let guiSprite = aspect.get(Component.GUISprite);
            aspect.dobj = Stage.Animation.build(guiSprite.baseData, guiSprite.displayData);
            aspect.origScale = guiSprite.baseData.scale;
            this.applyScale(aspect);
            if (aspect.has(Component.Tweenable)) {
                let tweenable = aspect.get(Component.Tweenable);
                tweenable.groundTruth.alpha = aspect.dobj.alpha;
            }
            this.stage.add(aspect.dobj);
        }
        onRemove(aspect) {
            this.stage.remove(aspect.dobj);
        }
        update(delta, entities) {
            for (let aspect of entities.values()) {
                this.applyScale(aspect);
                if (aspect.has(Component.Tweenable)) {
                    let tweenable = aspect.get(Component.Tweenable);
                    aspect.dobj.alpha = tweenable.groundTruth.alpha;
                }
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
var System;
(function (System) {
    class GUIManager extends Engine.System {
        constructor(guiFile, delaySpeaker) {
            super();
            this.guiFile = guiFile;
            this.delaySpeaker = delaySpeaker;
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
            this.entities = new Map();
            this.destructQueue = [];
        }
        createCommon(assetType, id, overridePos) {
            let entity = this.ecs.addEntity();
            this.entities.set(entity, {
                assetType: assetType,
                id: id,
            });
            let startPosSpec = assetType === GUI.AssetType.Sprite ?
                this.guiFile.sprites[id].startPos :
                this.guiFile.text[id].startPos;
            this.ecs.addComponent(entity, GUI.convertPositionSpec(startPosSpec, overridePos));
            this.ecs.addComponent(entity, new Component.Tweenable());
            return entity;
        }
        runSequence(id, textOverrides = new Map(), imgOverrides = new Map()) {
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
            let entity = this.createCommon(GUI.AssetType.Text, id, overridePos);
            let spec = this.guiFile.text[id];
            this.ecs.addComponent(entity, new Component.TextRenderable(Typography.convertTextSpec(spec.textSpec, overrideText), Anim.convertDisplaySpec(spec.displaySpec)));
            return entity;
        }
        createSprite(id, overrideImg, overridePos) {
            let entity = this.createCommon(GUI.AssetType.Sprite, id, overridePos);
            let spec = clone(this.guiFile.sprites[id]);
            if (overrideImg != null) {
                spec.baseSpec.base = overrideImg;
            }
            if (spec.baseSpec.scale == null) {
                spec.baseSpec.scale = 1;
            }
            this.ecs.addComponent(entity, new Component.GUISprite(spec.baseSpec, spec.displaySpec));
            return entity;
        }
        tween(entity, tween) {
            if (!this.entities.has(entity)) {
                throw new Error('Cannot tween untracked GUI entity: ' + entity);
            }
            ;
            let props = this.entities.get(entity);
            let tweenMap = props.assetType === GUI.AssetType.Text ?
                this.guiFile.text[props.id].tweens : this.guiFile.sprites[props.id].tweens;
            if (tweenMap[tween] == null) {
                throw new Error('Unknown tween name "' + tween + '" for gui element "' + props.id + '"');
            }
            let tweenSpec = tweenMap[tween];
            this.tweenManual(entity, tweenSpec);
        }
        tweenManual(entity, tweenSpec) {
            let tweenable = this.ecs.getComponents(entity).get(Component.Tweenable);
            for (let tp of tweenSpec.visuals) {
                tweenable.tweenQueue.push(tp);
            }
            for (let sd of tweenSpec.sounds) {
                this.delaySpeaker.enqueue(sd);
            }
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
        onClear() {
            this.entities.clear();
            arrayClear(this.destructQueue);
        }
        update(delta, entities) {
            for (let i = this.destructQueue.length - 1; i >= 0; i--) {
                if (this.destructQueue[i].remaining <= delta) {
                    this.destroy(this.destructQueue[i].entity);
                    this.destructQueue.splice(i, 1);
                    continue;
                }
                this.destructQueue[i].remaining -= delta;
            }
        }
    }
    __decorate([
        override
    ], GUIManager.prototype, "onClear", null);
    System.GUIManager = GUIManager;
})(System || (System = {}));
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
var System;
(function (System) {
    class LightingAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            this.dobjs = [];
        }
    }
    class Lighting extends Engine.System {
        constructor(stage, translator, lightingLayer, gamescale) {
            super();
            this.stage = stage;
            this.translator = translator;
            this.lightingLayer = lightingLayer;
            this.gamescale = gamescale;
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
            let lightbulb = aspect.get(Component.Lightbulb);
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
var System;
(function (System) {
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
            for (let [entity, aspect] of entities.entries()) {
                let lockon = aspect.get(Component.LockOn);
                if (lockon.fresh) {
                    foundAspect = aspect;
                    lockon.fresh = false;
                }
                else {
                    this.ecs.removeComponent(entity, Component.LockOn);
                }
            }
            if (foundAspect == null) {
                this.dobj.visible = false;
                return;
            }
            let pos = foundAspect.get(Component.Position);
            this.dobj.visible = true;
            this.dobj.position.set(pos.p.x, pos.p.y);
            this.dobj.rotation = angleClamp(this.dobj.rotation + LockOn.ROTATE_DELTA);
        }
    }
    LockOn.ROTATE_DELTA = 0.1;
    System.LockOn = LockOn;
})(System || (System = {}));
var System;
(function (System) {
    class LowHealth extends Engine.System {
        constructor() {
            super(...arguments);
            this.runEvery = 3000;
            this.sinceLast = 0;
            this.componentsRequired = new Set([
                Component.Health.name,
                Component.PlayerInput.name,
            ]);
        }
        update(delta, entities) {
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
var System;
(function (System) {
    class Pause extends Engine.System {
        constructor(keyboard) {
            super(false, true);
            this.keyboard = keyboard;
            this.prevPause = false;
            this.guiElements = [];
            this.componentsRequired = new Set([
                Component.Dummy.name,
            ]);
        }
        update(delta, entities) {
            let wantPause = this.keyboard.gamekeys.get(GameKey.P).isDown;
            if (wantPause && !this.prevPause) {
                this.ecs.slowMotion.debugPaused = !this.ecs.slowMotion.debugPaused;
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
            let pd = aspect.get(Component.PersistentDamage);
            this.ecs.addComponent(aspect.entity, new Component.Attack(aspect.entity, pd.attackInfo));
        }
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
var System;
(function (System) {
    class PlayerHUDRendererAspect extends Engine.Aspect {
        constructor() {
            super(...arguments);
            this.core = [];
            this.hearts = [];
            this.curHealth = 0;
            this.boardBase = null;
            this.board = null;
            this.weaponBoardName = null;
            this.weaponBoard = null;
            this.swordIconBase = null;
            this.swordIcon = null;
            this.bowIcon = null;
            this.selectorTarget = 'none';
            this.selector = null;
            this.doughnutInactive = null;
            this.doughnutActiveBG = null;
            this.doughnutActiveDoughnut = null;
        }
        destroyEverything(gui) {
            while (this.core.length > 0) {
                gui.destroy(this.core.pop());
            }
            while (this.hearts.length > 0) {
                gui.destroy(this.hearts.pop());
            }
            if (this.board != null) {
                gui.destroy(this.board);
                this.board = null;
            }
            if (this.weaponBoardName != null) {
                gui.destroy(this.weaponBoard);
                this.weaponBoard = null;
                this.weaponBoardName = null;
            }
            if (this.swordIconBase != null) {
                gui.destroy(this.swordIcon);
                this.swordIcon = null;
                this.swordIconBase = null;
            }
            if (this.bowIcon != null) {
                gui.destroy(this.bowIcon);
                this.bowIcon = null;
            }
            if (this.selector != null) {
                gui.destroy(this.selector);
                this.selector = null;
                this.selectorTarget = 'none';
            }
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
                return 'playerHUDBoardBow';
        }
    }
    function getSwordIconBase(aspect) {
        if (!aspect.has(Component.Armed)) {
            return null;
        }
        let armed = aspect.get(Component.Armed);
        for (let weapon of armed.inventory) {
            if (weapon.comboAttack != null) {
                if (weapon.comboAttack.damage == 2) {
                    return 'HUD/hudStab';
                }
                else if (weapon.comboAttack.damage == 3) {
                    return 'HUD/hudAOE';
                }
            }
        }
        return 'HUD/hudSword';
    }
    function getDisplayBowAndSelector(aspect) {
        return aspect.has(Component.Armed) && aspect.get(Component.Armed).inventory.length > 1;
    }
    function getSelectorTarget(aspect) {
        if (!getDisplayBowAndSelector(aspect)) {
            return 'none';
        }
        return aspect.get(Component.Armed).active.comboAttack == null ? 'bow' : 'sword';
    }
    function getSelectorY(target) {
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
            let health = aspect.get(Component.Health);
            let bb = getBoardBase(health.maximum);
            if (bb === aspect.boardBase) {
                return;
            }
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
                if (aspect.weaponBoardName != null) {
                    gui.destroy(aspect.weaponBoard);
                }
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
            let swordIconBase = getSwordIconBase(aspect);
            if (swordIconBase != aspect.swordIconBase) {
                if (aspect.swordIconBase != null) {
                    gui.destroy(aspect.swordIcon);
                }
                aspect.swordIconBase = swordIconBase;
                if (swordIconBase == null) {
                    aspect.swordIcon = null;
                }
                else {
                    aspect.swordIcon = gui.createSprite('playerHUDSwordIcon', swordIconBase);
                }
            }
            if (getDisplayBowAndSelector(aspect)) {
                if (aspect.bowIcon == null) {
                    aspect.bowIcon = gui.createSprite('playerHUDBowIcon');
                }
            }
            else {
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
                if (aspect.selector != null) {
                    gui.destroy(aspect.selector);
                    aspect.selector = null;
                    aspect.selectorTarget = target;
                }
                return;
            }
            if (aspect.selector == null) {
                aspect.selector = gui.createSprite('playerHUDWeaponSelector', null, new Point(6, getSelectorY(target)));
                aspect.selectorTarget = target;
                return;
            }
            if (aspect.selectorTarget != target) {
                gui.tweenManual(aspect.selector, buildSelectorTween(getSelectorY(target)));
                aspect.selectorTarget = target;
            }
        }
        updateHearts(aspect) {
            let gui = this.ecs.getSystem(System.GUIManager);
            let health = aspect.get(Component.Health);
            while (health.current < aspect.curHealth) {
                let i = aspect.curHealth - 1;
                gui.destroy(aspect.hearts[i]);
                aspect.hearts[i] = gui.createSprite('playerHUDHeartOff', null, new Point(55 + i * 17.5, 9));
                aspect.curHealth--;
            }
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
                aspect.destroyActiveDoughnut(gui);
                if (aspect.doughnutInactive == null) {
                    aspect.doughnutInactive = gui.createSprite('playerHUDDoughnutInactive');
                }
            }
            else {
                aspect.destroyInactiveDoughnut(gui);
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
                if (activity.action !== Action.Moving) {
                    aspect.lastHandledFrame = -1;
                    continue;
                }
                if (audible.sounds.move == null) {
                    continue;
                }
                let surface = audible.sounds.move.default;
                if (surface == null) {
                    continue;
                }
                if (surface.emitOnFrames.indexOf(anim.coreFrame) === -1) {
                    aspect.lastHandledFrame = -1;
                    continue;
                }
                if (aspect.lastHandledFrame === anim.coreFrame) {
                    continue;
                }
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
            let pos = aspect.get(Component.Position);
            while (pos.cells.length > 0) {
                this.grid.get(pos.cells.pop()).delete(aspect.entity);
            }
        }
        recomputeCells(aspect) {
            let pos = aspect.get(Component.Position);
            while (pos.cells.length > 0) {
                this.grid.get(pos.cells.pop()).delete(aspect.entity);
            }
            let cells;
            if (aspect.has(Component.CollisionShape)) {
                cells = getBoxCells(pos.p, aspect.get(Component.CollisionShape));
            }
            else {
                cells = [getPointCell(pos.p)];
            }
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
            let tweenable = aspect.get(Component.Tweenable);
            return tweenable.groundTruth[prop];
        }
        setVal(aspect, prop, val) {
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
            let tweenable = aspect.get(Component.Tweenable);
            tweenable.groundTruth[prop] = val;
        }
        activate(aspect, tweenable, tweenPackage) {
            let start = this.getVal(aspect, tweenPackage.prop);
            let specVal = -1;
            if (typeof tweenPackage.spec.val === 'string') {
                specVal = parseInt(tweenPackage.spec.val.slice(1), 16);
            }
            else {
                specVal = tweenPackage.spec.val;
            }
            let target = tweenPackage.spec.valType === 'abs' ?
                specVal : start + specVal;
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
                let tweenable = aspect.get(Component.Tweenable);
                if (tweenable.clear) {
                    arrayClear(aspect.waitingTweens);
                    aspect.activeTweens.clear();
                    tweenable.clear = false;
                }
                let deleteProps = [];
                for (let [prop, state] of aspect.activeTweens.entries()) {
                    state.elapsed += delta;
                    if (state.duration != Tween.Infinite && state.elapsed > state.duration) {
                        this.setVal(aspect, prop, state.target);
                        deleteProps.push(prop);
                        continue;
                    }
                    let portion = state.method(state.elapsed, state.duration, state.period);
                    this.setVal(aspect, prop, state.start + portion * (state.target - state.start));
                }
                while (deleteProps.length > 0) {
                    aspect.activeTweens.delete(deleteProps.pop());
                }
                while (tweenable.tweenQueue.length > 0) {
                    aspect.waitingTweens.push(clone(tweenable.tweenQueue.pop()));
                }
                for (let i = aspect.waitingTweens.length - 1; i >= 0; i--) {
                    let tp = aspect.waitingTweens[i];
                    if (tp.spec.delay == null || tp.spec.delay < delta) {
                        this.activate(aspect, tweenable, tp);
                        aspect.waitingTweens.splice(i, 1);
                    }
                    else {
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
var System;
(function (System) {
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
            if (this.active == null) {
                return;
            }
            this.active.elapsed += delta;
            if (this.active.elapsed >= this.active.duration) {
                this.stage.scale.set(this.active.targetScale, this.active.targetScale);
                this.active = null;
                return;
            }
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
