# Basic Concepts

## Identifiers

An **identifier** is a name given to a variable, function, or other programming construct.
Identifiers can only consist of alphabetic characters and Chinese characters. Examples of valid identifiers are `num` and `数`.

However, the Chinese character `的` is reserved for member access on objects and cannot be used as part of an identifier's name.

To include keywords as identifiers, you need to enclose them in single quotes (`'`). For instance, `'它的结果'` is a valid way to use the keyword `它的结果` as an identifier.

## Keyword

The following keywords can't be used in identifier.

| English  | Chinese |
|----------|---------|
| if       | 如果    |
| object   | 对象    |
| while    | 当      |
| until    | 直到    |
| func     | 函数    |
| break    | 中断    |
| continue | 继续    |

## Operators

Operators are symbols that perform operations on operands. Here are the operators supported by this programming language:

- **Addition**: `+`
- **Subtraction**: `-`
- **Multiplication**: `*`
- **Division**: `/`
- **Parentheses**: `()`
- **Member Access**: `.` and `的`
- **Assignment**: `=`
- **Equality**: `==`
- **Greater Than**: `>`
- **Greater Than or Equal To**: `>=`
- **Less Than**: `<`
- **Less Than or Equal To**: `<=`

## Comments

Comments provide explanatory notes within your code.
Comments are initiated with a hash symbol (`#`).
And they are ignored by the lexer, which means they don't affect the program's execution.

Here's an example of a comment:

```python
# This is a comment explaining the purpose of the following code.
```
