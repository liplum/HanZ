export enum LiteralType {
  string = "string",
  number = "number",
  bool = "bool",
}

export class HzLiteral<T> {
  raw: string
  value: T
  constructor(raw: string) {
    this.raw = raw
  }
}

export class HzStringLiteral extends HzLiteral<string> {
  toJSON() {
    return {
      type: LiteralType.string,
      raw: this.raw,
    }
  }
}

export class HzNumberLiteral extends HzLiteral<number> {
  toJSON() {
    return {
      type: LiteralType.number,
      raw: this.raw,
    }
  }
}

export class HzBoolLiteral extends HzLiteral<boolean> {
  toJSON() {
    return {
      type: LiteralType.bool,
      raw: this.raw,
    }
  }
}