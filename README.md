# LinuxLab — Linux Fundamentals Through Cloud & DevOps https://linuxlearny.netlify.app/

A split-screen Linux learning platform: a simulated Ubuntu terminal on the
left, guided theory/hints on the right. Everything runs client-side in the
browser — no real Linux, no server, no accounts, negligible CPU use.

All lessons live in a single flat list (`src/content/lessons.ts`) tagged by
module and lesson number (e.g. `2.4`); the theory panel groups them into a
module dropdown plus Prev/Next navigation automatically — adding a module is
just adding more lesson objects to that one array, never a new file.

Currently covered:

- **Module 1 — Linux Fundamentals** (18 lessons): history & distributions,
  installing Linux, terminal basics, shell navigation, the filesystem
  hierarchy, permissions, users & groups, package management (apt),
  environment variables, bash scripting basics, and text processing
  (pipes, redirection, grep, sort/uniq, wc, head/tail, cut, sed, find).
- **Module 2 — Linux Administration** (13 lessons): systemd & services,
  process management, cron, SSH, kernel basics, storage (df/du/mount/lsblk),
  LVM, RAID, swap, boot & GRUB, log management, performance monitoring, and
  a capstone that ties them together.
- **Module 3 — Linux Networking** (15 lessons): TCP/IP, DNS, DHCP, routing,
  NAT, VPN, iptables, nftables, network namespaces, VLANs, ping/traceroute,
  netcat/nmap, tcpdump, ss/netstat/ip/arp, and a capstone.
- **Module 4 — Bash Scripting** (8 lessons): variables & quoting,
  conditionals (if/elif/else/fi), comparison operators (`test`/`[ ]`), for
  loops, while loops & exit codes (`$?`), functions, positional parameters
  (`$1`, `$#`, `$@`), and a capstone where you build a script from scratch
  using only `echo` + redirection.
- **Module 5 — Archiving, Compression & Transfer** (8 lessons): `tar`
  create/list/extract, `gzip`/`gunzip`, `zip`/`unzip`, syncing with `rsync`,
  remote copies with `scp`, and a capstone that backs up and ships a
  project to a simulated remote host.
- **Module 6 — Advanced Permissions & Filesystem** (8 lessons): symbolic
  and hard links (`ln`), `umask` and default permissions, setuid/setgid/
  sticky bits, disk partitioning (`fdisk`/`parted`), formatting filesystems
  (`mkfs`), auditing permissions across a tree, and a capstone that
  provisions a new data volume end to end.
- **Module 7 — Hardening & Access Control** (8 lessons): `sudo` and least
  privilege, firewalling with `ufw`, brute-force protection with
  `fail2ban-client`, password aging (`chage`), file-integrity watches
  (`auditctl`/`ausearch`), an incident-response scenario, and a server
  hardening capstone.
- **Module 8 — Web & Network Recon** (8 lessons): `curl` (including
  headers-only requests), downloading with `wget`, domain lookups with
  `whois`, directory brute-forcing with `gobuster`, vulnerability scanning
  with `nikto`, combining tools into a recon workflow, and a capstone that
  produces a full written recon report.
- **Module 9 — Version Control with Git** (15 lessons): `git init`, staging
  & committing, `.gitignore`, `git diff`, branching & merging (including a
  real simulated merge conflict and resolution), `git stash`, remotes &
  `git clone`, `push`/`pull`, and a capstone that runs the full
  init-branch-commit-merge workflow on a new project.
- **Module 10 — Containers with Docker** (15 lessons): images (`pull`,
  `images`), running containers (`run`, `-d`, `--name`, one-off vs.
  long-running), lifecycle (`stop`/`start`/`rm`), `logs`/`exec`, port
  mapping, image removal, volumes, networks, writing a `Dockerfile` and
  `docker build`, and a `docker-compose` multi-container capstone.
- **Module 11 — Shell Productivity & Troubleshooting** (15 lessons):
  aliases, `~/.bashrc` & `source`, custom `PS1` prompts, history expansion
  (`!!`, `!n`), `xargs`, `which`/`type`/`command -v`, `watch`, `strace`,
  `lsof`, `tmux` sessions & windows, combining tools into one-liners, and a
  troubleshooting-scenario capstone.
- **Module 12 — Cloud & Infrastructure Basics** (15 lessons): a simulated
  AWS-style CLI (`aws ec2`/`aws s3`, security groups), Infrastructure as
  Code with a simplified `infra.yaml` (`infra plan`/`apply`/`destroy`),
  cost-awareness habits, and a capstone that provisions a small web stack
  (instance + security group + bucket) declaratively.
