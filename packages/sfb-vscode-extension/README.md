# Skill Flow Builder VS Code Language Extension

This module contains the code for the VS Code extension for Skill Flow Builder
which provides syntax highlighting for `.abc` files. You can install it with
the Skill Flow Builder CLI using the command `alexa-sfb vscode`. Using this
command will install the Alexa SFB extension into your `$HOME/.vscode/extensions/`
directory.

Visit [Skill Flow Builder](https://alexa.design/sfb-editor-landing-page) for
more information.

## Getting Started

### Prerequisites

The following needs to be installed and configured:

```preformatted
Node.js (with npm) # Note: Requires Node.js version >= 10.15.
Yarn
```

This package requires other core modules to be built. To build all the
modules in the `packages/` directory at once, run `yarn build-modules`. If you
have the `sfb-cli` package globally installed, you can then run `alexa-sfb vscode`
to install the extension. If you do not have the `sfb-cli` package already
installed, please refer to the [sfb-cli installation process](../packages/sfb-cli)
to get started.

### Compiling

```sh
yarn install && yarn compile
```

The compiled code is built into the `dist/` directory.

## Package Structure

The SFB VS Code extension package structure looks like this.

```preformatted
packages/sfb-vscode-extension/
└── resources/ # SVG graphics
└── src/       # extension code
└── syntaxes/  # abc file syntax highlighting definition
└── language-configuration.json # general formatting config for .abc
└── package.json # contains top-level extension configuration
└── ...
```

## Contributing

For a full guide on building VS Code language extensions, read [Language Extensions](https://code.visualstudio.com/api/language-extensions/overview)

The majority of the logic for the VS Code extension is built using regular
expressions present in `syntaxes/abc-format.tmLanguage.json`. If new language
features are added as part of `sfb-f`, such as new keywords or expressions, then
an associated regular expression pattern should be added or updated in
`syntaxes/abc-format.tmLanguage.json` as well. For example, the flag
manipulation pattern looks like this:

```json
{
  "match": "^[\\s]*(flag|unflag|clear|pop|dequeue)[\\s]+(?:(?:([\\S]+?))(?=,[\\s]*$|\\.[\\s]*$|$))?",
  "captures": {
    "1": {
      "name": "entity.name.function"
    },
    "2": {
      "name": "variable"
    }
  }
}
```

Here, the `match` property details the full regular expression pattern, and the
`captures` property assigns [TextMate](https://macromates.com/manual/en/language_grammars)
scopes to the tokens matched. Note that any pattern can only match a single line.
