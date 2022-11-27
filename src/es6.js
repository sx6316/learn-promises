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
    catch: function (onRejected) {
      return then(null, onRejected);
    },
    finally: function (onFinally) {
      function resolve(result) {
        onFinally();
        return result;
      }
      function reject(e) {
        onFinally();
        throw e;
      }

      return then(resolve, reject);
    },
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
      queueMicrotask(() => {
        x.then(resolve, reject);
      });
      return;
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

function P(fn) {
  const mp = CreateThenable();
  try {
    fn(mp.resolve, mp.reject);
  } catch (e) {
    mp.reject(e);
  }

  return mp;
}

P.all = function (PromiseAllParam) {
  const ret = CreateThenable();
  const data = [];
  let length = 0;
  let done = 0;

  function resolve(index) {
    return function (d) {
      data[index] = d;
      done += 1;
      if (done === length) {
        ret.resolve(data);
      }
    };
  }

  try {
    for (const thenable of PromiseAllParam) {
      const index = length;
      length += 1;

      const handle = CreateThenable();
      handle.resolve(thenable);
      handle.then(resolve(index), ret.reject);
    }
    if (length === 0) {
      ret.resolve(data);
    }
  } catch (e) {
    ret.reject(e);
  }

  return ret;
};

P.allSettled = function (PromiseAllParam) {
  const ret = CreateThenable();
  const data = [];
  let length = 0;
  let done = 0;

  function handler(index, status) {
    return function (d) {
      if (status === STATES.REJECTED) {
        data[index] = {
          status: "rejected",
          reason: d,
        };
      } else {
        data[index] = {
          status: "fulfilled",
          value: d,
        };
      }

      done += 1;
      if (done === length) {
        ret.resolve(data);
      }
    };
  }

  try {
    for (const thenable of PromiseAllParam) {
      const index = length;
      length += 1;

      const handle = CreateThenable();
      handle.resolve(thenable);
      handle.then(
        handler(index, STATES.FULFILLED),
        handler(index, STATES.REJECTED)
      );
    }
    if (length === 0) {
      ret.resolve(data);
    }
  } catch (e) {
    ret.reject(e);
  }

  return ret;
};

P.race = function (PromiseRaceParam) {
  const ret = CreateThenable();

  try {
    for (const thenable of PromiseRaceParam) {
      const handle = CreateThenable();
      handle.resolve(thenable);
      handle.then(ret.resolve, ret.reject);
    }
  } catch (e) {
    ret.reject(e);
  }

  return ret;
};

P.resolve = function (PromiseResolveParam) {
  const thenable = CreateThenable();

  thenable.resolve(PromiseResolveParam);

  return thenable;
};

P.reject = function (PromiseRejectParam) {
  const thenable = CreateThenable();

  thenable.reject(PromiseRejectParam);

  return thenable;
};

module.exports = P;
