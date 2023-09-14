namespace GJ7 {
    export type Instruction = {
        title: string,
        txt: string,
        img: string,
    }

    export type Instructions = {
        [id: string]: Instruction,
    }

    export type Control = {
        txt: string,
    }

    export type Controls = {
        [id: string]: Control,
    }
}
