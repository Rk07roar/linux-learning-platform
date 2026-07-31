import {
  ShellState, ServiceRecord, GitRepo, GitCommit, DockerImage, DockerContainer, CloudInstance, CloudBucket,
  AttackLogEntry
} from './state';
import {
  DirNode, FileNode, FSNode, dir, file, symlink, followSymlink, maskToPerms,
  formatPath, getNode, getParentAndName, subtreeSize
} from './vfs';

export type CommandFn = (args: string[], state: ShellState, stdin?: string) => string;

// --- small formatting helpers ---------------------------------------------

function err(msg: string): string { return msg; }

function pad(s: string, n: number): string { return s.length >= n ? s : s + ' '.repeat(n - s.length); }

function octalDigitToRwx(d: string): string {
  const n = parseInt(d, 8);
  return (n & 4 ? 'r' : '-') + (n & 2 ? 'w' : '-') + (n & 1 ? 'x' : '-');
}

/** Parse a chmod octal mode: 3 digits (rwx only) or 4 digits (leading digit = setuid/setgid/sticky). */
function octalToPerms(octal: string): { perms: string; special: { setuid: boolean; setgid: boolean; sticky: boolean } } | null {
  if (/^[0-7]{3}$/.test(octal)) {
    return { perms: octal.split('').map(octalDigitToRwx).join(''), special: { setuid: false, setgid: false, sticky: false } };
  }
  if (/^[0-7]{4}$/.test(octal)) {
    const specialDigit = parseInt(octal[0], 8);
    return {
      perms: octal.slice(1).split('').map(octalDigitToRwx).join(''),
      special: { setuid: !!(specialDigit & 4), setgid: !!(specialDigit & 2), sticky: !!(specialDigit & 1) }
    };
  }
  return null;
}

/** Render rwx permissions with setuid/setgid/sticky bits folded in, matching `ls -l` (s/S, t/T). */
function permsWithSpecial(perms: string, special?: { setuid?: boolean; setgid?: boolean; sticky?: boolean }): string {
  const chars = perms.split('');
  if (special?.setuid) chars[2] = chars[2] === 'x' ? 's' : 'S';
  if (special?.setgid) chars[5] = chars[5] === 'x' ? 's' : 'S';
  if (special?.sticky) chars[8] = chars[8] === 'x' ? 't' : 'T';
  return chars.join('');
}

function applySymbolicChmod(current: string, expr: string): string | null {
  const m = /^([ugoa]*)([+\-=])([rwx]+)$/.exec(expr);
  if (!m) return null;
  const [, whoRaw, op, what] = m;
  const who = whoRaw || 'a';
  const targets = new Set<number>();
  if (who.includes('u') || who.includes('a')) targets.add(0);
  if (who.includes('g') || who.includes('a')) targets.add(1);
  if (who.includes('o') || who.includes('a')) targets.add(2);
  const chars = current.split('');
  for (const t of targets) {
    const slice = chars.slice(t * 3, t * 3 + 3);
    const has = { r: slice[0] === 'r', w: slice[1] === 'w', x: slice[2] === 'x' };
    if (op === '+') {
      if (what.includes('r')) has.r = true;
      if (what.includes('w')) has.w = true;
      if (what.includes('x')) has.x = true;
    } else if (op === '-') {
      if (what.includes('r')) has.r = false;
      if (what.includes('w')) has.w = false;
      if (what.includes('x')) has.x = false;
    } else {
      has.r = what.includes('r');
      has.w = what.includes('w');
      has.x = what.includes('x');
    }
    chars[t * 3] = has.r ? 'r' : '-';
    chars[t * 3 + 1] = has.w ? 'w' : '-';
    chars[t * 3 + 2] = has.x ? 'x' : '-';
  }
  return chars.join('');
}

function sizeOf(node: FSNode): number {
  if (node.type === 'file') return node.content.length;
  if (node.type === 'symlink') return node.target.length;
  return Object.keys(node.children).length * 40 + 4096;
}

function lsLine(name: string, node: FSNode): string {
  const typeChar = node.type === 'dir' ? 'd' : node.type === 'symlink' ? 'l' : '-';
  const perms = typeChar + permsWithSpecial(node.perms, node.special);
  const links = node.type === 'dir' ? 2 : 1;
  const size = String(sizeOf(node)).padStart(5, ' ');
  const displayName = node.type === 'symlink' ? `${name} -> ${node.target}` : name;
  return `${perms} ${links} ${node.owner.padEnd(7)} ${node.group.padEnd(7)} ${size} ${node.modified} ${displayName}`;
}

/** Read input lines either from named files in the vfs, or from piped stdin if no files given. */
function readInputLines(args: string[], state: ShellState, stdin?: string): { lines: string[]; errors: string[] } {
  if (args.length === 0) {
    const text = stdin ?? '';
    return { lines: text.length ? text.split('\n') : [], errors: [] };
  }
  const errors: string[] = [];
  const lines: string[] = [];
  for (const a of args) {
    const segs = state.resolve(a);
    let node = getNode(state.root, segs);
    if (node && node.type === 'symlink') node = followSymlink(state.root, node);
    if (!node) { errors.push(`cannot open '${a}': No such file or directory`); continue; }
    if (node.type === 'dir') { errors.push(`'${a}': Is a directory`); continue; }
    lines.push(...node.content.replace(/\n$/, '').split('\n'));
  }
  return { lines, errors };
}

// --- individual commands ----------------------------------------------------

const pwd: CommandFn = (_args, state) => state.pwd;

const whoami: CommandFn = (_args, state) => state.currentUser;

// Note: args arriving here have already been through one expandVars pass in
// parser.ts's runLine before dispatch, including restoring any "$" that a
// single-quoted segment protected from expansion — so commands must NOT
// expand args a second time, or that protection would be silently undone.
const echo: CommandFn = (args) => args.join(' ');

const exportCmd: CommandFn = (args, state) => {
  if (args.length === 0) return Object.entries(state.env).map(([k, v]) => `declare -x ${k}="${v}"`).join('\n');
  for (const a of args) {
    const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(a);
    if (m) state.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
  }
  return '';
};

const trueCmd: CommandFn = (_args, state) => { state.env['__EXIT__'] = '0'; return ''; };
const falseCmd: CommandFn = (_args, state) => { state.env['__EXIT__'] = '1'; return ''; };

/** Evaluate `test`/`[ ]`-style comparison tokens. Mirrors the evaluator the script
 * interpreter (parser.ts) uses for if/while conditions, kept as a small standalone
 * copy here so this file and parser.ts don't need to import from each other. */
