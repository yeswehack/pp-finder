class Test {
  #test;

  test(){
    return this.#test;
  }
}

const t = new Test();
t.test();