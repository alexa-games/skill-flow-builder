# Skill Flow Builder Skill Library

The Skill Flow Builder Skill Library joins Alexa skill code to the SFB engine.
This package handles incoming requests from Alexa into the skill, delegates any
narrative content related work to the SFB content framework, and then forms an
Alexa response to be handled by ASK. This package also includes any extensions
that enable additional Skill interfaces, such as In-Skill Products and the
Alexa Presentation Language.

Visit [Skill Flow Builder on Github](https://github.com/alexa-games/skill-flow-builder)
for more information.

## Getting Started

### Prerequisites

The following needs to be installed and configured:

```preformatted
Node.js (with npm) # Note: Requires Node.js version >= 10.15.
Yarn
```

### Compiling

```sh
yarn install && yarn compile
```

The compiled code is built into the `dist/` directory. The Skill Flow Builder
Skill Library requires other core modules to be built. To build all the modules
in the `packages/` directory at once, run `yarn build-modules`.

### Testing

```sh
yarn test
```

This will run all unit tests in the `src/test/` directory.

## Package Structure

The SFB Skill Library package structure looks like this, with most of the
library source code existing inside the `src/` directory.

```preformatted
packages/sfb-skill/
└── src/ # SFB Skill Library source code
│   └─── entity/ # Entity interfaces
│   └─── handler/ # Handlers of the different types of incoming requests
│   └─── sfbExtension/ # SFB extensions that providing different functionality
│   └─── test/ # Tests
│   └─── ...
└─── ...
```

## Contributing

The SFB Skill Library provides all the functionality for integrating the SFB
engine with Alexa Skills, including handling requests and sending directives.
You can locally recompile the source code with `yarn compile`, but you will have
to run `yarn build-modules`, in order for your changes to show appropriately in
other modules.
