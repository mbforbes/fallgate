namespace Measurement {

	export const T_OVERALL = 'Overall'
	export const T_SYSTEMS = 'Systems'
	export const T_COLL_COLLIDERS = 'Coll/Colliders'
	export const T_ALL = [
		T_OVERALL,
		T_SYSTEMS,
		T_COLL_COLLIDERS,
	]

	export type Record = {
		name: string,
		time: number,
	}

	/**
	 * A clock that only reports averages.
	 *
	 * Use start() and end() to time stuff several times. Then report() gets the
	 * average and resets everything.
	 */
	class AverageClock {

		private startTime = -1
		private elapsedSum = 0
		private elapsedNum = 0

		start(): void {
			// Cool hack from stats.js to prefer performance and fall back to
			// Date. Haven't looked into why but what the hell seems good.
			this.startTime = (performance || Date).now()
		}

		end(): void {
			this.elapsedSum += (performance || Date).now() - this.startTime;
			this.elapsedNum++;
		}

		/**
		 * Manually add an entry (for when measuring in tight loop).
		 * @param sum total time
		 * @param num number of times it happened
		 */
		manualAdd(sum: number, num: number): void {
			this.elapsedSum += sum;
			this.elapsedNum += num;
		}

		/**
		 * Returns average to 4 decimal places.
		 */
		report(): number {
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
		private clocks = new Map<string, AverageClock>()

		constructor() {}

		start(clockName: string): void {
			if (!this.clocks.has(clockName)) {
				this.clocks.set(clockName, new AverageClock());
			}
			this.clocks.get(clockName).start();
		}

		end(clockName: string): void {
			this.clocks.get(clockName).end();
		}

		manualAdd(clockName: string, sum: number, num: number): void {
			if (!this.clocks.has(clockName)) {
				this.clocks.set(clockName, new AverageClock());
			}
			this.clocks.get(clockName).manualAdd(sum, num);
		}

		report(): Record[] {
			let res: Record[] = [];
			for (let [clockName, clock] of this.clocks.entries()) {
				res.push({
					name: clockName,
					time: clock.report(),
				});
			}
			res.sort((a, b) => {return b.time - a.time});  // biggest first
			return res;
		}
	}

	export interface ClockTower {
		init(): void
		start(clockGroup: string, component: string): void
		end(clockGroup: string, component: string): void
		manualAdd(clockGroup: string, component: string, sum: number, num: number): void
		report(): Map<string, Record[]>
	}

	/**
	 * For when we don't actually want any measurement.
	 */
	export class FakeClockTower {
		init() {}
		start(clockGroup: string, component: string): void {}
		end(clockGroup: string, component: string): void {}
		manualAdd(clockGroup: string, component: string, sum: number, num: number): void {}
		report(): Map<string, Record[]> { return new Map();}
	}

	/**
	 * The collection of all clock groups.
	 *
	 * Use start(...) and end(...) to time stuff.
	 *
	 * Handles interface with game (tracking time to decide when to report) and
	 * reporting (generating reports and updating graphs).
	 */
	export class ClockCentral implements ClockTower {
		private clockGroups = new Map<string, ClockGroup>()

		init() {
			for (let val of T_ALL) {
				this.clockGroups.set(val, new ClockGroup());
			}
		}

		start(clockGroup: string, component: string): void {
			this.clockGroups.get(clockGroup).start(component);
		}

		end(clockGroup: string, component: string): void {
			this.clockGroups.get(clockGroup).end(component);
		}

		manualAdd(clockGroup: string, component: string, sum: number, num: number): void {
			this.clockGroups.get(clockGroup).manualAdd(component, sum, num);
		}

		report(): Map<string, Record[]> {
			let m = new Map<string, Record[]>();
			for (let [name, group] of this.clockGroups.entries()) {
				m.set(name, group.report());
			}
			return m;
		}
	}
}
