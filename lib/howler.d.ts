
class Howl {
    constructor(options: HowlOptions);

    play(spriteOrId?: string | number): number; // .play() is not chainable; the other methods are
    pause(id?: number): this;
    stop(id?: number): this;

    mute(): boolean;
    mute(muted: boolean, id?: number): this;

    volume(): number;
    volume(idOrSetVolume: number): this | number;
    volume(volume: number, id: number): this;

    fade(from: number, to: number, duration: number, id?: number): this;

    rate(id?: number): number;
    rate(rate: number, id?: number): this;

    seek(id?: number): number;
    seek(seek: number, id?: number): this;

    loop(id?: number): boolean;
    loop(loop: boolean, id?: number): this;

    playing(id?: number): boolean;
    duration(id?: number): number;
    state(): "unloaded" | "loading" | "loaded";
    load(): this;
    unload(): null;

    on(event: "load", callback: () => void, id?: number): this;
    on(event: "loaderror" | "playerror", callback: HowlErrorCallback, id?: number): this;
    on(
        event: "play" | "end" | "pause" | "stop" | "mute" | "volume" | "rate" | "seek" | "fade" | "unlock",
        callback: HowlCallback,
        id?: number,
    ): this;
    on(event: string, callback: HowlCallback | HowlErrorCallback, id?: number): this;

    once(event: "load", callback: () => void, id?: number): this;
    once(event: "loaderror" | "playerror", callback: HowlErrorCallback, id?: number): this;
    once(
        event: "play" | "end" | "pause" | "stop" | "mute" | "volume" | "rate" | "seek" | "fade" | "unlock",
        callback: HowlCallback,
        id?: number,
    ): this;
    once(event: string, callback: HowlCallback | HowlErrorCallback, id?: number): this;

    off(event: "load", callback?: () => void, id?: number): this;
    off(event: "loaderror" | "playerror", callback?: HowlErrorCallback, id?: number): this;
    off(
        event: "play" | "end" | "pause" | "stop" | "mute" | "volume" | "rate" | "seek" | "fade" | "unlock",
        callback?: HowlCallback,
        id?: number,
    ): this;
    // off() also supports passing id as second argument: internally it is type checked and treated as an id if it is a number
    off(
        event:
            | "load"
            | "loaderror"
            | "playerror"
            | "play"
            | "end"
            | "pause"
            | "stop"
            | "mute"
            | "volume"
            | "rate"
            | "seek"
            | "fade"
            | "unlock",
        id: number,
    ): this;
    off(event?: string, callback?: HowlCallback | HowlErrorCallback, id?: number): this;

    stereo(): number;
    stereo(pan: number, id?: number): number | this;

    pos(): SpatialPosition;
    pos(x: number, y?: number, z?: number, id?: number): this;

    orientation(): SpatialOrientation;
    orientation(x: number, y?: number, z?: number, id?: number): this;

    pannerAttr(id?: number): PannerAttributes;
    pannerAttr(options: PannerAttributes, id?: number): this;
}

declare module "Howl" {
    export = Howl;
}
