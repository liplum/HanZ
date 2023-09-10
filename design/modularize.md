# Modularize

A single HanZ file represents a HanZ module, Hereinafter referred to as `HanZ file`.

## Top-level

A HanZ file can only consist of top-level symbols:

1. Object declaration.
2. Function declaration.
3. Variable declaration.
4. Variable initialization.

## Module name

Here is a project example.

```plaintext
project/
├─ src/
│  ├─ liplum/
│  │  ├─ core.hanz
│  │  ├─ utils.hanz
│  │  ├─ models.hanz
├─ .gitignore
├─ README.md
```

```
// in "liplum/utils.hanz" file
@en ["liplum.utils"]

[class]
@zh_CN [工具]
Utils [
  [static]
  @zh_CN [加, 和]
  add: a to: b [
    return a + b.
  ]
]
```

```
// in "liplum/core.hanz" file
@zh_CN ["liplum.core"]
模块 加载: "liplum.utils" 语言环境: "zh_CN"。

结果 := 工具 加: 3 和: 4。
```
