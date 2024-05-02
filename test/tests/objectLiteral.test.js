({ y } = {});

({
  y: { z },
} = { y: {} });

({ y } = { y: 42 });

({ y } = Object.create(null));

({ ["y"]: y } = {});
