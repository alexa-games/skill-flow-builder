# Use the Skill Flow Builder Editor

The Skill Flow Builder Editor provides a graphical interface (GUI) where you can
create, edit, and preview content for your skill. A Map View shows the scenes in
your content and how the scenes flow into one another. Follow the directions in
the following sections to learn how to use the editor.

## Prerequisites

To run the Skill Flow Builder Editor, you must meet the following minimum system
requirements:

- Operating system: macOS v10.14 Mojave, Windows 10 (x64)
- 1 GB of available hard disk space
- Dual-core CPU at 2 GHz
- 2 GB RAM
- 1024px x 768px display resolution
- Install [Node.js](https://nodejs.org/en/download/) version 10.15 or later.

## Get Started

### Open the Skill Flow Builder Editor

Open the Skill Flow Builder Editor on: [Windows](http://sfb-framework.s3-website-us-east-1.amazonaws.com/winLatest)

Open the Skill Flow Builder Editor on: [Mac](http://sfb-framework.s3-website-us-east-1.amazonaws.com/macLatest)

### Set the editor mode

In the top-right corner of the Skill Flow Builder Editor, select from the
following editing modes:

**Source mode**: This mode is for voice designers and developers. Use this mode
to create your game or story by editing the text of the .abc file directly. For
information about the content format for the Skill Flow Builder, see
[Use Skill Flow Builder to Create Your Content](../use-skill-flow-builder-to-create-content/README.md).

**Guided mode:** This mode is for voice designers. It provides a graphical user
interface for editing the `say` section, graphics, and actions for the currently
selected scene. On the left side of the Skill Flow Builder Editor, use the
**Map** view to create or delete scenes.

**Writer mode:** This mode is for localization. The visual content editor shows
the content that the skill says for each scene and the `hear` utterances that
Alexa listens for. From the top menu, select a locale and edit the strings for
the locale, then click **Save**. Then, use the simulator to preview your changes
for the locale. After you deploy your skill, the skill uses the locale-specific
strings. If you are not internationalizing your skill, you do not need to use
the Writer mode.

### Understand the Map view

The **Map** view shows a diagram of the voice flow of your skill. Each scene in
your skill is a dot, and each transition to another scene is a line. Green lines
are `hear` commands. Hover over a green line to show what Alexa listens for to
trigger the command. Solid gray lines represent direct go-to links, showing
scenes that are either directly chained together or are chained together through
logical operations.

## Next Steps

See [Using The Editor](./using-the-editor.md)