function evalTestTokens(state: ShellState, tokens: string[]): boolean {
  if (tokens[0] === '!') return !evalTestTokens(state, tokens.slice(1));
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

const testCmd: CommandFn = (args, state) => {
  const tokens = args[args.length - 1] === ']' ? args.slice(0, -1) : args;
  const success = evalTestTokens(state, tokens);
  state.env['__EXIT__'] = success ? '0' : '1';
  return '';
};

const envCmd: CommandFn = (_args, state) => Object.entries(state.env).map(([k, v]) => `${k}=${v}`).join('\n');

const historyCmd: CommandFn = (_args, state) =>
  state.history.map((h, i) => `  ${String(i + 1).padStart(3, ' ')}  ${h}`).join('\n');

const clearMarker: CommandFn = () => '\x1bCLEAR\x1b';

const cd: CommandFn = (args, state) => {
  const target = args[0] ?? '~';
  const segs = state.resolve(target);
  let node = segs.length === 0 ? state.root : getNode(state.root, segs);
  if (node && node.type === 'symlink') node = followSymlink(state.root, node);
  if (!node) return err(`bash: cd: ${target}: No such file or directory`);
  if (node.type !== 'dir') return err(`bash: cd: ${target}: Not a directory`);
  state.cwd = segs;
  state.syncPwdEnv();
  return '';
};

const ls: CommandFn = (args, state) => {
  const flags = args.filter((a) => a.startsWith('-')).join('');
  const targets = args.filter((a) => !a.startsWith('-'));
  const showAll = flags.includes('a');
  const long = flags.includes('l');

  const listDir = (segs: string[], label: string | null): string => {
    const node = segs.length === 0 ? state.root : getNode(state.root, segs);
    if (!node) return err(`ls: cannot access '${label ?? formatPath(segs)}': No such file or directory`);
    if (node.type === 'file' || node.type === 'symlink') {
      const baseName = label ?? (segs.length ? segs[segs.length - 1] : formatPath(segs));
      return long ? lsLine(baseName, node) : baseName;
    }
    const entries = Object.entries(node.children).filter(([name]) => showAll || !name.startsWith('.'));
    entries.sort(([a], [b]) => a.localeCompare(b));
    if (!long) return entries.map(([name, n]) => (n.type === 'dir' ? name + '/' : name)).join('  ');
    const header = `total ${entries.length}`;
    const lines = entries.map(([name, n]) => lsLine(n.type === 'dir' ? name + '/' : name, n));
    return [header, ...lines].join('\n');
  };

  if (targets.length === 0) return listDir(state.cwd, null);
  const outputs = targets.map((t) => listDir(state.resolve(t), targets.length > 1 ? t : null));
  return outputs.join('\n\n');
};

const cat: CommandFn = (args, state, stdin) => {
  if (args.length === 0) return stdin ?? '';
  const outputs: string[] = [];
  for (const a of args) {
    const segs = state.resolve(a);
    let node = getNode(state.root, segs);
    if (node && node.type === 'symlink') node = followSymlink(state.root, node);
    if (!node) { outputs.push(err(`cat: ${a}: No such file or directory`)); continue; }
    if (node.type === 'dir') { outputs.push(err(`cat: ${a}: Is a directory`)); continue; }
    outputs.push(node.content.replace(/\n$/, ''));
  }
  return outputs.join('\n');
};

const ln: CommandFn = (args, state) => {
  const flags = args.filter((a) => a.startsWith('-'));
  const targets = args.filter((a) => !a.startsWith('-'));
  const symbolic = flags.some((f) => f.includes('s'));
  if (targets.length < 2) return err('ln: missing file operand');
  const [srcArg, linkArg] = targets;
  const srcSegs = state.resolve(srcArg);
  const srcNode = getNode(state.root, srcSegs);
  if (!srcNode) return err(`ln: failed to access '${srcArg}': No such file or directory`);
  const linkSegs = state.resolve(linkArg);
  const { parent, name } = getParentAndName(state.root, linkSegs);
  if (!parent) return err(`ln: failed to create link '${linkArg}': No such file or directory`);
  if (parent.children[name]) return err(`ln: failed to create link '${linkArg}': File exists`);
  if (symbolic) {
    parent.children[name] = symlink(formatPath(srcSegs), state.currentUser, state.currentUser);
  } else {
    // Simplified hard link: alias the same node object so edits to either name affect both.
    parent.children[name] = srcNode;
  }
  return '';
};

const umaskCmd: CommandFn = (args, state) => {
  if (args.length === 0) return state.umask;
  const val = args[0];
  if (!/^[0-7]{3,4}$/.test(val)) return err(`umask: ${val}: octal number required`);
  state.umask = val.length === 4 ? val.slice(1) : val;
  return '';
};

const fdisk: CommandFn = (args, state) => {
  if (args.includes('-l') || args.length === 0) {
    const lines: string[] = [];
    for (const [dev, sizeGB] of Object.entries(AVAILABLE_DISKS)) {
      lines.push(`Disk ${dev}: ${sizeGB} GiB, ${sizeGB * 1073741824} bytes`);
      const fsType = state.filesystems[dev + '1'];
      if (fsType) lines.push(`${dev}1${' '.repeat(Math.max(1, 12 - dev.length))}Linux filesystem (${fsType})`);
    }
    return lines.join('\n');
  }
  const dev = args[0];
  if (!(dev in AVAILABLE_DISKS)) return err(`fdisk: cannot open ${dev}: No such file or directory`);
  return [
    `Welcome to fdisk (simulated).`,
    `Device ${dev}: ${AVAILABLE_DISKS[dev]} GiB.`,
    `Command (m for help): use 'mkfs -t <type> ${dev}1' to format a partition in this lab.`
  ].join('\n');
};

const parted: CommandFn = (args, state) => {
  const dev = args.find((a) => a.startsWith('/dev/'));
  if (!dev) return err('parted: no device specified. Usage: parted /dev/sdb');
  if (!(dev in AVAILABLE_DISKS)) return err(`parted: ${dev}: No such file or directory`);
  return [
    `Model: Virtual disk (simulated)`,
    `Disk ${dev}: ${AVAILABLE_DISKS[dev]}GB`,
    `Partition Table: gpt`,
    ``,
    `Number  Start  End    Size   File system  Name  Flags`,
    ` 1      1MiB   ${AVAILABLE_DISKS[dev]}GB  ${AVAILABLE_DISKS[dev]}GB  ${state.filesystems[dev + '1'] ?? ''}`
  ].join('\n');
};

const mkfs: CommandFn = (args, state) => {
  let fsType = 'ext4';
  const tIdx = args.findIndex((a) => a === '-t');
  if (tIdx !== -1 && args[tIdx + 1]) fsType = args[tIdx + 1];
  const mkfsAlias = args.find((a) => /^mkfs\.\w+$/.test(a));
  if (mkfsAlias) fsType = mkfsAlias.split('.')[1];
  const dev = args.find((a) => a.startsWith('/dev/'));
  if (!dev) return err('mkfs: missing device operand');
  const baseDev = dev.replace(/\d+$/, '');
  if (!(baseDev in AVAILABLE_DISKS)) return err(`mkfs: ${dev}: No such file or directory`);
  state.filesystems[dev] = fsType;
  return [
    `mke2fs (simulated) creating filesystem with ${AVAILABLE_DISKS[baseDev] * 1000} 1k blocks`,
    `Filesystem label=`,
    `OS type: Linux`,
    `Creating filesystem with type ${fsType} on ${dev}.`,
    ``,
    `Allocating group tables: done`,
    `Writing inode tables: done`,
    `Writing superblocks and filesystem accounting information: done`
  ].join('\n');
};

const mkdir: CommandFn = (args, state) => {
  const flags = args.filter((a) => a.startsWith('-'));
  const targets = args.filter((a) => !a.startsWith('-'));
  const parents = flags.some((f) => f.includes('p'));
  const results: string[] = [];
  for (const t of targets) {
    const segs = state.resolve(t);
    if (segs.length === 0) { results.push(err(`mkdir: cannot create directory '${t}': File exists`)); continue; }
    const { parent, name } = getParentAndName(state.root, segs);
    if (!parent) {
      if (parents) {
        // create intermediate dirs
        let cur: DirNode = state.root;
        for (const seg of segs) {
          if (!cur.children[seg]) cur.children[seg] = dir({}, state.currentUser, state.currentUser, maskToPerms('777', state.umask));
          const next = cur.children[seg];
          if (next.type !== 'dir') { results.push(err(`mkdir: cannot create directory '${t}': Not a directory`)); break; }
          cur = next;
        }
        continue;
      }
      results.push(err(`mkdir: cannot create directory '${t}': No such file or directory`));
      continue;
    }
    if (parent.children[name]) { results.push(err(`mkdir: cannot create directory '${t}': File exists`)); continue; }
    parent.children[name] = dir({}, state.currentUser, state.currentUser, maskToPerms('777', state.umask));
  }
  return results.join('\n');
};

const touch: CommandFn = (args, state) => {
  const results: string[] = [];
  for (const t of args) {
    const segs = state.resolve(t);
    const existing = getNode(state.root, segs);
    if (existing) continue;
    const { parent, name } = getParentAndName(state.root, segs);
    if (!parent) { results.push(err(`touch: cannot touch '${t}': No such file or directory`)); continue; }
    parent.children[name] = file('', state.currentUser, state.currentUser, maskToPerms('666', state.umask));
  }
  return results.join('\n');
};

const rm: CommandFn = (args, state) => {
  const flags = args.filter((a) => a.startsWith('-'));
  const targets = args.filter((a) => !a.startsWith('-'));
  const recursive = flags.some((f) => f.includes('r') || f.includes('R'));
  const results: string[] = [];
  for (const t of targets) {
    const segs = state.resolve(t);
    const node = getNode(state.root, segs);
    if (!node) { results.push(err(`rm: cannot remove '${t}': No such file or directory`)); continue; }
    if (node.type === 'dir' && !recursive) { results.push(err(`rm: cannot remove '${t}': Is a directory`)); continue; }
    const { parent, name } = getParentAndName(state.root, segs);
    if (!parent) { results.push(err(`rm: cannot remove '${t}': Operation not permitted`)); continue; }
    delete parent.children[name];
  }
  return results.join('\n');
};

function cloneNode(node: FSNode, owner: string): FSNode {
  if (node.type === 'file') return { ...node, owner };
  if (node.type === 'symlink') return { ...node, owner };
  const children: Record<string, FSNode> = {};
  for (const [k, v] of Object.entries(node.children)) children[k] = cloneNode(v, owner);
  return { ...node, owner, children };
}

const cp: CommandFn = (args, state) => {
  const flags = args.filter((a) => a.startsWith('-'));
  const targets = args.filter((a) => !a.startsWith('-'));
  const recursive = flags.some((f) => f.includes('r') || f.includes('R'));
  if (targets.length < 2) return err('cp: missing destination file operand');
  const [srcArg, destArg] = targets;
  const srcSegs = state.resolve(srcArg);
  const srcNode = getNode(state.root, srcSegs);
  if (!srcNode) return err(`cp: cannot stat '${srcArg}': No such file or directory`);
  if (srcNode.type === 'dir' && !recursive) return err(`cp: -r not specified; omitting directory '${srcArg}'`);
  let destSegs = state.resolve(destArg);
  const destNode = getNode(state.root, destSegs);
  if (destNode && destNode.type === 'dir') {
    destSegs = [...destSegs, srcSegs[srcSegs.length - 1]];
  }
  const { parent, name } = getParentAndName(state.root, destSegs);
  if (!parent) return err(`cp: cannot create '${destArg}': No such file or directory`);
  parent.children[name] = cloneNode(srcNode, state.currentUser);
  return '';
};

const mv: CommandFn = (args, state) => {
  const targets = args.filter((a) => !a.startsWith('-'));
  if (targets.length < 2) return err('mv: missing destination file operand');
  const [srcArg, destArg] = targets;
  const srcSegs = state.resolve(srcArg);
  const srcNode = getNode(state.root, srcSegs);
  if (!srcNode) return err(`mv: cannot stat '${srcArg}': No such file or directory`);
  let destSegs = state.resolve(destArg);
  const destNode = getNode(state.root, destSegs);
  if (destNode && destNode.type === 'dir') destSegs = [...destSegs, srcSegs[srcSegs.length - 1]];
  const { parent: destParent, name: destName } = getParentAndName(state.root, destSegs);
  const { parent: srcParent, name: srcName } = getParentAndName(state.root, srcSegs);
  if (!destParent || !srcParent) return err(`mv: cannot move '${srcArg}' to '${destArg}'`);
  destParent.children[destName] = srcNode;
  delete srcParent.children[srcName];
  return '';
};

const chmod: CommandFn = (args, state) => {
  const [mode, ...targets] = args;
  if (!mode || targets.length === 0) return err('chmod: missing operand');
  const results: string[] = [];
  for (const t of targets) {
    const segs = state.resolve(t);
    const node = getNode(state.root, segs);
    if (!node) { results.push(err(`chmod: cannot access '${t}': No such file or directory`)); continue; }
    const parsed = octalToPerms(mode);
    if (parsed) { node.perms = parsed.perms; node.special = parsed.special; continue; }
    const symbolic = applySymbolicChmod(node.perms, mode);
    if (symbolic) { node.perms = symbolic; continue; }
    results.push(err(`chmod: invalid mode: '${mode}'`));
  }
  return results.join('\n');
};

const chown: CommandFn = (args, state) => {
  const [ownerSpec, ...targets] = args;
  if (!ownerSpec || targets.length === 0) return err('chown: missing operand');
  const [owner, group] = ownerSpec.split(':');
  const results: string[] = [];
  for (const t of targets) {
    const segs = state.resolve(t);
    const node = getNode(state.root, segs);
    if (!node) { results.push(err(`chown: cannot access '${t}': No such file or directory`)); continue; }
    node.owner = owner;
    if (group) node.group = group;
  }
  return results.join('\n');
};

const id: CommandFn = (args, state) => {
  const user = args[0] ?? state.currentUser;
  const rec = state.users[user];
  if (!rec) return err(`id: '${user}': no such user`);
  const groupList = rec.groups.map((g, i) => `${rec.gid + i}(${g})`).join(',');
  return `uid=${rec.uid}(${user}) gid=${rec.gid}(${rec.groups[0]}) groups=${groupList}`;
};

const groupsCmd: CommandFn = (args, state) => {
  const user = args[0] ?? state.currentUser;
  const rec = state.users[user];
  if (!rec) return err(`groups: '${user}': no such user`);
  return rec.groups.join(' ');
};

const useradd: CommandFn = (args, state) => {
  const flags = args.filter((a) => a.startsWith('-'));
  const targets = args.filter((a) => !a.startsWith('-'));
  const makeHome = flags.includes('-m');
  const username = targets[0];
  if (!username) return err('useradd: missing username');
  if (state.users[username]) return err(`useradd: user '${username}' already exists`);
  const uid = 1001 + Object.keys(state.users).length;
  state.users[username] = { uid, gid: uid, groups: [username], home: `/home/${username}` };
  if (makeHome || true) {
    const homeDir = getNode(state.root, ['home']) as DirNode;
    if (homeDir && homeDir.type === 'dir') {
      homeDir.children[username] = dir({}, username, username, 'rwxr-xr-x');
    }
  }
  return '';
};

const passwdCmd: CommandFn = (args, state) => {
  const user = args[0] ?? state.currentUser;
  if (!state.users[user]) return err(`passwd: user '${user}' does not exist`);
  return `passwd: password updated successfully for ${user}`;
};

const apt: CommandFn = (args, state) => {
  const [sub, ...rest] = args;
  if (sub === 'update') {
    state.aptUpdated = true;
    return 'Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease\nReading package lists... Done';
  }
  if (sub === 'install') {
    if (rest.length === 0) return err('E: You must specify a package to install');
    const lines: string[] = [];
    for (const pkg of rest) {
      if (!state.availablePackages.has(pkg)) { lines.push(`E: Unable to locate package ${pkg}`); continue; }
      if (state.installedPackages.has(pkg)) { lines.push(`${pkg} is already the newest version.`); continue; }
      state.installedPackages.add(pkg);
      lines.push(`Setting up ${pkg} ...`);
    }
    return lines.join('\n');
  }
  if (sub === 'remove' || sub === 'purge') {
    const lines: string[] = [];
    for (const pkg of rest) {
      if (!state.installedPackages.has(pkg)) { lines.push(`Package '${pkg}' is not installed, so not removed`); continue; }
      state.installedPackages.delete(pkg);
      lines.push(`Removing ${pkg} ...`);
    }
    return lines.join('\n');
  }
  if (sub === 'list') {
    if (rest.includes('--installed')) return [...state.installedPackages].sort().map((p) => `${p}/jammy,now`).join('\n');
    return [...state.availablePackages].sort().map((p) => `${p}/jammy${state.installedPackages.has(p) ? ',now' : ''}`).join('\n');
  }
  return err(`apt: invalid operation '${sub ?? ''}'`);
};

const uname: CommandFn = (args) => {
  if (args.includes('-a')) return 'Linux linuxlab 5.15.0-101-generic #111-Ubuntu SMP x86_64 GNU/Linux';
  if (args.includes('-r')) return '5.15.0-101-generic';
  return 'Linux';
};

const lsbRelease: CommandFn = (args) => {
  if (args.includes('-a') || args.length === 0) {
    return [
      'Distributor ID:\tUbuntu',
      'Description:\tUbuntu 22.04 LTS',
      'Release:\t22.04',
      'Codename:\tjammy'
    ].join('\n');
  }
  return 'Ubuntu';
};

// --- text processing & pipes ------------------------------------------------

const grep: CommandFn = (args, state, stdin) => {
  const flags = args.filter((a) => a.startsWith('-') && a !== '-');
  const rest = args.filter((a) => !a.startsWith('-'));
  const ignoreCase = flags.some((f) => f.includes('i'));
  const invert = flags.some((f) => f.includes('v'));
  const showLineNum = flags.some((f) => f.includes('n'));
  const [pattern, ...files] = rest;
  if (!pattern) return err('Usage: grep [-inv] PATTERN [file...]');
  let re: RegExp;
  try { re = new RegExp(pattern, ignoreCase ? 'i' : ''); } catch { return err(`grep: invalid pattern '${pattern}'`); }
  const { lines, errors } = readInputLines(files, state, stdin);
  const matched: string[] = [];
  lines.forEach((line, i) => {
    if (re.test(line) !== invert) matched.push(showLineNum ? `${i + 1}:${line}` : line);
  });
  return [...errors.map((e) => err(`grep: ${e}`)), ...matched].join('\n');
};

const sortCmd: CommandFn = (args, state, stdin) => {
  const flags = args.filter((a) => a.startsWith('-'));
  const files = args.filter((a) => !a.startsWith('-'));
  const reverse = flags.some((f) => f.includes('r'));
  const numeric = flags.some((f) => f.includes('n'));
  const { lines, errors } = readInputLines(files, state, stdin);
  const sorted = [...lines].sort((a, b) => (numeric ? parseFloat(a) - parseFloat(b) : a.localeCompare(b)));
  if (reverse) sorted.reverse();
  return [...errors.map((e) => err(`sort: ${e}`)), ...sorted].join('\n');
};

const uniqCmd: CommandFn = (args, state, stdin) => {
  const flags = args.filter((a) => a.startsWith('-'));
  const files = args.filter((a) => !a.startsWith('-'));
  const showCount = flags.some((f) => f.includes('c'));
  const { lines, errors } = readInputLines(files, state, stdin);
  const out: string[] = [];
  let prev: string | null = null;
  let count = 0;
  for (const line of lines) {
    if (line === prev) { count++; continue; }
    if (prev !== null) out.push(showCount ? `${String(count).padStart(4, ' ')} ${prev}` : prev);
    prev = line;
    count = 1;
  }
  if (prev !== null) out.push(showCount ? `${String(count).padStart(4, ' ')} ${prev}` : prev);
  return [...errors.map((e) => err(`uniq: ${e}`)), ...out].join('\n');
};

const wcCmd: CommandFn = (args, state, stdin) => {
  const flags = args.filter((a) => a.startsWith('-'));
  const files = args.filter((a) => !a.startsWith('-'));
  const only = flags.find((f) => f === '-l' || f === '-w' || f === '-c');
  const { lines, errors } = readInputLines(files, state, stdin);
  const text = lines.join('\n');
  const lineCount = lines.length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const charCount = text.length;
  const label = files.length === 1 ? ` ${files[0]}` : '';
  let numbers: string;
  if (only === '-l') numbers = String(lineCount);
  else if (only === '-w') numbers = String(wordCount);
  else if (only === '-c') numbers = String(charCount);
  else numbers = `${lineCount} ${wordCount} ${charCount}`;
  return [...errors.map((e) => err(`wc: ${e}`)), `${numbers}${label}`].join('\n');
};

function parseHeadTailArgs(args: string[]): { n: number; files: string[] } {
  let n = 10;
  const nIdx = args.findIndex((a) => a === '-n');
  if (nIdx !== -1 && args[nIdx + 1]) {
    n = parseInt(args[nIdx + 1], 10) || 10;
    return { n, files: args.filter((_, i) => i !== nIdx && i !== nIdx + 1) };
  }
  const shorthand = args.find((a) => /^-\d+$/.test(a));
  if (shorthand) {
    n = parseInt(shorthand, 10);
    return { n, files: args.filter((a) => a !== shorthand) };
  }
  return { n, files: args.filter((a) => !a.startsWith('-')) };
}

const headCmd: CommandFn = (args, state, stdin) => {
  const { n, files } = parseHeadTailArgs(args);
  const { lines, errors } = readInputLines(files.filter((a) => !a.startsWith('-')), state, stdin);
  return [...errors.map((e) => err(`head: ${e}`)), ...lines.slice(0, n)].join('\n');
};

const tailCmd: CommandFn = (args, state, stdin) => {
  const { n, files } = parseHeadTailArgs(args);
  const { lines, errors } = readInputLines(files.filter((a) => !a.startsWith('-')), state, stdin);
  return [...errors.map((e) => err(`tail: ${e}`)), ...lines.slice(-n)].join('\n');
};

const cutCmd: CommandFn = (args, state, stdin) => {
  const dIdx = args.findIndex((a) => a === '-d');
  const delim = dIdx !== -1 ? args[dIdx + 1] : '\t';
  const fIdx = args.findIndex((a) => a === '-f');
  const fieldsSpec = fIdx !== -1 ? args[fIdx + 1] : null;
  if (!fieldsSpec) return err('cut: you must specify a field list with -f');
  const fields = fieldsSpec.split(',').map((f) => parseInt(f, 10));
  const skip = new Set([dIdx, dIdx + 1, fIdx, fIdx + 1]);
  const files = args.filter((a, i) => !skip.has(i) && !a.startsWith('-'));
  const { lines, errors } = readInputLines(files, state, stdin);
  const out = lines.map((line) => {
    const parts = line.split(delim);
    return fields.map((f) => parts[f - 1] ?? '').join(delim);
  });
  return [...errors.map((e) => err(`cut: ${e}`)), ...out].join('\n');
};

const sedCmd: CommandFn = (args, state, stdin) => {
  const expr = args.find((a) => a.startsWith('s/') || a.startsWith('s|'));
  if (!expr) return err('sed: no script specified (expected s/pattern/replacement/)');
  const files = args.filter((a) => a !== expr && !a.startsWith('-'));
  const delim = expr[1];
  const parts = expr.split(delim);
  if (parts.length < 3) return err(`sed: invalid expression '${expr}'`);
  const [, pattern, replacement = '', flagsPart = ''] = parts;
  const global = flagsPart.includes('g');
  let re: RegExp;
  try { re = new RegExp(pattern, global ? 'g' : ''); } catch { return err(`sed: invalid pattern '${pattern}'`); }
  const { lines, errors } = readInputLines(files, state, stdin);
  const out = lines.map((l) => l.replace(re, replacement));
  return [...errors.map((e) => err(`sed: ${e}`)), ...out].join('\n');
};

const teeCmd: CommandFn = (args, state, stdin) => {
  const flags = args.filter((a) => a.startsWith('-'));
  const files = args.filter((a) => !a.startsWith('-'));
  const append = flags.some((f) => f.includes('a'));
  const text = stdin ?? '';
  for (const f of files) {
    const segs = state.resolve(f);
    const existing = getNode(state.root, segs);
    if (existing && existing.type === 'dir') continue;
    const { parent, name } = getParentAndName(state.root, segs);
    if (!parent) continue;
    if (append && existing && existing.type === 'file') {
      existing.content = existing.content + (existing.content && !existing.content.endsWith('\n') ? '\n' : '') + text;
    } else {
      parent.children[name] = file(text, state.currentUser, state.currentUser);
    }
  }
  return text;
};

const findCmd: CommandFn = (args, state) => {
  const startArg = args.find((a) => !a.startsWith('-')) ?? '.';
  const nameIdx = args.findIndex((a) => a === '-name');
  const namePattern = nameIdx !== -1 ? args[nameIdx + 1] : null;
  const typeIdx = args.findIndex((a) => a === '-type');
  const typeFilter = typeIdx !== -1 ? args[typeIdx + 1] : null;
  const startSegs = state.resolve(startArg);
  const startNode = getNode(state.root, startSegs);
  if (!startNode) return err(`find: '${startArg}': No such file or directory`);

  const globToRegExp = (pattern: string) =>
    new RegExp('^' + pattern.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
  const nameRe = namePattern ? globToRegExp(namePattern) : null;

  const results: string[] = [];
  const walk = (node: FSNode, name: string, displayPath: string) => {
    const typeOk = !typeFilter || (typeFilter === 'f' && node.type === 'file') || (typeFilter === 'd' && node.type === 'dir');
    const nameOk = !nameRe || nameRe.test(name);
    if (typeOk && nameOk) results.push(displayPath);
    if (node.type === 'dir') {
      const entries = Object.entries(node.children).sort(([a], [b]) => a.localeCompare(b));
      for (const [childName, child] of entries) {
        walk(child, childName, `${displayPath}/${childName}`);
      }
    }
  };
  walk(startNode, startSegs[startSegs.length - 1] ?? startArg, startArg);
  return results.join('\n');
};

// --- archiving, compression & transfer (Module 5) ---------------------------

/** Marker prefix stored in the content of a simulated archive file, so tar/zip
 * commands can tell a real text file apart from one they created. */
const ARCHIVE_MARKER = '__LINUXLAB_ARCHIVE__';
const GZIP_MARKER = '__LINUXLAB_GZIP__';

interface ArchiveEntry { path: string; isDir: boolean; content: string; perms: string; owner: string; group: string; }

function collectEntries(node: FSNode, basePath: string, out: ArchiveEntry[]) {
  if (node.type === 'symlink') return;
  if (node.type === 'file') {
    out.push({ path: basePath, isDir: false, content: node.content, perms: node.perms, owner: node.owner, group: node.group });
    return;
  }
  out.push({ path: basePath, isDir: true, content: '', perms: node.perms, owner: node.owner, group: node.group });
  for (const [name, child] of Object.entries(node.children)) {
    collectEntries(child, basePath ? `${basePath}/${name}` : name, out);
  }
}

function packArchive(entries: ArchiveEntry[]): string {
  return ARCHIVE_MARKER + JSON.stringify(entries);
}

function unpackArchive(content: string): ArchiveEntry[] | null {
  if (!content.startsWith(ARCHIVE_MARKER)) return null;
  try { return JSON.parse(content.slice(ARCHIVE_MARKER.length)); } catch { return null; }
}

function extractEntries(state: ShellState, entries: ArchiveEntry[], destSegs: string[]): void {
  for (const entry of entries) {
    const segs = [...destSegs, ...entry.path.split('/').filter((p) => p.length > 0)];
    if (entry.isDir) {
      const { parent, name } = getParentAndName(state.root, segs);
      if (parent && name && !parent.children[name]) {
        parent.children[name] = dir({}, entry.owner, entry.group, entry.perms);
      }
      continue;
    }
    const { parent, name } = getParentAndName(state.root, segs);
    if (!parent) continue;
    parent.children[name] = file(entry.content, entry.owner, entry.group, entry.perms);
  }
}

function archiveFlagsAndFiles(args: string[]): { flags: string; rest: string[] } {
  // Support both "tar -czvf archive.tar.gz files..." and "tar czvf archive.tar.gz files...".
  const flagsArg = args.find((a) => /^-?[a-zA-Z]+$/.test(a) && !a.includes('/'));
  const flags = flagsArg ? flagsArg.replace(/^-/, '') : '';
  const rest = args.filter((a) => a !== flagsArg);
  return { flags, rest };
}

const tarCmd: CommandFn = (args, state) => {
  const { flags, rest } = archiveFlagsAndFiles(args);
  const create = flags.includes('c');
  const extract = flags.includes('x');
  const list = flags.includes('t');
  const verbose = flags.includes('v');
  const fIdx = flags.indexOf('f');
  const archiveArg = fIdx !== -1 ? rest[0] : rest.find((a) => /\.(tar|tar\.gz|tgz)$/.test(a));
  if (!archiveArg) return err('tar: refusing to bind to stdin/stdout, specify a file with -f');
  const archiveSegs = state.resolve(archiveArg);

  if (create) {
    const targets = rest.filter((a) => a !== archiveArg);
    if (targets.length === 0) return err('tar: no files or directories specified');
    const entries: ArchiveEntry[] = [];
    for (const t of targets) {
      const segs = state.resolve(t);
      const node = getNode(state.root, segs);
      if (!node) return err(`tar: ${t}: Cannot stat: No such file or directory`);
      collectEntries(node, segs[segs.length - 1] ?? t, entries);
    }
    const { parent, name } = getParentAndName(state.root, archiveSegs);
    if (!parent) return err(`tar: ${archiveArg}: Cannot create archive`);
    parent.children[name] = file(packArchive(entries), state.currentUser, state.currentUser);
    return verbose ? entries.map((e) => e.path + (e.isDir ? '/' : '')).join('\n') : '';
  }

  const archiveNode = getNode(state.root, archiveSegs);
  if (!archiveNode || archiveNode.type !== 'file') return err(`tar: ${archiveArg}: Cannot open: No such file or directory`);
  const entries = unpackArchive(archiveNode.content);
  if (!entries) return err(`tar: ${archiveArg}: This does not look like a tar archive`);

  if (list) return entries.map((e) => e.path + (e.isDir ? '/' : '')).join('\n');
  if (extract) {
    extractEntries(state, entries, state.cwd);
    return verbose ? entries.map((e) => e.path + (e.isDir ? '/' : '')).join('\n') : '';
  }
  return err('tar: you must specify one of -c, -x, or -t');
};

const gzipCmd: CommandFn = (args, state) => {
  const flags = args.filter((a) => a.startsWith('-'));
  const targets = args.filter((a) => !a.startsWith('-'));
  const keep = flags.some((f) => f.includes('k'));
  const decompress = flags.some((f) => f.includes('d'));
  if (decompress) return gunzipCmd(args, state);
  const results: string[] = [];
  for (const t of targets) {
    const segs = state.resolve(t);
    const node = getNode(state.root, segs);
    if (!node || node.type !== 'file') { results.push(err(`gzip: ${t}: No such file or directory`)); continue; }
    const { parent, name } = getParentAndName(state.root, segs);
    if (!parent) continue;
    parent.children[name + '.gz'] = file(GZIP_MARKER + node.content, state.currentUser, state.currentUser);
    if (!keep) delete parent.children[name];
  }
  return results.join('\n');
};

const gunzipCmd: CommandFn = (args, state) => {
  const flags = args.filter((a) => a.startsWith('-'));
  const targets = args.filter((a) => !a.startsWith('-'));
  const keep = flags.some((f) => f.includes('k'));
  const results: string[] = [];
  for (const t of targets) {
    const segs = state.resolve(t);
    const node = getNode(state.root, segs);
    if (!node || node.type !== 'file' || !node.content.startsWith(GZIP_MARKER)) {
      results.push(err(`gzip: ${t}: not in gzip format`));
      continue;
    }
    const original = node.content.slice(GZIP_MARKER.length);
    const { parent, name } = getParentAndName(state.root, segs);
    if (!parent) continue;
    const outName = name.endsWith('.gz') ? name.slice(0, -3) : name + '.out';
    parent.children[outName] = file(original, state.currentUser, state.currentUser);
    if (!keep) delete parent.children[name];
  }
  return results.join('\n');
};

const zipCmd: CommandFn = (args, state) => {
  const targets = args.filter((a) => !a.startsWith('-'));
  if (targets.length < 2) return err('zip: usage: zip archive.zip file1 [file2 ...]');
  const [archiveArg, ...files] = targets;
  const archiveSegs = state.resolve(archiveArg.endsWith('.zip') ? archiveArg : archiveArg + '.zip');
  const entries: ArchiveEntry[] = [];
  for (const f of files) {
    const segs = state.resolve(f);
    const node = getNode(state.root, segs);
    if (!node) return err(`zip warning: name not matched: ${f}`);
    collectEntries(node, segs[segs.length - 1] ?? f, entries);
  }
  const { parent, name } = getParentAndName(state.root, archiveSegs);
  if (!parent) return err(`zip: cannot create ${archiveArg}`);
  parent.children[name] = file(packArchive(entries), state.currentUser, state.currentUser);
  return [`  adding: ` + entries.map((e) => e.path + (e.isDir ? '/' : '')).join('\n  adding: ')].join('\n');
};

const unzipCmd: CommandFn = (args, state) => {
  const flags = args.filter((a) => a.startsWith('-'));
  const targets = args.filter((a) => !a.startsWith('-'));
  const archiveArg = targets[0];
  if (!archiveArg) return err('unzip: missing archive operand');
  const dIdx = flags.findIndex((f) => f === '-d');
  const destArg = dIdx !== -1 ? args[args.indexOf('-d') + 1] : null;
  const archiveSegs = state.resolve(archiveArg.endsWith('.zip') ? archiveArg : archiveArg + '.zip');
  const archiveNode = getNode(state.root, archiveSegs);
  if (!archiveNode || archiveNode.type !== 'file') return err(`unzip: cannot find or open ${archiveArg}`);
  const entries = unpackArchive(archiveNode.content);
  if (!entries) return err(`unzip: ${archiveArg} is not a valid archive`);
  const destSegs = destArg ? state.resolve(destArg) : state.cwd;
  extractEntries(state, entries, destSegs);
  return [`Archive:  ${archiveArg}`, ...entries.map((e) => `  ${e.isDir ? 'creating' : 'inflating'}: ${e.path}${e.isDir ? '/' : ''}`)].join('\n');
};

function remoteHostFromSpec(spec: string): string | null {
  const m = /^([^@]+@)?([^:]+):/.exec(spec);
  return m ? m[2] : null;
}

const rsyncCmd: CommandFn = (args, state) => {
  const flags = args.filter((a) => a.startsWith('-'));
  const targets = args.filter((a) => !a.startsWith('-'));
  const archiveMode = flags.some((f) => f.includes('a'));
  const verbose = flags.some((f) => f.includes('v'));
  if (targets.length < 2) return err('rsync: usage: rsync [-av] SRC DEST');
  const [src, dest] = targets;
  const remoteHost = remoteHostFromSpec(src) ?? remoteHostFromSpec(dest);
  if (remoteHost) {
    if (!(remoteHost in state.dnsZone) && remoteHost !== state.hostname) {
      return err(`ssh: Could not resolve hostname ${remoteHost}: Name or service not known\nrsync: connection unexpectedly closed`);
    }
    const localPath = remoteHostFromSpec(src) ? dest : src;
    const label = remoteHostFromSpec(src) ? `${remoteHost}:${src.split(':').slice(1).join(':')}` : `${remoteHost}:${dest.split(':').slice(1).join(':')}`;
    return [
      `receiving file list ... done`,
      verbose ? localPath : '',
      `sent 42 bytes  received 1,406 bytes  2,896.00 bytes/sec`,
      `total size is 1,320  speedup is 0.91`
    ].filter(Boolean).join('\n');
  }
  const srcSegs = state.resolve(src);
  const srcNode = getNode(state.root, srcSegs);
  if (!srcNode) return err(`rsync: link_stat "${src}" failed: No such file or directory (2)`);
  if (srcNode.type === 'dir' && !archiveMode && !flags.some((f) => f.includes('r'))) {
    return err(`skipping directory ${src}`);
  }
  let destSegs = state.resolve(dest);
  const destNode = getNode(state.root, destSegs);
  if (destNode && destNode.type === 'dir') destSegs = [...destSegs, srcSegs[srcSegs.length - 1]];
  const { parent, name } = getParentAndName(state.root, destSegs);
  if (!parent) return err(`rsync: mkstemp failed`);
  parent.children[name] = cloneNode(srcNode, state.currentUser);
  const entries: ArchiveEntry[] = [];
  collectEntries(srcNode, srcSegs[srcSegs.length - 1] ?? src, entries);
  return [
    ...(verbose ? entries.map((e) => e.path) : []),
    `sent 1,406 bytes  received 42 bytes  2,896.00 bytes/sec`,
    `total size is 1,320  speedup is 0.91`
  ].join('\n');
};

const scpCmd: CommandFn = (args, state) => {
  const targets = args.filter((a) => !a.startsWith('-'));
  if (targets.length < 2) return err('usage: scp [-r] source ... target');
  const [src, dest] = targets;
  const remoteHost = remoteHostFromSpec(src) ?? remoteHostFromSpec(dest);
  if (remoteHost) {
    if (!(remoteHost in state.dnsZone) && remoteHost !== state.hostname) {
      return err(`ssh: Could not resolve hostname ${remoteHost}: Name or service not known`);
    }
    const fname = (remoteHostFromSpec(src) ? dest : src).split('/').pop();
    return `${fname}${' '.repeat(Math.max(1, 40 - (fname?.length ?? 0)))}100%   1320   1.3MB/s   00:00`;
  }
  const srcSegs = state.resolve(src);
  const srcNode = getNode(state.root, srcSegs);
  if (!srcNode) return err(`scp: ${src}: No such file or directory`);
  let destSegs = state.resolve(dest);
  const destNode = getNode(state.root, destSegs);
  if (destNode && destNode.type === 'dir') destSegs = [...destSegs, srcSegs[srcSegs.length - 1]];
  const { parent, name } = getParentAndName(state.root, destSegs);
  if (!parent) return err(`scp: ${dest}: No such file or directory`);
  parent.children[name] = cloneNode(srcNode, state.currentUser);
  return `${name}${' '.repeat(Math.max(1, 40 - name.length))}100%   1320   1.3MB/s   00:00`;
};

// --- systemd / services -----------------------------------------------------

// A fixed catalogue of "raw disks" available for pvcreate/mdadm exercises.
const AVAILABLE_DISKS: Record<string, number> = {
  '/dev/sdb': 20,
  '/dev/sdc': 20,
  '/dev/sdd': 20,
  '/dev/sde': 20
};

function logJournal(state: ShellState, unit: string, message: string) {
  state.journal.push({ unit, message });
}

function findService(state: ShellState, name: string): ServiceRecord | undefined {
  return state.services[name];
}

const systemctl: CommandFn = (args, state) => {
  const [action, name] = args;
  if (!action) return err('systemctl: missing operation');

  if (action === 'list-units' || action === 'list-unit-files') {
    const rows = Object.values(state.services).map((s) =>
      `${pad(s.name + '.service', 26)}${pad(s.active ? 'loaded active running' : 'loaded inactive dead', 26)}${s.description}`
    );
    return [pad('UNIT', 26) + pad('LOAD/ACTIVE/SUB', 26) + 'DESCRIPTION', ...rows].join('\n');
  }

  if (!name) return err(`systemctl: missing service name for '${action}'`);
  const svc = findService(state, name);
  if (!svc) return err(`Unit ${name}.service could not be found.`);

  switch (action) {
    case 'start': {
      if (!svc.active) {
        svc.active = true;
        state.processes.push({
          pid: state.nextPid++,
          user: 'root',
          cmd: `/usr/sbin/${name}`,
          cpu: '0.0',
          mem: '0.2',
          service: name
        });
        logJournal(state, name, `Started ${svc.description}.`);
      }
      return '';
    }
    case 'stop': {
      if (svc.active) {
        svc.active = false;
        state.processes = state.processes.filter((p) => p.service !== name);
        logJournal(state, name, `Stopped ${svc.description}.`);
      }
      return '';
    }
    case 'restart': {
      svc.active = false;
      state.processes = state.processes.filter((p) => p.service !== name);
      svc.active = true;
      state.processes.push({ pid: state.nextPid++, user: 'root', cmd: `/usr/sbin/${name}`, cpu: '0.0', mem: '0.2', service: name });
      logJournal(state, name, `Restarted ${svc.description}.`);
      return '';
    }
    case 'enable':
      svc.enabled = true;
      return `Created symlink /etc/systemd/system/multi-user.target.wants/${name}.service.`;
    case 'disable':
      svc.enabled = false;
      return `Removed symlink /etc/systemd/system/multi-user.target.wants/${name}.service.`;
    case 'status': {
      const activeState = svc.active ? 'active (running)' : 'inactive (dead)';
      const dot = svc.active ? '●' : '○';
      const pid = state.processes.find((p) => p.service === name)?.pid;
      const lines = [
        `${dot} ${name}.service - ${svc.description}`,
        `     Loaded: loaded (/lib/systemd/system/${name}.service; ${svc.enabled ? 'enabled' : 'disabled'})`,
        `     Active: ${activeState}`
      ];
      if (pid) lines.push(`   Main PID: ${pid} (${name})`);
      return lines.join('\n');
    }
    default:
      return err(`systemctl: unknown operation '${action}'`);
  }
};

const service: CommandFn = (args, state) => {
  const [name, action] = args;
  if (!name || !action) return err('Usage: service <name> <start|stop|restart|status>');
  return systemctl([action, name], state);
};

// --- process management -----------------------------------------------------

const ps: CommandFn = (_args, state) => {
  const header = `${pad('USER', 10)}${pad('PID', 7)}${pad('%CPU', 6)}${pad('%MEM', 6)}COMMAND`;
  const rows = state.processes.map((p) =>
    `${pad(p.user, 10)}${pad(String(p.pid), 7)}${pad(p.cpu, 6)}${pad(p.mem, 6)}${p.cmd}`
  );
  return [header, ...rows].join('\n');
};

const kill: CommandFn = (args, state) => {
  const targets = args.filter((a) => !a.startsWith('-'));
  if (targets.length === 0) return err('kill: usage: kill pid');
  const results: string[] = [];
  for (const t of targets) {
    const pid = parseInt(t, 10);
    const proc = state.processes.find((p) => p.pid === pid);
    if (!proc) { results.push(err(`bash: kill: (${t}) - No such process`)); continue; }
    state.processes = state.processes.filter((p) => p.pid !== pid);
    if (proc.service) {
      const svc = state.services[proc.service];
      if (svc) { svc.active = false; logJournal(state, proc.service, `Main process exited, killed by signal.`); }
    }
  }
  return results.join('\n');
};

const top: CommandFn = (_args, state) => {
  const running = state.processes.length;
  const header = [
    `top - performance snapshot   load average: 0.15, 0.10, 0.05`,
    `Tasks: ${running} total, 1 running, ${running - 1} sleeping`,
    `%Cpu(s): 2.1 us, 0.8 sy, 0.0 ni, 96.9 id`,
    `MiB Mem : 3924.0 total, 2210.4 free, 812.3 used, 901.3 buff/cache`,
    `MiB Swap: ${state.swapEnabled ? '2048.0 total, 2048.0 free' : '0.0 total, 0.0 free'}`,
    ''
  ].join('\n');
  const colHeader = `${pad('PID', 7)}${pad('USER', 10)}${pad('%CPU', 7)}${pad('%MEM', 7)}COMMAND`;
  const rows = state.processes.map((p) => `${pad(String(p.pid), 7)}${pad(p.user, 10)}${pad(p.cpu, 7)}${pad(p.mem, 7)}${p.cmd}`);
  return header + [colHeader, ...rows].join('\n');
};

// --- cron --------------------------------------------------------------------

const crontab: CommandFn = (args, state) => {
  if (args.includes('-l')) {
    if (state.cronJobs.length === 0) return 'no crontab for student';
    return state.cronJobs.map((j) => `${j.schedule} ${j.command}`).join('\n');
  }
  if (args.includes('-r')) {
    state.cronJobs = [];
    return '';
  }
  const fileArg = args.find((a) => !a.startsWith('-'));
  if (!fileArg) return err('usage: crontab [-l | -r | file]');
  const segs = state.resolve(fileArg);
  const node = getNode(state.root, segs);
  if (!node) return err(`crontab: ${fileArg}: No such file or directory`);
  if (node.type !== 'file') return err(`crontab: ${fileArg}: Is a directory`);
  const jobs = node.content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'))
    .map((l) => {
      const parts = l.split(/\s+/);
      const schedule = parts.slice(0, 5).join(' ');
      const command = parts.slice(5).join(' ');
      return { schedule, command };
    });
  state.cronJobs = jobs;
  return '';
};

// --- ssh / remote context ----------------------------------------------------

/** Hostnames used as gated "engagement targets" in the Modules 13-17 offensive-security
 * training track — reaching these via ssh requires the matching simulated technique to
 * have already succeeded (brute force / valid accounts, or credential reuse for the
 * lateral-movement target), rather than just the generic local-ssh-service check below. */
const ENGAGEMENT_TARGETS = new Set(['webserver01.lab', 'dbserver01.lab']);

const ssh: CommandFn = (args, state) => {
  const target = args.find((a) => !a.startsWith('-'));
  if (!target) return err('usage: ssh [user@]host');
  const host = target.includes('@') ? target.split('@')[1] : target;
  const user = target.includes('@') ? target.split('@')[0] : state.currentUser;

  if (ENGAGEMENT_TARGETS.has(host)) {
    if (host === state.redteam.targetHost) {
      if (!state.redteam.footholdGained || user !== state.redteam.discoveredUser) {
        return err(`${user}@${host}: Permission denied (publickey,password).`);
      }
      state.sshHost = host;
      state.redteam.compromisedHost = host;
      state.redteam.remoteUser = user;
      logTechnique(state, 'T1078', 'Initial Access', 'Valid Accounts', `Logged in to ${host} as ${user} using a discovered credential.`);
      return [
        `Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-101-generic x86_64)`,
        '',
        `Last login: Thu Jan 15 09:00:00 2026 from 10.0.0.5`,
        `${user}@${host}:~$ cat proof.txt`,
        `ACCESS_CONFIRMED: ${user}@${host} - flag{f0oth0ld_via_leaked_creds}`
      ].join('\n');
    }
    // dbserver01.lab: reachable only via lateral movement with a cracked/reused credential.
    const reused = Object.entries(state.redteam.crackedPasswords).find(([, pw]) => pw && user === 'root');
    if (!state.redteam.rootOnTarget || !reused) {
      return err(`${user}@${host}: Permission denied (publickey,password).`);
    }
    state.sshHost = host;
    if (!state.redteam.lateralHosts.includes(host)) state.redteam.lateralHosts.push(host);
    logTechnique(state, 'T1021.004', 'Lateral Movement', 'Remote Services: SSH', `Reused a cracked credential to reach ${host}.`);
    return [
      `Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-101-generic x86_64)`,
      '',
      `Last login: Tue Jan 13 02:14:00 2026 from 10.0.0.20`
    ].join('\n');
  }

  const sshSvc = state.services['ssh'];
  if (!sshSvc || !sshSvc.active) {
    return err(`ssh: connect to host ${host} port 22: Connection refused\n(hint: the ssh service isn't running — try "systemctl start ssh" first)`);
  }
  state.sshHost = host;
  return [
    `Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-101-generic x86_64)`,
    '',
    ` * Documentation:  https://help.ubuntu.com`,
    ` * Management:     https://landscape.canonical.com`,
    '',
    `Last login: Thu Jan 15 09:00:00 2026 from 10.0.0.5`
  ].join('\n');
};

const exitOrLogout: CommandFn = (_args, state) => {
  if (state.sshHost) {
    const host = state.sshHost;
    state.sshHost = null;
    return `logout\nConnection to ${host} closed.`;
  }
  return 'logout';
};

// --- kernel basics -------------------------------------------------------------

const lsmod: CommandFn = () => {
  const modules = [
    ['nvidia', '39321600', '12'],
    ['nf_tables', '286720', '4'],
    ['overlay', '155648', '1'],
    ['ext4', '1044480', '2'],
    ['xhci_pci', '20480', '0'],
    ['sd_mod', '73728', '3']
  ];
  const header = `${pad('Module', 20)}${pad('Size', 12)}Used by`;
  const rows = modules.map(([m, s, u]) => `${pad(m, 20)}${pad(s, 12)}${u}`);
  return [header, ...rows].join('\n');
};

const dmesg: CommandFn = (_args, state) => [
  `[    0.000000] Linux version 5.15.0-101-generic (buildd@lcy02) x86_64`,
  `[    0.142011] ACPI: Core revision 20210730`,
  `[    1.203845] systemd[1]: Detected virtualization kvm.`,
  `[    2.410233] Initializing XFRM netlink socket`,
  `[    3.882110] ${state.hostname} kernel: Bluetooth: Core ver 2.22`,
  `[    5.001233] EXT4-fs (sda1): mounted filesystem with ordered data mode`
].join('\n');

// --- storage -----------------------------------------------------------------

const df: CommandFn = (_args, state) => {
  const header = `${pad('Filesystem', 20)}${pad('Size', 8)}${pad('Used', 8)}${pad('Avail', 8)}${pad('Use%', 6)}Mounted on`;
  const rows = [
    `${pad('/dev/sda1', 20)}${pad('20G', 8)}${pad('6.1G', 8)}${pad('13G', 8)}${pad('32%', 6)}/`,
    `${pad('tmpfs', 20)}${pad('2.0G', 8)}${pad('0', 8)}${pad('2.0G', 8)}${pad('0%', 6)}/dev/shm`
  ];
  for (const lv of state.lvm.logicalVolumes) {
    rows.push(`${pad(`/dev/${lv.vg}/${lv.name}`, 20)}${pad(lv.sizeGB + 'G', 8)}${pad('1.2G', 8)}${pad((lv.sizeGB - 1.2).toFixed(1) + 'G', 8)}${pad('6%', 6)}/mnt/${lv.name}`);
  }
  return [header, ...rows].join('\n');
};

const du: CommandFn = (args, state) => {
  const flags = args.filter((a) => a.startsWith('-')).join('');
  const human = flags.includes('h');
  const target = args.find((a) => !a.startsWith('-')) ?? '.';
  const segs = state.resolve(target);
  const node = segs.length === 0 ? state.root : getNode(state.root, segs);
  if (!node) return err(`du: cannot access '${target}': No such file or directory`);
  const bytes = subtreeSize(node);
  const sizeStr = human ? `${(bytes / 1024).toFixed(1)}K` : String(Math.ceil(bytes / 1024));
  return `${sizeStr}\t${target}`;
};

const mount: CommandFn = (_args, state) => {
  const lines = [
    '/dev/sda1 on / type ext4 (rw,relatime)',
    'tmpfs on /dev/shm type tmpfs (rw,nosuid,nodev)',
    'proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)'
  ];
  for (const lv of state.lvm.logicalVolumes) {
    lines.push(`/dev/${lv.vg}/${lv.name} on /mnt/${lv.name} type ext4 (rw,relatime)`);
  }
  return lines.join('\n');
};

const lsblk: CommandFn = (_args, state) => {
  const lines = [`${pad('NAME', 12)}${pad('SIZE', 8)}${pad('TYPE', 8)}MOUNTPOINT`];
  lines.push(`${pad('sda', 12)}${pad('20G', 8)}${pad('disk', 8)}`);
  lines.push(`${pad('└─sda1', 12)}${pad('20G', 8)}${pad('part', 8)}/`);
  for (const [dev, size] of Object.entries(AVAILABLE_DISKS)) {
    const short = dev.replace('/dev/', '');
    const inPv = state.lvm.physicalVolumes.includes(dev);
    const inRaid = state.raidArrays.some((r) => r.members.includes(dev));
    const usage = inRaid ? 'raid member' : inPv ? 'LVM PV' : 'free';
    lines.push(`${pad(short, 12)}${pad(size + 'G', 8)}${pad('disk', 8)}${usage}`);
  }
  for (const raid of state.raidArrays) {
    lines.push(`${pad(raid.device.replace('/dev/', ''), 12)}${pad('', 8)}${pad('raid' + raid.level.replace('raid', ''), 8)}`);
  }
  return lines.join('\n');
};

// --- LVM -----------------------------------------------------------------------

const pvcreate: CommandFn = (args, state) => {
  const results: string[] = [];
  for (const dev of args) {
    if (!(dev in AVAILABLE_DISKS)) { results.push(err(`Device ${dev} not found.`)); continue; }
    if (state.lvm.physicalVolumes.includes(dev)) { results.push(err(`Physical volume '${dev}' already exists`)); continue; }
    if (state.raidArrays.some((r) => r.members.includes(dev))) { results.push(err(`Device ${dev} is already part of a RAID array`)); continue; }
    state.lvm.physicalVolumes.push(dev);
    results.push(`Physical volume "${dev}" successfully created.`);
  }
  return results.join('\n');
};

const vgcreate: CommandFn = (args, state) => {
  const [vgName, ...devs] = args;
  if (!vgName || devs.length === 0) return err('usage: vgcreate VG_NAME PV [PV...]');
  if (state.lvm.volumeGroups.some((v) => v.name === vgName)) return err(`vgcreate: volume group "${vgName}" already exists`);
  for (const d of devs) {
    if (!state.lvm.physicalVolumes.includes(d)) return err(`vgcreate: device ${d} is not a physical volume (run pvcreate first)`);
  }
  const sizeGB = devs.reduce((sum, d) => sum + (AVAILABLE_DISKS[d] ?? 0), 0);
  state.lvm.volumeGroups.push({ name: vgName, pvs: devs, sizeGB });
  return `Volume group "${vgName}" successfully created`;
};

const lvcreate: CommandFn = (args, state) => {
  let sizeGB = 0;
  let name = '';
  let vgName = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-L' && args[i + 1]) { sizeGB = parseFloat(args[i + 1].replace(/G$/i, '')); i++; }
    else if (args[i] === '-n' && args[i + 1]) { name = args[i + 1]; i++; }
    else if (!args[i].startsWith('-')) vgName = args[i];
  }
  if (!name || !sizeGB || !vgName) return err('usage: lvcreate -L <size>G -n <name> <vgname>');
  const vg = state.lvm.volumeGroups.find((v) => v.name === vgName);
  if (!vg) return err(`Volume group "${vgName}" not found`);
  const used = state.lvm.logicalVolumes.filter((lv) => lv.vg === vgName).reduce((s, lv) => s + lv.sizeGB, 0);
  if (used + sizeGB > vg.sizeGB) return err(`Insufficient free space: ${vg.sizeGB - used}G available in "${vgName}"`);
  if (state.lvm.logicalVolumes.some((lv) => lv.name === name && lv.vg === vgName)) return err(`Logical Volume "${name}" already exists in volume group "${vgName}"`);
  state.lvm.logicalVolumes.push({ name, vg: vgName, sizeGB });
  return `Logical volume "${name}" created.`;
};

const pvs: CommandFn = (_args, state) => {
  if (state.lvm.physicalVolumes.length === 0) return '';
  const header = `${pad('PV', 14)}${pad('VG', 14)}${pad('Fmt', 8)}Size`;
  const rows = state.lvm.physicalVolumes.map((pv) => {
    const vg = state.lvm.volumeGroups.find((v) => v.pvs.includes(pv));
    return `${pad(pv, 14)}${pad(vg?.name ?? '', 14)}${pad('lvm2', 8)}${AVAILABLE_DISKS[pv]}g`;
  });
  return [header, ...rows].join('\n');
};

const vgs: CommandFn = (_args, state) => {
  if (state.lvm.volumeGroups.length === 0) return '';
  const header = `${pad('VG', 14)}${pad('#PV', 6)}${pad('#LV', 6)}${pad('VSize', 8)}VFree`;
  const rows = state.lvm.volumeGroups.map((vg) => {
    const used = state.lvm.logicalVolumes.filter((lv) => lv.vg === vg.name).reduce((s, lv) => s + lv.sizeGB, 0);
    const lvCount = state.lvm.logicalVolumes.filter((lv) => lv.vg === vg.name).length;
    return `${pad(vg.name, 14)}${pad(String(vg.pvs.length), 6)}${pad(String(lvCount), 6)}${pad(vg.sizeGB + 'g', 8)}${vg.sizeGB - used}g`;
  });
  return [header, ...rows].join('\n');
};

const lvs: CommandFn = (_args, state) => {
  if (state.lvm.logicalVolumes.length === 0) return '';
  const header = `${pad('LV', 14)}${pad('VG', 14)}Size`;
  const rows = state.lvm.logicalVolumes.map((lv) => `${pad(lv.name, 14)}${pad(lv.vg, 14)}${lv.sizeGB}g`);
  return [header, ...rows].join('\n');
};

// --- RAID ------------------------------------------------------------------------

const mdadm: CommandFn = (args, state) => {
  if (args[0] !== '--create' && args[0] !== '-C') {
    if (args[0] === '--detail' || args[0] === '-D') {
      const device = args[1];
      const raid = state.raidArrays.find((r) => r.device === device);
      if (!raid) return err(`mdadm: cannot open ${device ?? ''}: No such file or directory`);
      return [
        `${raid.device}:`,
        `           Version : 1.2`,
        `     Raid Level : ${raid.level}`,
        `     Array Size : ${AVAILABLE_DISKS[raid.members[0]] * (raid.level === 'raid1' ? 1 : raid.members.length)} GB`,
        `    Raid Devices : ${raid.members.length}`,
        `   Total Devices : ${raid.members.length}`,
        `           State : ${raid.state}`,
        `    Active Devices : ${raid.members.length}`,
        `   Working Devices : ${raid.members.length}`,
        `   ${raid.members.map((m, i) => `    Number   ${i}   active sync   ${m}`).join('\n')}`
      ].join('\n');
    }
    return err('usage: mdadm --create /dev/mdX --level=N --raid-devices=N dev1 dev2 [...] | mdadm --detail /dev/mdX');
  }
  const device = args[1];
  let level = '';
  let raidDevices = 0;
  const members: string[] = [];
  for (const a of args.slice(2)) {
    if (a.startsWith('--level=')) level = 'raid' + a.split('=')[1];
    else if (a.startsWith('--raid-devices=')) raidDevices = parseInt(a.split('=')[1], 10);
    else if (a.startsWith('/dev/')) members.push(a);
  }
  if (!device || !level || members.length === 0) return err('mdadm: missing required arguments');
  if (raidDevices && members.length !== raidDevices) return err(`mdadm: expected ${raidDevices} devices, got ${members.length}`);
  for (const m of members) {
    if (!(m in AVAILABLE_DISKS)) return err(`mdadm: ${m}: not a recognised device`);
    if (state.lvm.physicalVolumes.includes(m)) return err(`mdadm: ${m} is already an LVM physical volume`);
    if (state.raidArrays.some((r) => r.members.includes(m))) return err(`mdadm: ${m} is already part of an array`);
  }
  state.raidArrays.push({ device, level, members, state: 'clean' });
  return `mdadm: array ${device} started.`;
};

// --- swap ------------------------------------------------------------------------

const free: CommandFn = (_args, state) => {
  const header = `${pad('', 8)}${pad('total', 12)}${pad('used', 12)}${pad('free', 12)}${pad('shared', 12)}${pad('buff/cache', 12)}available`;
  const memRow = `${pad('Mem:', 8)}${pad('3924', 12)}${pad('812', 12)}${pad('2210', 12)}${pad('48', 12)}${pad('901', 12)}2890`;
  const swapRow = state.swapEnabled
    ? `${pad('Swap:', 8)}${pad('2048', 12)}${pad('0', 12)}2048`
    : `${pad('Swap:', 8)}${pad('0', 12)}${pad('0', 12)}0`;
  return [header, memRow, swapRow].join('\n');
};

const swapon: CommandFn = (args, state) => {
  if (args.includes('-s') || args.includes('--show')) {
    if (!state.swapEnabled) return '';
    return `${pad('NAME', 14)}${pad('TYPE', 10)}${pad('SIZE', 8)}USED\n${pad('/swapfile', 14)}${pad('file', 10)}${pad('2G', 8)}0B`;
  }
  state.swapEnabled = true;
  return '';
};

const swapoff: CommandFn = (_args, state) => {
  state.swapEnabled = false;
  return '';
};

// --- boot / systemd-analyze --------------------------------------------------------

const systemdAnalyze: CommandFn = (args) => {
  if (args[0] === 'blame') {
    return [
      '  2.912s nginx.service',
      '  1.203s systemd-journald.service',
      '  0.887s cron.service',
      '  0.412s ssh.service'
    ].join('\n');
  }
  return 'Startup finished in 2.105s (kernel) + 4.912s (userspace) = 7.017s\ngraphical.target reached after 4.901s in userspace.';
};

// --- log management -----------------------------------------------------------------

const journalctl: CommandFn = (args, state) => {
  let unit: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-u' && args[i + 1]) unit = args[i + 1];
  }
  const entries = unit ? state.journal.filter((j) => j.unit === unit) : state.journal;
  if (entries.length === 0) return unit ? `-- No entries --` : '';
  return entries.map((j) => `Jan 15 09:00:00 ${state.hostname} ${j.unit}: ${j.message}`).join('\n');
};

