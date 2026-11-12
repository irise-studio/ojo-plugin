# Team configuration

The new-framework import flow uses only the next CLI. Its current command surface has no Team catalog/read/write operation. Preserve a user's requested Team in the import receipt and report Team configuration as pending. Project creation and prototype publication must not invoke another CLI or AgentEngine workspace-context APIs to apply it.

A successful upload does not prove a Team was configured. Follow [new-framework publication](project-import.md) for creation, upload and artifact readback.
