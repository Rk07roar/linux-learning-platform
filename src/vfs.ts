// --- virtual filesystem: node types, helpers, and the initial seeded tree ------------

export interface BaseNode {
  owner: string;
  group: string;
  /** 9-character rwx string, e.g. "rwxr-xr-x". */
  perms: string;
  special?: { setuid: boolean; setgid: boolean; sticky: boolean };
  /** Display timestamp shown in `ls -l`. */
  modified: string;
}

export interface FileNode extends BaseNode {
  type: 'file';
  content: string;
}

export interface DirNode extends BaseNode {
  type: 'dir';
  children: Record<string, FSNode>;
}

export interface SymlinkNode extends BaseNode {
  type: 'symlink';
  target: string;
}

export type FSNode = FileNode | DirNode | SymlinkNode;

const DEFAULT_MODIFIED = 'Jan 15 09:00';

export function file(content: string, owner: string, group: string, perms: string = 'rw-r--r--'): FileNode {
  return { type: 'file', content, owner, group, perms, modified: DEFAULT_MODIFIED };
}

export function dir(children: Record<string, FSNode>, owner: string, group: string, perms: string = 'rwxr-xr-x'): DirNode {
  return { type: 'dir', children, owner, group, perms, modified: DEFAULT_MODIFIED };
}

export function symlink(target: string, owner: string, group: string, perms: string = 'rwxrwxrwx'): SymlinkNode {
  return { type: 'symlink', target, owner, group, perms, modified: DEFAULT_MODIFIED };
}

/** Walk a DirNode tree by path segments. Empty segs returns the root itself. */
export function getNode(root: DirNode, segs: string[]): FSNode | undefined {
  let cur: FSNode = root;
  for (const seg of segs) {
    if (cur.type !== 'dir') return undefined;
    const next: FSNode | undefined = (cur as DirNode).children[seg];
    if (!next) return undefined;
    cur = next;
  }
  return cur;
}

/** Resolve the parent directory and final path component for a segment path. */
export function getParentAndName(root: DirNode, segs: string[]): { parent: DirNode | null; name: string } {
  if (segs.length === 0) return { parent: null, name: '' };
  const parentSegs = segs.slice(0, -1);
  const name = segs[segs.length - 1];
  const parentNode = parentSegs.length === 0 ? root : getNode(root, parentSegs);
  if (!parentNode || parentNode.type !== 'dir') return { parent: null, name };
  return { parent: parentNode, name };
}

/** Follow a symlink (chasing chained symlinks up to a safety depth) to its final target node. */
export function followSymlink(root: DirNode, node: SymlinkNode, depth: number = 0): FileNode | DirNode | undefined {
  if (depth > 10) return undefined;
  const segs = node.target.split('/').filter((s) => s.length > 0);
  const target = getNode(root, segs);
  if (target && target.type === 'symlink') return followSymlink(root, target, depth + 1);
  return target;
}

function octalDigitToRwx(n: number): string {
  return (n & 4 ? 'r' : '-') + (n & 2 ? 'w' : '-') + (n & 1 ? 'x' : '-');
}

/** Apply a umask to a base octal permission (e.g. "666"/"777") producing a 9-char rwx string. */
export function maskToPerms(base: string, umask: string): string {
  let result = '';
  for (let i = 0; i < 3; i++) {
    const b = parseInt(base[i] ?? '0', 8);
    const u = parseInt(umask[i] ?? '0', 8);
    result += octalDigitToRwx(b & ~u & 7);
  }
  return result;
}

/** Render path segments as an absolute path string, e.g. ["home","student"] -> "/home/student". */
export function formatPath(segs: string[]): string {
  return '/' + segs.join('/');
}

/** Resolve an absolute/relative/"~"-prefixed path argument against cwd + home into path segments. */
export function resolvePath(cwd: string[], input: string, home: string[]): string[] {
  let raw: string[];
  if (input.startsWith('~')) {
    const rest = input.slice(1).replace(/^\//, '');
    raw = rest.length > 0 ? [...home, ...rest.split('/')] : [...home];
  } else if (input.startsWith('/')) {
    raw = input.split('/');
  } else {
    raw = [...cwd, ...input.split('/')];
  }

  const result: string[] = [];
  for (const seg of raw) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') { result.pop(); continue; }
    result.push(seg);
  }
  return result;
}

