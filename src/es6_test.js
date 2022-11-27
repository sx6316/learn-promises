const P = require("./es6");

P.resolve(0)
  .then(() => {
    console.log("-1-");
    return P.resolve(2);
  })
  .then(() => {
    console.log("-5-");
  })
  .then(() => {
    console.log("-7-");
  })
  .then(() => {
    console.log("-8-");
  });

P.resolve(0)
  .then(() => {
    console.log("-2-");
  })
  .then(() => {
    console.log("-3-");
  })
  .then(() => {
    console.log("-4-");
  })
  .then(() => {
    console.log("-6-");
  });

// 校准微任务注册层级及顺序，对齐es6
queueMicrotask(() => {
  console.log(1);
  queueMicrotask(() => {
    console.log(2);
    queueMicrotask(() => {
      console.log(3);
      queueMicrotask(() => {
        console.log(4);
      });
    });
  });
});
