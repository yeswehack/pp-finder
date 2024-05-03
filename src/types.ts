export type Pos = [number, number];

export interface PPFOps {
  prop: (pos: Pos, target: any, key: PropertyKey) => any;
  call: (pos: Pos, target: any, ...args: any[]) => any;
  start: (pos: Pos) => void;
  stop: (pos: Pos) => void;
  elemProp: (pos: Pos, id: string, target: any) => any;
  elemKey: (pos: Pos, id: string, key: PropertyKey) => any;
  forIn: (pos: Pos, target: any) => any;
  isIn: (pos: Pos, target: any, key: PropertyKey) => any;
  bind: (pos: Pos, target: any, keyList: PropertyKey[][]) => any;
}
