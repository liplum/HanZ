import { SoftKeyword } from "./token.js"

export enum LiteralType {
  string = "string",
  number = "number",
  bool = "bool",
  null = "null",
  undefined = "undefined",
}

export class HzLiteral<T> {
  value: T
  constructor(
    public raw: string
  ) { }
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

export class HzNullLiteral extends HzLiteral<null> {
  constructor() {
    super(SoftKeyword.null)
  }
  toJSON() {
    return {
      type: LiteralType.null,
      raw: this.raw,
    }
  }
}

export class HzUndefinedLiteral extends HzLiteral<undefined> {
  constructor() {
    super(SoftKeyword.undefined)
  }
  toJSON() {
    return {
      type: LiteralType.undefined,
      raw: this.raw,
    }
  }
}