// --- performance monitoring ------------------------------------------------------------

const vmstat: CommandFn = (_args, state) => [
  `procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----`,
  ` r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st`,
  ` 1  0${state.swapEnabled ? '      0' : '      0'} 2210432  90112 812448    0    0     2     8   45   88  2  1 97  0  0`
].join('\n');

const uptime: CommandFn = () =>
  ' 09:14:22 up 3 days,  2:41,  1 user,  load average: 0.15, 0.10, 0.05';

// --- networking: fixed simulated LAN -------------------------------------------------

// Fixed catalogue of "other machines on the LAN" for nmap/nc/ping exercises.
const REMOTE_HOSTS: Record<string, number[]> = {
  'webserver01.lab': [22, 80, 443],
  'dbserver01.lab': [22, 5432],
  '10.0.0.20': [22, 80, 443],
  '10.0.0.21': [22, 5432],
  'corp-target.lab': [22, 80, 443]
};

const PORT_NAMES: Record<number, string> = {
  22: 'ssh', 80: 'http', 443: 'https', 5432: 'postgresql'
};

function resolveHost(state: ShellState, host: string): string | null {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return host;
  if (state.dnsZone[host]) return state.dnsZone[host];
  return null;
}

function openPortsFor(state: ShellState, host: string): number[] {
  if (host === 'localhost' || host === '127.0.0.1' || host === state.hostname) {
    const ports: number[] = [];
    if (state.services['ssh']?.active) ports.push(22);
    if (state.services['nginx']?.active) ports.push(80);
    return ports;
  }
  const resolvedIp = resolveHost(state, host);
  for (const [h, ports] of Object.entries(REMOTE_HOSTS)) {
    if (h === host || h === resolvedIp) return ports;
  }
  return [];
}

// --- web & network recon (Module 8) ------------------------------------------

interface WebResponse { status: number; statusText: string; body: string; headers: Record<string, string>; }

const WEB_CONTENT: Record<string, Record<string, WebResponse>> = {
  'webserver01.lab': {
    '/': { status: 200, statusText: 'OK', body: '<html><head><title>webserver01</title></head><body><h1>Welcome to webserver01.lab</h1></body></html>', headers: { Server: 'nginx/1.18.0 (Ubuntu)', 'Content-Type': 'text/html' } },
    '/index.html': { status: 200, statusText: 'OK', body: '<html><body><h1>Welcome to webserver01.lab</h1></body></html>', headers: { Server: 'nginx/1.18.0 (Ubuntu)', 'Content-Type': 'text/html' } },
    '/login': { status: 200, statusText: 'OK', body: '<html><body><form action="/login" method="post">Login</form></body></html>', headers: { Server: 'nginx/1.18.0 (Ubuntu)', 'Content-Type': 'text/html' } },
    '/admin': { status: 403, statusText: 'Forbidden', body: '403 Forbidden', headers: { Server: 'nginx/1.18.0 (Ubuntu)' } },
    '/api/status': { status: 200, statusText: 'OK', body: '{"status":"ok","version":"1.4.2"}', headers: { Server: 'nginx/1.18.0 (Ubuntu)', 'Content-Type': 'application/json' } },
    '/backup.zip': {
      status: 200, statusText: 'OK',
      body: packArchive([{
        path: 'webapp_config.txt',
        isDir: false,
        content: [
          '# Internal App - backup config (2025-08-02)',
          'DB_HOST=dbserver01.lab',
          'DB_USER=webapp',
          'DB_PASS=Tr0ub4dor&3',
          'ADMIN_USER=dsilva',
          'ADMIN_PASS=Winter2025!'
        ].join('\n'),
        perms: 'rw-r--r--', owner: 'student', group: 'student'
      }]),
      headers: { Server: 'nginx/1.18.0 (Ubuntu)', 'Content-Type': 'application/zip' }
    },
    '/.git/config': { status: 200, statusText: 'OK', body: '[core]\n\trepositoryformatversion = 0', headers: { Server: 'nginx/1.18.0 (Ubuntu)' } }
  }
};

/** Paths a directory brute-forcer would discover on a given simulated host. */
const WEB_HIDDEN_PATHS: Record<string, string[]> = {
  'webserver01.lab': ['/', '/index.html', '/login', '/admin', '/api/status', '/backup.zip', '/.git/config']
};

