import { buildInitialFilesystem, DirNode, formatPath, resolvePath } from './vfs';

/**
 * Sentinel used by the tokenizer (parser.ts) to mark a "$" that appeared inside
 * single quotes, so it survives tokenizing as literal text instead of being
 * treated as a variable reference. expandVars() below always converts it back
 * to a plain "$" as its last step, whether or not anything else expanded. A
 * distinctive ASCII token is used so it can never collide with anything a
 * person would plausibly type in a lesson.
 */
export const DOLLAR_ESCAPE = "zQeSCAPEDDOLLARzQ";

/** Tiny, safe recursive-descent integer arithmetic evaluator for $((expr)) expansion. */
function evalArithmetic(expr: string): number {
  const s = expr.replace(/\s+/g, '');
  let i = 0;

  function parseExpr(): number {
    let value = parseTerm();
    while (s[i] === '+' || s[i] === '-') {
      const op = s[i]; i++;
      const rhs = parseTerm();
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }
  function parseTerm(): number {
    let value = parseFactor();
    while (s[i] === '*' || s[i] === '/' || s[i] === '%') {
      const op = s[i]; i++;
      const rhs = parseFactor();
      value = op === '*' ? value * rhs : op === '/' ? Math.trunc(value / rhs) : value % rhs;
    }
    return value;
  }
  function parseFactor(): number {
    if (s[i] === '(') {
      i++;
      const value = parseExpr();
      if (s[i] === ')') i++;
      return value;
    }
    if (s[i] === '-') { i++; return -parseFactor(); }
    if (s[i] === '+') { i++; return parseFactor(); }
    let numStr = '';
    while (i < s.length && /[0-9]/.test(s[i])) { numStr += s[i]; i++; }
    return numStr ? parseInt(numStr, 10) : 0;
  }

  if (s.length === 0) return 0;
  return parseExpr();
}

export interface UserRecord {
  uid: number;
  gid: number;
  groups: string[];
  home: string;
}

export interface ServiceRecord {
  name: string;
  description: string;
  active: boolean;
  enabled: boolean;
}

export interface ProcessRecord {
  pid: number;
  user: string;
  cmd: string;
  cpu: string;
  mem: string;
  service?: string; // if this process belongs to a managed service
}

export interface CronJob {
  schedule: string;
  command: string;
}

export interface VolumeGroup {
  name: string;
  pvs: string[];
  sizeGB: number;
}

export interface LogicalVolume {
  name: string;
  vg: string;
  sizeGB: number;
}

export interface LVMState {
  physicalVolumes: string[];
  volumeGroups: VolumeGroup[];
  logicalVolumes: LogicalVolume[];
}

export interface RaidArray {
  device: string;
  level: string;
  members: string[];
  state: string;
}

// --- networking state --------------------------------------------------------

export interface NetInterface {
  name: string;
  ip: string | null;
  mac: string;
  up: boolean;
  mtu: number;
}

export interface Route {
  destination: string;
  gateway: string | null;
  iface: string;
}

export interface ArpEntry {
  ip: string;
  mac: string;
  iface: string;
}

export interface FirewallRule {
  chain: 'INPUT' | 'OUTPUT' | 'FORWARD';
  rule: string;
}

export interface Vlan {
  id: number;
  parentIface: string;
  name: string;
}

// --- version control (Module 9) -----------------------------------------------

export interface GitCommit {
  hash: string;
  parent: string | null;
  message: string;
  author: string;
  timestamp: string;
  files: Record<string, string>;
}

export interface GitRepo {
  branch: string;
  branches: Record<string, string>;
  commits: Record<string, GitCommit>;
  staged: Record<string, string>;
  remotes: Record<string, string>;
  stashes: { message: string; files: Record<string, string> }[];
  conflictFiles: string[];
  mergingBranch: string | null;
  nextCommitNum: number;
}

// --- containers (Module 10) ------------------------------------------------------

export interface DockerImage {
  repository: string;
  tag: string;
  imageId: string;
  sizeMB: number;
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  command: string;
  status: 'running' | 'exited';
  ports: string[];
  volumes: string[];
  network: string;
}

// --- cloud / infra (Module 12) -----------------------------------------------------

export interface CloudInstance {
  id: string;
  name: string;
  instanceType: string;
  state: 'running' | 'stopped' | 'terminated';
  publicIp: string | null;
  securityGroup: string | null;
}

export interface CloudBucket {
  name: string;
  objects: Record<string, string>;
}

// --- offensive security training (Modules 13-17) -----------------------------------
// Everything below models a purely fictional, sandboxed "engagement" against lab-only
// hosts (webserver01.lab / dbserver01.lab) for teaching MITRE ATT&CK concepts. No real
// network access, real exploit code, or real credentials are involved anywhere.

export interface CredentialFinding {
  user: string;
  hash: string;
  source: string;
}

export interface AttackLogEntry {
  id: string;
  tactic: string;
  name: string;
  detail: string;
}

export interface RedTeamState {
  targetHost: string;
  osintFindings: string[];
  footholdGained: boolean;
  discoveredUser: string | null;
  discoveredPassword: string | null;
  compromisedHost: string | null;
  remoteUser: string | null;
  enumerationDone: boolean;
  privEscAchieved: boolean;
  rootOnTarget: boolean;
  persistenceInstalled: boolean;
  persistenceMethod: string | null;
  credentialsDumped: CredentialFinding[];
  crackedPasswords: Record<string, string>;
  lateralHosts: string[];
  logsCleared: boolean;
  timestompedFiles: string[];
  exfiltratedFiles: string[];
  techniquesLogged: AttackLogEntry[];
}

export class ShellState {
  root: DirNode;
  cwd: string[];
  currentUser: string;
  users: Record<string, UserRecord>;
  env: Record<string, string>;
  history: string[];
  installedPackages: Set<string>;
  availablePackages: Set<string>;
  aptUpdated: boolean;

  // --- administration state -------------------------------------------------
  hostname: string;
  sshHost: string | null;
  services: Record<string, ServiceRecord>;
  processes: ProcessRecord[];
  nextPid: number;
  cronJobs: CronJob[];
  lvm: LVMState;
  raidArrays: RaidArray[];
  swapEnabled: boolean;
  journal: { unit: string; message: string }[];

  // --- networking state -------------------------------------------------------
  interfaces: NetInterface[];
  routes: Route[];
  dnsZone: Record<string, string>;
  arpTable: ArpEntry[];
  firewallRules: FirewallRule[];
  firewallPolicy: Record<'INPUT' | 'OUTPUT' | 'FORWARD', string>;
  nftRules: string[];
  namespaces: string[];
  vlans: Vlan[];
  vpnActive: boolean;
  torActive: boolean;
  scrubbedMetadata: string[];
  socialPrivacy: Record<string, { visibility: string; locationTagging: boolean }>;
  sockPuppets: string[];
  reconWorkspace: string | null;
  reconModule: string | null;
  linkGraph: { from: string; relation: string; to: string }[];
  dhcpLeased: boolean;

  // --- scripting state ---------------------------------------------------------
  /** Combined output of the most recently executed top-level command (incl. whole scripts). */
  lastOutput: string;

  // --- filesystem/permissions state (Module 6) ---------------------------------
  /** Default permission mask applied to newly created files/dirs, e.g. "022". */
  umask: string;
  /** Simulated block devices formatted with mkfs, device path -> filesystem type. */
  filesystems: Record<string, string>;

  // --- hardening / access control state (Module 7) -----------------------------
  ufwEnabled: boolean;
  ufwRules: { action: 'allow' | 'deny'; target: string }[];
  fail2banEnabled: boolean;
  fail2banBans: string[];
  passwordAge: Record<string, { maxDays: number; minDays: number; warnDays: number; lastChange: string }>;
  auditRules: string[];
  auditLog: string[];

  // --- version control state (Module 9) -----------------------------------------
  /** Simulated git repositories, keyed by absolute repo root path (e.g. "/home/student/myproject"). */
  gitRepos: Record<string, GitRepo>;

  // --- containers state (Module 10) ----------------------------------------------
  dockerImages: DockerImage[];
  dockerContainers: DockerContainer[];
  dockerVolumes: string[];
  dockerNetworks: { name: string; driver: string }[];
  nextContainerId: number;

  // --- shell productivity state (Module 11) --------------------------------------
  aliases: Record<string, string>;
  tmuxSessions: { name: string; windows: number }[];

  // --- cloud / infra state (Module 12) --------------------------------------------
  cloudConfigured: boolean;
  cloudInstances: CloudInstance[];
  cloudBuckets: CloudBucket[];
  cloudSecurityGroups: { name: string; rules: string[] }[];
  nextInstanceId: number;
  infraApplied: boolean;

  // --- offensive security training (Modules 13-17) --------------------------------
  redteam: RedTeamState;

  constructor() {
    this.root = buildInitialFilesystem();
    this.cwd = ['home', 'student'];
    this.currentUser = 'student';
    this.users = {
      root: { uid: 0, gid: 0, groups: ['root'], home: '/root' },
      student: { uid: 1000, gid: 1000, groups: ['student', 'sudo'], home: '/home/student' }
    };
    this.env = {
      HOME: '/home/student',
      USER: 'student',
      SHELL: '/bin/bash',
      PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      PWD: '/home/student'
    };
    this.history = [];
    this.installedPackages = new Set(['bash', 'coreutils', 'grep', 'sed', 'openssh-client']);
    this.availablePackages = new Set([
      'bash', 'coreutils', 'grep', 'sed', 'openssh-client', 'openssh-server',
      'nmap', 'net-tools', 'curl', 'wget', 'vim', 'git', 'htop', 'tree', 'tcpdump'
    ]);
    this.aptUpdated = false;

    this.hostname = 'linuxlab';
    this.sshHost = null;
    this.services = {
      'ssh': { name: 'ssh', description: 'OpenBSD Secure Shell server', active: false, enabled: false },
      'cron': { name: 'cron', description: 'Regular background program processing daemon', active: true, enabled: true },
      'nginx': { name: 'nginx', description: 'A high performance web server', active: false, enabled: false },
      'systemd-journald': { name: 'systemd-journald', description: 'Journal Service', active: true, enabled: true }
    };
    this.processes = [
      { pid: 1, user: 'root', cmd: '/sbin/init', cpu: '0.0', mem: '0.1' },
      { pid: 112, user: 'root', cmd: '/usr/lib/systemd/systemd-journald', cpu: '0.0', mem: '0.3', service: 'systemd-journald' },
      { pid: 240, user: 'root', cmd: '/usr/sbin/cron -f', cpu: '0.0', mem: '0.1', service: 'cron' },
      { pid: 512, user: 'student', cmd: '-bash', cpu: '0.1', mem: '0.2' }
    ];
    this.nextPid = 1024;
    this.cronJobs = [];
    this.lvm = { physicalVolumes: [], volumeGroups: [], logicalVolumes: [] };
    this.raidArrays = [];
    this.swapEnabled = true;
    this.journal = [
      { unit: 'systemd', message: 'Startup finished in 2.1s (kernel) + 3.4s (userspace) = 5.5s.' },
      { unit: 'cron', message: 'pam_unix(cron:session): session opened for user root' },
      { unit: 'systemd-journald', message: 'Journal started' }
    ];

    this.interfaces = [
      { name: 'lo', ip: '127.0.0.1', mac: '00:00:00:00:00:00', up: true, mtu: 65536 },
      { name: 'eth0', ip: '10.0.0.15', mac: '02:42:ac:11:00:02', up: true, mtu: 1500 }
    ];
    this.routes = [
      { destination: '10.0.0.0/24', gateway: null, iface: 'eth0' },
      { destination: 'default', gateway: '10.0.0.1', iface: 'eth0' }
    ];
    this.dnsZone = {
      'webserver01.lab': '10.0.0.20',
      'dbserver01.lab': '10.0.0.21',
      'ubuntu.com': '185.125.190.20',
      'kali.org': '46.101.230.194',
      'corp-target.lab': '10.0.0.20',
      'www.corp-target.lab': '10.0.0.20',
      'mail.corp-target.lab': '10.0.0.22',
      'vpn.corp-target.lab': '10.0.0.23',
      'dev.corp-target.lab': '10.0.0.24',
      'staging.corp-target.lab': '10.0.0.25'
    };
    this.arpTable = [
      { ip: '10.0.0.1', mac: 'aa:bb:cc:00:00:01', iface: 'eth0' }
    ];
    this.firewallRules = [];
    this.firewallPolicy = { INPUT: 'ACCEPT', OUTPUT: 'ACCEPT', FORWARD: 'DROP' };
    this.nftRules = [];
    this.namespaces = [];
    this.vlans = [];
    this.vpnActive = false;
    this.torActive = false;
    this.scrubbedMetadata = [];
    this.socialPrivacy = { instagram: { visibility: 'public', locationTagging: true } };
    this.sockPuppets = [];
    this.reconWorkspace = null;
    this.reconModule = null;
    this.linkGraph = [];
    this.dhcpLeased = true;

    this.lastOutput = '';

    this.umask = '022';
    this.filesystems = {};

    this.ufwEnabled = false;
    this.ufwRules = [];
    this.fail2banEnabled = false;
    this.fail2banBans = [];
    this.passwordAge = {
      root: { maxDays: 99999, minDays: 0, warnDays: 7, lastChange: '2026-01-15' },
      student: { maxDays: 99999, minDays: 0, warnDays: 7, lastChange: '2026-01-15' }
    };
    this.auditRules = [];
    this.auditLog = [
      'type=SYSCALL msg=audit(1737000000.001:1): arch=c000003e syscall=59 success=yes exit=0 a0=... comm="bash" exe="/bin/bash" key=(null)'
    ];

    this.gitRepos = {};

    this.dockerImages = [];
    this.dockerContainers = [];
    this.dockerVolumes = [];
    this.dockerNetworks = [{ name: 'bridge', driver: 'bridge' }];
    this.nextContainerId = 1;

    this.aliases = {};
    this.tmuxSessions = [];

    this.cloudConfigured = false;
    this.cloudInstances = [];
    this.cloudBuckets = [];
    this.cloudSecurityGroups = [];
    this.nextInstanceId = 1;
    this.infraApplied = false;

    this.redteam = {
      targetHost: 'webserver01.lab',
      osintFindings: [],
      footholdGained: false,
      discoveredUser: null,
      discoveredPassword: null,
      compromisedHost: null,
      remoteUser: null,
      enumerationDone: false,
      privEscAchieved: false,
      rootOnTarget: false,
      persistenceInstalled: false,
      persistenceMethod: null,
      credentialsDumped: [],
      crackedPasswords: {},
      lateralHosts: [],
      logsCleared: false,
      timestompedFiles: [],
      exfiltratedFiles: [],
      techniquesLogged: []
    };
  }

  get pwd(): string {
    return formatPath(this.cwd);
  }

  syncPwdEnv() {
    this.env.PWD = this.pwd;
  }

  get promptPath(): string {
    const p = this.pwd;
    if (p === this.users[this.currentUser].home) return '~';
    if (p.startsWith(this.users[this.currentUser].home + '/')) {
      return '~' + p.slice(this.users[this.currentUser].home.length);
    }
    return p;
  }

  get promptHost(): string {
    return this.sshHost ?? this.hostname;
  }

  /** Resolve a path argument (absolute, relative, or "~"-prefixed) against cwd + home. */
  resolve(input: string): string[] {
    const home = this.users[this.currentUser].home.split('/').filter((p) => p.length > 0);
    return resolvePath(this.cwd, input, home);
  }

  /**
   * Expand $VAR-style references in a token. Supports arithmetic expansion
   * ($((expr))), plain variables ($NAME), positional script parameters ($1-$9),
   * argument count ($#), all arguments joined ($@ / $*), and the last exit
   * code ($?). A "$" that was inside single quotes arrives here already
   * replaced with DOLLAR_ESCAPE by the tokenizer, so it passes through
   * untouched and is converted back to a literal "$" as the final step.
   */
  expandVars(token: string): string {
    let result = token.replace(/\$\(\(([^)]*)\)\)/g, (_m, expr: string) => {
      const substituted = expr.replace(/[A-Za-z_][A-Za-z0-9_]*/g, (name: string) => this.env[name] ?? '0');
      return String(evalArithmetic(substituted));
    });
    result = result.replace(/\$(\?|#|@|\*|[0-9]|[A-Za-z_][A-Za-z0-9_]*)/g, (_m, name: string) => {
      if (name === '?') return this.env['__EXIT__'] ?? '0';
      if (name === '#') return this.env['__ARGC__'] ?? '0';
      if (name === '@' || name === '*') return this.env['__ARGV__'] ?? '';
      if (/^[0-9]$/.test(name)) return this.env['__POS' + name] ?? '';
      return this.env[name] ?? '';
    });
    if (result.indexOf(DOLLAR_ESCAPE) === -1) return result;
    return result.split(DOLLAR_ESCAPE).join('$');
  }
}
