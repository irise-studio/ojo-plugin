import assert from "node:assert/strict";
import test from "node:test";
import { checkOjoCli } from "../codex-plugin/scripts/cli-contract.mjs";

const output = 'Usage: ojo workspace sync Usage: ojo project create Usage: ojo prototype validate Usage: ojo prototype build Usage: ojo prototype publish --path <dir> --json --name <name> --project-id <projectId> --message <msg> --mode <mode> --no-open <eventFile>';
function fixture({missing, capabilities = {schemaVersion:2,generation:"next",serviceApi:"server.v1",localPrototypePublishProtocol:1}} = {}) {
  const calls = [];
  return {calls, run(args) {
    calls.push(args);
    if (args[0] === '--version') return '2.0.0-next.13';
    if (args[0] === 'capabilities') return JSON.stringify(capabilities);
    return args.slice(0,-1).join(' ') === missing ? 'unknown command' : output;
  }};
}
test('import requires server.v1 creation and publication on the same next CLI', () => {
  const f = fixture();
  const result = checkOjoCli(f.run,{importProject:true});
  assert.equal(result.ok,true);
  assert.equal(result.importProject,true);
  assert.equal(result.generation,'next');
  assert(f.calls.some(args=>args.join(' ')==='project create --help'));
  assert(f.calls.some(args=>args.join(' ')==='prototype publish --help'));
  assert(!f.calls.some(args=>args.includes('team') || args.includes('import')));
});
test('missing creation or upload stops import even on a compatible next CLI', () => {
  for(const missing of ['project create','prototype publish']) {
    assert.equal(checkOjoCli(fixture({missing}).run,{importProject:true}).ok,false);
  }
});
test('import requires the publication protocol and new service contract', () => {
  for(const capabilities of [
    {schemaVersion:2,generation:'next',serviceApi:'server.v1'},
    {schemaVersion:2,generation:'next',serviceApi:'legacy',localPrototypePublishProtocol:1},
  ]) assert.equal(checkOjoCli(fixture({capabilities}).run,{importProject:true}).ok,false);
});
test('a stale legacy import invocation is rejected before upload discovery', () => {
  const f = fixture();
  assert.equal(checkOjoCli(f.run,{legacyImport:true}).reason,'legacy_import_removed');
  assert.deepEqual(f.calls,[['--version']]);
});
