# Next CLI contract

Run `node <plugin>/scripts/check-ojo-cli.mjs` and use exactly the returned `command`, selected by `OJO_CLI_BIN` or PATH. Only `@touchine-ai/ojo` 2.x with capability schema 2, generation next and service API server.v1 is supported.

For project import run the same checker with `--import`. It also requires publication protocol 1 and the actual help for `project create`, `project team list/get/set`, `prototype validate`, `prototype build` and `prototype publish`. A missing feature stops publication. There is no legacy fallback.

Shared commands remain `auth login`, `workspace sync`, `chat`, `query`, `screen` and `conversion report`. Authenticate using the same explicit API/auth origins used for creation and publication. Keep credentials in the CLI.

Follow [publication](project-import.md) to create an authorized empty target, retain its identity, publish and read back the artifacts. Creating a project via chat sends a message and is not an import-target operation. Resolve and verify the requested/default 原型设计团队 using the new-framework Team commands and its associated runtime Skills using --sync-skills before publication.
