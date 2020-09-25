# Advanced Skill Flow Builder Syntax

This document highlights uses for advanced Skill Flow Builder syntax.

## Custom slots: define slot values with synonyms

You can assign synonyms for the slot values by following the slot value format
shown in this document [here](https://developer.amazon.com/docs/custom-skills/define-synonyms-and-ids-for-slot-type-values-entity-resolution.html#slot-type-json)
for your slot type configurations. The slot type configuration may look like the
following:

```json
{
  "CustomFruitType": [
    {
        "name": {
            "value": "orange",
            "synonyms": [
                "citrus",
                "scurvy preventer",
                "vitamin c fruit"
            ]
        }
    }
  ]
}
```

Whenever users say "citrus", "scurvy preventer", or "vitamin c fruit" Alexa
listens for `CustomFruitType`. The value is resolved to "orange" instead.

### Define simple slot values

You can define simple slot values and synonym slot values in the same list. For
example, if you want to define synonyms for the "orange" value only (excluding
apple and pear), you can write a code block similar to the one below:

```json
{
  "CustomFruitType": [
    "apple",
    "pear",
    {
        "name": {
            "value": "orange",
            "synonyms": [
                "citrus",
                "scurvy preventer",
                "vitamin c fruit"
            ]
        }
    }
  ]
}
```

For more information on custom slots, see [Define Custom Slots](../basic-skill-flow-builder-syntax/README.md#define-custom-slots).

## Special scene terminators

### <-> (go to and return)

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

`<-> test your luck` takes the player to `@test your luck` scene, then
`>> RETURN` takes the player back to the line after the `<->` instruction.

`<->` is a special type of terminator in that instructions after `<->` do not
execute until a `>> RETURN` instruction is executed. You can string multiple
`<->` and multiple `>> RETURN` instructions together.

### Special terminators

By convention, special terminators are written in all caps. However, special
terminators function correctly regardless of capitalization.

#### » RESTART

The `>> RESTART` terminator:

- Restarts the story or game by executing the start sequence, or `onStart`
function, for all attached extensions
- Resets available choices
- Goes to `@start` scene

This terminator does not clear the variables used within the game, which helps
prevent removal of persistent variables that you want to keep across multiple
sessions of your game. To clear variables, run the `clear *` command.

#### » PAUSE

The `>> PAUSE` terminator:

- Pauses the story by immediately stopping the execution of any remaining instructions
- Executes the pause sequence, or `onSessionEnded` function, for all attached extensions
- If `@pause` scene is defined, plays the content within the scene before pausing

#### » RESUME

The `>> RESUME` terminator resumes the game by going to the scene where the
player last left off.

This terminator controls the `Relaunch` behavior as described in the section
[Control relaunch behavior](../basic-skill-flow-builder-syntax/README.md#control-relaunch-behavior).

#### » REPEAT

The `>> REPEAT` terminator replays the audio artifact that the player just
heard, or would have heard previously.

#### » REPROMPT

The `>> REPROMPT` terminator replays the audio artifact that was used as a reprompt.

#### » BACK

The `>> BACK` terminator goes back to the start of the previous interaction. An
interaction occurs when the skill or Alexa prompts a player to say something to
Alexa, such as "yes" or "no."

The start of the previous interaction may be several scenes away from the
interaction you want to go back to.

If the previous interaction took the player through multiple scenes, the player
is taken back to the first scene when they say "go back."

#### » END

The `>> END` terminator:

- Ends the story or game by ending the session.
- Immediately runs the START sequence, running `onStart` functions for
extensions, and setting the next scene to `@start`.
- The next time player launches the game, takes the player to `@start`.

#### » RETURN

The `>> RETURN` terminator immediately jumps back to the line after the last
`<->` instruction.

## Organizing complex skills

Consider using multiple content files to help better structure and organize the
content for your game. To set up multiple content files (`.abc` files) for your
project, in the `MANIFEST.json` file in your directory add the paths to the
`.abc` files you want to combine. The following shows the structure of the
`MANIFEST.json` file:

```json
{
    "include": [
        "*.abc"
    ]
}
```

## Core extensions

### roll and rollResult

```
*then
    roll 2d6,
    set attack to rollResult,
    -> resolve attack.
```

Use the `roll` instruction to roll dice, and use the `rollResult` to access the
result of the roll. The example rolls two six-sided dice and puts the resulting
total into the variable `rollResult`.

- Roll accepts XdY as input where X and Y are whole numbers. X represents the
number of dice you are rolling, and Y indicates the number of faces on the dice
you are rolling.
- You can add or subtract numbers from the roll by writing something like
`1d6 + 3` or `1d6 - 3`.
- You can roll multiple dice, pick, and then add the highest Z values with a
format `XdYkZ`, X is the number of dice, Y is the number of faces, and Z is the
number of highest values you want to pick. For example, `roll 2d6k1` rolls two
six-sided dice and picks the highest number out of the two rolls.

### time

```
*then
    time
    set timeSinceLast as system_return
    decrease timeSinceLast by lastUpdateTime
    if timeSinceLast >= 300000 {
        -> long time no see
    }
```

The `time` instruction saves the current time into a special system variable
called `system_return`. To use the time in your game, assign it to one of your
own variables using the `set` instruction. The time is in epoch milliseconds,
which is the number of milliseconds that have elapsed since January 1, 1970
(midnight UTC/GMT).

### bgm (background music)

```
*then
    bgm https://url-to-the-background-music.mp3
```

Mix background music for the scene's narration.

Background music only works when mixed with foreground audio or narration using
a custom Amazon Polly voice. You cannot mix music with Alexa's voice. Music
mixing also does not work in preview mode of the editor.

### monetization

```
*then
    buy item='sample product' success='purchase success' fail='purchase failed'
    declined='purchase declined'
    already_purchased='purchased already' error='purchase error'
```

Start the monetization workflow for the in-skill product (ISP) mapped to the
item name in the ISP ID configuration file. The file is located in the path
`resources/ProductISPs.json` of your project directory. Once the purchase flow
finishes successfully, the skill takes the player to the scene defined by
"success", or to `@purchase success` in the example. If the player fails to
purchase fails or cancels the purchase, the skill transitions to the scene
defined by "fail", or to `@purchase failed` in the example.

The parameters `declined`, `already_purchased`, and `error` are optional. If you
do not assign the parameters, the skill takes the player to the scene defined by
the `fail` parameter. To finely control which scenes the skill takes the player
to on each purchase flow, define the parameters.

You can offer refunds by using the `refund` instruction. You can trigger the
refund monetization workflow by using the `refund` instruction. Once the refund
flow finishes successfully, the skill takes the player to the scene defined by
"success", or to `@refund success`. If the refund flow fails or cancels, the
skill transitions to the scene defined by "fail", or to `@refund failed`.

The following example shows how you can trigger the refund monetization workflow.

```
*then
    refund item='sample product' success='refund success' fail='refund failed'
```
