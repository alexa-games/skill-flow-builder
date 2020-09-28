# Using the Editor

## Create, edit, and link a node for your game or story

### To create a new child node

1. Make sure that the editor is in Source mode or Guided mode.
2. From the left menu, open the **Map** view.
3. In the **Map** view, click a node.
4. Use icons to create a node.

The editor creates a node that uses a `hear` command, where you can change what
you want Alexa to listen for to trigger the new node.

### To rename a node

1. Make sure that the editor is in Source mode or Guided mode.
2. In the **Map** view, select the node.
3. Next to the node name, click the pencil button, and then edit the name.

When you rename a node, the editor automatically updates the parent node to
refer to the node by its new name.

### To delete a node

1. Make sure the editor is in Source mode or Guided mode.
2. In the **Map** view, click the node.
3. Use icons to delete a node.

## Edit the content for a scene

Use Guided mode to edit what the scene says, what it shows, and the actions it
takes, For example:

- Edit the `say` section to change what Alexa says.
- Use different voices in the `say` section by selecting text and then in the
pop-up menu selecting the name of the voice to use.
- Edit the `reprompt` section, which is what Alexa says if the user does not
answer a question after a few seconds.
- Use the **Actions** tab to select what your scene should do, for example go to
another scene directly, or listen for additional phrases to trigger scenes to go
to.

## Use audio or images in your content

Navigate to the desired content panel you want on the left side of the editor
window, and then click and drag the content to the right side of the window.

## To preview your game

### Set up voice preview (optional)

In order to use the voice preview functionality in the Skill Flow Builder Editor,
you need to install FFmpeg and LAME for audio mixing as well as configuring your
AWS account to enable Polly for speech synthesis.

#### Install FFmpeg and LAME