function webHostAndPath(rawUrl: string): { host: string; path: string } {
  const stripped = rawUrl.replace(/^https?:\/\//, '');
  const slashIdx = stripped.indexOf('/');
  const host = slashIdx === -1 ? stripped : stripped.slice(0, slashIdx);
  const path = slashIdx === -1 ? '/' : stripped.slice(slashIdx) || '/';
  return { host, path };
}

function fetchSimulated(state: ShellState, host: string, path: string): WebResponse | { error: string } {
  const resolvedIp = resolveHost(state, host);
  const isKnownHost = host in REMOTE_HOSTS || host === state.hostname || host === 'localhost' || (resolvedIp && Object.keys(REMOTE_HOSTS).includes(host));
  if (!isKnownHost) return { error: `curl: (6) Could not resolve host: ${host}` };
  const ports = openPortsFor(state, host);
  if (!ports.includes(80) && !ports.includes(443)) {
    return { error: `curl: (7) Failed to connect to ${host} port 80: Connection refused` };
  }
  const page = WEB_CONTENT[host]?.[path];
  if (page) return page;
  return { status: 404, statusText: 'Not Found', body: '404 Not Found', headers: { Server: 'nginx/1.18.0 (Ubuntu)' } };
}

const curlCmd: CommandFn = (args, state) => {
  const flags = args.filter((a) => a.startsWith('-'));
  const urlArg = args.find((a) => !a.startsWith('-'));
  const headersOnly = flags.some((f) => f === '-I' || f === '--head');
  const verbose = flags.some((f) => f === '-v' || f === '--verbose');
  if (!urlArg) return err('curl: try \'curl --help\' for more information');
  const { host, path } = webHostAndPath(urlArg);
  const result = fetchSimulated(state, host, path);
  if ('error' in result) return err(result.error);
  const statusLine = `HTTP/1.1 ${result.status} ${result.statusText}`;
  const headerLines = [statusLine, ...Object.entries(result.headers).map(([k, v]) => `${k}: ${v}`)];
  if (headersOnly) return headerLines.join('\n');
  if (verbose) return [...headerLines.map((h) => '< ' + h), '', result.body].join('\n');
  return result.body;
};

const wgetCmd: CommandFn = (args, state) => {
  const urlArg = args.find((a) => !a.startsWith('-'));
  if (!urlArg) return err('wget: missing URL');
  const { host, path } = webHostAndPath(urlArg);
  const result = fetchSimulated(state, host, path);
  const fname = path === '/' ? 'index.html' : (path.split('/').pop() || 'index.html');
  if ('error' in result) {
    return [`--${new Date().toISOString()}--  ${urlArg}`, `Resolving ${host}...`, result.error].join('\n');
  }
  const { parent, name } = getParentAndName(state.root, [...state.cwd, fname]);
  if (parent) parent.children[name] = file(result.body, state.currentUser, state.currentUser);
  return [
    `--${new Date().toISOString()}--  ${urlArg}`,
    `Resolving ${host}... ${resolveHost(state, host) ?? host}`,
    `Connecting to ${host}|${resolveHost(state, host) ?? ''}|:80... connected.`,
    `HTTP request sent, awaiting response... ${result.status} ${result.statusText}`,
    `Length: ${result.body.length} [${result.headers['Content-Type'] ?? 'text/html'}]`,
    `Saving to: '${fname}'`,
    ``,
    `${fname} saved [${result.body.length}/${result.body.length}]`
  ].join('\n');
};

const WHOIS_DB: Record<string, string[]> = {
  'ubuntu.com': ['Domain Name: UBUNTU.COM', 'Registrar: MarkMonitor Inc.', 'Creation Date: 2004-03-23', 'Registrant Organization: Canonical Ltd.'],
  'kali.org': ['Domain Name: KALI.ORG', 'Registrar: NameCheap, Inc.', 'Creation Date: 2012-12-14', 'Registrant Organization: OffSec Services Limited'],
  'corp-target.lab': [
    'Domain Name: CORP-TARGET.LAB', 'Registrar: Cloudflare, Inc.', 'Creation Date: 2015-06-01',
    'Registrant Organization: Nova Retail Group', 'Registrant Country: US',
    'Name Server: NS1.CORP-TARGET.LAB', 'Name Server: NS2.CORP-TARGET.LAB'
  ]
};

const whoisCmd: CommandFn = (args) => {
  const domain = args.find((a) => !a.startsWith('-'));
  if (!domain) return err('usage: whois <domain>');
  const record = WHOIS_DB[domain];
  if (!record) return `No match for domain "${domain.toUpperCase()}".`;
  return record.join('\n');
};

const gobusterCmd: CommandFn = (args, state) => {
  const modeIdx = args.indexOf('dir');
  if (modeIdx === -1) return err('usage: gobuster dir -u <url> -w <wordlist>');
  const uIdx = args.indexOf('-u');
  const urlArg = uIdx !== -1 ? args[uIdx + 1] : null;
  if (!urlArg) return err('gobuster: the flag -u is required');
  const { host } = webHostAndPath(urlArg);
  const ports = openPortsFor(state, host);
  if (!ports.includes(80) && !ports.includes(443)) {
    return err(`gobuster: unable to connect to ${host}: connection refused`);
  }
  const paths = WEB_HIDDEN_PATHS[host] ?? [];
  const lines = [
    `===============================================================`,
    `Gobuster v3.6`,
    `===============================================================`,
    `[+] Url:                     ${urlArg}`,
    `[+] Method:                  GET`,
    `[+] Threads:                 10`,
    `===============================================================`
  ];
  for (const p of paths) {
    const page = WEB_CONTENT[host]?.[p];
    if (page) lines.push(`${p.padEnd(30)}(Status: ${page.status}) [Size: ${page.body.length}]`);
  }
  lines.push(`===============================================================`);
  return lines.join('\n');
};

const niktoCmd: CommandFn = (args, state) => {
  const hIdx = args.indexOf('-h');
  const target = hIdx !== -1 ? args[hIdx + 1] : args.find((a) => !a.startsWith('-'));
  if (!target) return err('usage: nikto -h <host>');
  const { host } = webHostAndPath(target);
  const ports = openPortsFor(state, host);
  if (!ports.includes(80) && !ports.includes(443)) {
    return err(`- Nikto: Could not connect to ${host} on port 80`);
  }
  const ip = resolveHost(state, host) ?? host;
  const lines = [
    `- Nikto v2.5.0`,
    `---------------------------------------------------------------------------`,
    `+ Target IP:          ${ip}`,
    `+ Target Hostname:    ${host}`,
    `+ Target Port:        80`,
    `+ Start Time:         ${new Date().toISOString()}`,
    `---------------------------------------------------------------------------`,
    `+ Server: nginx/1.18.0 (Ubuntu)`,
    `+ /admin: Directory listing/admin panel found, access may reveal sensitive functionality.`,
    `+ /.git/config: Version control config file exposed, may leak source code history.`,
    `+ /backup.zip: Backup archive publicly accessible — remove or restrict access.`,
    `+ /api/status: Endpoint discloses internal version information.`,
    `+ 7 item(s) reported on remote host`,
    `+ End Time:           ${new Date().toISOString()}`
  ];
  return lines.join('\n');
};

// --- ICMP-style diagnostics -------------------------------------------------

const ping: CommandFn = (args, state) => {
  const host = args.find((a) => !a.startsWith('-'));
  if (!host) return err('usage: ping <host>');
  const countFlagIdx = args.indexOf('-c');
  const count = countFlagIdx >= 0 && args[countFlagIdx + 1] ? parseInt(args[countFlagIdx + 1], 10) : 4;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === state.hostname;
  const ip = isLocal ? '127.0.0.1' : resolveHost(state, host);
  if (!ip) return err(`ping: ${host}: Name or service not known`);
  const lines = [`PING ${host} (${ip}) 56(84) bytes of data.`];
  for (let i = 1; i <= count; i++) {
    lines.push(`64 bytes from ${host} (${ip}): icmp_seq=${i} ttl=64 time=0.0${i} ms`);
  }
  lines.push('');
  lines.push(`--- ${host} ping statistics ---`);
  lines.push(`${count} packets transmitted, ${count} received, 0% packet loss, time ${count * 10}ms`);
  return lines.join('\n');
};

const traceroute: CommandFn = (args, state) => {
  const host = args.find((a) => !a.startsWith('-'));
  if (!host) return err('usage: traceroute <host>');
  const ip = resolveHost(state, host) ?? (host === 'localhost' ? '127.0.0.1' : null);
  if (!ip) return err(`traceroute: unknown host ${host}`);
  return [
    `traceroute to ${host} (${ip}), 30 hops max, 60 byte packets`,
    ` 1  10.0.0.1 (10.0.0.1)  0.412 ms  0.398 ms  0.375 ms`,
    ` 2  172.16.0.1 (172.16.0.1)  1.203 ms  1.180 ms  1.155 ms`,
    ` 3  ${host} (${ip})  2.881 ms  2.850 ms  2.811 ms`
  ].join('\n');
};

// --- DNS ---------------------------------------------------------------------

const nslookup: CommandFn = (args, state) => {
  const host = args[0];
  if (!host) return err('usage: nslookup <domain>');
  const ip = state.dnsZone[host];
  if (!ip) return err(`** server can't find ${host}: NXDOMAIN`);
  return [`Server:\t\t127.0.0.53`, `Address:\t127.0.0.53#53`, '', `Name:\t${host}`, `Address: ${ip}`].join('\n');
};

/** MX/TXT/NS records for domains worth DNS-recon'ing — separate from the A-record dnsZone
 * since a domain can have many record types pointing at very different infrastructure. */
const MX_RECORDS: Record<string, string[]> = {
  'corp-target.lab': ['10 aspmx.l.google.com.', '20 alt1.aspmx.l.google.com.']
};
const TXT_RECORDS: Record<string, string[]> = {
  'corp-target.lab': ['"v=spf1 include:_spf.google.com ~all"', '"google-site-verification=nova-retail-8f2a1c"']
};
const NS_RECORDS: Record<string, string[]> = {
  'corp-target.lab': ['ns1.corp-target.lab.', 'ns2.corp-target.lab.']
};

const dig: CommandFn = (args, state) => {
  const positional = args.filter((a) => !a.startsWith('-'));
  const host = positional[0];
  if (!host) return err('usage: dig <domain> [A|MX|TXT|NS]');
  const type = (positional[1] ?? 'A').toUpperCase();
  const lines = [
    `; <<>> DiG 9.18.1 <<>> ${host} ${type}`,
    `;; QUESTION SECTION:`,
    `;${host}.\t\tIN\t${type}`,
    ''
  ];
  lines.push(';; ANSWER SECTION:');
  if (type === 'A') {
    const ip = state.dnsZone[host];
    if (ip) lines.push(`${host}.\t3600\tIN\tA\t${ip}`);
    else { lines.pop(); lines.push(';; ANSWER SECTION: (none — NXDOMAIN)'); }
  } else if (type === 'MX') {
    const records = MX_RECORDS[host];
    if (records?.length) records.forEach((r) => lines.push(`${host}.\t3600\tIN\tMX\t${r}`));
    else { lines.pop(); lines.push(';; ANSWER SECTION: (none)'); }
  } else if (type === 'TXT') {
    const records = TXT_RECORDS[host];
    if (records?.length) records.forEach((r) => lines.push(`${host}.\t3600\tIN\tTXT\t${r}`));
    else { lines.pop(); lines.push(';; ANSWER SECTION: (none)'); }
  } else if (type === 'NS') {
    const records = NS_RECORDS[host];
    if (records?.length) records.forEach((r) => lines.push(`${host}.\t3600\tIN\tNS\t${r}`));
    else { lines.pop(); lines.push(';; ANSWER SECTION: (none)'); }
  } else {
    lines.pop();
    lines.push(`;; ANSWER SECTION: (unsupported type ${type})`);
  }
  return lines.join('\n');
};

// --- ip / arp ------------------------------------------------------------------

const ipCmd: CommandFn = (args, state) => {
  const [sub, ...rest] = args;

  if (sub === 'addr' && rest[0] === 'add' && rest[1] && rest[3] === 'dev' && rest[4]) {
    const cidr = rest[1];
    const ifaceName = rest[4];
    const iface = state.interfaces.find((i) => i.name === ifaceName);
    if (!iface) return err(`Cannot find device "${ifaceName}"`);
    iface.ip = cidr.split('/')[0];
    return '';
  }

  if (sub === 'addr' || sub === 'a') {
    return state.interfaces
      .map((i, idx) => {
        const flags = i.up ? 'UP,LOWER_UP' : 'DOWN';
        const inetLine = i.ip ? `    inet ${i.ip}/24 brd 10.0.0.255 scope global ${i.name}` : `    (no address)`;
        return `${idx + 1}: ${i.name}: <BROADCAST,MULTICAST,${flags}> mtu ${i.mtu}\n    link/ether ${i.mac}\n${inetLine}`;
      })
      .join('\n');
  }

  if (sub === 'route' || sub === 'r') {
    return state.routes
      .map((r) => (r.destination === 'default' ? `default via ${r.gateway} dev ${r.iface}` : `${r.destination} dev ${r.iface} scope link`))
      .join('\n');
  }

  if (sub === 'link' || sub === 'l') {
    if (rest[0] === 'set' && rest[1] && rest[2]) {
      const iface = state.interfaces.find((i) => i.name === rest[1]);
      if (!iface) return err(`Cannot find device "${rest[1]}"`);
      if (rest[2] === 'up') iface.up = true;
      if (rest[2] === 'down') iface.up = false;
      return '';
    }
    if (rest[0] === 'add') {
      // ip link add link eth0 name eth0.10 type vlan id 10
      const nameIdx = rest.indexOf('name');
      const idIdx = rest.indexOf('id');
      const linkIdx = rest.indexOf('link');
      if (nameIdx < 0 || idIdx < 0 || linkIdx < 0) return err('usage: ip link add link <iface> name <vlanIface> type vlan id <N>');
      const vlanName = rest[nameIdx + 1];
      const vlanId = parseInt(rest[idIdx + 1], 10);
      const parentIface = rest[linkIdx + 1];
      if (!state.interfaces.some((i) => i.name === parentIface)) return err(`Cannot find device "${parentIface}"`);
      state.vlans.push({ id: vlanId, parentIface, name: vlanName });
      state.interfaces.push({ name: vlanName, ip: null, mac: '02:42:ac:11:00:1' + (state.vlans.length), up: false, mtu: 1500 });
      return '';
    }
    return state.interfaces.map((i, idx) => `${idx + 1}: ${i.name}: <${i.up ? 'UP' : 'DOWN'}> mtu ${i.mtu}`).join('\n');
  }

  if (sub === 'netns') {
    const action = rest[0];
    if (action === 'add') {
      const name = rest[1];
      if (!name) return err('usage: ip netns add <name>');
      if (state.namespaces.includes(name)) return err(`Cannot create namespace file "/var/run/netns/${name}": File exists`);
      state.namespaces.push(name);
      return '';
    }
    if (action === 'list' || !action) {
      return state.namespaces.join('\n');
    }
    if (action === 'delete') {
      const name = rest[1];
      state.namespaces = state.namespaces.filter((n) => n !== name);
      return '';
    }
    return err(`ip netns: unknown action '${action}'`);
  }

  if (sub === 'neigh' || sub === 'neighbor') {
    return state.arpTable.map((a) => `${a.ip} dev ${a.iface} lladdr ${a.mac} REACHABLE`).join('\n');
  }

  return err(`ip: unknown object "${sub ?? ''}"`);
};

const arp: CommandFn = (_args, state) =>
  state.arpTable.map((a) => `${pad(a.ip, 16)}${pad('ether', 8)}${pad(a.mac, 20)}C${pad('', 4)}${a.iface}`).join('\n');

// --- sockets: ss / netstat ------------------------------------------------------

function listeningSockets(state: ShellState): { port: number; service: string; pid: number }[] {
  const out: { port: number; service: string; pid: number }[] = [];
  const sshProc = state.processes.find((p) => p.service === 'ssh');
  if (state.services['ssh']?.active && sshProc) out.push({ port: 22, service: 'sshd', pid: sshProc.pid });
  const nginxProc = state.processes.find((p) => p.service === 'nginx');
  if (state.services['nginx']?.active && nginxProc) out.push({ port: 80, service: 'nginx', pid: nginxProc.pid });
  return out;
}

const ss: CommandFn = (_args, state) => {
  const sockets = listeningSockets(state);
  const header = `${pad('State', 10)}${pad('Recv-Q', 8)}${pad('Send-Q', 8)}${pad('Local Address:Port', 24)}Process`;
  const rows = sockets.map((s) => `${pad('LISTEN', 10)}${pad('0', 8)}${pad('128', 8)}${pad('0.0.0.0:' + s.port, 24)}users:(("${s.service}",pid=${s.pid},fd=3))`);
  return [header, ...rows].join('\n');
};

const netstat: CommandFn = (_args, state) => {
  const sockets = listeningSockets(state);
  const header = `${pad('Proto', 7)}${pad('Recv-Q', 8)}${pad('Send-Q', 8)}${pad('Local Address', 22)}${pad('Foreign Address', 20)}State`;
  const rows = sockets.map((s) => `${pad('tcp', 7)}${pad('0', 8)}${pad('0', 8)}${pad('0.0.0.0:' + s.port, 22)}${pad('0.0.0.0:*', 20)}LISTEN`);
  return [header, ...rows].join('\n');
};

// --- netcat / nmap ---------------------------------------------------------------

const nc: CommandFn = (args, state) => {
  const positional = args.filter((a) => !a.startsWith('-'));
  const [host, portStr] = positional;
  if (!host || !portStr) return err('usage: nc [-zv] <host> <port>');
  const port = parseInt(portStr, 10);
  const open = openPortsFor(state, host).includes(port);
  return open
    ? `Connection to ${host} ${port} port [tcp/${PORT_NAMES[port] ?? '*'}] succeeded!`
    : `nc: connect to ${host} port ${port} (tcp) failed: Connection refused`;
};

const nmap: CommandFn = (args, state) => {
  const host = args.find((a) => !a.startsWith('-'));
  if (!host) return err('usage: nmap <host>');
  const ports = openPortsFor(state, host);
  const ip = resolveHost(state, host) ?? (host === 'localhost' ? '127.0.0.1' : host);
  const lines = [`Starting Nmap 7.94 ( https://nmap.org ) at 2026-01-15 09:00 UTC`, `Nmap scan report for ${host} (${ip})`, `Host is up (0.00042s latency).`, ''];
  if (ports.length === 0) {
    lines.push('All 1000 scanned ports on ' + host + ' are closed');
  } else {
    lines.push(`PORT     STATE SERVICE`);
    for (const p of ports.sort((a, b) => a - b)) {
      lines.push(`${pad(p + '/tcp', 9)}${pad('open', 6)}${PORT_NAMES[p] ?? 'unknown'}`);
    }
  }
  lines.push('');
  lines.push(`Nmap done: 1 IP address (1 host up) scanned in 0.45 seconds`);
  return lines.join('\n');
};

// --- packet capture --------------------------------------------------------------

const tcpdump: CommandFn = (args) => {
  const ifaceIdx = args.indexOf('-i');
  const iface = ifaceIdx >= 0 && args[ifaceIdx + 1] ? args[ifaceIdx + 1] : 'eth0';
  return [
    `tcpdump: verbose output suppressed, use -v for full protocol decode`,
    `listening on ${iface}, link-type EN10MB (Ethernet), snapshot length 262144 bytes`,
    `09:00:01.102030 IP 10.0.0.15.54210 > 10.0.0.20.80: Flags [S], seq 123456789, win 64240, length 0`,
    `09:00:01.102980 IP 10.0.0.20.80 > 10.0.0.15.54210: Flags [S.], seq 987654321, ack 123456790, win 65160, length 0`,
    `09:00:01.103210 IP 10.0.0.15.54210 > 10.0.0.20.80: Flags [.], ack 1, win 64240, length 0`,
    `3 packets captured`
  ].join('\n');
};

// --- firewalls: iptables / nftables ------------------------------------------------

const iptables: CommandFn = (args, state) => {
  if (args.includes('-L') || args[0] === '-L') {
    const chains: Array<'INPUT' | 'OUTPUT' | 'FORWARD'> = ['INPUT', 'FORWARD', 'OUTPUT'];
    const blocks = chains.map((c) => {
      const rules = state.firewallRules.filter((r) => r.chain === c);
      const header = `Chain ${c} (policy ${state.firewallPolicy[c]})`;
      const ruleLines = rules.map((r) => `target     prot opt source               destination         ${r.rule}`);
      return [header, 'target     prot opt source               destination', ...ruleLines].join('\n');
    });
    return blocks.join('\n\n');
  }
  if (args[0] === '-A') {
    const chain = args[1] as 'INPUT' | 'OUTPUT' | 'FORWARD';
    if (!['INPUT', 'OUTPUT', 'FORWARD'].includes(chain)) return err(`iptables: unknown chain '${args[1]}'`);
    const rule = args.slice(2).join(' ');
    state.firewallRules.push({ chain, rule });
    return '';
  }
  if (args[0] === '-D') {
    const chain = args[1] as 'INPUT' | 'OUTPUT' | 'FORWARD';
    const idx = parseInt(args[2], 10);
    const chainRules = state.firewallRules.filter((r) => r.chain === chain);
    const target = chainRules[idx - 1];
    if (!target) return err(`iptables: Index ${args[2]} is out of range for chain ${chain}`);
    state.firewallRules.splice(state.firewallRules.indexOf(target), 1);
    return '';
  }
  if (args[0] === '-P') {
    const chain = args[1] as 'INPUT' | 'OUTPUT' | 'FORWARD';
    const policy = args[2];
    if (!['INPUT', 'OUTPUT', 'FORWARD'].includes(chain) || !policy) return err('usage: iptables -P <CHAIN> <ACCEPT|DROP>');
    state.firewallPolicy[chain] = policy;
    return '';
  }
  return err('usage: iptables -L | -A <chain> <rule> | -D <chain> <index> | -P <chain> <policy>');
};

const nft: CommandFn = (args, state) => {
  if (args[0] === 'list' && args[1] === 'ruleset') {
    return state.nftRules.length === 0 ? '' : state.nftRules.join('\n');
  }
  if (args[0] === 'add' && args[1] === 'rule') {
    state.nftRules.push(args.slice(2).join(' '));
    return '';
  }
  if (args[0] === 'add' && (args[1] === 'table' || args[1] === 'chain')) {
    state.nftRules.push(args.join(' '));
    return '';
  }
  if (args[0] === 'flush' && args[1] === 'ruleset') {
    state.nftRules = [];
    return '';
  }
  return err('usage: nft list ruleset | add table/chain/rule ... | flush ruleset');
};

// --- DHCP / VPN --------------------------------------------------------------------

const dhclient: CommandFn = (args, state) => {
  const iface = args.find((a) => !a.startsWith('-')) ?? 'eth0';
  const found = state.interfaces.find((i) => i.name === iface);
  if (!found) return err(`dhclient: unknown interface ${iface}`);
  found.ip = '10.0.0.' + (15 + Math.floor(Math.random() * 10));
  state.dhcpLeased = true;
  return [
    `Internet Systems Consortium DHCP Client`,
    `Listening on LPF/${iface}/${found.mac}`,
    `DHCPREQUEST for ${found.ip} on ${iface}`,
    `DHCPACK of ${found.ip} from 10.0.0.1`,
    `bound to ${found.ip} -- renewal in 1800 seconds.`
  ].join('\n');
};

const wg: CommandFn = (args, state) => {
  if (args[0] === 'show') {
    if (!state.vpnActive) return '';
    return [
      `interface: wg0`,
      `  public key: (hidden)`,
      `  listening port: 51820`,
      '',
      `peer: (hidden)`,
      `  endpoint: 203.0.113.10:51820`,
      `  allowed ips: 10.8.0.0/24`,
      `  latest handshake: 12 seconds ago`
    ].join('\n');
  }
  return err('usage: wg show');
};

const wgQuick: CommandFn = (args, state) => {
  const [action, iface] = args;
  if (action === 'up') { state.vpnActive = true; return `[#] ip link add ${iface ?? 'wg0'} type wireguard\n[#] wg0: interface up`; }
  if (action === 'down') { state.vpnActive = false; return `[#] wg0: interface down`; }
  return err('usage: wg-quick up|down <interface>');
};

// --- hardening & access control (Module 7) -----------------------------------

const sudo: CommandFn = (args, state, stdin) => {
  let rest = args;
  if (rest[0] === '-l') return `User ${state.currentUser} may run the following commands on ${state.hostname}:\n    (ALL : ALL) ALL`;
  if (rest[0] === '-u') rest = rest.slice(2); // simplified: ignore target user, always elevate to root
  if (rest.length === 0) return err('usage: sudo [-l] [-u user] command [args...]');
  const [cmd, ...cmdArgs] = rest;
  const fn = commandRegistry[cmd];
  if (!fn) return err(`sudo: ${cmd}: command not found`);
  const userRec = state.users[state.currentUser];
  const allowed = state.currentUser === 'root' || (userRec && userRec.groups.includes('sudo'));
  if (!allowed) {
    state.auditLog.push(`type=USER_AUTH msg=audit(${Date.now()}): user=${state.currentUser} exe="/usr/bin/sudo" res=failed`);
    return err(`${state.currentUser} is not in the sudoers file.  This incident will be reported.`);
  }
  const prevUser = state.currentUser;
  state.currentUser = 'root';
  try {
    return fn(cmdArgs, state, stdin);
  } finally {
    state.currentUser = prevUser;
  }
};

const ufw: CommandFn = (args, state) => {
  const sub = args[0];
  if (sub === 'enable') { state.ufwEnabled = true; return 'Firewall is active and enabled on system startup'; }
  if (sub === 'disable') { state.ufwEnabled = false; return 'Firewall stopped and disabled on system startup'; }
  if (sub === 'status') {
    if (!state.ufwEnabled) return 'Status: inactive';
    const lines = ['Status: active', '', 'To                         Action      From'];
    for (const r of state.ufwRules) {
      lines.push(`${pad(r.target, 27)}${pad(r.action.toUpperCase(), 12)}Anywhere`);
    }
    return lines.join('\n');
  }
  if (sub === 'allow' || sub === 'deny') {
    const target = args[1];
    if (!target) return err(`usage: ufw ${sub} <port|service>`);
    state.ufwRules.push({ action: sub, target });
    return `Rule added`;
  }
  if (sub === 'delete') {
    const target = args.slice(1).join(' ').replace(/^(allow|deny)\s+/, '');
    state.ufwRules = state.ufwRules.filter((r) => r.target !== target);
    return `Rule deleted`;
  }
  return err('usage: ufw enable|disable|status|allow <port>|deny <port>|delete allow <port>');
};

const fail2banClient: CommandFn = (args, state) => {
  const sub = args[0];
  if (sub === 'status') {
    if (args[1]) {
      const jail = args[1];
      return [
        `Status for the jail: ${jail}`,
        `|- Filter`,
        `|  |- Currently failed: 0`,
        `|  \`- Total failed: ${state.fail2banBans.length}`,
        `\`- Actions`,
        `   |- Currently banned: ${state.fail2banBans.length}`,
        `   \`- Banned IP list: ${state.fail2banBans.join(' ')}`
      ].join('\n');
    }
    return [
      `Status`,
      `|- Number of jail: 1`,
      `\`- Jail list: sshd`
    ].join('\n');
  }
  if (sub === 'set' && args[2] === 'banip') {
    const ip = args[3];
    if (ip && !state.fail2banBans.includes(ip)) state.fail2banBans.push(ip);
    return `Banned IP list: ${ip}`;
  }
  if (sub === 'set' && args[2] === 'unbanip') {
    const ip = args[3];
    state.fail2banBans = state.fail2banBans.filter((b) => b !== ip);
    return `Unbanned IP: ${ip}`;
  }
  return err('usage: fail2ban-client status [jail] | set <jail> banip <ip> | set <jail> unbanip <ip>');
};

const chage: CommandFn = (args, state) => {
  const flags = args.filter((a) => a.startsWith('-'));
  const targets = args.filter((a) => !a.startsWith('-'));
  const listMode = flags.includes('-l');
  const user = targets[targets.length - 1];
  if (!user || !(user in state.passwordAge)) return err(`chage: user '${user}' does not exist`);
  const rec = state.passwordAge[user];
  if (listMode) {
    return [
      `Last password change                                   : ${rec.lastChange}`,
      `Password expires                                       : never`,
      `Password inactive                                      : never`,
      `Account expires                                        : never`,
      `Minimum number of days between password change         : ${rec.minDays}`,
      `Maximum number of days between password change         : ${rec.maxDays}`,
      `Number of days of warning before password expires      : ${rec.warnDays}`
    ].join('\n');
  }
  const mIdx = args.indexOf('-M');
  if (mIdx !== -1) rec.maxDays = parseInt(args[mIdx + 1], 10);
  const nIdx = args.indexOf('-m');
  if (nIdx !== -1) rec.minDays = parseInt(args[nIdx + 1], 10);
  const wIdx = args.indexOf('-W');
  if (wIdx !== -1) rec.warnDays = parseInt(args[wIdx + 1], 10);
  return '';
};

const auditctl: CommandFn = (args, state) => {
  if (args[0] === '-l') return state.auditRules.length ? state.auditRules.join('\n') : 'No rules';
  if (args[0] === '-w') {
    const path = args[1];
    const permIdx = args.indexOf('-p');
    const perms = permIdx !== -1 ? args[permIdx + 1] : 'rwxa';
    const keyIdx = args.indexOf('-k');
    const key = keyIdx !== -1 ? args[keyIdx + 1] : '';
    const rule = `-w ${path} -p ${perms}${key ? ` -k ${key}` : ''}`;
    state.auditRules.push(rule);
    return '';
  }
  if (args[0] === '-D') { state.auditRules = []; return 'No rules'; }
  return err('usage: auditctl -w <path> -p <perms> -k <key> | -l | -D');
};

const ausearch: CommandFn = (args, state) => {
  const keyIdx = args.indexOf('-k');
  const key = keyIdx !== -1 ? args[keyIdx + 1] : null;
  const matches = key ? state.auditLog.filter((l) => l.includes(key)) : state.auditLog;
  return matches.length ? matches.join('\n') : '<no matches>';
};

// --- version control (Module 9) -----------------------------------------------

const GIT_AUTHOR = 'student <student@linuxlab>';

function fakeHash(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(7, '0').slice(0, 7);
}

function findRepoRoot(state: ShellState): string[] | null {
  for (let len = state.cwd.length; len >= 0; len--) {
    const segs = state.cwd.slice(0, len);
    if (state.gitRepos[formatPath(segs)]) return segs;
  }
  return null;
}

function gitRelPath(rootSegs: string[], fullSegs: string[]): string {
  return fullSegs.slice(rootSegs.length).join('/');
}

function collectRepoFiles(node: FSNode, prefix: string, out: Record<string, string>) {
  if (node.type === 'file') { out[prefix] = node.content; return; }
  if (node.type !== 'dir') return;
  for (const [name, child] of Object.entries(node.children)) {
    if (name === '.git') continue;
    collectRepoFiles(child, prefix ? `${prefix}/${name}` : name, out);
  }
}

function workingFiles(state: ShellState, rootSegs: string[]): Record<string, string> {
  const rootNode = getNode(state.root, rootSegs);
  const out: Record<string, string> = {};
  if (rootNode) collectRepoFiles(rootNode, '', out);
  return out;
}

function allTrackedPaths(repo: GitRepo): Set<string> {
  const set = new Set<string>();
  for (const c of Object.values(repo.commits)) for (const k of Object.keys(c.files)) set.add(k);
  for (const k of Object.keys(repo.staged)) set.add(k);
  return set;
}

function ensureFileAt(state: ShellState, segs: string[], content: string) {
  let cur: DirNode = state.root;
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i];
    if (!cur.children[seg]) cur.children[seg] = dir({}, state.currentUser, state.currentUser);
    const next = cur.children[seg];
    if (next.type !== 'dir') return;
    cur = next;
  }
  const name = segs[segs.length - 1];
  cur.children[name] = file(content, state.currentUser, state.currentUser);
}

function writeRepoFiles(state: ShellState, rootSegs: string[], repo: GitRepo, target: Record<string, string>) {
  const paths = new Set([...allTrackedPaths(repo), ...Object.keys(target)]);
  for (const rel of paths) {
    const segs = [...rootSegs, ...rel.split('/')];
    if (rel in target) {
      ensureFileAt(state, segs, target[rel]);
    } else {
      const { parent, name } = getParentAndName(state.root, segs);
      if (parent && parent.children[name]) delete parent.children[name];
    }
  }
}

function simpleDiff(oldStr: string, newStr: string, label: string): string {
  if (oldStr === newStr) return '';
  const oldLines = oldStr.length ? oldStr.split('\n') : [];
  const newLines = newStr.length ? newStr.split('\n') : [];
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);
  const removed = oldLines.filter((l) => !newSet.has(l));
  const added = newLines.filter((l) => !oldSet.has(l));
  const lines = [`--- a/${label}`, `+++ b/${label}`];
  for (const l of removed) lines.push(`-${l}`);
  for (const l of added) lines.push(`+${l}`);
  return lines.join('\n');
}

