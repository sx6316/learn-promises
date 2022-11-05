const STATES = {
  PADDING: "PADDING",
  FULFILLED: "FULFILLED",
  REJECTED: "REJECTED",
};

function CreateThenable() {
  let state = STATES.PADDING;
  let result = null;
  let callBacks = [];

  let isRun = false;

  const Thenable = {
    name: CreateThenable,
    resolve,
    reject,
    then,
  };

  function resolve(value) {
    emit("resolve", value);
  }

  function reject(reason) {
    emit("reject", reason);
  }

  function handleResolvePromise(x) {
    const resolve = transformState(STATES.FULFILLED);
    const reject = transformState(STATES.REJECTED);
    if (Thenable === x) return reject(new TypeError("2.3.1"));

    if (x && x.name === CreateThenable) {
      return x.then(resolve, reject);
    }

    if (x !== null && (typeof x === "object" || typeof x === "function")) {
      let then;
      try {
        then = x.then;
      } catch (e) {
        reject(e);
      }

      if (typeof then === "function") {
        const p = CreateThenable();
        p.then(resolve, reject);

        try {
          then.call(x, p.resolve, p.reject);
        } catch (e) {
          p.reject(e);
        }

        return;
      }
    }
    resolve(x);
  }

  function emit(type, value) {
    if (isRun) return;
    isRun = true;

    if (type === "resolve") {
      return handleResolvePromise(value);
    }

    transformState(STATES.REJECTED)(value);
  }

  function then(onFulfilled, onRejected) {
    const nextPromise = CreateThenable();
    callBacks.push({
      onFulfilled,
      onRejected,
      np: nextPromise,
    });

    if (state !== "PADDING") {
      handleCallBacks();
    }

    return nextPromise;
  }

  function handleCallback(np, emit, callback) {
    queueMicrotask(() => {
      if (typeof callback !== "function") return emit(result);

      try {
        const x = callback(result);
        np.resolve(x);
      } catch (e) {
        np.reject(e);
      }
    });
  }

  function handleCallBacks() {
    const temp = callBacks;
    callBacks = [];

    for (const item of temp) {
      const { np, onFulfilled, onRejected } = item;

      if (state === STATES.FULFILLED) {
        handleCallback(np, np.resolve, onFulfilled);
      } else {
        handleCallback(np, np.reject, onRejected);
      }
    }
  }

  function transformState(theState) {
    return function (v) {
      if (state === STATES.PADDING) {
        state = theState;
        result = v;
        handleCallBacks();
      }
    };
  }

  return Thenable;
}

module.exports = CreateThenable;