/** Total content size in bytes of a node, recursing into directories. */
export function subtreeSize(node: FSNode): number {
  if (node.type === 'file') return node.content.length;
  if (node.type === 'symlink') return node.target.length;
  return Object.values(node.children).reduce((sum, child) => sum + subtreeSize(child), 0);
}

// --- seeded starting filesystem -----------------------------------------------------

const HELLO_SH = `#!/bin/bash
# A tiny starter script for Module 1.
echo "Hello, Linux!"
`;

const VARS_DEMO_SH = `#!/bin/bash
CITY="New York"
echo "Welcome to $CITY"
echo 'Welcome to $CITY'
`;

const CHECK_DISK_SH = `#!/bin/bash
USAGE=85
if [ $USAGE -ge 80 ]; then
  echo "WARNING: disk usage at $USAGE percent"
else
  echo "OK: disk usage is normal"
fi
`;

const COUNTDOWN_SH = `#!/bin/bash
for n in 5 4 3 2 1; do
  echo "T-minus $n"
done
echo "Liftoff!"
`;

const RETRY_SH = `#!/bin/bash
ATTEMPTS=0
while [ $ATTEMPTS -lt 3 ]; do
  ATTEMPTS=$((ATTEMPTS+1))
  echo "Attempt $ATTEMPTS"
done
echo "Done after 3 attempts"
`;

const GREET_SH = `#!/bin/bash
greet() {
  echo "Hello, $1! You are $2 years old."
}
greet "$1" "$2"
`;

const NOTES_TXT = `Reminders for myself:
- Finish the Linux fundamentals module
- Practice permissions with chmod/chown
- Review the pipes & redirection examples
`;

const ACCESS_LOG = `10.0.0.5 - - [15/Jan/2026:09:12:01] "GET /index.html HTTP/1.1" 200 INFO
10.0.0.7 - - [15/Jan/2026:09:12:45] "GET /login HTTP/1.1" 401 ERROR Invalid credentials
10.0.0.5 - - [15/Jan/2026:09:13:02] "GET /dashboard HTTP/1.1" 200 INFO
10.0.0.9 - - [15/Jan/2026:09:14:11] "GET /api/status HTTP/1.1" 500 ERROR Internal server error
10.0.0.5 - - [15/Jan/2026:09:15:30] "GET /logout HTTP/1.1" 200 INFO
10.0.0.11 - - [15/Jan/2026:09:16:02] "GET /admin HTTP/1.1" 403 WARN Forbidden
10.0.0.7 - - [15/Jan/2026:09:17:55] "GET /login HTTP/1.1" 200 INFO
10.0.0.9 - - [15/Jan/2026:09:18:20] "GET /api/status HTTP/1.1" 200 INFO
`;

const INVENTORY_CSV = `name,category,quantity
router,networking,12
switch,networking,8
laptop,compute,25
server,compute,4
firewall,security,3
keyboard,peripheral,40
monitor,peripheral,18
`;

const BACKUP_CRON = `# Nightly backup job
0 2 * * * /home/student/scripts/backup.sh
`;

const BASHRC = `# ~/.bashrc: executed by bash for interactive shells.

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export EDITOR=vim

# Uncomment to add your own aliases below:
# alias ll='ls -la'
`;

const GRUB_CFG = `# GRUB bootloader configuration
set default=0
set timeout=5

menuentry 'Debian GNU/Linux 12 (bookworm)' {
    linux /boot/vmlinuz root=/dev/sda1 ro quiet
    initrd /boot/initrd.img
}

menuentry 'Debian GNU/Linux 12 (bookworm), recovery mode' {
    linux /boot/vmlinuz root=/dev/sda1 ro single
    initrd /boot/initrd.img
}
`;

const OS_RELEASE = `PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"
NAME="Debian GNU/Linux"
VERSION_ID="12"
VERSION="12 (bookworm)"
ID=debian
HOME_URL="https://www.debian.org/"
`;

