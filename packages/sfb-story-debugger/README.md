# Skill Flow Builder Story Debugger

> **Warning**
> **DEPRECATED** The Alexa Games team will no longer support or maintain this official distribution of Skill Flow Builder. Thank you to all the folks who have used SFB to make great Alexa skills over the years!


The Skill Flow Builder Story Debugger. This module enables you to simulate your
project’s behavior through the command line by running the SFB content locally,
rather than calling a deployed skill over the network.

Visit [Skill Flow Builder on Github](https://github.com/alexa-games/skill-flow-builder)
for more information.

## Getting Started

### Prerequisites

The following needs to be installed and configured:

```preformatted
Node.js (with npm) # Note: Requires Node.js version >= 10.15.
Yarn
```

This module can be interacted through the `sfb-cli/` package. If
you have the `sfb-cli/` globally installed, you can then run
`alexa-sfb simulate <storyName>` to interact with the debugger. If you do not
have the `sfb-cli/` already installed, please refer to the
[sfb-cli installation process](../packages/sfb-cli) to get started.

### Compiling

```sh
yarn install && yarn compile
```

The compiled code is built into the `dist/` directory. This package requires
other core modules to be built. To build all the modules in the `packages/`
directory at once, run `yarn build-modules`.

### Testing

```sh
yarn test
```

This will run all unit tests in the `test/` directory.

## Package Structure

The SFB Story Debugger package structure looks like this.

```preformatted
packages/sfb-story-debugger/
└── test/ # Tests
└── index.ts # Logic for the simulator
└── ...
```

## Contributing

The SFB Story Debugger enables you to test your story without deploying through
the `alexa-sfb` command line tool’s simulate command. You can locally recompile
the source code with `yarn compile`, but you will have to run `yarn build-modules`
in order for your changes to show appropriately in other modules.

Two functions of note are `run` and `runCommand`. `run` is the entry point for
launching the SFB story debugger, while `runCommand` handles the different
commands being called in the story debugger. For example, the handling of
different commands in `runCommand` looks like:

```typescript
let command: string = commandMatch[1].toLowerCase();

switch(commandMatch):
    case "relaunch":
        ...
    case "get":
        ...
    case "set":
        ...
```

Adding new commands would involve setting a new case statement, as well as
including any needed code along with it.
