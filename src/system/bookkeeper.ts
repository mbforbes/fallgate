/// <reference path="../core/util.ts" />
/// <reference path="../engine/ecs.ts" />
/// <reference path="../gj7/constants.ts" />

namespace System {

	/**
	 * String-rendered version of report.
	 */
	type LevelReport = {
		playerDeaths: string,
		enemiesKilled: string,
		secretsFound: string,
		timeTaken: string,
		timeTakenBig: string,
		timeTakenSmall: string,
	}

	type LevelReportNumeric = {
		playerDeaths: number,
		enemiesKilled: number,
		secretsFound: number,
		timeTaken: number,
	}

	function numericToDisplay(r: LevelReportNumeric): LevelReport {
		let [timeBig, timeSmall] = msToUserTimeTwoPart(r.timeTaken);
		return {
			playerDeaths: '' + r.playerDeaths,
			enemiesKilled: '' + r.enemiesKilled,
			secretsFound: '' + (r.secretsFound > 0 ? Constants.CHECKMARK : 'no'),
			timeTaken: msToUserTime(r.timeTaken),
			timeTakenBig: timeBig,
			timeTakenSmall: timeSmall,
		}
	}

	function numericToReport(r: LevelReportNumeric, nLevels: number): LevelReport {
		// similar to per-level display, but show aggregate doughnuts
		let base = numericToDisplay(r);
		base.secretsFound = r.secretsFound + '/' + nLevels;
		return base;
	}

