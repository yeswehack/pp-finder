class Test {
  #test;

  test() {
    if (#test in this) {
      return this.#test;
    }
    return false;
  }
}

const t = new Test();
t.test();
