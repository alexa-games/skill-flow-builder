# Skill Flow Builder Utility Package

> **Warning**
> **DEPRECATED** The Alexa Games team will no longer support or maintain this official distribution of Skill Flow Builder. Thank you to all the folks who have used SFB to make great Alexa skills over the years!


This module contains utility functions used in other components of Skill Flow Builder.

## Getting Started

### Prerequisites

The following needs to be installed and configured:

```preformatted
Node.js (with npm) # Note: Requires Node.js version >= 10.15.
Yarn
```

The `sfb-util` package provides utility functions to the other packages, and
can be built first without building any other package.

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

## Contributing

Utility functions should only go into `sfb-util` if they are not domain-specific
(e.g. CLI-, editor-, or skill-specific) and they will be used in multiple modules.
