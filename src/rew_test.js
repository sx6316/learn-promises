/**
 * 不走jest 直接node执行
 */

const promisesAplusTests = require("promises-aplus-tests");
const CreateThenable = require("./rew");

const adapter = {};
adapter.deferred = function () {
  const mp = CreateThenable();
  const result = {
    promise: mp,
    resolve: mp.resolve,
    reject: mp.reject,
  };

  return result;
};

promisesAplusTests(adapter, function (err) {
  // All done; output is in the console. Or check `err` for number of failures.
});
