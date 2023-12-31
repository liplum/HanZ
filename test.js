/* eslint-disable quotes */
import test from "ava"
import { lex } from "./dist/lex/lexer.js"
import { parse } from "./dist/parse/parser.js"
import { TokenType } from "./dist/lex/token.js"
import { semanticAnalyze } from "./dist/ast/analysis.js"
import { transpile2Js } from "./dist/visitor/2js.js"
import { Writable } from "stream"
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

test("[2js] object + func call + new", t => {
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

账户乙 := 账户 继承自: 账户甲。
账户乙 存入: 299, 取出: 199。

函数 交换财产: 甲 与: 乙【
  子 := 甲 余额。
  甲 设置余额: 乙 余额。
  乙 设置余额: 子。
】

交换财产: (账户甲) 与: 账户乙。
`
  const tokens = lex(source)
  t.is(tokens.length, 127)
  const fileDef = parse(tokens)
  t.is(fileDef.topLevels.length, 9)
  const fileNode = semanticAnalyze(fileDef)
  transpile2Js(fileNode, new Writable({ write() { } }))
})

test("[x] assign to rvalue", t => {
  try {
    parse(lex("obj prop = 10"))
  } catch {
    t.pass()
  }
})
