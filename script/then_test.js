const promisesAplusTests = require("promises-aplus-tests");
const { Base } = require("../dist/cjs/index");

const adapter = {};
adapter.deferred = function () {
  const result = {};
  result.promise = new Base(function (resolve, reject) {
    result.resolve = resolve;
    result.reject = reject;
  });

  return result;
};

promisesAplusTests(adapter, function (err) {
  // All done; output is in the console. Or check `err` for number of failures.
});