function gitIgnorePatterns(working: Record<string, string>): string[] {
  const content = working['.gitignore'];
  if (!content) return [];
  return content.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

function isIgnored(rel: string, patterns: string[]): boolean {
  const base = rel.split('/').pop() ?? rel;
  return patterns.some((p) => {
    if (p === rel || p === base) return true;
    if (!p.includes('*')) return false;
    const re = new RegExp('^' + p.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
    return re.test(base);
  });
}

function gitInit(state: ShellState): string {
  const rootSegs = state.cwd;
  const key = formatPath(rootSegs);
  if (state.gitRepos[key]) return `Reinitialized existing Git repository in ${key}/.git/`;
  state.gitRepos[key] = {
    branch: 'main', branches: { main: '' }, commits: {}, staged: {}, remotes: {},
    stashes: [], conflictFiles: [], mergingBranch: null, nextCommitNum: 0
  };
  const node = getNode(state.root, rootSegs);
  if (node && node.type === 'dir' && !node.children['.git']) {
    node.children['.git'] = dir({ HEAD: file('ref: refs/heads/main\n', state.currentUser, state.currentUser) }, state.currentUser, state.currentUser);
  }
  return `Initialized empty Git repository in ${key}/.git/`;
}

function gitStatusText(state: ShellState, rootSegs: string[], repo: GitRepo): string {
  const working = workingFiles(state, rootSegs);
  const patterns = gitIgnorePatterns(working);
  const headHash = repo.branches[repo.branch];
  const headFiles = headHash ? repo.commits[headHash].files : {};
  const staged: string[] = [];
  const modified: string[] = [];
  const untracked: string[] = [];
  const allPaths = new Set([...Object.keys(working), ...Object.keys(headFiles), ...Object.keys(repo.staged)]);
  for (const p of allPaths) {
    const inWorking = p in working;
    const isStagedDiff = p in repo.staged && repo.staged[p] !== (headFiles[p] ?? undefined);
    const trackedContent = p in repo.staged ? repo.staged[p] : headFiles[p];
    const isTracked = trackedContent !== undefined;
    if (isStagedDiff) staged.push(p);
    if (isTracked && inWorking && working[p] !== trackedContent) modified.push(p);
    if (!isTracked && inWorking && !isIgnored(p, patterns)) untracked.push(p);
  }
  const lines = [`On branch ${repo.branch}`];
  if (repo.mergingBranch) lines.push(`You have unmerged paths.`, `  (fix conflicts and run "git commit")`, '');
  if (staged.length) { lines.push('Changes to be committed:'); for (const p of staged) lines.push(`\tmodified:   ${p}`); lines.push(''); }
  if (modified.length) { lines.push('Changes not staged for commit:'); for (const p of modified) lines.push(`\tmodified:   ${p}`); lines.push(''); }
  if (untracked.length) { lines.push('Untracked files:'); for (const p of untracked) lines.push(`\t${p}`); lines.push(''); }
  if (!staged.length && !modified.length && !untracked.length && !repo.mergingBranch) lines.push('nothing to commit, working tree clean');
  return lines.join('\n').trimEnd();
}

function gitAdd(state: ShellState, rootSegs: string[], repo: GitRepo, args: string[]): string {
  const working = workingFiles(state, rootSegs);
  const patterns = gitIgnorePatterns(working);
  let targets: string[];
  if (args.includes('.') || args.includes('-A') || args.includes('--all')) {
    targets = Object.keys(working).filter((p) => !isIgnored(p, patterns));
  } else {
    targets = args.map((a) => gitRelPath(rootSegs, state.resolve(a)));
  }
  for (const rel of targets) {
    if (rel in working) repo.staged[rel] = working[rel];
  }
  return '';
}

function gitCommit(state: ShellState, rootSegs: string[], repo: GitRepo, args: string[]): string {
  const mIdx = args.indexOf('-m');
  const message = mIdx !== -1 ? args[mIdx + 1] : null;
  if (!message) return err("git commit: option -m required (aborting commit due to empty commit message)");
  if (repo.mergingBranch && repo.conflictFiles.length > 0) {
    return err(`error: Committing is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use 'git add' to mark resolution\nhint: and make a commit.`);
  }
  const headHash = repo.branches[repo.branch];
  const headFiles = headHash ? repo.commits[headHash].files : {};
  const newFiles = { ...headFiles, ...repo.staged };
  const parent = headHash || null;
  repo.nextCommitNum++;
  const hash = fakeHash(`${message}-${repo.nextCommitNum}-${Object.keys(newFiles).length}`);
  const commit: GitCommit = { hash, parent, message, author: GIT_AUTHOR, timestamp: 'just now', files: newFiles };
  repo.commits[hash] = commit;
  repo.branches[repo.branch] = hash;
  const wasMerge = !!repo.mergingBranch;
  repo.mergingBranch = null;
  repo.conflictFiles = [];
  return `[${repo.branch}${parent ? '' : ' (root-commit)'} ${hash}] ${message}${wasMerge ? '\nMerge made.' : ''}`;
}

function gitLog(repo: GitRepo, args: string[]): string {
  const oneline = args.includes('--oneline');
  const hash = repo.branches[repo.branch];
  if (!hash) return '';
  const lines: string[] = [];
  let cur: string | null = hash;
  while (cur) {
    const c: GitCommit | undefined = repo.commits[cur];
    if (!c) break;
    if (oneline) lines.push(`${c.hash} ${c.message}`);
    else lines.push(`commit ${c.hash}`, `Author: ${c.author}`, `Date:   ${c.timestamp}`, '', `    ${c.message}`, '');
    cur = c.parent;
  }
  return lines.join('\n').trimEnd();
}

function gitDiff(state: ShellState, rootSegs: string[], repo: GitRepo, args: string[]): string {
  const staged = args.includes('--staged') || args.includes('--cached');
  const working = workingFiles(state, rootSegs);
  const headHash = repo.branches[repo.branch];
  const headFiles = headHash ? repo.commits[headHash].files : {};
  const base: Record<string, string> = staged ? headFiles : repo.staged;
  const compare: Record<string, string> = staged ? repo.staged : working;
  const paths = new Set([...Object.keys(base), ...Object.keys(compare)]);
  const chunks: string[] = [];
  for (const p of paths) {
    const d = simpleDiff(base[p] ?? '', compare[p] ?? '', p);
    if (d) chunks.push(d);
  }
  return chunks.join('\n\n');
}

function gitBranch(repo: GitRepo, args: string[]): string {
  const targets = args.filter((a) => !a.startsWith('-'));
  if (targets.length === 0) {
    return Object.keys(repo.branches).map((b) => (b === repo.branch ? `* ${b}` : `  ${b}`)).join('\n');
  }
  repo.branches[targets[0]] = repo.branches[repo.branch];
  return '';
}

function gitCheckout(state: ShellState, rootSegs: string[], repo: GitRepo, args: string[]): string {
  const dashDashIdx = args.indexOf('--');
  if (dashDashIdx !== -1) {
    const targetFile = args[dashDashIdx + 1];
    const rel = gitRelPath(rootSegs, state.resolve(targetFile));
    const headHash = repo.branches[repo.branch];
    const headFiles = headHash ? repo.commits[headHash].files : {};
    const content = rel in repo.staged ? repo.staged[rel] : headFiles[rel];
    if (content !== undefined) ensureFileAt(state, [...rootSegs, ...rel.split('/')], content);
    return '';
  }
  const createNew = args.includes('-b');
  const name = createNew ? args[args.indexOf('-b') + 1] : args.find((a) => !a.startsWith('-'));
  if (!name) return err('usage: git checkout [-b] <branch>');
  if (createNew) {
    if (repo.branches[name]) return err(`fatal: A branch named '${name}' already exists.`);
    repo.branches[name] = repo.branches[repo.branch];
  } else if (!repo.branches[name]) {
    return err(`error: pathspec '${name}' did not match any file(s) known to git`);
  }
  repo.branch = name;
  const hash = repo.branches[name];
  const files = hash ? repo.commits[hash].files : {};
  writeRepoFiles(state, rootSegs, repo, files);
  return createNew ? `Switched to a new branch '${name}'` : `Switched to branch '${name}'`;
}

function gitMerge(state: ShellState, rootSegs: string[], repo: GitRepo, args: string[]): string {
  const name = args.find((a) => !a.startsWith('-'));
  if (!name || !(name in repo.branches)) return err(`merge: ${name ?? ''} - not something we can merge`);
  const targetHash = repo.branches[name];
  const currentHash = repo.branches[repo.branch];
  if (targetHash === currentHash) return 'Already up to date.';
  const targetFiles = targetHash ? repo.commits[targetHash].files : {};
  const currentFiles = currentHash ? repo.commits[currentHash].files : {};

  let isAncestor = false;
  let ffCur: string | null = targetHash;
  while (ffCur) {
    if (ffCur === currentHash) { isAncestor = true; break; }
    ffCur = repo.commits[ffCur]?.parent ?? null;
  }
  if (isAncestor) {
    repo.branches[repo.branch] = targetHash;
    repo.staged = { ...targetFiles };
    writeRepoFiles(state, rootSegs, repo, targetFiles);
    return `Updating ${(currentHash || '0000000').slice(0, 7)}..${targetHash.slice(0, 7)}\nFast-forward`;
  }

  const visited = new Set<string>();
  let vCur: string | null = currentHash;
  while (vCur) { visited.add(vCur); vCur = repo.commits[vCur]?.parent ?? null; }
  let ancestorHash: string | null = targetHash;
  while (ancestorHash && !visited.has(ancestorHash)) ancestorHash = repo.commits[ancestorHash]?.parent ?? null;
  const baseFiles = ancestorHash ? repo.commits[ancestorHash].files : {};

  const merged: Record<string, string> = { ...currentFiles };
  const conflicts: string[] = [];
  const allPaths = new Set([...Object.keys(currentFiles), ...Object.keys(targetFiles), ...Object.keys(baseFiles)]);
  for (const p of allPaths) {
    const baseC = baseFiles[p];
    const curC = currentFiles[p];
    const tgtC = targetFiles[p];
    if (curC === tgtC) { if (curC !== undefined) merged[p] = curC; else delete merged[p]; continue; }
    if (curC === baseC) { if (tgtC !== undefined) merged[p] = tgtC; else delete merged[p]; continue; }
    if (tgtC === baseC) continue;
    conflicts.push(p);
    merged[p] = `<<<<<<< HEAD\n${curC ?? ''}\n=======\n${tgtC ?? ''}\n>>>>>>> ${name}\n`;
  }
  writeRepoFiles(state, rootSegs, repo, merged);
  repo.staged = { ...merged };
  repo.mergingBranch = name;
  if (conflicts.length) {
    repo.conflictFiles = conflicts;
    return err(`Auto-merging ${conflicts.join(', ')}\nCONFLICT (content): Merge conflict in ${conflicts.join(', ')}\nAutomatic merge failed; fix conflicts and then commit the result.`);
  }
  repo.conflictFiles = [];
  return `Merge made by the 'recursive' strategy.`;
}

function gitStash(state: ShellState, rootSegs: string[], repo: GitRepo, args: string[]): string {
  const sub = args[0];
  if (sub === 'pop') {
    const top = repo.stashes.pop();
    if (!top) return err('No stash entries found.');
    const working = workingFiles(state, rootSegs);
    writeRepoFiles(state, rootSegs, repo, { ...working, ...top.files });
    return `Dropped stash@{0}`;
  }
  if (sub === 'list') {
    return [...repo.stashes].reverse().map((s, i) => `stash@{${i}}: ${s.message}`).join('\n');
  }
  const working = workingFiles(state, rootSegs);
  const headHash = repo.branches[repo.branch];
  const headFiles = headHash ? repo.commits[headHash].files : {};
  const changed: Record<string, string> = {};
  for (const [p, c] of Object.entries(working)) {
    if (c !== (repo.staged[p] ?? headFiles[p])) changed[p] = c;
  }
  if (Object.keys(changed).length === 0) return 'No local changes to save';
  repo.stashes.push({ message: `WIP on ${repo.branch}`, files: changed });
  const baseline = { ...working };
  for (const p of Object.keys(changed)) baseline[p] = repo.staged[p] ?? headFiles[p] ?? '';
  writeRepoFiles(state, rootSegs, repo, baseline);
  return `Saved working directory and index state WIP on ${repo.branch}`;
}

function gitRemote(repo: GitRepo, args: string[]): string {
  if (args[0] === 'add') { repo.remotes[args[1]] = args[2]; return ''; }
  if (args[0] === '-v') return Object.entries(repo.remotes).map(([n, u]) => `${n}\t${u} (fetch)\n${n}\t${u} (push)`).join('\n');
  return Object.keys(repo.remotes).join('\n');
}

function gitPush(repo: GitRepo, args: string[]): string {
  const remote = args.find((a) => !a.startsWith('-')) ?? 'origin';
  if (!repo.remotes[remote]) return err(`fatal: '${remote}' does not appear to be a git repository`);
  const hash = (repo.branches[repo.branch] || '0000000').slice(0, 7);
  return [
    `Enumerating objects, done.`,
    `Writing objects: 100% done.`,
    `To ${repo.remotes[remote]}`,
    `   ${hash}..${hash}  ${repo.branch} -> ${repo.branch}`
  ].join('\n');
}

function gitPull(repo: GitRepo, args: string[]): string {
  const remote = args.find((a) => !a.startsWith('-')) ?? 'origin';
  if (!repo.remotes[remote]) return err(`fatal: '${remote}' does not appear to be a git repository`);
  return `Already up to date.`;
}

const TEMPLATE_README = '# Demo Project\n\nA starter repository for practicing git.\n';

function gitClone(state: ShellState, args: string[]): string {
  const url = args.find((a) => !a.startsWith('-'));
  if (!url) return err('usage: git clone <repository> [directory]');
  const explicitDir = args.filter((a) => !a.startsWith('-'))[1];
  const dirName = explicitDir ?? (url.split('/').pop() ?? 'repo').replace(/\.git$/, '');
  const destSegs = state.resolve(dirName);
  const { parent, name } = getParentAndName(state.root, destSegs);
  if (!parent) return err(`fatal: could not create work tree dir '${dirName}'`);
  if (parent.children[name]) return err(`fatal: destination path '${dirName}' already exists and is not an empty directory.`);
  parent.children[name] = dir({ 'README.md': file(TEMPLATE_README, state.currentUser, state.currentUser) }, state.currentUser, state.currentUser);
  const key = formatPath(destSegs);
  const hash = fakeHash('initial-clone-' + dirName);
  state.gitRepos[key] = {
    branch: 'main',
    branches: { main: hash },
    commits: { [hash]: { hash, parent: null, message: 'Initial commit', author: 'instructor <instructor@linuxlab>', timestamp: 'earlier', files: { 'README.md': TEMPLATE_README } } },
    staged: { 'README.md': TEMPLATE_README },
    remotes: { origin: url },
    stashes: [], conflictFiles: [], mergingBranch: null, nextCommitNum: 1
  };
  return `Cloning into '${dirName}'...\nremote: Enumerating objects: 3, done.\nReceiving objects: 100% (3/3), done.`;
}

function gitReset(state: ShellState, rootSegs: string[], repo: GitRepo, args: string[]): string {
  if (args.includes('--hard')) {
    const headHash = repo.branches[repo.branch];
    const files = headHash ? repo.commits[headHash].files : {};
    repo.staged = { ...files };
    writeRepoFiles(state, rootSegs, repo, files);
    return `HEAD is now at ${headHash ? headHash.slice(0, 7) : '0000000'}`;
  }
  return err('usage: git reset --hard');
}

const gitCmd: CommandFn = (args, state) => {
  const sub = args[0];
  const rest = args.slice(1);
  if (sub === 'init') return gitInit(state);
  if (sub === 'clone') return gitClone(state, rest);
  if (sub === '--version') return 'git version 2.43.0';
  const rootSegs = findRepoRoot(state);
  if (!rootSegs) return err('fatal: not a git repository (or any of the parent directories): .git');
  const repo = state.gitRepos[formatPath(rootSegs)];
  switch (sub) {
    case 'status': return gitStatusText(state, rootSegs, repo);
    case 'add': return gitAdd(state, rootSegs, repo, rest);
    case 'commit': return gitCommit(state, rootSegs, repo, rest);
    case 'log': return gitLog(repo, rest);
    case 'diff': return gitDiff(state, rootSegs, repo, rest);
    case 'branch': return gitBranch(repo, rest);
    case 'checkout': return gitCheckout(state, rootSegs, repo, rest);
    case 'merge': return gitMerge(state, rootSegs, repo, rest);
    case 'stash': return gitStash(state, rootSegs, repo, rest);
    case 'remote': return gitRemote(repo, rest);
    case 'push': return gitPush(repo, rest);
    case 'pull': return gitPull(repo, rest);
    case 'reset': return gitReset(state, rootSegs, repo, rest);
    default: return err(`git: '${sub}' is not a git command. See 'git --help'.`);
  }
};

// --- containers (Module 10) ------------------------------------------------------

const AVAILABLE_IMAGES: Record<string, number> = {
  'nginx': 142, 'nginx:latest': 142, 'nginx:alpine': 42,
  'ubuntu': 77, 'ubuntu:22.04': 77,
  'redis': 32, 'redis:alpine': 18,
  'node': 190, 'node:20': 190,
  'python': 250, 'python:3.12': 250,
  'postgres': 210, 'postgres:16': 210,
  'busybox': 4
};

const SERVICE_IMAGES = new Set(['nginx', 'redis', 'postgres', 'node']);

function imageNameTag(ref: string): { name: string; tag: string } {
  const idx = ref.lastIndexOf(':');
  if (idx === -1) return { name: ref, tag: 'latest' };
  return { name: ref.slice(0, idx), tag: ref.slice(idx + 1) };
}

function findImage(state: ShellState, ref: string): DockerImage | undefined {
  const { name, tag } = imageNameTag(ref);
  return state.dockerImages.find((i) => i.repository === name && i.tag === tag);
}

function pullImage(state: ShellState, ref: string): DockerImage | null {
  const existing = findImage(state, ref);
  if (existing) return existing;
  const { name, tag } = imageNameTag(ref);
  const key = tag === 'latest' && !(ref in AVAILABLE_IMAGES) ? name : ref;
  const sizeMB = AVAILABLE_IMAGES[key] ?? AVAILABLE_IMAGES[name];
  if (sizeMB === undefined) return null;
  const image: DockerImage = { repository: name, tag, imageId: fakeHash(name + tag), sizeMB };
  state.dockerImages.push(image);
  return image;
}

const dockerCmd: CommandFn = (args, state) => {
  const sub = args[0];
  const rest = args.slice(1);
  if (sub === '--version') return 'Docker version 24.0.7, build afdd53b';
  if (sub === 'info') return `Containers: ${state.dockerContainers.length}\nImages: ${state.dockerImages.length}\nServer Version: 24.0.7`;

  if (sub === 'pull') {
    const ref = rest[0];
    if (!ref) return err('usage: docker pull <image>');
    const existed = !!findImage(state, ref);
    const image = pullImage(state, ref);
    if (!image) return err(`Error response from daemon: pull access denied for ${ref}, repository does not exist or may require 'docker login'`);
    if (existed) return `${image.tag}: Pulling from library/${image.repository}\nDigest: sha256:${image.imageId}\nStatus: Image is up to date for ${ref}`;
    return [
      `${image.tag}: Pulling from library/${image.repository}`,
      `Digest: sha256:${image.imageId}`,
      `Status: Downloaded newer image for ${ref}`
    ].join('\n');
  }

  if (sub === 'images') {
    const header = `${pad('REPOSITORY', 20)}${pad('TAG', 12)}${pad('IMAGE ID', 16)}SIZE`;
    const rows = state.dockerImages.map((i) => `${pad(i.repository, 20)}${pad(i.tag, 12)}${pad(i.imageId, 16)}${i.sizeMB}MB`);
    return [header, ...rows].join('\n');
  }

  if (sub === 'run') {
    const flags = rest.filter((a) => a.startsWith('-'));
    const detached = flags.includes('-d') || flags.includes('--detach');
    const nameIdx = rest.indexOf('--name');
    const explicitName = nameIdx !== -1 ? rest[nameIdx + 1] : null;
    const ports = rest.flatMap((a, i) => (rest[i - 1] === '-p' ? [a] : []));
    const positional = rest.filter((a, i) => !a.startsWith('-') && rest[i - 1] !== '--name' && rest[i - 1] !== '-p' && rest[i - 1] !== '-v');
    const imageRef = positional[0];
    if (!imageRef) return err('docker: "docker run" requires at least 1 argument.');
    let image = findImage(state, imageRef);
    const pullLines: string[] = [];
    if (!image) {
      image = pullImage(state, imageRef) ?? undefined;
      if (!image) return err(`Unable to find image '${imageRef}' locally\ndocker: Error response from daemon: pull access denied for ${imageRef}.`);
      pullLines.push(`Unable to find image '${imageRef}' locally`, `${image.tag}: Pulling from library/${image.repository}`, `Status: Downloaded newer image for ${imageRef}`);
    }
    const command = positional.slice(1).join(' ');
    const id = fakeHash(`${imageRef}-${state.nextContainerId}`);
    const name = explicitName ?? `${image.repository}-${state.nextContainerId}`;
    state.nextContainerId++;
    const isService = SERVICE_IMAGES.has(image.repository) && !positional[1];
    const status: 'running' | 'exited' = detached || isService ? 'running' : (positional[1] ? 'exited' : 'running');
    const container: DockerContainer = {
      id, name, image: imageRef, command: command || (isService ? `docker-entrypoint.sh` : '/bin/sh'),
      status, ports, volumes: [], network: 'bridge'
    };
    state.dockerContainers.push(container);
    if (!detached && !isService && positional[1]) {
      return [...pullLines, `Executing: ${command}`].filter(Boolean).join('\n');
    }
    return [...pullLines, id].filter(Boolean).join('\n');
  }

  if (sub === 'ps') {
    const all = rest.includes('-a') || rest.includes('--all');
    const list = all ? state.dockerContainers : state.dockerContainers.filter((c) => c.status === 'running');
    const header = `${pad('CONTAINER ID', 14)}${pad('IMAGE', 16)}${pad('COMMAND', 20)}${pad('STATUS', 12)}${pad('PORTS', 20)}NAMES`;
    const rows = list.map((c) => `${pad(c.id, 14)}${pad(c.image, 16)}${pad(`"${c.command}"`, 20)}${pad(c.status === 'running' ? 'Up' : 'Exited', 12)}${pad(c.ports.join(','), 20)}${c.name}`);
    return [header, ...rows].join('\n');
  }

  if (sub === 'stop' || sub === 'start' || sub === 'rm') {
    const target = rest.find((a) => !a.startsWith('-'));
    if (!target) return err(`usage: docker ${sub} <container>`);
    const c = state.dockerContainers.find((x) => x.name === target || x.id === target);
    if (!c) return err(`Error: No such container: ${target}`);
    if (sub === 'stop') { c.status = 'exited'; return c.name; }
    if (sub === 'start') { c.status = 'running'; return c.name; }
    if (c.status === 'running' && !rest.includes('-f')) return err(`Error response from daemon: You cannot remove a running container ${c.id}. Stop the container before attempting removal or force remove`);
    state.dockerContainers = state.dockerContainers.filter((x) => x !== c);
    return c.name;
  }

  if (sub === 'rmi') {
    const target = rest.find((a) => !a.startsWith('-'));
    if (!target) return err('usage: docker rmi <image>');
    const image = findImage(state, target);
    if (!image) return err(`Error: No such image: ${target}`);
    const inUse = state.dockerContainers.some((c) => c.image === target || c.image === `${image.repository}:${image.tag}`);
    if (inUse && !rest.includes('-f')) return err(`Error response from daemon: conflict: unable to remove repository reference "${target}" (must force) - container is using its referenced image`);
    state.dockerImages = state.dockerImages.filter((i) => i !== image);
    return `Untagged: ${target}\nDeleted: sha256:${image.imageId}`;
  }

  if (sub === 'logs') {
    const target = rest.find((a) => !a.startsWith('-'));
    const c = state.dockerContainers.find((x) => x.name === target || x.id === target);
    if (!c) return err(`Error: No such container: ${target}`);
    const base = imageNameTag(c.image).name;
    if (base === 'nginx') return [`/docker-entrypoint.sh: Configuration complete; ready for start up`, `10.0.0.15 - - [15/Jan/2026:09:00:00] "GET / HTTP/1.1" 200 612`].join('\n');
    if (base === 'redis') return [`1:M Ready to accept connections tcp`, `1:M Loading RDB produced by version 7.2.0`].join('\n');
    if (base === 'postgres') return [`database system is ready to accept connections`, `LOG:  listening on IPv4 address "0.0.0.0", port 5432`].join('\n');
    return `${c.command}\ncontainer started`;
  }

  if (sub === 'exec') {
    const target = rest[0];
    const c = state.dockerContainers.find((x) => x.name === target || x.id === target);
    if (!c) return err(`Error: No such container: ${target}`);
    if (c.status !== 'running') return err(`Error response from daemon: Container ${c.id} is not running`);
    const cmdArgs = rest.slice(1).filter((a) => a !== '-it' && a !== '-i' && a !== '-t');
    const inner = cmdArgs.join(' ');
    if (inner === 'whoami') return 'root';
    if (inner.startsWith('ls')) return 'bin  dev  etc  home  lib  proc  root  tmp  usr  var';
    if (inner.startsWith('cat /etc/os-release')) return 'PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"';
    return '';
  }

  if (sub === 'volume') {
    if (rest[0] === 'create') { const name = rest[1]; if (name && !state.dockerVolumes.includes(name)) state.dockerVolumes.push(name); return name ?? ''; }
    if (rest[0] === 'ls') return [`${pad('DRIVER', 10)}VOLUME NAME`, ...state.dockerVolumes.map((v) => `${pad('local', 10)}${v}`)].join('\n');
    return err('usage: docker volume create <name> | docker volume ls');
  }

  if (sub === 'network') {
    if (rest[0] === 'create') { const name = rest[rest.length - 1]; if (name) state.dockerNetworks.push({ name, driver: 'bridge' }); return fakeHash(name ?? 'net'); }
    if (rest[0] === 'ls') return [`${pad('NETWORK ID', 14)}${pad('NAME', 16)}DRIVER`, ...state.dockerNetworks.map((n) => `${pad(fakeHash(n.name), 14)}${pad(n.name, 16)}${n.driver}`)].join('\n');
    return err('usage: docker network create <name> | docker network ls');
  }

  if (sub === 'build') {
    const tIdx = rest.indexOf('-t');
    const tagRef = tIdx !== -1 ? rest[tIdx + 1] : null;
    if (!tagRef) return err('usage: docker build -t <name:tag> .');
    const dockerfileNode = getNode(state.root, state.resolve('Dockerfile'));
    if (!dockerfileNode || dockerfileNode.type !== 'file') {
      return err('unable to prepare context: unable to evaluate symlinks in Dockerfile path: lstat Dockerfile: no such file or directory');
    }
    const fromLine = dockerfileNode.content.split('\n').find((l) => l.trim().startsWith('FROM'));
    const baseRef = fromLine ? fromLine.trim().split(/\s+/)[1] : 'ubuntu';
    const baseImage = pullImage(state, baseRef);
    const { name, tag } = imageNameTag(tagRef);
    const newImage: DockerImage = { repository: name, tag, imageId: fakeHash(tagRef), sizeMB: (baseImage?.sizeMB ?? 77) + 20 };
    state.dockerImages = state.dockerImages.filter((i) => !(i.repository === name && i.tag === tag));
    state.dockerImages.push(newImage);
    return [
      `Step 1/1 : FROM ${baseRef}`,
      ` ---> ${baseImage?.imageId ?? fakeHash(baseRef)}`,
      `Successfully built ${newImage.imageId}`,
      `Successfully tagged ${tagRef}`
    ].join('\n');
  }

  return err(`docker: '${sub}' is not a docker command. See 'docker --help'.`);
};

function parseComposeServices(content: string): { name: string; image: string }[] {
  const lines = content.split('\n');
  const services: { name: string; image: string }[] = [];
  let currentService: string | null = null;
  for (const raw of lines) {
    const serviceMatch = /^  ([A-Za-z0-9_-]+):\s*$/.exec(raw);
    if (serviceMatch) { currentService = serviceMatch[1]; continue; }
    const imageMatch = /^\s+image:\s*(\S+)\s*$/.exec(raw);
    if (imageMatch && currentService) {
      services.push({ name: currentService, image: imageMatch[1] });
      currentService = null;
    }
  }
  return services;
}

const dockerComposeCmd: CommandFn = (args, state) => {
  const sub = args[0];
  const fileNode = getNode(state.root, state.resolve('docker-compose.yml'));
  if (!fileNode || fileNode.type !== 'file') return err("ERROR: Can't find a suitable configuration file in this directory. Are you in the right directory?");
  const services = parseComposeServices(fileNode.content);
  if (services.length === 0) return err('ERROR: no services found in docker-compose.yml');

  if (sub === 'down') {
    const names = services.map((s) => s.name);
    state.dockerContainers = state.dockerContainers.filter((c) => !names.includes(c.name));
    return services.map((s) => `Stopping ${s.name} ... done\nRemoving ${s.name} ... done`).join('\n');
  }

  // default: up
  const lines: string[] = [`Creating network "compose_default" with the default driver`];
  for (const s of services) {
    pullImage(state, s.image);
    const existing = state.dockerContainers.find((c) => c.name === s.name);
    if (existing) { existing.status = 'running'; }
    else {
      const id = fakeHash(`${s.name}-${state.nextContainerId}`);
      state.nextContainerId++;
      state.dockerContainers.push({ id, name: s.name, image: s.image, command: '', status: 'running', ports: [], volumes: [], network: 'compose_default' });
    }
    lines.push(`Creating ${s.name} ... done`);
  }
  return lines.join('\n');
};

// --- shell productivity & troubleshooting (Module 11) -------------------------

const aliasCmd: CommandFn = (args, state) => {
  if (args.length === 0) {
    return Object.entries(state.aliases).map(([k, v]) => `alias ${k}='${v}'`).join('\n');
  }
  const results: string[] = [];
  for (const a of args) {
    const m = /^([A-Za-z0-9_.-]+)=(.*)$/.exec(a);
    if (m) {
      state.aliases[m[1]] = m[2].replace(/^['"](.*)['"]$/, '$1');
    } else if (state.aliases[a]) {
      results.push(`alias ${a}='${state.aliases[a]}'`);
    } else {
      results.push(err(`bash: alias: ${a}: not found`));
    }
  }
  return results.join('\n');
};

const unaliasCmd: CommandFn = (args, state) => {
  for (const a of args) delete state.aliases[a];
  return '';
};

/** Very small ~/.bashrc-style interpreter: alias/export/assignment lines, or a single
 * plain command per line. It intentionally doesn't support pipes/redirection/control
 * flow — real bashrc files rarely need them, and "bash <script>" already covers that. */
const sourceCmd: CommandFn = (args, state) => {
  const target = args[0];
  if (!target) return err('usage: source <file>');
  const segs = state.resolve(target);
  const node = getNode(state.root, segs);
  if (!node || node.type !== 'file') return err(`bash: source: ${target}: No such file or directory`);
  const lines = node.content.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  for (const line of lines) {
    const aliasMatch = /^alias\s+([A-Za-z0-9_.-]+)=(.*)$/.exec(line);
    if (aliasMatch) { state.aliases[aliasMatch[1]] = aliasMatch[2].replace(/^['"](.*)['"]$/, '$1'); continue; }
    const exportMatch = /^export\s+([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (exportMatch) { state.env[exportMatch[1]] = exportMatch[2].replace(/^['"](.*)['"]$/, '$1'); continue; }
    const assignMatch = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (assignMatch) { state.env[assignMatch[1]] = assignMatch[2].replace(/^['"](.*)['"]$/, '$1'); continue; }
    const tokens = line.split(/\s+/);
    const [cmd, ...cmdArgs] = tokens;
    const fn = commandRegistry[cmd];
    if (fn) fn(cmdArgs, state);
  }
  return '';
};

const SHELL_BUILTINS = new Set([
  'cd', 'pwd', 'echo', 'export', 'history', 'clear', 'exit', 'logout',
  'alias', 'unalias', 'source', '.', 'umask', 'test', 'true', 'false'
]);

const whichCmd: CommandFn = (args) =>
  args.map((a) => (a in commandRegistry ? `/usr/bin/${a}` : `${a} not found`)).join('\n');

const typeCmd: CommandFn = (args, state) =>
  args.map((a) => {
    if (state.aliases[a]) return `${a} is aliased to \`${state.aliases[a]}'`;
    if (SHELL_BUILTINS.has(a)) return `${a} is a shell builtin`;
    if (a in commandRegistry) return `${a} is /usr/bin/${a}`;
    return `bash: type: ${a}: not found`;
  }).join('\n');

const commandCmd: CommandFn = (args, state) => {
  if (args[0] === '-v') {
    const target = args[1];
    if (!target) return '';
    if (state.aliases[target]) return target;
    if (target in commandRegistry) return `/usr/bin/${target}`;
    return '';
  }
  const fn = commandRegistry[args[0]];
  return fn ? fn(args.slice(1), state) : err(`${args[0]}: command not found`);
};

const xargsCmd: CommandFn = (args, state, stdin) => {
  const cmdName = args[0];
  if (!cmdName) return err('usage: xargs <command>');
  const extraArgs = args.slice(1);
  const items = (stdin ?? '').split(/\s+/).map((s) => s.trim()).filter(Boolean);
  const fn = commandRegistry[cmdName];
  if (!fn) return err(`xargs: ${cmdName}: No such file or directory`);
  return fn([...extraArgs, ...items], state, undefined);
};

const watchCmd: CommandFn = (args, state) => {
  let rest = args;
  let interval = '2.0';
  if (rest[0] === '-n') { interval = rest[1] ?? '2.0'; rest = rest.slice(2); }
  const cmdName = rest[0];
  if (!cmdName) return err('usage: watch [-n seconds] <command>');
  const cmdArgs = rest.slice(1);
  const fn = commandRegistry[cmdName];
  if (!fn) return err(`watch: ${cmdName}: command not found`);
  const out = fn(cmdArgs, state);
  return `Every ${interval}s: ${[cmdName, ...cmdArgs].join(' ')}\n\n${out}`;
};

const straceCmd: CommandFn = (args, state) => {
  const cmdName = args[0];
  if (!cmdName) return err('usage: strace <command>');
  const cmdArgs = args.slice(1);
  const fn = commandRegistry[cmdName];
  const out = fn ? fn(cmdArgs, state) : `${cmdName}: command not found`;
  const trace = [
    `execve("/usr/bin/${cmdName}", [...], 0x7ffd00000000 /* ... */) = 0`,
    `brk(NULL)                              = 0x55b800000000`,
    `access("/etc/ld.so.preload", R_OK)     = -1 ENOENT (No such file or directory)`,
    `openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3`,
    `mmap(NULL, 8192, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0) = 0x7f0000000000`,
    `write(1, "${out.slice(0, 40).replace(/\n/g, '\\n')}"..., ${out.length}) = ${out.length}`,
    `exit_group(0)                          = ?`,
    `+++ exited with 0 +++`
  ];
  return [...trace, '', out].join('\n');
};

const lsofCmd: CommandFn = (args, state) => {
  const pIdx = args.indexOf('-p');
  const pidFilter = pIdx !== -1 ? parseInt(args[pIdx + 1], 10) : null;
  const procs = pidFilter ? state.processes.filter((p) => p.pid === pidFilter) : state.processes;
  const header = `${pad('COMMAND', 12)}${pad('PID', 8)}${pad('USER', 10)}${pad('FD', 6)}${pad('TYPE', 6)}NAME`;
  const rows: string[] = [];
  for (const p of procs) {
    const cmdShort = (p.cmd.split(' ')[0].split('/').pop() ?? p.cmd).replace(/^-/, '');
    rows.push(`${pad(cmdShort, 12)}${pad(String(p.pid), 8)}${pad(p.user, 10)}${pad('cwd', 6)}${pad('DIR', 6)}/home/${p.user}`);
    rows.push(`${pad(cmdShort, 12)}${pad(String(p.pid), 8)}${pad(p.user, 10)}${pad('0u', 6)}${pad('CHR', 6)}/dev/pts/0`);
    if (p.service === 'nginx') rows.push(`${pad(cmdShort, 12)}${pad(String(p.pid), 8)}${pad(p.user, 10)}${pad('6u', 6)}${pad('IPv4', 6)}TCP *:80 (LISTEN)`);
    if (p.service === 'ssh') rows.push(`${pad(cmdShort, 12)}${pad(String(p.pid), 8)}${pad(p.user, 10)}${pad('4u', 6)}${pad('IPv4', 6)}TCP *:22 (LISTEN)`);
  }
  return [header, ...rows].join('\n');
};

const tmuxCmd: CommandFn = (args, state) => {
  const sub = args[0];
  if (!sub || sub === 'ls' || sub === 'list-sessions') {
    if (state.tmuxSessions.length === 0) return err('no server running on /tmp/tmux-1000/default');
    return state.tmuxSessions.map((s) => `${s.name}: ${s.windows} windows (created just now)`).join('\n');
  }
  if (sub === 'new' || sub === 'new-session') {
    const sIdx = args.indexOf('-s');
    const name = sIdx !== -1 ? args[sIdx + 1] : String(state.tmuxSessions.length);
    if (state.tmuxSessions.some((s) => s.name === name)) return err(`duplicate session: ${name}`);
    state.tmuxSessions.push({ name, windows: 1 });
    return `[detached (from session ${name})]`;
  }
  if (sub === 'attach' || sub === 'attach-session') {
    const tIdx = args.indexOf('-t');
    const name = tIdx !== -1 ? args[tIdx + 1] : state.tmuxSessions[state.tmuxSessions.length - 1]?.name;
    const session = state.tmuxSessions.find((s) => s.name === name);
    if (!session) return err(`can't find session: ${name}`);
    return `attached to session ${session.name}`;
  }
  if (sub === 'kill-session') {
    const tIdx = args.indexOf('-t');
    const name = tIdx !== -1 ? args[tIdx + 1] : null;
    state.tmuxSessions = state.tmuxSessions.filter((s) => s.name !== name);
    return '';
  }
  if (sub === 'split-window' || sub === 'new-window') {
    const last = state.tmuxSessions[state.tmuxSessions.length - 1];
    if (last) last.windows++;
    return '';
  }
  return err('usage: tmux new -s <name> | ls | attach -t <name> | kill-session -t <name>');
};

// --- cloud & infrastructure basics (Module 12) --------------------------------

function flagValue(args: string[], flag: string): string | null {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] ?? null : null;
}

function fakePublicIp(seed: number): string {
  return `54.${(seed * 7) % 256}.${(seed * 13) % 256}.${(seed * 31) % 256}`;
}

function findInstance(state: ShellState, ref: string): CloudInstance | undefined {
  return state.cloudInstances.find((i) => i.id === ref || i.name === ref);
}

const awsCmd: CommandFn = (args, state) => {
  const group = args[0];
  const rest = args.slice(1);

  if (group === '--version') return 'aws-cli/2.15.0 Python/3.11.6 linux/x86_64';

  if (group === 'configure') {
    state.cloudConfigured = true;
    return [
      'AWS Access Key ID [None]: ****************LAB',
      'AWS Secret Access Key [None]: ****************lab',
      'Default region name [None]: us-east-1',
      'Default output format [None]: json'
    ].join('\n');
  }

  if (!state.cloudConfigured) return err('Unable to locate credentials. Run "aws configure" first.');

  if (group === 'ec2') {
    const sub = rest[0];
    const ecArgs = rest.slice(1);

    if (sub === 'run-instances') {
      const instanceType = flagValue(ecArgs, '--instance-type') ?? 't2.micro';
      const name = flagValue(ecArgs, '--name') ?? `instance-${state.nextInstanceId}`;
      const sg = flagValue(ecArgs, '--security-group');
      if (sg && !state.cloudSecurityGroups.some((g) => g.name === sg)) {
        return err(`An error occurred (InvalidGroup.NotFound) when calling the RunInstances operation: The security group '${sg}' does not exist`);
      }
      const id = `i-${fakeHash(name + state.nextInstanceId)}`;
      const instance: CloudInstance = {
        id, name, instanceType, state: 'running',
        publicIp: fakePublicIp(state.nextInstanceId), securityGroup: sg
      };
      state.nextInstanceId++;
      state.cloudInstances.push(instance);
      return `Launched instance ${id} (${instanceType}) with public IP ${instance.publicIp}`;
    }

    if (sub === 'describe-instances') {
      const header = `${pad('INSTANCE ID', 14)}${pad('NAME', 16)}${pad('TYPE', 12)}${pad('STATE', 12)}${pad('PUBLIC IP', 16)}SECURITY GROUP`;
      const rows = state.cloudInstances.map((i) =>
        `${pad(i.id, 14)}${pad(i.name, 16)}${pad(i.instanceType, 12)}${pad(i.state, 12)}${pad(i.publicIp ?? '-', 16)}${i.securityGroup ?? '-'}`
      );
      return [header, ...rows].join('\n');
    }

    if (sub === 'stop-instances' || sub === 'start-instances' || sub === 'terminate-instances') {
      const ref = flagValue(ecArgs, '--instance-ids') ?? ecArgs.find((a) => !a.startsWith('-'));
      if (!ref) return err(`usage: aws ec2 ${sub} --instance-ids <id>`);
      const instance = findInstance(state, ref);
      if (!instance) return err(`An error occurred (InvalidInstanceID.NotFound) when calling the ${sub} operation: '${ref}' does not exist`);
      if (sub === 'stop-instances') { instance.state = 'stopped'; instance.publicIp = null; }
      if (sub === 'start-instances') { instance.state = 'running'; instance.publicIp = fakePublicIp(state.nextInstanceId++); }
      if (sub === 'terminate-instances') { instance.state = 'terminated'; instance.publicIp = null; }
      return `${instance.id}: ${instance.state}`;
    }

    if (sub === 'create-security-group') {
      const groupName = flagValue(ecArgs, '--group-name');
      if (!groupName) return err('usage: aws ec2 create-security-group --group-name <name> --description <desc>');
      if (state.cloudSecurityGroups.some((g) => g.name === groupName)) return err(`An error occurred (InvalidGroup.Duplicate) when calling the CreateSecurityGroup operation: group '${groupName}' already exists`);
      state.cloudSecurityGroups.push({ name: groupName, rules: [] });
      return `Created security group ${groupName} (sg-${fakeHash(groupName)})`;
    }

    if (sub === 'authorize-security-group-ingress') {
      const groupName = flagValue(ecArgs, '--group-name');
      const protocol = flagValue(ecArgs, '--protocol') ?? 'tcp';
      const port = flagValue(ecArgs, '--port') ?? '0';
      const cidr = flagValue(ecArgs, '--cidr') ?? '0.0.0.0/0';
      const sg = groupName ? state.cloudSecurityGroups.find((g) => g.name === groupName) : undefined;
      if (!sg) return err(`An error occurred (InvalidGroup.NotFound) when calling the AuthorizeSecurityGroupIngress operation: group '${groupName}' does not exist`);
      sg.rules.push(`${protocol}:${port} from ${cidr}`);
      return `Ingress rule authorized on ${groupName}`;
    }

    return err(`aws: '${sub}' is not a recognized ec2 command.`);
  }

  if (group === 's3') {
    const sub = rest[0];
    const s3Args = rest.slice(1);

    if (sub === 'mb') {
      const name = (s3Args[0] ?? '').replace(/^s3:\/\//, '').replace(/\/$/, '');
      if (!name) return err('usage: aws s3 mb s3://<bucket-name>');
      if (state.cloudBuckets.some((b) => b.name === name)) return err(`make_bucket failed: s3://${name} BucketAlreadyExists`);
      state.cloudBuckets.push({ name, objects: {} });
      return `make_bucket: s3://${name}`;
    }

    if (sub === 'ls') {
      const target = s3Args[0];
      if (!target) return state.cloudBuckets.map((b) => `${pad('', 20)}s3://${b.name}`).join('\n');
      const bucketName = target.replace(/^s3:\/\//, '').replace(/\/$/, '');
      const bucket = state.cloudBuckets.find((b) => b.name === bucketName);
      if (!bucket) return err(`An error occurred (NoSuchBucket) when calling the ListObjectsV2 operation: The specified bucket does not exist`);
      return Object.keys(bucket.objects).map((k) => `${pad('', 20)}${k}`).join('\n');
    }

    if (sub === 'cp') {
      const [src, dest] = s3Args;
      if (!src || !dest) return err('usage: aws s3 cp <source> <destination>');
      if (dest.startsWith('s3://')) {
        const [bucketName, ...keyParts] = dest.replace(/^s3:\/\//, '').split('/');
        const key = keyParts.join('/') || src.split('/').pop() || src;
        const bucket = state.cloudBuckets.find((b) => b.name === bucketName);
        if (!bucket) return err(`An error occurred (NoSuchBucket) when calling the PutObject operation: The specified bucket does not exist`);
        const node = getNode(state.root, state.resolve(src));
        if (!node || node.type !== 'file') return err(`upload failed: ${src} does not exist`);
        bucket.objects[key] = node.content;
        return `upload: ${src} to s3://${bucketName}/${key}`;
      }
      if (src.startsWith('s3://')) {
        const [bucketName, ...keyParts] = src.replace(/^s3:\/\//, '').split('/');
        const key = keyParts.join('/');
        const bucket = state.cloudBuckets.find((b) => b.name === bucketName);
        const content = bucket?.objects[key];
        if (content === undefined) return err(`An error occurred (NoSuchKey) when calling the GetObject operation: The specified key does not exist`);
        const { parent, name } = getParentAndName(state.root, state.resolve(dest));
        if (parent) parent.children[name] = file(content, state.currentUser, state.currentUser);
        return `download: s3://${bucketName}/${key} to ${dest}`;
      }
      return err('usage: aws s3 cp requires at least one s3:// path');
    }

    if (sub === 'rm') {
      const target = s3Args[0];
      if (!target) return err('usage: aws s3 rm s3://<bucket>/<key>');
      const [bucketName, ...keyParts] = target.replace(/^s3:\/\//, '').split('/');
      const key = keyParts.join('/');
      const bucket = state.cloudBuckets.find((b) => b.name === bucketName);
      if (!bucket || !(key in bucket.objects)) return err(`delete failed: ${target} does not exist`);
      delete bucket.objects[key];
      return `delete: ${target}`;
    }

    return err(`aws: '${sub}' is not a recognized s3 command.`);
  }

  return err(`aws: '${group}' is not a recognized service. See 'aws help'.`);
};

interface InfraResource { name: string; type: string; instanceType?: string }

function parseInfraResources(content: string): InfraResource[] {
  const lines = content.split('\n');
  const resources: InfraResource[] = [];
  let current: InfraResource | null = null;
  for (const raw of lines) {
    const resMatch = /^  ([A-Za-z0-9_-]+):\s*$/.exec(raw);
    if (resMatch) { if (current) resources.push(current); current = { name: resMatch[1], type: '' }; continue; }
    const typeMatch = /^\s+type:\s*(\S+)\s*$/.exec(raw);
    if (typeMatch && current) { current.type = typeMatch[1]; continue; }
    const instanceTypeMatch = /^\s+instance_type:\s*(\S+)\s*$/.exec(raw);
    if (instanceTypeMatch && current) { current.instanceType = instanceTypeMatch[1]; continue; }
  }
  if (current) resources.push(current);
  return resources;
}

function loadInfraFile(state: ShellState): InfraResource[] | null {
  const node = getNode(state.root, state.resolve('infra.yaml'));
  if (!node || node.type !== 'file') return null;
  return parseInfraResources(node.content);
}

const infraCmd: CommandFn = (args, state) => {
  const sub = args[0];
  const resources = loadInfraFile(state);
  if (!resources) return err("Error: could not find 'infra.yaml' in the current directory.");
  if (resources.length === 0) return err('Error: no resources defined in infra.yaml');

  if (sub === 'plan') {
    const lines = resources.map((r) => `  + ${r.name} will be created (${r.type})`);
    lines.push('', `Plan: ${resources.length} to add, 0 to change, 0 to destroy.`);
    return lines.join('\n');
  }

  if (sub === 'apply') {
    let added = 0;
    for (const r of resources) {
      if (r.type === 'instance') {
        if (!state.cloudInstances.some((i) => i.name === r.name)) {
          const id = `i-${fakeHash(r.name + state.nextInstanceId)}`;
          state.cloudInstances.push({
            id, name: r.name, instanceType: r.instanceType ?? 't2.micro',
            state: 'running', publicIp: fakePublicIp(state.nextInstanceId), securityGroup: null
          });
          state.nextInstanceId++;
          added++;
        }
      } else if (r.type === 'bucket') {
        if (!state.cloudBuckets.some((b) => b.name === r.name)) { state.cloudBuckets.push({ name: r.name, objects: {} }); added++; }
      } else if (r.type === 'security_group') {
        if (!state.cloudSecurityGroups.some((g) => g.name === r.name)) { state.cloudSecurityGroups.push({ name: r.name, rules: [] }); added++; }
      }
    }
    state.infraApplied = true;
    return [
      ...resources.map((r) => `${r.name}: Creating...\n${r.name}: Creation complete`),
      '',
      `Apply complete! Resources: ${added} added, 0 changed, 0 destroyed.`
    ].join('\n');
  }

  if (sub === 'destroy') {
    let destroyed = 0;
    for (const r of resources) {
      if (r.type === 'instance') {
        const inst = state.cloudInstances.find((i) => i.name === r.name);
        if (inst && inst.state !== 'terminated') { inst.state = 'terminated'; inst.publicIp = null; destroyed++; }
      } else if (r.type === 'bucket') {
        const before = state.cloudBuckets.length;
        state.cloudBuckets = state.cloudBuckets.filter((b) => b.name !== r.name);
        if (state.cloudBuckets.length < before) destroyed++;
      } else if (r.type === 'security_group') {
        const before = state.cloudSecurityGroups.length;
        state.cloudSecurityGroups = state.cloudSecurityGroups.filter((g) => g.name !== r.name);
        if (state.cloudSecurityGroups.length < before) destroyed++;
      }
    }
    state.infraApplied = false;
    return [
      ...resources.map((r) => `${r.name}: Destroying...\n${r.name}: Destruction complete`),
      '',
      `Destroy complete! Resources: ${destroyed} destroyed.`
    ].join('\n');
  }

  return err('usage: infra plan | apply | destroy');
};

// --- OSINT (Module 13) -------------------------------------------------------------
// All of these are passive-recon tools: they never touch the target directly, they just
// query (simulated) public data sources — search indexes, DNS, WHOIS, archives, and social
// platforms — the way a real OSINT investigation builds a picture before anyone scans a port.

interface DorkResult { url: string; title: string; filetype: string; }

/** A tiny fixed "search index" standing in for Google — enough to teach site:/filetype:/
 * intitle:/inurl: operators without needing a real, live search engine. */
const DORK_INDEX: DorkResult[] = [
  { url: 'http://corp-target.lab/', title: 'Nova Retail Group — Home', filetype: 'html' },
  { url: 'http://corp-target.lab/admin', title: 'Admin Login', filetype: 'html' },
  { url: 'http://corp-target.lab/employee-handbook.pdf', title: 'Employee Handbook 2024', filetype: 'pdf' },
  { url: 'http://corp-target.lab/backup.zip', title: 'Index of /backup.zip', filetype: 'zip' },
  { url: 'http://dev.corp-target.lab/', title: 'Dev Environment — Nova Retail Group', filetype: 'html' }
];

const dorkCmd: CommandFn = (args) => {
  if (args.length === 0) return err('usage: dork <query> (supports site:, filetype:, intitle:, inurl:)');
  let site: string | undefined, filetype: string | undefined, intitle: string | undefined, inurl: string | undefined;
  const terms: string[] = [];
  for (const a of args) {
    if (a.startsWith('site:')) site = a.slice(5).toLowerCase();
    else if (a.startsWith('filetype:')) filetype = a.slice(9).toLowerCase();
    else if (a.startsWith('intitle:')) intitle = a.slice(8).toLowerCase();
    else if (a.startsWith('inurl:')) inurl = a.slice(6).toLowerCase();
    else terms.push(a.toLowerCase());
  }
  const results = DORK_INDEX.filter((r) => {
    if (site && !r.url.toLowerCase().includes(site)) return false;
    if (filetype && r.filetype !== filetype) return false;
    if (intitle && !r.title.toLowerCase().includes(intitle)) return false;
    if (inurl && !r.url.toLowerCase().includes(inurl)) return false;
    if (terms.length && !terms.every((t) => r.title.toLowerCase().includes(t))) return false;
    return true;
  });
  if (results.length === 0) return 'No results found.';
  return results.map((r) => `${r.title}\n${r.url}`).join('\n\n');
};

const SUBDOMAINS: Record<string, string[]> = {
  'corp-target.lab': ['www.corp-target.lab', 'mail.corp-target.lab', 'vpn.corp-target.lab', 'dev.corp-target.lab', 'staging.corp-target.lab']
};

const subfinderCmd: CommandFn = (args, state) => {
  const domain = args.find((a) => !a.startsWith('-'));
  if (!domain) return err('usage: subfinder -d <domain>');
  const subs = SUBDOMAINS[domain];
  if (!subs?.length) return `No subdomains found for ${domain}`;
  return subs.map((s) => `${s} (${state.dnsZone[s] ?? 'unresolved'})`).join('\n');
};

interface HarvestResult { emails: string[]; hosts: string[]; }

const HARVEST_DB: Record<string, HarvestResult> = {
  'corp-target.lab': {
    emails: ['jmartinez@corp-target.lab', 'achen@corp-target.lab', 'support@corp-target.lab'],
    hosts: ['www.corp-target.lab', 'mail.corp-target.lab', 'vpn.corp-target.lab', 'dev.corp-target.lab']
  }
};

const theharvesterCmd: CommandFn = (args) => {
  const dIdx = args.indexOf('-d');
  const domain = dIdx !== -1 ? args[dIdx + 1] : undefined;
  if (!domain) return err('usage: theharvester -d <domain> -b all');
  const result = HARVEST_DB[domain];
  if (!result) return `theHarvester 4.4.4\n*** No results found for ${domain}`;
  return [
    'theHarvester 4.4.4',
    `[*] Target: ${domain}`,
    '',
    '[*] Emails found:',
    ...result.emails.map((e) => `${e}`),
    '',
    '[*] Hosts found:',
    ...result.hosts.map((h) => `${h}`),
    '',
    `[*] Total: ${result.emails.length} emails, ${result.hosts.length} hosts`
  ].join('\n');
};

interface SherlockHit { site: string; found: boolean; url: string; }

const SHERLOCK_DB: Record<string, SherlockHit[]> = {
  jmartinez: [
    { site: 'GitHub', found: true, url: 'https://github.com/jmartinez' },
    { site: 'LinkedIn', found: true, url: 'https://linkedin.com/in/jmartinez' },
    { site: 'X (Twitter)', found: true, url: 'https://x.com/jmartinez' },
    { site: 'Instagram', found: false, url: '' },
    { site: 'TikTok', found: false, url: '' }
  ],
  achen: [
    { site: 'LinkedIn', found: true, url: 'https://linkedin.com/in/achen' },
    { site: 'Instagram', found: true, url: 'https://instagram.com/achen' },
    { site: 'GitHub', found: false, url: '' },
    { site: 'X (Twitter)', found: false, url: '' }
  ],
  student_learns: [
    { site: 'Instagram', found: true, url: 'https://instagram.com/student_learns' },
    { site: 'GitHub', found: true, url: 'https://github.com/student_learns' },
    { site: 'X (Twitter)', found: true, url: 'https://x.com/student_learns' },
    { site: 'Reddit', found: true, url: 'https://reddit.com/u/student_learns' }
  ]
};

const sherlockCmd: CommandFn = (args) => {
  const username = args.find((a) => !a.startsWith('-'));
  if (!username) return err('usage: sherlock <username>');
  const hits = SHERLOCK_DB[username];
  if (!hits) return [`[*] Checking username ${username} on:`, `[-] No accounts found for ${username}`].join('\n');
  return [
    `[*] Checking username ${username} on:`,
    ...hits.map((h) => (h.found ? `[+] ${h.site}: ${h.url}` : `[-] ${h.site}: Not Found!`))
  ].join('\n');
};

const IMAGE_METADATA: Record<string, string[]> = {
  '/home/student/osint/team_photo.jpg': [
    'File Name              : team_photo.jpg',
    'File Type               : JPEG',
    'Author                  : Jordan Martinez',
    'Software                : Adobe Photoshop 24.0',
    'Create Date             : 2025:11:03 14:22:10',
    'GPS Latitude            : 37 deg 46\' 29.64" N',
    'GPS Longitude           : 122 deg 25\' 9.84" W',
    'Comment                 : Nova Retail Group HQ — all-hands offsite'
  ],
  '/home/student/osint/conference_badge.jpg': [
    'File Name              : conference_badge.jpg',
    'File Type               : JPEG',
    'Author                  : student',
    'Software                : iPhone 15',
    'Create Date             : 2026-04-12 10:03:00',
    'GPS Latitude            : 37 deg 46\' 30.00" N',
    'GPS Longitude           : 122 deg 25\' 10.00" W',
    'Comment                 : DevSecCon 2026 badge photo'
  ]
};

const exiftoolCmd: CommandFn = (args, state) => {
  const target = args.find((a) => !a.startsWith('-'));
  if (!target) return err('usage: exiftool <file>');
  const segs = state.resolve(target);
  const node = getNode(state.root, segs);
  if (!node || node.type !== 'file') return err(`File not found - ${target}`);
  const path = formatPath(segs);
  if (state.scrubbedMetadata.includes(path)) return `File Name              : ${target}\n(no EXIF metadata found — previously scrubbed)`;
  const meta = IMAGE_METADATA[path];
  if (!meta) return `File Name              : ${target}\n(no EXIF metadata found)`;
  return meta.join('\n');
};

interface ShodanHost { ip: string; org: string; isp: string; ports: number[]; vulns: string[]; }

const SHODAN_HOSTS: Record<string, ShodanHost> = {
  '10.0.0.20': {
    ip: '10.0.0.20', org: 'Nova Retail Group', isp: 'Nova Retail Group',
    ports: [22, 80, 443], vulns: ['CVE-2021-23017 (nginx resolver off-by-one, outdated version)']
  }
};

const shodanCmd: CommandFn = (args, state) => {
  const sub = args[0];
  if (sub === 'host') {
    const target = args[1];
    if (!target) return err('usage: shodan host <ip>');
    const ip = resolveHost(state, target) ?? target;
    const info = SHODAN_HOSTS[ip];
    if (!info) return `No results found for ${target}`;
    return [
      `${info.ip}`,
      `Organization: ${info.org}`,
      `ISP:          ${info.isp}`,
      '',
      `Ports: ${info.ports.join(', ')}`,
      '',
      'Vulnerabilities:',
      ...info.vulns.map((v) => `  ${v}`)
    ].join('\n');
  }
  if (sub === 'search') {
    const term = args.slice(1).join(' ').toLowerCase();
    const matches = Object.values(SHODAN_HOSTS).filter((h) => h.org.toLowerCase().includes(term));
    if (matches.length === 0) return `No results found for "${term}"`;
    return matches.map((h) => `${h.ip}\t${h.org}\tports: ${h.ports.join(',')}`).join('\n');
  }
  return err('usage: shodan host <ip> | shodan search <term>');
};

/** Archive.org-style historical URL listing — includes paths no longer linked from the live site,
 * exactly the kind of thing gobuster/nikto (Module 8) can't find because nothing points to them anymore. */
const ARCHIVE_URLS: Record<string, string[]> = {
  'corp-target.lab': [
    'http://corp-target.lab/',
    'http://corp-target.lab/login',
    'http://corp-target.lab/admin',
    'http://corp-target.lab/old-admin-panel  (snapshot: 2019-03-11, no longer linked)',
    'http://corp-target.lab/employee-portal-legacy/login  (snapshot: 2020-07-22, no longer linked)'
  ]
};

const waybackurlsCmd: CommandFn = (args) => {
  const domain = args.find((a) => !a.startsWith('-'));
  if (!domain) return err('usage: waybackurls <domain>');
  const urls = ARCHIVE_URLS[domain];
  if (!urls?.length) return `No archived URLs found for ${domain}`;
  return urls.join('\n');
};

// --- GEOINT / geolocation intelligence (Module 14) ---------------------------------
// Continues the Nova Retail Group / corp-target.lab investigation from Module 13,
// this time working from photos rather than domains — the same passive-only rule
// applies: every tool here reads something already public, nothing is sent to the target.

const IMAGE_ANALYSIS: Record<string, string[]> = {
  '/home/student/osint/loading_dock.jpg': [
    'Visible text: forklift branded "NOVA LOGISTICS"',
    'Signage: English-language "FIRE EXIT" sign, US-style exit symbol',
    'Vehicle: pickup truck with a license plate frame matching California dealer styling',
    'Architecture: tilt-up concrete warehouse construction, common in US West Coast industrial parks',
    'Environment: palm trees visible at the edge of frame'
  ],
  '/home/student/osint/street_scene.jpg': [
    'Visible text: street sign reading "Rue de la Gare"',
    'Signage: French-language "Sortie" (exit) sign',
    'Vehicle: license plates in the EU blue-band format',
    'Architecture: stone facade townhouses with wrought-iron balconies',
    'Environment: cobblestone street, no palm trees'
  ]
};

const imageanalyzeCmd: CommandFn = (args, state) => {
  const target = args.find((a) => !a.startsWith('-'));
  if (!target) return err('usage: imageanalyze <file>');
  const segs = state.resolve(target);
  const node = getNode(state.root, segs);
  if (!node || node.type !== 'file') return err(`File not found - ${target}`);
  const clues = IMAGE_ANALYSIS[formatPath(segs)];
  if (!clues) return `No notable visual clues detected in ${target}`;
  return ['[*] Visual clue analysis:', ...clues.map((c) => `  - ${c}`)].join('\n');
};

interface ImgSearchHit { url: string; caption: string; }

const IMGSEARCH_DB: Record<string, ImgSearchHit[]> = {
  '/home/student/osint/loading_dock.jpg': [
    { url: 'https://corp-target.lab/blog/2025/11/new-facility', caption: '"Nova Logistics opens its new Sacramento distribution center"' },
    { url: 'https://instagram.com/achen/p/8f2a1c', caption: '"Great day at the new Sacramento site! #NovaRetail"' }
  ]
};

const imgsearchCmd: CommandFn = (args, state) => {
  const target = args.find((a) => !a.startsWith('-'));
  if (!target) return err('usage: imgsearch <file>');
  const segs = state.resolve(target);
  const hits = IMGSEARCH_DB[formatPath(segs)];
  if (!hits?.length) return `No matches found for ${target}`;
  return ['[*] Reverse image search matches:', ...hits.map((h) => `${h.caption}\n  ${h.url}`)].join('\n\n');
};

interface Landmark { name: string; lat: string; lon: string; description: string; }

const LANDMARK_DB: Record<string, Landmark> = {
  sacramento: {
    name: 'Nova Logistics Distribution Center — Sacramento, CA',
    lat: '38.5816 N', lon: '121.4944 W',
    description: 'Tilt-up warehouse complex matching the loading-dock photo: palm-lined perimeter road, matching bay numbering visible on satellite imagery.'
  }
};

const mapsearchCmd: CommandFn = (args) => {
  const term = args.join(' ').toLowerCase();
  const match = Object.entries(LANDMARK_DB).find(([key]) => term.includes(key));
  if (!match) return `No landmark matches found for "${args.join(' ')}"`;
  const [, l] = match;
  return [`${l.name}`, `Coordinates: ${l.lat}, ${l.lon}`, l.description].join('\n');
};

// --- Corporate & business intelligence (Module 15) ----------------------------------
// Still entirely passive: registries, job boards, news archives, and org charts are all
// things a company publishes itself (directly or through a third party) for its own reasons.

interface CorpRecord { entityType: string; jurisdiction: string; incorporated: string; status: string; officers: string[]; }

const CORP_REGISTRY: Record<string, CorpRecord> = {
  'nova retail group': {
    entityType: 'Corporation', jurisdiction: 'Delaware', incorporated: '2015-05-12', status: 'Active',
    officers: ['Priya Raman - Chief Executive Officer', 'Sam Okafor - Chief Financial Officer', 'Jordan Martinez - IT Director', 'Aisha Chen - Marketing Lead']
  }
};

const corpregCmd: CommandFn = (args) => {
  const name = args.join(' ').toLowerCase();
  const record = CORP_REGISTRY[name];
  if (!record) return `No match for "${args.join(' ')}" in registry.`;
  return [
    `Entity Type:  ${record.entityType}`,
    `Jurisdiction: ${record.jurisdiction}`,
    `Incorporated: ${record.incorporated}`,
    `Status:       ${record.status}`,
    'Officers:',
    ...record.officers.map((o) => `  - ${o}`)
  ].join('\n');
};

interface JobPosting { title: string; stack: string[]; }

const JOB_POSTINGS: Record<string, JobPosting[]> = {
  'nova retail group': [
    { title: 'Senior DevOps Engineer', stack: ['AWS', 'Kubernetes', 'Terraform', 'PostgreSQL'] },
    { title: 'Backend Engineer', stack: ['Node.js', 'PostgreSQL', 'Redis'] },
    { title: 'IT Support Specialist', stack: ['Google Workspace', 'Okta'] }
  ]
};

const jobscrapeCmd: CommandFn = (args) => {
  const name = args.join(' ').toLowerCase();
  const postings = JOB_POSTINGS[name];
  if (!postings?.length) return `No open postings found for "${args.join(' ')}"`;
  return postings.map((p) => `${p.title}\n  Required: ${p.stack.join(', ')}`).join('\n\n');
};

interface OrgEntry { name: string; title: string; reportsTo: string | null; }

const ORG_CHART: Record<string, OrgEntry[]> = {
  'nova retail group': [
    { name: 'Priya Raman', title: 'CEO', reportsTo: null },
    { name: 'Sam Okafor', title: 'CFO', reportsTo: 'Priya Raman' },
    { name: 'Jordan Martinez', title: 'IT Director', reportsTo: 'Priya Raman' },
    { name: 'Aisha Chen', title: 'Marketing Lead', reportsTo: 'Priya Raman' }
  ]
};

const orgchartCmd: CommandFn = (args) => {
  const name = args.join(' ').toLowerCase();
  const chart = ORG_CHART[name];
  if (!chart?.length) return `No org-chart data found for "${args.join(' ')}"`;
  return chart.map((e) => `${e.name} — ${e.title}${e.reportsTo ? ` (reports to ${e.reportsTo})` : ' (top of chart)'}`).join('\n');
};

interface NewsItem { date: string; headline: string; }

const NEWS_DB: Record<string, NewsItem[]> = {
  'nova retail group': [
    { date: '2026-02-10', headline: 'Nova Retail Group acquires regional chain QuickMart for $42M' },
    { date: '2025-09-01', headline: 'Nova Retail Group opens new Sacramento distribution center' }
  ]
};

const biznewsCmd: CommandFn = (args) => {
  const name = args.join(' ').toLowerCase();
  const items = NEWS_DB[name];
  if (!items?.length) return `No news found for "${args.join(' ')}"`;
  return items.map((i) => `[${i.date}] ${i.headline}`).join('\n');
};

interface SubsidiaryRecord { parent: string | null; subsidiaries: string[]; }

const SUBSIDIARY_DB: Record<string, SubsidiaryRecord> = {
  'nova retail group': { parent: null, subsidiaries: ['QuickMart Inc.', 'Nova Logistics LLC'] }
};

const subsidiariesCmd: CommandFn = (args) => {
  const name = args.join(' ').toLowerCase();
  const record = SUBSIDIARY_DB[name];
  if (!record) return `No corporate structure data found for "${args.join(' ')}"`;
  return [
    `Parent company: ${record.parent ?? '(none — top of the corporate structure)'}`,
    'Subsidiaries:',
    ...record.subsidiaries.map((s) => `  - ${s}`)
  ].join('\n');
};

// --- Breach & credential intelligence (Module 16) ------------------------------------
// Defensive framing throughout: these are the same lookups a security team runs against
// its own users to find exposure and force resets. Hashes are shown only to detect
// reuse across breaches — never decoded or cracked.

interface BreachHit { breach: string; date: string; dataClasses: string[]; }

const HIBP_DB: Record<string, BreachHit[]> = {
  'jmartinez@corp-target.lab': [
    { breach: 'LinkedIn2021', date: '2021-06-01', dataClasses: ['Email addresses', 'Passwords (hashed)'] },
    { breach: 'CollectionLeak2019', date: '2019-01-07', dataClasses: ['Email addresses', 'Passwords (hashed)'] }
  ],
  'achen@corp-target.lab': [
    { breach: 'MarketingToolsBreach2022', date: '2022-03-15', dataClasses: ['Email addresses', 'Names'] }
  ],
  'student@linuxlab.dev': [
    { breach: 'NewsletterListLeak2020', date: '2020-05-01', dataClasses: ['Email addresses', 'Names'] }
  ]
};

const hibpCmd: CommandFn = (args) => {
  const email = args.find((a) => !a.startsWith('-'));
  if (!email) return err('usage: hibp <email>');
  const hits = HIBP_DB[email];
  if (!hits?.length) return `Good news — no breaches found for ${email}`;
  return [`Oh no — ${email} was found in ${hits.length} breach(es):`, ...hits.map((h) => `  [${h.date}] ${h.breach} — exposed: ${h.dataClasses.join(', ')}`)].join('\n');
};

interface CredHit { breach: string; hash: string; }

const CRED_DB: Record<string, CredHit[]> = {
  'jmartinez@corp-target.lab': [
    { breach: 'LinkedIn2021', hash: '5f4dcc3b5aa765d61d8327deb882cf99' },
    { breach: 'CollectionLeak2019', hash: '5f4dcc3b5aa765d61d8327deb882cf99' }
  ],
  'achen@corp-target.lab': [
    { breach: 'MarketingToolsBreach2022', hash: 'e99a18c428cb38d5f260853678922e03' }
  ]
};

const credsearchCmd: CommandFn = (args) => {
  const email = args.find((a) => !a.startsWith('-'));
  if (!email) return err('usage: credsearch <email>');
  const hits = CRED_DB[email];
  if (!hits?.length) return `No credential dump entries found for ${email}`;
  return [
    `Credential dump entries for ${email} (hash shown only to detect reuse — not cracked):`,
    ...hits.map((h) => `  ${h.breach}: ${h.hash}`)
  ].join('\n');
};

const passpatternCmd: CommandFn = (args) => {
  const email = args.find((a) => !a.startsWith('-'));
  if (!email) return err('usage: passpattern <email>');
  const hits = CRED_DB[email];
  if (!hits?.length) return `No credential data available for ${email}`;
  const counts = new Map<string, string[]>();
  for (const h of hits) counts.set(h.hash, [...(counts.get(h.hash) ?? []), h.breach]);
  const reused = [...counts.entries()].filter(([, breaches]) => breaches.length > 1);
  if (reused.length === 0) return `No password-reuse pattern detected across known breaches for ${email}`;
  return [
    `Password reuse detected for ${email}:`,
    ...reused.map(([hash, breaches]) => `  Same hash (${hash}) appears in: ${breaches.join(', ')}`),
    '  -> high-priority candidate for a forced credential reset'
  ].join('\n');
};

interface PasteHit { site: string; date: string; snippet: string; }

const PASTE_DB: Record<string, PasteHit[]> = {
  'corp-target.lab': [
    { site: 'Pastebin (archived, simulated)', date: '2026-01-05', snippet: '"...corp-target.lab admin panel creds — see attached dump..."' }
  ]
};

const pastesearchCmd: CommandFn = (args) => {
  const term = args.join(' ').toLowerCase();
  const match = Object.entries(PASTE_DB).find(([key]) => term.includes(key));
  if (!match) return `No paste-site mentions found for "${args.join(' ')}"`;
  const [, hits] = match;
  return hits.map((h) => `[${h.site}, ${h.date}]\n  ${h.snippet}`).join('\n\n');
};

interface DarkMention { forum: string; date: string; post: string; }

const DARKWEB_MENTIONS: Record<string, DarkMention[]> = {
  'nova retail group': [
    { forum: 'BreachForums (archived, simulated)', date: '2026-03-01', post: '"Selling employee database allegedly from Nova Retail Group — 4,200 rows, unverified"' }
  ]
};

const darkmentionsCmd: CommandFn = (args) => {
  const term = args.join(' ').toLowerCase();
  const match = Object.entries(DARKWEB_MENTIONS).find(([key]) => term.includes(key));
  if (!match) return `No dark-web mentions found for "${args.join(' ')}"`;
  const [, hits] = match;
  return hits.map((h) => `[${h.forum}, ${h.date}]\n  ${h.post}`).join('\n\n');
};

// --- Social media intelligence & network analysis (Module 17) -----------------------

interface SocialProfile { follows: string[]; followedBy: string[]; }

const SOCIAL_GRAPH: Record<string, SocialProfile> = {
  jmartinez: { follows: ['achen', 'NovaRetailIT', 'TerraformHQ', 'KubernetesIO'], followedBy: ['achen', 'psingh_vendor'] },
  achen: { follows: ['jmartinez', 'NovaRetailGroup', 'MarketingWeekly'], followedBy: ['jmartinez', 'NovaRetailGroup'] }
};

const socialgraphCmd: CommandFn = (args) => {
  const username = args.find((a) => !a.startsWith('-'));
  if (!username) return err('usage: socialgraph <username>');
  const profile = SOCIAL_GRAPH[username];
  if (!profile) return `No social graph data found for ${username}`;
  return [
    `Follows:`, ...profile.follows.map((f) => `  ${f}`),
    `Followed by:`, ...profile.followedBy.map((f) => `  ${f}`)
  ].join('\n');
};

const POST_LOG: Record<string, string[]> = {
  jmartinez: ['2026-06-01 09:15 PDT', '2026-06-01 09:42 PDT', '2026-06-02 13:05 PDT', '2026-06-02 17:50 PDT', '2026-06-03 23:10 PDT']
};

const postpatternCmd: CommandFn = (args) => {
  const username = args.find((a) => !a.startsWith('-'));
  if (!username) return err('usage: postpattern <username>');
  const posts = POST_LOG[username];
  if (!posts?.length) return `No posting history found for ${username}`;
  return [
    'Posting timestamps:',
    ...posts.map((p) => `  ${p}`),
    '',
    'Analysis: activity clusters 9am-6pm Pacific — consistent with a Sacramento, CA based schedule.',
    'Outlier: one post at 23:10 PDT breaks the normal pattern (possible personal-account activity outside work hours).'
  ].join('\n');
};

interface HashtagPost { user: string; text: string; date: string; }

const HASHTAG_POSTS: Record<string, HashtagPost[]> = {
  '#novaallhands': [
    { user: 'achen', text: 'So excited for the #NovaAllHands offsite next month at the Sacramento HQ!', date: '2025-10-20' },
    { user: 'jmartinez', text: 'Prepping the AV setup for #NovaAllHands — always a fun one', date: '2025-10-22' }
  ]
};

const hashtagCmd: CommandFn = (args) => {
  const tag = args.find((a) => a.startsWith('#'))?.toLowerCase() ?? args[0]?.toLowerCase();
  if (!tag) return err('usage: hashtag <#tag>');
  const key = tag.startsWith('#') ? tag : `#${tag}`;
  const posts = HASHTAG_POSTS[key];
  if (!posts?.length) return `No posts found for ${key}`;
  return posts.map((p) => `[${p.date}] @${p.user}: ${p.text}`).join('\n');
};

interface SentimentReport { summary: string; botScore: number; sampleReviews: string[]; }

const SENTIMENT_DB: Record<string, SentimentReport> = {
  'nova retail group': {
    summary: 'Mixed: legitimate reviews split roughly evenly positive/negative, but a cluster of nearly identical five-star reviews posted within the same ten-minute window is flagged as likely inauthentic (astroturfing).',
    botScore: 0.62,
    sampleReviews: [
      '"Best shopping experience ever!!! 5 stars!!!" (posted 03:02, 03:04, 03:05 by three different accounts)',
      '"Slow checkout lines, disappointing" (posted separately, appears genuine)'
    ]
  }
};

const sentimentCmd: CommandFn = (args) => {
  const term = args.join(' ').toLowerCase();
  const report = SENTIMENT_DB[term];
  if (!report) return `No sentiment data found for "${args.join(' ')}"`;
  return [
    report.summary,
    `Bot score: ${report.botScore}`,
    'Sample reviews:',
    ...report.sampleReviews.map((r) => `  ${r}`)
  ].join('\n');
};

// --- Dark web / deep web basics (Module 18) ------------------------------------------
// Kept narrowly focused on the legitimate, defensive use case that shows up throughout
// this curriculum: security teams monitoring criminal forums/marketplaces for mentions
// of their own stolen data — not a tour of illicit goods.

const torCmd: CommandFn = (args, state) => {
  const sub = args[0];
  if (sub === 'start') {
    state.torActive = true;
    return [
      'Tor 0.4.8.10',
      'Bootstrapped 10% (starting)',
      'Bootstrapped 50% (loading_descriptors)',
      'Bootstrapped 100% (done): Done',
      'Circuit established (3 relays: guard, middle, exit)'
    ].join('\n');
  }
  if (sub === 'status') {
    return state.torActive ? 'Tor is running — circuit established (3 relays)' : 'Tor is not running';
  }
  if (sub === 'stop') {
    state.torActive = false;
    return 'Tor circuit closed.';
  }
  return err('usage: tor start | status | stop');
};

interface OnionResult { url: string; title: string; }

const ONION_INDEX: Record<string, OnionResult[]> = {
  'nova retail group': [{ url: 'novadumpx7z2fabc.onion', title: '"Nova Retail Group employee DB — preview" (forum thread)' }]
};

const onionsearchCmd: CommandFn = (args, state) => {
  if (!state.torActive) return err('onionsearch: Tor is not running — run "tor start" first');
  const term = args.join(' ').toLowerCase();
  const results = ONION_INDEX[term];
  if (!results?.length) return `No .onion results found for "${args.join(' ')}"`;
  return results.map((r) => `${r.title}\n  ${r.url}`).join('\n\n');
};

const ONION_CONTENT: Record<string, string> = {
  'novadumpx7z2fabc.onion': [
    '=== Forum Thread: "Nova Retail Group employee DB - preview" ===',
    'Posted by: data_broker_88',
    '"Selling a database allegedly from Nova Retail Group. Preview: 3 rows redacted. Full set 4,200 rows, $500 in Monero."',
    '',
    'Reply from: skeptic_analyst',
    '"This looks like the same recycled dataset posted last month under a different company name. Unverified."'
  ].join('\n')
};

const onioncurlCmd: CommandFn = (args, state) => {
  if (!state.torActive) return err('onioncurl: Tor is not running — run "tor start" first');
  const url = args.find((a) => !a.startsWith('-'));
  if (!url) return err('usage: onioncurl <.onion url>');
  const clean = url.replace(/^https?:\/\//, '');
  const content = ONION_CONTENT[clean];
  if (!content) return err(`onioncurl: could not connect to ${url}`);
  return content;
};

interface ForumReply { user: string; text: string; }

const FORUM_THREADS: Record<string, { forum: string; thread: string; replies: ForumReply[] }> = {
  'nova retail group': {
    forum: 'BreachForums (archived, simulated)',
    thread: '"Nova Retail Group employee DB - preview"',
    replies: [
      { user: 'data_broker_88', text: 'Selling a database allegedly from Nova Retail Group. Preview: 3 rows redacted. Full set 4,200 rows, $500 in Monero.' },
      { user: 'skeptic_analyst', text: 'This looks like the same recycled dataset posted last month under a different company name. Unverified.' },
      { user: 'mod_forumstaff', text: 'Thread flagged pending verification — seller has 2 prior unverified listings.' }
    ]
  }
};

const forummonitorCmd: CommandFn = (args) => {
  const term = args.join(' ').toLowerCase();
  const thread = FORUM_THREADS[term];
  if (!thread) return `No forum activity found for "${args.join(' ')}"`;
  return [`[${thread.forum}] ${thread.thread}`, ...thread.replies.map((r) => `  ${r.user}: ${r.text}`)].join('\n');
};

interface MarketListing { listing: string; price: string; seller: string; verified: boolean; }

const MARKET_LISTINGS: Record<string, MarketListing[]> = {
  'nova retail group': [
    { listing: 'Alleged Nova Retail Group employee database (4,200 rows)', price: '$500 in Monero', seller: 'data_broker_88', verified: false }
  ]
};

const marketmonitorCmd: CommandFn = (args) => {
  const term = args.join(' ').toLowerCase();
  const listings = MARKET_LISTINGS[term];
  if (!listings?.length) return `No marketplace listings found for "${args.join(' ')}"`;
  return listings.map((l) => `${l.listing}\n  Price: ${l.price}  Seller: ${l.seller}  Verified: ${l.verified ? 'yes' : 'NO — unverified claim'}`).join('\n\n');
};

// --- Threat intelligence & actor tracking (Module 19) --------------------------------
// Picks up the thread from Modules 16/18: identifying the infrastructure and actor
// behind the stolen-data listing, using indicator lookups rather than direct engagement.

interface IOCResult { detections: string; tags: string[]; firstSeen: string; }

const VT_DB: Record<string, IOCResult> = {
  '203.0.113.77': { detections: '42/70', tags: ['c2', 'ShadowLedger'], firstSeen: '2025-11-02' }
};

const vtcheckCmd: CommandFn = (args) => {
  const ioc = args.find((a) => !a.startsWith('-'));
  if (!ioc) return err('usage: vtcheck <ip|domain|hash>');
  const result = VT_DB[ioc];
  if (!result) return `No detections found for ${ioc}`;
  return [`Detections: ${result.detections}`, `Tags: ${result.tags.join(', ')}`, `First seen: ${result.firstSeen}`].join('\n');
};

interface AttckTechnique { name: string; tactic: string; description: string; }

const ATTCK_TECHNIQUES: Record<string, AttckTechnique> = {
  t1566: { name: 'Phishing', tactic: 'Initial Access', description: 'Adversaries send phishing messages to gain access to victim systems, often impersonating a trusted brand or support portal.' },
  t1078: { name: 'Valid Accounts', tactic: 'Defense Evasion / Persistence', description: 'Adversaries obtain and abuse credentials of existing accounts to gain or maintain access without needing to exploit a vulnerability.' },
  t1590: { name: 'Gather Victim Network Information', tactic: 'Reconnaissance', description: 'Adversaries gather information about a victim\'s network — using OSINT techniques identical to this course\'s own — before an intrusion attempt.' }
};

const attckmapCmd: CommandFn = (args) => {
  const id = args[0]?.toLowerCase();
  if (!id) return err('usage: attckmap <technique-id>');
  const t = ATTCK_TECHNIQUES[id];
  if (!t) return `No ATT&CK technique found for "${args[0]}"`;
  return [`${id.toUpperCase()}: ${t.name}`, `Tactic: ${t.tactic}`, t.description].join('\n');
};

interface ActorProfile { aliases: string[]; motivation: string; techniques: string[]; campaigns: string[]; }

const ACTOR_PROFILES: Record<string, ActorProfile> = {
  shadowledger: {
    aliases: ['ShadowLedger', 'UNC-9931'],
    motivation: 'Financially motivated data extortion',
    techniques: ['T1566', 'T1078', 'T1590'],
    campaigns: ['2025 retail-sector credential phishing wave', 'Nova Retail Group data listing (alleged)']
  }
};

const actorprofileCmd: CommandFn = (args) => {
  const name = args.join(' ').toLowerCase().replace(/\s+/g, '');
  const profile = ACTOR_PROFILES[name];
  if (!profile) return `No actor profile found for "${args.join(' ')}"`;
  return [
    `Aliases: ${profile.aliases.join(', ')}`,
    `Motivation: ${profile.motivation}`,
    `Known techniques: ${profile.techniques.join(', ')}`,
    'Known campaigns:',
    ...profile.campaigns.map((c) => `  - ${c}`)
  ].join('\n');
};

interface PassiveDnsRecord { hostname: string; firstSeen: string; lastSeen: string; }

const PASSIVE_DNS: Record<string, PassiveDnsRecord[]> = {
  '203.0.113.77': [
    { hostname: 'update-service-secure.net', firstSeen: '2025-09-01', lastSeen: '2025-10-15' },
    { hostname: 'nova-retail-support-portal.net', firstSeen: '2025-10-20', lastSeen: 'present' }
  ]
};

const passivednsCmd: CommandFn = (args) => {
  const ip = args.find((a) => !a.startsWith('-'));
  if (!ip) return err('usage: passivedns <ip>');
  const history = PASSIVE_DNS[ip];
  if (!history?.length) return `No passive DNS history found for ${ip}`;
  return history.map((h) => `${h.hostname}  (${h.firstSeen} - ${h.lastSeen})`).join('\n');
};

interface ThreatFeedEntry { date: string; source: string; entry: string; }

const THREAT_FEED: Record<string, ThreatFeedEntry[]> = {
  'nova retail group': [
    { date: '2026-03-05', source: 'ThreatFeed Aggregator', entry: 'Phishing domain nova-retail-support-portal.net observed impersonating the Nova Retail Group support portal' },
    { date: '2026-03-02', source: 'ThreatFeed Aggregator', entry: 'IOC 203.0.113.77 tagged as ShadowLedger C2 infrastructure' }
  ]
};

const threatfeedCmd: CommandFn = (args) => {
  const term = args.join(' ').toLowerCase();
  const entries = THREAT_FEED[term];
  if (!entries?.length) return `No threat feed entries found for "${args.join(' ')}"`;
  return entries.map((e) => `[${e.date}] (${e.source}) ${e.entry}`).join('\n');
};

// --- People search & public records (Module 20) --------------------------------------
// Framed throughout as an authorized, employee-focused security assessment — the same
// "in-scope, documented" standard from Module 15's ethics lesson, applied to a person.

interface PubRecord { ageRange: string; city: string; state: string; associatedNames: string[]; }

const PUBRECORDS_DB: Record<string, PubRecord> = {
  'jordan martinez': { ageRange: '35-40', city: 'Sacramento', state: 'CA', associatedNames: ['J. Martinez', 'Jordan A. Martinez'] }
};

const pubrecordsCmd: CommandFn = (args) => {
  const name = args.join(' ').toLowerCase();
  const record = PUBRECORDS_DB[name];
  if (!record) return `No public records found for "${args.join(' ')}"`;
  return [
    `Age range: ${record.ageRange}`,
    `Location: ${record.city}, ${record.state}`,
    `Associated names: ${record.associatedNames.join(', ')}`
  ].join('\n');
};

interface PhoneRecord { carrier: string; lineType: string; region: string; }

const PHONE_DB: Record<string, PhoneRecord> = {
  '+1-916-555-0148': { carrier: 'Verizon Wireless', lineType: 'Mobile', region: 'Sacramento, CA' }
};

const phonelookupCmd: CommandFn = (args) => {
  const number = args.find((a) => !a.startsWith('-'));
  if (!number) return err('usage: phonelookup <number>');
  const record = PHONE_DB[number];
  if (!record) return `No carrier data found for ${number}`;
  return [`Carrier: ${record.carrier}`, `Line type: ${record.lineType}`, `Registered region: ${record.region}`].join('\n');
};

const REVERSE_DB: Record<string, string> = {
  '+1-916-555-0148': 'Jordan Martinez',
  'jmartinez@corp-target.lab': 'Jordan Martinez'
};

const reverselookupCmd: CommandFn = (args) => {
  const query = args.find((a) => !a.startsWith('-'));
  if (!query) return err('usage: reverselookup <number|email>');
  const name = REVERSE_DB[query];
  if (!name) return `No match found for ${query}`;
  return `${query} -> ${name}`;
};

interface AddressRecord { address: string; years: string; }

const ADDRESS_HISTORY: Record<string, AddressRecord[]> = {
  'jordan martinez': [
    { address: '482 Elm St, Sacramento, CA', years: '2021-present' },
    { address: '1290 Birchwood Ave, Davis, CA', years: '2016-2021' }
  ]
};

const addresshistoryCmd: CommandFn = (args) => {
  const name = args.join(' ').toLowerCase();
  const history = ADDRESS_HISTORY[name];
  if (!history?.length) return `No address history found for "${args.join(' ')}"`;
  return history.map((h) => `${h.address}  (${h.years})`).join('\n');
};

const databrokerCmd: CommandFn = (args) => {
  const name = args.join(' ').toLowerCase();
  const rec = PUBRECORDS_DB[name];
  const addresses = ADDRESS_HISTORY[name];
  if (!rec && !addresses?.length) return `No data broker profile found for "${args.join(' ')}"`;
  const lines = [`Aggregated Profile: ${args.join(' ')}`];
  if (rec) lines.push(`  Age range: ${rec.ageRange}`, `  Location: ${rec.city}, ${rec.state}`, `  Associated names: ${rec.associatedNames.join(', ')}`);
  if (addresses?.length) { lines.push('  Address history:'); addresses.forEach((a) => lines.push(`    ${a.address} (${a.years})`)); }
  lines.push('', 'Note: this profile was aggregated from public-record brokers. Individuals can request removal via each broker\'s own opt-out process.');
  return lines.join('\n');
};

// --- Counter-OSINT & OPSEC (Module 21) -----------------------------------------------
// Turns every technique in this course back on the student's own simulated persona.

const selfauditCmd: CommandFn = (args, state) => {
  const lines = ['[*] Self-audit results for student@linuxlab.dev:'];
  lines.push('  - Email found in 1 low-severity breach (NewsletterListLeak2020) — see hibp');
  const badgeScrubbed = state.scrubbedMetadata.includes('/home/student/osint/conference_badge.jpg');
  lines.push(badgeScrubbed
    ? '  - conference_badge.jpg: metadata previously scrubbed — no GPS data exposed'
    : '  - conference_badge.jpg: GPS metadata still exposed — see exiftool');
  const ig = state.socialPrivacy.instagram;
  lines.push(ig && ig.visibility === 'private' && !ig.locationTagging
    ? '  - Instagram: private, location tagging off — looks good'
    : '  - Instagram: public profile, location tagging appears enabled — see privacycheck');
  lines.push('  - Username "student_learns" reused across 4 platforms — see sherlock');
  return lines.join('\n');
};

const metadatascrubCmd: CommandFn = (args, state) => {
  const target = args.find((a) => !a.startsWith('-'));
  if (!target) return err('usage: metadatascrub <file>');
  const segs = state.resolve(target);
  const node = getNode(state.root, segs);
  if (!node || node.type !== 'file') return err(`File not found - ${target}`);
  const path = formatPath(segs);
  if (!IMAGE_METADATA[path]) return `No metadata found to scrub in ${target}`;
  if (!state.scrubbedMetadata.includes(path)) state.scrubbedMetadata.push(path);
  return `Metadata stripped from ${target}. Original EXIF data is no longer present.`;
};

const privacycheckCmd: CommandFn = (args, state) => {
  const platform = args[0]?.toLowerCase();
  if (!platform) return err('usage: privacycheck <platform>');
  const settings = state.socialPrivacy[platform];
  if (!settings) return `No privacy settings tracked for ${platform}`;
  const atRisk = settings.visibility === 'public' || settings.locationTagging;
  return [
    `${platform}: visibility=${settings.visibility}, locationTagging=${settings.locationTagging ? 'on' : 'off'}`,
    atRisk ? 'Flagged: this configuration exposes more than necessary.' : 'Looks good — locked down.'
  ].join('\n');
};

const privacysetCmd: CommandFn = (args, state) => {
  const [platform, key, value] = args;
  if (!platform || !key || !value) return err('usage: privacyset <platform> <visibility|locationTagging> <value>');
  const settings = state.socialPrivacy[platform.toLowerCase()];
  if (!settings) return err(`No privacy settings tracked for ${platform}`);
  if (key === 'visibility') { settings.visibility = value; return `${platform}: visibility set to ${value}`; }
  if (key === 'locationTagging') { settings.locationTagging = value === 'on'; return `${platform}: locationTagging set to ${value}`; }
  return err(`privacyset: unknown setting "${key}"`);
};

const SOCKPUPPET_CHECKLIST = [
  'Use a dedicated email address never linked to your real identity.',
  'Pick a username never reused on any personal account.',
  'Use no personal photos — a generic or AI-generated avatar only.',
  'Browse from an isolated browser profile/VM, ideally over its own VPN or Tor circuit.',
  'Never log into a personal account from the same session.'
];

const sockpuppetCmd: CommandFn = (args, state) => {
  if (args[0] !== 'create' || !args[1]) return err('usage: sockpuppet create <alias>');
  const alias = args[1];
  if (!state.sockPuppets.includes(alias)) state.sockPuppets.push(alias);
  return [`Created investigative persona: ${alias}`, 'Checklist for keeping it properly isolated:', ...SOCKPUPPET_CHECKLIST.map((c) => `  - ${c}`)].join('\n');
};

// --- OSINT automation & frameworks (Module 22) ---------------------------------------

const RECONNG_MODULE_RESULTS: Record<string, string[]> = {
  'recon/domains-hosts/subfinder': ['www.corp-target.lab', 'mail.corp-target.lab', 'vpn.corp-target.lab', 'dev.corp-target.lab', 'staging.corp-target.lab'],
  'recon/domains-contacts/theharvester': ['jmartinez@corp-target.lab', 'achen@corp-target.lab', 'support@corp-target.lab']
};

const reconngCmd: CommandFn = (args, state) => {
  const sub = args[0];
  if (sub === 'workspace') {
    const name = args[1];
    if (!name) return err('usage: reconng workspace <name>');
    state.reconWorkspace = name;
    return `[*] Workspace "${name}" created and loaded.`;
  }
  if (sub === 'use') {
    if (!state.reconWorkspace) return err('reconng: no workspace loaded — run "reconng workspace <name>" first');
    const module = args[1];
    if (!module) return err('usage: reconng use <module>');
    state.reconModule = module;
    return `[*] Module loaded: ${module}`;
  }
  if (sub === 'run') {
    if (!state.reconWorkspace) return err('reconng: no workspace loaded');
    if (!state.reconModule) return err('reconng: no module loaded — run "reconng use <module>" first');
    const results = RECONNG_MODULE_RESULTS[state.reconModule];
    if (!results) return `[*] Module "${state.reconModule}" ran but found nothing in this workspace.`;
    return [`[*] Running ${state.reconModule} in workspace "${state.reconWorkspace}"...`, ...results.map((r) => `  ${r}`)].join('\n');
  }
  return err('usage: reconng workspace <name> | use <module> | run');
};

const linkgraphCmd: CommandFn = (args, state) => {
  const sub = args[0];
  if (sub === 'add') {
    const [, from, relation, to] = args;
    if (!from || !relation || !to) return err('usage: linkgraph add <entity1> <relation> <entity2>');
    state.linkGraph.push({ from, relation, to });
    return `Added: ${from} --[${relation}]--> ${to}`;
  }
  if (sub === 'show') {
    if (state.linkGraph.length === 0) return 'Graph is empty — add entities with "linkgraph add".';
    return state.linkGraph.map((e) => `${e.from} --[${e.relation}]--> ${e.to}`).join('\n');
  }
  return err('usage: linkgraph add <entity1> <relation> <entity2> | linkgraph show');
};

// --- Enumeration & Initial Access (Modules 24-25) ------------------------------------
// Continues the Module 8 webserver01.lab engagement one step further along the kill
// chain: from "what's there" (recon) to "what can I actually get into" (enumeration and
// initial access). Every technique here maps to a real, named MITRE ATT&CK technique,
// logged automatically as it happens via logTechnique() below — completing the
// state.redteam / ENGAGEMENT_TARGETS gating the ssh command already relied on.

function logTechnique(state: ShellState, id: string, tactic: string, name: string, detail: string): void {
  state.redteam.techniquesLogged.push({ id, tactic, name, detail });
}

const ENUM_TARGET = 'webserver01.lab';

interface SmbEnumResult { shares: string[]; users: string[]; osInfo: string; }

const SMB_ENUM_DB: Record<string, SmbEnumResult> = {
  [ENUM_TARGET]: { shares: ['backups$ (Disk, no auth required)', 'IPC$ (IPC)'], users: ['dsilva', 'svc-backup'], osInfo: 'Ubuntu 22.04 (Samba 4.15.13)' }
};

const enum4linuxCmd: CommandFn = (args, state) => {
  const host = args.find((a) => !a.startsWith('-'));
  if (!host) return err('usage: enum4linux <host>');
  const result = SMB_ENUM_DB[host];
  if (!result) return err(`enum4linux: could not connect to ${host}`);
  state.redteam.osintFindings.push(`SMB shares on ${host}: ${result.shares.join(', ')}`);
  return [
    `Starting enum4linux v0.9.1 on ${host}`,
    '',
    '[+] Share Enumeration:',
    ...result.shares.map((s) => `  ${s}`),
    '',
    '[+] OS Information:',
    `  ${result.osInfo}`,
    '',
    '[+] User Enumeration (via RID cycling):',
    ...result.users.map((u) => `  ${u}`)
  ].join('\n');
};

interface WhatwebResult { app: string; version: string; framework: string; }

const WHATWEB_DB: Record<string, WhatwebResult> = {
  [ENUM_TARGET]: { app: 'Internal App API', version: '1.4.2', framework: 'Node.js/Express, nginx 1.18.0 (Ubuntu)' }
};

const whatwebCmd: CommandFn = (args, state) => {
  const target = args.find((a) => !a.startsWith('-'));
  if (!target) return err('usage: whatweb <url|host>');
  const { host } = webHostAndPath(target);
  const result = WHATWEB_DB[host];
  if (!result) return err(`whatweb: no response from ${target}`);
  state.redteam.osintFindings.push(`Fingerprinted ${result.app} v${result.version} on ${host}`);
  return `${target} [200 OK] ${result.framework}, ${result.app}[${result.version}]`;
};

interface SnmpEnumResult { sysDescr: string; sysContact: string; sysLocation: string; }

const SNMP_DB: Record<string, SnmpEnumResult> = {
  [ENUM_TARGET]: {
    sysDescr: 'Linux webserver01 5.15.0-101-generic #111-Ubuntu SMP x86_64',
    sysContact: 'D. Silva <dsilva@webserver01.lab>',
    sysLocation: 'Rack 4, Primary DC'
  }
};

const snmpwalkCmd: CommandFn = (args, state) => {
  const host = args.find((a) => !a.startsWith('-') && a !== 'public');
  if (!host) return err('usage: snmpwalk -c <community> <host>');
  const result = SNMP_DB[host];
  if (!result) return err(`snmpwalk: Timeout: No Response from ${host}`);
  state.redteam.osintFindings.push(`SNMP sysContact on ${host}: ${result.sysContact}`);
  return [
    `sysDescr.0 = STRING: ${result.sysDescr}`,
    `sysContact.0 = STRING: ${result.sysContact}`,
    `sysLocation.0 = STRING: ${result.sysLocation}`
  ].join('\n');
};

interface SearchsploitResult { title: string; path: string; }

const SEARCHSPLOIT_DB: Record<string, SearchsploitResult[]> = {
  '1.4.2': [{ title: 'Internal App <= 1.4.2 - Default Administrative Credentials', path: 'webapps/NOVA-2024-1122.txt' }]
};

const searchsploitCmd: CommandFn = (args, state) => {
  const query = args.join(' ');
  const versionMatch = Object.keys(SEARCHSPLOIT_DB).find((v) => query.includes(v));
  if (!versionMatch) {
    return ['Exploit Title                                                    | Path', '----------------------------------------------------------------- | -----', 'No Results'].join('\n');
  }
  const results = SEARCHSPLOIT_DB[versionMatch];
  state.redteam.enumerationDone = true;
  state.redteam.osintFindings.push(`searchsploit: ${results[0].title}`);
  return [
    'Exploit Title                                                    | Path',
    '----------------------------------------------------------------- | -----',
    ...results.map((r) => `${r.title.padEnd(66)}| ${r.path}`)
  ].join('\n');
};

interface ValidCredential { user: string; pass: string; }

const VALID_CREDS: Record<string, ValidCredential> = {
  [ENUM_TARGET]: { user: 'dsilva', pass: 'Winter2025!' }
};

const hydraCmd: CommandFn = (args, state) => {
  const lIdx = args.indexOf('-l');
  const pIdx = args.indexOf('-p');
  const user = lIdx !== -1 ? args[lIdx + 1] : undefined;
  const pass = pIdx !== -1 ? args[pIdx + 1] : undefined;
  if (!user || !pass) return err('usage: hydra -l <user> -p <password> <host> <service>');
  const positional = args.filter((a) => !a.startsWith('-') && a !== user && a !== pass);
  const host = positional[0];
  if (!host) return err('usage: hydra -l <user> -p <password> <host> <service>');
  const valid = VALID_CREDS[host];
  if (!valid || valid.user !== user || valid.pass !== pass) {
    return ['Hydra starting...', `[DATA] attacking ${host}`, '1 of 1 target completed, 0 valid passwords found'].join('\n');
  }
  state.redteam.footholdGained = true;
  state.redteam.discoveredUser = user;
  state.redteam.discoveredPassword = pass;
  state.redteam.osintFindings.push(`Validated credential ${user}:${pass} against ${host}`);
  logTechnique(state, 'T1078', 'Initial Access', 'Valid Accounts', `Validated a leaked credential (${user}) against ${host} with hydra.`);
  return [
    'Hydra starting...',
    `[DATA] attacking ${host}`,
    `[22][ssh] host: ${host}   login: ${user}   password: ${pass}`,
    '1 of 1 target completed, 1 valid password found'
  ].join('\n');
};

const attcklogCmd: CommandFn = (_args, state) => {
  if (state.redteam.techniquesLogged.length === 0) return 'No techniques logged yet for this engagement.';
  return state.redteam.techniquesLogged.map((t) => `[${t.id}] ${t.tactic} - ${t.name}: ${t.detail}`).join('\n');
};

// --- man pages / help --------------------------------------------------------------

const manPages: Record<string, string> = {
  ls: 'ls - list directory contents\n\nUsage: ls [-l] [-a] [path...]\n  -l  long listing (permissions, owner, size)\n  -a  show hidden entries',
  cd: 'cd - change the working directory\n\nUsage: cd [path]\n  cd with no arguments returns to your home directory\n  cd .. moves up one level',
  chmod: 'chmod - change file permissions\n\nUsage: chmod MODE file\n  Numeric: chmod 755 file\n  Symbolic: chmod u+x file',
  useradd: 'useradd - create a new user\n\nUsage: useradd [-m] username',
  apt: 'apt - package management\n\nUsage: apt update | install <pkg> | remove <pkg> | list [--installed]',
  grep: 'grep - search text\n\nUsage: grep [-inv] PATTERN [file...]',
  systemctl: 'systemctl - control systemd services\n\nUsage: systemctl start|stop|restart|enable|disable|status <service>',
  iptables: 'iptables - Linux firewall\n\nUsage: iptables -L | -A <chain> <rule> | -P <chain> <policy>',
  dork: 'dork - search-engine dorking simulator\n\nUsage: dork [site:<domain>] [filetype:<ext>] [intitle:<word>] [inurl:<word>] [term...]',
  subfinder: 'subfinder - passive subdomain enumeration\n\nUsage: subfinder -d <domain>',
  theharvester: 'theharvester - harvest emails and hosts from public sources\n\nUsage: theharvester -d <domain> -b all',
  sherlock: 'sherlock - hunt down a username across social media platforms\n\nUsage: sherlock <username>',
  exiftool: 'exiftool - read metadata embedded in a file\n\nUsage: exiftool <file>',
  shodan: 'shodan - search Shodan, the internet-connected device search engine\n\nUsage: shodan host <ip> | shodan search <term>',
  waybackurls: 'waybackurls - list a domain\'s archived URLs from the Wayback Machine\n\nUsage: waybackurls <domain>',
  imageanalyze: 'imageanalyze - list visible clues in an image (signage, vehicles, architecture)\n\nUsage: imageanalyze <file>',
  imgsearch: 'imgsearch - reverse image search: find other places an image appears online\n\nUsage: imgsearch <file>',
  mapsearch: 'mapsearch - look up a landmark\'s coordinates and satellite description\n\nUsage: mapsearch <name>',
  corpreg: 'corpreg - look up a company\'s corporate registry filing\n\nUsage: corpreg <company name>',
  jobscrape: 'jobscrape - mine a company\'s job postings for its tech stack\n\nUsage: jobscrape <company name>',
  orgchart: 'orgchart - view a company\'s public org chart\n\nUsage: orgchart <company name>',
  biznews: 'biznews - search business news coverage of a company\n\nUsage: biznews <company name>',
  subsidiaries: 'subsidiaries - look up a company\'s parent and subsidiaries\n\nUsage: subsidiaries <company name>',
  hibp: 'hibp - check whether an email address appears in a known data breach\n\nUsage: hibp <email>',
  credsearch: 'credsearch - search credential dumps for an email (hashes only, never cracked)\n\nUsage: credsearch <email>',
  passpattern: 'passpattern - detect password reuse across breaches by comparing hashes\n\nUsage: passpattern <email>',
  pastesearch: 'pastesearch - search paste sites for mentions of a domain or term\n\nUsage: pastesearch <term>',
  darkmentions: 'darkmentions - search dark-web forum archives for mentions of a term\n\nUsage: darkmentions <term>',
  socialgraph: 'socialgraph - map an account\'s followers/following connections\n\nUsage: socialgraph <username>',
  postpattern: 'postpattern - analyze an account\'s posting timestamps for patterns\n\nUsage: postpattern <username>',
  hashtag: 'hashtag - pull every post using a given hashtag\n\nUsage: hashtag <#tag>',
  sentiment: 'sentiment - summarize sentiment and flag inauthentic activity for a term\n\nUsage: sentiment <term>',
  tor: 'tor - start/stop the Tor client and check circuit status\n\nUsage: tor start | status | stop',
  onionsearch: 'onionsearch - search an onion-site index (requires Tor running)\n\nUsage: onionsearch <term>',
  onioncurl: 'onioncurl - fetch an onion site\'s content (requires Tor running)\n\nUsage: onioncurl <.onion url>',
  forummonitor: 'forummonitor - view a criminal forum thread mentioning a term\n\nUsage: forummonitor <term>',
  marketmonitor: 'marketmonitor - view dark-web marketplace listings mentioning a term\n\nUsage: marketmonitor <term>',
  vtcheck: 'vtcheck - check an indicator (IP/domain/hash) against a threat database\n\nUsage: vtcheck <indicator>',
  attckmap: 'attckmap - look up a MITRE ATT&CK technique by ID\n\nUsage: attckmap <technique-id>',
  actorprofile: 'actorprofile - look up a threat actor\'s aliases, motivation, and TTPs\n\nUsage: actorprofile <name>',
  passivedns: 'passivedns - view historical DNS resolutions for an IP\n\nUsage: passivedns <ip>',
  threatfeed: 'threatfeed - search aggregated threat-feed entries for a term\n\nUsage: threatfeed <term>',
  pubrecords: 'pubrecords - look up public records for a name\n\nUsage: pubrecords <full name>',
  phonelookup: 'phonelookup - identify a phone number\'s carrier, line type, and region\n\nUsage: phonelookup <number>',
  reverselookup: 'reverselookup - find the name behind a phone number or email\n\nUsage: reverselookup <number|email>',
  addresshistory: 'addresshistory - look up a person\'s known address history\n\nUsage: addresshistory <full name>',
  databroker: 'databroker - pull an aggregated public data-broker profile\n\nUsage: databroker <full name>',
  selfaudit: 'selfaudit - run a self-audit across your own simulated footprint\n\nUsage: selfaudit',
  metadatascrub: 'metadatascrub - strip embedded metadata from a file\n\nUsage: metadatascrub <file>',
  privacycheck: 'privacycheck - review a social platform\'s current privacy settings\n\nUsage: privacycheck <platform>',
  privacyset: 'privacyset - change a social platform\'s privacy setting\n\nUsage: privacyset <platform> <visibility|locationTagging> <value>',
  sockpuppet: 'sockpuppet - create a properly isolated investigative persona\n\nUsage: sockpuppet create <alias>',
  reconng: 'reconng - modular recon framework\n\nUsage: reconng workspace <name> | use <module> | run',
  linkgraph: 'linkgraph - build and view an entity/relationship graph\n\nUsage: linkgraph add <entity1> <relation> <entity2> | linkgraph show',
  enum4linux: 'enum4linux - enumerate SMB shares, users, and OS info on a host\n\nUsage: enum4linux <host>',
  whatweb: 'whatweb - fingerprint a web application\'s name, version, and framework\n\nUsage: whatweb <url|host>',
  snmpwalk: 'snmpwalk - walk a host\'s SNMP tree using a community string\n\nUsage: snmpwalk -c <community> <host>',
  searchsploit: 'searchsploit - search known vulnerabilities/advisories by product and version\n\nUsage: searchsploit <query>',
  hydra: 'hydra - validate a username/password pair against a live service\n\nUsage: hydra -l <user> -p <password> <host> <service>',
  attcklog: 'attcklog - view every MITRE ATT&CK technique logged so far this engagement\n\nUsage: attcklog'
};

const man: CommandFn = (args) => {
  const topic = args[0];
  if (!topic) return err('What manual page do you want?');
  return manPages[topic] ?? `No manual entry for ${topic}`;
};

const help: CommandFn = () => [
  'Available commands:',
  '  pwd, whoami, id, groups, useradd, passwd',
  '  ls, cd, cat, mkdir, touch, rm, cp, mv',
  '  chmod, chown, ln -s, umask, fdisk, parted, mkfs',
  '  echo, export, env, history, clear',
  '  apt update|install|remove|list',
  '  grep, sort, uniq, wc, head, tail, cut, sed, tee, find',
  '  pipes ( | ) and redirection ( > , >> ) are supported',
  '  tar, gzip, gunzip, zip, unzip, rsync, scp',
  '  systemctl, service, ps, kill, top, crontab',
  '  ssh, exit, logout, lsmod, dmesg',
  '  df, du, mount, lsblk, pvcreate, vgcreate, lvcreate, pvs, vgs, lvs, mdadm',
  '  free, swapon, swapoff, systemd-analyze, journalctl, vmstat, uptime',
  '  ip, arp, ss, netstat, ping, traceroute, nslookup, dig',
  '  nc, nmap, tcpdump, iptables, nft, dhclient, wg, wg-quick',
  '  sudo, ufw, fail2ban-client, chage, auditctl, ausearch',
  '  curl, wget, whois, gobuster, nikto',
  '  dork, subfinder, theharvester, sherlock, exiftool, shodan, waybackurls (OSINT)',
  '  imageanalyze, imgsearch, mapsearch (GEOINT)',
  '  corpreg, jobscrape, orgchart, biznews, subsidiaries (corporate intel)',
  '  hibp, credsearch, passpattern, pastesearch, darkmentions (breach intel)',
  '  socialgraph, postpattern, hashtag, sentiment (SOCMINT)',
  '  tor start|status|stop, onionsearch, onioncurl, forummonitor, marketmonitor (dark web)',
  '  vtcheck, attckmap, actorprofile, passivedns, threatfeed (threat intel)',
  '  pubrecords, phonelookup, reverselookup, addresshistory, databroker (people search)',
  '  selfaudit, metadatascrub, privacycheck, privacyset, sockpuppet (counter-OSINT)',
  '  reconng workspace|use|run, linkgraph add|show (automation & frameworks)',
  '  enum4linux, whatweb, snmpwalk, searchsploit (enumeration)',
  '  hydra, attcklog (initial access)',
  '  git init/add/commit/log/diff/branch/checkout/merge/stash/remote/push/pull/clone/reset',
  '  docker pull/images/run/ps/stop/start/rm/rmi/logs/exec/volume/network/build, docker-compose',
  '  alias, unalias, source (or .), which, type, command -v',
  '  xargs, watch, strace, lsof, tmux',
  '  aws ec2/s3 (simulated cloud CLI), infra plan/apply/destroy (simulated IaC)',
  '  true, false, test, [ ] (comparison: -eq -ne -lt -le -gt -ge = != -z -n -f -d)',
  '  uname -a, lsb_release -a',
  '  bash <script>, man <command>',
  '  scripts support if/elif/else/fi, for/while ... do/done, functions, $1.., $#, $@, $?',
  '',
  'Use the theory panel on the right for guided lessons and hints.'
].join('\n');

export const commandRegistry: Record<string, CommandFn> = {
  pwd, whoami, echo, export: exportCmd, env: envCmd, history: historyCmd, clear: clearMarker,
  cd, ls, cat, mkdir, touch, rm, cp, mv, chmod, chown, ln, umask: umaskCmd,
  fdisk, parted, mkfs, 'mkfs.ext4': mkfs, 'mkfs.xfs': mkfs, 'mkfs.vfat': mkfs,
  id, groups: groupsCmd, useradd, passwd: passwdCmd, apt, uname, lsb_release: lsbRelease,
  grep, sort: sortCmd, uniq: uniqCmd, wc: wcCmd, head: headCmd, tail: tailCmd,
  cut: cutCmd, sed: sedCmd, tee: teeCmd, find: findCmd,
  tar: tarCmd, gzip: gzipCmd, gunzip: gunzipCmd, zip: zipCmd, unzip: unzipCmd,
  rsync: rsyncCmd, scp: scpCmd,
  systemctl, service,
  ps, kill, top,
  crontab,
  ssh, exit: exitOrLogout, logout: exitOrLogout,
  lsmod, dmesg,
  df, du, mount, lsblk,
  pvcreate, vgcreate, lvcreate, pvs, vgs, lvs,
  mdadm,
  free, swapon, swapoff,
  'systemd-analyze': systemdAnalyze,
  journalctl,
  vmstat, uptime,
  ping, traceroute,
  nslookup, dig,
  ip: ipCmd, arp,
  ss, netstat,
  nc, nmap,
  tcpdump,
  iptables,
  nft,
  dhclient,
  wg, 'wg-quick': wgQuick,
  true: trueCmd, false: falseCmd, test: testCmd, '[': testCmd,
  sudo, ufw, 'fail2ban-client': fail2banClient, chage, auditctl, ausearch,
  curl: curlCmd, wget: wgetCmd, whois: whoisCmd, gobuster: gobusterCmd, nikto: niktoCmd,
  dork: dorkCmd, subfinder: subfinderCmd, theharvester: theharvesterCmd, sherlock: sherlockCmd,
  exiftool: exiftoolCmd, shodan: shodanCmd, waybackurls: waybackurlsCmd,
  imageanalyze: imageanalyzeCmd, imgsearch: imgsearchCmd, mapsearch: mapsearchCmd,
  corpreg: corpregCmd, jobscrape: jobscrapeCmd, orgchart: orgchartCmd, biznews: biznewsCmd, subsidiaries: subsidiariesCmd,
  hibp: hibpCmd, credsearch: credsearchCmd, passpattern: passpatternCmd, pastesearch: pastesearchCmd, darkmentions: darkmentionsCmd,
  socialgraph: socialgraphCmd, postpattern: postpatternCmd, hashtag: hashtagCmd, sentiment: sentimentCmd,
  tor: torCmd, onionsearch: onionsearchCmd, onioncurl: onioncurlCmd, forummonitor: forummonitorCmd, marketmonitor: marketmonitorCmd,
  vtcheck: vtcheckCmd, attckmap: attckmapCmd, actorprofile: actorprofileCmd, passivedns: passivednsCmd, threatfeed: threatfeedCmd,
  pubrecords: pubrecordsCmd, phonelookup: phonelookupCmd, reverselookup: reverselookupCmd, addresshistory: addresshistoryCmd, databroker: databrokerCmd,
  selfaudit: selfauditCmd, metadatascrub: metadatascrubCmd, privacycheck: privacycheckCmd, privacyset: privacysetCmd, sockpuppet: sockpuppetCmd,
  reconng: reconngCmd, linkgraph: linkgraphCmd,
  enum4linux: enum4linuxCmd, whatweb: whatwebCmd, snmpwalk: snmpwalkCmd, searchsploit: searchsploitCmd,
  hydra: hydraCmd, attcklog: attcklogCmd,
  git: gitCmd,
  docker: dockerCmd, 'docker-compose': dockerComposeCmd,
  alias: aliasCmd, unalias: unaliasCmd, source: sourceCmd, '.': sourceCmd,
  which: whichCmd, type: typeCmd, command: commandCmd,
  xargs: xargsCmd, watch: watchCmd, strace: straceCmd, lsof: lsofCmd, tmux: tmuxCmd,
  aws: awsCmd, infra: infraCmd,
  man, help
};
