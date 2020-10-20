# Skill Flow Builder Content Framework

The Skill Flow Builder Content Framework contains the core collection of utility
and driver functionalities that powers the Editor and the CLI. It handles the
interpretation of SFB’s domain-specific language into a narrative structure,
i.e., importing, validating, and creating interactive story skills for Alexa.

Visit [Skill Flow Builder on Github](https://github.com/alexa-games/skill-flow-builder)
for more information.

## Getting Started

### Prerequisites

The following needs to be installed and configured:

```preformat
Node.js (with npm) # Note: Requires Node.js version >= 10.15.
Yarn
```

### Compiling

```sh
yarn install && yarn compile
```

The compiled code is built into the `dist/` directory. The Skill Flow Builder
Framework requires other core modules to be built. To build all the modules in
the `packages/` directory at once, run `yarn build-modules`.

### Testing

```sh
yarn test
```

This will run all unit tests in the `test/` directory.

## Package Structure

The SFB Framework package structure looks like this.

```preformatted
packages/sfb-f/
└── bakeUtilities/ # Schemas for Intents & Interaction Models
└── driver/ # Drvers for Audio and Scene responses
└── exportHandlers/ # Exporters of SFB project files
└── extensions/ # Extensions to modify the incoming/outgoing content
└── importer/ # Importers for SFB project files
└── importPlugins/ # Plugins that help with importing
└── story/ # SFB story methods
└── test/ # Tests
└── transformers/ # Transforms segments for use in SFB
└── verificationHandlers/ # Verifies integrity of SFB project files
└─── ...
```

## Build Life Cycle

The following is a lifecycle for Skill Flow Builder project when the build
process is executed by running `alexa-sfb build`, and is executed as part of the
deploy process when using `alexa-sfb deploy`.

1. **Code Build**: Install dependencies and run compile script for `code/` directory.
2. **Pre-Import**: Run `extendSourceContent()` on content source
(included `*.abc` files) for the attached `ImporterExtensions`.
3. **Post-Import**: Run `extendImportedContent()` on the resulting
`StoryMetadata` for all attached ImporterExtensions, and write the result to `baked/{locale}/baked_story.json`.
4. **Staging**: Generate a deployment payload in `.deploy/` with the
`ask new command`, then copy the built code, the imported story, and assets from
`content/{locale}/resources` to the resulting deployment payload directory.
If metadata exists copy `skill.json` and `ask_config` from the metadata
directory for appropriate stages.
5. **Deploy** (if you are running `alexa-sfb deploy`): Run `ask deploy` on the
deployment payload.

## Skill Runtime Life Cycle

The following steps show the runtime life cycle when requests come in to your
Skill Flow Builder deployed skill's lambda.

1. **ASK SDK pre-request handler**: The request and event object are enveloped
by ASK SDK, and persistent skill state is retrieved with attached [PersistenceAdapter](https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-nodejs/manage-attributes.html#persistenceadapter).
2. **Skill Flow Builder Request Handler**: ASK SDK's [HandlerInput](https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-nodejs/handle-requests.html#handler-input)
is passed to `SFBRequestHandler` for processing, then the handler calls
`SFBDriver` with current skill state and incoming request.
3. **Skill Flow Builder Driver Pre Run**: Run `pre()` for all attached
instances of `DriverExtension`. Default `DriverExtension` like `AlexaExtension`
would parse the request in to `UserInput` object at this step.
4. **Skill Flow Builder Driver Run**: The core logic for taking the incoming
user input, `StoryMetadata`, and current skill state, is executed at this step
along with running custom instructions defined in attached `InstructionExtension`.
5. **Skill Flow Builder Driver Post Run**: Run `post()` for all attached
instances of `DriverExtension`. Default `DriverExtension` like `AlexaExtension`
would generate an Alexa skill response given the post run state at this step.

## Contributing

The SFB Framework module contains the core logic for Skill Flow Builder’s
engine, which is utilized by both the Alexa Skill runtime and the Skill Flow
Builder editor. You can locally recompile the source code with `yarn compile`,
but you will have to run `yarn build-modules`, in order for your changes to show
appropriately in other modules.
