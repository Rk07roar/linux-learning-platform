import { ShellState, DOLLAR_ESCAPE } from './state';
import { commandRegistry } from './commands';
import { getNode, getParentAndName, file } from './vfs';

/**
 * Tokenize a shell line, respecting single/double quotes. A "$" that appears
 * inside single quotes is replaced with DOLLAR_ESCAPE so later expansion
 * (state.expandVars) leaves it untouched — preserving bash's rule that single
 * quotes suppress variable expansion while double quotes still allow it.
 */
function tokenize(line: string): string[] {
  const tokens: string[] = [];
  let cur = '';
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote) { quote = null; continue; }
      if (quote === "'" && ch === '$') { cur += DOLLAR_ESCAPE; continue; }
      cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === ' ' || ch === '\t') {
      if (cur.length > 0) { tokens.push(cur); cur = ''; }
      continue;
    }
    cur += ch;
  }
  if (cur.length > 0) tokens.push(cur);
  return tokens;
}

function expandVars(token: string, state: ShellState): string {
  return state.expandVars(token);
}

/** Split a token stream on unquoted "|" into pipeline stages. */
function splitPipeline(tokens: string[]): string[][] {
  const stages: string[][] = [[]];
  for (const t of tokens) {
    if (t === '|') stages.push([]);
    else stages[stages.length - 1].push(t);
  }
  return stages;
}

/** Pull a trailing "> file" / ">> file" redirection off the last pipeline stage. */
function extractRedirection(tokens: string[]): { cmdTokens: string[]; redirect: { file: string; append: boolean } | null } {
  const idx = tokens.findIndex((t) => t === '>' || t === '>>');
  if (idx === -1) return { cmdTokens: tokens, redirect: null };
  const target = tokens[idx + 1];
  const append = tokens[idx] === '>>';
  return { cmdTokens: tokens.slice(0, idx), redirect: target ? { file: target, append } : null };
}

function writeRedirect(state: ShellState, target: string, content: string, append: boolean) {
  const segs = state.resolve(target);
  const existing = getNode(state.root, segs);
  if (existing && existing.type === 'dir') return;
  const { parent, name } = getParentAndName(state.root, segs);
  if (!parent) return;
  if (append && existing && existing.type === 'file') {
    existing.content = existing.content + (existing.content && !existing.content.endsWith('\n') ? '\n' : '') + content;
  } else {
    parent.children[name] = file(content, state.currentUser, state.currentUser);
  }
}

// --- bash script interpreter: conditionals, loops, functions, exit codes ---------

type ScriptNode =
  | { kind: 'cmd'; text: string }
  | { kind: 'if'; branches: { cond: string; body: ScriptNode[] }[]; elseBody: ScriptNode[] | null }
  | { kind: 'for'; varName: string; items: string[]; body: ScriptNode[] }
  | { kind: 'while'; cond: string; body: ScriptNode[] }
  | { kind: 'func'; name: string; body: ScriptNode[] };

class ScriptExitSignal {
  constructor(public code: number) {}
}

/** Split a script into statements on unquoted newlines/semicolons, dropping comments and blanks. */
function splitStatements(script: string): string[] {
  const stmts: string[] = [];
  let cur = '';
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < script.length; i++) {
    const ch = script[i];
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    if (ch === '\n' || ch === ';') { stmts.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur.length > 0) stmts.push(cur);
  return stmts.map((s) => s.trim()).filter((s) => s.length > 0 && !s.startsWith('#'));
}

/** Consume a leading keyword from the current statement; if more follows on the same
 * statement (e.g. "then echo hi"), leave the remainder in place for the next parse step. */
function consumeKeyword(stmts: string[], pos: { i: number }, keyword: string) {
  const s = stmts[pos.i];
  if (s === undefined) return;
  if (s === keyword) { pos.i++; return; }
  if (s.startsWith(keyword + ' ')) { stmts[pos.i] = s.slice(keyword.length + 1).trim(); return; }
}

function firstWord(s: string): string {
  return s.split(/\s+/)[0] ?? '';
}

