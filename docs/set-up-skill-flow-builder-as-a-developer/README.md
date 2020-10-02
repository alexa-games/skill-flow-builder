# Set up Skill Flow Builder as a Developer

With Skill Flow Builder, you can use a metadata format to create content for
games and stories including interactive fiction, role-playing games, and
adventure games. The suite provides the following items:

- A standard format for games and stories.
- Built-in extensions to add game logic, and hooks to implement custom functions
and instructions within your game.
- A virtual Alexa emulator that provides simulation, with features for you to
save and load the current state of the game or story.
- A graphical user interface (UI) to edit and test your content.
- A command-line interface (CLI) for developers.

As a developer you can use Skill Flow Builder to integrate content from writers
or designers into language Alexa can understand.

## Get Started

You must install several software packages before you can install and use Skill
Flow Builder.

## To get started with Skill Flow Builder

1. Install the latest version of [Git](https://git-scm.com/downloads)
2. Install the latest version of the [Amazon Web Services (AWS CLI)](https://aws.amazon.com/cli/).
3. Install [Node.js](https://nodejs.org/en/) version 10.15 or later.
4. Install the latest version of the [Alexa Skills Kit Command Line Interface (ASK CLI)](https://developer.amazon.com/en-US/docs/alexa/smapi/quick-start-alexa-skills-kit-command-line-interface.html)
5. (Windows only) Install the latest version of the [windows-build-tools](https://www.npmjs.com/package/windows-build-tools) module.

## Install and set up Skill Flow Builder CLI

You can set up the Skill Flow Builder CLI globally so that you can run commands
for the Skill Flow Builder from any directory. Or you can set up the `alexa-sfb`
package locally.

### To install and set up Skill Flow Builder CLI globally

Open a command prompt or terminal, enter the following command, and then press Enter.

`npm install --global @alexa-games/sfb-cli`

alternatively if using yarn,

`yarn global add @alexa-games/sfb-cli`

### To install and set up the Skill Flow Builder CLI locally

Alternatively, instead of globally setting up the CLI, you can set it up locally.

1. Change the directory to the one where you want to set up the `alexa-sfb`
package locally.
2. Open a command prompt, enter the following code, and then press Enter.

`npm install @alexa-games/sfb-cli`

alternatively if using yarn,

`yarn add @alexa-games/sfb-cli`

## Run the Skill Flow Builder CLI

You can run the Skill Flow Builder CLI globally or locally.

### To run the CLI globally

Open a command prompt, enter `alexa-sfb`, and then press the Enter key.

### To run the CLI locally

`npx` can also be used to run the CLI locally with `npx alexa-sfb`

## Install and set up the Visual Studio Code Extension

Amazon has optimized Skill Flow Builder for Visual Studio Code. Skill Flow Builder includes a
language extension for Visual Studio Code to provide syntax highlighting, error
diagnostics, and definition jumps.

### To install the Visual Studio Code Extension

1. Ensure you have [Visual Studio Code](https://code.visualstudio.com/) installed.

2. Open a command prompt, enter the following command, and then press Enter.

`npx @alexa-games/alexa-sfb vscode`

3. Restart VSCode to refresh your extensions

After the extension is installed, you should be able to use definition jump to
jump to the specific file and line that defines a scene. For example, if your content
contains the instruction `-> myscene`, click `myscene` and then press F12 or
right-click and select *Go to Definition* to be navigated to the line that
defines `myscene`.

## Create the skill project

After you've installed and set up your Skill Flow Builder software, you're ready
to create your skill project for your new game or story.

### To create your skill project

Depending on how you installed the SFB CLI, open a command prompt and enter
`alexa-sfb new` or `npx alexa-sfb new` and then enter a path to the folder where
you want to store the files of your game/story, for example:

`alexa-sfb new my_best_story`

## Debug skill content using the simulator

You can run the simulator to play through your content and verify the behavior
of the content. The simulator tests the runtime execution of the content, not
the skill.

### To preview content with the simulator

Open a command prompt, enter the following command, and then press Enter.

`alexa-sfb simulate <your_project_path>`

## Deploy your Alexa skill

After you have debugged your content with the simulator, complete the following
steps to deploy your game or story as an Alexa skill.

### Step 1: Set up your ASK profile

Set up your Alexa Skills Kit (ASK) profile with your developer account, and link
your AWS account. If you have already set up your ASK profile, skip to [Step 2](#step-2-update-the-skill-configuration).

### To begin to deploy your Alexa skill with the "default" profile

1. Open a command prompt, type the following command: `ask configure`, and then follow
the prompts.
2. If you don't have an IAM user with credentials, open the [AWS Management console](https://aws.amazon.com/console/).
3. Click the **IAM** tab, click **Add User**, and then create a new user name.
4. Select the check box for **programmatic access**, and then grant a policy
with the following structure.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "SFBDeveloper",
            "Effect": "Allow",
            "Action": [
                "iam:AttachRolePolicy",
                "iam:CreateRole",
                "iam:GetRole",
                "iam:PassRole",
                "lambda:AddPermission",
                "lambda:CreateFunction",
                "lambda:GetFunction",
                "lambda:ListFunctions",
                "lambda:UpdateFunctionCode",
                "logs:DescribeLogStreams",
                "logs:FilterLogEvents",
                "logs:GetLogEvents",
                "s3:GetObject",
                "s3:PutObject",
                "s3:PutObjectAcl",
                "polly:SynthesizeSpeech",
                "cloudformation:CreateStack",
                "cloudformation:UpdateStack"
            ],
            "Resource": "*"
        }
    ]
}
```

#### To use an ASK profile other than "default"

Open `<your_project_path>/abcConfig.json` and then edit the attribute
`"ask-profile-name"` to specify the profile you want to use.

To specify the profile you want to use, open
`<your_project_path>/abcConfig.json`, and then edit the attribute
`"ask-profile-name"`. You must provide a working AWS account with AWS account
security credentials set up for your user.

### Step 2: Update the skill configuration

You can create and deploy your skill without changing any configuration.

#### To update the skill configuration

Open `<your_project_path>/abcConfig.json`, and then update the following
information in the skill configuration file:

- `"ask-skill-directory-name"`: The name of your skill as used by the ASK CLI.
Your AWS Lambda function name and the skill name derive from this value. You can
use contain upper and lowercase letters (A-Z, a-z), numbers (0-9), underscores
(_), and dashes (-).
- `"skill-invocation-name"`: Defines how users invoke your skill. For more
information, see [Understand How Users Invoke Custom Skills](https://developer.amazon.com/en-US/docs/alexa/custom-skills/understanding-how-users-invoke-custom-skills.html).
- For information on what can be used as a valid invocation name, look at
[Invocation Name Requirements](https://developer.amazon.com/en-US/docs/alexa/custom-skills/choose-the-invocation-name-for-a-custom-skill.html#cert-invocation-name-req)
- `"publish-locales"`: A list of Alexa-supported locales where you can publish
the skill.

### Step 3: Finish the skill deployment

Finish the skill deployment from the command prompt. You might encounter errors
and need to run the script as an administrator.

#### To finish the deployment of your skill

1. Open a command prompt, enter the following command, and then press Enter.

    `alexa-sfb deploy <your_project_path>`

    > **Note**: By default, `alexa-sfb` will use ASK's 'cfn' deployer, which
    > uses AWS CloudFormation to deploy resources. If you would instead prefer
    > to deploy with ASK's 'lambda' deployer, enter the following command instead:
    >
    > `alexa-sfb deploy --deployer lambda <your_project_path>`

    > **Important**: If you run the script from Windows, you might have to open
    > your command prompt as an administrator. You open your command prompt as an
    > administrator to avoid a permissions error when the script runs PowerShell
    > batch files as part of the deployment process.

2. If your skill fails to publish with the error
`"AccessDenied: User: arn:aws:iam::... is not authorized to perform: iam:CreateRole on resource: ...`,
in the AWS Management Console, go to IAM, and then verify that your user has the
policy described in [Step 1: Set up your ASK profile.](#step-1-set-up-your-ask-profile)

### Step 4: Set up the AWS IAM role

> **Note:** This only applies to users deploying with the Lambda deployer by
> specifying the '`--deployer lambda`' option when running `alexa-sfb deploy`.
> If you are using the default deployer (CloudFormation), skip to [Step 5](#step-5-launch-your-skill)

After you create the skill in your developer account and create the AWS Lambda
function, you need to add permissions.

#### To setup the AWS IAM

Add permissions for DynamoDB, Amazon S3, and Amazon Polly to the IAM role
created for your AWS Lambda function.
> The name of the default role created for your skill is `ask-lambda-"your skill
> project name"`
>
> There should already be a managed policy for the role
>`AWSLambdaBasicExecutionRole` for running the skill code on AWS Lambda.

#### To add a new policy so that AWS Lambda function can access DynamoDB

In the AWS Management Console, add the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "SFBLambda",
            "Effect": "Allow",
            "Action": [
                "dynamodb:CreateTable",
                "dynamodb:PutItem",
                "dynamodb:DeleteItem",
                "dynamodb:GetItem"
            ],
            "Resource": "*"
        }
    ]
}
```

To add further permissions to the above policy, see the section
[Set up Amazon Polly voices (Optional)](./setup-polly-voices.md).

**Note:** You might need to change some of the default AWS Lambda settings. In
the AWS console, find your AWS Lambda function and change the following settings:

- Verify the runtime environment is Node.js 10.x
- Verify the timeout is set to at least 15 seconds

### Step 5: Launch your skill

As the final step to deploying your skill, you need to launch your skill by
saying the wake word and invocation name.

#### To launch your skill

On your Alexa device, test your skill by saying the wake word, followed by
the invocation name. For example, say, "Alexa, open the High Low Game."
> **Note:** If you are deploying with the Lambda Deployer option, the first time
> you launch your skill you will receive an error message. This is because your
> AWS Lambda function tries to generate the state management DynamoDB table.
> Wait about 15 seconds for the AWS Lambda function to create the DynamoDB
> table, and then say the wake word, followed by the skill invocation name. For
> example, say, "Alexa, open the High Low Game." This does not apply to the
> CloudFormation deploy process.

## Extra Resources

- [Skill Flow Builder Project Structure](./project-structure.md)
- [Skill Flow Builder Life Cycle](./life-cycle.md)
- [Create a custom extension](./create-a-custom-extension.md)
- [Skill Flow Builder CLI Reference](./cli-reference.md)
- [Set up Amazon Polly voices (Optional)](./setup-polly-voices.md)
- [Uninstall the Skill Flow Builder](./uninstall.md)
