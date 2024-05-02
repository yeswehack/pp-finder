function f1({ y }) {
  return;
}

f1({ y: 42 });
f1({});
f1(Object.create(null));

function f2({ y }, a, { z }) {
  return;
}
f2({}, 42, {});
f2({ y: 42 }, 42, {});
