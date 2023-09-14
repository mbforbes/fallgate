/// <reference path="../engine/script.ts" />

namespace Script {

	type TestScriptArgs = {
		n1: number,
		s1: string,
	}

	/**
	 * This is a simple test script to demonstrate different ways data can be
	 * provided to a script (compile-time member, passed member, or calling
	 * args), as well as what a `code` map can look like.
	 */
	export class TestScript extends Script {

		/**
		 * Compile-time member.
		 */
		public secret = 42

		// Settings for pinger. NOTE: can probably use closures for this kind
		// of state (!)---may finally be the perfect way to run closures (both
		// getting local state but also running in a controlled way during the
		// designated update period) (?!?).
		public sinceLastPing = 0
		public pingCount = 0
		public maxPings = 10

		/**
		 * This code runs the `hello()` function after 5s (5000ms).
		 */
		code = new Map<number, FunctionPackage>([
			[2000, {func: this.hello, args: {n1: 12, s1: 'foobleu'}}],
			[3000, {func: this.kickoff, args: null}],
		])

		/**
		 * Passed member
		 * @param cs
		 */
		constructor(public cs: number) {
			super();
		}

		/**
		 * Hello takes args that are defined at compile time. It can also read
		 * from all members, which could be defined at runtime.
		 * @param args
		 */
		hello(args: TestScriptArgs): void {
			console.log('hello from TestScript');
			console.log('my secret is ' + this.secret);
			console.log('my constructor secret is ' + this.cs);
			console.log('my first arg is ' + args.n1);
			console.log('my second arg is ' + args.s1);
		}

		pinger(delta: number): boolean {
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

		kickoff(): void {
			console.log('TestScript kicking off pinger')
			this.active.push(this.pinger);
		}
	}
}
