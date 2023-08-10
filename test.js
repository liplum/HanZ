/* eslint-disable quotes */
import test from "ava"
import { lex } from "./dist/lexer.js"
import { parse } from "./dist/parser.js"
import { TokenType } from "./dist/token.js"
test("[lexer] simple expr", t => {
  const source = "5.14+16*3"
  const tokens = lex(source)
  t.is(tokens.length, 6)
  t.is(tokens[0].lexeme, "5.14")
  t.is(tokens[1].operator, "+")
  t.is(tokens[2].lexeme, "16")
  t.is(tokens[3].operator, "*")
  t.is(tokens[4].lexeme, "3")
})

test("[lexer] quoted string", t => {
  const source = `"hello, world!"`
  const tokens = lex(source)
  t.is(tokens.length, 2)
  t.is(tokens[0].lexeme, "hello, world!")
})

test("[lexer] escape string", t => {
  const source = `"a\\tb\\"c"`
  const tokens = lex(source)
  t.is(tokens.length, 2)
  t.is(tokens[0].lexeme, `a\tb"c`)
  t.pass()
})

test("[lexer] identifier + new line", t => {
  const source =
    `foo = 10.
bar = 5.`
  const tokens = lex(source)
  t.is(tokens.length, 9)
  t.is(tokens[0].lexeme, "foo")
  t.is(tokens[4].lexeme, "bar")
})

test("[lexer] comment", t => {
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
  const topLevels = parse(tokens)
  t.is(topLevels.length, 1)
})

test("full source", t => {
  const source =
    `
对象 账户【
  | 余额 |
  账户 新建【
    余额 = 0。
  】
  账户 继承自: 另一账户【
    自己 余额 = 另一账户 余额。
  】
  // to deposit money
  函数 存入: 金额【
    余额 += 金额。
    返回 自己。
  】
  // to withdraw money
  函数 取出: 金额【
    余额 -= 金额。
    返回 自己。
  】
】
  `
  const tokens = lex(source)
  t.is(tokens.length, 54)
  const topLevels = parse(tokens)
  t.is(topLevels.length, 1)
})
