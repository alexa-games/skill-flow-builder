# Create a custom extension

Similar to the [Skill Flow Builder Life Cycle](./life-cycle), there are a few
opportunities to extend the functionality of your Skill Flow Builder project by
building custom extensions. While you create your content, you might need to
create a custom command to run your own code during a particular scene, or you
might want to run an analytical script before or after every request.

You can implement one of the three extensions interfaces from the `sfb-f` module
to customize and add features and functionalities to your Skill Flow Builder
built skill. The three extensions are:

1. `ImporterExtension` - Applied before or/and after importing a source content
as a `StoryMetadata`.
2. `DriverExtension` - Applied before or/and after the request has been applied
for the story run.
3. `InstructionExtension` - Applied during the story run to handle custom
instructions within the content.

## ImporterExtension

Import this interface from `@alexa-games/sfb-f` module to implement. The
following example shows the usage of `ImporterExtension`.

```typescript
interface ImporterExtension {
    extendSourceContent(sourceHelper: SourceContentHelper): Promise<void>;

    extendImportedContent(metadataHelper: StoryMetadataHelper): Promise<void>;
}
```

### Details

- Implement `ImporterExtension` is used to add custom logic for the content
import step.
- `extendSourceContent` is invoked right before the raw text of the source file
is imported as a `StoryMetadata`.
- `extendImportedContent` is invoked after the importing is finished. Typically,
it's implemented to modify some components of the resulting `StoryMetadata`.

## DriverExtension

Import this interface from `@alexa-games/sfb-f` module to implement. The
following example shows the interface.

```typescript
interface DriverExtension {
    pre(param: DriverExtensionParameter): Promise<void>;

    post(param: DriverExtensionParameter): Promise<void>;
}
```

### Details

- Implement `DriverExtension` is used to add custom logic for before and/or
after driver execution.
- `pre` is invoked before the driver runs. Typically, it is implemented to
customize the request parsing logic before the driver runs.
- `post` is invoked after the driver runs. Typically, it is implemented to
customize the response construction logic.

## InstructionExtension

To use `InstructionExtension`, import this interface from the
`@alexa-games/sfb-f` module. The following example shows the
`InstructionExtension` interface.

```typescript
interface InstructionExtension {
}
```

You can also implement the `InstructionExtension` interface to add custom
instructions for your content writers. For example, you can add a new
instruction called `setupForCombat`, where all of the variables required for a
combat are set.

The following example shows what that extension class might look like.

```typescript
import { InstructionExtension, InstructionExtensionParameter } from '@alexa-games/sfb-f';

export class CombatInstructionExtension implements InstructionExtension {
    async public setupForCombat(param: InstructionExtensionParameter): Promise<void> {
        param.storyState.health = 100;
        param.storyState.energy = 0;
        param.storyState.enemyHealth = 100;
        param.storyState.enemyEnergy = 100;
    }
}
```

After you build your project with this extension, whenever you use the
instruction `setupForCombat` the method of the same name in your extensions is invoked.

The following example shows what your `.abc` file might look like.

```
@start combat
    *say
        rawr starting combat
    *then
        setupForCombat // your custom instruction will run when the story reaches here.
        -> next turn in combat
```

You might need to pass in parameters from your story to the extension. The
following example shows how you can pass in parameters.

```
    ...
    setupForCombat person='player' map='garage'
    ...
```

When this instruction is executed by Skill Flow Builder, the framework creates
a key, and a value pair map using the left-hand side of the equal sign (`=`) as
the key and the right-hand side as the value as seen in the following example.

```json
{
    "person": "player",
    "map": "garage"
}
```

You can access the parameters from your code by using the instance of
`InstructionExtensionParameter`. The following example shows how your file might
look if you use `InstructionExtensionParameter`.

```typescript
async public setupForCombat(param: InstructionExtensionParameter): Promise<void> {
    // the value should be "player" for this example.
    const person = param.instructionParameters.person;

    // the value should be "garage" for this example.
    const map = param.instructionParameters.map;
}
```

You can return values by injecting variables into the story state object. The
story state object is a key-value pair mapping of variables assigned and used
within the story. The following example shows an implementation of the extension.

```typescript
async public doSomething(param: InstructionExtensionParameter): Promise<void> {
    param.storyState.result = "win"
}
```

The variable named `result` will be assigned with the value "win". The following
example shows the return value of custom instruction `doSomething`.

```
@result routing
    *then
        doSomething
        if result == 'win' {
            -> win scene
        }

        -> lose scene
```

## Common objects

Most of the parameter objects passed as an argument to different extensions
include two common objects, `storyState` and `driver`.

The `storyState` is the user state of your skill. It is the key-value pair map
representing the variables used in the story. You can inject variables or read
variables to change the state of your skill. This state is saved and loaded
using the `PersistenceAdapter` on every request for the requesting user. Some
of the variables in the story state are used by Skill Flow Builder logic. You
can access and manipulate some of the system level state variables by using
the `StoryStateHelper` utility class. You can import the utility class from the
`@alexa-games/sfb-f` module.

The `driver` object is an instance of the `SFBDriver` that is processing the
story for the current request. The object has some helpful functions for
properties that you can read to perform complex logic.

## Add an extension to your project

1. Open `code/extensions/ExtensionLoader.ts`. If this is an unmodified project,
you should see four extensions already added within the class constructor.

```typescript
constructor(param: ExtensionLoaderParameter) {
    this.registeredExtensions = [
        // Alexa SFB extensions
        new AlexaExtension(),
        new AlexaAPLExtension(param.locale, param.configAccessor),
        new AlexaMonetizationExtension(param.locale, param.configAccessor),

        // sample custom extension
        new SampleCustomExtension()
    ];
}
```

2. To add your extension, add an instance of your extension as an item within
this previous list of extensions.