You must install [FFmpeg](https://ffmpeg.org/) and [LAME](https://lame.sourceforge.io/)
locally before voice preview will work in the Skill Flow Builder Editor.

Scripts to build and install both LAME and FFmpeg are available in the `scripts/setup/`
directory at the root of the repository, and you can run the following command
to build them in the root directory:

```sh
yarn dependencies:OPERATING_SYSTEM
```

Where `OPERATING_SYSTEM` is the operating system you wish to build for:

- linux
- mac
- win

> **Note:** For Windows, the script is designed to be used with
> [Msys2](https://www.msys2.org/) while running the MINGW64 shell.
> It can be difficult to install Node.js under Msys2, so unless you are already
> working in Msys2 with Node.js, we suggest running
> `scripts/setup/InstallDependenciesWin.sh` directly.

More information on how to build and install FFmpeg with LAME can be found in
[FFmpeg Compilation Guide](https://trac.ffmpeg.org/wiki/CompilationGuide).

Once installed, make sure the path to the folder containing your FFmpeg binary is
added to the PATH environment variable on your machine.

> Alternatively, you can set the `ffmpeg-location-for-editor` variable in your
> project's `abcConfig.json` file to the full filepath to your `ffmpeg` or
> `ffmpeg.exe` application.

#### Configure your AWS account

Next, you must add permissions for [Amazon Polly](https://aws.amazon.com/polly/)
to your AWS IAM account to enable Polly's Text-to-Speech during voice preview.

> **Note:** You can skip this step if you already completed
> [Set up Skill Flow Builder as a Developer](../set-up-skill-flow-builder-as-a-developer/README.md)

Open `<your_project_path>/abcConfig.json` and then edit the attribute
`"ask-profile-name"` to specify the profile you want to use.

1. To specify the profile you want to use, open
`<your_project_path>/abcConfig.json`, and then edit the attribute
`"ask-profile-name"`. You must provide a working AWS account with AWS account
security credentials set up for your user.
2. If you don't have an IAM user with credentials, open the [AWS Management console](https://aws.amazon.com/console/).
3. Click the **IAM** tab, click **Add User**, and then create a new user name.
4. Select the check box for **programmatic access**, and then grant a policy
with the following structure.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "SFBEditor",
            "Effect": "Allow",
            "Action": [
                "iam:AttachRolePolicy",
                "iam:CreateRole",
                "iam:GetRole",
                "iam:PassRole",
                "polly:SynthesizeSpeech"
            ],
            "Resource": "*"
        }
    ]
}
```

### Simulate your game

1. Select **Simulate** mode tab, and then click **Simulate from Start** button.
In the editor, you can turn the voice preview on or off.
2. If changes to your audio didn’t update, click the
**Clear Voice Preview Cache** from the troubleshooting menu.

You can edit variables on the bottom of the page. The editor can save changes
and return you to your simulation state.

## Complete other tasks outside the Skill Flow Builder Editor

To edit your AWS resources, deployment details, or project settings, use the
editor of your choice to modify the `abcConfig.json` file.

## Use Snippets

Snippets provide a shorter syntax for performing common operations in your
skill's `*.abc` files. This helps make your files shorter and simpler, and makes
future changes easier. Snippets also allow you to shorten the URLs to resources
used in your skill such links to audio or image files.

To use a snippet, use brackets that enclose the snippet name like
`[<snippetName>]` in any of your skill say, recap, prompt again, or then sections.

The following example shows a snippet for creating an `<audio src=".." />` tag
and a break tag.

```
*say
    [sfx trumpet_1.mp3] Good morning, [pause] it's time to get up.
```

During simulate/runtime, the previous snippet is turned into a string similar to
the following example.

```
<audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' /> Good morning, <break time='1s'/> it's time to get up.
```

### Add Snippets

You can use the Skill Flow Builder editor to add a snippet, using the
**Snippets** panel.

1. In the Snippets panel and click **New snippet** at the top.
2. In the Name field, enter a name, which is what you will put inside of "[]" brackets.
3. In the Value field, enter the longer value that you want it to evaluate to.

You can also create snippets by modifying the Snippets.json file inside of your
project's `content/<locale>/` directory.

> **Note**: You can have a different `Snippets.json` file for each locale to
support localization of snippets.

The following example shows what a `Snippets.json` file might look like:

```json
{
    "sfx": "<audio src='$SNIPPET_S3_RESOURCES_URI/audio/$1'/>",

    "pic": "$SNIPPET_S3_RESOURCES_URI/images/$1",

    "trumpet": "<audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' />",

    "pause for": "<break time='$1'/>",

    "pause": "<break time='1s'/>",

    "kid": "<voice name='Justin'>",

    "/kid": "</voice>"
}
```

You can add additional snippets to this file by adding additional lines with
snippet "names" and "values".

### Delete snippets

In the editor's Snippets panel, you can click the trash can icon to delete a snippet.

You might also edit the `Snippets.json` file directly for your project to remove
snippets.

> **Note**: Do not remove the sfx or pic snippets. They are for use by the
editor when using drag and drop to add audio/image files to your skill.

### Edit snippets

To edit an existing snippet in the editor, you must first delete the snippet
then make a new snippet with the same name. Or, you can edit the `Snippets.json`
file directly.

### Use snippets with custom parameters

Some snippets can take additional parameters, such as the `[sfx]` snippet. To
create a snippet that takes extra parameters, use the $1, $2, $3, etc. variables
to handle your 1st, 2nd, 3rd, etc. parameters.

```json
{
    "greeting": "Hello there $1, this is $2."
}
```

This snippet could then be used by calling it as follows:

```
*say
    [greeting John Amanda]
```

Which would turn into this phrase at simulate/runtime.

> Hello there John, this is Amanda.

### Snippets with default content URLs

You can also use snippets to substitute your skills default content URL into
your audio/image tags used within your skill. The special variable
`$SNIPPET_S3_RESOURCES_URI` is replaced by the S3 path and bucket configured in
your skills `abcConfig.json` file.

The following example shows the snippet structure beforehand.

```json
{
    "sfx": "<audio src='$SNIPPET_S3_RESOURCES_URI/audio/$1'/>"
}
```

The following example shows how the structure turns into the following snippet
at simulate/runtime.

> **Note**: This special variable replacement can also help with content
localization of audio/images files, as the generated URL contains the locale in
the generated URL.

```json
{
    "sfx": "<audio src='https://s3.amazonaws.com/sfb-framework/testadventureskill/en-US/audio/$1'/>"
}
```
