# Scene instructions

## -> (go to)

A terminator that specifies that the Skill Flow Builder should transition to
another scene.

```
*then
    -> start
```

The `->` instruction:

- Must be followed by a scene name
- Supports variable injection with curly brackets, so if the variable named
`two` has a value of 2, then `-> scene {two}` would go to `@scene 2`.
- Is a terminator, which means that it indicates the end of the scene. As soon
as a terminator executes, the process immediately moves to the next scene.

## hear

The `hear` instruction specifies the words or phrases to listen for, and what
should happen if heard.

```
*then
    hear run, get out of here, go {
        decrease courage by 1
        -> run
    }
    hear hide {
        set fear to 10
        -> hide
    }
```

The `hear` instruction:

- Can specify multiple phrases to listen for, separated by commas
- Must be surrounded by curly brackets
- Can be inside an `if` or contain an `if` statement

## if

```
*then
    if not enraged {
        increase fear by 2
    }
    if fear is greater than 10 {
        -> fear warning
    }
    -> next room
```

Use `if` to specify conditions. Conditions defined after `if` need to be
satisfied, in other words be true, to execute the instructions under the `if` statement.

An if statement:

- Has instructions that must be surrounded by curly brackets
- Can be inside or contain a `hear` statement
- Can be nested
- Can use `!` in front of a value, where `!` means "not"
- Supports operators:
  - `is`
  - `==`
  - `is greater than`
  - `>`
  - `is greater than or equal`
  - `>=`
  - `is less than`
  - `<`
  - `is less than`
  - `<=`
  - `is not`
  - `!=`
  - `and`
  - `&&`
  - `or`
  - `||`
  - `()`

## Set, increase, decrease, clear, flag, unflag

The following instructions set and manipulate variables:

```
*then
    set fear to 2       // fear = 2
    increase fear by 10 // fear = fear + 10 = 12
    decrease fear by 5  // fear = fear - 5 = 7
    flag scared         // scared = true
    unflag scared       // scared = false
    clear fear          // fear = null
    clear *             // clear all variables setup by your story/game
    -> start
```

## <-> (go to and return)

You can use the `<->` instruction to go to a reusable scene and then return to
the flow of your game.

```
@start
    *then
        <-> test your luck
        >> END

@test your luck
    *say
        You are not lucky.
    *then
        >> RETURN
```

`<-> test your luck` takes the player to `@test your luck` scene, then `>>
RETURN` takes the player back to the line after the `<->` instruction.

`<->` is a special type of terminator in that instructions after `<->` do not
execute until a `>> RETURN` instruction is executed. You can string multiple
`<->` and multiple `>> RETURN` instructions together.

## bookmark

You can use the `bookmark` instruction if you want to save the current scene and
transition to the same scene later. The following example shows a global listener
for "how much money do i have". When the player says this utterance, the
bookmark command saves the scene the player is currently on, and then moves on
to the `@money report` scene. From that scene, the `->  bookmark` command takes
the player back to the scene where the instruction `bookmark` was last executed.

```
@global prepend
*then
    hear how much money do i have {
        bookmark
        -> money report
    }

@money report
*say
    You have 500 dollars.
*then
    -> bookmark
```

## -> (go to) *property

You can decide what speech property to play as scene transitions. As soon as the
transition happens the contents written in the `*say` section play for the
player. You can follow the example below to have the transition play the
`*recap` content instead.

This example also shows the player in the `@you cannot do that` scene is taken
to `@menu` scene, and as a result of this transition, the player hears "you know
me. What do you do?" instead of "Hello this is your menu. What do you do?"

```
@you cannot do that
    *say
        You cannot do that!
    *then
        -> menu *recap

    @menu
    *say
        Hello this is your menu. What do you do?
    *recap
        you know me. What do you do?
```