	function mergeNumericReports(a: LevelReportNumeric, b: LevelReportNumeric): LevelReportNumeric {
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
		}
	}

	class LevelInfo {
		public playerDeaths: number = 0
		public enemiesKilled: number = 0
		public destructiblesSmashed: number = 0
		public secretsFound: number = 0
		private startTime: number = -1

		/**
		 * Holds summed elapsed durations. Normally this will just be added to
		 * with (end - start) and then reported. But for multi-segment levels,
		 * it will contain a running total of all segments.
		 */
		private sumElapsed: number = 0

		/**
		 * Call whenever beginning gameplay for a level (or a segment). Will
		 * only start timer if it hasn't been started yet.
		 */
		public begin(): LevelInfo {
			if (this.startTime === -1) {
				this.startTime = (performance || Date).now();
			}
			return this;
		}

		/**
		 * Call whenever ending gameplay for a level (or a segment).
		 */
		public end(): LevelInfo {
			if (this.startTime === -1) {
				console.error('Ending level with unset start time (-1); bookkeeping bug.');
			}
			let endTime = (performance || Date).now();
			this.sumElapsed += endTime - this.startTime;
			this.startTime = -1;
			return this;
		}

		public reset(): LevelInfo {
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
		public serialize(): string {
			return JSON.stringify(this);
		}

		/**
		 * Create LevelInfo from serialized version.
		 */
		public from(sLevelInfo: string): LevelInfo {
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
		public softReset(): void {
			this.secretsFound = 0;
		}

		/**
		 * Returns amount of time elapsed in the level after it has ended, or 0
		 * if this hasn't been tracked.
		 */
		public elapsed(): number {
			if (this.sumElapsed === 0) {
				console.error('Got level duration as 0; bookkeeping bug.');
			}
			return this.sumElapsed;
		}

		public report(): LevelReport {
			return numericToDisplay(this.reportNumeric());
		}

		public reportNumeric(): LevelReportNumeric {
			return {
				playerDeaths: this.playerDeaths,
				enemiesKilled: this.enemiesKilled,
				secretsFound: this.secretsFound,
				timeTaken: this.elapsed(),
			}
		}

		/**
		 * Return ms of time passed in this level, including sum of previous
		 * parts and current (ongoing) time. For debug rendering.
		 */
		public debugElapsed(): number {
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
	export class Bookkeeper extends Engine.System {

		public componentsRequired = new Set<string>([
			Component.Dummy.name,
		])
		private debugTimeCache = 0
		private curLevelNum = 0
		private levelInfos = new Map<number, LevelInfo>()
		private instructionsShown = new Set<string>()
		private dummyReport: LevelReport = {
			enemiesKilled: '<whoops>',
			playerDeaths: '<whoops>',
			secretsFound: '<whoops>',
			timeTaken: '<whoops>',
			timeTakenBig: '<whoops>',
			timeTakenSmall: '<whoops>',
		}

		/**
		 * Should be called only when switching to a new level that requires
		 * bookkeeping. (Or, on a game re-playthrough, the same level again.)
		 */
		public setActive(levelNum: number): LevelInfo {
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
		public softReset(): void {
			if (this.levelInfos.has(this.curLevelNum)) {
				this.levelInfos.get(this.curLevelNum).softReset();
			}
		}

		/**
		 * Called when gameplay starts. This can be called on the same level
		 * multiple times.
		 */
		public startLevel(): void {
			// for debugging and jumping around mid-castle levels and not
			// crashing the game.
			if (!this.levelInfos.has(this.curLevelNum)) {
				console.warn('Level not found. Improper use of bookkeeper. Should be for debugging only.')
				this.setActive(this.curLevelNum);
			}
			this.levelInfos.get(this.curLevelNum).begin();
		}

		/**
		 * Called when gameplay ends. This can be called on the same level
		 * multiple times.
		 */
		public endLevel(): void {
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
		private mutateStatCheck(): boolean {
			if (!this.levelInfos.has(this.curLevelNum)) {
				console.error('Tried to mutate stat but Bookkeeper does not have current level?');
				return false;
			}
			return true;
		}

		private incrementStat(statName: string): void {
			if (!this.mutateStatCheck()) { return; }
			this.levelInfos.get(this.curLevelNum)[statName] += 1;
		}

		private zeroStat(statName: string): void {
			if (!this.mutateStatCheck()) { return; }
			this.levelInfos.get(this.curLevelNum)[statName] = 0;
		}

		public playerDied(): void {
			this.incrementStat('playerDeaths');
			this.zeroStat('secretsFound');
		}

		public enemyKilled(): void {
			this.incrementStat('enemiesKilled');
		}

		public destructibleSmashed(): void {
			this.incrementStat('destructiblesSmashed');
		}

		/**
		 * Sets that the secret was found.
		 */
		public secretFound(): void {
			this.incrementStat('secretsFound');
		}

		/**
		 * Returns whether the player is currently in posession of the secret.
		 */
		public getSecretFound(): boolean {
			// special case for when level infos don't exist yet
			return this.levelInfos.has(this.curLevelNum) ?
				this.levelInfos.get(this.curLevelNum).secretsFound > 0 :
				false;
		}

		public maybeShowInstruction(instructionID: string): void {
			// don't show twice
			if (this.instructionsShown.has(instructionID)) {
				return;
			}

			// show
			let n = Events.EventTypes.ShowInstructions;
			let a: Events.ShowInstructionsArgs = {
				instructionsID: instructionID,
			}
			this.eventsManager.dispatch({ name: n, args: a });
			this.instructionsShown.add(instructionID);
		}

		public report(): LevelReport {
			if (!this.levelInfos.has(this.curLevelNum)) {
				console.error('Tried to get level report but Bookkeeper does not know about level?');
				return this.dummyReport;
			}

			return this.levelInfos.get(this.curLevelNum).report();
		}

		public recap(): [LevelReport, boolean[]] {
			let keys = mapKeyArr(this.levelInfos);
			keys.sort(sortNumeric);
			let total: LevelReportNumeric = null;
			let donutArray: boolean[] = [];
			for (let key of keys) {
				let cur = this.levelInfos.get(key);
				donutArray.push(cur.secretsFound > 0);
				total = mergeNumericReports(total, cur.reportNumeric());
			}

			return [numericToReport(total, this.levelInfos.size), donutArray];
		}

		public debugElapsed(): [[string, string], [string, string]] {
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
		public serialize(): string {
			// cur level
			let sCurLevel = this.curLevelNum + '';

			// instrs shown
			let sInstructions = 'none';
			if (this.instructionsShown.size > 0) {
				sInstructions = Array.from(this.instructionsShown).join(';')
			}

			// level infos
			let sLevelInfos = 'none';
			if (this.levelInfos.size > 0) {
				let arrLevelInfos: string[] = [];
				for (let [n, lvlInfo] of this.levelInfos.entries()) {
					arrLevelInfos.push(n + ':' + lvlInfo.serialize());
				}
				sLevelInfos = arrLevelInfos.join(';');
			}

			return [sCurLevel, sInstructions, sLevelInfos].join('|');
		}

		public load(s: string): void {
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
					let n = parseInt(sLevelInfo.substring(0, sep))
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
		public reset(): void {
			this.debugTimeCache = 0;
			this.instructionsShown.clear();
			this.levelInfos.clear();
		}

		public update(delta: number, entities: Map<Engine.Entity, Engine.Aspect>): void { }
	}
}
