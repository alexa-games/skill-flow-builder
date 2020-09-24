# Skill Flow Builder Life Cycle

The Skill Flow Builder life cycle consists of the build life cycle and the skill
run-time life cycle.

## Build Life Cycle

The following is a lifecycle for Skill Flow Builder project when the build
process is executed by running `alexa-sfb build`.

1. Code Build: Install dependencies and run compile script for `code/` directory.
2. Pre-Import: Run `extendSourceContent()` on content source (included `*abc`
files) for the attached `ImporterExtension`.
3. Import: Translate `*.abc` story content into `StoryMetadata` object.
4. Post-Import: Run `extendImportedContent()` on resulting `StoryMetadata` for
all attached `ImporterExtension`s, and write the result to
`baked/en-US(or relevant locales)/baked_story.json`.
5. Staging: Generate `.deploy/` and create a deployment payload with `ask new`
command, then copy built code, imported story, and assets from
`content/{locale}/resources` to the resulting deployment payload directory. If
metadata exists copy `skill.json`, `ask-states.json`, and `ask-resources.json`
from the `metadata/` directory for appropriate stages.
6. Deploy (if you are running `alexa-sfb deploy` command): Run `ask deploy` on
the deployment payload.

## Skill Runtime Life Cycle

The following steps show the runtime life cycle when requests come in to your
Skill Flow Builder skill's lambda.

1. ASK SDK pre-request handler: The request and event object are enveloped by
ASK SDK, and persistent skill state is retrieved with attached
[PersistenceAdapter](https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-nodejs/manage-attributes.html#persistenceadapter).
2. Skill Flow Builder Request Handler: ASK SDK's
[HandlerInput](https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-nodejs/handle-requests.html#handler-input)
is passed to `SFBRequestHandler` for processing, then the handler calls
`SFBDriver` with current skill state and incoming request.
3. Skill Flow Builder Driver Pre Run: Run `pre()` for all attached instances of
`DriverExtension`. Default `DriverExtension` like `AlexaExtension` would parse
the request in to `UserInput` object at this step.
4. Skill Flow Builder Driver Run: The core logic for taking the incoming user
input, `StoryMetadata`, and current skill state, is executed at this step along
with running custom instructions defined in attached `InstructionExtension`.
5. Skill Flow Builder Driver Post Run: Run `post()` for all attached instances
of `DriverExtension`. Default `DriverExtension` like `AlexaExtension` would
generate an Alexa skill response given the post run state at this step.
