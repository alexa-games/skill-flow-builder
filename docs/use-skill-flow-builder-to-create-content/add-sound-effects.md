# Add sound effects

You can use any Speech Synthesis Markup language (SSML) tag that Alexa supports
to customize your content. To use sound effects and audio files within your
content, use the SSML audio tag. For more information see
[audio tag in the SSML Reference](https://developer.amazon.com/en-US/docs/alexa/custom-skills/speech-synthesis-markup-language-ssml-reference.html#audio).

```
@start
    *say
        Welcome to my awesome game!
        <audio src='https://s3.amazonaws.com/.../yourAudioFile.mp3' />
        Do you want to be a pirate or a merchant?
```

## Add different voices

You can use a voice SSML tag to use various voices in your Alexa skill. For more
information about voices, see
[voice in the Speech Synthesis Markup Language (SSML) Reference](https://developer.amazon.com/en-US/docs/alexa/custom-skills/speech-synthesis-markup-language-ssml-reference.html#voice).

```
@start
    *say
        <voice name='Kendra'>I am not a real human.</voice>.
```

## bgm (background music)

```
*then
    bgm https://url-to-the-background-music.mp3
```

Mix background music for the scene's narration.

You can mix background music for a scene's narration. Background music only
works when you mix with foreground audio or narration using custom
[Amazon Polly](https://aws.amazon.com/polly/). You can't mix music with Alexa's
voice. Insert bgm after `*then`.
