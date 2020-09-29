# Skill Flow Builder CLI reference

The `alexa-sfb` CLI provides several operations that you can use to deploy your
skill and upload your skill's resources. Use the following pattern to execute
options and commands: `alexa-sfb [options] [command]`. The following table shows
the CLI options and commands, and the corresponding tasks you can perform.

| Options and Commands| Tasks|
| ------------- |:-------------:|
|`-V, -version`| This option will output the version number.|
|`-v, -verbose`|This option will Increase verbose output.|
|`-h, -help`|This option outputs usage information.|
|[`new`](#new-command)|Path to a new story. Use this command to create a new story project from a template.|
|[`deploy`](#deploy-command)|Path to a story. You can build and deploy a story to the developer portal and AWS Lambda.|
|[`deploy-metadata`](#deploy-metadata-command)|Path to a story. You can build and deploy updated metadata (skill manifest and voice model), but can’t deploy to AWS Lambda. This option is useful when the Lambda function code is large or when you upload the Lambda function through an S3 zip file linked to S3.|
|[`deploy-via-zip`](#deploy-via-zip-command)|Path to a story. You can build and deploy a skill using a zip-file transfer to S3 and AWS Lambda. Use this option when you are on a slow remote connection (you upload to S3, which is faster than the `aws update-function` command) or when you exceed the command-line 69905067 byte limit.|
|[`build`](#build-command)|Path to a story. You can build a story without deploying.|
|[`simulate`](#simulate-command)|Path to a story. Use this command to simulate a story.|
|[`clean`](#clean-command)|Use this command to clean out the `.deploy/`, the code `dist/` folder, and any extra `node_modules/` folders for the given story. Run this command when you initially create a new stage or locale to force the creation of a new skill ID.|
|[`upload`](#upload-command)|Path to a story. Upload public resources to S3.|
|[`vscode`](#vscode-command)|Install the VS Code extension for Skill Flow Builder editor support.|

## new command

The `new` command creates a new local directory containing a fresh Skill Flow
Builder project. You can specify which starter template you would like to use by
specifying the `--template` option. You can then open this project folder in the
Skill Flow Builder Editor or edit with VSCode or any text editor, and then deploy
by using the command line.

To create a new project named "MyAdventure" using the `adventure` template, run
the following command.

`alexa-sfb new --template adventure MyAdventure`

### Usage of the command

- `new [options] <path_to_new_story>` - You can use this command to create a new story project from a template.

### Options for the command

- `-t, --template [templateName]` - The template name to use for new skill. The options are `example_story`, `tutorial`, `adventure`, and `quiz`.
- `-h, --help` - This will output usage information.

## deploy command

To deploy your Skill Flow Builder skill, use one of the `deploy` commands. The
standard deploy command takes a story root folder as its main parameter. If you
run the command from inside your story root folder you can use a `.`.

For example, if you have created a project named `MyAdventure`, run the following
command.

```sh
alexa-sfb deploy MyAdventure
```

The command deploys the skill, creating it the first time by using the Alexa
Skills Kit CLI, then the command builds and deploys your skill's voice model,
manifest, and Lambda function code.

> **Note:** By default, the Skill Flow Builder command line checks to see if you
are on the latest version of SFB before deploying. To override this check and
directly `deploy`, pass the `--override` flag.

Full usage details for `alexa-sfb deploy` are described as follows.

### Usage of the command

- `deploy [options] story` - Path to a story. You can build and deploy a story to developer portal and AWS Lambda.

### Options for the command

- `-o, --override` - Use this option to override version check.
- `-s, --stage [stageName]` - Use stage to deploy (i.e. dev, test, beta, prod).
- `-l, --locale [localeName]` - Use locale to deploy (i.e. en-us, en-gb, fr-fr,
etc.) when using different Lambda functions for each locale.
- `-d, --deployer [deployerName]` - ASK deployer to use (cfn or lambda).
Cannot be changed after deploying your skill. Default is cfn (CloudFormation)
- `-h, --help` - This option will output usage information.

If you want to deploy only the metadata for your skill, you can use the
[`deploy-metadata`](#deploy-metadata-command) command. This will build your skill
information and deploy manifest or voice model changes, but not upload your
Lambda function code.

```sh
alexa-sfb deploy-metadata MyAdventure
```

If your Lambda function code is too big or too slow to upload by using the
standard deploy command you can use the
[`deploy-via-zip`](#deploy-via-zip-command) command.

This command uses the command line `zip` function on Mac/Linux and the
application `7z` on Windows, which must be in your path. The command then
uploads your code to the S3 bucket that you specified for your skill, and then
uses an `update-function-code` command to update your Lambda function by using
this zip file. On slow connections, using a zip file for deploying your skills
is often faster than the standard deploy command.

```sh
alexa-sfb deploy-via-zip MyAdventure
```

### Create multiple deployment stages

If you want to create a beta stage and a prod stage for your skill, you must
create two separate skills in the developer console. To create the two skills
you can use the `--stage` argument with the previously mentioned deploy commands.

To create a stage other than the default stage, run a deploy command similar to
the following example.

```sh
alexa-sfb deploy --stage beta MyAdventure
```

This command creates a new metadata directory to hold additional ASK skill
manifest and deployment files for your skill. You can see these files stored in
your projects directory in the "metadata" folder.

```
MyAdventure\metadata\skill.json
MyAdventure\metadata\ask-resources.json
MyAdventure\metadata\ask-states.json
MyAdventure\metadata\skill-stack.json

MyAdventure\metadata\beta\skill.json
MyAdventure\metadata\beta\ask-resources.json
MyAdventure\metadata\beta\ask-states.json
MyAdventure\metadata\beta\skill-stack.json
```

If `--stage` isn't passed in your deploy command, your skill will use the top
`skill.json/*.json` files when deploying your skill. If you specify a stage, the
corresponding subdirectory will be used.

### Use stage-specific config settings

To use stage specific configuration values at deployment, you can use the
previously mentioned `--stage` option. To use stage specific settings at run
time, you need to set the "stage" environment variable on your Lambda Function
to the name of your stage.

For example, you may have a default stage, as well as a specified beta, and prod
stage for your project, each with its own lambda function. On the non-default
stages, you should set an extra environment variable in the Lambda Function
named "stage" with the value of either "beta" or "prod".

To set a stage specific variable, edit the `abcConfig.json` file to add
overrides for the specific stage. Any values not found in the stage specific
settings revert to using the default settings.

For example, to set different story names, database tables, and invocation names
for your project for beta and prod stages, add the following code into your
`abcConfig.json` file.

```json
"prod": {
    "story-title": "My Adventure",
    "skill-invocation-name": "my adventure",
    "dynamo-db-session-table-name": "myAdventureAttributes-prod",
    "s3-bucket-name": "my-adventure-prod",
    "story-id": "prod-my-adventure",
    "ask-skill-directory-name": "prod-my-adventure"
},
"beta": {
    "story-title": "My Adventure - Beta Stage",
    "skill-invocation-name": "my adventure beta",
    "dynamo-db-session-table-name": "myAdventureAttributes-beta",
    "s3-bucket-name": "my-adventure-beta",
    "story-id": "beta-my-adventure",
    "ask-skill-directory-name": "beta-my-adventure"
}
```

When you use stage overrides, you can more easily deploy and maintain multiple
stages of your skill, each with its own project specific AWS settings.

## deploy-metadata command

If you want to deploy only the metadata for your skill, you can use the this
command. This will build your skill information and deploy manifest or voice
model changes, but not upload your Lambda function code.

```sh
alexa-sfb deploy-metadata MyAdventure
```

### Usage of the command

- `deploy-metadata [options] story` - Path to a story. Deploys your skill
metadata to the Alexa Developer Portal

### Options for the command

- `-o, --override` - Use this option to override version check.
- `-s, --stage [stageName]` - Use stage to deploy (i.e. dev, test, beta, prod).
- `-g, --skill-stage <stageName>` The stage of a skill to deploy.
(development, certified, live). Defaults to `development`
- `-l, --locale [localeName]` - Use locale to deploy (i.e. en-us, en-gb, fr-fr,
etc.) when using different Lambda functions for each locale.
- `-d, --deployer [deployerName]` - ASK deployer to use (cfn or lambda).
Cannot be changed after deploying your skill. Default is cfn (CloudFormation)
- `-h, --help` - This option will output usage information.

## deploy-via-zip command

Builds and deploys a skill using a zip file transfer to S3/Lambda. Use when on
slow remote connections or when exceeding the command line `69905067` byte limit.

```sh
alexa-sfb deploy-via-zip MyAdventure
```

### Usage of the command

- `deploy-via-zip [options] story` - Path to a story. Builds and deploys a skill
using a zip file transfer to S3/Lambda.

### Options for the command

- `-o, --override` - Use this option to override version check.
- `-s, --stage [stageName]` - Use stage to deploy (i.e. dev, test, beta, prod).
- `-g, --skill-stage <stageName>` The stage of a skill to deploy.
(`development`, `certified`, `live`). Defaults to `development`
- `-l, --locale [localeName]` - Use locale to deploy (i.e. en-us, en-gb, fr-fr,
etc.) when using different Lambda functions for each locale.
- `-d, --deployer [deployerName]` - ASK deployer to use (cfn or lambda).
Cannot be changed after deploying your skill. Default is cfn (CloudFormation)
- `-h, --help` - This option will output usage information.

## build command

The build command generates your skills voice model and code locally, but does
not deploy them. You can view the output in the `.deploy/` folder inside of your
project.

## simulate command

The `alexa-sfb simulate` command first builds the latest version of your skill's
content or code, then starts the command line simulator. You can then type
commands into the command line simulator to test your story without requiring a
full deployment. The simulator is helpful to quickly testing recent changes you
have made to your content.

```sh
alexa-sfb simulate MyAdventure
```

By default, the simulator prints out all of the scene instructions executed
during the run. If you want to more easily see your own logging, you can run the
simulator in a quiet mode with `--quiet`:

```sh
alexa-sfb simulate MyAdventure --quiet
```

This command runs the simulator in `quiet` mode, which suppresses all debugging
logs generated by the simulator, and you can only print your own logs.

## clean command

The `alexa-sfb clean` command removes the auto-generated parts of your project
that are used by deployment. These parts can include the `.deploy/` directory
and the "clean" build script on your code directory. This will clean out the
`code/.dist`, and any extra `node_modules` folders for the given story. Run the
`clean` command when initially creating a new stage/locale to force the creation of a new
skill id. The command doesn't delete any actual parts of your source content.

## upload command

This command uploads the contents of your locale specific resources to S3 for
public usage via your skill. Only content within the "public" folder is uploaded
to S3. The list of folders to upload is in the `abcConfig.json` file under the
property `"public-resource-folders"`. The S3-bucket used is specified in the same
config file with the property `"s3-bucket-name"`.

The following example shoes how to run the command.

```sh
alexa-sfb upload MyAdventure
```

The `alexa-sfb upload MyAdventure` - command would then upload the following
files to S3 for your skill to use.

```
MyAdventure\content\en-US\resources\public\audio\trumpet_1.mp3
MyAdventure\content\en-US\resources\public\images\sample_image.png
MyAdventure\content\en-US\resources\public\vo\a-fairy-tale.mp3
```

In the following examples, you can see how you can reference the URL of one of
the previous uploaded files from the `.abc` file, and use the special string
"$SNIPPET_S3_RESOURCES_URI" in a snippet in your ABC content.

For example:

- `Snippets.json`

```json
{"sfx": "<audio src='$SNIPPET_S3_RESOURCES_URI/audio/$1'/>"}`
```

- `Story.abc`

```
*say
    [sfx trumpet_1.mp3]
```

After you run the code, it will then be transformed into the following.

```
*say
    <audio src='https://<...your projects s3 url and path>/audio/trumpet_1.mp3'/>
```

## vscode command

Downloads and installs the Visual Studio Code extension for SFB editor support.
This will enable syntax highlighting and enchanced navigation for `.abc` files.

```sh
alexa-sfb vscode
```
