# Versioned ComfyUI workflows

The server loads every `*.manifest.json` file in this directory. A manifest
references a ComfyUI graph exported with **Save (API Format)**. The graph itself
is never accepted from a browser request.

To install a workflow:

1. export the tested graph as `name.workflow.json`;
2. copy and rename `wan21-t2v.manifest.example.json` to `name.manifest.json`;
3. map each logical input to the real ComfyUI node id and input name;
4. set `outputNodeIds` to the nodes that expose the final artefact;
5. restart the server and check `GET /api/render/workflows`.

The included example is a manifest template, not a runnable Wan graph. A real
graph depends on the nodes and model files installed on the target ComfyUI
instance.