function isFuncDef(s: string): boolean {
  return /^function\s+\w+/.test(s) || /^\w+\s*\(\)\s*\{?$/.test(s);
}

function parseBlock(stmts: string[], pos: { i: number }, terminators: string[]): ScriptNode[] {
  const nodes: ScriptNode[] = [];
  while (pos.i < stmts.length) {
    const s = stmts[pos.i];
    if (terminators.includes(firstWord(s))) break;
    if (firstWord(s) === 'if') { nodes.push(parseIf(stmts, pos)); continue; }
    if (firstWord(s) === 'for') { nodes.push(parseFor(stmts, pos)); continue; }
    if (firstWord(s) === 'while') { nodes.push(parseWhile(stmts, pos)); continue; }
    if (isFuncDef(s)) { nodes.push(parseFunc(stmts, pos)); continue; }
    nodes.push({ kind: 'cmd', text: s });
    pos.i++;
  }
  return nodes;
}

function parseIf(stmts: string[], pos: { i: number }): ScriptNode {
  const branches: { cond: string; body: ScriptNode[] }[] = [];
  let elseBody: ScriptNode[] | null = null;

  let cond = stmts[pos.i].replace(/^if\s+/, '');
  pos.i++;
  consumeKeyword(stmts, pos, 'then');
  branches.push({ cond, body: parseBlock(stmts, pos, ['elif', 'else', 'fi']) });

  while (pos.i < stmts.length && firstWord(stmts[pos.i]) === 'elif') {
    cond = stmts[pos.i].replace(/^elif\s+/, '');
    pos.i++;
    consumeKeyword(stmts, pos, 'then');
    branches.push({ cond, body: parseBlock(stmts, pos, ['elif', 'else', 'fi']) });
  }

  if (pos.i < stmts.length && stmts[pos.i].trim() === 'else') {
    pos.i++;
    elseBody = parseBlock(stmts, pos, ['fi']);
  }
  if (pos.i < stmts.length && stmts[pos.i].trim() === 'fi') pos.i++;

  return { kind: 'if', branches, elseBody };
}

function parseFor(stmts: string[], pos: { i: number }): ScriptNode {
  const s = stmts[pos.i];
  pos.i++;
  const m = /^for\s+(\S+)\s+in\s+(.*)$/.exec(s);
  const varName = m ? m[1] : 'i';
  let itemsPart = m ? m[2] : '';
  itemsPart = itemsPart.replace(/\s+do$/, '').trim();
  const items = tokenize(itemsPart);
  consumeKeyword(stmts, pos, 'do');
  const body = parseBlock(stmts, pos, ['done']);
  if (pos.i < stmts.length && stmts[pos.i].trim() === 'done') pos.i++;
  return { kind: 'for', varName, items, body };
}

function parseWhile(stmts: string[], pos: { i: number }): ScriptNode {
  let cond = stmts[pos.i].replace(/^while\s+/, '');
  pos.i++;
  cond = cond.replace(/\s+do$/, '').trim();
  consumeKeyword(stmts, pos, 'do');
  const body = parseBlock(stmts, pos, ['done']);
  if (pos.i < stmts.length && stmts[pos.i].trim() === 'done') pos.i++;
  return { kind: 'while', cond, body };
}

function parseFunc(stmts: string[], pos: { i: number }): ScriptNode {
  const s = stmts[pos.i];
  pos.i++;
  const m1 = /^function\s+(\w+)/.exec(s);
  const m2 = /^(\w+)\s*\(\)/.exec(s);
  const name = m1 ? m1[1] : m2 ? m2[1] : '';
  if (!s.trim().endsWith('{') && pos.i < stmts.length && stmts[pos.i].trim() === '{') pos.i++;
  const body = parseBlock(stmts, pos, ['}']);
  if (pos.i < stmts.length && stmts[pos.i].trim() === '}') pos.i++;
  return { kind: 'func', name, body };
}

function parseScript(scriptText: string): ScriptNode[] {
  const stmts = splitStatements(scriptText);
  return parseBlock(stmts, { i: 0 }, []);
}

/** Evaluate a `[ ... ]` / `test ...` expression. Supports -eq/-ne/-lt/-le/-gt/-ge,
 * =/==/!=, -z/-n, -f/-d, and "!" negation. */
function evalTest(state: ShellState, tokens: string[]): boolean {
  if (tokens[0] === '!') return !evalTest(state, tokens.slice(1));
  if (tokens.length === 3) {
    const [a, op, b] = tokens;
    switch (op) {
      case '-eq': return parseFloat(a) === parseFloat(b);
      case '-ne': return parseFloat(a) !== parseFloat(b);
      case '-lt': return parseFloat(a) < parseFloat(b);
      case '-le': return parseFloat(a) <= parseFloat(b);
      case '-gt': return parseFloat(a) > parseFloat(b);
      case '-ge': return parseFloat(a) >= parseFloat(b);
      case '=': case '==': return a === b;
      case '!=': return a !== b;
    }
  }
  if (tokens.length === 2) {
    const [op, a] = tokens;
    if (op === '-z') return a.length === 0;
    if (op === '-n') return a.length > 0;
    if (op === '-f') { const node = getNode(state.root, state.resolve(a)); return !!node && node.type === 'file'; }
    if (op === '-d') { const node = getNode(state.root, state.resolve(a)); return !!node && node.type === 'dir'; }
  }
  if (tokens.length === 1) return tokens[0].length > 0;
  return false;
}

function evalCondition(state: ShellState, condRaw: string): boolean {
  const trimmed = condRaw.trim();
  if (trimmed.startsWith('[')) {
    const inner = trimmed.replace(/^\[\[?/, '').replace(/\]\]?$/, '');
    return evalTest(state, tokenize(inner).map((t) => state.expandVars(t)));
  }
  if (/^test\s+/.test(trimmed)) {
    return evalTest(state, tokenize(trimmed.replace(/^test\s+/, '')).map((t) => state.expandVars(t)));
  }
  const output = executeLine(state, trimmed);
  return !(output.startsWith('bash:') || /command not found$/.test(output));
}

/** Run one leaf command line inside a script: exit, function call, or a normal command. */
function runLeaf(state: ShellState, line: string, functions: Record<string, ScriptNode[]>, sink: string[]): { exitScript?: number } {
  const trimmed = line.trim();

  const exitMatch = /^exit(\s+(-?\d+))?$/.exec(trimmed);
  if (exitMatch) {
    const code = exitMatch[2] ? parseInt(exitMatch[2], 10) : 0;
    state.env['__EXIT__'] = String(code);
    return { exitScript: code };
  }

  const name = firstWord(trimmed);
  if (functions[name]) {
    const args = tokenize(trimmed).slice(1).map((a) => state.expandVars(a));
    const saved: Record<string, string | undefined> = { __ARGC__: state.env['__ARGC__'], __ARGV__: state.env['__ARGV__'] };
    for (let k = 1; k <= 9; k++) saved['__POS' + k] = state.env['__POS' + k];
    for (let k = 1; k <= 9; k++) {
      if (args[k - 1] !== undefined) state.env['__POS' + k] = args[k - 1];
      else delete state.env['__POS' + k];
    }
    state.env['__ARGC__'] = String(args.length);
    state.env['__ARGV__'] = args.join(' ');
    try {
      execNodes(state, functions[name], functions, sink);
    } finally {
      for (const k of Object.keys(saved)) {
        if (saved[k] === undefined) delete state.env[k];
        else state.env[k] = saved[k] as string;
      }
    }
    return {};
  }

  const output = executeLine(state, trimmed);
  if (output) sink.push(output);
  const success = !(output.startsWith('bash:') || /command not found$/.test(output));
  state.env['__EXIT__'] = success ? '0' : '1';
  return {};
}

function execNode(state: ShellState, node: ScriptNode, functions: Record<string, ScriptNode[]>, sink: string[]): void {
  switch (node.kind) {
    case 'cmd': {
      const r = runLeaf(state, node.text, functions, sink);
      if (r.exitScript !== undefined) throw new ScriptExitSignal(r.exitScript);
      break;
    }
    case 'if': {
      for (const b of node.branches) {
        if (evalCondition(state, b.cond)) { execNodes(state, b.body, functions, sink); return; }
      }
      if (node.elseBody) execNodes(state, node.elseBody, functions, sink);
      break;
    }
    case 'for': {
      for (const raw of node.items) {
        state.env[node.varName] = state.expandVars(raw);
        execNodes(state, node.body, functions, sink);
      }
      break;
    }
    case 'while': {
      let iterations = 0;
      while (evalCondition(state, node.cond)) {
        execNodes(state, node.body, functions, sink);
        iterations++;
        if (iterations > 500) { sink.push('bash: loop terminated after 500 iterations (safety limit)'); break; }
      }
      break;
    }
    case 'func': {
      functions[node.name] = node.body;
      break;
    }
  }
}

function execNodes(state: ShellState, nodes: ScriptNode[], functions: Record<string, ScriptNode[]>, sink: string[]): void {
  for (const node of nodes) execNode(state, node, functions, sink);
}

function runScript(state: ShellState, scriptArg: string | undefined, scriptArgs: string[] = []): string {
  if (!scriptArg) return 'bash: missing script operand';
  const segs = state.resolve(scriptArg);
  const node = getNode(state.root, segs);
  if (!node) return `bash: ${scriptArg}: No such file or directory`;
  if (node.type !== 'file') return `bash: ${scriptArg}: Is a directory`;

  const scriptNodes = parseScript(node.content);
  const functions: Record<string, ScriptNode[]> = {};
  const sink: string[] = [];

  // Set $1.., $#, $@ for the script's own top-level positional parameters,
  // restoring whatever was there before (e.g. if this script.sh was itself
  // invoked from inside another script or function).
  const saved: Record<string, string | undefined> = { __ARGC__: state.env['__ARGC__'], __ARGV__: state.env['__ARGV__'] };
  for (let k = 1; k <= 9; k++) saved['__POS' + k] = state.env['__POS' + k];
  for (let k = 1; k <= 9; k++) {
    if (scriptArgs[k - 1] !== undefined) state.env['__POS' + k] = scriptArgs[k - 1];
    else delete state.env['__POS' + k];
  }
  state.env['__ARGC__'] = String(scriptArgs.length);
  state.env['__ARGV__'] = scriptArgs.join(' ');

  try {
    execNodes(state, scriptNodes, functions, sink);
  } catch (e) {
    if (!(e instanceof ScriptExitSignal)) throw e;
  } finally {
    for (const k of Object.keys(saved)) {
      if (saved[k] === undefined) delete state.env[k];
      else state.env[k] = saved[k] as string;
    }
  }
  return sink.join('\n');
}

/** Run a single (non-history-recording) shell line: pipeline stages + optional trailing redirect. */
function runLine(state: ShellState, trimmed: string): string {
  const tokens = tokenize(trimmed);
  if (tokens.length === 0) return '';

  // Bare variable assignment, e.g. NAME=value — only meaningful as the whole line.
  if (tokens.length === 1) {
    const assign = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(tokens[0]);
    if (assign) {
      state.env[assign[1]] = state.expandVars(assign[2].replace(/^"(.*)"$/, '$1'));
      return '';
    }
  }

  const stages = splitPipeline(tokens);
  let stdin: string | undefined = undefined;
  let output = '';

  for (let i = 0; i < stages.length; i++) {
    const isLast = i === stages.length - 1;
    let stageTokens = stages[i];
    let redirect: { file: string; append: boolean } | null = null;
    if (isLast) {
      const extracted = extractRedirection(stageTokens);
      stageTokens = extracted.cmdTokens;
      redirect = extracted.redirect;
    }

    let effectiveTokens = stageTokens;
    const firstWordForAlias = stageTokens[0];
    if (firstWordForAlias && state.aliases[firstWordForAlias]) {
      const expansion = tokenize(state.aliases[firstWordForAlias]);
      effectiveTokens = [...expansion, ...stageTokens.slice(1)];
    }
    const [cmdName, ...rawArgs] = effectiveTokens;
    if (!cmdName) { output = ''; continue; }

    if (cmdName === 'bash' || cmdName === 'sh' || cmdName === './script') {
      const scriptArgs = rawArgs.slice(1).map((a) => expandVars(a, state));
      output = runScript(state, rawArgs[0], scriptArgs);
    } else {
      const args = rawArgs.map((a) => expandVars(a, state));
      const handler = commandRegistry[cmdName];
      if (!handler) { output = `${cmdName}: command not found`; stdin = undefined; continue; }
      try {
        output = handler(args, state, stdin);
      } catch (e) {
        output = `${cmdName}: internal error (${(e as Error).message})`;
      }
    }

    if (redirect) {
      writeRedirect(state, state.expandVars(redirect.file), output, redirect.append);
      output = '';
    }
    stdin = output;
  }

  return output;
}

/** Expand bash-style history references ("!!" the previous command, "!n" history entry n). */
function expandHistoryRefs(state: ShellState, raw: string): string {
  const t = raw.trim();
  if (t === '!!') return state.history[state.history.length - 1] ?? raw;
  const m = /^!(\d+)$/.exec(t);
  if (m) {
    const idx = parseInt(m[1], 10) - 1;
    return state.history[idx] ?? raw;
  }
  return raw;
}

/** Execute a single line of shell input against the given state. Returns display text. */
export function executeLine(state: ShellState, raw: string): string {
  const expanded = expandHistoryRefs(state, raw.trim());
  const trimmed = expanded.trim();
  if (trimmed.length === 0) return '';

  state.history.push(trimmed);
  const result = runLine(state, trimmed);
  state.lastOutput = result;
  return result;
}