const SYSLOG = `Jan 15 09:00:01 linuxlab systemd[1]: Startup finished in 2.1s (kernel) + 3.4s (userspace) = 5.5s.
Jan 15 09:00:02 linuxlab systemd[1]: Started Regular background program processing daemon.
Jan 15 09:03:14 linuxlab sshd[498]: Server listening on 0.0.0.0 port 22.
Jan 15 09:10:22 linuxlab CRON[512]: (root) CMD (cd / && run-parts --report /etc/cron.hourly)
Jan 15 09:22:47 linuxlab kernel: [   12.884012] eth0: link up, 1000Mbps, full-duplex
`;

const SHADOW_CHART_TXT = `Sun-angle / shadow-length reference:
  shadow << object height   -> midday (sun near overhead)
  shadow ~= object height   -> mid-morning or mid-afternoon (sun ~45 degrees up)
  shadow >> object height   -> early morning, late afternoon, or winter (sun low)

Applied to the loading-dock photo:
  The forklift's shadow is roughly equal to the forklift's own height,
  which places the photo in the mid-morning or mid-afternoon window.
`;

const RATE_LIMIT_NOTES_TXT = `OSINT automation etiquette:
  1. Add delays between requests; don't hammer a service in a tight loop.
  2. Respect documented rate limits and terms of service for every API you use.
  3. Cache results locally instead of re-querying the same lookup repeatedly.
  4. Automating passive, publicly-offered lookups (WHOIS, search engines, breach
     databases) is very different from sending automated requests directly against
     a target's own infrastructure without authorization - the second one is
     active recon and carries real legal weight.
`;

export function buildInitialFilesystem(): DirNode {
  return dir(
    {
      bin: dir({}, 'root', 'root'),
      boot: dir(
        {
          grub: dir({ 'grub.cfg': file(GRUB_CFG, 'root', 'root') }, 'root', 'root')
        },
        'root',
        'root'
      ),
      dev: dir({}, 'root', 'root'),
      etc: dir(
        {
          'os-release': file(OS_RELEASE, 'root', 'root'),
          hostname: file('linuxlab\n', 'root', 'root'),
          hosts: file('127.0.0.1\tlocalhost\n10.0.0.15\tlinuxlab\n', 'root', 'root')
        },
        'root',
        'root'
      ),
      home: dir(
        {
          student: dir(
            {
              'notes.txt': file(NOTES_TXT, 'student', 'student'),
              '.bashrc': file(BASHRC, 'student', 'student'),
              scripts: dir(
                {
                  'hello.sh': file(HELLO_SH, 'student', 'student', 'rwxr-xr-x'),
                  'vars_demo.sh': file(VARS_DEMO_SH, 'student', 'student', 'rwxr-xr-x'),
                  'check_disk.sh': file(CHECK_DISK_SH, 'student', 'student', 'rwxr-xr-x'),
                  'countdown.sh': file(COUNTDOWN_SH, 'student', 'student', 'rwxr-xr-x'),
                  'retry.sh': file(RETRY_SH, 'student', 'student', 'rwxr-xr-x'),
                  'greet.sh': file(GREET_SH, 'student', 'student', 'rwxr-xr-x')
                },
                'student',
                'student'
              ),
              projects: dir(
                {
                  'access.log': file(ACCESS_LOG, 'student', 'student'),
                  'inventory.csv': file(INVENTORY_CSV, 'student', 'student')
                },
                'student',
                'student'
              ),
              cron: dir({ 'backup.cron': file(BACKUP_CRON, 'student', 'student') }, 'student', 'student'),
              osint: dir(
                {
                  'shadow_chart.txt': file(SHADOW_CHART_TXT, 'student', 'student'),
                  'rate_limit_notes.txt': file(RATE_LIMIT_NOTES_TXT, 'student', 'student')
                },
                'student',
                'student'
              )
            },
            'student',
            'student'
          )
        },
        'root',
        'root'
      ),
      root: dir({}, 'root', 'root', 'rwx------'),
      tmp: dir({}, 'root', 'root', 'rwxrwxrwx'),
      usr: dir({ bin: dir({}, 'root', 'root'), local: dir({}, 'root', 'root') }, 'root', 'root'),
      var: dir({ log: dir({ syslog: file(SYSLOG, 'root', 'root') }, 'root', 'root') }, 'root', 'root')
    },
    'root',
    'root'
  );
}
