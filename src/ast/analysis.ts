import { HzFileDef } from "../parse/file.js"
import { ASTNode, FileNode } from "./node.js"

export function semanticAnalyze(fileDef: HzFileDef): FileNode {
  const fileNode = new FileNode(fileDef)
  buildNode(fileNode)
  linkNode(fileNode)
  return fileNode
}

function buildNode(node: ASTNode): void {
  node.build()
  if (!node.isLeaf) {
    for (const child of node.children()) {
      buildNode(child)
    }
  }
}

function linkNode(node: ASTNode): void {
  node.link()
  if (!node.isLeaf) {
    for (const child of node.children()) {
      linkNode(child)
    }
  }
}
