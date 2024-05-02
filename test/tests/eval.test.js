const x = {};
eval("({}).a");
console.log(eval("({b: 42})").b);
eval.constructor("return ({}).c")();
Function("return ({})")().d;
x.constructor.constructor("return ({})")().e;

eval("Function('({}).f')()")