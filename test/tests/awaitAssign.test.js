async function f() {
  const x = {};

  await x.y;
  await x["y"];
  y = 42;
  return y;
}


f()
