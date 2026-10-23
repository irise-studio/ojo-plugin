#!/usr/bin/env node

import { mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PROTOCOL = 'generate-state-page-build-gate.v1';
const BLOCKING_KEYS = new Set([
  'loading',
  'isloading',
  'loadingstate',
  'empty',
  'isempty',
  'emptystate',
  'error',
  'iserror',
  'haserror',
  'errorstate',
]);

function usage() {
  return 'Usage: build-local-snapshots.mjs <workspacePath> [--dist <stableDistPath>] [--validate-only] [--json]';
}

function parseArgs(argv) {
  const options = { workspacePath: '', distPath: '', validateOnly: false, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--dist') {
      options.distPath = argv[index + 1] ?? '';
      index += 1;
    } else if (value === '--validate-only') {
      options.validateOnly = true;
    } else if (value === '--json') {
      options.json = true;
    } else if (!value.startsWith('-') && !options.workspacePath) {
      options.workspacePath = value;
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }
  if (!options.workspacePath) throw new Error(usage());
  return options;
}

async function isFile(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function isDirectory(directoryPath) {
  try {
    return (await stat(directoryPath)).isDirectory();
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  try {
    return { value: JSON.parse(await readFile(filePath, 'utf8')), error: null };
  } catch (error) {
    return { value: null, error: error instanceof Error ? error.message : String(error) };
  }
}

function finding(code, message, relativePath) {
  return { code, message, path: relativePath };
}

function normalizeLabel(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/g, '');
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function isBlockingKey(key) {
  return BLOCKING_KEYS.has(String(key).toLowerCase().replace(/[^a-z0-9]+/g, ''));
}

function hasBlockingState(state) {
  return Object.entries(state).some(([key, value]) => value === true && isBlockingKey(key));
}

async function listFiles(root) {
  if (!(await isDirectory(root))) return [];
  const files = [];
  const visit = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === 'dist' || entry.name === 'states' || entry.name === 'node_modules') continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile() && /\.(?:ts|tsx|js|jsx|json)$/.test(entry.name)) files.push(absolute);
    }
  };
  await visit(root);
  return files;
}

