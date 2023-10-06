declare function pathWithoutFile(path: any): any;
declare function WaitForAll(count: any, allDone: any): void;
declare class WaitForAll {
    constructor(count: any, allDone: any);
    done: () => void;
}
declare namespace Resource {
    export namespace TYPE {
        let UNKNOWN: number;
        let JSON: number;
        let XML: number;
        let IMAGE: number;
        let AUDIO: number;
        let VIDEO: number;
        let TEXT: number;
    }
    type TYPE = number;
    export namespace LOAD_TYPE {
        export let XHR: number;
        let IMAGE_1: number;
        export { IMAGE_1 as IMAGE };
        let AUDIO_1: number;
        export { AUDIO_1 as AUDIO };
        let VIDEO_1: number;
        export { VIDEO_1 as VIDEO };
    }
    type LOAD_TYPE = number;
}
declare function pixiPackerParser(PIXI: any): (resource: any, next: any) => any;
