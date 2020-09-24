# Scene properties

In the Skill Flow Builder, scenes are the basic building blocks. Scenes contain
various types of content and can be connected in any way you want to create your
story or game.

The following shows the structure of a scene:

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

The scene name identifies the scene. The scene name:

- Must start with `@`
- Can be any number of letters, numbers, and spaces
- Must be unique within your story
- Must be contained within the line

Some scene names are reserved for special purposes. For more information, see
[special scenes](./special-scenes).

## *say

When the scene plays, Alexa reads aloud to the user the content defined within
the `*say` property. The `*say` property:

- Is optional
- Can be multiple lines
- Can use SSML
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

### *show

If the player is on a device that supports visual content, the device displays
the visual components assigned within this section. See [Add visuals](../use-skill-flow-builder-to-create-content/add-visual-elements).

### *then

The `*then` property provides a list of scene instructions, which are commands
that are executed in order after Alexa plays the content for the scene.
