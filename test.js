/* eslint-disable quotes */
import test from "ava"
import { lex } from "./dist/lex/lexer.js"
import { parse } from "./dist/parse/parser.js"
import { TokenType } from "./dist/token.js"
test("[lex] simple expr", t => {
  const source = "5.14+16*3"
  const tokens = lex(source)
  t.is(tokens.length, 6)
  t.is(tokens[0].lexeme, "5.14")
  t.is(tokens[1].operator, "+")
  t.is(tokens[2].lexeme, "16")
  t.is(tokens[3].operator, "*")
  t.is(tokens[4].lexeme, "3")
})

test("[lex] quoted string", t => {
  const source = `"hello, world!"`
  const tokens = lex(source)
  t.is(tokens.length, 2)
  t.is(tokens[0].lexeme, "hello, world!")
})

test("[lex] escape string", t => {
  const source = `"a\\tb\\"c"`
  const tokens = lex(source)
  t.is(tokens.length, 2)
  t.is(tokens[0].lexeme, `a\tb"c`)
  t.pass()
})

test("[lex] identifier + new line", t => {
  const source =
    `foo = 10.
bar = 5.`
  const tokens = lex(source)
  t.is(tokens.length, 9)
  t.is(tokens[0].lexeme, "foo")
  t.is(tokens[4].lexeme, "bar")
})

test("[lex] comment", t => {
  const source =
    `foo = 10. // assign to 10
// nothing
bar = 5. // assign to 5`
  const tokens = lex(source)
  t.is(tokens.length, 9)
  t.is(tokens[0].lexeme, "foo")
  t.is(tokens[3].type, TokenType.dot)
  t.is(tokens[4].lexeme, "bar")
  t.is(tokens[7].type, TokenType.dot)
})

test("[parse] simple expr", t => {
  const source = "5.14 + 16 * 3。"
  const tokens = lex(source)
  t.is(tokens.length, 7)
  const file = parse(tokens)
  t.is(file.topLevels.length, 1)
})

test("[parse] object + method + field + method chaining + init + ctor", t => {
  const source =
    `
对象 账户【
  | 余额 |
  账户 新建【
    余额 = 0。
  】
  账户 继承自: 另一账户【
    余额 = 另一账户 余额。
  】
  // to deposit money
  方法 存入: 金额【
    余额 += 金额。
    返回 自己。
  】
  // to withdraw money
  方法 取出: 金额【
    余额 -= 金额。
    返回 自己。
  】
】

// test instantiation
账户甲 := 账户 新建。

// test messaging
账户甲 存入: 799。
账户甲 取出: 199。

// test method chaining
账户甲 存入: 799, 取出: 199。
  `
  const tokens = lex(source)
  t.is(tokens.length, 77)
  const file = parse(tokens)
  t.is(file.topLevels.length, 5)
})

test("[x] assign to rvalue", t => {
  try {
    parse(lex("obj prop = 10"))
  } catch {
    t.pass()
  }
})
