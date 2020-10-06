# Skill Flow Builder

<p align="center">
    <a href="https://travis-ci.com/alexa-games/skill-flow-builder/"><img src="https://travis-ci.com/alexa-games/skill-flow-builder.svg?token=PX13NfYowpbqCaNHTcBg&branch=master"></a>
    <a href="https://github.com/alexa-games/skill-flow-builder/actions"><img src="https://github.com/alexa-games/skill-flow-builder/workflows/Tests%20on%20Windows/badge.svg"/></a>
    <a href="https://www.npmjs.com/package/@alexa-games/sfb-cli"><img src="https://img.shields.io/npm/v/@alexa-games/sfb-cli.svg"/></a>
</p>

Alexa’s Skill Flow Builder is a development suite that helps you create
narrative-driven Alexa skills more quickly using a simple language that can model
any narrative structure. It includes the [Skill Flow Builder Editor](packages/sfb-editor/)
application for designers and writers, and a [Visual Studio Code extension](packages/sfb-vscode-extension/)
for developers. Designers and writers can quickly prototype and modify content.
In parallel, developers can build differentiated features and minimize time spent
on content changes. The tools share a common source file format, which helps make
handoffs between teams more efficient.

## Skill Flow Builder Editor

Using the Skill Flow Builder Editor, designers and writers can visualize their
story using the built-in story tree/map view. Skill Flow Builder structures the
narrative as a series of connected scenes, which you can navigate with the click
of a button. Without involving a development team, you can write or update the
narrative, add visuals and sound effects, and implement game logic. You can also
assign Amazon Polly voices to specific characters, add images, and add
background audio.

Use the built-in simulator to preview, demo, and test your content. When
finished, export and share a Skill Flow Builder format (.abc) file with your
development team, or export text for narration or localization.

For more information, see
[Use the Skill Flow Builder Editor](docs/use-the-skill-flow-builder-editor/README.md)

## Skill Flow Builder Core Tools

For developers, Skill Flow Builder offers a command line interface, content
debugger, integration with existing developer tools, and extension support. With
Skill Flow Builder, you can use tools like the Alexa Skills Kit SDKs, ASK Command
Line Interface (ASK CLI), and the AWS CLI. Skill Flow Builder integrates with
extensions for Alexa Presentation Language (APL) templates and in-skill
purchasing, which saves you implementation time.

When you receive a new Skill Flow Builder format (.abc) file from designers and
writers, you can deploy and validate the content as a skill before touching the
code. You can also implement business logic directly in the .abc file by using
the built-in scripting ability called scene instructions.

The content debugger helps isolate debugging process from the content. You can
view variables used, save state for later testing, and view content execution steps.

See a more detailed view of the structure of typical SFB [project](docs/set-up-skill-flow-builder-as-a-developer/project-structure).

For more information, see
[Set up Skill Flow Builder as a Developer](docs/set-up-skill-flow-builder-as-a-developer/README.md)

## Packages

The following packages are in this repository.

[@sfb-f](packages/sfb-f)

The Skill Flow Builder Content Framework. This module contains the core
collection of utility and driver functionalities that powers the Editor and the
CLI. It also enables and aids importing and creating interactive story skills
for Alexa.

[@sfb-editor](packages/sfb-editor)

The Skill Flow Builder Editor. Contains a native desktop client built with
Electron, an application in which designers and writers can visualize, create,
and review their SFB project story.

[@sfb-cli](packages/sfb-cli)

The Skill Flow Builder CLI. Adds build, validation, and deploy command line
tooling for Skill Flow Builder stories. Installing this globally installs the
alexa-sfb command line tool.

[@sfb-skill](packages/sfb-skill)

The Skill Flow Builder Skill Library. The module that joins Alexa skill code to
the SFB engine.

[@sfb-polly](packages/sfb-polly)

The Skill Flow Builder Polly integration. Enables Text To Speech in different
voices & languages with [Amazon Polly](https://aws.amazon.com/polly/)

[@sfb-util](packages/sfb-util)

The Skill Flow Builder Utility Library. Contains various Alexa/SFB utility functions.

[@sfb-story-debugger](packages/sfb-story-debugger)

The Skill Flow Builder Debugger. Enables you to simulate your project’s behavior
locally without deploying.

[@sfb-vscode-extension](packages/sfb-vscode-extension)

The Skill Flow Builder Visual Studio Code Extension.  An extension for Skill
Flow Builder projects that provides syntax highlighting for Skill Flow Builder
project files.

## Developer Setup

### Prerequisites

* Install [Node.js (with npm)](https://nodejs.org/en/download/) version 10.15 or later.
* Install the latest version of the [Amazon Web Services Command Line Interface (AWS CLI)](https://aws.amazon.com/cli/).
* Install the latest version of the [Alexa Skills Kit Command Line Interface (ASK CLI)](https://www.npmjs.com/package/ask-cli)
* (Windows only) Install the latest version of the [windows-build-tools module](https://www.npmjs.com/package/windows-build-tools).

### Environment Setup

#### Install Dependencies

This package uses yarn to manage dependencies, you can install yarn globally with

```sh
npm install yarn -g.
```

#### FFmpeg & LAME

To enable the audio mixing features of SFB, we recommend installing
[FFmpeg](https://ffmpeg.org/) and [LAME](https://lame.sourceforge.io/).
FFmpeg is called as a stand-alone application in the editor to mix audio when
using the Voice Preview functionality, as well as in the Lambda endpoint to mix
audio to return in Alexa Skill responses. LAME is utilized to perform MP3
encoding for the mixed audio.

Scripts to build and install both LAME and FFmpeg are available in the `scripts/setup/`
directory, and you can run the following command to build them in the root directory:

```sh
yarn dependencies:OPERATING_SYSTEM
```

Where `OPERATING_SYSTEM` is the operating system you wish to build for:

* linux
* mac
* win

For example:

```sh
yarn dependencies:mac
```

> **Note:** For Windows, the script is designed to be used with
> [Msys2](https://www.msys2.org/) while running the MINGW64 shell.
> It can be difficult to install Node.js under Msys2, so unless you are already
> working in Msys2 with Node.js, we suggest running
> `scripts/setup/InstallDependenciesWin.sh` directly.

Additional information on how to build and install FFmpeg with LAME can be found
in the [FFmpeg Compilation Guide](https://trac.ffmpeg.org/wiki/CompilationGuide).

### Quick Start

To get everything up and running, first clone and navigate into this repository with:

```sh
git clone https://github.com/alexa-games/skill-flow-builder.git && cd skill-flow-builder/
```

To build all the modules in the `packages/` directory, use `yarn build-modules`

Tests are run as part of the build process. You can run the full test coverage
report by running `yarn coverage`. Tests can also be run locally inside any
package directory, (i.e. `packages/sfb-cli`) with `yarn test`.

Cleaning is also available through `yarn clean`

### Installing the CLI

Install [sfb-cli](packages/sfb-cli) globally using yarn:

```sh
yarn global add @alexa-games/sfb-cli
```

To link the CLI from a local install, use:

```sh
yarn global add /full/path/to/AlexaGamesSkillFlowBuilder/packages/sfb-cli
```

Yarn is required here, else the packages may not be linked correctly. Assuming
the packages installed correctly, you should be able to use the `alexa-sfb`
command to interact with the SFB CLI. For example, to create a new story use:

```sh
alexa-sfb new <storyName>
```

### Start the Editor

After running `yarn build-modules`, you can start the editor by running:

```sh
yarn editor
```

This will launch the SFB editor, which will visualize your skill’s behavior and
content. You can create a new project, or open an existing project using the
buttons on the top left.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the Amazon Software License.
