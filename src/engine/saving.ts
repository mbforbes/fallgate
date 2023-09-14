namespace Saving {

    export function save(sceneName: string, trackNames: string[], bookkeeper: string): void {
        localStorage.setItem('/fallgate/save/scene', sceneName);
        console.info('[Saving] Saved scene: ' + sceneName);

        let serializedTracks = trackNames.join(';');
        localStorage.setItem('/fallgate/save/tracks', serializedTracks);
        console.info('[Saving] Saved tracks: ' + serializedTracks);

        localStorage.setItem('/fallgate/save/bookkeeper', bookkeeper);
        console.info('[Saving] Saved bookkeeper: ' + bookkeeper);
    }

    export function clear(): void {
        localStorage.clear();
        console.info('[Saving] Cleared all save data');
    }

    export function load(): [string | null, string[] | null, string | null] {
        let sceneName = localStorage.getItem('/fallgate/save/scene');
        console.info('[Saving] Loaded scene: ' + sceneName);

        let trackIDs: string[] | null = null;
        let tracks = localStorage.getItem('/fallgate/save/tracks');
        if (tracks != null) {
            trackIDs = tracks.split(';');
        }
        console.info('[Saving] Loaded tracks: ' + trackIDs);

        let bookkeeper = localStorage.getItem('/fallgate/save/bookkeeper');
        console.info('[Saving] Loaded bookkeeper: ' + bookkeeper);

        return [sceneName, trackIDs, bookkeeper];
    }
}
