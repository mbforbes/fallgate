/// <reference path="../../lib/howler.d.ts" />
/// <reference path="../gj7/sound.ts" />

namespace System {

	type HowlPkg = {
		volume: number,
		howl: Howl,
	}

	/**
	 * Handles audio.
	 */
	export class Audio extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Dummy.name,
		])

		// bounds stuff
		public boundsGetter: Stage.MultiZStage = null
		public viewportSize: Point = null
		private cacheMinBounds = new Point()
		private cacheMaxBounds = new Point()

		// settings
		private effectVolume: number = 1.0
		private musicVolume: number = 0.7
		private effectsOn: boolean = true
		private musicOn: boolean = true

		// internal data structure of load(ing/ed) sounds and music
		private sounds = new Map<string, HowlPkg>()
		private music = new Map<string, HowlPkg>()

		// queue for frame buffering
		private queue: Sound.TrackID[] = []
		private playedThisFrame = new Set<Sound.TrackID>()

		// cache for what music shouuld be playing
		private playingMusic: Sound.TrackID[] = []

		constructor(private collection: Sound.Collection) {
			super();
		}

		/**
		 * @returns this (for convenience).
		*/
		public load(): Audio {
			// Load all sound effects and music.
			for (let [trackID, track] of this.collection.entries()) {
				let h: Howl;
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
				} else {
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
		public playMusic(only: Sound.TrackID[]): void {
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
				} else {
					// ensure it's not playing
					if (h.playing()) {
						h.fade(h.volume(), 0.0, 1500)
						h.once('fade', function () {
							h.stop();
						})
					}
				}
			}
		}

		private disableMusic(): void {
			for (let [trackID, hpkg] of this.music.entries()) {
				hpkg.howl.volume(0);
			}
		}

		/**
		 * API for toggling music.
		 */
		public toggleMusic(): void {
			this.musicOn = !this.musicOn;
			let w = '', f = '';
			if (this.musicOn) {
				this.playMusic(this.playingMusic);
				w = 'on';
				f = 'On';
			} else {
				this.disableMusic();
				w = 'off';
				f = 'Off';
			}
			this.ecs.getSystem(System.GUIManager).runSequence(
				'notification',
				new Map([['notification', 'music ' + w]]),
				new Map([['notification', 'HUD/music' + f]])
			);

		}

		/**
		 * API for toggling sound effects.
		 */
		public toggleEffects(): void {
			this.effectsOn = !this.effectsOn;
			let w = this.effectsOn ? 'on' : 'off';
			let f = this.effectsOn ? 'On' : 'Off';
			this.ecs.getSystem(System.GUIManager).runSequence(
				'notification',
				new Map([['notification', 'sound effects ' + w]]),
				new Map([['notification', 'HUD/sound' + f]])
			);
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
		public getPlaying(): Sound.TrackID[] {
			return Array.from(this.playingMusic);
		}

		public play(options: Sound.TrackID[], location: Point = null): void {
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
		private playHelper(options: Sound.TrackID[]): void {
			// checks and picking track ID
			if (options.length == 0) {
				console.warn('Tried to play sound with no TrackID options.');
				return;
			}
			let idx = Probability.uniformInt(0, options.length - 1);
			let trackID = options[idx];
			if (!this.sounds.has(trackID)) {
				console.warn('Tried to play unknown trackID "' + trackID + '".')
				console.warn('All known trackIDs: ' + mapKeyArr(this.sounds));
				return;
			}

			// enqueue
			this.queue.push(trackID);
		}

		@override
		public onClear() {
			arrayClear(this.queue);
			this.playedThisFrame.clear();
		}

		// Plays all queued sound effects, avoiding duplicates.
		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void {

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
}
