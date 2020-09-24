# Add visuals elements

Add Alexa Presentation Language (APL) to your skill by using the `*show`
property to define the visual elements for your scene.

```
@My Showy Scene
    *say
        Let's go on a hike.
    *show
        template: 'default'
        background:'https://www.example.com/url/to/image.jpg'
        title: 'SFB Framework'
        subtitle: 'Start of the hike'
    *then
        -> startHike
```

The example defines the following visual elements:

- `template` to use the APL template in your project that you named "default"
- `background` to be the specified image.
- `title` to be 'SFB Framework'.
- `subtitle` to be 'Start of the hike'.

For the example story included with the Skill Flow Builder, the file
`content/en-us/example_story/resources/apl-templates.json` defines the APL
templates for the story. The example `apl-templates.json` file defines the
"default" template under a `"default"` key.

The APL templates define the structure of the visual interface. For each APL
template, to expose components so that you can pass in content using the `*show`
section in your scene, in the `apl-templates.json` file, specify the components
as `datasources`. The following example shows an implementation of `datasources`.

```json
{
    "default": {
        ...
        "datasources": {
            "visualProperties": {
                "background": "https://www.example.com/url/to/image.jpg",
                "title": "",
                "subtitle": ""
            }
        }
    }
}
```

For each component, specify `""` if there is no default value for the component,
or specify a default value surrounded by double quotes (`"`).

For more information about creating your own APL templates, see
[Alexa Presentation Language](https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/understand-apl.html).

## Add visual elements to all scenes

To add a screen that shows by default unless overridden by the specific scene,
add a `*show` property to the `@global prepend` scene as shown in the following example.

```
// add visuals to every scene
@global prepend
    *show
        template: 'default'
        background:'https://www.example.com/url/to/image.jpg'
        title: 'SFB Framework'
        subtitle: ''
    *then
        // listen for "start over" everywhere
        hear start over {
            // Go back to the start
            -> start
        }
```

The example adds a global `start over` command to all scenes that takes the
player back to the start when they say "start over".

The `@global prepend` is similar to `@global append` used in the sections
[Let players restart from anywhere](../basic-skill-flow-builder-syntax/README#let-users-restart-from-anywhere)
and [Add a help menu in Basic Skill Flow Builder Syntax](../basic-skill-flow-builder-syntax/README#add-a-help-menu).
The `@global prepend` and `@global append` are similar because you use them in
all other scenes, but you apply them differently in each scene. You would use
@global prepend before a scene. You would use `@global append` after a scene.
