// 2.1
enum STATES {
  PADDING = "padding",
  FULFILLED = "fulfilled",
  REJECTED = "rejected",
}

type CallBack = (value: any) => any;
type CallBacks = Array<{
  onFulfilled?: CallBack;
  onRejected?: CallBack;
  resolve: CallBack;
  reject: CallBack;
}>;
type InitFn = (res: CallBack, rej: CallBack) => any;

class MP {
  private state: STATES = STATES.PADDING;
  private result: any;
  private callBacks: CallBacks = [];

  constructor(cb: InitFn) {
    // 2.3.3.3.3
    const run = this.runOnce();
    const resolve = run(this.handleResolvePromise);
    const reject = run(this.rejected);

    try {
      cb(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }

  then(onFulfilled?: CallBack, onRejected?: CallBack) {
    // 2.2.7
    return new MP((resolve, reject) => {
      // 2.2.6
      this.callBacks.push({
        resolve,
        reject,
        onFulfilled,
        onRejected,
      });

      // 不为PADDING说明订阅为同步代码
      if (this.state !== STATES.PADDING) {
        this.handleCallBacks();
      }
    });
  }

  private handleCallBacks() {
    const callBacks = this.callBacks;
    // 2.2.x.3 清空避免多次调用，用runOnce套一层可以但是没必要
    this.callBacks = [];

    for (const item of callBacks) {
      const { resolve, reject, onFulfilled, onRejected } = item;

      if (this.state === STATES.FULFILLED) {
        this.handleCallback(resolve, reject, resolve, onFulfilled);
      } else {
        this.handleCallback(resolve, reject, reject, onRejected);
      }
    }
  }

  private handleCallback = (
    resolve: CallBack,
    reject: CallBack,
    emit: CallBack,
    callback?: CallBack
  ) => {
    // 2.2.4 -> 3.1
    queueMicrotask(() => {
      if (typeof callback !== "function") return emit(this.result);

      // 2.2.1 - 2.2.3
      try {
        // 2.2.5 -> 3.2
        const x = callback(this.result);
        resolve(x);
      } catch (e) {
        reject(e);
      }
    });
  };

  // 2.3
  private handleResolvePromise = (x: any) => {
    // 2.3.1
    if (this === x) return this.rejected(new TypeError("2.3.1"));

    // 2.3.2 -> 3.4
    if (x instanceof MP) {
      x.then(this.fulfilled, this.rejected);
    }

    // 2.3.3
    if (x !== null && (typeof x === "object" || typeof x === "function")) {
      let then;
      try {
        // 2.3.3.1 -> 3.5
        then = x.then;
      } catch (e) {
        // 2.3.3.2
        this.rejected(e);
      }

      // 2.3.3.3 实际就是重新订阅处理 handleResolvePromise(y)
      if (typeof then === "function") {
        return new MP(then.bind(x)).then(this.fulfilled, this.rejected);
      }
    }

    // 2.3.3.4
    this.fulfilled(x);
  };

  private transformState = (
    state: STATES.FULFILLED | STATES.REJECTED,
    result: any
  ) => {
    // 2.1.1
    if (this.state === STATES.PADDING) {
      this.state = state;
      this.result = result;
      this.handleCallBacks();
    }
  };

  // 2.1.2
  private fulfilled = (value: any) => {
    this.transformState(STATES.FULFILLED, value);
  };

  // 2.1.3
  private rejected = (reason: any) => {
    this.transformState(STATES.REJECTED, reason);
  };

  private runOnce() {
    let isRun = false;
    const run = (cb: CallBack) => (value: any) => {
      if (!isRun) {
        cb(value);
        isRun = true;
      }
    };
    return run;
  }
}

export default MP;
