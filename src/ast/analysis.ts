import { HzFileDef } from "../parse/file.js"
import { ASTNode, FileNode } from "./node.js"

export function semanticAnalyze(fileDef: HzFileDef): FileNode {
  const fileNode = new FileNode(fileDef)
  buildNode(fileNode)
  return fileNode
}

function buildNode(node: ASTNode) {
  node.build()
  if (!node.isLeaf) {
    for (const child of node.children()) {
      buildNode(child)
    }
  }
}