function stageNumber(stageId) {
  const match = /^M(\d+)$/i.exec(String(stageId ?? '').trim());
  return match ? Number.parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

function expectedStates(stagePayload, pageId) {
  const candidates = [];
  if (stagePayload && typeof stagePayload === 'object') {
    candidates.push(stagePayload);
    if (stagePayload.page_stage && typeof stagePayload.page_stage === 'object') candidates.push(stagePayload.page_stage);
    if (Array.isArray(stagePayload.page_stages)) candidates.push(...stagePayload.page_stages);
  }
  const stage = candidates.find((item) => String(item?.page_id ?? item?.pageId ?? '').trim() === pageId) ?? candidates[0];
  const values = stage?.state_contract?.expected_states ?? stage?.stateContract?.expectedStates ?? [];
  if (!Array.isArray(values)) return [];
  return values
    .filter((item) => item && typeof item === 'object' && item.required !== false)
    .map((item) => String(item.name ?? item.label ?? '').trim())
    .filter(Boolean);
}

async function sourceEvidence(prototypeRoot, pageId) {
  const roots = [path.join(prototypeRoot, 'src', 'pages', pageId)];
  const entryCandidates = [
    path.join(prototypeRoot, 'src', 'pages', `${pageId}.page.tsx`),
    path.join(prototypeRoot, 'src', 'pages', `${pageId}.page.ts`),
  ];
  const storeRoot = path.join(prototypeRoot, 'src', 'stores');
  if (await isDirectory(storeRoot)) roots.push(storeRoot);
  const files = [];
  for (const root of roots) files.push(...(await listFiles(root)));
  for (const candidate of entryCandidates) if (await isFile(candidate)) files.push(candidate);
  const unique = [...new Set(files)];
  const bodies = await Promise.all(unique.map((file) => readFile(file, 'utf8').catch(() => '')));
  return bodies.join('\n');
}

function validateSnapshots({ payload, pageId, relativePath, sourceText, requiredNames }) {
  const errors = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return [finding('snapshot.object', 'Snapshot file root must be a JSON object.', relativePath)];
  }
  if (String(payload.page ?? '').trim() !== pageId) {
    errors.push(finding('snapshot.page', `Snapshot page must equal ${pageId}.`, relativePath));
  }
  if (!Array.isArray(payload.snapshots) || payload.snapshots.length === 0) {
    errors.push(finding('snapshot.entries', 'Snapshot file must include at least one snapshots entry.', relativePath));
    return errors;
  }

  const ids = [];
  const names = [];
  const states = [];
  const blockingKeys = new Set();
  for (const [index, entry] of payload.snapshots.entries()) {
    const entryPath = `${relativePath}#snapshots[${index}]`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push(finding('snapshot.entry', 'Snapshot entry must be a JSON object.', entryPath));
      continue;
    }
    for (const field of ['id', 'name', 'purpose']) {
      if (!String(entry[field] ?? '').trim()) errors.push(finding(`snapshot.${field}`, `Snapshot entry must include ${field}.`, entryPath));
    }
    if (!['p0', 'p1', 'p2'].includes(String(entry.priority ?? '').trim().toLowerCase())) {
      errors.push(finding('snapshot.priority', 'Snapshot priority must be p0, p1, or p2.', entryPath));
    }
    if (!entry.state || typeof entry.state !== 'object' || Array.isArray(entry.state)) {
      errors.push(finding('snapshot.state', 'Snapshot entry must include state as a JSON object.', entryPath));
      continue;
    }
    ids.push(normalizeLabel(entry.id));
    names.push(normalizeLabel(entry.name));
    states.push(canonical(entry.state));
    for (const [key, value] of Object.entries(entry.state)) {
      if (key === '__irise_snapshot_scenario' || key === '__zk_snapshot_scenario') {
        errors.push(finding('snapshot.marker_state', `Marker-only state key ${key} is forbidden.`, entryPath));
      }
      if (!sourceText.includes(key)) {
        errors.push(finding('snapshot.unconsumed_state', `State key ${key} is not present in current-page source/store evidence.`, entryPath));
      }
      if (value === true && isBlockingKey(key)) blockingKeys.add(key);
    }
  }
  if (ids.length !== new Set(ids).size) errors.push(finding('snapshot.duplicate_id', 'Snapshot ids must be unique.', relativePath));
  if (names.length !== new Set(names).size) errors.push(finding('snapshot.duplicate_name', 'Snapshot names must be unique.', relativePath));
  if (states.length !== new Set(states).size) errors.push(finding('snapshot.duplicate_state', 'Serialized snapshot states must be unique.', relativePath));

  for (const requiredName of requiredNames) {
    if (!payload.snapshots.some((entry) => String(entry?.name ?? '').includes(requiredName))) {
      errors.push(finding('snapshot.expected_state', `Required state name must include the exact phrase: ${requiredName}.`, relativePath));
    }
  }

  if (payload.snapshots.length > 1 && hasBlockingState(payload.snapshots[0]?.state ?? {}) && payload.snapshots.some((entry) => !hasBlockingState(entry?.state ?? {}))) {
    errors.push(finding('snapshot.default_order', 'snapshots[0] must be the normal data-rich render when one exists.', relativePath));
  }
  for (const [index, entry] of payload.snapshots.entries()) {
    const state = entry?.state;
    if (!state || typeof state !== 'object' || Array.isArray(state) || hasBlockingState(state)) continue;
    for (const key of blockingKeys) {
      if (state[key] !== false) {
        errors.push(
          finding(
            'snapshot.blocking_interlock',
            `Normal snapshot must explicitly set ${key}=false because another snapshot sets it true.`,
            `${relativePath}#snapshots[${index}]`,
          ),
        );
      }
    }
  }
  return errors;
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
    return;
  }

  const workspacePath = path.resolve(options.workspacePath);
  const nestedPrototype = path.join(workspacePath, 'prototype');
  const prototypeRoot = (await isFile(path.join(nestedPrototype, 'package.json'))) ? nestedPrototype : workspacePath;
  const distPath = path.resolve(options.distPath || path.join(prototypeRoot, 'dist'));
  const manifestRoot = path.join(prototypeRoot, 'delivery', 'artifacts', 'page-manifests');
  const errors = [];
  const warnings = [];
  const pageGroups = [];

  if (!(await isDirectory(manifestRoot))) {
    errors.push(finding('manifest.missing', 'Missing prototype/delivery/artifacts/page-manifests.', path.relative(workspacePath, manifestRoot)));
  }

  const manifests = [];
  if (await isDirectory(manifestRoot)) {
    for (const name of (await readdir(manifestRoot)).filter((item) => item.endsWith('.json'))) {
      const absolute = path.join(manifestRoot, name);
      const parsed = await readJson(absolute);
      if (parsed.error) {
        errors.push(finding('manifest.json', parsed.error, path.relative(workspacePath, absolute)));
        continue;
      }
      const pageId = String(parsed.value?.page_id ?? '').trim();
      if (!pageId) {
        errors.push(finding('manifest.page_id', 'Page manifest must include page_id.', path.relative(workspacePath, absolute)));
        continue;
      }
      manifests.push({ pageId, stageId: parsed.value?.stage_id, payload: parsed.value });
    }
  }
  manifests.sort((left, right) => stageNumber(left.stageId) - stageNumber(right.stageId) || left.pageId.localeCompare(right.pageId));
  if (manifests.length === 0 && errors.length === 0) {
    errors.push(finding('manifest.empty', 'No page manifests were found.', path.relative(workspacePath, manifestRoot)));
  }

  for (const manifest of manifests) {
    const snapshotPath = path.join(prototypeRoot, 'src', 'pages', manifest.pageId, 'states', `${manifest.pageId}.snapshots.json`);
    const relativePath = path.relative(workspacePath, snapshotPath);
    const parsed = await readJson(snapshotPath);
    if (parsed.error) {
      errors.push(finding('snapshot.missing', parsed.error, relativePath));
      continue;
    }
    const stagePath = path.join(prototypeRoot, 'delivery', 'artifacts', 'page-stages', `${manifest.pageId}.json`);
    const stage = (await isFile(stagePath)) ? await readJson(stagePath) : { value: null, error: null };
    if (stage.error) errors.push(finding('stage.json', stage.error, path.relative(workspacePath, stagePath)));
    const sourceText = await sourceEvidence(prototypeRoot, manifest.pageId);
    if (!sourceText) warnings.push(finding('source.empty', 'No current-page source/store evidence was found.', relativePath));
    errors.push(
      ...validateSnapshots({
        payload: parsed.value,
        pageId: manifest.pageId,
        relativePath,
        sourceText,
        requiredNames: expectedStates(stage.value, manifest.pageId),
      }),
    );
    pageGroups.push(parsed.value);
  }

  const appPath = path.join(prototypeRoot, 'src', 'data', 'app.json');
  const app = await readJson(appPath);
  if (app.error) errors.push(finding('app.json', app.error, path.relative(workspacePath, appPath)));
  const entryPage = String(app.value?.entryPage ?? '').trim() || manifests[0]?.pageId || '';
  const appVersion = String(app.value?.version ?? '').trim();
  if (entryPage && !manifests.some((item) => item.pageId === entryPage)) {
    errors.push(finding('blueprint.entry_page', `entryPage must reference a declared page: ${entryPage}.`, path.relative(workspacePath, appPath)));
  }

  const blueprintPath = path.join(distPath, 'data', 'blueprint.json');
  if (!options.validateOnly) {
    for (const manifest of manifests) {
      const framePath = path.join(distPath, `${manifest.pageId}.html`);
      if (!(await isFile(framePath))) errors.push(finding('dist.frame', `Missing compiled frame ${manifest.pageId}.html.`, path.relative(workspacePath, framePath)));
    }
  }

  let existingVersion = '';
  if (await isFile(blueprintPath)) {
    const existing = await readJson(blueprintPath);
    if (!existing.error) existingVersion = String(existing.value?.version ?? '').trim();
  }

  if (errors.length === 0 && !options.validateOnly) {
    const blueprint = { version: existingVersion || appVersion || '0.1.31', entryPage, snapshots: pageGroups };
    await mkdir(path.dirname(blueprintPath), { recursive: true });
    const temporaryPath = `${blueprintPath}.tmp-${process.pid}-${Date.now()}`;
    await writeFile(temporaryPath, `${JSON.stringify(blueprint, null, 2)}\n`, 'utf8');
    await rename(temporaryPath, blueprintPath);
  }

  const result = {
    ok: errors.length === 0,
    status: errors.length === 0 ? 'passed' : 'failed',
    protocol: PROTOCOL,
    protocolVersion: 1,
    mode: options.validateOnly ? 'validate' : 'build',
    workspacePath,
    prototypeRoot,
    distPath,
    blueprintPath,
    pageIds: manifests.map((item) => item.pageId),
    errors,
    warnings,
  };
  const output = options.json ? JSON.stringify(result) : JSON.stringify(result, null, 2);
  process.stdout.write(`${output}\n`);
  if (!result.ok) process.exitCode = 1;
}

await main();
