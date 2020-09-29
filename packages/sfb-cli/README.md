# Skill Flow Builder Command Line Interface (CLI)

This module interacts with the
[Alexa Skills Kit (ASK)](https://developer.amazon.com/en-US/alexa/alexa-skills-kit)
and [AWS CLI](https://github.com/aws/aws-cli) to deploy and update your skill.

Visit [Skill Flow Builder](https://alexa.design/sfb-editor-landing-page) for
more information.

## Installation

### Prerequisites

The following needs to be installed and configured:

```preformatted
Node.js (with npm) # Note: Requires Node.js version >=10.
Yarn
```

### Installing From NPM

```sh
npm install @alexa-games/sfb-cli
```

### Compiling

```sh
yarn install && yarn compile
```

The compiled code is built into the `dist/` directory.

### Testing

```sh
yarn test
```

This will run all unit tests in the `test/` directory.

### Installing CLI with local repository

Install sfb-cli globally using `yarn`
(you must use yarn):

```sh
yarn global add /full/path/to/AlexaGamesSkillFlowBuilder/packages/sfb-cli
```

The resulting `alexa-sfb` binary is built into the `dist/bin/` directory.

## Usage

### Options

- `--help`
  - Output tutorial output for a specific command
- `-V, --version`
  - Outputs the version number
- `-v, --verbose`
  - Increase verbose output

### Commands

#### `new <story> [-t <templateName>]`

- Creates a new story given a story name
- `<story>` Path to the new story
- `-t [templateName]` Template to create a new story from. (`example_story`, `tutorial`, `adventure`,`quiz`)

#### `deploy <story> [-o, --override] [-s, --stage <stageName>] [-l, --locale <localeName>] [-d, --deployer <deployerName>]`

- Deploys your story to the Alexa Developer Portal & AWS by running `ask deploy` after building on the deployment payload
- `<story>` Path to the story to deploy
- `-o, --override` Overrides the version check
- `-s, --stage <stageName>` Stage to deploy (i.e. dev, test, beta, prod)
- `-l, --locale <localeName>` Locale to deploy (i.e. en-us, en-gb, fr-fr, etc.)
- `-d, --deployer <deployerName>` ASK deployer to use (cfn or lambda).
Cannot be changed after deploying your skill. Default is cfn

#### `deploy-metadata <story> [-o, --override] [-s, --stage <stageName>] [-g, --skill-stage <stageName>] [-l, --locale <localeName>] [-d, --deployer <deployerName>]`

- Deploys your skill metadata to the Alexa Developer Portal
- `<story>` Path to the story to deploy the metadata of
- `-o, --override` Overrides the version check
- `-s, --stage <stageName>` Stage to deploy (i.e. dev, test, beta, prod)
- `-g, --skill-stage <stageName>` The stage of a skill to deploy. (`development`, `certified`,` live`). Defaults to `development`
- `-l, --locale <localeName>` Locale to deploy (i.e. en-us, en-gb, fr-fr, etc.)
- `-d, --deployer <deployerName>` ASK deployer to use (cfn or lambda).
Cannot be changed after deploying your skill. Default is cfn

#### `deploy-via-zip <story> [-o, --override] [-s, --stage <stageName>] [-g, --skill-stage <stageName>] [-l, --locale <localeName>] [-d, --deployer <deployerName>]`

- Build and deploy skill using a zip file transfer to S3/Lambda.
- Used for slow remote connections or when exceeding the command line 69905067 byte limit.
- `-o, --override` Overrides the version check
- `-s, --stage <stageName>` Stage to deploy (i.e. dev, test, beta, prod)
- `-g, --skill-stage <stageName>` The stage of a skill to deploy. (`development`, `certified`,` live`). Defaults to `development`
- `-l, --locale <localeName>` Locale to deploy (i.e. en-us, en-gb, fr-fr, etc.)
- `-d, --deployer <deployerName>` ASK deployer to use (cfn or lambda).
Cannot be changed after deploying your skill. Default is cfn

#### `build <story> [-o, --override] [-s, --stage <stageName>] [-l, --locale <localeName>] [-d, --deployer <deployerName>]`

- Builds a story without deploying.
- The Build Life Cycle
  - Code Build: Install dependencies and run compile script for `code` directory.
  - Pre-Import: Run `extendSourceContent()` on content source (included *abc files) for the attached ImporterExtension.
  - Import: Translate *.abc story content into StoryMetadata object.
  - Post-Import: Run extendImportedContent on resulting StoryMetadata for all attached ImporterExtension, and write the result to baked/en-US(or relevant locales)/baked_story.json.
  - Staging: Generate .deploy and create a deployment payload with `ask new` command, then copy built code, imported story, and assets from content/{locale}/resources to the resulting deployment payload directory. If metadata exists copy skill.json and ask_config from the metadata directory for appropriate stages.
- `<story>` Path to the story to build
- `-o, --override` Overrides the version check
- `-s, --stage <stageName>` Stage to build (i.e. dev, test, beta, prod)
- `-l, --locale <localeName>` Locale to build (i.e. en-us, en-gb, fr-fr, etc.)
- `-d, --deployer <deployerName>` ASK deployer to use (cfn or lambda).
Cannot be changed after deploying your skill. Default is cfn

#### `simulate <story> [-o, --override] [-s, --stage <stageName>] [-l, --locale <localeName>] [-q, --quiet]`

- Simulate the story locally
- `<story>` Path to the story to simulate
- `-l, --locale <localeName>` Locale to simulate (i.e. en-us, en-gb, fr-fr, etc.)
- `-o, --override` Overrides the version check
- `-q, --quiet` Quiet mode

#### `clean <story>`

- Clean out the `.deploy/`, `code/dist/` folder, and any extra `node_modules/` folders for the given story. Run clean when initially creating a new stage/locale to force the creation of a new skill id.
- `<story>` Path to the story to clean

#### `upload <story>`

- Uploads public resources to Amazon S3
- `<story>` Path to story to upload resources from

#### `vscode`

- Downloads and installs the Visual Studio Code extension for SFB editor support

## Contributing

This module uses the [`commander` package](https://www.npmjs.com/package/commander)
to handle command line interaction. The general flow for all the commands are
in the files `sfb.ts` and `commandFactory.ts`. Each command is then separated
into their own files (ex: `deployCommand.ts`, `testCommand.ts`, ...). New
commands should follow the same flow as existing ones. For example, a new
command `alexa-sfb wave` would require the following changes:

`sfb.ts`:

```typescript
cmd
  .command('wave')
  .description('Just smile and wave...')
  .option('-s, --smile' ,'Smile while waving')
  .action(async (name: string, options: any) => {
    await Utilities.wrap(cmd.verbose, async () => {
      const smile = !!options.smile;
      await commandFactory.buildWaveCommand(name, { smile }).run();
    }, consoleLogger);
  })
...
```

`commandFactory.ts`:

```typescript
import { WaveCommand } from './waveCommand';
...
export interface WaveOptions {
  smile: boolean;
}
...
public buildWaveCommand(storyPath: string, options: WaveOptions): Command {
  return new WaveCommand(storyPath, options.smile, this.logger, this.stdOutput);
}
```

`waveCommand.ts`:

```typescript
import { Command } from './command';
import { Logger } from './logger';
import { StdOutput } from './stdOutput';
...
export class WaveCommand implements Command {
  constructor(
    private readonly logger: Logger,
    private readonly smile: boolean,
    private readonly stdOutput: StdOutput) {
  }
  public async run() {
    this.logger.status('Waving...');
    if (this.smile) {
      this.logger.status('Smiling as well...');
    }
  }
}
```
