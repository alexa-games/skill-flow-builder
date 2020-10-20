# Skill Flow Builder Polly Integration

The Skill Flow Builder Polly Integration. Enables Text To Speech in different
voices & languages with [Amazon Polly](https://aws.amazon.com/polly/) in both
the SFB editor, and Skill Flow Builder built skills. Handles the making of
calls out to Polly, the caching the audio files with S3, and the mixing of the
audio responses using FFmpeg.

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
Polly integration requires other core modules to be built. To build all the
modules in the `packages/` directory at once, run `yarn build-modules`.

### Testing

```sh
yarn test
```

This will run all unit tests in the `test/` directory.

## Package Structure

The SFB Polly Integration package structure looks like this.

```preformatted
packages/sfb-polly/
└── audioAccessor/ # Loaders for audio files
└── test/ # Tests
└── audioMixer.ts # Mixer to concat and interleave audio files
└── pollyUtil.ts # Polly client to load audio from text
└─── ...
```

## Contributing

The SFB Polly Integration interacts with the [AWS Polly service](https://aws.amazon.com/polly/)
to generate speech from text, and helps with loading it’s audio locally and
remotely. You can locally recompile the source code with `yarn compile`, but you
will have to run `yarn build-modules`, in order for your changes to show
appropriately in other modules.
