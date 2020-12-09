# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.1.0](https://github.com/alexa-games/skill-flow-builder/compare/v2.0.0...v2.1.0) (2020-12-09)


### Bug Fixes

* added support for different installation methods for alexa-sfb vscode ([71fed34](https://github.com/alexa-games/skill-flow-builder/commit/71fed34b792852520627305d9b28ce7104fea80a))
* edit semantic version checking to allow nightly builds to deploy ([#22](https://github.com/alexa-games/skill-flow-builder/issues/22)) ([180de78](https://github.com/alexa-games/skill-flow-builder/commit/180de7881fcff25a85bc535f34966b6f2c165106))
* fix alexa-sfb vscode when installed locally ([4dea92c](https://github.com/alexa-games/skill-flow-builder/commit/4dea92cdd8ceaba33859f18891217f80bcfa6bad))
* Removed unnecessary async in test ([#26](https://github.com/alexa-games/skill-flow-builder/issues/26)) ([83ac117](https://github.com/alexa-games/skill-flow-builder/commit/83ac1171d88eb7f0abe51099d1592769cd0e4ab5))
* stop the deletion of devDependencies in stageCommand ([#24](https://github.com/alexa-games/skill-flow-builder/issues/24)) ([a9ab8bd](https://github.com/alexa-games/skill-flow-builder/commit/a9ab8bd60cf6f4354b85047c226f5c535dcd2aa8))
* windows path issue ([70491f0](https://github.com/alexa-games/skill-flow-builder/commit/70491f091d917e3e94e9684f953128ab0c825cfe))


### Features

* Added ability to use ASK custom build hooks for local package linking ([#29](https://github.com/alexa-games/skill-flow-builder/issues/29)) ([7b09c83](https://github.com/alexa-games/skill-flow-builder/commit/7b09c83371129df0fe5ad82f64382bd0b229488c))
* Added input sanitization to exec/spawn calls ([#28](https://github.com/alexa-games/skill-flow-builder/issues/28)) ([205254f](https://github.com/alexa-games/skill-flow-builder/commit/205254fd6096f8a88820f77908096b1ef48d6156))
* Include S3 domain and default to HTTPS for VoiceOverExtension ([#27](https://github.com/alexa-games/skill-flow-builder/issues/27)) ([d7b7bc1](https://github.com/alexa-games/skill-flow-builder/commit/d7b7bc1f23749fe53d0ed46e21f18bb0440f2c2e))





# 2.0.0 (2020-10-12)


### Bug Fixes

* add build-automation-testing to .github/workflows/windows.yml ([4f52024](https://github.com/alexa-games/skill-flow-builder/commit/4f520243ebaf681a0e1be829835bf7224a5482b2))
* Fixed cli, vscode, and editor unit test failures on Windows ([#5](https://github.com/alexa-games/skill-flow-builder/issues/5)) ([ed8e25a](https://github.com/alexa-games/skill-flow-builder/commit/ed8e25a994282b7469e79d6596e904f69df96a4f))
* fixed markdown formatting of docs on Github ([a9cc2fc](https://github.com/alexa-games/skill-flow-builder/commit/a9cc2fccfa518723879e70c984e61dcbb2978b38))
* Made DynamoDB and S3 permissions in skill-stack.yaml match docs ([#7](https://github.com/alexa-games/skill-flow-builder/issues/7)) ([d093497](https://github.com/alexa-games/skill-flow-builder/commit/d093497015ad116dfd4c55c3c3b57c769e59f412))
* reduced skill-stack.yaml Polly permissions to minimum required ([6d118f4](https://github.com/alexa-games/skill-flow-builder/commit/6d118f4414d8f03a9c9c4761696716bb23751ab9))


### Features

* Added dependencies and editor-installer scripts and updated setup documentation ([#2](https://github.com/alexa-games/skill-flow-builder/issues/2)) ([2067357](https://github.com/alexa-games/skill-flow-builder/commit/206735790d146f226d4b4620d9651e2fc4bf5e49))
* build automation with TravisCI/Github actions ([45692dd](https://github.com/alexa-games/skill-flow-builder/commit/45692ddca0c465d0957a7d3b680e1cfdb19799d9))
