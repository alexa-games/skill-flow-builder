# Core extensions

## roll and rollResult

```
*then
    roll 2d6,
    set attack to rollResult
    -> resolve attack
```

Use the `roll` instruction to roll dice, and use the `rollResult` to access the
result of the roll. The example rolls two six-sided dice and puts the resulting
total into the variable `rollResult`.

- Roll accepts `XdY` as input where `X` and `Y` are whole numbers. `X`
represents the number of dice you are rolling, and `Y` indicates the number of
face on the dice you are rolling.
- You can add or subtract numbers from the roll by writing something like
`1d6 + 3` or `1d6 - 3`.
- You can roll multiple dice and pick and add the highest Z values with a format
`XdYkZ`, where `X` is the number of dice, `Y` is the number of faces, and `Z`
is the number of highest values you want to pick. For example, `roll 2d6k1`
rolls two six-sided dice and picks the highest number out of the two rolls.

## time

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

## bgm (background music)

```
*then
    bgm https://url-to-the-background-music.mp3
```

Mix background music for the scene's narration.

Background music only works when mixed with foreground audio or narration using
a custom Amazon Polly voice. You cannot mix music with Alexa's voice. Music
mixing also does not work in preview mode of the editor.

## monetization

```
*then
    buy item='sample product' success='purchase success' fail='purchase failed'
    declined='purchase declined'
    already_purchased='purchased already' error='purchase error'
```

Start the monetization workflow for the in-skill product (ISP) mapped to the
item name in the ISP ID config file located in the path
`resources/ProductISPs.json` of your project directory. Once the purchase flow
finishes successfully, the player is taken to the scene defined by "success", or
to `@purchase success` in the example. If the purchase fails or is cancelled, it
transitions to the scene defined by "fail", or to `@purchase failed` in the example.

The parameters `declined`, `already_purchase`d, and `error` are optional. If you
do not assign the parameters, the player is taken to the scene defined by the
`fail` parameter. To finely control which scenes the player is taken to on each
purchase flow, define the parameters.

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
