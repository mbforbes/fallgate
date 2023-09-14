/// <reference path="../engine/ecs.ts" />

namespace Component {


		/**
		 * Given total exp and a function for exp needed between levels, this
		 * data structure is computable.
		 */
		type LevelData = {
			/**
			 * Current level.
			 */
			level: number,

			/**
			 * Exp progress from `level` to `level` + 1
			 */
			expProgress: number,
		}

		/**
		 * Handles computing *total* exp needed to reach levels from a function
		 * that gives only exp needed *between* individual levels.
		 */
		class LevelComputer {

			constructor(private expToLevel: (level: number) => number) {}

			/**
			 * Given total exp, returns current level and progress towards next
			 * level through `out`).
			 * @param totalExpAcquired
			 * @param out
			 */
			public getData(totalExpAcquired: number, out: LevelData): void {
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
		export class LevelGainer extends Engine.Component {

			private levelComputer: LevelComputer
			private lastComputedExp: number = -1
			private _levelData: LevelData = {
				level: -1,
				expProgress: -1,
			}

			/**
			 *
			 * @param expToLevel A function with Input: level n; output: exp
			 * needed to go from level n - 1 to level n.
			 * @param exp
			 */
			constructor(private expToLevel: (level: number) => number, public exp: number = 0) {
				super();
				this.levelComputer = new LevelComputer(expToLevel);
			}

			/**
			 * Uses current exp and expToLevel function to return the entity's
			 * level and progress to next level.
			 */
			public get levelData() : LevelData {
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
			public get level(): number {
				return this.levelData.level;
			}

			/**
			 * Returns exp needed to go from start of current level to next
			 * level.
			 */
			public get expNext(): number {
				return this.expToLevel(this.level + 1);
			}

			/**
			 * Returns current progress from start of current level to next level.
			 */
			public get expProgress(): number {
				return this.levelData.expProgress;
			}

			toString(): string {
				return 'level ' + this.level + ' (' + this.expProgress + '/' + this.expNext + ')';
			}
		}
	}
