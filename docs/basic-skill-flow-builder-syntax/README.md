# Basic Skill Flow Builder Syntax

The Skill Flow Builder provides the following metadata format for games and
stories. For information about how to format your content, see
[Skill Flow Builder Reference](../skill-flow-builder-reference/README.md).

## Scene properties

In the Skill Flow Builder scenes are the basic building blocks. Scenes contain
various types of content and can be connected in any way you want to create your
story or game.

The following shows the structure of a scene.

```
@scene name
    *say
        content
    *reprompt
        content
    *show
        content
    *then
        scene instructions
```

The scene name identifies the scene. The scene name has the following criteria:

- Must start with `@`s
- Can be any number of letters, numbers, and spaces
- Must be unique within your story
- Must be contained within the line

Some scene names are reserved for special purposes. For more information, see
[special scene terminators](../advanced-skill-flow-builder-syntax/README.md#special-scene-terminators).

### *say

When the scene plays, Alexa reads aloud to the user the content defined within
the `*say` property. The `*say` property:

- Is optional
- Can be multiple lines
- Can use [SSML](https://developer.amazon.com/en-US/docs/alexa/custom-skills/speech-synthesis-markup-language-ssml-reference.html)
- Can use `||` to denote variations
- Can inject variable values with curly brackets

The following example shows how you can use `||` (the dialogue variation symbol)
with the `*say` property.

`||` (dialogue variation)

```
*say
    something like this
    ||
    or something like this
```

`||` specifies variations to be selected randomly and can help make your story
feel less stale for repeated content. You can use dialogue variation on `*say`,
`*reprompt`, and `*recap`.

### *reprompt

Alexa reads aloud the content within the `*reprompt` property if the player
doesn't say anything when your game expects a player response. By default, if
you do not specify `*reprompt` Alexa reprompts the user with the `*say` content
from the last scene.

Like `*say`, the `*reprompt` property:

- Is optional
- Can be multiple lines
- Can use [SSML](https://developer.amazon.com/en-US/docs/alexa/custom-skills/speech-synthesis-markup-language-ssml-reference.html)
- Can use `||` to denote variations
- Can inject variable values with curly brackets

### *recap

Alexa reads aloud the content within the `*recap` property if the player
responds with an unexpected response.

Like `*say` the `*recap` property:

- Is optional
- Can be multiple lines
- Can use [SSML](https://developer.amazon.com/en-US/docs/alexa/custom-skills/speech-synthesis-markup-language-ssml-reference.html)
- Can use `||` to denote variations
- Can inject variable values with curly brackets

### *show

If the player is on a device that supports visual content, the device displays
the visual components assigned within this section. See [Add visuals](../use-skill-flow-builder-to-create-content/add-visual-elements.md).

### *then

The `*then` property provides a list of scene instructions, which are commands
that are executed in order after Alexa plays the content for the scene.

## Scene instructions

### -> (go to)

A terminator that specifies that the Skill Flow Builder should transition to
another scene.

```
*then
    -> start
```

The `->` instruction:

- Must be followed by a scene name.
- Supports variable injection with curly brackets, so if the variable named `two`
has a value of `2` then `-> scene {two}` would go to `@scene 2`.
- Is a terminator, which means that it indicates the end of the scene. As soon
as a terminator executes, the process immediately moves to the next scene.

### hear

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

## Ask for the player name, or an Alexa slot value

To listen for exact phrases or words, write out the phrases or words using the
[hear instruction](../skill-flow-builder-reference/scene-instructions.md#hear). See
the section [Give choices to the player](#give-choices-to-the-player).

In some cases, you cannot anticipate what the player might say, or you cannot
write out all possible combinations. For eample, if you want to get the player's
name, it is unreasonable to list every possible name.

The following is an example of a scene named `@ask player name` that says
"Please tell me your name":

```
@ask player name
    *say
        Please tell me your name.
    *then
        slot playerName to 'AMAZON.US_FIRST_NAME'
        hear {playerName}, my name is {playerName} {
            -> next scene
        }
@next scene
    *say
        hi {playerName}
```

The structure looks similar to the `hear` command from
[Give choices to the player](#give-choices-to-the-player).,
but with the following differences:

- `slot playerName to 'AMAZON.US_FIRST_NAME'`
- The `slot` instruction tells Alexa that when we are using `{playerName}` for a
`hear` command, Alexa needs to listen for a U.S. first name. For more
information, see the [built-in intents and slot values](https://developer.amazon.com/en-US/docs/alexa/custom-skills/built-in-intent-library.html).
- `hear {playerName}, my name is {playerName} {`
- This instruction tells Alexa to listen for a `{playerName}` on its own or
preceded by "my name is". For example, if the player says "my name is max", the
value of `playerName` becomes "max".
- `hi {playerName}`
- Use curly brackets to insert saved values into your content. For example, if
the player said "my name is max" during `@ask player name` scene, the player
hears "hi max" in `@next scene`.

Another common slot type is `AMAZON.NUMBER`, which you can use to ask the player
to tell you a number.

To learn more about built-in slot types, see the [Slot Type Reference](https://developer.amazon.com/en-US/docs/alexa/custom-skills/slot-type-reference.html).

## Custom Slots

### Define custom slots

You can define your custom slot types by editing the custom slot type
configuration, which is generated along with your project. You can find the file
`SlotTypes.json` in `content/en-US/resources/SlotTypes.json`.

The following example shows a defined custom slot type and values for fruit.

```json
{
  "CustomFruitType": [
    "apple",
    "pear",
    "orange"
  ]
}
```

The content of this file is a map: keys of the map are slot type names, and the
values are a list slot values belonging to that slot type.

### Using the custom slot type

Once you have defined your custom slot type and its values, you can use them in
your story by using `slot` instruction.

```
@prompt for favorite fruit
    *say
        What are your favorite fruits?
    *then
        slot favoriteFruitName as 'CustomFruitType'
        hear my favorite is {favoriteFruitName}, it is {favoriteFruitName} {
            set favoriteFruit as favoriteFruitName

            if !favoriteFruit {
                -> don't know that fruit
            }

            -> tell user their favorite fruit
        }

@tell user their favorite fruit
    *say
        I see! Your favorite fruit is {favoriteFruit}! Good bye!

@don't know that fruit
    *say
        I'm not sure if i know that fruit. Good bye!
```

`slot favoriteFruitName as 'CustomFruitType'` is a command assigning the
variable `favoriteFruitName` to the custom slot type `CustomFruitType`.

Once the variable is assigned to a slot type (custom or built-in), you can use
it with the `hear` instruction as shown in the example above.

In this example, if the user said "my favorite is apple" or "it is apple", the
slot variable `favoriteFruitName` will hold the value "apple" as a result.

As a best practice, it is encouraged to immediately assign the captured value to
another variable as seen with the line `set favoriteFruit as favoriteFruitName`.
When using a variable with the `slot` command the captured value is not
guaranteed to stay.

For advanced custom slot type syntax, see
[Custom slots: define slot values with synonyms](../advanced-skill-flow-builder-syntax/README.md#custom-slots-define-slot-values-with-synonyms).

### Create a scene

When a player opens your game for the first time, your skill should respond and
prompt the player. Define the first-time launch behavior by creating a `start`
scene. The following example shows a `start` scene that instructs Alexa to say
"Welcome to my awesome game!"

```
@start
    *say
        Welcome to my awesome game!
```

Every scene starts with the scene name following `@` on a new line. In the
example, the scene name is `start`. A few scene names like `start`
[are reserved](../skill-flow-builder-reference/special-scenes.md#start) and should
only be used for special behavior.

Add content to the scene by using a
[scene property](../skill-flow-builder-reference/scene-properties.md#say) like
`*say`, which tells Alexa what to say during the scene. Specify the scene
property on a new line with `*` followed by the property name.

```
*say
    Welcome to my awesome game!
```

The sentence `Welcome to my awesome game!` is the content of the `*say`
property. Content can continue for multiple lines until you define another scene
property with `*`, or another scene with `@`. Indentation is optional.

### Give choices to the player

The following example shows a `start` scene where the player can choose to be a
pirate or merchant.

```
@start
    *say
        Welcome to my awesome game!
        Do you want to be a pirate or a merchant?
    *then
        hear I want to be a pirate, pirate, I'll be a pirate {
            -> choose pirate
        }

        hear I want to be a merchant, merchant, I'll be a merchant {
            -> choose merchant
        }
```

The scene uses the `*say` property to have Alexa say "Welcome to my awesome
game! Do you want to be a pirate or a merchant?", and uses the `*then` property
to list the following instructions:

```
hear I want to be a pirate, pirate, I'll be a pirate {
    -> choose pirate
}
```

The `hear` instruction tells Alexa to listen for specific words or phrases and
then do something. You can list synonyms by using commas to separate the entries.

In the example, Alexa listens for "I want to be a pirate", "pirate", or "I'll
be a pirate". If Alexa hears any of the phrases from the player, Alexa executes
the instructions listed between `{` and `}`.

If the player says "pirate", Alexa executes `-> choose pirate`, which tells
Alexa to [go to](../skill-flow-builder-reference/scene-instructions.md#--go-to) the
scene "choose pirate". The transition for the `->` instruction occurs
immediately, and the remaining instructions within the scene do not execute.

### String multiple scenes together

Sometimes, you may want to transition between scenes without player input.
Consider the following examples:

#### Example 1

```
@start
    *say
        Welcome to my awesome game!
        Do you want to be a pirate
        or a merchant?
    *then
        hear pirate {
            -> choose pirate
        }
        hear merchant {
            -> choose merchant
        }
```

#### Example 2

```
@start
    *say
        Welcome to my awesome game!
    *then
        -> choose your trade

@choose your trade
    *say
        Do you want to be a pirate
        or a merchant?
    *then
        hear pirate {
            -> choose pirate
        }
        hear merchant {
            -> choose merchant
        }
```

The examples result in identical experiences for the player. However, you might
find the second version more useful for the following reasons:

- Later on in your game, you can go directly to `@choose your trade` question
without having to say "Welcome to my awesome game!"
- If the player doesn't say anything and Alexa has to repeat the question, Alexa
only says the question from the most recent scene.

### Add sound effects

You can use any SSML tag that Alexa supports to customize your content. To use
sound effects and audio files within your content, use the SSML audio tag. For
more information, see
[audio](https://developer.amazon.com/en-US/docs/alexa/custom-skills/speech-synthesis-markup-language-ssml-reference.html#audio)
in the "Speech Synthesis Markup Language (SSML) Reference."

```
@start
    *say
        Welcome to my awesome game!
        <audio src='https://s3.amazonaws.com/.../yourAudioFile.mp3' />
        Do you want to be a pirate or a merchant?
```

### Add different voices

You can use a voice SSML tag to use various voices in your Alexa skill. For more
information about voices, see [voice](https://developer.amazon.com/en-US/docs/alexa/custom-skills/speech-synthesis-markup-language-ssml-reference.html#voice)
in the "Speech Synthesis Markup Language (SSML) Reference."

```
@start
    *say
        <voice name='Kendra'>I am not a real human.</voice>.
```

### Save player decisions, inventory, or progress

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

Use the `unflag` instruction to unset the flag. For example, if the player loses
the skeleton key in a scene, unset the flag in the following manner:

```
*then
    unflag skeletonkey
```

#### Use saved player decisions, inventory, or progress to do something

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
automatically to a scene called `open door`. If the player unflagged `skeletonkey`
earlier in the game or never flagged, the game continues automatically to a
scene called `door locked`.

Use the [if](../skill-flow-builder-reference/scene-instructions.md#if) instruction
to tell Alexa to check whether the statements after `if` are true or false. When
the statement that follows `if` is true, for example a flag that has been set,
Alexa executes the instructions between `{` and `}`. If the flag is unset, the
statement is interpreted as `false`, and the instructions listed between `{` and
`}` are skipped.

Any flag that the player never declares evaluates to `false`.

> **Note:** If you include a `-> (go to)` instruction within the if block, the if
instruction skips any remaining instructions for the current scene and the
transition happens immediately.

The following examples show how to use a not (`!`) symbol within an `if`
statement. The examples are logically the same and result in the same player experience:

##### Example 1

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

##### Example 2

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

#### Check more than one flag

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

If you want to check if the player is able open the door or talked to the wizard
use `or`. In this next example, either flags can be set for the statement to be `true`.
```
*then
    if skeletonkey or talked_to_wizard {
        -> open door
    }
```

### Set and use variables

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

#### Use variables in narration

To personalize narration, consider using a variable in the `*say` and `*reprompt`
section by wrapping the variable with curly brackets (`{}`). The following
example shows how to do this.

```
@play introduction
    *say
        Welcome to our mysterious world. Your class is {playerClass}.
```

The player hears the phrase with `{playerClass}` replaced with the value of the variable.

#### Use variables in game logic

Use variables to control game behavior:

```
@play introduction
    *say
        Welcome to our mysterious world. Your class is {playerClass}.
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
@start
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
[Set, increase, decrease, clear, flag, unflag, in Skill Flow Builder Reference](../skill-flow-builder-reference/scene-instructions.md#set-increase-decrease-clear-flag-unflag).

If you have never declared a variable, any statement that evaluates the variable
returns `false`. For example, if you don't declare `playerHealth`, if
`playerHealth <= 0` returns `false`, and the game logic proceeds as if
`playerHealth` is a positive value.

#### Use randomness to make decisions for players

To make a random decision in your game, or to generate a random number for
dynamic content for your game, you can use the [roll instruction](../skill-flow-builder-reference/core-extensions.md#roll-and-rollresult).

The [roll instruction](../skill-flow-builder-reference/core-extensions.md#roll-and-rollresult)
takes one argument that combines the number of dice, and the number sides on the
dice to roll and returns a result that ranges between 1 and the highest number
possible. To roll a standard six-sided die, you can write `roll 1d6`, or to flip
a two-sided coin you can write `roll 1d2`. If you use the
[roll instruction](../skill-flow-builder-reference/core-extensions.md#roll-and-rollresult)
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

## Create a reusable utility scene

You might want to reuse a certain scene multiple times throughout your game.
Consider the following example:

```
@start
    *say
        You tiptoe past the sleeping orc.
    *then
        <-> test your luck
        if lucky {
            -> walk past the orc
        }
        -> fight orc

@walk past the orc
    *say
        You make no noise and walk past the orc and into the room filled with
        gold. You win!
    *then
        >> END

@fight orc
    *say
        You stumble and the orc wakes up. He is angry to be awoken and he kills
        you. Sad.
    *then
        >> END

@test your luck
    *say
        Let's test your luck.
    *then
        clear lucky
        roll 1d6
        if rollResult > 2 {
            flag lucky
        }
        -> luck result

@luck result
    *say
        You rolled a {rollResult}.
    *then
        >> RETURN
```

The first scene (`@start`), uses the
[<->](../skill-flow-builder-reference/scene-instructions.md#--go-to-and-return)
instruction to go to the `@test your luck` scene and then returns after
encountering the [» RETURN](../skill-flow-builder-reference/special-terminators#-return)
instruction in `@luck result` scene. You can use a utility scene like the
`@test your luck` scene to add a luck roll at any point in your game.

## Let users restart from anywhere

You might want to add a command to all scenes, for example to allow the player
to say "restart" at any time to restart the game. The following example shows
how to use the global scene `@global append` and the [» RESTART](../skill-flow-builder-reference/special-terminators.md#-restart)
instruction:

```
@global append
    *then
        hear restart, start over {
            >> RESTART
        }
```

In the example, the `@global append` scene adds instructions to every scene in
the game that allow the player to restart the game.

### Add a help menu

Similar to the [restart example](#let-users-restart-from-anywhere), you might
want to add a help menu that is accessible from all scenes. You can do this with
the `@global append` scene and
[» BACK](../skill-flow-builder-reference/special-terminators.md#-back) instruction.

```
@global append
    *then
        hear help {
            -> help
        }
@help
    *say
        Here is some help.
    *then
        >> BACK
```

In the example, the `@global append` scene adds instructions to every scene. The
instructions go to `@help` if the player asks for help. The help scene plays a
helpful message and then replays the previous scene with the `>> BACK` instruction.

## Control relaunch behavior

As you test your Alexa story or game, you might want to interrupt and control
the player experience for when the player launches the skill again. By default,
the Skill Flow Builder tries to go to the last scene the player exited. You can
change the behavior by creating a `@resume` scene, as shown in the following example:

```
@resume
    *say
        Welcome back! Do you want to continue your story from where you last left
        off?
    *then
        hear yes {
            >> RESUME
        }

        hear no {
            -> start
        }
```

By creating the `@resume` scene, when the story resumes, the player goes to the
`@resume` scene instead of to the last scene the player was in.

When players quit, exit, pause, or error out of your skill, the name of the
last-visited scene is automatically saved. To resume to the last-visited scene,
use the following instruction:

```
>> RESUME
```

If the player says "yes", the story resumes to the last-visited scene. If the
player says "no", the story transitions to the `@start`.

## Create an ending

At some point, you might want to end your game or story.

```
@maybe an ending
    *say
        perhaps this is your end
    *then
        if someflag is true {
            -> keep playing
        }

        >> END
```

In the example, if the
[flag](../skill-flow-builder-reference/scene-instructions.md#set-increase-decrease-clear-flag-unflag)
named `someflag` is `true`, Alexa transitions to another scene named
`keep playing`. If the flag `someflag` is not `true`, `>> END` executes, which
stops the game, and the player goes to the `@start` scene the next time they play.
