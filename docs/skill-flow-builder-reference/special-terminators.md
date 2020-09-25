# Special terminators

By convention, special terminators are written in all caps. However, special
terminators function correctly regardless of capitalization.

## >> RESTART

The `>> RESTART` terminator:

- Restarts the story or game by executing the start sequence, or `onStart`
function, for all attached extensions
- Resets available choices
- Goes to `@start` scene

This terminator does not clear the variables used within the game, which helps
prevent removal of persistent variables that you want to keep across multiple
sessions of your game. To clear variables, run the `clear *` command.

## >> PAUSE

The `>> PAUSE` terminator:

- Pauses the story by immediately stopping the execution of any remaining instructions
- Executes the pause sequence, or `onSessionEnded` function, for all attached extensions
- If `@pause` scene is defined, plays the content within the scene before pausing

## >> RESUME

The `>> RESUME` terminator resumes the game by going to the scene where the
player last left off.

This terminator controls the `Relaunch` behavior as described in the section
[Control relaunch behavior](../basic-skill-flow-builder-syntax/README.md#control-relaunch-behavior).

## >> REPEAT

The `>> REPEAT` terminator replays the audio artifact that the player just
heard, or would have heard previously.

## >> REPROMPT

The `>> REPROMPT` terminator replays the audio artifact that was used as a reprompt.

## >> BACK

The `>> BACK` terminator goes back to the start of the previous interaction. An
interaction occurs when the skill or Alexa prompts a player to say something to
Alexa, such as "yes" or "no."

The start of the previous interaction may be several scenes away from the
interaction you want to go back to.

If the previous interaction took the player through multiple scenes, the player
is taken back to the first scene when they say "go back."

## >> END

The `>> END` terminator:

- Ends the story or game by ending the session.
- Immediately runs the START sequence, running `onStart` functions for
extensions, and setting the next scene to `@start`.
- The next time player launches the game, takes the player to `@start`.

## >> RETURN

The `>> RETURN` terminator immediately jumps back to the line after the last
`<->` instruction.
