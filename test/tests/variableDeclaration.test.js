const { a } = {};
const { b } = {},
  { c } = {};
const {
  y: { d },
} = { y: {} };
const { e } = { e: 42 };
const { ["f"]: f } = {};
const { g } = Object.create(null);
let z;
const { h } = ({ z } = {});