- **Module 13 — OSINT (Open Source Intelligence)** (10 lessons): passive
  vs. active recon, Google-dork-style search operators (`dork`), passive
  subdomain enumeration (`subfinder`), DNS mail/TXT recon (`dig ... MX/TXT`),
  email harvesting (`theharvester`), username recon across social platforms
  (`sherlock`), image/document metadata (`exiftool`), internet-wide device
  search (`shodan`), archived-URL discovery (`waybackurls`), and a capstone
  that runs a full passive investigation against a fictional target company
  and writes up the findings.
- **Module 14 — GEOINT / Geolocation Intelligence** (8 lessons): visual clue
  analysis (`imageanalyze`), reverse image search (`imgsearch`), landmark/
  satellite correlation (`mapsearch`), shadow/sun-angle time estimation, and
  a capstone that fully geolocates a metadata-stripped photo with a rated
  confidence level.
- **Module 15 — Corporate & Business Intelligence** (8 lessons): company
  registry lookups (`corpreg`), mining job postings for tech-stack intel
  (`jobscrape`), org-chart mapping (`orgchart`), news/M&A tracking
  (`biznews`), subsidiary mapping (`subsidiaries`), and a capstone corporate
  intelligence report.
- **Module 16 — Breach & Credential Intelligence** (8 lessons): breach
  lookups (`hibp`), credential-dump/hash-reuse detection (`credsearch`,
  `passpattern`), paste-site monitoring (`pastesearch`), dark-web mention
  monitoring (`darkmentions`), and a capstone breach-exposure assessment
  with a prioritized remediation plan.
- **Module 17 — Social Media & Network Analysis (SOCMINT)** (8 lessons):
  social-graph mapping (`socialgraph`), posting-pattern/timezone analysis
  (`postpattern`), hashtag/campaign tracking (`hashtag`), sentiment and
  inauthentic-activity detection (`sentiment`), and a capstone SOCMINT
  profile.
- **Module 18 — Dark Web & Deep Web Basics** (8 lessons): connecting to Tor
  (`tor`), onion-site search and fetch (`onionsearch`, `onioncurl`), forum
  and marketplace monitoring (`forummonitor`, `marketmonitor`), verifying
  unreliable claims, and a capstone dark-web threat-monitoring report.
- **Module 19 — Threat Intelligence & Actor Tracking** (8 lessons): IOC
  lookups (`vtcheck`), MITRE ATT&CK technique mapping (`attckmap`), threat
  actor profiling (`actorprofile`), passive-DNS infrastructure pivoting
  (`passivedns`), feed aggregation (`threatfeed`), turning findings into
  firewall blocks and employee alerts, and a capstone assessment.
- **Module 20 — People Search & Public Records** (8 lessons): public-records
  aggregation (`pubrecords`), phone/carrier lookup (`phonelookup`), reverse
  lookup (`reverselookup`), address history (`addresshistory`), aggregated
  data-broker profiles (`databroker`) and the opt-out problem, confidence
  rating, and a capstone under an explicit authorized-assessment scope.
- **Module 21 — Counter-OSINT & OPSEC** (8 lessons): auditing your own
  footprint (`selfaudit`), metadata scrubbing (`metadatascrub`), locking
  down social privacy settings (`privacycheck`/`privacyset`), sock-puppet
  hygiene (`sockpuppet`), and a capstone hardening pass with a before/after
  audit.
- **Module 22 — OSINT Automation & Frameworks** (8 lessons): a modular
  recon framework (`reconng`), entity/relationship graphing (`linkgraph`),
  scripting a recon pipeline with bash, API rate-limit etiquette, and a
  capstone that combines all three automation patterns.
- **Module 23 — Mega-Capstone: Full-Scope Investigation** (4 lessons):
  writing a scope/rules-of-engagement document, a full breadth-first sweep
  across every OSINT discipline from Modules 13-21, synthesizing a
  prioritized executive summary, and a final capstone that assembles
  everything into one complete, professional investigation report.
- **Module 24 — Enumeration Fundamentals** (8 lessons): picks the Module 8
  webserver01.lab engagement back up and digs deeper — service/version
  fingerprinting (`whatweb`), SMB share and user enumeration
  (`enum4linux`), SNMP enumeration (`snmpwalk`), extracting a leaked
  admin credential from the previously-found `backup.zip`, looking up a
  matching known-vulnerability advisory (`searchsploit`), and a capstone
  enumeration report.
