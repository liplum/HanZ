import { lex } from "./lexer.js"
const source = `"a\\\tb\\"c"`
const tokens = lex(source)