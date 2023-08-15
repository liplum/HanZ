import { Writable } from "stream"
import { semanticAnalyze } from "./ast/analysis.js"
import { ASTNodeDefinedError, SemanticAnalysisError } from "./ast/node.js"
import { lex } from "./lex/lexer.js"
import { ParseError, parse } from "./parse/parser.js"
import { transpile2Js } from "./visitor/2js.js"
import { install as installSourceMap } from "source-map-support"
installSourceMap()

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
  方法 存入: 金额【
    余额 += 金额。
    返回 自己。
  】
  方法 取出: 金额【
    余额 -= 金额。
    返回 自己。
  】
  方法 设置余额: 金额【
    如果 金额 < 0 【
      余额 = 0。
    】否则【
      余额 = 金额。
    】
  】
】

函数 交换财产: 甲 与: 乙【
  子 := 甲 余额。
  甲 设置余额: 乙 余额。
  乙 设置余额: 子。
】

账户甲 := 账户 新建。
账户甲 存入: 799。
账户甲 取出: 199。

账户乙 := 账户 继承自: 账户甲。
账户乙 存入: 299, 取出: 199。

交换财产: (账户甲) 与: 账户乙。
`
const tokens = lex(source)
try {
  const fileDef = parse(tokens)
  const fileNode = semanticAnalyze(fileDef)
  const compiled = await writeIntoString((writable) => transpile2Js(fileNode, writable))
  console.log(compiled)
} catch (e) {
  const full = JSON.stringify(e)
  if (e instanceof ParseError) {
    const token = e.token
    console.log(nearby(source, token.pos))
  } else if (e instanceof ASTNodeDefinedError) {
    //
  } else if (e instanceof SemanticAnalysisError) {
    //
  }
  console.error(e, full)
}

function nearby(source: string, pos: number): string {
  const start = Math.max(0, pos - 5)
  const end = Math.min(pos + 5, source.length)
  return source.substring(start, end)
}

async function writeIntoString(writing: (writable: Writable) => void): Promise<string> {
  let res = ""
  const output = new Writable({
    write(chunk: Buffer, encoding, next) {
      const data = chunk.toString()
      res += data
      next()
    },
  })
  writing(output)
  return new Promise((resolve, reject) => {
    output.on("close", () => {
      resolve(res)
    })
    output.on("error", (err) => {
      reject(err)
    })
  })
}
