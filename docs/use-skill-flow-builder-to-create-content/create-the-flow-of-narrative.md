# Create the flow of your narrative.

## Create a scene

When a player opens your game for the first time, your skill should respond and
prompt the player. Define the first-time launch behavior by creating a `start`
scene. The following example shows a `start` scene that instructs Alexa to say
"Welcome to my awesome game!"

```
@start
    *say
        Welcome to my awesome game!
```

Every scene starts with the scene name following the at sign (`@`) on a new
line. In the example, the scene name is `start`. Skill Flow Builder reserves a
few scene names such as `start`. Only use these scene names for special
behavior. For more information about reserved scene names, see
[Special scenes in the Skill Flow Builder Reference](../skill-flow-builder-reference/special-scenes.md).

Add content to the scene by using a [scene property](../skill-flow-builder-reference/scene-properties.md)
such as `*say`, which tells Alexa what to say during the scene. Specify the
scene property on a new line with an asterisk (`*`) followed by the property name.

```
*say
    Welcome to my awesome game!
```

The sentence `Welcome to my awesome game!` is the content of the `*say`
property. Content can continue for multiple lines until you define another scene
property with `*`, or another scene with `@`. Indentation is optional. For more
information see [Scene properties in the Skill Flow Builder Reference](../skill-flow-builder-reference/scene-properties.md).

## Give choices to the player

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

In the example, Alexa listens for "I want to be a pirate," "pirate," or "I'll
be a pirate." If Alexa hears any of the phrases from the player, Alexa executes
the instructions listed between `{` and `}`.

If the player says "pirate", Alexa executes `-> choose pirate`, which tells
Alexa to go to the scene "choose pirate". The transition for the `go to`
instruction occurs immediately, and the remaining instructions within the scene
don't execute. For more information see [(go to) in the Skill Flow Builder Reference](../skill-flow-builder-reference/scene-instructions.md#--go-to).

## String multiple scenes together

Sometimes, you might want to transition between scenes without player input.
Consider the following two examples:

### Example 1

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

### Example 2

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
