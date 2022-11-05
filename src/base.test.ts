import MP from "./base";

// 反复用官方的测就好，哪条没过就复制过来
test("2.3.3.3", async () => {
  const inter = "data";
  let data = await (new MP((res) => {
    res({
      then: function (onFulfilled: any) {
        onFulfilled({
          then: function (onFulfilled: any) {
            onFulfilled(inter);
          },
        });
        throw { error: "error" };
      },
    });
  }) as unknown as Promise<any>);

  expect(data).toBe(inter);
});
