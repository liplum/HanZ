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
Package declare: "liplum.utils"

func add: a to: b [
  return a + b
]
```

```
// in "liplum/core.hanz" file
Package declare: "liplum.core"
Package load: "liplum.utils"

result := add: 3 to: 4
```
