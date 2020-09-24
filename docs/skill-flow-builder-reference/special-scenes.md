# Special scenes

Special scenes have useful behaviors that differentiate them from other scenes.

## @start

The `@start` scene is required and is where your game begins for a new user or
after a restart.

```
@start
    *say
        Your story is starting. Hold on to your hats.
    *then
        -> setup
```

## @resume

The `@resume` scene plays when a player comes back to the game. You can take the
player back to where they left off by using a `>> RESUME` instruction.

```
@resume
    *say
        Welcome back to the story. Picking up where you left off.
    *then
        >> RESUME
```

## @pause

The `@pause` scene plays before the game pauses because of normal pausing
behavior, or from executing a `>> PAUSE` instruction.

```
@pause
    *say
        Okay, goodbye for now.
```

## @global prepend

The content of `@global prepend` is prepended to every scene within the game.

```
@global prepend
    *say
        Bing!
```

For an example, see [Add visuals to all scenes](../use-skill-flow-builder-to-create-content/add-visual-elements).

## @global append

The content of `@global append` is appended to every scene within the game.

```
@global append
    *then
        hear help {
            -> help message
        }
        hear status, what is my status, tell me my status{
            -> status message
        }
```

For an example, see [Let players restart from anywhere](../basic-skill-flow-builder-syntax/README#let-users-restart-from-anywhere).
