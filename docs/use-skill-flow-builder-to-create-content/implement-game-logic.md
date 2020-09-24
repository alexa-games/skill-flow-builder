# Implement Game Logic

The two examples result in identical experiences for the player. However, you
might find [Example 2](./create-the-flow-of-narrative#example-2) more useful for
the following reasons:

- Later on in your game, you can go directly to `@choose your trade` question
without having to say, "Welcome to my awesome game!"
- If the player doesn't say anything and Alexa has to repeat the question, Alexa
only says the question from the most recent scene.

## if

Use the `if` keyword to specify conditions.

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

Conditions defined after `if` must be satisfied. In other words the conditions
must be true, to execute the instructions under the `if` statement.

An `if` statement has the following characteristics:

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
  - `is less than or equal`
  - `<=`
  - `is not`
  - `!=`
  - `and`
  - `&&`
  - `or`
  - `||`
  - `()`

## Save player decisions, inventory, or progress

You might want to save information about the player for use later in your game.
The following list shows examples of this player information:

- The player visited Paris
- The player talked to the wizard
- The player told the wizard no
- The player found the skeleton key

The following example shows how to use the flag instruction to save information:

```
*then
    flag visitedParis
    flag talked_to_wizard
    flag toldWizardNo
```

Similarly, you can set a flag based on player choice:

```
*then
    hear pick up the key {
        flag skeletonkey
        -> escape room
    }
```

If the player says, "pick up the key," a flag named `skeletonkey` is set, and
the game continues to a scene called `escape room`.

Use the `unflag` instruction to unset the flag. For example, if the player
loses the skeleton key in a scene, unset the flag in the following manner:

```
*then
    unflag skeletonkey
```

For more information about flag and unflag instructions see `set`, `increase`,
`decrease`, `clear`, `flag`, `unflag`, in the [Skill Flow Builder Reference](../skill-flow-builder-reference/scene-instructions#set-increase-decrease-clear-flag-unflag).

### Use saved player decisions, inventory, or progress to do something

After saving information about a player, you might want to use the information
to determine if something should happen.

For example, perhaps a player can only open a door if the player has a skeleton key:

```
@escape room
    *say
        You are in a room.
    *then
        if skeletonkey {
            -> open door
        }

        -> door locked
```

If the player flagged `skeletonkey` earlier in the game, the game continues
automatically to a scene called `open door`. If the player unflagged
`skeletonkey` earlier in the game or never flagged, the game continues
automatically to a scene called `door locked`.

Use the instruction to tell Alexa to check whether the statements after `if` are
true or false. When the statement that follows `if` is true, for example, the
player has set a flag, Alexa executes the instructions between the beginning
curly bracket ({) and the ending curly bracket (}). If the player has not set
the flag, the if instruction interprets the statement as `false`, and skips the
instructions listed between the beginning curly bracket ({) and the ending curly
bracket(}).

Any flag that the player never declares evaluates to `false`. For more 
information, see `If` in the [Skill Flow Builder Reference](../skill-flow-builder-reference/scene-instructions#if).

- Note: If you include a `-> (go to)` instruction within the if block, the if
instruction skips any remaining instructions for the current scene and the
transition happens immediately.

The following examples show how to use a not (`!`) symbol within an `if`
statement. The examples are logically the same and result in the same player experience:

#### Example 1

```
@escape room
    *say
        You are in a room.
    *then
        if skeletonkey {
            -> open door
        }

        -> door locked
```

#### Example 2

```
@escape room
    *say
        You are in a room.
    *then
        if !skeletonkey {
            -> door locked
        }

        -> open door
```

The following example shows how to perform multiple instructions inside an `if`
instruction, such as `flag` or `unflag`. You might find this useful if you
intend a skeleton key as a single-use item in the game.

```
*then
    if skeletonkey {
        unflag skeletonkey
        -> open door
    }
```

### Check more than one flag

Check more than one flag within an `if` statement by using `and` or `or`:

```
*then
    if skeletonkey and talked_to_wizard {
        -> open door
    }
```

You might want to use this if you intend for the player to only be able to open
the door if the player has the skeleton key and has also talked to the wizard.
In the example, you must set both flags for the statement to be `true`.

The following example shows how to apply `or`.

```
*then
    if skeletonkey or talked_to_wizard {
        -> open door
    }
```

You might want to use this if you intend the player to open the door if the
player has the skeleton key or has talked to the wizard, or both.

## Set and use variables

Use variables to work with values that you can't determine until players play.
For example, create a variable called `playerClass` to store the character class
the player chooses during the game.

The following example shows how to set the player's class based on what the user
says:

```
@choose class
    *say
        Please choose a class. Are you a warrior, a mage,
        or a thief?
    *then
        hear warrior {
            set playerClass as 'warrior'
            -> play introduction
        }

        hear mage {
            set playerClass as 'mage'
            -> play introduction
        }

        hear thief {
            set playerClass as 'thief'
            -> play introduction
        }
```

In the `*then` section of the scene, Alexa listens for the player to say
"warrior", "mage", or "thief". After the player says any of the expected words,
the variable called `playerClass` receives one of the following values:

- Set the class to 'warrior' if the user says 'warrior'.
- Set the class to 'mage' if the user says 'mage'.
- Set the class to 'thief' if the user says 'thief'.

### Use variables in narration

To personalize narration, consider using a variable in the `*say` and
`*reprompt` section by wrapping the variable with curly brackets (`{}`). The
following example shows how to do this.

```
@play introduction
    *say
        welcome to our mysterious world. Your class is {playerClass}.
```

The player hears the phrase with `{playerClass}` replaced with the value of the variable.

### Use variables in game logic

Use variables to control game behavior:

```
@play introduction
    *say
        welcome to our mysterious world. Your class is {playerClass}.
    *then
        if playerClass is 'mage' {
            -> mage start
        }

        if playerClass is 'warrior' {
            -> warrior start
        }

        if playerClass is 'thief' {
            -> thief start
        }
```

In the example, the value stored in the variable `playerClass` determines the
next scene.

You can also store numbers in a variable and manipulate the variable as the game
plays out. The following example shows a starting value for the variable named `playerHealth`:

```
set playerHealth as 10
```

The following example reduces the value of the variable:

```
@take damage
    *say
        You take 1 damage.
    *then
        decrease playerHealth by 1

        if playerHealth <= 0 {
            -> game over
        }
```

The example reduces the value stored in the variable `playerHealth`, and then
immediately checks whether to transition to the scene called `gameover`. The
example does so by checking whether the value is less than zero.

The `decrease` command decreases the value stored in a variable by the number
indicated. For instructions related to variables, see
[Set, increase, decrease, clear, flag, unflag, in Skill Flow Builder Reference](../skill-flow-builder-reference/scene-instructions#set-increase-decrease-clear-flag-unflag).

If you have never declared a variable, any statement that evaluates the variable
returns `false`. For example, if you don't declar `playerHealth`, if
`playerHealth <= 0` returns `false`, and the game logic proceeds as if
`playerHealth` is a positive value.

### Use randomness to make decisions for players

To make a random decision in your game, or to generate a random number for
dynamic content for your game, you can use the [roll instruction](../skill-flow-builder-reference/core-extensions#roll-and-rollresult).

The [roll instruction](../skill-flow-builder-reference/core-extensions#roll-and-rollresult)
takes one argument that combines the number of dice, and the number sides on the
dice to roll and returns a result that ranges between 1 and the highest number
possible. To roll a standard six-sided die, you can write `roll 1d6`, or to flip
a two-sided coin you can write `roll 1d2`. If you use the
[roll instruction](../skill-flow-builder-reference/core-extensions#roll-and-rollresult)
on a line by itself, the game stores the result in a special variable called
`rollResult` that you can check on subsequent lines.

The following example shows that when a user says, "Choose for me," the roll
instruction sends the player to `@scene one` or `@scene two` randomly:

```
*then
    hear choose for me {
        roll 1d2
            if rollResult == 1 {
            -> scene one
            }
        -> scene two
    }
```