- **Module 25 — Initial Access Fundamentals** (8 lessons): validating a
  leaked credential against a live service (`hydra`), establishing a
  foothold with `ssh`, capturing proof of access, reviewing an
  auto-logged MITRE ATT&CK technique trail (`attcklog`), closing a
  session cleanly, and a capstone that documents the full entry vector
  for a pentest report. Completes a dormant MITRE ATT&CK-mapped
  "red team" state machine (foothold/credential/technique tracking) that
  already existed in `state.ts`/`commands.ts` but had no lessons wired
  up to it yet.

248 lessons total, each with theory, hints, suggested commands, and an
auto-checked challenge. Scripts support real control flow: if/elif/else,
for/while loops, functions, arithmetic expansion (`$((expr))`), and exit
codes — not just a flat list of commands. Git, Docker, and the cloud/IaC
modules maintain their own realistic (if simplified) simulated state, so
branching, merging, container lifecycles, and provisioning all behave
consistently across lessons rather than just printing canned text.

## Quickest way to try it (no install needed)

A pre-built copy is in `dist/`, but it was built from the original
Module-1-only source — run `npm run build` (see below) to refresh it with
the current content before serving it. You can't open `dist/index.html`
directly by double-clicking (browsers block ES module imports from `file://`
URLs), but any lightweight local server works:

```
cd dist
python3 -m http.server 8080
```

Then open http://localhost:8080 in your browser. If you have Node installed,
`npx serve dist` works too.

## Developing / editing the source

The real source lives in `src/` as TypeScript. To make changes and rebuild:

```
npm install
npm run dev       # live dev server with hot reload
npm run build     # produces an updated dist/
npm run typecheck # type-check without emitting
```

Note: if `node_modules` is already present and `npm install`/`npm run build`
fail with an `ENOTEMPTY` or similar error, delete `node_modules` and
`package-lock.json` and reinstall fresh — a partial install can be left
over from testing.

## What's simulated vs. real

Every command (`ls`, `cd`, `chmod`, `apt install`, `systemctl`, `ip`,
`iptables`, `nmap`, `tar`, `sudo`, `ufw`, `curl`, `gobuster`, `git`,
`docker`, `aws`, `infra`, `dork`, `subfinder`, `theharvester`, `sherlock`,
`exiftool`, `shodan`, `waybackurls`, `imageanalyze`, `imgsearch`, `mapsearch`,
`corpreg`, `jobscrape`, `orgchart`, `biznews`, `subsidiaries`, `hibp`,
`credsearch`, `passpattern`, `pastesearch`, `darkmentions`, `socialgraph`,
`postpattern`, `hashtag`, `sentiment`, `tor`, `onionsearch`, `onioncurl`,
`forummonitor`, `marketmonitor`, `vtcheck`, `attckmap`, `actorprofile`,
`passivedns`, `threatfeed`, `pubrecords`, `phonelookup`, `reverselookup`,
`addresshistory`, `databroker`, `selfaudit`, `metadatascrub`, `privacycheck`,
`privacyset`, `sockpuppet`, `reconng`, `linkgraph`, `enum4linux`, `whatweb`,
`snmpwalk`, `searchsploit`, `hydra`, `attcklog`, etc.) operates on an in-memory fake filesystem,
package database, process table, small fake LAN (fixed hosts, DNS zone, ARP
table, one simulated web host at `webserver01.lab`), a simulated git object
model, a simulated Docker image/container registry, and a simulated cloud
account (EC2-style instances, S3-style buckets, security groups) — nothing
touches your actual computer, a real Linux/network system, a real Docker
daemon, or a real cloud account. This keeps things fast, safe, and
CPU-light. Modules covering real exploitation, kernel work, forensics, or
production cloud infrastructure would need actual sandboxed VMs/containers
or real cloud credentials — a different, heavier architecture than this
one.
live link https://linuxlearny.netlify.app/
## Project layout

```
src/
  vfs.ts            virtual filesystem model + initial directory tree
  state.ts           shell state: cwd, users, env, packages, services,
                     processes, cron, LVM/RAID, swap, journal, network
                     interfaces/routes/DNS/ARP/firewall/VLANs/VPN
  commands.ts        every command implementation, one flat registry
  parser.ts          tokenizer + pipes (|) + redirection (>, >>) +
                      command dispatch + bash script runner
  terminalApp.ts     xterm.js wrapper (input handling, prompt, history)
  theoryPanel.ts      right-hand lesson panel: module dropdown, hints,
                      challenge checker
  content/
    lessons.ts        every lesson across every module, one flat array
    types.ts            lesson content types
  main.ts                wires everything together
```

Adding a new module means appending more lesson objects to the `lessons`
array in `content/lessons.ts` (tagged `N.x`) and, where new commands are
needed, adding them to `commands.ts` and any new state to `state.ts` — all
in these same files, never new ones. The terminal, UI, and lesson-checking
engine are already built to scale this way.
