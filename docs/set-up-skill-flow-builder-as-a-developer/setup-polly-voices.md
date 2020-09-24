# Set up Amazon Polly voices

By default, you can use [Amazon Polly](https://aws.amazon.com/polly/) voices
with Alexa [SSML](https://developer.amazon.com/en-US/docs/alexa/custom-skills/speech-synthesis-markup-language-ssml-reference.html)
without further setup of Amazon Polly. You must perform Additional setup only
if you want to use advanced voice-mixing features like background music.

## Step 1: Set up AWS IAM role

- Add the following permissions to your custom IAM policy called "SFBLambda" that
is used by the IAM role for your AWS Lambda function:
  - `s3:GetObject` for storing and caching the generated sound files.
  - `s3:PutObject` for storing and caching the generated sound files.
  - `s3:PutObjectAcl` for storing and caching the generated sound files.
  - `polly:SynthesizeSpeech` for using the Amazon Polly service to generate the
  sound file using the Amazon Polly voices.

Example:

```json
...
"s3": "GetObject"
"s3": "PutObject"
"s3": "PutObjectAcl"
"polly": "SynthesizeSpeech"
...
```

## Step 2: Set up Amazon S3 bucket

- When you create and set up the bucket, make sure to clear the following public
access options:
  - **Block new public ACLs and uploading public objects.** When you clear this
  option you can add objects that you customers can see. The sound files used by
  the skill must be public-readable.
  - **Remove public access granted through public ACLs.** When you clear this
  option your customers can access the public objects.

## Step 3: Configure your skill

The default Alexa SSML syntax supports voice tags. With the tags you can use
custom Amazon Polly voices in your skill without additional setup.

For example:

To use Amazon Polly to mix voices with background music, you need to set up a
few configurable properties. Otherwise, you can use Amazon Polly voices alone
while leaving `polly-config` disabled. The configuration file for the Skill Flow
Builder is at
`<your_project_path>/abcConfig.json`.

To configure your skill set up the following configurable properties:

- `"s3-bucket-name"`: Name of the Amazon S3 bucket to store the generated
sound files.
- `"s3-domain-name"`: Name of the domain where your Amazon S3 files are served.
Usually "s3.amazonaws.com" for all global buckets, but if using a regionalized
bucket, you need to provide the correct value.
- `"polly-config -> enabled"`: If true, calls Amazon Polly instead of using
the built-in `<voice>` tag functionality provided via Alexa SSML.
- `"polly-config -> combineAudioTags"`: If true, combines multiple audio
files into a single .mp3 file.
- `"polly-config -> dontUseCache"`: If true, calls the Amazon Polly
service for every request. If false, the skill tries to use the previously
generated sound files if already generated.
- `"default-narrator -> enabled"`: If true, the narrator's voice is changed
to the Amazon Polly voice instead of Alexa's default voice.
- `"default-narrator -> name"`: Amazon Polly name of the default narrator's voice
as shown in the [voice list](https://docs.aws.amazon.com/polly/latest/dg/voicelist.html).
- `"default-narrator -> pitch"`: Pitch shift of the default voice. Set to
"+0%" to use the default pitch.
- `"default-narrator -> rate"`: Rate/speed shift of the default voice.
Set to "+0%" to use the default rate.
