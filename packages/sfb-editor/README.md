# Skill Flow Builder Editor

The Skill Flow Builder Editor provides a graphical interface (GUI) where you can
create, edit, and preview content for your skill. The SFB Editor is a
cross-platform desktop application built using the [Electron framework](https://www.electronjs.org/)
using React and Redux. This package contains the source code for the SFB editor.

Visit [Use the Skill Flow Builder Editor](https://developer.amazon.com/en-US/docs/alexa/custom-skills/use-the-skill-flow-builder-editor.html)
for more information.

## Prerequisites

To run the Skill Flow Builder Editor, you must meet the following minimum system
requirements:

* Operating system: macOS v10.14 or above (Mojave or Catalina), Windows 10 (x64)
* At least 1 GB of available hard disk space
* Dual-core CPU at 2 GHz
* 2 GB RAM
* 1024px x 768px display resolution
* [Node.js (with npm)](https://nodejs.org/en/download/) version 10.15 or later.

## Getting Started

First, clone the parent repository.

```sh
git clone https://github.com/alexa-games/SkillFlowBuilder.git && cd SkillFlowBuilder/
```

The SFB Editor requires that the core modules are built, build all the packages
in the `packages/` directory by running `yarn build-modules`.

Navigate into the `sfb-editor/` directory with `cd packages/sfb-editor/`,
and run `yarn start`. This should conclude launching the editor.

Alternatively, you can download prepackaged executables for [Mac](http://sfb-framework.s3-website-us-east-1.amazonaws.com/macLatest)
or [Windows](http://sfb-framework.s3-website-us-east-1.amazonaws.com/winLatest).

## Package Structure

The SFB Editor package structure looks like this, with most of the editor source
code existing inside the `app/` directory.

```preformatted
packages/sfb-editor/
├── __mocks__/ # Mocks for testing purposes
├── app/ # SFB Editor source code
├── bin/ # Entry point for the SFB editor
├── configs/ # Bundling configs
├── internals/ # Scripts to interact with the Host
├── publish-scripts/ # Scripts to publish for Mac/Windows
├── resources/ # SFB art assets
├── test/ # Tests
├── web/ # Assets for the editor, SFB landing page
└── ...
```

The SFB Editor is an Electron application. The Electron framework is based on
Node.js and Chromium, and it enables you to write rich cross-platform desktop
applications using JavaScript, HTML and CSS. Read more about Electron applications
[here](https://www.electronjs.org/docs).

## Contributing

The SFB Editor is mainly built using [React](https://reactjs.org/docs) and the
[Electron framework](https://www.electronjs.org/docs). After editing a view or
component, visualize your changes by simply rebuilding with yarn build and
relaunching the editor with `yarn start`. For example, a change to the application
sidebar would require changes in `app/AppRail/index.js` or `app/AppRail/styles.css`,
with the changes being shown next rebuild.
