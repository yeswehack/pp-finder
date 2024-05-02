let counter = 0;

const x = {
  get y (){
    return counter++;
  }
}


console.log(x.y)
console.log(x.y)
console.log(x['y'])
console.log(x['y'])

let {y} = x;
console.log(y)
console.log(y)


console.log(x.y['x'])
console.log(x.y['x'])
console.log(x.y)