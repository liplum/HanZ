import test from "ava"
import { lex } from "./dist/lexer.js"
test("simple expr", t => {
  const tokens = lex("5+16*3")
  t.is(tokens[0].lexeme, "5")
  t.is(tokens[1].lexeme, "+")
  t.is(tokens[2].lexeme, "16")
  t.is(tokens[3].lexeme, "*")
  t.is(tokens[4].lexeme, "3")
})
