export enum LiteralType {
  string = "string",
  number = "number",
  bool = "bool",
  null = "null",
  undefined = "undefined",
}

export class HzLiteral {
  constructor(
    public type: LiteralType,
    public raw: string,
  ) { }
  toJSON() {
    return {
      type: this.type,
      raw: this.raw,
    }
  }
}
