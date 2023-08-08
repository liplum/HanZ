/* eslint-disable quotes */
import test from "ava"
import { lex } from "./dist/lexer.js"
import { TokenType } from "./dist/token.js"
test("simple expr", t => {
  const source = "5.14+16*3"
  const tokens = lex(source)
  t.is(tokens.length, 5)
  t.is(tokens[0].lexeme, "5.14")
  t.is(tokens[1].lexeme, "+")
  t.is(tokens[2].lexeme, "16")
  t.is(tokens[3].lexeme, "*")
  t.is(tokens[4].lexeme, "3")
})

test("quoted string", t => {
  const source = `"hello, world!"`
  const tokens = lex(source)
  t.is(tokens.length, 1)
  t.is(tokens[0].lexeme, "hello, world!")
})

test("escape string", t => {
  const source = `"a\\tb\\"c"`
  const tokens = lex(source)
  t.is(tokens.length, 1)
  t.is(tokens[0].lexeme, `a\tb"c`)
  t.pass()
})

test("identifier + new line", t => {
  const source =
    `foo = 10
bar = 5`
const tokens = lex(source)
t.is(tokens.length, 7)
t.is(tokens[0].lexeme, "foo")
t.is(tokens[3].type, TokenType.newLine)
t.is(tokens[4].lexeme, "bar")
})
