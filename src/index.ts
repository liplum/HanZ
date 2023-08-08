import { lex } from "./lexer.js"

const source =
    `foo = 10 # assign to 10
# nothing
bar = 5 # assign to 5`
const tokens = lex(source)
console.log(tokens)