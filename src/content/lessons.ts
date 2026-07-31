import { Lesson } from './types';
import { getNode } from '../vfs';

function historyIncludes(state: any, matcher: (line: string) => boolean): boolean {
  return state.history.some((h: string) => matcher(h.trim()));
}

export const lessons: Lesson[] = [
  {
    id: 'history-distros',
    tag: '1.1',
    title: 'Linux History & Distributions',
    theory: [
      'Linux began in 1991 when Linus Torvalds released a free kernel as a hobby project. Combined with the GNU tools started by Richard Stallman in the 1980s, it grew into a full operating system now known as GNU/Linux.',
      'A "distribution" (distro) bundles the Linux kernel with system tools, package managers, and a default set of software. Different distros target different needs: Ubuntu and Debian favor stability and ease of use, while Kali Linux and Parrot OS are purpose-built for penetration testing and security work.',
      'Debian is the base many distros build on — Ubuntu itself is derived from Debian, and Kali is derived from Debian too. Understanding Debian package management (APT, .deb files) transfers directly across all three.'
    ],
    bullets: [
      'Ubuntu — general purpose, beginner friendly, huge community',
      'Debian — the stable upstream base, prized for reliability',
      'Kali Linux — Debian-based, preloaded with security/pentest tooling'
    ],
    commands: [
      { cmd: 'uname -a', desc: 'Show kernel name, version, and architecture' },
      { cmd: 'lsb_release -a', desc: 'Show distribution name, version, and codename' }
    ],
    hints: [
      'Try running "uname -a" first to see the kernel info.',
      '"lsb_release -a" shows which distribution and version this system identifies as.'
    ],
    challenge: {
      prompt: 'Run "lsb_release -a" to identify which distribution this lab environment reports itself as.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('lsb_release'))
    }
  },
  {
    id: 'installing-linux',
    tag: '1.2',
    title: 'Installing Linux',
    theory: [
      'Linux can be installed directly on a physical machine (bare metal), alongside an existing OS as a dual boot, or inside a virtual machine (VM) using software like VirtualBox or VMware. VMs are the safest way to practice — mistakes cost nothing since the whole system is a disposable file.',
      'A typical install involves creating bootable media (USB written with a tool like Rufus or Balena Etcher), booting from it, partitioning disk space, and choosing a filesystem (most modern distros default to ext4).',
      'For security and pentesting distros like Kali, most learners run it inside a VM rather than bare metal, so it can be reset instantly after risky experiments.'
    ],
    bullets: [
      'Bare metal — full performance, but higher risk of misconfiguration',
      'Dual boot — Linux + existing OS side by side, needs careful partitioning',
      'Virtual machine — safest, snapshot/rollback friendly, ideal for learning'
    ],
    commands: [
      { cmd: 'uname -a', desc: 'Confirm the kernel of the system you ended up with' }
    ],
    hints: [
      'This simulated lab stands in for a freshly installed VM — try confirming its kernel with "uname -a".',
      'In a real install, you would verify success the same way: check the kernel and distro info right after first boot.'
    ],
    challenge: {
      prompt: 'Confirm the "installed" system by running "uname -a".',
      check: (state) => historyIncludes(state, (l) => l.startsWith('uname'))
    }
  },
  {
    id: 'terminal-basics',
    tag: '1.3',
    title: 'Terminal Basics',
    theory: [
      'The terminal is a text interface to the shell — the program that reads and executes your commands. Bash (Bourne Again Shell) is the default shell on Ubuntu, Debian, and Kali.',
      'Every session starts with a prompt showing your username, hostname, and current directory, followed by "$" (regular user) or "#" (root). Commands are typed and run with Enter.',
      'Two commands you will use constantly: "whoami" tells you which user you are logged in as, and "pwd" (print working directory) tells you where you are in the filesystem.'
    ],
    commands: [
      { cmd: 'whoami', desc: 'Print the current logged-in user' },
      { cmd: 'pwd', desc: 'Print the current working directory' },
      { cmd: 'clear', desc: 'Clear the terminal screen' },
      { cmd: 'help', desc: 'List commands available in this lab' }
    ],
    hints: [
      'Type "whoami" and press Enter.',
      'Then type "pwd" to see your current directory.'
    ],
    challenge: {
      prompt: 'Run both "whoami" and "pwd" in the terminal.',
      check: (state) =>
        historyIncludes(state, (l) => l === 'whoami') && historyIncludes(state, (l) => l === 'pwd')
    }
  },
  {
    id: 'shell-navigation',
    tag: '1.4',
    title: 'Shell Navigation',
    theory: [
      'You move around the filesystem with "cd" (change directory) and inspect contents with "ls" (list). "cd .." moves up one level, "cd ~" or plain "cd" returns home, and "cd /" jumps to the filesystem root.',
      'Paths can be absolute (starting with "/", e.g. /home/student/projects) or relative (based on where you currently are, e.g. ../notes.txt).',
      'Add flags to "ls" for more detail: "-l" for a long listing (permissions, owner, size) and "-a" to include hidden files.'
    ],
    commands: [
      { cmd: 'ls', desc: 'List the current directory' },
      { cmd: 'cd projects', desc: 'Move into the projects folder' },
      { cmd: 'cd ..', desc: 'Move up one directory level' },
      { cmd: 'ls -l', desc: 'Long listing with permissions and owner' }
    ],
    hints: [
      'From your home directory, run "ls" to see what is there.',
      'You should see a "projects" folder — move into it with "cd projects".'
    ],
    challenge: {
      prompt: 'Navigate into /home/student/projects using cd.',
      check: (state) => state.cwd.join('/') === 'home/student/projects'
    }
  },
  {
    id: 'fs-hierarchy',
    tag: '1.5',
    title: 'File System Hierarchy',
    theory: [
      'Linux organizes everything under a single root directory "/" — there are no drive letters like C:\\. Every disk, partition, or device gets mounted somewhere inside this one tree.',
      'Key directories: /bin and /usr/bin hold programs, /etc holds system configuration, /home holds user data, /var holds logs and variable data, /tmp is for temporary files, and /root is the root user\'s home directory.',
      'This standard layout is called the Filesystem Hierarchy Standard (FHS), and it is consistent enough that skills transfer directly between Ubuntu, Debian, and Kali.'
    ],
    bullets: [
      '/etc — configuration files',
      '/home — user home directories',
      '/var/log — system and application logs',
      '/tmp — temporary, world-writable scratch space'
    ],
    commands: [
      { cmd: 'ls /', desc: 'List the top-level filesystem layout' },
      { cmd: 'cat /etc/os-release', desc: 'Read distro info stored in /etc' }
    ],
    hints: [
      'Run "ls /" to see the top-level directories.',
      'Then try "cat /etc/os-release" to read a real config file.'
    ],
    challenge: {
      prompt: 'Read the contents of /etc/os-release with cat.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('cat') && l.includes('os-release'))
    }
  },
  {
    id: 'permissions',
    tag: '1.6',
    title: 'Permissions',
    theory: [
      'Every file and directory has an owner, a group, and a permission set for three categories: the owner (u), the group (g), and everyone else (o). Each category can have read (r), write (w), and execute (x).',
      'Long listings show this as a 10-character string like "-rw-r--r--" — the first character is the type (- for file, d for directory), then three groups of rwx for owner/group/other.',
      'You change permissions with "chmod", either numerically (e.g. 644 = rw-r--r--, 755 = rwxr-xr-x) or symbolically (e.g. "u+x" adds execute for the owner).'
    ],
    commands: [
      { cmd: 'ls -l notes.txt', desc: 'See current permissions on a file' },
      { cmd: 'chmod 644 notes.txt', desc: 'Set permissions numerically' },
      { cmd: 'chmod u+x scripts/hello.sh', desc: 'Add execute permission symbolically' }
    ],
    hints: [
      'Run "ls -l notes.txt" to see its current permission string.',
      'Numeric mode 644 means owner=read/write, group=read, other=read.'
    ],
    challenge: {
      prompt: 'Set the permissions of ~/notes.txt to 644 using chmod.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'notes.txt']);
        return !!node && node.perms === 'rw-r--r--';
      }
    }
  },
  {
    id: 'users-groups',
    tag: '1.7',
    title: 'Users & Groups',
    theory: [
      'Linux is multi-user by design. Every process runs as some user, and every user belongs to at least one group, which is a convenient way to grant the same permissions to many accounts at once.',
      'The "root" account is the superuser with unrestricted access — day-to-day work should happen as a normal user, escalating with "sudo" only when needed.',
      '"useradd" creates new accounts, "passwd" sets or changes a password, and "id" or "groups" show a user\'s identity and group memberships.'
    ],
    commands: [
      { cmd: 'id', desc: "Show your own uid, gid, and groups" },
      { cmd: 'useradd -m alex', desc: 'Create a new user with a home directory' },
      { cmd: 'passwd alex', desc: "Set alex's password" },
      { cmd: 'groups alex', desc: "List alex's group memberships" }
    ],
    hints: [
      'Run "id" first to see your own account details.',
      'Create a new account with "useradd -m alex".'
    ],
    challenge: {
      prompt: 'Create a new user named "alex" with useradd.',
      check: (state) => !!state.users['alex']
    }
  },
  {
    id: 'package-management',
    tag: '1.8',
    title: 'Package Management',
    theory: [
      'Ubuntu, Debian, and Kali all use the APT package manager (built on .deb packages). "apt update" refreshes the list of available packages, "apt install <name>" installs one, and "apt remove <name>" uninstalls it.',
      'Under the hood, APT is a friendly wrapper around "dpkg", the lower-level tool that actually unpacks and configures .deb files.',
      'Kali\'s enormous security toolset — Nmap, Metasploit, Hydra, and hundreds more — is delivered the exact same way, via APT repositories.'
    ],
    commands: [
      { cmd: 'apt update', desc: 'Refresh the package index' },
      { cmd: 'apt install nmap', desc: 'Install a package' },
      { cmd: 'apt list --installed', desc: 'List installed packages' }
    ],
    hints: [
      'Run "apt update" first, as you would on a real system.',
      'Then install a real security tool: "apt install nmap".'
    ],
    challenge: {
      prompt: 'Install the "nmap" package using apt.',
      check: (state) => state.installedPackages.has('nmap')
    }
  },
  {
    id: 'env-vars',
    tag: '1.9',
    title: 'Environment Variables',
    theory: [
      'Environment variables store configuration values available to your shell and the programs it launches — things like $HOME (your home directory), $USER (your username), and $PATH (the list of directories the shell searches for commands).',
      '"export VAR=value" creates or updates a variable and makes it available to child processes. Reference a variable\'s value with a "$" prefix, e.g. "echo $HOME".',
      '"$PATH" is why you can type "ls" instead of "/bin/ls" — the shell checks each directory listed in PATH until it finds a matching executable.'
    ],
    commands: [
      { cmd: 'echo $HOME', desc: 'Print the value of an existing variable' },
      { cmd: 'export MY_NAME=alex', desc: 'Create your own variable' },
      { cmd: 'echo $MY_NAME', desc: 'Print your custom variable' },
      { cmd: 'env', desc: 'List all environment variables' }
    ],
    hints: [
      'Try "echo $HOME" and "echo $PATH" to see built-in variables.',
      'Create your own with "export MY_NAME=yourname", then print it with "echo $MY_NAME".'
    ],
    challenge: {
      prompt: 'Export a variable named MY_NAME and print it with echo.',
      check: (state) =>
        state.env['MY_NAME'] !== undefined &&
        historyIncludes(state, (l) => l.startsWith('echo') && l.includes('$MY_NAME'))
    }
  },
  {
    id: 'bash-scripting-basics',
    tag: '1.10',
    title: 'Bash Scripting Basics',
    theory: [
      'A shell script is just a text file of commands run in sequence — the same commands you type interactively, saved so they can be replayed automatically. This lab includes a starter script at ~/scripts/hello.sh.',
      'Scripts commonly start with a comment describing their purpose (lines beginning with "#" are ignored), followed by variable assignments and commands that reference them.',
      'Run a script by passing it to the interpreter: "bash script.sh". Deeper scripting — loops, conditionals, functions, error handling — is covered in the dedicated Bash Programming module.'
    ],
    commands: [
      { cmd: 'cat scripts/hello.sh', desc: 'Read the script before running it — always a good habit' },
      { cmd: 'bash scripts/hello.sh', desc: 'Execute the script' }
    ],
    hints: [
      'First read the script with "cat scripts/hello.sh" to see what it will do.',
      'Then run it with "bash scripts/hello.sh".'
    ],
    challenge: {
      prompt: 'Run ~/scripts/hello.sh with bash.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('bash') && l.includes('hello.sh'))
    }
  },
  {
    id: 'pipes-redirection',
    tag: '1.11',
    title: 'Pipes & Redirection',
    theory: [
      'A pipe ("|") connects the output of one command directly to the input of the next, letting you chain small tools into a bigger one. "cmd1 | cmd2" means "run cmd1, then feed its output into cmd2" instead of printing it to the screen.',
      'Redirection sends output to a file instead of the screen: ">" overwrites the file (creating it if needed), while ">>" appends to the end without erasing existing content.',
      'This lab supports both: try "ls -l | grep student" to filter a listing, or "echo hello > greeting.txt" to save output to a file.'
    ],
    bullets: [
      '| — pipe, chains commands together',
      '> — redirect output to a file, overwriting it',
      '>> — redirect output to a file, appending to it'
    ],
    commands: [
      { cmd: 'ls -l | grep student', desc: 'Filter a directory listing for lines containing "student"' },
      { cmd: 'echo hello > greeting.txt', desc: 'Write text into a new file' },
      { cmd: 'cat greeting.txt', desc: 'Confirm the file was written' }
    ],
    hints: [
      'Try "echo hello > greeting.txt" then "cat greeting.txt" to see redirection in action.',
      'Try "ls -l | grep student" to see a pipe filter a listing.'
    ],
    challenge: {
      prompt: 'Use ">" to write "hello" into a file named greeting.txt, in your home directory.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'greeting.txt']);
        return !!node && node.type === 'file' && node.content.includes('hello');
      }
    }
  },
  {
    id: 'grep-basics',
    tag: '1.12',
    title: 'grep — Searching Text',
    theory: [
      '"grep" searches text for lines matching a pattern and prints only those lines. It is one of the most-used tools in Linux — for reading logs, filtering command output, or scanning source code.',
      'Common flags: "-i" makes the search case-insensitive, "-v" inverts the match (show lines that do NOT match), and "-n" prefixes each match with its line number.',
      'grep accepts patterns as basic regular expressions, so it can do more than plain text matching — but plain words are the most common use case.'
    ],
    commands: [
      { cmd: 'grep ERROR projects/access.log', desc: 'Find all ERROR lines in a log file' },
      { cmd: 'grep -i error projects/access.log', desc: 'Case-insensitive search' },
      { cmd: 'grep -v INFO projects/access.log', desc: 'Show only lines that are NOT INFO' }
    ],
    hints: [
      'Try "grep ERROR projects/access.log" to find every error entry.',
      'grep also reads from a pipe: try "cat projects/access.log | grep WARN".'
    ],
    challenge: {
      prompt: 'Use grep to find every "ERROR" line in projects/access.log.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('grep') && l.includes('ERROR') && l.includes('access.log'))
    }
  },
  {
    id: 'sort-uniq',
    tag: '1.13',
    title: 'sort & uniq',
    theory: [
      '"sort" arranges lines alphabetically by default; add "-n" for numeric order and "-r" to reverse the order.',
      '"uniq" collapses consecutive duplicate lines into one — which is why it is almost always used right after "sort" ("sort file | uniq"), since sort guarantees duplicates end up next to each other.',
      '"uniq -c" counts how many times each line occurred, which is a fast way to build a frequency table straight from the command line.'
    ],
    commands: [
      { cmd: 'sort projects/inventory.csv', desc: 'Sort the file alphabetically' },
      { cmd: 'cut -d, -f2 projects/inventory.csv | sort | uniq -c', desc: 'Count how many items exist per category' }
    ],
    hints: [
      'Try "sort projects/inventory.csv" first to see plain alphabetical order.',
      'Pipe grep\'s output into sort and uniq -c to count repeated lines.'
    ],
    challenge: {
      prompt: 'Run a command that pipes output into "sort" (e.g. "cat projects/inventory.csv | sort").',
      check: (state) => historyIncludes(state, (l) => l.includes('|') && l.includes('sort'))
    }
  },
  {
    id: 'wc-basics',
    tag: '1.14',
    title: 'wc — Counting Lines, Words, Bytes',
    theory: [
      '"wc" (word count) reports the number of lines, words, and characters in its input — either a file or piped stdin.',
      '"wc -l" alone is extremely common: it is the fastest way to count how many lines (e.g. log entries, matches, users) something has.',
      'Combine it with grep to count matches: "grep ERROR access.log | wc -l" tells you exactly how many errors were logged, without reading the whole file.'
    ],
    commands: [
      { cmd: 'wc projects/access.log', desc: 'Show lines, words, and characters' },
      { cmd: 'wc -l projects/access.log', desc: 'Show only the line count' },
      { cmd: 'grep ERROR projects/access.log | wc -l', desc: 'Count how many ERROR lines exist' }
    ],
    hints: [
      'Run "wc -l projects/access.log" to count its lines.',
      'Chain grep and wc -l together to count matching lines specifically.'
    ],
    challenge: {
      prompt: 'Count how many ERROR lines are in projects/access.log using grep piped into "wc -l".',
      check: (state) => historyIncludes(state, (l) => l.includes('grep') && l.includes('wc'))
    }
  },
  {
    id: 'head-tail',
    tag: '1.15',
    title: 'head & tail',
    theory: [
      '"head" prints the first lines of a file (10 by default); "tail" prints the last lines. Both accept "-n N" to control exactly how many lines to show.',
      '"tail" is especially useful for logs, since the newest entries are usually appended at the end — "tail -n 20 /var/log/syslog" shows the 20 most recent events.',
      'Both commands also read from a pipe, so you can chain them after grep or sort to look at just the top or bottom of filtered results.'
    ],
    commands: [
      { cmd: 'head -n 3 projects/access.log', desc: 'Show the first 3 lines' },
      { cmd: 'tail -n 3 projects/access.log', desc: 'Show the last 3 lines' }
    ],
    hints: [
      'Try "head -n 3 projects/access.log" to see the earliest entries.',
      'Try "tail -n 3 projects/access.log" to see the most recent entries.'
    ],
    challenge: {
      prompt: 'Show the last 3 lines of projects/access.log using "tail -n 3".',
      check: (state) => historyIncludes(state, (l) => l.startsWith('tail') && l.includes('access.log'))
    }
  },
  {
    id: 'cut-basics',
    tag: '1.16',
    title: 'cut — Extracting Columns',
    theory: [
      '"cut" pulls out specific columns (fields) from delimited text, such as CSV data or /etc/passwd entries. Use "-d" to set the delimiter and "-f" to choose which field(s) to keep.',
      'For example, "cut -d, -f1 file.csv" prints only the first comma-separated column of each line.',
      '"cut" is intentionally simple — for more complex column transformations, tools like "awk" are used, but cut covers the majority of everyday cases.'
    ],
    commands: [
      { cmd: 'cut -d, -f1 projects/inventory.csv', desc: 'Print only the first column (name)' },
      { cmd: 'cut -d, -f1,3 projects/inventory.csv', desc: 'Print the name and quantity columns' }
    ],
    hints: [
      'The inventory file is comma-separated, so use "-d,".',
      'Try "cut -d, -f1 projects/inventory.csv" to isolate the name column.'
    ],
    challenge: {
      prompt: 'Use cut with "-d," to extract a column from projects/inventory.csv.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('cut') && l.includes('-d,') && l.includes('inventory.csv'))
    }
  },
  {
    id: 'sed-basics',
    tag: '1.17',
    title: 'sed — Stream Editing',
    theory: [
      '"sed" edits text as it streams through, without opening a file in an editor. Its most common form is substitution: "sed \'s/old/new/\'" replaces the first match of "old" with "new" on each line.',
      'Add a trailing "g" — "s/old/new/g" — to replace every match on the line, not just the first one.',
      'sed is a cornerstone of shell scripting for quick find-and-replace across log output, config files, or piped text, without needing a full text editor.'
    ],
    commands: [
      { cmd: "sed 's/ERROR/FAILURE/' projects/access.log", desc: 'Replace the first "ERROR" per line with "FAILURE"' },
      { cmd: "grep ERROR projects/access.log | sed 's/ERROR/FAILURE/g'", desc: 'Filter then replace every match' }
    ],
    hints: [
      'sed expressions look like "s/pattern/replacement/".',
      'Try "sed \'s/ERROR/FAILURE/\' projects/access.log" to see substitution in action.'
    ],
    challenge: {
      prompt: 'Use sed with an "s/.../.../" expression on projects/access.log.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('sed') && l.includes('s/') && l.includes('access.log'))
    }
  },
  {
    id: 'find-basics',
    tag: '1.18',
    title: 'find — Locating Files',
    theory: [
      '"find" searches a directory tree for files matching criteria, unlike "ls" which only lists what is already known. "find <path> -name <pattern>" searches by filename, supporting "*" as a wildcard.',
      '"-type f" restricts results to regular files, and "-type d" restricts results to directories only.',
      'find is especially useful once a filesystem has hundreds of nested folders — exactly the situation where scrolling through "ls" output stops being practical.'
    ],
    commands: [
      { cmd: 'find . -name "*.log"', desc: 'Find all .log files under the current directory' },
      { cmd: 'find /home -type d', desc: 'Find every directory under /home' }
    ],
    hints: [
      'Run "find . -name "*.log"" from your home directory to locate access.log.',
      'Wildcards ("*") work in the -name pattern, just like in real find.'
    ],
    challenge: {
      prompt: 'Use find with "-name" to locate a file matching "*.log".',
      check: (state) => historyIncludes(state, (l) => l.startsWith('find') && l.includes('-name'))
    }
  },
  {
    id: 'systemd-services',
    tag: '2.1',
    title: 'Systemd & Service Management',
    theory: [
      'systemd is the init system on Ubuntu, Debian, and Kali — it is the first process to run (PID 1) and is responsible for starting every other service in a defined order, restarting ones that crash, and tracking dependencies between them.',
      'Every managed service is described by a "unit file" (e.g. /lib/systemd/system/nginx.service). You rarely edit these directly for common tasks — instead you control them with "systemctl".',
      '"systemctl start/stop/restart" controls a service right now; "systemctl enable/disable" controls whether it starts automatically at boot. These are independent — a service can be running now but not enabled, or enabled but currently stopped.'
    ],
    commands: [
      { cmd: 'systemctl status ssh', desc: 'Check whether the SSH service is running' },
      { cmd: 'systemctl start ssh', desc: 'Start it now' },
      { cmd: 'systemctl enable ssh', desc: 'Make it start automatically on boot' },
      { cmd: 'systemctl list-units', desc: 'See every known service and its state' }
    ],
    hints: [
      'Check the current state first with "systemctl status ssh".',
      'Then run "systemctl start ssh" followed by "systemctl enable ssh".'
    ],
    challenge: {
      prompt: 'Start and enable the ssh service.',
      check: (state) => !!state.services['ssh']?.active && !!state.services['ssh']?.enabled
    }
  },
  {
    id: 'process-management',
    tag: '2.2',
    title: 'Process Management',
    theory: [
      'Every running program is a process with a unique PID (process ID). "ps aux" gives you a snapshot of every process on the system; "top" gives you a live, continuously updating view (this lab shows a single snapshot).',
      'Processes can be terminated with "kill <pid>", which sends a termination signal. If a process ignores it, "kill -9 <pid>" sends SIGKILL, which cannot be ignored.',
      'When you kill the process backing a systemd-managed service, systemd usually notices and marks the service as failed/inactive — exactly like it would on a real production box.'
    ],
    commands: [
      { cmd: 'ps aux', desc: 'List all running processes' },
      { cmd: 'top', desc: 'Live-style resource usage snapshot' },
      { cmd: 'kill <pid>', desc: 'Terminate a process by PID' }
    ],
    hints: [
      'Run "ps aux" and note the PID number in the left-hand PID column for any process.',
      'Terminate it with "kill <pid>", replacing <pid> with the actual number you saw.'
    ],
    challenge: {
      prompt: 'Run "ps aux" to see the process table, then kill any process by PID.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('ps')) && historyIncludes(state, (l) => l.startsWith('kill'))
    }
  },
  {
    id: 'cron-jobs',
    tag: '2.3',
    title: 'Cron Jobs & Task Scheduling',
    theory: [
      'cron runs commands automatically on a schedule. Each line in a crontab has five time fields — minute, hour, day-of-month, month, day-of-week — followed by the command to run. "0 2 * * *" means "at 2:00 AM every day."',
      'You rarely edit a live crontab from scratch; more often you prepare a file and install it with "crontab <file>". "crontab -l" lists what is currently scheduled for your user, and "crontab -r" clears it.',
      'A starter cron file is already sitting at ~/cron/backup.cron — read it before installing it, which is good practice before trusting any scheduled job with real commands.'
    ],
    commands: [
      { cmd: 'cat ~/cron/backup.cron', desc: 'Read the sample cron file before installing it' },
      { cmd: 'crontab ~/cron/backup.cron', desc: 'Install it as your crontab' },
      { cmd: 'crontab -l', desc: 'List what is currently scheduled' }
    ],
    hints: [
      'Look at the file first: "cat ~/cron/backup.cron".',
      'Install it with "crontab ~/cron/backup.cron", then confirm with "crontab -l".'
    ],
    challenge: {
      prompt: 'Install the sample crontab file so you have at least one scheduled job.',
      check: (state) => state.cronJobs.length > 0
    }
  },
  {
    id: 'ssh-remote-access',
    tag: '2.4',
    title: 'SSH & Remote Access',
    theory: [
      'SSH (Secure Shell) is how you administer remote Linux machines — nearly all cloud servers are managed exclusively over SSH. The "sshd" service must be running on the target machine before anyone can connect to it.',
      'Password authentication works but key-based authentication is strongly preferred in production: a public key sits on the server, the matching private key stays on your machine, and no password ever crosses the network.',
      'Once connected, your prompt changes to reflect the remote host — a constant visual reminder of which machine you are actually typing commands into. "exit" or "logout" ends the session and returns you home.'
    ],
    commands: [
      { cmd: 'systemctl start ssh', desc: 'Make sure the SSH service is running first' },
      { cmd: 'ssh student@webserver01', desc: 'Connect to a remote host' },
      { cmd: 'exit', desc: 'Close the SSH session' }
    ],
    hints: [
      'SSH needs something listening on the other end — start the service first if you have not already.',
      'Then connect with "ssh student@webserver01" (any hostname works in this simulation).'
    ],
    challenge: {
      prompt: 'Start the ssh service, then connect out with the ssh command.',
      check: (state) =>
        !!state.services['ssh']?.active && historyIncludes(state, (l) => l.startsWith('ssh '))
    }
  },
  {
    id: 'kernel-basics',
    tag: '2.5',
    title: 'Kernel Basics',
    theory: [
      'The kernel is the core of Linux — it manages memory, schedules which process gets CPU time, and talks to hardware through drivers. Everything else (systemd, bash, your applications) runs on top of it.',
      'Kernel functionality can be extended at runtime with loadable modules (drivers, filesystems, etc.) without rebooting. "lsmod" shows what is currently loaded.',
      '"dmesg" prints the kernel ring buffer — low-level boot and hardware messages, invaluable when diagnosing driver or hardware issues.'
    ],
    commands: [
      { cmd: 'uname -r', desc: 'Print just the kernel release version' },
      { cmd: 'lsmod', desc: 'List loaded kernel modules' },
      { cmd: 'dmesg', desc: 'View kernel ring buffer messages' }
    ],
    hints: [
      'Run "uname -r" to see the exact kernel version this lab simulates.',
      'Then browse loaded modules with "lsmod".'
    ],
    challenge: {
      prompt: 'Check the kernel release version with uname -r.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('uname') && l.includes('-r'))
    }
  },
  {
    id: 'storage-management',
    tag: '2.6',
    title: 'Storage Management',
    theory: [
      '"df -h" shows disk space usage per mounted filesystem in human-readable units. "du -sh <path>" shows how much space a specific directory tree actually consumes — useful for hunting down what is filling up a disk.',
      '"mount" (with no arguments) lists every currently mounted filesystem and its options. "lsblk" shows the underlying block devices — physical or virtual disks — and how they are partitioned.',
      'On a production server, keeping an eye on these three commands is often the fastest way to catch a disk filling up before it takes down a service.'
    ],
    commands: [
      { cmd: 'df -h', desc: 'Disk space per filesystem' },
      { cmd: 'du -sh /var/log', desc: 'Total size of a directory tree' },
      { cmd: 'mount', desc: 'List mounted filesystems' },
      { cmd: 'lsblk', desc: 'List block devices' }
    ],
    hints: [
      'Start with "df -h" for the big picture.',
      'Then check what is using an available raw disk with "lsblk".'
    ],
    challenge: {
      prompt: 'Check overall disk usage with df -h.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('df'))
    }
  },
  {
    id: 'lvm',
    tag: '2.7',
    title: 'LVM (Logical Volume Management)',
    theory: [
      'LVM adds a flexible layer between raw disks and filesystems. Physical Volumes (PVs) are raw disks or partitions; one or more PVs are pooled into a Volume Group (VG); Logical Volumes (LVs) are then carved out of that pool like virtual partitions.',
      'The payoff: you can grow an LV (and its filesystem) later by adding more storage to the VG, without the destructive repartitioning that raw disks would require.',
      'This lab exposes four unused disks — /dev/sdb through /dev/sde — for you to build an LVM stack on top of: pvcreate → vgcreate → lvcreate.'
    ],
    commands: [
      { cmd: 'pvcreate /dev/sdb', desc: 'Mark a raw disk as a physical volume' },
      { cmd: 'vgcreate vgdata /dev/sdb', desc: 'Create a volume group from one or more PVs' },
      { cmd: 'lvcreate -L 10G -n data vgdata', desc: 'Carve out a logical volume' },
      { cmd: 'pvs', desc: 'List physical volumes' },
      { cmd: 'vgs', desc: 'List volume groups' },
      { cmd: 'lvs', desc: 'List logical volumes' }
    ],
    hints: [
      'You must pvcreate a disk before vgcreate will accept it.',
      'Once the VG exists, "lvcreate -L 10G -n data vgdata" carves out a 10GB logical volume named "data".'
    ],
    challenge: {
      prompt: 'Build an LVM stack and end up with a logical volume named "data".',
      check: (state) => state.lvm.logicalVolumes.some((lv) => lv.name === 'data')
    }
  },
  {
    id: 'raid-fundamentals',
    tag: '2.8',
    title: 'RAID Fundamentals',
    theory: [
      'RAID combines multiple physical disks for redundancy, performance, or both. RAID 0 stripes data across disks for speed but offers zero redundancy — one disk failure loses everything. RAID 1 mirrors data across disks — full redundancy, half the usable capacity.',
      'RAID 5 stripes data with distributed parity, tolerating one disk failure while keeping more usable capacity than RAID 1. RAID 10 combines mirroring and striping for both speed and redundancy, at the cost of more disks.',
      '"mdadm" is the standard Linux tool for building and managing software RAID arrays.'
    ],
    bullets: [
      'RAID 0 — striping, speed, zero redundancy',
      'RAID 1 — mirroring, full redundancy, 50% capacity',
      'RAID 5 — striping + parity, survives one disk failure',
      'RAID 10 — mirrored stripes, fast and redundant, needs 4+ disks'
    ],
    commands: [
      { cmd: 'mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/sdc /dev/sdd', desc: 'Build a RAID 1 mirror' },
      { cmd: 'mdadm --detail /dev/md0', desc: 'Inspect the array' }
    ],
    hints: [
      'Pick two disks that are not already used by LVM (e.g. /dev/sdc and /dev/sdd).',
      'The device count in --raid-devices must match how many disks you actually list.'
    ],
    challenge: {
      prompt: 'Create a RAID 1 array from two disks with mdadm.',
      check: (state) => state.raidArrays.length > 0
    }
  },
  {
    id: 'swap-space',
    tag: '2.9',
    title: 'Swap Space',
    theory: [
      'Swap is disk space used as overflow when physical RAM is full — the kernel moves inactive memory pages there to free up RAM for active processes. It prevents out-of-memory crashes but is far slower than RAM.',
      'Heavy, sustained swap usage ("thrashing") is usually a sign a system needs more RAM, not more swap — swap is a safety net, not a performance feature.',
      '"free -h" shows current memory and swap usage. "swapon --show" (or "-s") lists active swap devices; "swapoff" disables one, "swapon" re-enables it.'
    ],
    commands: [
      { cmd: 'free -h', desc: 'Show memory and swap usage' },
      { cmd: 'swapon -s', desc: 'List active swap devices' },
      { cmd: 'swapoff /swapfile', desc: 'Disable swap' },
      { cmd: 'swapon /swapfile', desc: 'Re-enable swap' }
    ],
    hints: [
      'Check current usage first with "free -h".',
      'Try disabling swap with "swapoff /swapfile", then bring it back with "swapon /swapfile".'
    ],
    challenge: {
      prompt: 'Turn swap off and then back on again.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('swapoff')) && historyIncludes(state, (l) => l.startsWith('swapon') && !l.includes('-s') && !l.includes('--show'))
    }
  },
  {
    id: 'boot-grub',
    tag: '2.10',
    title: 'Boot Process & GRUB',
    theory: [
      'On boot, firmware (BIOS or UEFI) hands off to GRUB, the bootloader, which loads the Linux kernel and an initial ramdisk (initramfs) into memory. The kernel then starts systemd as PID 1, which brings up every other service.',
      'GRUB\'s configuration lives at /boot/grub/grub.cfg — it lists bootable kernels/OSes and lets you choose one (or pick a fallback if a kernel update breaks something).',
      '"systemd-analyze" shows how long boot took; "systemd-analyze blame" ranks services by how much boot time each one consumed — the first place to look when boot feels slow.'
    ],
    commands: [
      { cmd: 'cat /boot/grub/grub.cfg', desc: 'View the bootloader configuration' },
      { cmd: 'systemd-analyze', desc: 'See total boot time' },
      { cmd: 'systemd-analyze blame', desc: 'See which services are slowest to start' }
    ],
    hints: [
      'Take a look at the actual config file: "cat /boot/grub/grub.cfg".',
      'Then check boot timing with "systemd-analyze".'
    ],
    challenge: {
      prompt: 'Check boot timing with systemd-analyze.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('systemd-analyze'))
    }
  },
  {
    id: 'log-management',
    tag: '2.11',
    title: 'Log Management',
    theory: [
      'systemd centralizes logs from every service into the journal, queried with "journalctl". Filter to one service with "-u <name>" — e.g. "journalctl -u cron" shows only cron\'s log lines.',
      'Older-style plain-text logs still exist too, mainly under /var/log (syslog, auth.log, etc.) — some applications write there directly instead of (or alongside) the journal.',
      'On a real incident, log correlation across both the journal and /var/log is often how you reconstruct what actually happened on a compromised or misbehaving system.'
    ],
    commands: [
      { cmd: 'journalctl', desc: 'View the full journal' },
      { cmd: 'journalctl -u cron', desc: 'Filter to a single service' },
      { cmd: 'cat /var/log/syslog', desc: 'Read the traditional syslog file' }
    ],
    hints: [
      'Run "journalctl" with no arguments first to see everything logged so far.',
      'Then filter to just one unit: "journalctl -u cron".'
    ],
    challenge: {
      prompt: 'Filter the journal to just the cron unit.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('journalctl') && l.includes('cron'))
    }
  },
  {
    id: 'performance-monitoring',
    tag: '2.12',
    title: 'Performance Monitoring',
    theory: [
      '"uptime" shows how long the system has been running and the load average — roughly, how many processes were competing for CPU time over the last 1, 5, and 15 minutes. A load average consistently above your core count means the system is CPU-saturated.',
      '"vmstat" gives a compact snapshot of processes, memory, swap activity, I/O, and CPU usage all in one table — useful for quickly spotting whether a slowdown is CPU-bound, memory-bound, or I/O-bound.',
      '"top" (covered in process management) ties this together with a live per-process view — the natural next step once vmstat or uptime tells you something is off.'
    ],
    commands: [
      { cmd: 'uptime', desc: 'System uptime and load average' },
      { cmd: 'vmstat', desc: 'Memory, swap, IO, and CPU snapshot' },
      { cmd: 'top', desc: 'Live per-process resource usage' }
    ],
    hints: [
      'Start with "uptime" to see the load average.',
      'Then get more detail with "vmstat".'
    ],
    challenge: {
      prompt: 'Check system load with uptime.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('uptime'))
    }
  },
  {
    id: 'capstone-production-server',
    tag: '2.13',
    title: 'Capstone: Build a Production Linux Server',
    theory: [
      'This ties every topic in this module together, the way you would actually set up a real server: bring up a service and make sure it survives a reboot, schedule a recurring job, provision storage properly instead of writing directly to the root disk, and confirm you can see what is happening through logs and monitoring.',
      'There is no single "correct" order — on a real box you would move between these tasks as needed, which is exactly what this challenge asks you to do.',
      'When you are done, you will have touched systemd, cron, LVM, memory monitoring, and the journal in one continuous workflow — the core daily loop of Linux system administration.'
    ],
    commands: [
      { cmd: 'systemctl enable --now nginx', desc: '(or two commands) bring up and enable the web server' },
      { cmd: 'lvcreate -L 10G -n webdata vgdata', desc: 'Provision a logical volume for the app' },
      { cmd: 'crontab ~/cron/backup.cron', desc: 'Schedule the backup job' },
      { cmd: 'free -h', desc: 'Confirm available memory' },
      { cmd: 'journalctl -u nginx', desc: 'Confirm the service is logging correctly' }
    ],
    hints: [
      'systemctl only accepts one action at a time here — run "systemctl start nginx" and "systemctl enable nginx" separately.',
      'You will need pvcreate + vgcreate before lvcreate will work, same as the LVM lesson.',
      'Finish with "free -h" and "journalctl -u nginx" so both show up in your history.'
    ],
    challenge: {
      prompt: 'Enable + start nginx, provision a logical volume, install the cron job, then check memory and nginx logs.',
      check: (state) =>
        !!state.services['nginx']?.active &&
        !!state.services['nginx']?.enabled &&
        state.lvm.logicalVolumes.length > 0 &&
        state.cronJobs.length > 0 &&
        historyIncludes(state, (l) => l.startsWith('free')) &&
        historyIncludes(state, (l) => l.startsWith('journalctl') && l.includes('nginx'))
    }
  },
  {
    id: 'tcp-ip-fundamentals',
    tag: '3.1',
    title: 'TCP/IP Fundamentals',
    theory: [
      'TCP/IP is the layered model nearly all networking runs on. IP addresses identify a machine on a network; ports identify a specific application on that machine (port 22 for SSH, port 80 for HTTP, and so on). Together, IP:port uniquely identifies a network conversation.',
      'TCP is connection-oriented — it handshakes, guarantees delivery, and retransmits lost packets, which is why web pages and SSH sessions use it. UDP is connectionless and has no delivery guarantee, trading reliability for speed — DNS lookups and video streaming often use it.',
      'Every Linux machine has at least one network interface (often "eth0" or "ens160" for wired, "wlan0" for wireless) plus the loopback interface "lo" (127.0.0.1), which lets a machine talk to itself.'
    ],
    commands: [
      { cmd: 'ip addr', desc: 'List network interfaces and their assigned IP addresses' },
      { cmd: 'ip link', desc: 'Show interface up/down state' }
    ],
    hints: [
      'Run "ip addr" (or the shorthand "ip a") to see this machine\'s interfaces.',
      'Notice "lo" (loopback, 127.0.0.1) and "eth0" (the real interface with a LAN address).'
    ],
    challenge: {
      prompt: 'List this machine\'s network interfaces with ip addr.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('ip') && (l.includes('addr') || l === 'ip a'))
    }
  },
  {
    id: 'dns',
    tag: '3.2',
    title: 'DNS',
    theory: [
      'DNS (Domain Name System) translates human-readable names like "webserver01.lab" into IP addresses. Without it, you would need to memorize IP addresses for everything you connect to.',
      '"nslookup" and "dig" both query DNS directly and are the standard tools for troubleshooting name resolution — "is this actually a DNS problem, or something else?" is one of the first questions in any connectivity issue.',
      'This lab simulates a small internal DNS zone with a couple of made-up hosts (webserver01.lab, dbserver01.lab) that you will use again in later networking lessons.'
    ],
    commands: [
      { cmd: 'nslookup webserver01.lab', desc: 'Resolve a hostname to an IP' },
      { cmd: 'dig webserver01.lab', desc: 'Same idea, more detailed output' }
    ],
    hints: [
      'Try "nslookup webserver01.lab" first.',
      '"dig webserver01.lab" gives a more detailed, DNS-protocol-level view of the same answer.'
    ],
    challenge: {
      prompt: 'Resolve webserver01.lab with nslookup or dig.',
      check: (state) => historyIncludes(state, (l) => (l.startsWith('nslookup') || l.startsWith('dig')) && l.includes('.lab'))
    }
  },
  {
    id: 'dhcp',
    tag: '3.3',
    title: 'DHCP',
    theory: [
      'DHCP (Dynamic Host Configuration Protocol) automatically assigns an IP address, subnet, gateway, and DNS servers to a machine when it joins a network — the alternative to manually configuring every device by hand.',
      'The client broadcasts a request; a DHCP server on the network replies with a lease — an IP address rented for a fixed time (e.g. 24 hours), renewed automatically before it expires.',
      '"dhclient" is the classic Linux DHCP client tool — running it against an interface requests (or renews) a lease.'
    ],
    commands: [
      { cmd: 'dhclient eth0', desc: 'Request/renew a DHCP lease on eth0' },
      { cmd: 'ip addr', desc: 'Confirm the interface picked up an address' }
    ],
    hints: [
      'Run "dhclient eth0" to request a fresh lease.',
      'Then check the result with "ip addr".'
    ],
    challenge: {
      prompt: 'Request a DHCP lease on eth0.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('dhclient'))
    }
  },
  {
    id: 'routing-switching',
    tag: '3.4',
    title: 'Routing & Switching Basics',
    theory: [
      'Switching happens within a local network — a switch forwards frames based on MAC addresses, connecting devices on the same subnet directly. Routing happens between networks — a router forwards packets based on IP addresses toward their destination network.',
      'Every machine keeps a routing table describing which interface (and, for anything outside the local subnet, which gateway) to send traffic through. The "default route" (or "default gateway") is where everything not matched by a more specific route gets sent — typically your internet-facing router.',
      '"ip route" shows this table. A misconfigured or missing default route is one of the most common "the internet doesn\'t work but the local network does" causes.'
    ],
    commands: [
      { cmd: 'ip route', desc: 'Show the routing table' }
    ],
    hints: [
      'Run "ip route" and look for the line starting with "default" — that is your gateway.'
    ],
    challenge: {
      prompt: 'View the routing table with ip route.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('ip') && (l.includes('route') || l.endsWith(' r')))
    }
  },
  {
    id: 'nat',
    tag: '3.5',
    title: 'NAT (Network Address Translation)',
    theory: [
      'NAT lets many machines on a private network (10.x, 192.168.x, etc.) share one public IP address. Your home router does this constantly — every device inside gets a private address, and NAT rewrites outgoing packets to use the router\'s single public address.',
      'MASQUERADE is the common Linux NAT mode for this exact case — dynamically rewrite the source address of outgoing traffic to whatever the outbound interface\'s address happens to be, ideal when that address isn\'t fixed.',
      'For NAT to work at all, the kernel must be allowed to forward packets between interfaces — which is exactly what the FORWARD chain\'s policy controls.'
    ],
    commands: [
      { cmd: 'iptables -P FORWARD ACCEPT', desc: 'Allow packet forwarding — a prerequisite for NAT' },
      { cmd: 'iptables -L', desc: 'Confirm the new policy' }
    ],
    hints: [
      'NAT requires the kernel to forward traffic between networks — set that policy first.',
      '"iptables -P FORWARD ACCEPT" changes the default FORWARD chain policy.'
    ],
    challenge: {
      prompt: 'Set the FORWARD chain policy to ACCEPT to allow the forwarding NAT depends on.',
      check: (state) => state.firewallPolicy.FORWARD === 'ACCEPT'
    }
  },
  {
    id: 'vpn',
    tag: '3.6',
    title: 'VPN',
    theory: [
      'A VPN (Virtual Private Network) creates an encrypted tunnel between two points over an untrusted network — remote workers connecting to a corporate LAN, or connecting two offices together over the public internet as if they were on the same local network.',
      'WireGuard is a modern, fast, and much simpler VPN protocol than older alternatives like OpenVPN or IPsec — it exchanges public keys instead of certificates and typically needs only a few lines of configuration.',
      '"wg-quick up <interface>" brings a configured tunnel up; "wg show" displays its current status, including the last handshake time — the fastest way to tell whether a tunnel is actually alive.'
    ],
    commands: [
      { cmd: 'wg-quick up wg0', desc: 'Bring up a WireGuard VPN tunnel' },
      { cmd: 'wg show', desc: 'Check tunnel status' }
    ],
    hints: [
      'Bring the tunnel up first: "wg-quick up wg0".',
      'Then confirm it is active with "wg show".'
    ],
    challenge: {
      prompt: 'Bring up the wg0 VPN interface.',
      check: (state) => state.vpnActive
    }
  },
  {
    id: 'iptables',
    tag: '3.7',
    title: 'Firewalls: iptables',
    theory: [
      'iptables is the traditional Linux firewall — it filters traffic through three main chains: INPUT (traffic destined for this machine), OUTPUT (traffic leaving this machine), and FORWARD (traffic passing through this machine to somewhere else).',
      'Each chain has a default policy (ACCEPT or DROP) plus an ordered list of rules; the first matching rule wins. "iptables -A INPUT ..." appends a rule to the end of the INPUT chain.',
      'A very common real rule: allow inbound SSH so you don\'t lock yourself out of a remote server — "iptables -A INPUT -p tcp --dport 22 -j ACCEPT".'
    ],
    commands: [
      { cmd: 'iptables -A INPUT -p tcp --dport 22 -j ACCEPT', desc: 'Allow inbound SSH' },
      { cmd: 'iptables -L', desc: 'List all current rules' }
    ],
    hints: [
      'Append a rule allowing SSH: "iptables -A INPUT -p tcp --dport 22 -j ACCEPT".',
      'Confirm it landed with "iptables -L".'
    ],
    challenge: {
      prompt: 'Add an INPUT rule allowing inbound SSH traffic.',
      check: (state) => state.firewallRules.some((r) => r.chain === 'INPUT')
    }
  },
  {
    id: 'nftables',
    tag: '3.8',
    title: 'Firewalls: nftables',
    theory: [
      'nftables is the modern successor to iptables, unifying IPv4/IPv6 firewalling into one framework with a cleaner syntax. Most current distros ship it alongside (or instead of) iptables.',
      'Rules live in tables and chains you define yourself: "nft add table inet filter" creates a table, then chains and rules are added inside it — more explicit than iptables\' fixed built-in chains.',
      '"nft list ruleset" dumps the entire current configuration — the nftables equivalent of "iptables -L".'
    ],
    commands: [
      { cmd: 'nft add rule inet filter input tcp dport 22 accept', desc: 'Add an nftables rule' },
      { cmd: 'nft list ruleset', desc: 'View the current ruleset' }
    ],
    hints: [
      'Add a rule with "nft add rule inet filter input tcp dport 22 accept".',
      'Then view everything with "nft list ruleset".'
    ],
    challenge: {
      prompt: 'Add at least one nftables rule.',
      check: (state) => state.nftRules.length > 0
    }
  },
  {
    id: 'network-namespaces',
    tag: '3.9',
    title: 'Network Namespaces',
    theory: [
      'A network namespace is an isolated copy of the Linux networking stack — its own interfaces, routes, and firewall rules, completely separate from the host\'s. Processes inside one namespace cannot see or reach the network of another unless you explicitly connect them.',
      'This is the exact primitive containers (Docker, Podman, Kubernetes pods) are built on — each container typically gets its own network namespace, which is why containers can each have "their own" eth0 despite sharing one physical machine.',
      '"ip netns add <name>" creates a new namespace; "ip netns list" shows what exists.'
    ],
    commands: [
      { cmd: 'ip netns add lab-ns', desc: 'Create a new network namespace' },
      { cmd: 'ip netns list', desc: 'List existing namespaces' }
    ],
    hints: [
      'Create one with "ip netns add lab-ns".',
      'Confirm it exists with "ip netns list".'
    ],
    challenge: {
      prompt: 'Create a network namespace.',
      check: (state) => state.namespaces.length > 0
    }
  },
  {
    id: 'vlans',
    tag: '3.10',
    title: 'VLANs',
    theory: [
      'A VLAN (Virtual LAN) splits one physical network into multiple logically isolated broadcast domains without needing separate physical switches — traffic is tagged with a VLAN ID (802.1Q) as it moves between switches.',
      'On Linux, a VLAN shows up as a virtual sub-interface tied to a physical one — e.g. "eth0.10" for VLAN 10 on eth0 — created with "ip link add link eth0 name eth0.10 type vlan id 10".',
      'Enterprises commonly separate traffic this way: a VLAN for general staff, one for servers, one for guest wifi, one for VoIP — all on the same physical switches, but unable to talk to each other unless a router explicitly permits it.'
    ],
    commands: [
      { cmd: 'ip link add link eth0 name eth0.10 type vlan id 10', desc: 'Create a VLAN sub-interface on eth0' },
      { cmd: 'ip link', desc: 'Confirm the new virtual interface exists' }
    ],
    hints: [
      'Create VLAN 10 on eth0 with the full command from above.',
      'Then check it shows up with "ip link".'
    ],
    challenge: {
      prompt: 'Create a VLAN sub-interface on eth0.',
      check: (state) => state.vlans.length > 0
    }
  },
  {
    id: 'ping-traceroute',
    tag: '3.11',
    title: 'Network Diagnostics: ping & traceroute',
    theory: [
      '"ping" sends ICMP echo requests to a host and waits for replies — the simplest possible "is this thing reachable at all?" check, reporting round-trip time and packet loss.',
      '"traceroute" goes further: it shows every hop (router) a packet passes through on its way to the destination, which is invaluable for pinpointing exactly where a connection is failing or slowing down in a multi-hop path.',
      'Together they are usually the first two commands run when diagnosing "I can\'t reach X" — ping tells you reachability, traceroute tells you where the path breaks if it doesn\'t.'
    ],
    commands: [
      { cmd: 'ping webserver01.lab', desc: 'Check basic reachability' },
      { cmd: 'traceroute webserver01.lab', desc: 'See the path taken to reach it' }
    ],
    hints: [
      'Try "ping webserver01.lab" first.',
      'Then trace the path with "traceroute webserver01.lab".'
    ],
    challenge: {
      prompt: 'Run both ping and traceroute against webserver01.lab.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('ping')) && historyIncludes(state, (l) => l.startsWith('traceroute'))
    }
  },
  {
    id: 'netcat-nmap',
    tag: '3.12',
    title: 'Network Diagnostics: netcat & nmap',
    theory: [
      '"nc" (netcat) is a general-purpose networking Swiss Army knife — among other things, "nc -zv <host> <port>" checks whether a specific port is open without a full protocol handshake, useful for quickly confirming "is anything even listening there?"',
      '"nmap" scans a host (or whole network range) for open ports and identifies what is likely running on them — the standard tool for network reconnaissance, both defensively (auditing your own exposure) and offensively (early-stage penetration testing).',
      'webserver01.lab and dbserver01.lab in this lab have different ports open — a good way to see nmap reveal genuinely different service profiles per host.'
    ],
    commands: [
      { cmd: 'nc -zv webserver01.lab 80', desc: 'Check whether port 80 is open' },
      { cmd: 'nmap webserver01.lab', desc: 'Scan a host for open ports' }
    ],
    hints: [
      'Try "nc -zv webserver01.lab 80" for a single-port check.',
      'Then run a full scan with "nmap webserver01.lab" to see everything open at once.'
    ],
    challenge: {
      prompt: 'Use both nc and nmap against a host on the lab network.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('nc ')) && historyIncludes(state, (l) => l.startsWith('nmap'))
    }
  },
  {
    id: 'tcpdump-wireshark',
    tag: '3.13',
    title: 'Network Diagnostics: tcpdump & Wireshark',
    theory: [
      '"tcpdump" captures raw packets off an interface and prints them — the lowest-level way to see exactly what is going over the wire, invaluable when higher-level tools (ping, curl) don\'t explain a problem.',
      'Wireshark is tcpdump\'s graphical cousin — same underlying capture engine, but with a rich UI for filtering, following a TCP stream end-to-end, and inspecting protocol fields visually. A common workflow is capturing with tcpdump on a remote server, then opening the file locally in Wireshark for analysis.',
      'Both require care in production — capturing on a busy interface can itself impact performance, and captured traffic may contain sensitive data.'
    ],
    commands: [
      { cmd: 'tcpdump -i eth0', desc: 'Capture packets on eth0' }
    ],
    hints: [
      'Run "tcpdump -i eth0" to see a simulated capture.'
    ],
    challenge: {
      prompt: 'Capture packets on an interface with tcpdump.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('tcpdump'))
    }
  },
  {
    id: 'ss-netstat-ip-arp',
    tag: '3.14',
    title: 'ss, netstat, ip, and arp',
    theory: [
      '"ss" (socket statistics) shows current network connections and listening ports — the modern replacement for the older "netstat", which still works but is considered legacy on most distros.',
      '"ip" is the modern all-purpose networking configuration tool (addresses, routes, links, namespaces — all the "ip ..." commands from this module), replacing older single-purpose tools like "ifconfig" and "route".',
      '"arp" (or "ip neigh") shows the ARP table — the local cache mapping IP addresses to MAC addresses for machines on the same subnet, which every device maintains to actually deliver frames on the LAN.'
    ],
    commands: [
      { cmd: 'ss -tlnp', desc: 'List listening TCP sockets' },
      { cmd: 'netstat -tlnp', desc: 'The older equivalent' },
      { cmd: 'arp', desc: 'View the ARP table' }
    ],
    hints: [
      'Check listening ports with "ss" or "netstat".',
      'Then view the ARP cache with "arp".'
    ],
    challenge: {
      prompt: 'Check listening sockets (ss or netstat) and view the ARP table.',
      check: (state) =>
        (historyIncludes(state, (l) => l.startsWith('ss')) || historyIncludes(state, (l) => l.startsWith('netstat'))) &&
        historyIncludes(state, (l) => l.startsWith('arp'))
    }
  },
  {
    id: 'capstone-virtual-network',
    tag: '3.15',
    title: 'Capstone: Build a Virtual Enterprise Network',
    theory: [
      'This pulls every networking concept in this module into one workflow, the way a network/sysadmin would actually approach standing up a small segmented network: verify reachability of key servers, segment traffic with a VLAN, isolate a workload in its own namespace, lock down the firewall to only what is needed, and bring up secure remote access over a VPN.',
      'In a real enterprise this same shape scales up enormously — hundreds of VLANs, namespaces backing thousands of containers, and firewall rules generated by policy engines rather than typed by hand — but the underlying primitives are exactly what you just practiced.',
      'As with the Module 2 capstone, there is no single required order — this reflects the real, iterative nature of network administration.'
    ],
    commands: [
      { cmd: 'nmap webserver01.lab', desc: 'Confirm what is reachable and open on a key server' },
      { cmd: 'ip link add link eth0 name eth0.10 type vlan id 10', desc: 'Segment traffic with a VLAN' },
      { cmd: 'ip netns add lab-ns', desc: 'Isolate a workload in its own namespace' },
      { cmd: 'iptables -A INPUT -p tcp --dport 22 -j ACCEPT', desc: 'Allow only the traffic you actually need' },
      { cmd: 'wg-quick up wg0', desc: 'Bring up secure remote access' }
    ],
    hints: [
      'This is a checklist, not a puzzle — work through each command from the list above.',
      'Everything here was covered in earlier lessons in this module; revisit them if you get stuck on syntax.'
    ],
    challenge: {
      prompt: 'Scan a server, create a VLAN, create a namespace, add a firewall rule, and bring up the VPN.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('nmap')) &&
        state.vlans.length > 0 &&
        state.namespaces.length > 0 &&
        state.firewallRules.some((r) => r.chain === 'INPUT') &&
        state.vpnActive
    }
  },
  {
    id: 'bash-vars-quoting',
    tag: '4.1',
    title: 'Script Variables & Quoting',
    theory: [
      'Inside a script, variables work exactly like they do at the interactive prompt: "NAME=value" assigns, and "$NAME" reads. The difference is scripts let you build up logic across many lines instead of one command at a time.',
      'Quoting changes what happens to a "$" inside it. Double quotes ("...") still expand variables — "Welcome to $CITY" becomes "Welcome to New York". Single quotes (\'...\') expand nothing at all — everything inside is taken completely literally, "$" included.',
      'A starter script at ~/scripts/vars_demo.sh shows both side by side, so you can see the same "$CITY" reference behave two different ways in the same script.'
    ],
    commands: [
      { cmd: 'cat ~/scripts/vars_demo.sh', desc: 'Read the script before running it' },
      { cmd: 'bash ~/scripts/vars_demo.sh', desc: 'Run it and compare the two output lines' }
    ],
    hints: [
      'Read the script first with "cat ~/scripts/vars_demo.sh" — notice one echo uses double quotes and the other single quotes.',
      'Run it with "bash ~/scripts/vars_demo.sh" and compare: one line expands $CITY, the other prints "$CITY" literally.'
    ],
    challenge: {
      prompt: 'Run ~/scripts/vars_demo.sh and observe both quoting behaviors.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('bash') && l.includes('vars_demo.sh')) &&
        state.lastOutput.includes('Welcome to New York') &&
        state.lastOutput.includes('Welcome to $CITY')
    }
  },
  {
    id: 'bash-conditionals',
    tag: '4.2',
    title: 'Conditionals: if / elif / else / fi',
    theory: [
      'An "if" block runs its body only when a condition is true, closing with "fi" (if spelled backwards). "if COND; then ... elif COND2; then ... else ... fi" chains as many branches as needed, evaluated top to bottom — the first true condition wins.',
      'The condition is usually a "test" expression written with square brackets: "[ $USAGE -ge 80 ]". Note the required spaces around both brackets — "[$X]" is a syntax error, "[ $X ]" is correct.',
      'A starter script ~/scripts/check_disk.sh simulates a disk-usage alert: it sets a fixed USAGE value and prints a warning or an all-clear depending on a threshold check.'
    ],
    commands: [
      { cmd: 'cat ~/scripts/check_disk.sh', desc: 'Read the if/else structure before running it' },
      { cmd: 'bash ~/scripts/check_disk.sh', desc: 'Run it and see which branch fires' }
    ],
    hints: [
      'USAGE is set to 85 in the script — check the threshold it compares against.',
      'Run "bash ~/scripts/check_disk.sh" and check whether you see the WARNING or the OK message.'
    ],
    challenge: {
      prompt: 'Run ~/scripts/check_disk.sh and confirm it takes the WARNING branch.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('bash') && l.includes('check_disk.sh')) &&
        state.lastOutput.includes('WARNING')
    }
  },
  {
    id: 'bash-test-operators',
    tag: '4.3',
    title: 'Comparison Operators & test',
    theory: [
      'Numeric comparisons inside "[ ]" use two-letter operators, not symbols: -eq, -ne, -lt, -le, -gt, -ge (equal, not-equal, less-than, less-or-equal, greater-than, greater-or-equal). Using "=" or ">" instead compares strings, not numbers, which is a very common scripting bug.',
      'String comparisons use "=" and "!=" directly: "[ $USER = student ]". "-z" tests that a string is empty, "-n" tests that it is non-empty — handy for checking whether a variable was ever set.',
      '"[ ... ]" is really just another command (an alias for "test") — after it runs, "$?" holds its result: 0 for true, 1 for false, exactly like any other command\'s exit status.'
    ],
    commands: [
      { cmd: '[ 5 -gt 3 ]', desc: 'Run a numeric test directly at the prompt' },
      { cmd: 'echo $?', desc: 'Check its result: 0 means true' },
      { cmd: '[ 5 -lt 3 ]', desc: 'Run one that should be false' },
      { cmd: 'echo $?', desc: 'Check its result: 1 means false' }
    ],
    hints: [
      'Try "[ 5 -gt 3 ]" then immediately "echo $?" — you should see 0 (true).',
      'Try a test you expect to fail, like "[ 5 -lt 3 ]", then "echo $?" — you should see 1 (false).'
    ],
    challenge: {
      prompt: 'Run a "[ ]" test that evaluates to true, then check $? with echo.',
      check: (state) => {
        const idx = state.history.findIndex((l) => /^\[\s.*-(eq|ne|lt|le|gt|ge)\s/.test(l.trim()));
        if (idx === -1) return false;
        return historyIncludes(state, (l) => l.trim() === 'echo $?');
      }
    }
  },
  {
    id: 'bash-for-loops',
    tag: '4.4',
    title: 'For Loops',
    theory: [
      '"for VAR in item1 item2 item3; do ... done" runs the body once per item, with VAR set to that item each time. This is the most common loop shape in shell scripts — iterating over a fixed list, a set of files, or a set of hostnames.',
      'Inside the loop body, reference the current item with "$VAR" just like any other variable — it changes automatically on each pass.',
      '~/scripts/countdown.sh loops over a list of numbers counting down, then prints a final message once the loop finishes — a good template for "do this N times" scripts.'
    ],
    commands: [
      { cmd: 'cat ~/scripts/countdown.sh', desc: 'See the for-loop structure' },
      { cmd: 'bash ~/scripts/countdown.sh', desc: 'Run the countdown' }
    ],
    hints: [
      'Read the script first — the loop variable is "n", iterating over "5 4 3 2 1".',
      'Run it with "bash ~/scripts/countdown.sh" and check the final "Liftoff!" line appears after all five counts.'
    ],
    challenge: {
      prompt: 'Run ~/scripts/countdown.sh to completion.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('bash') && l.includes('countdown.sh')) &&
        state.lastOutput.includes('T-minus 1') &&
        state.lastOutput.includes('Liftoff!')
    }
  },
  {
    id: 'bash-while-loops',
    tag: '4.5',
    title: 'While Loops & Exit Codes',
    theory: [
      '"while COND; do ... done" repeats its body for as long as COND stays true — unlike a for-loop\'s fixed list, a while-loop\'s length depends on something changing inside the loop, usually a counter or a condition being polled.',
      'A very common pattern increments a counter each pass using arithmetic expansion: "COUNT=$((COUNT+1))" — the "$(( ))" tells the shell to evaluate what is inside as a math expression rather than plain text.',
      'Forgetting to update the condition variable inside the loop body is the classic way to write an infinite loop — always double check whatever the while condition depends on actually changes somewhere in the body.'
    ],
    commands: [
      { cmd: 'cat ~/scripts/retry.sh', desc: 'See the while-loop and counter pattern' },
      { cmd: 'bash ~/scripts/retry.sh', desc: 'Run it and count the attempts' }
    ],
    hints: [
      'The loop condition is "[ $ATTEMPTS -lt 3 ]" — it keeps going while ATTEMPTS is under 3.',
      'Look for "ATTEMPTS=$((ATTEMPTS+1))" — that is what eventually makes the condition false and ends the loop.'
    ],
    challenge: {
      prompt: 'Run ~/scripts/retry.sh and confirm it stops after 3 attempts.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('bash') && l.includes('retry.sh')) &&
        state.lastOutput.includes('Done after 3 attempts')
    }
  },
  {
    id: 'bash-functions',
    tag: '4.6',
    title: 'Functions',
    theory: [
      'A function groups commands under a name so they can be reused: "name() { ...; }" defines it, and later calling "name" runs the body — just like any other command.',
      'Functions must be defined before they are called, reading top to bottom, exactly like the rest of a bash script — there is no hoisting like in some other languages.',
      'Inside a function, "$1", "$2", etc. refer to whatever arguments THAT function call was given, not the script\'s own arguments — ~/scripts/greet.sh defines a "greet" function and calls it with two values to demonstrate this.'
    ],
    commands: [
      { cmd: 'cat ~/scripts/greet.sh', desc: 'See the function definition and its call' },
      { cmd: 'bash ~/scripts/greet.sh Alice 7', desc: 'Run it, passing two arguments through to the function' }
    ],
    hints: [
      'The function is named "greet" and expects two arguments inside its body ($1 and $2).',
      'Run "bash ~/scripts/greet.sh Alice 7" — the script forwards its own $1/$2 into the greet() call.'
    ],
    challenge: {
      prompt: 'Run ~/scripts/greet.sh with two arguments of your choice.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('bash') && l.includes('greet.sh') && l.trim().split(/\s+/).length >= 4)
    }
  },
  {
    id: 'bash-positional-params',
    tag: '4.7',
    title: 'Positional Parameters & Script Arguments',
    theory: [
      'Anything typed after a script\'s name becomes its positional parameters: "bash greet.sh Alice 7" sets $1 to "Alice" and $2 to "7" inside that script, exactly like command-line arguments in any other language.',
      '"$#" holds how many arguments were passed, and "$@" holds all of them together — useful for validating input before the rest of a script runs (e.g. checking $# before assuming $1 exists).',
      'Try running ~/scripts/greet.sh with different names and numbers to see $1 and $2 change with no edits to the script itself — the whole point of parameterizing a script instead of hardcoding values.'
    ],
    commands: [
      { cmd: 'bash ~/scripts/greet.sh Priya 12', desc: 'Run with one set of arguments' },
      { cmd: 'bash ~/scripts/greet.sh Sam 99', desc: 'Run again with different arguments' }
    ],
    hints: [
      'Run the same script twice with different names/numbers and compare the output each time.',
      'The values you type after "greet.sh" become $1 and $2 inside the script — nothing in the script file itself changes.'
    ],
    challenge: {
      prompt: 'Run ~/scripts/greet.sh with two different sets of arguments (two separate calls).',
      check: (state) => {
        const calls = state.history.filter((l) => l.startsWith('bash') && l.includes('greet.sh') && l.trim().split(/\s+/).length >= 4);
        return calls.length >= 2 && new Set(calls).size >= 2;
      }
    }
  },
  {
    id: 'bash-capstone',
    tag: '4.8',
    title: 'Capstone: Write Your Own Automation Script',
    theory: [
      'This ties the module together: variables, a conditional, and redirection (from Module 1) combine to build a script completely from the terminal — no text editor needed, just "echo" appending line by line with ">>".',
      'The pattern: "echo \'line one\' > myscript.sh" creates the file with its first line, then "echo \'line two\' >> myscript.sh" appends each subsequent line, preserving order. Reading it back with "cat" before running it is always good practice.',
      'Once written, run it the same way as any other script: "bash myscript.sh". If something looks wrong, "cat" the file again to check exactly what ended up on disk — a very common real debugging step.'
    ],
    commands: [
      { cmd: "echo 'THRESHOLD=90' > deploy_check.sh", desc: 'Start the script with a variable' },
      { cmd: "echo 'CURRENT=95' >> deploy_check.sh", desc: 'Append the value to check' },
      { cmd: "echo 'if [ $CURRENT -ge $THRESHOLD ]' >> deploy_check.sh", desc: 'Append the condition' },
      { cmd: "echo 'then' >> deploy_check.sh", desc: 'Append then' },
      { cmd: "echo '  echo \"BLOCKED: too close to threshold\"' >> deploy_check.sh", desc: 'Append the warning branch' },
      { cmd: "echo 'else' >> deploy_check.sh", desc: 'Append else' },
      { cmd: "echo '  echo \"OK to deploy\"' >> deploy_check.sh", desc: 'Append the ok branch' },
      { cmd: "echo 'fi' >> deploy_check.sh", desc: 'Close the if block' },
      { cmd: 'cat deploy_check.sh', desc: 'Review what you built before running it' },
      { cmd: 'bash deploy_check.sh', desc: 'Run your finished script' }
    ],
    hints: [
      'Build the file one "echo ... >> deploy_check.sh" at a time — the very first line should use ">" instead of ">>" to create the file fresh.',
      'Once all lines are appended, "cat deploy_check.sh" to double check it reads top to bottom the way you intended, then "bash deploy_check.sh" to run it.'
    ],
    challenge: {
      prompt: 'Build a script named deploy_check.sh using echo + redirection with an if/else block, then run it with bash.',
      check: (state) => {
        const node = getNode(state.root, [...state.cwd, 'deploy_check.sh']);
        const built = !!node && node.type === 'file' && node.content.includes('if') && node.content.includes('fi');
        return built && historyIncludes(state, (l) => l.startsWith('bash') && l.includes('deploy_check.sh'));
      }
    }
  },
  {
    id: 'tar-create-list',
    tag: '5.1',
    title: 'Archiving with tar: Create & List',
    theory: [
      '"tar" bundles a whole directory tree into a single file, preserving structure — the standard way to package a project or back up a folder in one shot. The classic flags spell a mnemonic: "-c" create, "-v" verbose (print each file as it\'s added), "-f" file (the archive\'s name comes next).',
      '"tar -tvf archive.tar" lists what\'s inside an archive without touching a single file on disk — always worth doing before extracting something from an unfamiliar archive.',
      'Run these from your home directory so the archive captures the whole "scripts" folder, not just its contents.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Make sure you are in your home directory' },
      { cmd: 'tar -cvf scripts_backup.tar scripts', desc: 'Archive the scripts directory' },
      { cmd: 'tar -tvf scripts_backup.tar', desc: 'List the archive contents without extracting' }
    ],
    hints: [
      '"-cvf" reads as create + verbose + file — the archive name always comes right after "-f".',
      'Use "tar -tvf scripts_backup.tar" to preview an archive\'s contents safely before extracting it.'
    ],
    challenge: {
      prompt: 'From ~, archive the "scripts" directory into scripts_backup.tar, then list its contents.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'scripts_backup.tar']);
        return !!node && node.type === 'file' &&
          historyIncludes(state, (l) => l.startsWith('tar') && l.includes('-cvf') && l.includes('scripts_backup.tar')) &&
          historyIncludes(state, (l) => l.startsWith('tar') && l.includes('-tvf'));
      }
    }
  },
  {
    id: 'tar-extract',
    tag: '5.2',
    title: 'Extracting Archives',
    theory: [
      '"tar -xvf archive.tar" extracts an archive\'s contents into the current directory. Because it recreates whatever path structure was captured at creation time, it\'s good practice to extract into an empty directory first so you can see exactly what landed where.',
      'This lab\'s simulated tar always extracts relative to your current directory (no "-C" support), so "cd" into your destination first, then point "-f" at the archive using a relative path like "../scripts_backup.tar".'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Start from home' },
      { cmd: 'mkdir restore_test', desc: 'Make an empty destination directory' },
      { cmd: 'cd restore_test', desc: 'Move into it before extracting' },
      { cmd: 'tar -xvf ../scripts_backup.tar', desc: 'Extract the archive here' },
      { cmd: 'ls scripts', desc: 'Confirm the scripts folder came back intact' }
    ],
    hints: [
      'Extract into a fresh, empty directory so you can clearly see what the archive contained.',
      'Since the archive is one level up, reference it as "../scripts_backup.tar".'
    ],
    challenge: {
      prompt: 'Extract scripts_backup.tar into a new restore_test directory and confirm scripts/hello.sh reappears.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'restore_test', 'scripts', 'hello.sh']);
        return !!node && node.type === 'file' && historyIncludes(state, (l) => l.startsWith('tar') && l.includes('-xvf'));
      }
    }
  },
  {
    id: 'gzip-gunzip',
    tag: '5.3',
    title: 'Compressing Single Files: gzip & gunzip',
    theory: [
      '"gzip" compresses a single file in place: "gzip notes.txt" replaces notes.txt with notes.txt.gz and removes the original (add "-k" to keep it). "gunzip" reverses the process, restoring the original name and content and removing the .gz file.',
      'Unlike tar, gzip only ever works on one file at a time — that\'s why the two are so often combined ("tar czvf" bundles first, then compresses the bundle) rather than used to compress a whole directory directly.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Start from home' },
      { cmd: 'gzip notes.txt', desc: 'Compress notes.txt into notes.txt.gz' },
      { cmd: 'ls notes.txt.gz', desc: 'Confirm the compressed file exists' },
      { cmd: 'gunzip notes.txt.gz', desc: 'Restore the original notes.txt' },
      { cmd: 'cat notes.txt', desc: 'Confirm the original content is back' }
    ],
    hints: [
      'After "gzip notes.txt", the plain notes.txt is gone — only notes.txt.gz remains, unless you passed "-k".',
      '"gunzip notes.txt.gz" restores notes.txt and removes the .gz file.'
    ],
    challenge: {
      prompt: 'Compress notes.txt with gzip, then restore it with gunzip.',
      check: (state) => {
        const restored = getNode(state.root, ['home', 'student', 'notes.txt']);
        const gz = getNode(state.root, ['home', 'student', 'notes.txt.gz']);
        return !!restored && restored.type === 'file' && !gz &&
          historyIncludes(state, (l) => l.startsWith('gzip')) &&
          historyIncludes(state, (l) => l.startsWith('gunzip'));
      }
    }
  },
  {
    id: 'zip-unzip',
    tag: '5.4',
    title: 'zip & unzip: Bundling Multiple Files',
    theory: [
      '"zip" is the cross-platform cousin of tar+gzip — it bundles multiple files into one archive directly: "zip docs.zip notes.txt welcome.txt" packs both files into docs.zip in one step, no separate compression pass needed.',
      '"unzip archive.zip -d destdir" extracts into a chosen directory (unlike this lab\'s simplified tar, unzip here does support "-d"), which is handy for keeping extracted files separate from your working directory.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Start from home' },
      { cmd: 'zip docs.zip notes.txt welcome.txt', desc: 'Bundle both files into one archive' },
      { cmd: 'unzip docs.zip -d docs_extracted', desc: 'Extract into a new directory' },
      { cmd: 'ls docs_extracted', desc: 'Confirm both files extracted' }
    ],
    hints: [
      'List every file you want bundled after the archive name: "zip docs.zip file1 file2".',
      '"-d docs_extracted" tells unzip where to put the extracted files instead of the current directory.'
    ],
    challenge: {
      prompt: 'Bundle notes.txt and welcome.txt into docs.zip, then extract it into docs_extracted.',
      check: (state) => {
        const a = getNode(state.root, ['home', 'student', 'docs_extracted', 'notes.txt']);
        const b = getNode(state.root, ['home', 'student', 'docs_extracted', 'welcome.txt']);
        return !!a && !!b && historyIncludes(state, (l) => l.startsWith('zip')) && historyIncludes(state, (l) => l.startsWith('unzip'));
      }
    }
  },
  {
    id: 'rsync-local',
    tag: '5.5',
    title: 'Syncing Directories with rsync',
    theory: [
      '"rsync" synchronizes files and directories, and is the standard tool for backups and deployments because it can run repeatedly, only touching what changed. "-a" (archive mode) is the flag you\'ll use almost every time — it implies recursive copying and preserves permissions and structure.',
      '"-v" adds verbose output so you can see exactly what rsync is doing. "rsync -av scripts/ scripts_copy/" copies the whole scripts directory into a new scripts_copy directory.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Start from home' },
      { cmd: 'rsync -av scripts/ scripts_copy/', desc: 'Sync the scripts directory into a new copy' },
      { cmd: 'ls scripts_copy', desc: 'Confirm the copy contains the same files' }
    ],
    hints: [
      '"-a" (archive mode) is the flag that makes rsync recurse into directories and preserve structure.',
      'The destination directory doesn\'t need to exist beforehand — rsync creates it.'
    ],
    challenge: {
      prompt: 'Use rsync -av to copy the scripts directory into scripts_copy.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'scripts_copy', 'hello.sh']);
        return !!node && node.type === 'file' && historyIncludes(state, (l) => l.startsWith('rsync') && l.includes('-av'));
      }
    }
  },
  {
    id: 'scp-remote-transfer',
    tag: '5.6',
    title: 'Copying Files to a Remote Host with scp',
    theory: [
      '"scp" (secure copy) transfers files to or from a remote machine over SSH, using the same "user@host:/path" syntax you\'d use to log in with ssh. "scp file.txt student@webserver01.lab:/home/student/" sends file.txt to that path on the remote host.',
      'This lab simulates one reachable remote lab host, "webserver01.lab" (also known by its IP, 10.0.0.20) — scp and rsync both recognize it as a valid destination.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Start from home' },
      { cmd: 'scp scripts_backup.tar student@webserver01.lab:/home/student/', desc: 'Copy the archive to the remote lab host' }
    ],
    hints: [
      'The destination format is "user@host:/remote/path" — the colon separates the host from the path.',
      'webserver01.lab is this lab\'s one simulated reachable remote host.'
    ],
    challenge: {
      prompt: 'Use scp to send scripts_backup.tar to student@webserver01.lab:/home/student/.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('scp') && l.includes('webserver01.lab')) &&
        state.lastOutput.includes('100%')
    }
  },
  {
    id: 'rsync-remote',
    tag: '5.7',
    title: 'rsync Over the Network',
    theory: [
      'rsync and scp overlap, but rsync is generally preferred for anything beyond a single file: it can be re-run safely, and in the real world only transfers the parts of files that changed. "rsync -av scripts/ student@webserver01.lab:/home/student/scripts/" pushes an entire directory to a remote host in one command.',
      'When rsync targets a remote host, it prints a short transfer summary ("receiving file list ... done", then a sent/received byte count) rather than a full file-by-file trace — that summary is your confirmation the sync ran.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Start from home' },
      { cmd: 'rsync -av scripts/ student@webserver01.lab:/home/student/scripts/', desc: 'Push the scripts directory to the remote lab host' }
    ],
    hints: [
      'The remote destination uses the same "user@host:/path" syntax as scp.',
      'Look for "receiving file list ... done" in the output — that confirms the remote host was reached.'
    ],
    challenge: {
      prompt: 'Use rsync -av to push scripts/ to student@webserver01.lab:/home/student/scripts/.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('rsync') && l.includes('webserver01.lab')) &&
        state.lastOutput.includes('receiving file list')
    }
  },
  {
    id: 'archiving-capstone',
    tag: '5.8',
    title: 'Capstone: Back Up & Ship a Project',
    theory: [
      'This ties the whole module together into one realistic workflow: package a project directory, compress it, then ship it off-box to a remote host — exactly what a real backup or deployment script does.',
      'The sequence: archive with tar, add the "z" flag to fold in gzip compression in the same command, then transfer the finished archive with scp. Verifying the local archive still exists afterward confirms scp copies rather than moves.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Start from home' },
      { cmd: 'tar -czvf project_backup.tar.gz projects', desc: 'Archive and compress the projects directory in one step' },
      { cmd: 'scp project_backup.tar.gz student@webserver01.lab:/home/student/', desc: 'Ship the backup to the remote lab host' },
      { cmd: 'ls project_backup.tar.gz', desc: 'Confirm the local copy is still here too' }
    ],
    hints: [
      '"-czvf" is "-cvf" with a "z" added — same create/verbose/file mnemonic, now with compression folded in.',
      'scp copies, it doesn\'t move — the local archive should still exist after the transfer.'
    ],
    challenge: {
      prompt: 'Archive+compress the projects directory to project_backup.tar.gz, then scp it to student@webserver01.lab.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'project_backup.tar.gz']);
        return !!node && node.type === 'file' &&
          historyIncludes(state, (l) => l.startsWith('tar') && l.includes('project_backup.tar.gz')) &&
          historyIncludes(state, (l) => l.startsWith('scp') && l.includes('webserver01.lab'));
      }
    }
  },
  {
    id: 'symbolic-links',
    tag: '6.1',
    title: 'Symbolic Links',
    theory: [
      'A symbolic link ("symlink") is a small pointer file that refers to another path by name — "ln -s notes.txt notes_link.txt" creates notes_link.txt as a link pointing at notes.txt. Reading, editing, or cat-ing the link transparently follows it to the real file.',
      '"ls -l" marks a symlink with a leading "l" and shows the arrow: "notes_link.txt -> notes.txt". Symlinks are how Linux lets one file "live" at several convenient paths at once without duplicating its content — for example, /usr/bin/python often just links to a specific python3.x binary.',
      'If the target is later deleted, the symlink still exists but becomes "broken" — it points at nothing.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Start from home' },
      { cmd: 'ln -s notes.txt notes_link.txt', desc: 'Create a symlink pointing at notes.txt' },
      { cmd: 'ls -l notes_link.txt', desc: 'See the "l" type and the -> arrow' },
      { cmd: 'cat notes_link.txt', desc: 'Reading the link transparently follows it to notes.txt' }
    ],
    hints: [
      '"-s" is what makes ln create a symbolic link instead of a hard link.',
      '"ls -l" on a symlink shows "l" as the first character and an "-> target" suffix.'
    ],
    challenge: {
      prompt: 'Create notes_link.txt as a symlink to notes.txt, then cat it to confirm it reads through.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'notes_link.txt']);
        return !!node && node.type === 'symlink' && node.target.includes('notes.txt') &&
          historyIncludes(state, (l) => l.startsWith('cat') && l.includes('notes_link.txt'));
      }
    }
  },
  {
    id: 'hard-links',
    tag: '6.2',
    title: 'Hard Links',
    theory: [
      'A hard link is a second name for the exact same file data — not a pointer to it, an equal alias. "ln original.txt hardlink.txt" (no "-s") creates one; both names refer to the identical underlying content, so a change made through either name is visible through the other.',
      'This is the key difference from a symlink: a hard link can\'t go "broken", because it isn\'t a reference to a path — it\'s another name for the same data. Hard links only work within the same filesystem and can\'t point at directories.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Start from home' },
      { cmd: 'echo "shared data" > original.txt', desc: 'Create the original file' },
      { cmd: 'ln original.txt hardlink.txt', desc: 'Create a hard link (no -s) to the same data' },
      { cmd: 'echo "more data" >> original.txt', desc: 'Append to the original' },
      { cmd: 'cat hardlink.txt', desc: 'The appended line shows up here too — same underlying data' }
    ],
    hints: [
      'Leave off "-s" this time — that\'s what makes it a hard link instead of a symlink.',
      'Because both names share the same data, editing one is visible through the other immediately.'
    ],
    challenge: {
      prompt: 'Create original.txt, hard-link it as hardlink.txt, append to original.txt, and confirm hardlink.txt shows the change.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'hardlink.txt']);
        return !!node && node.type === 'file' && node.content.includes('more data') &&
          historyIncludes(state, (l) => l.startsWith('ln') && !l.includes('-s'));
      }
    }
  },
  {
    id: 'umask-default-perms',
    tag: '6.3',
    title: 'umask & Default Permissions',
    theory: [
      'Every new file and directory gets a starting permission before you ever run chmod — the umask decides what that is. Files start from a base of 666 (rw-rw-rw-), directories from 777 (rwxrwxrwx); the umask subtracts bits from that base. The default umask, 022, is why new files usually come out as 644 and new directories as 755.',
      'Run "umask" with no arguments to see the current value, and "umask 027" to change it for the rest of the session. A stricter umask like 027 removes group-write and all "other" access, so new files land at 640 instead of 644 — useful on a shared or multi-user box.'
    ],
    commands: [
      { cmd: 'umask', desc: 'Show the current umask (022 by default)' },
      { cmd: 'umask 027', desc: 'Tighten the default so new files are more private' },
      { cmd: 'touch secret.txt', desc: 'Create a file under the new umask' },
      { cmd: 'ls -l secret.txt', desc: 'Confirm it came out as rw-r----- instead of rw-r--r--' }
    ],
    hints: [
      'umask subtracts from a base of 666 for files and 777 for directories — it never adds execute to a plain file.',
      'After "umask 027", a freshly touched file should show permissions rw-r-----.'
    ],
    challenge: {
      prompt: 'Set umask 027, then create secret.txt and confirm it has permissions rw-r-----.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'secret.txt']);
        return state.umask === '027' && !!node && node.type === 'file' && node.perms === 'rw-r-----';
      }
    }
  },
  {
    id: 'setuid-setgid-sticky',
    tag: '6.4',
    title: 'setuid, setgid & the Sticky Bit',
    theory: [
      'Beyond the familiar 9 rwx bits, Linux tracks three special bits. Setuid (leading octal digit 4, e.g. chmod 4755) makes an executable run with its owner\'s privileges rather than the caller\'s — it\'s how "passwd" lets ordinary users update a file only root can normally write. Setgid (2) does the same for the group, and on a directory makes new files inherit its group automatically.',
      'The sticky bit (1) is best known from /tmp: on a world-writable directory, it stops users from deleting or renaming each other\'s files even though everyone can write there. "ls -l" renders these as a lowercase "s"/"t" when the matching execute bit is also set, or an uppercase "S"/"T" when it isn\'t.'
    ],
    commands: [
      { cmd: 'cd ~/scripts', desc: 'Move into the scripts directory' },
      { cmd: 'chmod 4755 hello.sh', desc: 'Set the setuid bit on a script (for demonstration)' },
      { cmd: 'ls -l hello.sh', desc: 'Notice the owner-execute position now shows "s" instead of "x"' },
      { cmd: 'ls -l /tmp', desc: 'See that /tmp is world-writable but lacks the sticky bit' },
      { cmd: 'chmod 1777 /tmp', desc: 'Add the sticky bit so users can\'t delete each other\'s files in /tmp' },
      { cmd: 'ls -l /tmp', desc: 'Confirm the "t" now appears in the permissions' }
    ],
    hints: [
      'A leading "4" in a 4-digit chmod mode sets setuid; "2" sets setgid; "1" sets the sticky bit.',
      'On /tmp, the sticky bit shows as a lowercase "t" once execute is also set for "other" — which it already is here.'
    ],
    challenge: {
      prompt: 'Set the setuid bit on ~/scripts/hello.sh (chmod 4755) and add the sticky bit to /tmp (chmod 1777).',
      check: (state) => {
        const script = getNode(state.root, ['home', 'student', 'scripts', 'hello.sh']);
        const tmp = getNode(state.root, ['tmp']);
        return !!script && script.type === 'file' && !!script.special?.setuid &&
          !!tmp && tmp.type === 'dir' && !!tmp.special?.sticky;
      }
    }
  },
  {
    id: 'disk-partitioning',
    tag: '6.5',
    title: 'Disk Partitioning: fdisk & parted',
    theory: [
      'Before a raw disk can hold a filesystem, it needs at least one partition. "fdisk -l" lists every disk this lab makes available (/dev/sdb through /dev/sde) along with any partitions already recognized on them — the same first step you\'d take on real hardware or a cloud volume before formatting.',
      '"parted /dev/sdb" gives a more detailed, modern view of a single disk\'s partition table (fdisk is older and interactive-menu-based; parted is scriptable and GPT-aware). Both are read-only exploration tools here — the actual formatting step is "mkfs".'
    ],
    commands: [
      { cmd: 'fdisk -l', desc: 'List all available disks in this lab' },
      { cmd: 'parted /dev/sdb', desc: 'Inspect one disk\'s partition table in detail' }
    ],
    hints: [
      '"fdisk -l" is your starting point — it lists every disk before you decide what to do with it.',
      '"parted <device>" gives a closer look at one specific disk.'
    ],
    challenge: {
      prompt: 'Run fdisk -l to list the lab\'s disks, then inspect /dev/sdb with parted.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('fdisk') && l.includes('-l')) &&
        historyIncludes(state, (l) => l.startsWith('parted') && l.includes('/dev/sdb'))
    }
  },
  {
    id: 'mkfs-formatting',
    tag: '6.6',
    title: 'Creating Filesystems with mkfs',
    theory: [
      '"mkfs" writes a filesystem onto a partition, the step that turns raw storage into something the kernel can mount and use. "mkfs -t ext4 /dev/sdb1" formats the first partition of /dev/sdb with ext4 — the same default filesystem most Ubuntu installs use for their root partition.',
      'You can also invoke it as "mkfs.ext4 /dev/sdb1" — both forms are equivalent. Common alternatives include xfs (used heavily in enterprise/RHEL contexts) and vfat (for removable media that needs Windows compatibility).',
      'This is a destructive operation on real hardware — formatting a partition erases anything already on it, which is why fdisk/parted exploration always comes first.'
    ],
    commands: [
      { cmd: 'mkfs -t ext4 /dev/sdb1', desc: 'Format the partition with ext4' },
      { cmd: 'fdisk -l', desc: 'Confirm /dev/sdb1 now shows as an ext4 Linux filesystem' }
    ],
    hints: [
      '"-t ext4" tells mkfs which filesystem type to write; "mkfs.ext4 /dev/sdb1" is equivalent shorthand.',
      'Re-run "fdisk -l" afterward — the partition line should now mention "ext4".'
    ],
    challenge: {
      prompt: 'Format /dev/sdb1 with ext4 using mkfs, then confirm it with fdisk -l.',
      check: (state) =>
        state.filesystems['/dev/sdb1'] === 'ext4' &&
        historyIncludes(state, (l) => l.startsWith('fdisk') && l.includes('-l'))
    }
  },
  {
    id: 'permissions-audit',
    tag: '6.7',
    title: 'Auditing Permissions Across a Tree',
    theory: [
      'find (from Module 1) becomes a security tool once you point it at permission questions: "find /home/student -type f" lists every plain file under a path, which is exactly the starting point for a manual permissions review before "-perm" style filtering.',
      'World-writable directories are one of the most common misconfigurations to hunt for — anyone can create or overwrite files there, and without a sticky bit (Module 6.4), anyone can delete each other\'s files too. Combining "ls -l" across a few key paths is often enough to spot the ones that need tightening.'
    ],
    commands: [
      { cmd: 'find /home/student -type f', desc: 'List every plain file in your home directory' },
      { cmd: 'ls -l /tmp', desc: 'Re-check /tmp\'s permissions and special bits' },
      { cmd: 'ls -l /home/student/scripts', desc: 'Review permissions across the scripts directory' }
    ],
    hints: [
      '"find <path> -type f" is the quickest way to enumerate every regular file under a directory.',
      'A directory that\'s world-writable without a sticky bit is worth flagging in a real audit.'
    ],
    challenge: {
      prompt: 'Use find to list every file under /home/student, then review /tmp and ~/scripts with ls -l.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('find') && l.includes('-type f')) &&
        historyIncludes(state, (l) => l.startsWith('ls') && l.includes('/tmp')) &&
        historyIncludes(state, (l) => l.startsWith('ls') && l.includes('scripts'))
    }
  },
  {
    id: 'permissions-capstone',
    tag: '6.8',
    title: 'Capstone: Provision a New Data Volume',
    theory: [
      'This models a realistic "attach new storage" task end to end: partition awareness, formatting, a sane default umask for whatever gets written there, and a symlink so the rest of the system can reach it through a friendly, stable path.',
      'Real sysadmin work almost always chains these steps together rather than using them in isolation — that\'s the habit this capstone is building.'
    ],
    commands: [
      { cmd: 'fdisk -l', desc: 'Confirm /dev/sdc is available' },
      { cmd: 'mkfs -t ext4 /dev/sdc1', desc: 'Format the new partition' },
      { cmd: 'umask 027', desc: 'Tighten default permissions for anything created next' },
      { cmd: 'cd ~', desc: 'Return home' },
      { cmd: 'mkdir data_volume', desc: 'Create a mount-point-style directory' },
      { cmd: 'ln -s data_volume current_data', desc: 'Add a friendly symlink to it' }
    ],
    hints: [
      'Format /dev/sdc1 (not /dev/sdb1, which the earlier lesson already used).',
      'The symlink should point at the directory you just created, not at the raw device.'
    ],
    challenge: {
      prompt: 'Format /dev/sdc1, tighten the umask to 027, create data_volume, and symlink current_data to it.',
      check: (state) => {
        const link = getNode(state.root, ['home', 'student', 'current_data']);
        const dataDir = getNode(state.root, ['home', 'student', 'data_volume']);
        return state.filesystems['/dev/sdc1'] === 'ext4' &&
          state.umask === '027' &&
          !!dataDir && dataDir.type === 'dir' &&
          !!link && link.type === 'symlink' && link.target.includes('data_volume');
      }
    }
  },
  {
    id: 'sudo-least-privilege',
    tag: '7.1',
    title: 'sudo & the Principle of Least Privilege',
    theory: [
      'Logging in directly as root is a bad habit — every mistake happens with full system power behind it. "sudo" instead lets a trusted, ordinary user temporarily run a single command as root, then immediately drops back to their normal privileges. That one-command-at-a-time model is the principle of least privilege in practice.',
      'Only users in the right group (usually "sudo" on Ubuntu) can use it at all — everyone else gets refused with a warning that the attempt is logged. "sudo -l" lists what a user is permitted to run before you actually run anything.'
    ],
    commands: [
      { cmd: 'whoami', desc: 'Confirm you are the student user' },
      { cmd: 'sudo whoami', desc: 'Run the same command elevated — notice the answer changes to root' },
      { cmd: 'sudo -l', desc: 'List what you\'re permitted to run with sudo' }
    ],
    hints: [
      'Compare "whoami" and "sudo whoami" directly — the only difference is the momentary privilege level, not the user you\'re logged in as.',
      '"sudo -l" is always safe to run first — it just lists permissions, it doesn\'t execute anything.'
    ],
    challenge: {
      prompt: 'Run whoami, then sudo whoami, then sudo -l.',
      check: (state) =>
        historyIncludes(state, (l) => l === 'whoami') &&
        historyIncludes(state, (l) => l.startsWith('sudo') && l.includes('whoami')) &&
        historyIncludes(state, (l) => l.startsWith('sudo') && l.includes('-l'))
    }
  },
  {
    id: 'ufw-firewall',
    tag: '7.2',
    title: 'Simple Firewalling with ufw',
    theory: [
      '"ufw" (Uncomplicated Firewall) is a friendlier front end over iptables/nftables (Module 3) for exactly the cases most servers actually need: allow this port, deny that one. "ufw enable" turns it on, "ufw allow 22" opens SSH, "ufw deny 23" blocks the (insecure, ancient) telnet port.',
      '"ufw status" shows every rule currently in effect along with whether the firewall is even active — always worth checking after making changes, since a rule added while ufw is disabled won\'t do anything until you enable it.'
    ],
    commands: [
      { cmd: 'ufw enable', desc: 'Turn the firewall on' },
      { cmd: 'ufw allow 22', desc: 'Explicitly allow SSH traffic' },
      { cmd: 'ufw deny 23', desc: 'Explicitly block telnet' },
      { cmd: 'ufw status', desc: 'Review the active rules' }
    ],
    hints: [
      'Rules you add before "ufw enable" still get remembered, but check "ufw status" to confirm the firewall itself is active.',
      '"ufw allow <port>" and "ufw deny <port>" are the two rule types you\'ll use most.'
    ],
    challenge: {
      prompt: 'Enable ufw, allow port 22, deny port 23, and check the status.',
      check: (state) =>
        state.ufwEnabled &&
        state.ufwRules.some((r) => r.action === 'allow' && r.target === '22') &&
        state.ufwRules.some((r) => r.action === 'deny' && r.target === '23')
    }
  },
  {
    id: 'fail2ban-intro',
    tag: '7.3',
    title: 'Blocking Brute-Force Attempts with fail2ban',
    theory: [
      'A firewall alone doesn\'t notice repeated failed login attempts from the same address — that\'s fail2ban\'s job. It watches logs (like auth.log) for patterns that look like brute-forcing, and temporarily bans the offending IP by adding a firewall rule automatically.',
      '"fail2ban-client status sshd" shows the sshd jail\'s current ban list. You can also ban or unban an address manually with "fail2ban-client set sshd banip <ip>" — handy for testing, or for reacting immediately to something you spotted yourself.'
    ],
    commands: [
      { cmd: 'fail2ban-client status', desc: 'See the jails fail2ban is running' },
      { cmd: 'fail2ban-client set sshd banip 203.0.113.50', desc: 'Manually ban a suspicious address' },
      { cmd: 'fail2ban-client status sshd', desc: 'Confirm the address now shows in the sshd jail\'s ban list' }
    ],
    hints: [
      '"status" with no jail name lists the jails; "status <jail>" shows details for one specific jail.',
      '"set <jail> banip <ip>" is the manual override for banning an address right now.'
    ],
    challenge: {
      prompt: 'Ban 203.0.113.50 in the sshd jail, then confirm it with fail2ban-client status sshd.',
      check: (state) =>
        state.fail2banBans.includes('203.0.113.50') &&
        historyIncludes(state, (l) => l.startsWith('fail2ban-client') && l.includes('status'))
    }
  },
  {
    id: 'chage-password-aging',
    tag: '7.4',
    title: 'Password Aging with chage',
    theory: [
      '"chage" controls how long a password stays valid before a user is forced to change it. "-M" sets the maximum days a password can be used, "-m" sets a minimum (preventing someone from cycling straight back to their old password), and "-W" sets how many days of warning the user gets before expiry.',
      '"chage -l student" lists the current policy for a user in plain language — always a good way to confirm a change actually took effect.'
    ],
    commands: [
      { cmd: 'chage -l student', desc: 'View the current password aging policy' },
      { cmd: 'chage -M 90 -m 7 -W 14 student', desc: 'Require a change every 90 days, minimum 7 days between changes, 14 days warning' },
      { cmd: 'chage -l student', desc: 'Confirm the new policy is in effect' }
    ],
    hints: [
      '-M is the maximum password age, -m is the minimum, -W is the warning period — all in days.',
      'Run "chage -l student" both before and after to see exactly what changed.'
    ],
    challenge: {
      prompt: 'Set student\'s password policy to max 90 days, min 7 days, and 14 days of warning.',
      check: (state) => {
        const rec = state.passwordAge['student'];
        return !!rec && rec.maxDays === 90 && rec.minDays === 7 && rec.warnDays === 14;
      }
    }
  },
  {
    id: 'auditctl-watch-rules',
    tag: '7.5',
    title: 'Watching Sensitive Files with auditctl',
    theory: [
      'The Linux audit framework can log every read, write, or attribute change to a specific file — invaluable for spotting tampering with something security-critical. "auditctl -w /etc/passwd -p wa -k passwd_changes" watches /etc/passwd for writes and attribute changes ("wa"), tagging any matching event with the key "passwd_changes" so it\'s easy to search for later.',
      '"auditctl -l" lists every watch rule currently active — worth checking after adding one, and definitely worth checking on a server you\'ve just inherited from someone else.'
    ],
    commands: [
      { cmd: 'auditctl -w /etc/passwd -p wa -k passwd_changes', desc: 'Watch /etc/passwd for writes and attribute changes' },
      { cmd: 'auditctl -l', desc: 'List all active audit watch rules' }
    ],
    hints: [
      '"-p wa" means watch for writes and attribute changes; other options include "r" (read) and "x" (execute).',
      '"-k" tags the rule with a searchable label — you\'ll use that same label with ausearch next.'
    ],
    challenge: {
      prompt: 'Add an audit watch on /etc/passwd for writes/attribute-changes, tagged "passwd_changes".',
      check: (state) => state.auditRules.some((r) => r.includes('/etc/passwd') && r.includes('passwd_changes'))
    }
  },
  {
    id: 'ausearch-log-review',
    tag: '7.6',
    title: 'Searching Audit Logs with ausearch',
    theory: [
      '"ausearch" is how you query the audit trail auditctl rules feed into. "ausearch -k passwd_changes" pulls up every event tagged with that key — in a real system, that would include every write to /etc/passwd since the watch rule went active.',
      'Running "ausearch" with no filter at all dumps the full audit log, which is useful context even before any of your own watch rules have fired — for example, seeing exactly what was logged at boot time.'
    ],
    commands: [
      { cmd: 'ausearch', desc: 'Review the full audit log' },
      { cmd: 'ausearch -k passwd_changes', desc: 'Filter for events tagged with your watch rule\'s key' }
    ],
    hints: [
      '"-k <key>" filters to only events tagged with that key from an auditctl -w rule.',
      'No matches yet for "passwd_changes" is expected here — nothing has triggered the watch rule in this lab session.'
    ],
    challenge: {
      prompt: 'Run ausearch to review the full log, then ausearch -k passwd_changes to filter by key.',
      check: (state) =>
        historyIncludes(state, (l) => l === 'ausearch') &&
        historyIncludes(state, (l) => l.startsWith('ausearch') && l.includes('-k'))
    }
  },
  {
    id: 'incident-response-scenario',
    tag: '7.7',
    title: 'Scenario: Responding to a Brute-Force Attempt',
    theory: [
      'A realistic incident: your auth.log shows repeated failed SSH logins from 198.51.100.23. The response combines what this module has covered — confirm SSH is still reachable for legitimate users, then ban the offending address immediately rather than waiting for fail2ban to catch it automatically.',
      'This is the kind of judgment call that separates knowing individual commands from actually operating a server under pressure: which tool answers "is the service still working" versus which tool answers "block this specific attacker right now".'
    ],
    commands: [
      { cmd: 'ufw status', desc: 'Confirm SSH (port 22) is still allowed for legitimate traffic' },
      { cmd: 'fail2ban-client set sshd banip 198.51.100.23', desc: 'Immediately ban the attacking address' },
      { cmd: 'fail2ban-client status sshd', desc: 'Confirm the ban took effect' }
    ],
    hints: [
      'Don\'t block port 22 entirely — the goal is to stop one attacker, not lock out legitimate users too.',
      '"fail2ban-client set sshd banip <ip>" is the direct, immediate way to respond without waiting for automatic detection.'
    ],
    challenge: {
      prompt: 'Ban 198.51.100.23 in the sshd jail while confirming port 22 stays reachable.',
      check: (state) =>
        state.fail2banBans.includes('198.51.100.23') &&
        historyIncludes(state, (l) => l.startsWith('ufw') && l.includes('status'))
    }
  },
  {
    id: 'hardening-capstone',
    tag: '7.8',
    title: 'Capstone: Server Hardening Checklist',
    theory: [
      'This closes out the module with a compact version of a real hardening pass: use sudo rather than root directly, lock the firewall down to only the ports you need, tighten password aging policy, and add an audit watch on a file that should never change quietly.',
      'Notice that "sudo" wraps another command here — "sudo ufw enable" is a completely normal, everyday pattern: the command itself often needs root, and sudo is how an ordinary trusted user is allowed to run it.'
    ],
    commands: [
      { cmd: 'sudo ufw enable', desc: 'Enable the firewall via sudo' },
      { cmd: 'sudo ufw allow 22', desc: 'Allow SSH' },
      { cmd: 'sudo ufw deny 23', desc: 'Block telnet' },
      { cmd: 'chage -M 60 student', desc: 'Tighten password aging to 60 days' },
      { cmd: 'auditctl -w /etc/shadow -p wa -k shadow_watch', desc: 'Watch the shadow password file for changes' }
    ],
    hints: [
      '"sudo ufw enable" runs exactly like "ufw enable" would, just wrapped in sudo — the effect is identical.',
      'Use a different key ("shadow_watch") than the earlier passwd_changes rule so the two watches stay distinguishable.'
    ],
    challenge: {
      prompt: 'Use sudo to enable ufw and set allow/deny rules, tighten student\'s password aging to 60 days, and watch /etc/shadow.',
      check: (state) =>
        state.ufwEnabled &&
        state.ufwRules.some((r) => r.action === 'allow' && r.target === '22') &&
        state.ufwRules.some((r) => r.action === 'deny' && r.target === '23') &&
        state.passwordAge['student']?.maxDays === 60 &&
        state.auditRules.some((r) => r.includes('/etc/shadow') && r.includes('shadow_watch')) &&
        historyIncludes(state, (l) => l.startsWith('sudo'))
    }
  },
  {
    id: 'curl-basics',
    tag: '8.1',
    title: 'curl: Talking to Web Servers Directly',
    theory: [
      '"curl" makes an HTTP request and prints exactly what comes back — no browser rendering, just the raw response. "curl http://webserver01.lab/" fetches the homepage of this lab\'s one simulated web host; "curl http://webserver01.lab/api/status" hits a JSON API endpoint on the same host.',
      'This is the tool behind almost every scripted health check, API integration, and quick "is this thing up" test a sysadmin or developer runs — far more common in daily use than opening a browser.'
    ],
    commands: [
      { cmd: 'curl http://webserver01.lab/', desc: 'Fetch the homepage' },
      { cmd: 'curl http://webserver01.lab/api/status', desc: 'Fetch a JSON API endpoint on the same host' }
    ],
    hints: [
      'webserver01.lab is this lab\'s one simulated reachable web host — the same one used for scp/rsync earlier.',
      'Compare the two responses: one is HTML, the other is JSON — curl just prints whatever the server sends, unmodified.'
    ],
    challenge: {
      prompt: 'Use curl to fetch both the homepage and /api/status from webserver01.lab.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('curl') && l.includes('webserver01.lab/')) &&
        historyIncludes(state, (l) => l.startsWith('curl') && l.includes('/api/status'))
    }
  },
  {
    id: 'curl-headers',
    tag: '8.2',
    title: 'Inspecting Headers with curl -I',
    theory: [
      '"-I" (or "--head") makes curl request only the headers, not the page body — the fastest way to check what server software is running, what content type a resource is, or whether a URL redirects, without downloading the whole response.',
      'The status line at the top ("HTTP/1.1 200 OK") and the "Server:" header are usually the first two things worth checking — together they tell you whether the request even succeeded and what\'s serving it.'
    ],
    commands: [
      { cmd: 'curl -I http://webserver01.lab/', desc: 'Fetch only the headers for the homepage' },
      { cmd: 'curl -I http://webserver01.lab/admin', desc: 'Check a path that responds differently' }
    ],
    hints: [
      '"-I" swaps a full GET for a lightweight HEAD-style request — headers only, no body.',
      'Compare the status codes: the homepage should be 200, but /admin responds differently.'
    ],
    challenge: {
      prompt: 'Use curl -I to inspect the headers of both the homepage and /admin on webserver01.lab.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('curl') && l.includes('-I') && l.includes('webserver01.lab/')) &&
        historyIncludes(state, (l) => l.startsWith('curl') && l.includes('-I') && l.includes('/admin'))
    }
  },
  {
    id: 'wget-downloads',
    tag: '8.3',
    title: 'Downloading Files with wget',
    theory: [
      '"wget" is built for one job: fetch a URL and save it to disk, printing a transcript of the connection and transfer as it goes. "wget http://webserver01.lab/index.html" saves the page as index.html in your current directory — no extra flags needed for the common case.',
      'Where curl is the Swiss-army-knife for talking to APIs and inspecting responses, wget is the straightforward choice specifically for downloading files, and its progress-style output makes it easy to script and log.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Start from home so the download lands somewhere predictable' },
      { cmd: 'wget http://webserver01.lab/index.html', desc: 'Download the homepage to disk' },
      { cmd: 'cat index.html', desc: 'Confirm the saved file has the page content' }
    ],
    hints: [
      'No special flags needed — "wget <url>" saves the resource using its filename from the URL.',
      'Check the file landed with "cat index.html" or "ls index.html" once the download finishes.'
    ],
    challenge: {
      prompt: 'Download http://webserver01.lab/index.html with wget and confirm index.html exists.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'index.html']);
        return !!node && node.type === 'file' && historyIncludes(state, (l) => l.startsWith('wget'));
      }
    }
  },
  {
    id: 'whois-lookup',
    tag: '8.4',
    title: 'Domain Ownership with whois',
    theory: [
      '"whois" queries public domain registration records: who registered a domain, which registrar manages it, and when it was created. "whois ubuntu.com" shows Canonical as the registrant — a quick way to verify who actually controls a domain before trusting it.',
      'Internal lab hostnames like webserver01.lab aren\'t real registered domains, so whois against them correctly returns "no match" — a useful reminder that whois only knows about the public domain registration system, not your local DNS or /etc/hosts entries.'
    ],
    commands: [
      { cmd: 'whois ubuntu.com', desc: 'Look up a real, registered domain' },
      { cmd: 'whois webserver01.lab', desc: 'Try it against a lab-only hostname' }
    ],
    hints: [
      'ubuntu.com and kali.org are both in this lab\'s simulated whois database — try either one.',
      'A "no match" result for webserver01.lab is the correct, expected outcome — it\'s not a real registered domain.'
    ],
    challenge: {
      prompt: 'Run whois against a real domain (ubuntu.com or kali.org) and against webserver01.lab.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('whois') && (l.includes('ubuntu.com') || l.includes('kali.org'))) &&
        historyIncludes(state, (l) => l.startsWith('whois') && l.includes('webserver01.lab'))
    }
  },
  {
    id: 'gobuster-dir-brute-force',
    tag: '8.5',
    title: 'Discovering Hidden Paths with gobuster',
    theory: [
      'A web server rarely advertises every path it serves — "hidden" pages like admin panels, backup files, or exposed config often exist without being linked from anywhere. "gobuster dir -u http://webserver01.lab -w wordlist.txt" brute-forces a list of common path guesses against the target and reports which ones actually respond.',
      'Every result comes with a status code and size — a 200 means the path exists and is accessible, a 403 means it exists but access is blocked. Either way, "found but wasn\'t supposed to be found" is exactly the kind of thing a penetration test or security review is looking for.'
    ],
    commands: [
      { cmd: 'gobuster dir -u http://webserver01.lab -w common.txt', desc: 'Brute-force common paths against the lab web host' }
    ],
    hints: [
      'The wordlist filename itself doesn\'t matter in this lab — gobuster checks a fixed set of realistic paths against the target.',
      'Look for anything beyond the homepage — /admin, /backup.zip, and /.git/config are all worth a second look.'
    ],
    challenge: {
      prompt: 'Run gobuster dir against http://webserver01.lab and find the hidden /admin path.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('gobuster') && l.includes('webserver01.lab')) &&
        state.lastOutput.includes('/admin')
    }
  },
  {
    id: 'nikto-vuln-scan',
    tag: '8.6',
    title: 'Vulnerability Scanning with nikto',
    theory: [
      '"nikto -h webserver01.lab" runs a broad, automated web vulnerability scan — checking for exposed config files, outdated server banners, risky default paths, and other common misconfigurations in one pass, rather than testing each possibility by hand.',
      'Nikto\'s report is a starting point, not a verdict: every finding still needs a human to confirm it\'s real and decide what to do about it — but it\'s a fast way to surface the "obvious" issues before spending time on deeper manual testing.'
    ],
    commands: [
      { cmd: 'nikto -h webserver01.lab', desc: 'Run a vulnerability scan against the lab web host' }
    ],
    hints: [
      '"-h" specifies the target host — same hostname you\'ve been using with curl and gobuster.',
      'Read through the findings — notice they line up with the paths gobuster just found.'
    ],
    challenge: {
      prompt: 'Run nikto against webserver01.lab and review the findings.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('nikto') && l.includes('webserver01.lab')) &&
        state.lastOutput.includes('Nikto')
    }
  },
  {
    id: 'recon-workflow',
    tag: '8.7',
    title: 'Combining Tools into a Recon Workflow',
    theory: [
      'No single tool tells the whole story — a real recon pass layers them: nmap (Module 3) answers "what\'s open", curl answers "what\'s actually being served", and gobuster answers "what else is there that isn\'t linked anywhere". Each tool narrows the picture the previous one couldn\'t finish.',
      'Running them in that order — broad port scan, then targeted requests, then brute-force discovery — avoids wasted effort: there\'s no point brute-forcing paths on a port that isn\'t even open.'
    ],
    commands: [
      { cmd: 'nmap webserver01.lab', desc: 'Start broad: what ports are open?' },
      { cmd: 'curl http://webserver01.lab/', desc: 'Narrow in: what\'s actually being served on port 80?' },
      { cmd: 'gobuster dir -u http://webserver01.lab -w common.txt', desc: 'Dig deeper: what else exists beyond the homepage?' }
    ],
    hints: [
      'This is the same three-step order a real assessment follows: scan, inspect, then brute-force.',
      'Each command narrows the picture — don\'t skip straight to gobuster without confirming the port is even open first.'
    ],
    challenge: {
      prompt: 'Run nmap, then curl, then gobuster against webserver01.lab, in that order.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('nmap') && l.includes('webserver01.lab')) &&
        historyIncludes(state, (l) => l.startsWith('curl') && l.includes('webserver01.lab')) &&
        historyIncludes(state, (l) => l.startsWith('gobuster') && l.includes('webserver01.lab'))
    }
  },
  {
    id: 'recon-capstone',
    tag: '8.8',
    title: 'Capstone: Full Recon Report',
    theory: [
      'This closes out the module — and the curriculum\'s networking/security arc — by running a complete recon pass against webserver01.lab and writing up the findings, exactly like a real engagement report: ownership check, port scan, service inspection, hidden-path discovery, and a vulnerability pass, summarized in one document.',
      'Writing the report with "echo ... > file" then "echo ... >> file" is the same redirection pattern from Module 1 and Module 4\'s capstones — a reminder that the whole curriculum\'s tools compose together, not just the ones from a single module.'
    ],
    commands: [
      { cmd: 'whois webserver01.lab', desc: 'Check domain ownership (expect no match — it\'s a lab-only host)' },
      { cmd: 'nmap webserver01.lab', desc: 'Scan for open ports' },
      { cmd: 'curl http://webserver01.lab/', desc: 'Inspect the homepage' },
      { cmd: 'gobuster dir -u http://webserver01.lab -w common.txt', desc: 'Discover hidden paths' },
      { cmd: 'nikto -h webserver01.lab', desc: 'Run a vulnerability scan' },
      { cmd: "echo 'Recon Report: webserver01.lab' > recon_report.txt", desc: 'Start the report' },
      { cmd: "echo 'Open ports: 22, 80, 443 (nmap)' >> recon_report.txt", desc: 'Record the port scan result' },
      { cmd: "echo 'Hidden paths: /admin, /backup.zip, /.git/config (gobuster)' >> recon_report.txt", desc: 'Record the discovered paths' },
      { cmd: "echo 'Findings: exposed git config, public backup archive (nikto)' >> recon_report.txt", desc: 'Record the vulnerability findings' },
      { cmd: 'cat recon_report.txt', desc: 'Review the finished report' }
    ],
    hints: [
      'Work through the tools in order — whois, nmap, curl, gobuster, nikto — before you start writing the report.',
      'The first "echo" line must use ">" to create the file; every line after that uses ">>" to append.'
    ],
    challenge: {
      prompt: 'Run whois, nmap, curl, gobuster, and nikto against webserver01.lab, then write the findings to recon_report.txt.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'recon_report.txt']);
        const built = !!node && node.type === 'file' && node.content.includes('nmap') && node.content.includes('gobuster');
        return built &&
          historyIncludes(state, (l) => l.startsWith('whois') && l.includes('webserver01.lab')) &&
          historyIncludes(state, (l) => l.startsWith('nmap') && l.includes('webserver01.lab')) &&
          historyIncludes(state, (l) => l.startsWith('curl') && l.includes('webserver01.lab')) &&
          historyIncludes(state, (l) => l.startsWith('gobuster') && l.includes('webserver01.lab')) &&
          historyIncludes(state, (l) => l.startsWith('nikto') && l.includes('webserver01.lab'));
      }
    }
  },
  {
    id: 'git-init',
    tag: '9.1',
    title: 'git init: Starting a Repository',
    theory: [
      'A version control system tracks every change made to a project over time, who made it, and why — letting you go back, compare, and collaborate without fear of losing work. Git is by far the most widely used one, and nearly every professional codebase depends on it.',
      '"git init" turns an ordinary directory into a git repository by creating a hidden ".git" folder that stores the entire history. Nothing about your files changes — git just starts watching. "git status" is the single most important command in git: it always tells you exactly what state the repository is in.'
    ],
    commands: [
      { cmd: 'mkdir ~/myproject', desc: 'Create a new project directory' },
      { cmd: 'cd ~/myproject', desc: 'Move into it' },
      { cmd: 'git init', desc: 'Turn it into a git repository' },
      { cmd: 'git status', desc: 'Check the repository\'s current state' }
    ],
    hints: [
      '"git init" only needs to run once per project — it creates the hidden .git folder that stores everything.',
      '"git status" is safe to run constantly — it never changes anything, it only reports.'
    ],
    challenge: {
      prompt: 'Create ~/myproject and initialize it as a git repository.',
      check: (state) => !!state.gitRepos['/home/student/myproject']
    }
  },
  {
    id: 'git-add-commit',
    tag: '9.2',
    title: 'Staging & Your First Commit',
    theory: [
      'Git works in two steps: "git add" moves changes into the staging area (a draft of what your next commit will contain), and "git commit" permanently records that staged snapshot into the project\'s history with a message explaining why.',
      'This two-step design is deliberate — it lets you build up a commit from exactly the changes you want, even if you\'ve edited several unrelated files at once. "git status" shows you what\'s staged (green, "to be committed") versus what\'s still just sitting in your working directory.'
    ],
    commands: [
      { cmd: 'cd ~/myproject', desc: 'Make sure you\'re in the repository' },
      { cmd: "echo '# My Project' > README.md", desc: 'Create a file to track' },
      { cmd: 'git status', desc: 'See README.md listed as untracked' },
      { cmd: 'git add README.md', desc: 'Stage it for commit' },
      { cmd: 'git commit -m "Initial commit"', desc: 'Record the first commit' },
      { cmd: 'git log', desc: 'View the commit you just made' }
    ],
    hints: [
      'A file has to be staged with "git add" before "git commit" will include it.',
      'The "-m" flag lets you write the commit message inline instead of opening an editor.'
    ],
    challenge: {
      prompt: 'Create README.md, stage it, and commit it with the message "Initial commit".',
      check: (state) => {
        const repo = state.gitRepos['/home/student/myproject'];
        return !!repo && Object.keys(repo.commits).length >= 1 && !!repo.branches.main;
      }
    }
  },
  {
    id: 'git-log-history',
    tag: '9.3',
    title: 'Viewing History with git log',
    theory: [
      '"git log" shows the full commit history of the current branch, newest first — each entry with its unique hash, author, date, and message. This is how you (or a teammate) can understand why the code looks the way it does, one deliberate step at a time.',
      '"git log --oneline" condenses each commit to a single line (a short hash plus the message) — the version you\'ll reach for most often once a project has more than a few commits.'
    ],
    commands: [
      { cmd: 'cd ~/myproject', desc: 'Make sure you\'re in the repository' },
      { cmd: "echo 'This project demonstrates git basics.' >> README.md", desc: 'Add a second line to README.md' },
      { cmd: 'git add README.md', desc: 'Stage the change' },
      { cmd: 'git commit -m "Add more info"', desc: 'Commit it' },
      { cmd: 'git log', desc: 'View the full history so far' },
      { cmd: 'git log --oneline', desc: 'View the condensed history' }
    ],
    hints: [
      'Every commit needs its own "git add" + "git commit" pair — staging doesn\'t carry over automatically from habit, only from what you\'ve actually run.',
      '"--oneline" is the fastest way to scan a long project history.'
    ],
    challenge: {
      prompt: 'Make a second commit to README.md, then view the history both ways.',
      check: (state) => {
        const repo = state.gitRepos['/home/student/myproject'];
        return !!repo && Object.keys(repo.commits).length >= 2 &&
          historyIncludes(state, (l) => l.trim() === 'git log --oneline');
      }
    }
  },
  {
    id: 'gitignore-basics',
    tag: '9.4',
    title: 'Ignoring Files with .gitignore',
    theory: [
      'Not everything in a project directory belongs in version control — secrets, local config, build output, and temporary files should never be committed. A ".gitignore" file lists patterns for git to skip automatically: "git status" and "git add ." both respect it, so ignored files never show up as untracked clutter.',
      'This matters beyond tidiness — accidentally committing a real secrets file to a shared repository is one of the most common and damaging mistakes in professional software work.'
    ],
    commands: [
      { cmd: 'cd ~/myproject', desc: 'Make sure you\'re in the repository' },
      { cmd: "echo 'secrets.txt' > .gitignore", desc: 'Tell git to ignore secrets.txt' },
      { cmd: 'touch secrets.txt', desc: 'Create the file that should be ignored' },
      { cmd: 'git status', desc: 'Notice secrets.txt does NOT appear as untracked' },
      { cmd: 'git add .gitignore', desc: 'Stage the .gitignore file itself' },
      { cmd: 'git commit -m "Add gitignore"', desc: 'Commit it' }
    ],
    hints: [
      'The .gitignore file itself should be committed — it\'s the ignored files that stay out of the repository, not the list of them.',
      'Run "git status" right after creating secrets.txt — it should be invisible, not just unstaged.'
    ],
    challenge: {
      prompt: 'Add secrets.txt to .gitignore, then commit the .gitignore file.',
      check: (state) => {
        const repo = state.gitRepos['/home/student/myproject'];
        const secretsExists = !!getNode(state.root, ['home', 'student', 'myproject', 'secrets.txt']);
        if (!repo || !secretsExists) return false;
        const headHash = repo.branches[repo.branch];
        const headFiles = headHash ? repo.commits[headHash].files : {};
        return '.gitignore' in headFiles && !('secrets.txt' in headFiles);
      }
    }
  },
  {
    id: 'git-diff',
    tag: '9.5',
    title: 'Reviewing Changes with git diff',
    theory: [
      '"git diff" shows exactly what\'s changed but not yet staged — lines removed marked with "-", lines added marked with "+". Reading a diff before staging is the habit that catches typos, leftover debug lines, and accidental changes before they become part of the permanent history.',
      '"git diff --staged" (or "--cached") shows the opposite: what\'s staged and about to be committed, compared against the last commit. Checking both before every commit is standard professional practice.'
    ],
    commands: [
      { cmd: 'cd ~/myproject', desc: 'Make sure you\'re in the repository' },
      { cmd: "echo 'More content coming soon.' >> README.md", desc: 'Make an unstaged change' },
      { cmd: 'git diff', desc: 'Review the unstaged change' },
      { cmd: 'git add README.md', desc: 'Stage it' },
      { cmd: 'git diff --staged', desc: 'Review what\'s about to be committed' }
    ],
    hints: [
      'Plain "git diff" shows unstaged changes; "git diff --staged" shows what staging already captured.',
      'Lines prefixed "+" were added, lines prefixed "-" were removed — no prefix means unchanged.'
    ],
    challenge: {
      prompt: 'Make a change to README.md and review it with both git diff and git diff --staged.',
      check: (state) =>
        historyIncludes(state, (l) => l.trim() === 'git diff') &&
        historyIncludes(state, (l) => l.startsWith('git diff') && l.includes('--staged'))
    }
  },
  {
    id: 'git-branching',
    tag: '9.6',
    title: 'Branching: git branch & checkout -b',
    theory: [
      'A branch is an independent line of development — a way to build a feature, fix, or experiment without touching the stable code until you\'re ready. "git branch" lists existing branches (the current one marked with "*"); "git checkout -b <name>" creates a new branch AND switches to it in one step.',
      'Under the hood a branch is just a movable pointer to a commit — creating one is instant and nearly free, which is exactly why git-based teams create branches constantly, for even small changes.'
    ],
    commands: [
      { cmd: 'cd ~/myproject', desc: 'Make sure you\'re in the repository' },
      { cmd: 'git branch', desc: 'See your current branches (just "main" so far)' },
      { cmd: 'git checkout -b feature-login', desc: 'Create and switch to a new branch' },
      { cmd: 'git branch', desc: 'Confirm feature-login now exists and is checked out' }
    ],
    hints: [
      '"git checkout -b <name>" is shorthand for "git branch <name>" followed by "git checkout <name>".',
      'The branch marked with "*" in "git branch" output is the one you\'re currently on.'
    ],
    challenge: {
      prompt: 'Create and switch to a new branch called feature-login.',
      check: (state) => {
        const repo = state.gitRepos['/home/student/myproject'];
        return !!repo && repo.branch === 'feature-login' && 'feature-login' in repo.branches;
      }
    }
  },
  {
    id: 'git-commit-on-branch',
    tag: '9.7',
    title: 'Committing on a Branch',
    theory: [
      'Once you\'re on a branch, commits work exactly the same as before — add, then commit — but now they build up history that\'s specific to that branch. The main branch stays exactly as it was, untouched, while feature-login moves ahead on its own.',
      'This is the whole point of branching: multiple lines of work can progress independently, and nothing merges together until you explicitly decide it should.'
    ],
    commands: [
      { cmd: 'cd ~/myproject', desc: 'Make sure you\'re on feature-login' },
      { cmd: "echo 'Login feature in progress.' >> README.md", desc: 'Make a change specific to this feature' },
      { cmd: 'git add README.md', desc: 'Stage it' },
      { cmd: 'git commit -m "Start login feature"', desc: 'Commit it to feature-login' },
      { cmd: 'git log --oneline', desc: 'See this new commit at the top of feature-login\'s history' }
    ],
    hints: [
      'This commit only exists on feature-login right now — main hasn\'t seen it.',
      'Compare "git log --oneline" here to what you\'d see on main — they\'ve diverged.'
    ],
    challenge: {
      prompt: 'Commit a change on feature-login so it diverges from main.',
      check: (state) => {
        const repo = state.gitRepos['/home/student/myproject'];
        return !!repo && !!repo.branches['feature-login'] && repo.branches['feature-login'] !== repo.branches['main'];
      }
    }
  },
  {
    id: 'git-switching-branches',
    tag: '9.8',
    title: 'Switching Between Branches',
    theory: [
      '"git checkout <branch>" switches your working directory to reflect that branch\'s files exactly as they were last committed there — this lab actually rewrites the files on disk when you switch, just like real git does. Any committed changes on feature-login simply aren\'t visible while you\'re on main, and vice versa.',
      'This is why branches feel "safe": switching back to main genuinely hides work-in-progress from the stable line, rather than just labeling it.'
    ],
    commands: [
      { cmd: 'cd ~/myproject', desc: 'Make sure you\'re in the repository' },
      { cmd: 'git checkout main', desc: 'Switch back to main' },
      { cmd: 'cat README.md', desc: 'Notice the login feature line is missing here' },
      { cmd: 'git checkout feature-login', desc: 'Switch back to the feature branch' },
      { cmd: 'cat README.md', desc: 'The login feature line is back' }
    ],
    hints: [
      'Compare the two "cat README.md" outputs carefully — that\'s branching made visible.',
      'End on feature-login so the next lesson\'s merge starts from a known state.'
    ],
    challenge: {
      prompt: 'Switch to main, then back to feature-login, comparing README.md each time.',
      check: (state) => {
        const repo = state.gitRepos['/home/student/myproject'];
        return !!repo && repo.branch === 'feature-login' &&
          historyIncludes(state, (l) => l.trim() === 'git checkout main');
      }
    }
  },
  {
    id: 'git-fast-forward-merge',
    tag: '9.9',
    title: 'Merging: The Fast-Forward Case',
    theory: [
      '"git merge <branch>" brings another branch\'s commits into your current branch. When your current branch hasn\'t moved since the other one split off, git can do a "fast-forward" merge — it just slides the branch pointer forward, no new merge commit needed, because there was never any actual divergence to reconcile.',
      'This is the simplest, cleanest kind of merge, and the one you\'ll hit most often for small, quickly-finished features.'
    ],
    commands: [
      { cmd: 'cd ~/myproject', desc: 'Make sure you\'re in the repository' },
      { cmd: 'git checkout main', desc: 'Switch to main, the merge target' },
      { cmd: 'git merge feature-login', desc: 'Merge the finished feature into main' },
      { cmd: 'git log --oneline', desc: 'Confirm the login feature commit is now part of main\'s history' }
    ],
    hints: [
      'You merge INTO whichever branch you\'re currently on — check out main first.',
      '"Fast-forward" in the output means no divergence needed reconciling — a clean, simple merge.'
    ],
    challenge: {
      prompt: 'Merge feature-login into main.',
      check: (state) => {
        const repo = state.gitRepos['/home/student/myproject'];
        return !!repo && repo.branch === 'main' && repo.branches.main === repo.branches['feature-login'];
      }
    }
  },
  {
    id: 'git-merge-conflict',
    tag: '9.10',
    title: 'Merge Conflicts',
    theory: [
      'A conflict happens when two branches change the exact same part of a file in different ways — git can\'t guess which version you want, so it stops and asks you to decide. This is expected, normal git behavior, not a sign something went wrong.',
      'When it happens, git writes both versions directly into the file using conflict markers: everything between "<<<<<<< HEAD" and "=======" is your current branch\'s version, everything between "=======" and ">>>>>>> branch-name" is the incoming branch\'s version.'
    ],
    commands: [
      { cmd: 'cd ~/myproject', desc: 'Make sure you\'re on main' },
      { cmd: 'git checkout -b hotfix', desc: 'Branch off for an urgent fix' },
      { cmd: "echo 'HOTFIX: urgent patch applied.' > README.md", desc: 'Overwrite README.md on hotfix' },
      { cmd: 'git add README.md', desc: 'Stage it' },
      { cmd: 'git commit -m "Hotfix readme"', desc: 'Commit on hotfix' },
      { cmd: 'git checkout main', desc: 'Switch back to main' },
      { cmd: "echo 'MAIN: routine update.' > README.md", desc: 'Overwrite README.md differently on main' },
      { cmd: 'git add README.md', desc: 'Stage it' },
      { cmd: 'git commit -m "Update readme on main"', desc: 'Commit on main' },
      { cmd: 'git merge hotfix', desc: 'Try to merge — this will conflict' }
    ],
    hints: [
      'Both branches changed the exact same line of README.md differently — that\'s precisely what triggers a conflict.',
      'The merge command reporting a conflict isn\'t an error you caused — it\'s git correctly asking for your judgment.'
    ],
    challenge: {
      prompt: 'Set up and trigger a merge conflict between main and hotfix on README.md.',
      check: (state) => {
        const repo = state.gitRepos['/home/student/myproject'];
        return !!repo && repo.mergingBranch === 'hotfix' && repo.conflictFiles.includes('README.md');
      }
    }
  },
  {
    id: 'git-resolve-conflict',
    tag: '9.11',
    title: 'Resolving a Merge Conflict',
    theory: [
      'Resolving a conflict means editing the file to keep exactly what you want — removing the "<<<<<<<", "=======", and ">>>>>>>" markers entirely, since they\'re not part of either version, just git\'s way of showing you both. Once the file looks the way it should, stage it and commit as usual.',
      '"git commit" after a conflicted merge doesn\'t need a "-m" changing anything about the process — it\'s the same command, and it finishes the merge, creating a commit that ties both histories back together.'
    ],
    commands: [
      { cmd: 'cd ~/myproject', desc: 'Make sure you\'re in the repository' },
      { cmd: 'cat README.md', desc: 'See the conflict markers from both versions' },
      { cmd: "echo 'RESOLVED: combined hotfix and main updates.' > README.md", desc: 'Replace the conflicted content with your resolution' },
      { cmd: 'git add README.md', desc: 'Mark the conflict as resolved' },
      { cmd: 'git commit -m "Merge hotfix into main"', desc: 'Complete the merge' },
      { cmd: 'git log --oneline', desc: 'Confirm the merge commit is now in the history' }
    ],
    hints: [
      'Make sure none of the <<<<<<<, =======, or >>>>>>> marker lines remain in your resolved version.',
      '"git add" here means "I\'ve resolved this conflict," not just "stage a normal change."'
    ],
    challenge: {
      prompt: 'Resolve the README.md conflict and complete the merge with a commit.',
      check: (state) => {
        const repo = state.gitRepos['/home/student/myproject'];
        return !!repo && repo.mergingBranch === null && repo.conflictFiles.length === 0 &&
          historyIncludes(state, (l) => l.startsWith('git commit') && l.includes('Merge hotfix'));
      }
    }
  },
  {
    id: 'git-stash',
    tag: '9.12',
    title: 'Setting Changes Aside with git stash',
    theory: [
      'Sometimes you\'re mid-change and need to switch tasks urgently — but you\'re not ready to commit yet. "git stash" saves your uncommitted changes onto a shelf and restores your working directory to a clean state, so you can switch branches or pull updates without losing anything or committing half-finished work.',
      '"git stash pop" brings the most recently stashed changes back, exactly as they were, and removes them from the stash — the changes were never lost, just set aside.'
    ],
    commands: [
      { cmd: 'cd ~/myproject', desc: 'Make sure you\'re in the repository' },
      { cmd: "echo 'WIP: experimenting with a new idea.' >> README.md", desc: 'Make an uncommitted change' },
      { cmd: 'git status', desc: 'See it listed as a change' },
      { cmd: 'git stash', desc: 'Shelve the change and clean the working directory' },
      { cmd: 'git status', desc: 'Confirm the working directory is clean again' },
      { cmd: 'git stash pop', desc: 'Bring the change back' }
    ],
    hints: [
      '"git stash" is for changes you\'re not ready to commit yet — it\'s temporary, not permanent history.',
      '"git stash pop" restores AND removes the stash entry in one step.'
    ],
    challenge: {
      prompt: 'Stash an uncommitted change, confirm the working directory is clean, then pop it back.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'myproject', 'README.md']);
        return !!node && node.type === 'file' && node.content.includes('WIP: experimenting') &&
          historyIncludes(state, (l) => l.trim() === 'git stash') &&
          historyIncludes(state, (l) => l.trim() === 'git stash pop');
      }
    }
  },
  {
    id: 'git-remote-clone',
    tag: '9.13',
    title: 'Remotes & Cloning',
    theory: [
      'A "remote" is another copy of the repository, usually hosted elsewhere, that your local repo can sync with. "git remote add origin <url>" registers one under a name (almost always "origin" by convention); "git remote -v" shows what\'s registered.',
      '"git clone <url>" is how you get a completely fresh local copy of an existing remote repository — full history included, ready to work in immediately.'
    ],
    commands: [
      { cmd: 'cd ~/myproject', desc: 'Make sure you\'re in the repository' },
      { cmd: 'git remote add origin https://git.lab/myproject.git', desc: 'Register a remote named origin' },
      { cmd: 'git remote -v', desc: 'Confirm it\'s registered for both fetch and push' },
      { cmd: 'cd ~', desc: 'Move somewhere new' },
      { cmd: 'git clone https://git.lab/demo-repo.git', desc: 'Clone a fresh repository from this lab\'s simulated remote' },
      { cmd: 'cat demo-repo/README.md', desc: 'Confirm the cloned repo has its own history and files' }
    ],
    hints: [
      '"origin" is just a conventional name, not a keyword — but nearly everyone uses it for their primary remote.',
      'A cloned repo already has commits and a remote set up — no "git init" needed.'
    ],
    challenge: {
      prompt: 'Register a remote for myproject, then clone a separate demo-repo.',
      check: (state) => {
        const myproject = state.gitRepos['/home/student/myproject'];
        const cloned = state.gitRepos['/home/student/demo-repo'];
        return !!myproject && !!myproject.remotes.origin && !!cloned;
      }
    }
  },
  {
    id: 'git-push-pull',
    tag: '9.14',
    title: 'Syncing with git push & git pull',
    theory: [
      '"git push" sends your local commits up to a remote, and "git pull" brings a remote\'s commits down into your local branch — together, they\'re how a team stays in sync without emailing files back and forth. Push after you commit something worth sharing; pull before you start new work, so you\'re building on the latest version.',
      'A remote has to be registered first (Module 9.13) before push or pull can target it — that\'s exactly what "origin" was for.'
    ],
    commands: [
      { cmd: 'cd ~/myproject', desc: 'Make sure you\'re in the repository' },
      { cmd: 'git push origin main', desc: 'Send your local commits to the remote' },
      { cmd: 'git pull origin main', desc: 'Pull down anything new from the remote' }
    ],
    hints: [
      'The pattern is always "git push/pull <remote> <branch>" — "origin main" is the most common combination.',
      'A remote must exist (via "git remote add") before push or pull will work against it.'
    ],
    challenge: {
      prompt: 'Push then pull myproject\'s main branch to/from origin.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('git push') && l.includes('origin')) &&
        historyIncludes(state, (l) => l.startsWith('git pull') && l.includes('origin'))
    }
  },
  {
    id: 'git-capstone',
    tag: '9.15',
    title: 'Capstone: A Complete Git Workflow',
    theory: [
      'This closes out the module by running the entire workflow end to end on a brand new project: initialize, make an initial commit, branch for a feature, commit the feature\'s work, then merge it back — the exact rhythm real teams repeat dozens of times a day.',
      'Notice how little new syntax this actually needs — every command here was covered earlier in the module. Fluency with git comes from repeating this same core loop until it\'s automatic.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Start from home' },
      { cmd: 'mkdir capstone-app', desc: 'Create a brand new project' },
      { cmd: 'cd capstone-app', desc: 'Move into it' },
      { cmd: 'git init', desc: 'Initialize the repository' },
      { cmd: "echo '# Capstone App' > README.md", desc: 'Create an initial file' },
      { cmd: 'git add .', desc: 'Stage everything' },
      { cmd: 'git commit -m "Initial commit"', desc: 'Make the first commit' },
      { cmd: 'git checkout -b feature-x', desc: 'Branch for a new feature' },
      { cmd: "echo 'Feature X implemented.' >> README.md", desc: 'Do the feature work' },
      { cmd: 'git add .', desc: 'Stage it' },
      { cmd: 'git commit -m "Add feature x"', desc: 'Commit the feature' },
      { cmd: 'git checkout main', desc: 'Switch back to main' },
      { cmd: 'git merge feature-x', desc: 'Merge the finished feature in' },
      { cmd: 'git log --oneline', desc: 'Review the completed history' }
    ],
    hints: [
      '"git add ." stages every changed file in the current directory, rather than naming each one.',
      'This is the same init → commit → branch → commit → merge loop from the whole module, just on a fresh project.'
    ],
    challenge: {
      prompt: 'Build capstone-app from scratch: init, initial commit, a feature branch, a feature commit, and a merge back to main.',
      check: (state) => {
        const repo = state.gitRepos['/home/student/capstone-app'];
        if (!repo) return false;
        return repo.branch === 'main' &&
          !!repo.branches['feature-x'] &&
          repo.branches.main === repo.branches['feature-x'] &&
          Object.keys(repo.commits).length >= 2;
      }
    }
  },
  {
    id: 'docker-intro',
    tag: '10.1',
    title: 'What Is a Container?',
    theory: [
      'A container packages an application together with everything it needs to run — libraries, dependencies, configuration — into one portable unit that behaves the same on any machine. Unlike a full virtual machine, it shares the host\'s kernel, which makes containers start in a second or two instead of minutes and use a fraction of the resources.',
      'Docker is the tool that made containers mainstream: it defines a standard format for packaging (images), running (containers), and sharing (registries) them. "docker info" gives you a quick snapshot of your local Docker environment.'
    ],
    commands: [
      { cmd: 'docker --version', desc: 'Confirm Docker is available' },
      { cmd: 'docker info', desc: 'See a summary of the local Docker environment' }
    ],
    hints: [
      'A container is not a lightweight VM — it shares the host kernel, which is exactly why it\'s so much faster to start.',
      '"docker info" is a good first command any time you\'re troubleshooting a Docker setup.'
    ],
    challenge: {
      prompt: 'Check the Docker version and view the environment info.',
      check: (state) =>
        historyIncludes(state, (l) => l.trim() === 'docker --version') &&
        historyIncludes(state, (l) => l.trim() === 'docker info')
    }
  },
  {
    id: 'docker-pull-images',
    tag: '10.2',
    title: 'Pulling Images',
    theory: [
      'An image is a read-only template a container is created from — think of it as a snapshot of a filesystem plus instructions for what to run. "docker pull nginx" downloads the official nginx image from a registry (Docker Hub by default) to your machine.',
      '"docker images" lists everything you\'ve pulled locally, along with its size and a short image ID — useful for seeing exactly what\'s taking up space or which version of something you actually have.'
    ],
    commands: [
      { cmd: 'docker pull nginx', desc: 'Download the nginx image' },
      { cmd: 'docker pull redis', desc: 'Download the redis image too' },
      { cmd: 'docker images', desc: 'See both images listed locally' }
    ],
    hints: [
      'Pulling doesn\'t run anything yet — it just downloads the image so it\'s ready to use.',
      'Without a tag, "nginx" means "nginx:latest" by convention.'
    ],
    challenge: {
      prompt: 'Pull the nginx and redis images, then list your local images.',
      check: (state) =>
        state.dockerImages.some((i) => i.repository === 'nginx') &&
        state.dockerImages.some((i) => i.repository === 'redis')
    }
  },
  {
    id: 'docker-run-detached',
    tag: '10.3',
    title: 'Running a Container',
    theory: [
      '"docker run" creates and starts a container from an image. "-d" runs it detached (in the background, handing you your prompt back immediately) — essential for anything long-running like a web server, since otherwise it would occupy your terminal.',
      '"--name" gives the container a memorable name instead of a random one — you\'ll use that name in almost every command that follows to refer back to it.'
    ],
    commands: [
      { cmd: 'docker run -d --name web nginx', desc: 'Start an nginx container in the background, named "web"' }
    ],
    hints: [
      'Without "-d", a long-running service container would tie up your terminal indefinitely.',
      '"--name web" means you can now say "web" instead of a random container ID in every future command.'
    ],
    challenge: {
      prompt: 'Run an nginx container in detached mode named "web".',
      check: (state) => {
        const c = state.dockerContainers.find((x) => x.name === 'web');
        return !!c && c.status === 'running';
      }
    }
  },
  {
    id: 'docker-ps',
    tag: '10.4',
    title: 'Inspecting Running Containers',
    theory: [
      '"docker ps" lists currently running containers — ID, image, status, ports, and name, at a glance. "docker ps -a" (all) additionally shows stopped and exited containers, which is essential for finding something that crashed or finished running.',
      'These two commands together are the single most common way to answer "what\'s actually running on this machine right now?"'
    ],
    commands: [
      { cmd: 'docker ps', desc: 'See only running containers' },
      { cmd: 'docker ps -a', desc: 'See every container, running or not' }
    ],
    hints: [
      'Plain "docker ps" hides stopped containers — add "-a" to see the complete picture.',
      'Your "web" container from the previous lesson should show up as running here.'
    ],
    challenge: {
      prompt: 'List running containers, then list all containers including stopped ones.',
      check: (state) =>
        historyIncludes(state, (l) => l.trim() === 'docker ps') &&
        historyIncludes(state, (l) => l.trim() === 'docker ps -a')
    }
  },
  {
    id: 'docker-oneoff-run',
    tag: '10.5',
    title: 'One-Off Containers',
    theory: [
      'Not every container runs forever — a container built to run a single command finishes and exits the moment that command completes, exactly like running a script. This is a completely normal and common pattern: quick utility tasks, one-time data processing jobs, or testing something in an isolated environment.',
      '"docker run ubuntu echo hello" starts a fresh ubuntu container, runs "echo hello" inside it, and exits immediately — no "-d" needed because there\'s nothing long-running to detach from.'
    ],
    commands: [
      { cmd: 'docker run ubuntu echo "hello from a container"', desc: 'Run a single command in a fresh container and let it exit' },
      { cmd: 'docker ps -a', desc: 'Notice this container shows as Exited, not Up' }
    ],
    hints: [
      'A container that just runs one command and exits isn\'t broken — that\'s expected behavior for a one-off task.',
      'Compare this container\'s status in "docker ps -a" to "web"\'s — one is Up, one is Exited.'
    ],
    challenge: {
      prompt: 'Run a one-off ubuntu container that echoes a message, then confirm it exited.',
      check: (state) => state.dockerContainers.some((c) => c.image.startsWith('ubuntu') && c.status === 'exited')
    }
  },
  {
    id: 'docker-lifecycle',
    tag: '10.6',
    title: 'Container Lifecycle: stop & start',
    theory: [
      '"docker stop <container>" gracefully shuts a running container down without deleting it — all its state and configuration remain, ready to resume. "docker start <container>" brings it back up again exactly where it left off.',
      'This distinction — stopped versus removed — matters: stopping is reversible and cheap, while removing (next lesson) is permanent.'
    ],
    commands: [
      { cmd: 'docker stop web', desc: 'Stop the running web container' },
      { cmd: 'docker ps -a', desc: 'Confirm it now shows as Exited' },
      { cmd: 'docker start web', desc: 'Bring it back up' },
      { cmd: 'docker ps', desc: 'Confirm it\'s running again' }
    ],
    hints: [
      'Stopping a container doesn\'t erase it — "docker start" brings the exact same container back.',
      'Check "docker ps -a" after stop and "docker ps" after start to see the status change both ways.'
    ],
    challenge: {
      prompt: 'Stop the web container, confirm it stopped, then start it again.',
      check: (state) => {
        const c = state.dockerContainers.find((x) => x.name === 'web');
        return !!c && c.status === 'running' &&
          historyIncludes(state, (l) => l.trim() === 'docker stop web');
      }
    }
  },
  {
    id: 'docker-remove-containers',
    tag: '10.7',
    title: 'Removing Containers',
    theory: [
      '"docker rm <container>" permanently deletes a container and its state — unlike stop, there\'s no bringing it back afterward. Docker refuses to remove a running container by default, as a safety check: you have to stop it first (or force it with "-f").',
      'Cleaning up finished one-off containers regularly (Module 10.5\'s exited ubuntu container is a good candidate) keeps "docker ps -a" readable and avoids clutter building up over time.'
    ],
    commands: [
      { cmd: 'docker ps -a', desc: 'Find the exited ubuntu container from earlier' },
      { cmd: 'docker rm ubuntu-2', desc: 'Remove it (adjust the name/id to match your ps -a output)' },
      { cmd: 'docker ps -a', desc: 'Confirm it\'s gone' }
    ],
    hints: [
      'You can\'t remove a running container without "-f" — stop it first, which is the safer habit anyway.',
      'Use the exact name or ID shown in your own "docker ps -a" output — it may differ from the example.'
    ],
    challenge: {
      prompt: 'Remove the exited one-off container from Module 10.5.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('docker rm'))
    }
  },
  {
    id: 'docker-logs',
    tag: '10.8',
    title: 'Reading Container Logs',
    theory: [
      '"docker logs <container>" shows everything a container has printed to its standard output and error streams since it started — the first place to look when something isn\'t behaving as expected. For a web server, that\'s access and error logs; for a database, that\'s startup and query logs.',
      'Because containers usually run detached, you can\'t just watch their output scroll by — "docker logs" is how you check in on them after the fact.'
    ],
    commands: [
      { cmd: 'docker run -d --name cache redis', desc: 'Start a redis container in the background' },
      { cmd: 'docker logs cache', desc: 'Check what it printed on startup' }
    ],
    hints: [
      'Detached containers don\'t show their output in your terminal live — "docker logs" is how you catch up.',
      'Different images produce very different-looking logs — a database\'s logs look nothing like a web server\'s.'
    ],
    challenge: {
      prompt: 'Start a redis container named "cache" and check its logs.',
      check: (state) => {
        const c = state.dockerContainers.find((x) => x.name === 'cache');
        return !!c && historyIncludes(state, (l) => l.trim() === 'docker logs cache');
      }
    }
  },
  {
    id: 'docker-exec',
    tag: '10.9',
    title: 'Running Commands Inside a Container: docker exec',
    theory: [
      '"docker exec <container> <command>" runs a command inside an already-running container — without stopping it, without restarting it, just reaching in for a quick look. This is the equivalent of SSHing into a machine, but for a container.',
      'It\'s the standard way to poke around and debug: check what user a process runs as, look at the container\'s filesystem, or inspect a config file exactly as the running application sees it.'
    ],
    commands: [
      { cmd: 'docker exec web whoami', desc: 'Check which user processes run as inside the container' },
      { cmd: 'docker exec web ls', desc: 'List the container\'s root filesystem' }
    ],
    hints: [
      'The container has to already be running — "docker exec" reaches into a live container, it doesn\'t start one.',
      'This is conceptually the same as SSHing into a remote machine, just scoped to one container.'
    ],
    challenge: {
      prompt: 'Use docker exec to run whoami and ls inside the web container.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('docker exec') && l.includes('whoami')) &&
        historyIncludes(state, (l) => l.startsWith('docker exec') && l.includes('ls'))
    }
  },
  {
    id: 'docker-port-mapping',
    tag: '10.10',
    title: 'Exposing Ports',
    theory: [
      'A container\'s network is isolated by default — nothing outside can reach a service running inside it unless you explicitly map a port. "-p 8080:80" means "requests to port 8080 on this machine get forwarded to port 80 inside the container," where 80 is whatever port the containerized app actually listens on.',
      'The order matters: it\'s always "-p hostPort:containerPort". Getting this backwards is one of the most common Docker mistakes.'
    ],
    commands: [
      { cmd: 'docker run -d --name websrv -p 8080:80 nginx', desc: 'Run nginx with port 80 mapped to host port 8080' },
      { cmd: 'docker ps', desc: 'Confirm the port mapping shows up in the listing' }
    ],
    hints: [
      '"-p hostPort:containerPort" — the host port comes first, the container\'s internal port second.',
      'Nginx listens on port 80 by default inside the container, regardless of what host port you map it to.'
    ],
    challenge: {
      prompt: 'Run an nginx container named websrv with port 8080 mapped to the container\'s port 80.',
      check: (state) => {
        const c = state.dockerContainers.find((x) => x.name === 'websrv');
        return !!c && c.ports.includes('8080:80');
      }
    }
  },
  {
    id: 'docker-remove-images',
    tag: '10.11',
    title: 'Removing Images',
    theory: [
      '"docker rmi <image>" deletes a locally stored image to reclaim disk space. Docker protects you here too: it refuses to remove an image that\'s still being used by a container (even a stopped one) unless you force it with "-f" — a safeguard against accidentally deleting something you\'re still relying on.',
      'A typical cleanup routine is: stop and remove containers you no longer need first, then remove the now-unused images behind them.'
    ],
    commands: [
      { cmd: 'docker images', desc: 'See what\'s taking up space locally' },
      { cmd: 'docker rmi busybox', desc: 'Remove an image you\'re not using (pull it first if you haven\'t)' }
    ],
    hints: [
      'If an image is still referenced by any container, Docker will refuse the removal until you deal with that container first.',
      'Pull an image you\'re not using for anything (like busybox) if you want a safe one to practice removing.'
    ],
    challenge: {
      prompt: 'Pull the busybox image, then remove it again with docker rmi.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('docker pull') && l.includes('busybox')) &&
        historyIncludes(state, (l) => l.startsWith('docker rmi') && l.includes('busybox')) &&
        !state.dockerImages.some((i) => i.repository === 'busybox')
    }
  },
  {
    id: 'docker-volumes',
    tag: '10.12',
    title: 'Persisting Data with Volumes',
    theory: [
      'A container\'s own filesystem disappears the moment it\'s removed — fine for the application code, disastrous for a database\'s data. A volume is storage that lives independently of any single container, so data survives container restarts, removals, and upgrades.',
      '"docker volume create <name>" makes one; you\'d then mount it into a container with "-v <name>:/path/in/container" so the app writes there instead of to the container\'s disposable filesystem.'
    ],
    commands: [
      { cmd: 'docker volume create dbdata', desc: 'Create a named volume for persistent data' },
      { cmd: 'docker volume ls', desc: 'Confirm it exists' }
    ],
    hints: [
      'A volume exists independently of any container — that\'s exactly what makes it survive a container being removed.',
      'You\'d attach a volume to a container with "-v dbdata:/var/lib/postgresql/data" or similar, at run time.'
    ],
    challenge: {
      prompt: 'Create a volume named dbdata and confirm it exists.',
      check: (state) => state.dockerVolumes.includes('dbdata')
    }
  },
  {
    id: 'docker-networks',
    tag: '10.13',
    title: 'Container Networks',
    theory: [
      'By default, containers run on a shared "bridge" network and can reach each other, but a custom network lets you group related containers (like a web server and its database) together, with DNS-based discovery — they can reach each other by container name, not just IP.',
      '"docker network create <name>" makes a new isolated network; containers on it can find each other by name, while staying separate from containers on other networks.'
    ],
    commands: [
      { cmd: 'docker network create appnet', desc: 'Create a dedicated network for an application stack' },
      { cmd: 'docker network ls', desc: 'Confirm it exists alongside the default bridge network' }
    ],
    hints: [
      'The default "bridge" network always exists — your custom network is an addition, not a replacement.',
      'The real benefit of a custom network is containers being able to reach each other by name.'
    ],
    challenge: {
      prompt: 'Create a network named appnet and confirm it exists.',
      check: (state) => state.dockerNetworks.some((n) => n.name === 'appnet')
    }
  },
  {
    id: 'dockerfile-build',
    tag: '10.14',
    title: 'Building Custom Images with a Dockerfile',
    theory: [
      'A Dockerfile is a plain-text recipe for building your own image: it starts with "FROM <base image>" and adds instructions on top — copying in code, installing dependencies, setting a default command. "docker build -t <name>:<tag> ." reads the Dockerfile in the current directory and produces a new image.',
      'This is how every custom application image gets made — you\'re rarely running someone else\'s image unmodified in a real project; you\'re usually building your own on top of a trusted base.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Start from home' },
      { cmd: "echo 'FROM nginx:alpine' > Dockerfile", desc: 'Start the Dockerfile from a lightweight base image' },
      { cmd: "echo 'COPY . /usr/share/nginx/html' >> Dockerfile", desc: 'Add an instruction to copy in your site\'s files' },
      { cmd: 'cat Dockerfile', desc: 'Review the finished Dockerfile' },
      { cmd: 'docker build -t myapp:1.0 .', desc: 'Build your own image from it' },
      { cmd: 'docker images', desc: 'Confirm myapp:1.0 now exists locally' }
    ],
    hints: [
      'Every Dockerfile needs a "FROM" line — it\'s the base everything else builds on top of.',
      '"-t myapp:1.0" names and tags the resulting image — without it, you\'d only have an untagged image ID to work with.'
    ],
    challenge: {
      prompt: 'Write a Dockerfile based on nginx:alpine and build it as myapp:1.0.',
      check: (state) => state.dockerImages.some((i) => i.repository === 'myapp' && i.tag === '1.0')
    }
  },
  {
    id: 'docker-compose-capstone',
    tag: '10.15',
    title: 'Capstone: Multi-Container Apps with docker-compose',
    theory: [
      'Real applications are rarely one container — a typical stack pairs a web server with a cache or database, each in its own container. Rather than running several "docker run" commands by hand every time, "docker-compose.yml" describes the whole stack declaratively, and "docker-compose up" brings all of it up together in one command.',
      '"docker-compose down" tears the whole stack back down just as cleanly — stopping and removing every container the file describes. This declarative, one-file-describes-everything approach is how most real multi-service applications are actually run in development.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Start from home' },
      { cmd: "echo 'services:' > docker-compose.yml", desc: 'Start the compose file' },
      { cmd: "echo '  webapp:' >> docker-compose.yml", desc: 'Define the first service' },
      { cmd: "echo '    image: nginx' >> docker-compose.yml", desc: 'Give it an image' },
      { cmd: "echo '  cachedb:' >> docker-compose.yml", desc: 'Define the second service' },
      { cmd: "echo '    image: redis' >> docker-compose.yml", desc: 'Give it an image too' },
      { cmd: 'cat docker-compose.yml', desc: 'Review the finished compose file' },
      { cmd: 'docker-compose up', desc: 'Bring the whole stack up in one command' },
      { cmd: 'docker ps', desc: 'Confirm both containers are running' },
      { cmd: 'docker-compose down', desc: 'Tear the whole stack back down' }
    ],
    hints: [
      'Indentation matters in the compose file — each service name and its "image:" line need to line up consistently.',
      '"docker-compose up" starts every service the file describes; "docker-compose down" reverses it completely.'
    ],
    challenge: {
      prompt: 'Write a docker-compose.yml with a webapp (nginx) and cachedb (redis) service, bring the stack up, then tear it down.',
      check: (state) =>
        historyIncludes(state, (l) => l.trim() === 'docker-compose up') &&
        historyIncludes(state, (l) => l.trim() === 'docker-compose down') &&
        !state.dockerContainers.some((c) => c.name === 'webapp' || c.name === 'cachedb')
    }
  },
  {
    id: 'shell-aliases',
    tag: '11.1',
    title: 'Aliases: Shortcuts for Commands You Type Constantly',
    theory: [
      'An alias is a shortcut name for a longer command — "alias ll=\'ls -la\'" means typing "ll" now runs "ls -la" exactly as if you\'d typed the whole thing. This is one of the highest-value habits for daily terminal use: any command you type more than a few times a day is a candidate for an alias.',
      'Plain "alias" with no arguments lists everything currently defined. "unalias <name>" removes one. Aliases defined at the prompt only last for the current session — Module 11.2 covers making them permanent.'
    ],
    commands: [
      { cmd: "alias ll='ls -la'", desc: 'Create a shortcut for a long listing' },
      { cmd: 'll', desc: 'Use it exactly like a normal command' },
      { cmd: 'alias', desc: 'List every alias currently defined' },
      { cmd: 'unalias ll', desc: 'Remove it' }
    ],
    hints: [
      'The syntax is "alias name=\'command\'" — no spaces around the "=".',
      'An alias only exists until you remove it or the session ends — nothing is permanent yet.'
    ],
    challenge: {
      prompt: 'Create the "ll" alias, use it, list your aliases, then remove it with unalias.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('alias ll=')) &&
        historyIncludes(state, (l) => l.trim() === 'll') &&
        historyIncludes(state, (l) => l.trim() === 'unalias ll') &&
        !state.aliases.ll
    }
  },
  {
    id: 'bashrc-source',
    tag: '11.2',
    title: 'Making It Permanent: ~/.bashrc & source',
    theory: [
      '"~/.bashrc" is a script that runs automatically every time you open a new interactive shell — it\'s where aliases, environment variables, and custom settings belong if you want them to survive past a single session. Anything you\'d otherwise have to retype every time you log in goes here instead.',
      '"source <file>" (or the equivalent shorthand ".") re-runs a script in your CURRENT shell, applying its effects immediately — the standard way to pick up ~/.bashrc changes without starting a whole new terminal.'
    ],
    commands: [
      { cmd: 'cat ~/.bashrc', desc: 'See the default .bashrc for this account' },
      { cmd: "echo \"alias gs='git status'\" >> ~/.bashrc", desc: 'Add a permanent alias to it' },
      { cmd: 'source ~/.bashrc', desc: 'Apply the change immediately' },
      { cmd: 'cd ~/myproject', desc: 'Move into the git repo from Module 9' },
      { cmd: 'gs', desc: 'Use the new alias' }
    ],
    hints: [
      'Adding a line to ~/.bashrc doesn\'t take effect until something re-reads the file — that\'s what "source" is for.',
      '"gs" only works because it\'s now defined as an alias for "git status" — same mechanism as Module 11.1.'
    ],
    challenge: {
      prompt: 'Add a "gs" alias for "git status" to ~/.bashrc, source it, and use it.',
      check: (state) =>
        state.aliases.gs === 'git status' &&
        historyIncludes(state, (l) => l.trim() === 'source ~/.bashrc')
    }
  },
  {
    id: 'custom-ps1',
    tag: '11.3',
    title: 'Customizing Your Prompt with PS1',
    theory: [
      'The prompt you see before every command is controlled by the "PS1" environment variable, built from special escape sequences: "\\u" (username), "\\h" (hostname), "\\w" (full working directory), "\\W" (just the current directory\'s name), and "\\$" (a "$" for regular users, "#" for root).',
      'A well-designed prompt tells you where and who you are at a glance — genuinely useful when you\'re juggling several terminals across different servers, not just cosmetic.'
    ],
    commands: [
      { cmd: "export PS1='\\u@\\h:\\w\\$ '", desc: 'Set a custom prompt showing user, host, and full path' }
    ],
    hints: [
      '"\\w" shows the full path; "\\W" shows only the last part of it — try both to see the difference.',
      'This is just an environment variable — "export" is what makes it take effect, same as any other.'
    ],
    challenge: {
      prompt: 'Set a custom PS1 prompt using \\u, \\h, and \\w.',
      check: (state) => !!state.env.PS1 && state.env.PS1.includes('\\u') && state.env.PS1.includes('\\w')
    }
  },
  {
    id: 'history-tricks',
    tag: '11.4',
    title: 'History Tricks: !! and !n',
    theory: [
      '"!!" reruns the previous command exactly — genuinely useful the moment you realize a command needed "sudo" in front of it ("sudo !!" is a classic). "!n" reruns a specific numbered command from your history, matching the numbers "history" shows.',
      'These aren\'t just typing-saver party tricks — they reduce the chance of retyping a long command slightly wrong the second time.'
    ],
    commands: [
      { cmd: "echo 'checking history expansion'", desc: 'Run a command to have something to repeat' },
      { cmd: '!!', desc: 'Rerun the exact same command' },
      { cmd: 'history', desc: 'See both runs recorded in your history' }
    ],
    hints: [
      '"!!" expands to whatever your previous command was, whatever that happens to be — it isn\'t a fixed command itself.',
      '"history" numbers each entry — "!3" would rerun entry number 3 specifically.'
    ],
    challenge: {
      prompt: 'Run a command, then rerun it with !!.',
      check: (state) => state.history.filter((h) => h === "echo 'checking history expansion'").length >= 2
    }
  },
  {
    id: 'xargs-basics',
    tag: '11.5',
    title: 'Building Commands from Input with xargs',
    theory: [
      'Many commands take arguments directly but not piped input — "rm" doesn\'t read a list of files from stdin, for instance. "xargs" bridges that gap: it takes whatever comes in on stdin, splits it into words, and appends each one as an argument to the command you give it.',
      '"echo \'a.txt b.txt c.txt\' | xargs touch" is equivalent to running "touch a.txt b.txt c.txt" directly — the value becomes clear once the list of items is generated dynamically by an earlier command instead of typed by hand.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Start from home' },
      { cmd: "echo 'draft1.txt draft2.txt draft3.txt' | xargs touch", desc: 'Create three files from a piped list of names' },
      { cmd: 'ls draft1.txt draft2.txt draft3.txt', desc: 'Confirm all three were created' }
    ],
    hints: [
      'xargs turns piped-in words into arguments — "touch" itself never sees the pipe, only the final argument list.',
      'This becomes far more powerful once the input list comes from "find" or "grep" instead of a hand-typed echo.'
    ],
    challenge: {
      prompt: 'Use xargs to create draft1.txt, draft2.txt, and draft3.txt from one piped echo.',
      check: (state) =>
        !!getNode(state.root, ['home', 'student', 'draft1.txt']) &&
        !!getNode(state.root, ['home', 'student', 'draft2.txt']) &&
        !!getNode(state.root, ['home', 'student', 'draft3.txt']) &&
        historyIncludes(state, (l) => l.includes('xargs touch'))
    }
  },
  {
    id: 'which-type-command',
    tag: '11.6',
    title: 'Finding Commands: which, type, command -v',
    theory: [
      '"which <cmd>" shows the path to the executable that would run if you typed that command. "type <cmd>" is more thorough — it also tells you if something is a shell builtin or an alias instead of a separate program, which "which" can miss.',
      '"command -v <cmd>" is the most script-friendly of the three: it prints a resolvable path (or nothing) and is the version you\'ll see most often inside other people\'s shell scripts, precisely because its output is predictable.'
    ],
    commands: [
      { cmd: 'which git', desc: 'Find the path to git' },
      { cmd: 'type cd', desc: 'See that cd is a shell builtin, not a separate program' },
      { cmd: 'type gs', desc: 'See that gs resolves to an alias, if you defined one' },
      { cmd: 'command -v docker', desc: 'The script-friendly way to check if docker is available' }
    ],
    hints: [
      '"type" is the one that correctly distinguishes builtins and aliases from real executables — "which" often can\'t.',
      '"command -v" is what you\'ll see in real shell scripts checking whether a tool is installed before using it.'
    ],
    challenge: {
      prompt: 'Use which, type, and command -v to look up different kinds of commands.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('which')) &&
        historyIncludes(state, (l) => l.startsWith('type')) &&
        historyIncludes(state, (l) => l.startsWith('command -v'))
    }
  },
  {
    id: 'watch-command',
    tag: '11.7',
    title: 'Repeating a Command with watch',
    theory: [
      '"watch <command>" reruns a command repeatedly (every 2 seconds by default) and shows the latest output, refreshed in place — the fastest way to keep an eye on something changing over time without manually rerunning it yourself. "-n <seconds>" changes the interval.',
      'System administrators reach for "watch free" or "watch df" constantly while diagnosing a live issue — anything where "did that number change yet?" is the question you\'re asking.'
    ],
    commands: [
      { cmd: 'watch -n 5 free', desc: 'Repeatedly check memory usage every 5 seconds' }
    ],
    hints: [
      '"-n <seconds>" sets how often watch reruns the command — the default is every 2 seconds.',
      'This lab shows one snapshot rather than a live-updating loop, but the concept is exactly the same.'
    ],
    challenge: {
      prompt: 'Use watch to repeatedly check free memory every 5 seconds.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('watch') && l.includes('free'))
    }
  },
  {
    id: 'strace-basics',
    tag: '11.8',
    title: 'Tracing System Calls with strace',
    theory: [
      '"strace <command>" runs a command while logging every system call it makes to the kernel — opening files, allocating memory, reading configuration. When a program fails mysteriously with no useful error message, strace often reveals exactly which file it couldn\'t find or which permission it was denied.',
      'This is a genuinely deep debugging tool — most day-to-day work never needs it, but when a program behaves strangely and the normal logs are silent, strace shows you the raw truth of what it actually tried to do.'
    ],
    commands: [
      { cmd: 'strace ls', desc: 'See every system call ls makes just to list a directory' }
    ],
    hints: [
      'The output looks dense at first — focus on calls like "openat" and "access", which show exactly what files a program is looking for.',
      'strace is a last-resort debugging tool, reached for when normal error messages aren\'t telling you enough.'
    ],
    challenge: {
      prompt: 'Trace the system calls made by the ls command.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('strace') && l.includes('ls'))
    }
  },
  {
    id: 'lsof-basics',
    tag: '11.9',
    title: 'Listing Open Files with lsof',
    theory: [
      '"lsof" (list open files) shows every file, socket, and network connection currently held open by every running process — and on Linux, "everything is a file" means this covers a surprising amount, including open network ports. "lsof -p <pid>" filters to one specific process.',
      'This is the tool for answering "what\'s actually using this port" or "why won\'t this file let me unmount the disk it\'s on" — both extremely common real troubleshooting questions.'
    ],
    commands: [
      { cmd: 'systemctl start ssh', desc: 'Start the ssh service so there\'s an open port to find' },
      { cmd: 'lsof', desc: 'See every process\'s open files, including ssh listening on port 22' }
    ],
    hints: [
      'Look for the line ending in "(LISTEN)" — that\'s a process holding a network port open.',
      'lsof only shows what\'s open right now — start the ssh service first, or there\'d be nothing interesting to see.'
    ],
    challenge: {
      prompt: 'Start the ssh service, then use lsof to see it listening on port 22.',
      check: (state) =>
        state.services.ssh?.active === true &&
        historyIncludes(state, (l) => l.trim() === 'lsof')
    }
  },
  {
    id: 'tmux-sessions',
    tag: '11.10',
    title: 'Persistent Sessions with tmux',
    theory: [
      'tmux is a terminal multiplexer — it lets a session keep running in the background even after you disconnect, and lets you reattach to exactly where you left off later. This matters enormously on remote servers: a long-running command survives a dropped SSH connection if it was started inside tmux.',
      '"tmux new -s <name>" starts a named session, "tmux ls" lists existing sessions, and "tmux attach -t <name>" reconnects to one — the three commands that cover most day-to-day tmux use.'
    ],
    commands: [
      { cmd: 'tmux new -s work', desc: 'Start a new named session' },
      { cmd: 'tmux ls', desc: 'List existing sessions' },
      { cmd: 'tmux attach -t work', desc: 'Reattach to it' }
    ],
    hints: [
      'Naming sessions with "-s" makes them easy to find again later with "tmux ls" — an unnamed session is much harder to identify.',
      'The real value of tmux only shows up over an SSH connection — a session survives even if your connection drops.'
    ],
    challenge: {
      prompt: 'Create a tmux session named "work", list sessions, then reattach to it.',
      check: (state) => state.tmuxSessions.some((s) => s.name === 'work')
    }
  },
  {
    id: 'tmux-windows',
    tag: '11.11',
    title: 'tmux Windows: Multiple Tasks, One Session',
    theory: [
      'A tmux session can hold multiple windows (think of them like browser tabs, each a full terminal), letting you monitor logs in one, edit a file in another, and run a build in a third — all inside a single persistent session instead of juggling separate terminal tabs that don\'t survive a disconnect.',
      '"tmux new-window" adds another window to the current session; "tmux split-window" divides the current window into panes instead of adding a full new one — related but distinct ways to multitask inside one session.'
    ],
    commands: [
      { cmd: 'tmux new-window', desc: 'Add a second window to the current session' },
      { cmd: 'tmux ls', desc: 'Confirm the session now reports more than one window' }
    ],
    hints: [
      'A window is a full-screen terminal within the session — a pane (via split-window) is a smaller region sharing the screen with others.',
      'Check the window count in "tmux ls" output before and after to see the difference.'
    ],
    challenge: {
      prompt: 'Add a new window to your tmux session and confirm the window count increased.',
      check: (state) => {
        const s = state.tmuxSessions.find((x) => x.name === 'work');
        return !!s && s.windows >= 2;
      }
    }
  },
  {
    id: 'combining-tools',
    tag: '11.12',
    title: 'Combining Tools into One-Liners',
    theory: [
      'The real power of the shell shows up when tools compose: piping "ps" into "grep" narrows a long process list down to exactly the one you care about, and piping "history" into "grep" lets you search your own past commands instead of scrolling through them by eye.',
      'None of this requires new commands — it\'s the same pipe (Module 1) applied to tools this module introduced, which is exactly the point: shell productivity mostly comes from combining a small set of tools fluently, not memorizing more of them.'
    ],
    commands: [
      { cmd: 'systemctl start nginx', desc: 'Start nginx so there\'s a process to search for' },
      { cmd: 'ps aux | grep nginx', desc: 'Filter the process list down to just nginx' },
      { cmd: 'history | grep git', desc: 'Search your own command history for anything git-related' }
    ],
    hints: [
      'This is the exact same "|" from Module 1 — nothing new syntactically, just a new pair of commands to combine.',
      'Searching "history | grep <keyword>" is a genuinely useful habit for finding a command you know you ran recently.'
    ],
    challenge: {
      prompt: 'Filter running processes for nginx, and search your history for git-related commands.',
      check: (state) =>
        historyIncludes(state, (l) => l.includes('ps aux') && l.includes('grep')) &&
        historyIncludes(state, (l) => l.includes('history') && l.includes('grep'))
    }
  },
  {
    id: 'troubleshooting-scenario',
    tag: '11.13',
    title: 'Scenario: Investigating an Unresponsive Process',
    theory: [
      'A realistic troubleshooting sequence: something seems stuck, so you find it with "ps", check what files or ports it\'s holding open with "lsof -p <pid>" to understand what it might be waiting on, and if it\'s truly unresponsive, end it with "kill <pid>".',
      'This is the same three tools from this module and Module 2, used in the order a real investigation actually happens: identify, inspect, then act — never skip straight to killing something before understanding what it was doing.'
    ],
    commands: [
      { cmd: 'ps', desc: 'Identify the cron process and note its PID' },
      { cmd: 'lsof -p 240', desc: 'Inspect what that process has open' },
      { cmd: 'kill 240', desc: 'Terminate it' },
      { cmd: 'ps', desc: 'Confirm it\'s gone' }
    ],
    hints: [
      'Always inspect before you kill — "lsof -p <pid>" tells you what you\'d be interrupting.',
      'The PID here (240) is cron\'s starting PID in this lab — check your own "ps" output to confirm.'
    ],
    challenge: {
      prompt: 'Inspect the cron process (PID 240) with lsof, then terminate it with kill.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('lsof') && l.includes('240')) &&
        !state.processes.some((p) => p.pid === 240)
    }
  },
  {
    id: 'productivity-persistence',
    tag: '11.14',
    title: 'Making Your Whole Setup Persistent',
    theory: [
      'Everything worth keeping from this module belongs in one place: ~/.bashrc. Aliases, a custom PS1, and any other habitual settings should all live there together, so a single "source ~/.bashrc" (or, in real life, opening a new terminal) brings your entire personalized setup back at once.',
      'This is the difference between a productive environment and a productive moment — the goal is never having to reconstruct your setup by hand again.'
    ],
    commands: [
      { cmd: "echo \"export PS1='\\u@\\h:\\w\\$ '\" >> ~/.bashrc", desc: 'Add your custom prompt to .bashrc' },
      { cmd: "echo \"alias ll='ls -la'\" >> ~/.bashrc", desc: 'Add your alias to .bashrc too' },
      { cmd: 'cat ~/.bashrc', desc: 'Review everything you\'ve accumulated' },
      { cmd: 'source ~/.bashrc', desc: 'Load it all at once' }
    ],
    hints: [
      'Everything you want to persist across sessions goes through the same pattern: append to ~/.bashrc, then source it.',
      'Review the file with "cat" before sourcing it — a typo in .bashrc is much easier to catch there than after.'
    ],
    challenge: {
      prompt: 'Add both a custom PS1 and an "ll" alias to ~/.bashrc, then source it.',
      check: (state) =>
        state.aliases.ll === 'ls -la' &&
        !!state.env.PS1 &&
        historyIncludes(state, (l) => l.trim() === 'source ~/.bashrc')
    }
  },
  {
    id: 'shell-productivity-capstone',
    tag: '11.15',
    title: 'Capstone: Your Personalized, Productive Shell',
    theory: [
      'This closes out the module by assembling a complete personal setup from scratch: a couple of aliases for commands you use constantly, a custom prompt, all made permanent through .bashrc, verified with the lookup tools from earlier in the module, and organized inside a named tmux session.',
      'Every piece here is something a real engineer\'s dotfiles actually contain — this exact pattern, just extended over years, is what a "productive terminal setup" really is.'
    ],
    commands: [
      { cmd: "echo \"alias gs='git status'\" >> ~/.bashrc", desc: 'Add a git shortcut' },
      { cmd: "echo \"alias dps='docker ps'\" >> ~/.bashrc", desc: 'Add a docker shortcut' },
      { cmd: "echo \"export PS1='\\u@\\h:\\w\\$ '\" >> ~/.bashrc", desc: 'Add a custom prompt' },
      { cmd: 'source ~/.bashrc', desc: 'Apply everything at once' },
      { cmd: 'type gs', desc: 'Confirm gs resolves to an alias' },
      { cmd: 'type dps', desc: 'Confirm dps resolves to an alias too' },
      { cmd: 'tmux new -s daily', desc: 'Organize your work inside a named session' }
    ],
    hints: [
      'Build up .bashrc one echo/append at a time, then source it once at the end — same pattern as every lesson in this module.',
      '"type" is the right tool to confirm your new aliases actually took effect after sourcing.'
    ],
    challenge: {
      prompt: 'Add gs and dps aliases plus a custom PS1 to .bashrc, source it, and create a tmux session named "daily".',
      check: (state) =>
        state.aliases.gs === 'git status' &&
        state.aliases.dps === 'docker ps' &&
        !!state.env.PS1 &&
        state.tmuxSessions.some((s) => s.name === 'daily') &&
        historyIncludes(state, (l) => l.trim() === 'source ~/.bashrc')
    }
  },
  {
    id: 'cloud-cli-intro',
    tag: '12.1',
    title: 'Intro to Cloud CLIs',
    theory: [
      'Cloud providers expose everything they offer — servers, storage, networking — through an API, and a command-line tool like the AWS CLI is just a friendly wrapper around that API. Nearly everything you can click through in a cloud console can also be scripted, which is what makes automated, repeatable infrastructure possible.',
      '"aws configure" sets up credentials and a default region, the same one-time setup step every AWS CLI session needs before any other command will work.'
    ],
    commands: [
      { cmd: 'aws --version', desc: 'Confirm the CLI is available' },
      { cmd: 'aws configure', desc: 'Set up credentials and a default region (simulated)' }
    ],
    hints: [
      'This lab simulates one cloud provider\'s CLI (AWS-style) — the concepts transfer directly to Azure\'s or Google Cloud\'s equivalents.',
      'Nearly every "aws" command will refuse to run until "aws configure" has been done once.'
    ],
    challenge: {
      prompt: 'Check the CLI version, then configure it.',
      check: (state) => state.cloudConfigured === true && historyIncludes(state, (l) => l.trim() === 'aws --version')
    }
  },
  {
    id: 'cloud-launch-instance',
    tag: '12.2',
    title: 'Launching a Virtual Machine',
    theory: [
      '"aws ec2 run-instances" launches a new virtual machine ("instance") in the cloud. "--instance-type" picks its size (t2.micro is the smallest, free-tier-eligible size); a name makes it identifiable in every command afterward instead of just a generated ID.',
      'Within seconds, that instance is running with its own public IP address — the same fundamental operation whether you\'re clicking through a web console or scripting it, just far faster and repeatable this way.'
    ],
    commands: [
      { cmd: 'aws ec2 run-instances --instance-type t2.micro --name webserver1', desc: 'Launch a small instance' }
    ],
    hints: [
      't2.micro is a real AWS instance size — the smallest general-purpose option, commonly used for learning and light workloads.',
      'The "--name" flag here is a lab convenience — real AWS uses tags for naming, but the resulting identifiability is the same idea.'
    ],
    challenge: {
      prompt: 'Launch a t2.micro instance named webserver1.',
      check: (state) => state.cloudInstances.some((i) => i.name === 'webserver1' && i.state === 'running')
    }
  },
  {
    id: 'cloud-manage-instances',
    tag: '12.3',
    title: 'Managing Instance State',
    theory: [
      '"aws ec2 describe-instances" lists every instance you\'ve launched along with its current state. "stop-instances" shuts a VM down without deleting it — you stop paying for compute time while it\'s stopped, though the instance and its configuration still exist — and "start-instances" brings it back.',
      'Notice that a stopped instance loses its public IP; starting it again assigns a fresh one. This is real AWS behavior, not a lab simplification — public IPs on standard instances aren\'t guaranteed to persist across a stop/start cycle.'
    ],
    commands: [
      { cmd: 'aws ec2 describe-instances', desc: 'See webserver1 running with a public IP' },
      { cmd: 'aws ec2 stop-instances --instance-ids webserver1', desc: 'Stop it' },
      { cmd: 'aws ec2 describe-instances', desc: 'Notice it\'s stopped and has no public IP' },
      { cmd: 'aws ec2 start-instances --instance-ids webserver1', desc: 'Start it again' }
    ],
    hints: [
      '"--instance-ids" accepts either the real instance ID or, in this lab, the name you gave it.',
      'A stopped instance getting a new public IP on restart is genuine AWS behavior worth remembering.'
    ],
    challenge: {
      prompt: 'Stop webserver1, confirm it stopped, then start it again.',
      check: (state) => {
        const i = state.cloudInstances.find((x) => x.name === 'webserver1');
        return !!i && i.state === 'running' && historyIncludes(state, (l) => l.includes('stop-instances'));
      }
    }
  },
  {
    id: 'cloud-object-storage',
    tag: '12.4',
    title: 'Object Storage with S3',
    theory: [
      'Object storage (AWS calls it S3) stores files ("objects") in flat containers called buckets — not a traditional filesystem, but conceptually similar for most purposes. It\'s the standard place for backups, static website assets, logs, and large datasets that don\'t need to live on a specific server.',
      '"aws s3 mb s3://<bucket-name>" makes a new bucket ("mb" = make bucket); bucket names have to be globally unique across all of AWS in real life, though this lab only checks uniqueness within your own account.'
    ],
    commands: [
      { cmd: 'aws s3 mb s3://my-lab-bucket', desc: 'Create a new bucket' },
      { cmd: 'aws s3 ls', desc: 'Confirm it exists' }
    ],
    hints: [
      'The "s3://" prefix is how every S3 command identifies a bucket or object path.',
      '"mb" is short for "make bucket" — one of several two-letter S3 command shorthands.'
    ],
    challenge: {
      prompt: 'Create a bucket named my-lab-bucket.',
      check: (state) => state.cloudBuckets.some((b) => b.name === 'my-lab-bucket')
    }
  },
  {
    id: 'cloud-s3-transfer',
    tag: '12.5',
    title: 'Uploading & Downloading with s3 cp',
    theory: [
      '"aws s3 cp" moves data between your local filesystem and a bucket, in either direction — "aws s3 cp file.txt s3://bucket/file.txt" uploads, "aws s3 cp s3://bucket/file.txt file.txt" downloads. Which direction it goes depends entirely on which side of the command has the "s3://" prefix.',
      'This one command covers both directions of the most common cloud storage operation: backing something up, and retrieving it later.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Start from home' },
      { cmd: 'aws s3 cp notes.txt s3://my-lab-bucket/notes.txt', desc: 'Upload a local file to the bucket' },
      { cmd: 'aws s3 ls s3://my-lab-bucket', desc: 'Confirm it\'s there' },
      { cmd: 'aws s3 cp s3://my-lab-bucket/notes.txt downloaded-notes.txt', desc: 'Download it back under a new name' },
      { cmd: 'cat downloaded-notes.txt', desc: 'Confirm the content matches' }
    ],
    hints: [
      'The side with "s3://" tells you the direction: source or destination, upload or download.',
      'You can download an object to any local filename — it doesn\'t have to match the object\'s key.'
    ],
    challenge: {
      prompt: 'Upload notes.txt to my-lab-bucket, then download it back as downloaded-notes.txt.',
      check: (state) => {
        const bucket = state.cloudBuckets.find((b) => b.name === 'my-lab-bucket');
        const node = getNode(state.root, ['home', 'student', 'downloaded-notes.txt']);
        return !!bucket && 'notes.txt' in bucket.objects && !!node && node.type === 'file';
      }
    }
  },
  {
    id: 'cloud-security-groups',
    tag: '12.6',
    title: 'Security Groups: Cloud-Level Firewalls',
    theory: [
      'A security group is a virtual firewall attached directly to an instance, controlling exactly what traffic can reach it — conceptually the same idea as ufw (Module 7), but enforced by the cloud provider outside the instance itself. "create-security-group" makes an empty one; "authorize-security-group-ingress" adds an allow rule to it.',
      'Real security groups specify a protocol, a port, and a CIDR range (which addresses are allowed) — "0.0.0.0/0" means "anywhere," while a specific range like "10.0.0.0/24" restricts access to just that network, exactly like the CIDR notation from Module 3.'
    ],
    commands: [
      { cmd: 'aws ec2 create-security-group --group-name web-sg --description "web servers"', desc: 'Create a security group' },
      { cmd: 'aws ec2 authorize-security-group-ingress --group-name web-sg --protocol tcp --port 22 --cidr 0.0.0.0/0', desc: 'Allow SSH from anywhere' },
      { cmd: 'aws ec2 authorize-security-group-ingress --group-name web-sg --protocol tcp --port 80 --cidr 0.0.0.0/0', desc: 'Allow HTTP from anywhere' }
    ],
    hints: [
      'A freshly created security group allows nothing by default — every port has to be explicitly authorized.',
      'The CIDR here is the exact same notation from Module 3\'s networking lessons.'
    ],
    challenge: {
      prompt: 'Create a security group named web-sg and authorize both port 22 and port 80.',
      check: (state) => {
        const sg = state.cloudSecurityGroups.find((g) => g.name === 'web-sg');
        return !!sg && sg.rules.length >= 2;
      }
    }
  },
  {
    id: 'cloud-launch-with-sg',
    tag: '12.7',
    title: 'Launching an Instance with a Security Group',
    theory: [
      'A security group only does something once it\'s actually attached to an instance — creating one in isolation (Module 12.6) doesn\'t protect anything by itself. "--security-group" at launch time attaches it, so every rule you authorized applies to that instance immediately.',
      'This is the realistic order real infrastructure gets built in: network/security configuration first, then the instance that uses it — never the other way around.'
    ],
    commands: [
      { cmd: 'aws ec2 run-instances --instance-type t2.micro --name webserver2 --security-group web-sg', desc: 'Launch a new instance using the web-sg security group' },
      { cmd: 'aws ec2 describe-instances', desc: 'Confirm it shows web-sg attached' }
    ],
    hints: [
      'The security group has to already exist before you can attach it at launch — order matters here.',
      'Check the SECURITY GROUP column in describe-instances output to confirm the attachment worked.'
    ],
    challenge: {
      prompt: 'Launch webserver2 with the web-sg security group attached.',
      check: (state) => {
        const i = state.cloudInstances.find((x) => x.name === 'webserver2');
        return !!i && i.securityGroup === 'web-sg';
      }
    }
  },
  {
    id: 'iac-intro',
    tag: '12.8',
    title: 'Infrastructure as Code: Writing infra.yaml',
    theory: [
      'Running commands by hand doesn\'t scale — Infrastructure as Code (IaC) describes your desired infrastructure declaratively, in a file, so it can be reviewed, version-controlled (Module 9!), and applied repeatably instead of retyped every time. Real-world tools like Terraform work exactly this way.',
      'This lab uses a simplified "infra.yaml" format: a "resources:" block containing named resources, each with a "type" (instance, bucket, or security_group) and, for instances, an "instance_type".'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Start from home' },
      { cmd: "echo 'resources:' > infra.yaml", desc: 'Start the infrastructure definition' },
      { cmd: "echo '  app_server:' >> infra.yaml", desc: 'Define a resource named app_server' },
      { cmd: "echo '    type: instance' >> infra.yaml", desc: 'Declare its type' },
      { cmd: "echo '    instance_type: t2.micro' >> infra.yaml", desc: 'Declare its size' },
      { cmd: 'cat infra.yaml', desc: 'Review the finished definition' }
    ],
    hints: [
      'Indentation matters — each resource name and its properties need to line up consistently, same as docker-compose.yml.',
      'Nothing is actually created yet — infra.yaml is just a description, until Module 12.10\'s "infra apply".'
    ],
    challenge: {
      prompt: 'Write an infra.yaml defining an app_server instance resource.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'infra.yaml']);
        return !!node && node.type === 'file' && node.content.includes('app_server') && node.content.includes('type: instance');
      }
    }
  },
  {
    id: 'iac-plan',
    tag: '12.9',
    title: 'Previewing Changes with infra plan',
    theory: [
      '"infra plan" reads infra.yaml and reports exactly what WOULD happen if you applied it — without actually creating anything. This preview step is one of the most valuable habits in infrastructure work: reviewing a plan before committing to it catches mistakes while they\'re still free to fix.',
      'Every serious IaC tool has an equivalent of this command, and skipping it in favor of applying blind is a common, avoidable source of production incidents.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Make sure you\'re where infra.yaml lives' },
      { cmd: 'infra plan', desc: 'Preview what applying this file would do' }
    ],
    hints: [
      '"infra plan" never changes anything — it\'s purely a preview, safe to run as often as you like.',
      'Reviewing a plan before applying is standard professional practice, not an optional extra step.'
    ],
    challenge: {
      prompt: 'Run infra plan and review what it would create.',
      check: (state) => historyIncludes(state, (l) => l.trim() === 'infra plan') && state.lastOutput.includes('Plan:')
    }
  },
  {
    id: 'iac-apply',
    tag: '12.10',
    title: 'Provisioning with infra apply',
    theory: [
      '"infra apply" actually creates whatever infra.yaml describes — this is the step that turns the plan into real, running infrastructure. Everything created this way is indistinguishable from something you\'d built by hand with individual "aws" commands — it\'s the same underlying resources, just described declaratively first.',
      'Once applied, "aws ec2 describe-instances" (or s3/security-group equivalents) shows exactly what you\'d expect, confirming the file\'s description now matches reality.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Make sure you\'re where infra.yaml lives' },
      { cmd: 'infra apply', desc: 'Create everything infra.yaml describes' },
      { cmd: 'aws ec2 describe-instances', desc: 'Confirm app_server now exists as a real running instance' }
    ],
    hints: [
      'This is the step that actually changes anything — "infra plan" was just a preview.',
      'The new instance should show up in describe-instances exactly as if you\'d run "run-instances" by hand.'
    ],
    challenge: {
      prompt: 'Apply infra.yaml and confirm app_server now exists as a running instance.',
      check: (state) =>
        state.infraApplied === true &&
        state.cloudInstances.some((i) => i.name === 'app_server' && i.state === 'running')
    }
  },
  {
    id: 'iac-update',
    tag: '12.11',
    title: 'Updating Infrastructure',
    theory: [
      'Infrastructure evolves — you add a new resource to infra.yaml, plan again to see just the new addition, and apply again. Existing resources the file already describes are left alone; only what\'s new (or changed) gets acted on.',
      'This incremental workflow — edit, plan, apply — is how real infrastructure is actually managed day to day, far more often than building something from scratch.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Make sure you\'re where infra.yaml lives' },
      { cmd: "echo '  data_bucket:' >> infra.yaml", desc: 'Add a new resource to the file' },
      { cmd: "echo '    type: bucket' >> infra.yaml", desc: 'Declare it as a bucket' },
      { cmd: 'infra plan', desc: 'Preview just the new addition' },
      { cmd: 'infra apply', desc: 'Create it' }
    ],
    hints: [
      'You\'re appending to the same infra.yaml from earlier — app_server\'s definition stays exactly as it was.',
      '"infra plan" after an edit is how you confirm you\'re only about to add what you intended to add.'
    ],
    challenge: {
      prompt: 'Add a data_bucket resource to infra.yaml and apply it.',
      check: (state) => state.cloudBuckets.some((b) => b.name === 'data_bucket')
    }
  },
  {
    id: 'iac-destroy',
    tag: '12.12',
    title: 'Tearing Down with infra destroy',
    theory: [
      '"infra destroy" reverses everything infra.yaml describes — every instance is terminated, every bucket removed, every security group deleted. This is exactly as powerful (and as dangerous) as it sounds: it\'s the cleanup command for tearing an entire environment back down, often used for temporary test environments.',
      'Because IaC just describes state declaratively, destroying and later re-applying the same file recreates everything identically — a genuinely powerful property manual point-and-click infrastructure doesn\'t have.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Make sure you\'re where infra.yaml lives' },
      { cmd: 'infra destroy', desc: 'Tear down everything infra.yaml describes' },
      { cmd: 'aws ec2 describe-instances', desc: 'Confirm app_server is now terminated' },
      { cmd: 'aws s3 ls', desc: 'Confirm data_bucket is gone' }
    ],
    hints: [
      '"infra destroy" affects every resource the file describes, not just the most recently added one.',
      'A terminated instance still shows up in describe-instances briefly, marked "terminated" rather than disappearing outright — same as real AWS.'
    ],
    challenge: {
      prompt: 'Destroy the infrastructure described in infra.yaml.',
      check: (state) => {
        const inst = state.cloudInstances.find((i) => i.name === 'app_server');
        return state.infraApplied === false &&
          !!inst && inst.state === 'terminated' &&
          !state.cloudBuckets.some((b) => b.name === 'data_bucket');
      }
    }
  },
  {
    id: 'cloud-cost-awareness',
    tag: '12.13',
    title: 'Cost Awareness: Stopping Idle Resources',
    theory: [
      'Cloud resources cost money for every hour they run, whether you\'re using them or not — an instance left running over a weekend nobody needed it for is pure waste. A basic habit of checking "describe-instances" and stopping anything idle is one of the simplest, highest-value cost-control habits in real cloud work.',
      'This is a judgment call more than a command to memorize: the skill is regularly asking "is this still needed?" rather than letting resources accumulate silently.'
    ],
    commands: [
      { cmd: 'aws ec2 describe-instances', desc: 'Review everything currently running' },
      { cmd: 'aws ec2 stop-instances --instance-ids webserver2', desc: 'Stop an instance that isn\'t actively needed' }
    ],
    hints: [
      'A stopped instance no longer incurs compute charges — that\'s the entire point of this habit.',
      'Regularly reviewing what\'s running is a cheap habit that prevents an expensive surprise later.'
    ],
    challenge: {
      prompt: 'Review running instances and stop webserver2 to save cost.',
      check: (state) => {
        const i = state.cloudInstances.find((x) => x.name === 'webserver2');
        return !!i && i.state === 'stopped';
      }
    }
  },
  {
    id: 'cloud-combining-tools',
    tag: '12.14',
    title: 'Provisioning a Small Application Stack',
    theory: [
      'A realistic small application needs more than one resource working together: a server, a security group scoped to exactly the traffic it needs, and a storage bucket for backups. Building all three by hand, in the right order, is exactly how a real (small-scale) deployment gets put together.',
      'Notice the CIDR here is scoped to a specific internal network (10.0.0.0/24) rather than "anywhere" — a database, unlike a public web server, should almost never accept connections from the entire internet.'
    ],
    commands: [
      { cmd: 'aws ec2 run-instances --instance-type t2.micro --name dbserver', desc: 'Launch the database server' },
      { cmd: 'aws ec2 create-security-group --group-name db-sg --description "database access"', desc: 'Create a scoped security group' },
      { cmd: 'aws ec2 authorize-security-group-ingress --group-name db-sg --protocol tcp --port 5432 --cidr 10.0.0.0/24', desc: 'Allow database traffic only from the internal network' },
      { cmd: 'aws s3 mb s3://db-backups', desc: 'Create a bucket for backups' },
      { cmd: 'cd ~', desc: 'Move home' },
      { cmd: 'aws s3 cp notes.txt s3://db-backups/backup1.txt', desc: 'Simulate uploading a backup' }
    ],
    hints: [
      'Restricting the database\'s CIDR to an internal range, rather than 0.0.0.0/0, is the correct real-world default for anything that isn\'t a public-facing web server.',
      'This is the same run-instances / create-security-group / authorize-ingress / s3 mb pattern from earlier lessons, just applied together.'
    ],
    challenge: {
      prompt: 'Launch a dbserver instance, create a scoped db-sg security group, and back a file up to s3://db-backups.',
      check: (state) => {
        const inst = state.cloudInstances.find((i) => i.name === 'dbserver');
        const sg = state.cloudSecurityGroups.find((g) => g.name === 'db-sg');
        const bucket = state.cloudBuckets.find((b) => b.name === 'db-backups');
        return !!inst && !!sg && sg.rules.length >= 1 && !!bucket && 'backup1.txt' in bucket.objects;
      }
    }
  },
  {
    id: 'cloud-infra-capstone',
    tag: '12.15',
    title: 'Capstone: Provision a Web Stack with IaC',
    theory: [
      'This closes out the module — and the curriculum — by combining everything: writing a complete infra.yaml describing a small web stack (a server, a security group, and a storage bucket), planning it, applying it, and confirming every piece exists exactly as described.',
      'This declarative, plan-then-apply workflow is genuinely how modern infrastructure gets built in the real world — the same pattern you\'ve now practiced scales from a single instance to entire fleets of servers.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Start from home' },
      { cmd: "echo 'resources:' > infra.yaml", desc: 'Start a fresh infrastructure definition' },
      { cmd: "echo '  capstone_web:' >> infra.yaml", desc: 'Define the web server' },
      { cmd: "echo '    type: instance' >> infra.yaml", desc: 'Declare its type' },
      { cmd: "echo '    instance_type: t2.micro' >> infra.yaml", desc: 'Declare its size' },
      { cmd: "echo '  capstone_sg:' >> infra.yaml", desc: 'Define its security group' },
      { cmd: "echo '    type: security_group' >> infra.yaml", desc: 'Declare its type' },
      { cmd: "echo '  capstone_assets:' >> infra.yaml", desc: 'Define a storage bucket' },
      { cmd: "echo '    type: bucket' >> infra.yaml", desc: 'Declare its type' },
      { cmd: 'cat infra.yaml', desc: 'Review the complete stack definition' },
      { cmd: 'infra plan', desc: 'Preview the three resources it will create' },
      { cmd: 'infra apply', desc: 'Provision the entire stack in one command' },
      { cmd: 'aws ec2 describe-instances', desc: 'Confirm capstone_web is running' },
      { cmd: 'aws s3 ls', desc: 'Confirm capstone_assets exists' }
    ],
    hints: [
      'Three resources, three name/type blocks — the same pattern as every infra.yaml from earlier in the module, just more of them.',
      'One "infra apply" provisions all three resources together — that\'s the entire point of describing them declaratively first.'
    ],
    challenge: {
      prompt: 'Write an infra.yaml describing capstone_web (instance), capstone_sg (security_group), and capstone_assets (bucket), then plan and apply it.',
      check: (state) =>
        state.infraApplied === true &&
        state.cloudInstances.some((i) => i.name === 'capstone_web' && i.state === 'running') &&
        state.cloudSecurityGroups.some((g) => g.name === 'capstone_sg') &&
        state.cloudBuckets.some((b) => b.name === 'capstone_assets') &&
        historyIncludes(state, (l) => l.trim() === 'infra plan')
    }
  },
  {
    id: 'osint-intro',
    tag: '13.1',
    title: 'OSINT: Passive Recon & the Open Source Intelligence Mindset',
    theory: [
      '"OSINT" (Open Source Intelligence) means gathering information about a target using only publicly available sources — domain registries, DNS, search engines, social media, and public archives — never touching the target\'s own systems directly.',
      'This is the key difference from Module 8\'s recon tools: curl, gobuster, and nikto all send requests straight to the target and can be logged or blocked there. OSINT tools query third parties instead — a registrar, a search index, an archive — so the target never sees you looking.',
      'This module investigates one fictional target throughout: corp-target.lab, registered to "Nova Retail Group". "whois" and "dig" from earlier modules are your first two OSINT tools — you already know them.'
    ],
    commands: [
      { cmd: 'whois corp-target.lab', desc: 'Passive lookup #1: who registered this domain?' },
      { cmd: 'dig corp-target.lab NS', desc: 'Passive lookup #2: which nameservers answer for it?' }
    ],
    hints: [
      '"whois corp-target.lab" should show Registrant Organization: Nova Retail Group — that\'s this module\'s target company.',
      '"dig <domain> NS" (a new second argument after the domain) asks specifically for nameserver records instead of the default A record.'
    ],
    challenge: {
      prompt: 'Run whois and "dig ... NS" against corp-target.lab to identify the registrant and its nameservers.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('whois') && l.includes('corp-target.lab')) &&
        historyIncludes(state, (l) => l.startsWith('dig') && l.includes('corp-target.lab') && l.split(/\s+/).some((t) => t.toUpperCase() === 'NS'))
    }
  },
  {
    id: 'osint-google-dorking',
    tag: '13.2',
    title: 'Google Dorking: Advanced Search Operators',
    theory: [
      '"Dorking" means using a search engine\'s own advanced operators to find things that were never meant to be easy to find: "site:<domain>" restricts results to one domain, "filetype:<ext>" restricts to a file type, and "intitle:<word>" / "inurl:<word>" match the page title or URL directly.',
      'This lab\'s "dork" command simulates typing these operators into a search box — a real investigation would use a search engine directly, but the operators themselves are identical.',
      'Combining operators narrows fast: "site:corp-target.lab filetype:pdf" finds only PDFs indexed under that one domain — exactly how an internal handbook, contract, or resume ends up discoverable months after it was quietly uploaded.'
    ],
    commands: [
      { cmd: 'dork site:corp-target.lab', desc: 'See everything indexed under this domain' },
      { cmd: 'dork site:corp-target.lab filetype:pdf', desc: 'Narrow down to just PDFs' }
    ],
    hints: [
      'Run the plain "site:" search first to see the full indexed picture, then add "filetype:pdf" to narrow it.',
      'Look for "Employee Handbook 2024" — an internal document that ended up publicly indexed.'
    ],
    challenge: {
      prompt: 'Use dork with both site: and filetype: operators to find the indexed PDF on corp-target.lab.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('dork') && l.includes('site:corp-target.lab') && l.includes('filetype:pdf'))
    }
  },
  {
    id: 'osint-subdomain-enum',
    tag: '13.3',
    title: 'Subdomain Enumeration with subfinder',
    theory: [
      'A company\'s public footprint is almost always bigger than its main website — subdomains like "vpn.", "dev.", or "staging." often run older, less-hardened software and aren\'t linked from anywhere a search engine would find.',
      '"subfinder -d corp-target.lab" passively enumerates subdomains from public sources (certificate transparency logs, DNS aggregators) — no packets are sent to the target itself.',
      'Once you know a subdomain exists, you can point every DNS and web tool you already know (dig, nslookup, curl, nmap) directly at it.'
    ],
    commands: [
      { cmd: 'subfinder -d corp-target.lab', desc: 'Passively enumerate subdomains' },
      { cmd: 'dig dev.corp-target.lab', desc: 'Resolve one of the subdomains you just found' }
    ],
    hints: [
      'subfinder returns a handful of subdomains including "dev." and "vpn." — often the least locked-down parts of a company\'s infrastructure.',
      'Pick any subdomain from the subfinder output and resolve it with dig or nslookup to confirm it\'s live.'
    ],
    challenge: {
      prompt: 'Run subfinder against corp-target.lab, then resolve one of the discovered subdomains with dig or nslookup.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('subfinder') && l.includes('corp-target.lab')) &&
        historyIncludes(state, (l) => (l.startsWith('dig') || l.startsWith('nslookup')) && /[a-z0-9-]+\.corp-target\.lab/.test(l))
    }
  },
  {
    id: 'osint-dns-mx-txt',
    tag: '13.4',
    title: 'DNS Recon: MX and TXT Records',
    theory: [
      'A records answer "what IP is this", but MX and TXT records reveal infrastructure choices: MX records show which mail provider handles email for a domain, and TXT records often contain SPF entries and third-party verification strings.',
      '"dig corp-target.lab MX" reveals Nova Retail Group routes mail through Google Workspace (aspmx.l.google.com) — useful intelligence: an attacker (or a defender doing their own OSINT) now knows exactly which platform a phishing pretext should target.',
      '"dig corp-target.lab TXT" often reveals more than SPF — verification strings for tools like Google Search Console can name specific third-party services an organization uses internally.'
    ],
    commands: [
      { cmd: 'dig corp-target.lab MX', desc: 'Find the mail provider' },
      { cmd: 'dig corp-target.lab TXT', desc: 'Find SPF and verification records' }
    ],
    hints: [
      'The record type goes after the domain: "dig corp-target.lab MX", not before it.',
      'Look for "aspmx.l.google.com" in the MX output and "spf1" in the TXT output.'
    ],
    challenge: {
      prompt: 'Query both MX and TXT records for corp-target.lab with dig.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('dig') && l.includes('corp-target.lab') && l.split(/\s+/).some((t) => t.toUpperCase() === 'MX')) &&
        historyIncludes(state, (l) => l.startsWith('dig') && l.includes('corp-target.lab') && l.split(/\s+/).some((t) => t.toUpperCase() === 'TXT'))
    }
  },
  {
    id: 'osint-email-harvest',
    tag: '13.5',
    title: 'Email Harvesting with theHarvester',
    theory: [
      '"theharvester -d corp-target.lab -b all" pulls together emails and hostnames scattered across search engines and other public sources into one report — automating what would otherwise be a lot of manual dork queries.',
      'Every email address it finds tells you the organization\'s address format (first-initial-plus-last-name here) — which means once you know one employee\'s name, you can guess the rest with reasonable confidence.',
      'Harvested emails feed directly into the next lesson: usernames for social-media recon are very often derived from the same local part as a work email.'
    ],
    commands: [
      { cmd: 'theharvester -d corp-target.lab -b all', desc: 'Harvest emails and hosts from public sources' }
    ],
    hints: [
      '"-b all" tells theHarvester to check every supported data source rather than just one.',
      'Note the address format — jmartinez@, achen@ — you\'ll reuse that username shape in the next lesson.'
    ],
    challenge: {
      prompt: 'Run theHarvester against corp-target.lab with -b all and review the harvested emails and hosts.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('theharvester') && l.includes('-d') && l.includes('corp-target.lab') && l.includes('-b'))
    }
  },
  {
    id: 'osint-username-recon',
    tag: '13.6',
    title: 'Username Recon with Sherlock',
    theory: [
      '"sherlock <username>" checks a single username against many social platforms at once and reports where an account exists — the real tool checks hundreds of sites; this lab checks a representative handful.',
      'Email harvesting (previous lesson) plus username recon (this one) is a classic OSINT one-two punch: an email format reveals a likely username, and that username often has accounts across GitHub, LinkedIn, and other platforms that reveal far more than a company website ever would.',
      'A "Not Found" result is still information — it tells you a platform an employee likely doesn\'t use, narrowing where else to look next.'
    ],
    commands: [
      { cmd: 'sherlock jmartinez', desc: 'Search this username (harvested last lesson) across platforms' }
    ],
    hints: [
      '"jmartinez" is the username portion of the email you harvested last lesson — theHarvester and Sherlock chain together.',
      'Found results include a direct URL to the account; Not Found results have no URL.'
    ],
    challenge: {
      prompt: 'Run sherlock against the username jmartinez and review which platforms return a hit.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('sherlock') && l.includes('jmartinez'))
    }
  },
  {
    id: 'osint-metadata-exif',
    tag: '13.7',
    title: 'Image & Document Metadata with exiftool',
    theory: [
      'Every photo and document can carry hidden metadata: author name, software used, and — for photos taken with location services on — exact GPS coordinates. None of this is visible just from looking at the image.',
      '"exiftool <file>" reads that embedded metadata directly. A file at ~/osint/team_photo.jpg — the kind of casual photo an employee might post publicly — reveals exactly this kind of information.',
      'This is why security-conscious organizations strip metadata before publishing photos or documents: without that step, a single "harmless" photo can leak an employee\'s name, the software they used, and the physical location of an office.'
    ],
    commands: [
      { cmd: 'cd ~/osint', desc: 'Move to the directory with the sample photo' },
      { cmd: 'exiftool team_photo.jpg', desc: 'Read its embedded metadata' }
    ],
    hints: [
      'The file already exists at ~/osint/team_photo.jpg — no need to download or create it.',
      'Look for the GPS coordinates and the Author field in the output — both leaked unintentionally.'
    ],
    challenge: {
      prompt: 'Run exiftool on ~/osint/team_photo.jpg and find the embedded GPS coordinates.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('exiftool') && l.includes('team_photo.jpg'))
    }
  },
  {
    id: 'osint-shodan',
    tag: '13.8',
    title: 'Shodan: Searching the Internet of Already-Connected Things',
    theory: [
      'Where a port scanner like nmap (Module 3) only sees hosts you point it at, Shodan continuously scans the entire public internet in advance and lets you search that pre-built index instead — "shodan host <ip>" looks up what\'s already known about one address without touching it yourself.',
      'Shodan results include more than open ports: organization and ISP ownership, and often a list of known vulnerabilities tied to the exact software version it fingerprinted — turning a single lookup into a ready-made list of what to check first.',
      '"shodan search <term>" works the other direction — searching by organization name, product, or banner text to find every indexed host that matches, not just one you already know the address of.'
    ],
    commands: [
      { cmd: 'shodan host 10.0.0.20', desc: 'Look up what Shodan already knows about this address' },
      { cmd: 'shodan search Nova', desc: 'Search Shodan by organization name instead' }
    ],
    hints: [
      '10.0.0.20 is corp-target.lab\'s IP — the same one nmap could scan directly, but here you\'re reading a pre-built index instead.',
      'Look for the "Vulnerabilities" section in the host output — Shodan often fingerprints outdated software versions directly.'
    ],
    challenge: {
      prompt: 'Look up 10.0.0.20 with "shodan host", then search Shodan for "Nova".',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('shodan') && l.includes('host') && l.includes('10.0.0.20')) &&
        historyIncludes(state, (l) => l.startsWith('shodan') && l.includes('search') && l.toLowerCase().includes('nova'))
    }
  },
  {
    id: 'osint-wayback-machine',
    tag: '13.9',
    title: 'The Wayback Machine: Finding What Used to Be There',
    theory: [
      'The Internet Archive\'s Wayback Machine periodically snapshots public web pages — including ones an organization has since taken down, unlinked, or forgotten about. "waybackurls corp-target.lab" lists every archived URL under that domain.',
      'Old, unlinked paths like an "old-admin-panel" or a legacy employee portal won\'t show up in a fresh gobuster scan (Module 8) because nothing links to them anymore — but they can still be live, still be reachable, and still be running whatever outdated code was on them the day they were forgotten.',
      'This is a core OSINT habit: the current live site is only one snapshot in time. What a company used to expose is often just as revealing as what it exposes now.'
    ],
    commands: [
      { cmd: 'waybackurls corp-target.lab', desc: 'List every archived URL under this domain' }
    ],
    hints: [
      'Look for entries marked "no longer linked" — those are the ones a current gobuster scan would never find.',
      'Compare this list to what gobuster found in Module 8 — notice which paths only show up here.'
    ],
    challenge: {
      prompt: 'Run waybackurls against corp-target.lab and find the archived, no-longer-linked admin path.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('waybackurls') && l.includes('corp-target.lab'))
    }
  },
  {
    id: 'osint-capstone',
    tag: '13.10',
    title: 'Capstone: Full OSINT Investigation & Report',
    theory: [
      'This closes out the module by running a complete passive investigation against corp-target.lab — ownership, mail infrastructure, subdomains, harvested emails, a username check, image metadata, a Shodan lookup, and archived URLs — and writing it all up, exactly like a real OSINT engagement deliverable.',
      'Notice everything here was gathered without a single request sent to corp-target.lab\'s own web server — the entire investigation used a registrar, DNS, a search index, an archive, and third-party platforms. That\'s the defining trait of OSINT versus the active recon from Module 8.',
      'Writing the report uses the same echo + redirection pattern from every capstone so far — the tools change module to module, but composing findings into one readable document doesn\'t.'
    ],
    commands: [
      { cmd: 'whois corp-target.lab', desc: 'Confirm domain ownership' },
      { cmd: 'dig corp-target.lab MX', desc: 'Identify the mail provider' },
      { cmd: 'subfinder -d corp-target.lab', desc: 'Enumerate subdomains' },
      { cmd: 'theharvester -d corp-target.lab -b all', desc: 'Harvest emails and hosts' },
      { cmd: 'sherlock jmartinez', desc: 'Check a harvested username across platforms' },
      { cmd: 'exiftool ~/osint/team_photo.jpg', desc: 'Extract metadata from a public photo' },
      { cmd: 'shodan host 10.0.0.20', desc: 'Look up the target\'s known internet footprint' },
      { cmd: 'waybackurls corp-target.lab', desc: 'Find archived, no-longer-linked URLs' },
      { cmd: "echo 'OSINT Report: corp-target.lab (Nova Retail Group)' > osint_report.txt", desc: 'Start the report' },
      { cmd: "echo 'Mail provider: Google Workspace (MX)' >> osint_report.txt", desc: 'Record the DNS finding' },
      { cmd: "echo 'Emails found: jmartinez, achen, support (theHarvester)' >> osint_report.txt", desc: 'Record the harvested emails' },
      { cmd: "echo 'Exposure: GPS-tagged employee photo, archived legacy admin panel' >> osint_report.txt", desc: 'Record the metadata and archive findings' },
      { cmd: 'cat osint_report.txt', desc: 'Review the finished report' }
    ],
    hints: [
      'Work through the tools in order — whois, dig, subfinder, theharvester, sherlock, exiftool, shodan, waybackurls — before writing the report.',
      'The first "echo" line must use ">" to create osint_report.txt; every line after that uses ">>" to append.'
    ],
    challenge: {
      prompt: 'Run whois, dig MX, subfinder, theharvester, sherlock, exiftool, shodan, and waybackurls against corp-target.lab, then write the findings to osint_report.txt.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'osint_report.txt']);
        const built = !!node && node.type === 'file' && node.content.includes('corp-target.lab');
        return built &&
          historyIncludes(state, (l) => l.startsWith('whois') && l.includes('corp-target.lab')) &&
          historyIncludes(state, (l) => l.startsWith('dig') && l.includes('corp-target.lab') && l.split(/\s+/).some((t) => t.toUpperCase() === 'MX')) &&
          historyIncludes(state, (l) => l.startsWith('subfinder') && l.includes('corp-target.lab')) &&
          historyIncludes(state, (l) => l.startsWith('theharvester') && l.includes('corp-target.lab')) &&
          historyIncludes(state, (l) => l.startsWith('sherlock')) &&
          historyIncludes(state, (l) => l.startsWith('exiftool')) &&
          historyIncludes(state, (l) => l.startsWith('shodan')) &&
          historyIncludes(state, (l) => l.startsWith('waybackurls') && l.includes('corp-target.lab'));
      }
    }
  },
  {
    id: 'geoint-intro',
    tag: '14.1',
    title: 'GEOINT: Geolocating Images Without Metadata',
    theory: [
      '"GEOINT" (Geospatial Intelligence) is OSINT applied specifically to images and location: figuring out where a photo was taken using only what is visible in the frame, not GPS metadata.',
      'Module 13 found GPS coordinates baked directly into a photo\'s EXIF data — but that only works when a platform preserves metadata. Most social platforms strip it on upload specifically to prevent this, so a real investigator has to read the image itself instead.',
      'A photo at ~/osint/loading_dock.jpg has had its metadata stripped, exactly like a real uploaded photo would — confirm that with exiftool before switching to visual analysis.'
    ],
    commands: [
      { cmd: 'exiftool ~/osint/loading_dock.jpg', desc: 'Confirm metadata has been stripped' }
    ],
    hints: [
      'Compare this to ~/osint/team_photo.jpg from Module 13 — that one still had its GPS tag; this one doesn\'t.',
      '"No EXIF metadata found" is the expected, correct result here — it\'s the reason GEOINT exists as its own discipline.'
    ],
    challenge: {
      prompt: 'Run exiftool on ~/osint/loading_dock.jpg and confirm its metadata has been stripped.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('exiftool') && l.includes('loading_dock.jpg'))
    }
  },
  {
    id: 'geoint-visual-clues',
    tag: '14.2',
    title: 'Visual Clue Analysis',
    theory: [
      '"imageanalyze" surfaces the kind of details a trained eye looks for in a photo: visible text, signage language, vehicle and license-plate styling, architecture, and environment (vegetation, terrain) — each one narrows down a region.',
      'No single clue is conclusive on its own — a palm tree alone doesn\'t prove California — but several consistent clues together build real confidence.',
      'Run it against both sample photos and compare: one set of clues points toward the US West Coast, the other toward France.'
    ],
    commands: [
      { cmd: 'imageanalyze ~/osint/loading_dock.jpg', desc: 'Extract visible clues from the first photo' },
      { cmd: 'imageanalyze ~/osint/street_scene.jpg', desc: 'Extract visible clues from a second, different photo' }
    ],
    hints: [
      'Look at the language on signage in each photo — that alone usually narrows a location to a country or region.',
      'The two photos deliberately point in very different directions — treat this as practice telling them apart.'
    ],
    challenge: {
      prompt: 'Run imageanalyze on both ~/osint/loading_dock.jpg and ~/osint/street_scene.jpg.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('imageanalyze') && l.includes('loading_dock.jpg')) &&
        historyIncludes(state, (l) => l.startsWith('imageanalyze') && l.includes('street_scene.jpg'))
    }
  },
  {
    id: 'geoint-reverse-image-search',
    tag: '14.3',
    title: 'Reverse Image Search',
    theory: [
      '"imgsearch" simulates a reverse image search: instead of searching by keyword, you search by the image itself, finding every other place online that same picture has been posted.',
      'This is often the fastest path in GEOINT — someone else may have already captioned the same photo with the exact location, sometimes months before you ever needed to figure it out.',
      'Run it against ~/osint/loading_dock.jpg — the same photo turns up on a corp-target.lab blog post and an employee\'s Instagram, both naming a specific city.'
    ],
    commands: [
      { cmd: 'imgsearch ~/osint/loading_dock.jpg', desc: 'Find other places this photo has been posted' }
    ],
    hints: [
      'Look at the caption text in the results, not just the URLs — one of them names a specific city.',
      'This single command often does more work than all the visual-clue analysis from the last lesson combined.'
    ],
    challenge: {
      prompt: 'Run imgsearch on ~/osint/loading_dock.jpg and find the city named in a caption.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('imgsearch') && l.includes('loading_dock.jpg'))
    }
  },
  {
    id: 'geoint-landmark-satellite',
    tag: '14.4',
    title: 'Landmark & Satellite Correlation',
    theory: [
      'Once you have a candidate location — from a caption, a sign, or a guess — "mapsearch" cross-references it against known landmarks and satellite imagery, confirming or ruling out the match.',
      '"mapsearch sacramento" pulls up Nova Logistics\' Sacramento distribution center, with a description built specifically to compare against what you saw in imageanalyze: a palm-lined perimeter and matching bay numbering.',
      'This closes the loop: visual clues suggested a region, reverse image search named a city, and satellite correlation confirms the exact building.'
    ],
    commands: [
      { cmd: 'mapsearch sacramento', desc: 'Look up the candidate location by name' }
    ],
    hints: [
      'The city name came from the caption in the last lesson\'s imgsearch results.',
      'Compare the returned description against the imageanalyze clues from two lessons ago — do they line up?'
    ],
    challenge: {
      prompt: 'Run mapsearch for the city named in the imgsearch caption and confirm it matches the photo\'s visual clues.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('mapsearch') && l.toLowerCase().includes('sacramento'))
    }
  },
  {
    id: 'geoint-shadow-time',
    tag: '14.5',
    title: 'Shadows & Sun-Angle Time Estimation',
    theory: [
      'Beyond where a photo was taken, shadow length and direction can estimate when it was taken — a skill real investigators use to pin down a timeline, not just a location.',
      'The rule of thumb: a shadow roughly equal to an object\'s height means the sun is around 45 degrees up (mid-morning or mid-afternoon); a much longer shadow means early morning, late afternoon, or winter; a much shorter one means midday.',
      '~/osint/shadow_chart.txt applies this directly to the loading-dock photo\'s forklift, whose shadow is roughly its own height.'
    ],
    commands: [
      { cmd: 'cat ~/osint/shadow_chart.txt', desc: 'Read the sun-angle reference and its applied conclusion' }
    ],
    hints: [
      'Compare the forklift\'s height to its shadow length in the chart\'s own written conclusion at the bottom.',
      'A shadow-length-equals-height ratio means mid-morning or mid-afternoon — not midday, and not dawn or dusk.'
    ],
    challenge: {
      prompt: 'Read ~/osint/shadow_chart.txt and identify the estimated time-of-day category for the loading-dock photo.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('cat') && l.includes('shadow_chart.txt'))
    }
  },
  {
    id: 'geoint-cross-referencing',
    tag: '14.6',
    title: 'Cross-Referencing Multiple Clue Types',
    theory: [
      'No single GEOINT technique is reliable alone — metadata can be stripped, a reverse image search can come up empty, a landmark can be ambiguous. Real confidence comes from stacking independent methods and checking they agree.',
      'For the loading-dock photo: imageanalyze suggested the US West Coast, imgsearch named Sacramento directly, and mapsearch confirmed a matching facility there — three independent methods, one consistent answer.',
      'street_scene.jpg is a useful contrast: run the same tools against it and notice imgsearch returns nothing — a reminder that GEOINT doesn\'t always fully resolve, and knowing when to stop is part of the skill.'
    ],
    commands: [
      { cmd: 'imageanalyze ~/osint/street_scene.jpg', desc: 'Revisit this photo\'s clues with the full methodology in mind' },
      { cmd: 'imgsearch ~/osint/street_scene.jpg', desc: 'Confirm no reverse-image matches exist for this one' }
    ],
    hints: [
      '"No matches found" is a real, valid GEOINT outcome — not every photo can be pinned down with the sources available.',
      'Compare how confident you can be about street_scene.jpg (clues only) versus loading_dock.jpg (three independent confirmations).'
    ],
    challenge: {
      prompt: 'Run imageanalyze and imgsearch on street_scene.jpg and notice the reverse image search returns no matches.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('imageanalyze') && l.includes('street_scene.jpg')) &&
        historyIncludes(state, (l) => l.startsWith('imgsearch') && l.includes('street_scene.jpg'))
    }
  },
  {
    id: 'geoint-confidence-levels',
    tag: '14.7',
    title: 'Confidence Levels & Avoiding False Positives',
    theory: [
      'A professional GEOINT write-up never states a location as a bare fact — it rates confidence: CONFIRMED (multiple independent sources agree), LIKELY (strong circumstantial clues, no direct confirmation), or UNCONFIRMED (a guess worth noting but not relying on).',
      'Overconfidence is the single most common mistake in amateur geolocation — a palm tree and a US-style sign don\'t prove California specifically, only a region; claiming more precision than the evidence supports is how real investigations go wrong.',
      'Apply this now: write a rated summary of both photos investigated in this module, one confirmed and one unconfirmed.'
    ],
    commands: [
      { cmd: "echo 'loading_dock.jpg: CONFIRMED - Sacramento, CA (imgsearch caption + mapsearch match)' > geo_findings.txt", desc: 'Rate the first photo\'s confidence' },
      { cmd: "echo 'street_scene.jpg: UNCONFIRMED - likely France (visual clues only, no corroboration)' >> geo_findings.txt", desc: 'Rate the second photo\'s confidence' },
      { cmd: 'cat geo_findings.txt', desc: 'Review the rated findings' }
    ],
    hints: [
      'Use the exact words CONFIRMED and UNCONFIRMED — that distinction is the whole point of this lesson.',
      'The first echo creates the file with ">"; the second appends with ">>".'
    ],
    challenge: {
      prompt: 'Write geo_findings.txt rating loading_dock.jpg as CONFIRMED and street_scene.jpg as UNCONFIRMED.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'geo_findings.txt']);
        return !!node && node.type === 'file' && node.content.includes('CONFIRMED') && node.content.includes('UNCONFIRMED');
      }
    }
  },
  {
    id: 'geoint-capstone',
    tag: '14.8',
    title: 'Capstone: Full Geolocation of a Single Photo',
    theory: [
      'This closes the module by running the entire GEOINT workflow against one photo start to finish: confirm metadata is stripped, extract visual clues, reverse-image search, correlate against a landmark, and write a confidence-rated conclusion — exactly the deliverable a real geolocation analyst would produce.',
      'Every step here reused a tool from earlier in the module — GEOINT is less about any single clever trick and more about working through the same short checklist patiently, every time.'
    ],
    commands: [
      { cmd: 'exiftool ~/osint/loading_dock.jpg', desc: 'Step 1: confirm metadata is stripped' },
      { cmd: 'imageanalyze ~/osint/loading_dock.jpg', desc: 'Step 2: extract visual clues' },
      { cmd: 'imgsearch ~/osint/loading_dock.jpg', desc: 'Step 3: reverse image search' },
      { cmd: 'mapsearch sacramento', desc: 'Step 4: correlate against a landmark' },
      { cmd: "echo 'GEOINT Report: loading_dock.jpg' > geoint_report.txt", desc: 'Start the report' },
      { cmd: "echo 'Location: Sacramento, CA - Nova Logistics Distribution Center' >> geoint_report.txt", desc: 'Record the location' },
      { cmd: "echo 'Confidence: CONFIRMED (visual clues + reverse image search + satellite match)' >> geoint_report.txt", desc: 'Record the confidence rating' },
      { cmd: 'cat geoint_report.txt', desc: 'Review the finished report' }
    ],
    hints: [
      'Work through the four tools in order before writing the report — each one builds on the last.',
      'The report must state both a location and a confidence rating — a bare location without a rating isn\'t a complete GEOINT deliverable.'
    ],
    challenge: {
      prompt: 'Run the full GEOINT workflow (exiftool, imageanalyze, imgsearch, mapsearch) on loading_dock.jpg, then write geoint_report.txt with a location and confidence rating.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'geoint_report.txt']);
        const built = !!node && node.type === 'file' && node.content.toLowerCase().includes('sacramento') && node.content.toUpperCase().includes('CONFIRMED');
        return built &&
          historyIncludes(state, (l) => l.startsWith('exiftool') && l.includes('loading_dock.jpg')) &&
          historyIncludes(state, (l) => l.startsWith('imageanalyze') && l.includes('loading_dock.jpg')) &&
          historyIncludes(state, (l) => l.startsWith('imgsearch') && l.includes('loading_dock.jpg')) &&
          historyIncludes(state, (l) => l.startsWith('mapsearch'));
      }
    }
  },
  {
    id: 'bizint-intro',
    tag: '15.1',
    title: 'Corporate & Business Intelligence: Investigating an Organization',
    theory: [
      'Corporate (or "business") intelligence applies OSINT to organizations rather than individual people or systems: who legally owns and runs a company, what technology it depends on, and how its corporate structure fits together.',
      'Every company leaves a legal paper trail — incorporation filings, officer listings, registered agents — none of it requires hacking anything to read; it exists specifically so the public and regulators can look it up.',
      'This module continues investigating Nova Retail Group, corp-target.lab\'s parent company from Module 13, now from the business side rather than the technical one.'
    ],
    commands: [
      { cmd: 'corpreg Nova Retail Group', desc: 'Look up the company\'s registry filing' }
    ],
    hints: [
      '"corpreg" takes a company name, not a domain — unlike whois in Module 13.',
      'Note the officer list — the same names (Jordan Martinez, Aisha Chen) from Module 13\'s email harvest show up here with full titles.'
    ],
    challenge: {
      prompt: 'Run corpreg against Nova Retail Group and note its officers.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('corpreg') && l.toLowerCase().includes('nova retail group'))
    }
  },
  {
    id: 'bizint-job-postings',
    tag: '15.2',
    title: 'Mining Job Postings for Tech Stack Intelligence',
    theory: [
      'A company\'s job postings are written to attract the right applicants — which means they often list, in plain text, exactly which cloud provider, database, and tools the company runs internally.',
      '"jobscrape" pulls these open postings together — a "Senior DevOps Engineer" listing requiring "AWS, Kubernetes, Terraform, PostgreSQL" tells you almost as much about their infrastructure as a network scan would, without sending it a single packet.',
      'This is why security-conscious companies review postings for oversharing before publishing them — the same page meant to attract talent doubles as a stack disclosure to anyone else reading it.'
    ],
    commands: [
      { cmd: 'jobscrape Nova Retail Group', desc: 'List open postings and their required tech stack' }
    ],
    hints: [
      'Look across all three postings — together they sketch out a cloud provider, a container orchestration tool, an IaC tool, and an identity provider.',
      'Compare the "IT Support Specialist" posting\'s stack (Google Workspace, Okta) to what "dig ... TXT" revealed about their mail provider in Module 13.'
    ],
    challenge: {
      prompt: 'Run jobscrape against Nova Retail Group and identify their cloud provider and container orchestration tool.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('jobscrape') && l.toLowerCase().includes('nova retail group'))
    }
  },
  {
    id: 'bizint-org-chart',
    tag: '15.3',
    title: 'Org-Chart & Employee Mapping',
    theory: [
      '"orgchart" reconstructs reporting lines from public profile data — turning a flat list of names into an actual hierarchy.',
      'Knowing who reports to whom matters for more than curiosity: it tells a social-engineering assessment which employee could plausibly "forward a request from the CEO," and tells a defender which accounts are the highest-value phishing targets.',
      'Cross-reference this with the email work from Module 13 — Jordan Martinez, IT Director, is exactly the kind of role an attacker would target first for infrastructure access.'
    ],
    commands: [
      { cmd: 'orgchart Nova Retail Group', desc: 'View the reconstructed reporting hierarchy' }
    ],
    hints: [
      'The CEO has no "reports to" line — that\'s the top of the chart, not a gap in the data.',
      'Notice both Module 13 employees (Jordan Martinez, Aisha Chen) report directly to the CEO — a flat, four-person leadership structure.'
    ],
    challenge: {
      prompt: 'Run orgchart against Nova Retail Group and identify who Jordan Martinez reports to.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('orgchart') && l.toLowerCase().includes('nova retail group'))
    }
  },
  {
    id: 'bizint-news-mna',
    tag: '15.4',
    title: 'News & M&A Intelligence',
    theory: [
      '"biznews" searches public news coverage — press releases, trade publications, local business journals — for a company\'s recent activity: acquisitions, expansions, funding, leadership changes.',
      'An acquisition is especially significant for an investigation: newly acquired subsidiaries often run on completely different, less-scrutinized infrastructure than the parent company for months or years after a deal closes.',
      'Nova Retail Group\'s news shows exactly this pattern: a 2025 distribution-center expansion (the same Sacramento facility from Module 14\'s GEOINT work) followed by a 2026 acquisition of a regional chain.'
    ],
    commands: [
      { cmd: 'biznews Nova Retail Group', desc: 'Search recent news coverage' }
    ],
    hints: [
      'Results are ordered most-recent first — the acquisition is the newest item.',
      'Notice the Sacramento distribution-center headline lines up exactly with what GEOINT confirmed in Module 14.'
    ],
    challenge: {
      prompt: 'Run biznews against Nova Retail Group and find the company it acquired.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('biznews') && l.toLowerCase().includes('nova retail group'))
    }
  },
  {
    id: 'bizint-subsidiaries',
    tag: '15.5',
    title: 'Subsidiary & Corporate Structure Mapping',
    theory: [
      '"subsidiaries" maps the ownership tree directly: what parent owns this entity, and what does this entity itself own — following the acquisition just found in the news search.',
      'A newly acquired subsidiary (QuickMart, from the last lesson\'s headline) is exactly the kind of target this command surfaces — worth investigating on its own, since its systems and employees may not yet be folded into the parent\'s security posture.',
      'Corporate structure mapping is often the first step in scoping a real assessment: which of these entities are actually in scope, and which of them share infrastructure with the parent?'
    ],
    commands: [
      { cmd: 'subsidiaries Nova Retail Group', desc: 'Map parent and subsidiary relationships' }
    ],
    hints: [
      'QuickMart Inc. should appear here — the same company biznews reported as a recent acquisition.',
      'Nova Logistics LLC is the entity behind the "NOVA LOGISTICS" branding seen in Module 14\'s loading-dock photo — corporate structure explains a visual clue from an earlier module.'
    ],
    challenge: {
      prompt: 'Run subsidiaries against Nova Retail Group and confirm QuickMart Inc. appears as a subsidiary.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('subsidiaries') && l.toLowerCase().includes('nova retail group'))
    }
  },
  {
    id: 'bizint-synthesis',
    tag: '15.6',
    title: 'Synthesizing a Corporate Intelligence Profile',
    theory: [
      'Raw lookups are only half the job — a real corporate intelligence deliverable synthesizes them into a profile someone else can act on without re-running every command themselves.',
      'A good profile answers a small set of standard questions: who legally runs this company, what does it depend on technically, who are the highest-value individual targets, and what recent changes affect its risk profile.',
      'Write that profile now, pulling one fact from each tool used so far in this module.'
    ],
    commands: [
      { cmd: "echo 'Corporate Profile: Nova Retail Group' > corp_profile.txt", desc: 'Start the profile' },
      { cmd: "echo 'Officers: Priya Raman (CEO), Jordan Martinez (IT Director)' >> corp_profile.txt", desc: 'Record leadership' },
      { cmd: "echo 'Stack: AWS, Kubernetes, Terraform, PostgreSQL, Google Workspace' >> corp_profile.txt", desc: 'Record the tech stack' },
      { cmd: "echo 'Recent activity: acquired QuickMart Inc. (2026), Sacramento DC expansion (2025)' >> corp_profile.txt", desc: 'Record recent M&A activity' },
      { cmd: 'cat corp_profile.txt', desc: 'Review the finished profile' }
    ],
    hints: [
      'Pull the tech stack straight from your jobscrape output and the leadership straight from corpreg/orgchart.',
      'The first echo line must use ">" to create corp_profile.txt; the rest use ">>" to append.'
    ],
    challenge: {
      prompt: 'Write corp_profile.txt covering officers, tech stack, and recent M&A activity for Nova Retail Group.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'corp_profile.txt']);
        return !!node && node.type === 'file' && node.content.includes('Priya Raman') && node.content.toLowerCase().includes('quickmart');
      }
    }
  },
  {
    id: 'bizint-ethics',
    tag: '15.7',
    title: 'Ethics & Legal Boundaries in Corporate Intelligence',
    theory: [
      'Everything in this module reads sources a company itself chose to publish — a registry filing, a job posting, a press release. That\'s the legal and ethical line: reading what\'s public is corporate intelligence; anything requiring a login, a bypassed paywall, or a leaked document is not.',
      'The same techniques serve very different purposes depending on who\'s using them — investors doing due diligence, journalists verifying a story, red teams scoping an assessment, and threat actors planning a phishing campaign all use nearly identical tools; intent and authorization are what separate them.',
      'A professional engagement always operates under written scope and authorization — even purely passive lookups can carry legal risk depending on jurisdiction and purpose without it.'
    ],
    commands: [
      { cmd: "echo 'Sources: registry filing, job postings, org chart, press coverage — all public' >> corp_profile.txt", desc: 'Document your sourcing for accountability' },
      { cmd: 'cat corp_profile.txt', desc: 'Review the complete, sourced profile' }
    ],
    hints: [
      'There\'s no new lookup tool in this lesson — it\'s about the judgment behind the tools you\'ve already used.',
      'Ask yourself: could every fact in corp_profile.txt be traced back to something the company itself published or filed? If yes, you stayed within bounds.'
    ],
    challenge: {
      prompt: 'Append a sourcing note to corp_profile.txt confirming every fact traces to a public source, then review it.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'corp_profile.txt']);
        return !!node && node.type === 'file' && node.content.toLowerCase().includes('sources') &&
          historyIncludes(state, (l) => l.startsWith('cat') && l.includes('corp_profile.txt'));
      }
    }
  },
  {
    id: 'bizint-capstone',
    tag: '15.8',
    title: 'Capstone: Full Corporate Intelligence Report',
    theory: [
      'This closes the module by running every corporate-intel tool against Nova Retail Group in one pass and producing a single, sourced deliverable — the same shape as every capstone so far, applied to a company instead of a domain or a photo.',
      'Notice how this module\'s findings connect to earlier ones: the tech stack here matches the MX/TXT records from Module 13, and the Sacramento facility matches the GEOINT work from Module 14 — corporate intelligence is often the layer that explains why the technical and visual clues looked the way they did.'
    ],
    commands: [
      { cmd: 'corpreg Nova Retail Group', desc: 'Confirm legal ownership and officers' },
      { cmd: 'jobscrape Nova Retail Group', desc: 'Identify the tech stack' },
      { cmd: 'orgchart Nova Retail Group', desc: 'Map the reporting hierarchy' },
      { cmd: 'biznews Nova Retail Group', desc: 'Check recent news and M&A activity' },
      { cmd: 'subsidiaries Nova Retail Group', desc: 'Map the corporate structure' },
      { cmd: "echo 'Corporate Intelligence Report: Nova Retail Group' > bizint_report.txt", desc: 'Start the report' },
      { cmd: "echo 'Structure: Delaware corp, parent of QuickMart Inc. and Nova Logistics LLC' >> bizint_report.txt", desc: 'Record structure' },
      { cmd: "echo 'Leadership: Priya Raman (CEO), Jordan Martinez (IT Director)' >> bizint_report.txt", desc: 'Record leadership' },
      { cmd: "echo 'Stack: AWS, Kubernetes, Terraform, PostgreSQL' >> bizint_report.txt", desc: 'Record tech stack' },
      { cmd: 'cat bizint_report.txt', desc: 'Review the finished report' }
    ],
    hints: [
      'Work through all five tools before writing the report — each one contributes at least one line.',
      'This report format (structure, leadership, stack) mirrors corp_profile.txt from earlier, just formalized as a standalone deliverable.'
    ],
    challenge: {
      prompt: 'Run corpreg, jobscrape, orgchart, biznews, and subsidiaries against Nova Retail Group, then write bizint_report.txt.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'bizint_report.txt']);
        const built = !!node && node.type === 'file' && node.content.toLowerCase().includes('quickmart') && node.content.includes('Priya Raman');
        return built &&
          historyIncludes(state, (l) => l.startsWith('corpreg') && l.toLowerCase().includes('nova retail group')) &&
          historyIncludes(state, (l) => l.startsWith('jobscrape') && l.toLowerCase().includes('nova retail group')) &&
          historyIncludes(state, (l) => l.startsWith('orgchart') && l.toLowerCase().includes('nova retail group')) &&
          historyIncludes(state, (l) => l.startsWith('biznews') && l.toLowerCase().includes('nova retail group')) &&
          historyIncludes(state, (l) => l.startsWith('subsidiaries') && l.toLowerCase().includes('nova retail group'));
      }
    }
  },
  {
    id: 'breachint-intro',
    tag: '16.1',
    title: 'Breach & Credential Intelligence: Finding Your Own Exposure',
    theory: [
      'Breach intelligence flips OSINT toward defense: security teams use these exact tools against their own employees to find out what\'s already been exposed in past data breaches — often long before an attacker gets around to using it.',
      '"hibp" (after the real-world "Have I Been Pwned" service) checks whether an email address appears in a known breach, and if so, what kind of data was exposed alongside it.',
      'Everything in this module continues the Nova Retail Group investigation — starting with the same jmartinez@corp-target.lab email harvested back in Module 13.'
    ],
    commands: [
      { cmd: 'hibp jmartinez@corp-target.lab', desc: 'Check this address against known breaches' }
    ],
    hints: [
      'Two breaches should come back — note the date and what data each one exposed.',
      '"Passwords (hashed)" being exposed doesn\'t mean the plaintext password is known — that distinction matters and comes up again later in this module.'
    ],
    challenge: {
      prompt: 'Run hibp against jmartinez@corp-target.lab and note how many breaches it appears in.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('hibp') && l.includes('jmartinez@corp-target.lab'))
    }
  },
  {
    id: 'breachint-second-employee',
    tag: '16.2',
    title: 'Checking Every Harvested Address',
    theory: [
      'A single check is never enough — Module 13\'s theHarvester found three addresses at corp-target.lab; a real exposure assessment checks every one of them, not just the first.',
      'Different employees can have very different exposure: achen@corp-target.lab appears in a breach that only exposed names and email addresses, not passwords — a much lower-severity finding than jmartinez\'s.',
      'This is standard practice for security teams running their own domain through breach-monitoring services: check the whole harvested list, then prioritize responses by severity.'
    ],
    commands: [
      { cmd: 'hibp achen@corp-target.lab', desc: 'Check the second harvested address' }
    ],
    hints: [
      'Compare the data classes exposed here to jmartinez\'s result from the last lesson — this one is less severe.',
      'support@corp-target.lab (the third harvested address) isn\'t in this lab\'s breach database at all — try it to see what a clean result looks like.'
    ],
    challenge: {
      prompt: 'Run hibp against achen@corp-target.lab and compare its severity to jmartinez\'s result.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('hibp') && l.includes('achen@corp-target.lab'))
    }
  },
  {
    id: 'breachint-cred-search',
    tag: '16.3',
    title: 'Credential Dump Search',
    theory: [
      '"credsearch" goes one level deeper than hibp: it looks at what a dump actually contains for that address — in this lab, a hashed password value rather than the plaintext.',
      'The hash itself is never decoded here — that would cross from defensive breach-monitoring into password cracking, a different and far more legally fraught activity. The hash is only useful for comparison: does the same hash show up more than once?',
      'jmartinez@corp-target.lab has an identical hash in two different breach dumps — worth remembering for the next lesson.'
    ],
    commands: [
      { cmd: 'credsearch jmartinez@corp-target.lab', desc: 'Search credential dumps for this address' }
    ],
    hints: [
      'Look closely at the two hash values returned — are they the same string or different ones?',
      'This command deliberately never shows a real password — only a hash, exactly like a real breach-monitoring tool would surface.'
    ],
    challenge: {
      prompt: 'Run credsearch against jmartinez@corp-target.lab and note whether the two hash values match.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('credsearch') && l.includes('jmartinez@corp-target.lab'))
    }
  },
  {
    id: 'breachint-password-reuse',
    tag: '16.4',
    title: 'Detecting Password Reuse with passpattern',
    theory: [
      'Two identical hashes across two different breaches means one thing: the same password was used both times. "passpattern" automates exactly this comparison instead of asking a human to eyeball hash strings.',
      'Password reuse is one of the highest-value findings in a breach assessment — it means a password leaked in one old breach might still work as jmartinez\'s current corp-target.lab password, since people reuse passwords across accounts and over time far more than they should.',
      'The correct response to this finding isn\'t to try the password anywhere — it\'s exactly what the output recommends: flag the account for a forced credential reset.'
    ],
    commands: [
      { cmd: 'passpattern jmartinez@corp-target.lab', desc: 'Check for password reuse across breaches' }
    ],
    hints: [
      'The tool reports "high-priority candidate for a forced credential reset" — that\'s the actual, responsible outcome of this finding.',
      'Try "passpattern achen@corp-target.lab" too — with only one breach on file, there\'s nothing to compare, so no reuse can be detected either way.'
    ],
    challenge: {
      prompt: 'Run passpattern against jmartinez@corp-target.lab and confirm it detects password reuse.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('passpattern') && l.includes('jmartinez@corp-target.lab'))
    }
  },
  {
    id: 'breachint-paste-sites',
    tag: '16.5',
    title: 'Paste-Site Monitoring',
    theory: [
      'Leaked data doesn\'t only show up in formal breach databases — it\'s often dumped first onto paste sites, quick-share text services originally meant for code snippets, now also a common place attackers post stolen data as proof before selling it.',
      '"pastesearch" monitors these sites for mentions of a domain — finding a posted snippet referencing corp-target.lab admin credentials is a strong, urgent signal, often arriving before a formal breach notification ever would.',
      'Timing matters here more than in most other OSINT work: a paste-site mention is frequently the earliest public warning that something needs to be locked down immediately.'
    ],
    commands: [
      { cmd: 'pastesearch corp-target.lab', desc: 'Search paste sites for mentions of the domain' }
    ],
    hints: [
      'The snippet returned references an "admin panel" dump — cross-reference this with the /admin path found back in Module 8.',
      'A paste-site hit like this should trigger an immediate password reset and access review, not just a note in a report.'
    ],
    challenge: {
      prompt: 'Run pastesearch against corp-target.lab and review the leaked snippet it finds.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('pastesearch') && l.includes('corp-target.lab'))
    }
  },
  {
    id: 'breachint-darkweb-mentions',
    tag: '16.6',
    title: 'Dark-Web Mention Monitoring',
    theory: [
      'Beyond paste sites, dedicated criminal forums (often only reachable over Tor — covered properly in Module 18) are where stolen data actually gets marketed and sold, not just dumped for proof.',
      '"darkmentions" simulates monitoring an archived, indexed copy of these forums for mentions of an organization\'s name — the kind of service commercial threat-intelligence vendors sell to companies specifically so they don\'t have to browse these forums themselves.',
      'A listing offering to sell "Nova Retail Group" employee data is the most severe finding this module surfaces — it means a breach isn\'t just historical, it may be actively being monetized right now.'
    ],
    commands: [
      { cmd: 'darkmentions Nova Retail Group', desc: 'Search dark-web forum archives for mentions of the company' }
    ],
    hints: [
      'Note the listing is marked "unverified" — dark-web chatter is often exaggerated or outright fake to build a seller\'s reputation, so verification still matters before acting.',
      'This is exactly the kind of finding that gets escalated immediately rather than sitting in a routine report.'
    ],
    challenge: {
      prompt: 'Run darkmentions against Nova Retail Group and review the forum listing it finds.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('darkmentions') && l.toLowerCase().includes('nova retail group'))
    }
  },
  {
    id: 'breachint-remediation-plan',
    tag: '16.7',
    title: 'Turning Findings into a Remediation Plan',
    theory: [
      'A breach assessment that ends at "here\'s what we found" isn\'t finished — every finding needs a concrete, prioritized remediation action, or the whole exercise was just an interesting report nobody acted on.',
      'Prioritize by severity and urgency: password reuse and paste-site or dark-web mentions of active credentials outrank an old breach that only exposed a name and email.',
      'Write that remediation plan now, matching each finding from this module to a specific action.'
    ],
    commands: [
      { cmd: "echo 'Remediation Plan: Nova Retail Group Breach Exposure' > remediation_plan.txt", desc: 'Start the plan' },
      { cmd: "echo 'jmartinez@corp-target.lab: password reuse confirmed - FORCE RESET + enable MFA' >> remediation_plan.txt", desc: 'Record the highest-priority action' },
      { cmd: "echo 'corp-target.lab admin creds pasted online - ROTATE admin credentials immediately' >> remediation_plan.txt", desc: 'Record the paste-site action' },
      { cmd: "echo 'achen@corp-target.lab: low-severity breach - monitor only' >> remediation_plan.txt", desc: 'Record the lower-priority action' },
      { cmd: 'cat remediation_plan.txt', desc: 'Review the finished plan' }
    ],
    hints: [
      'Match each action\'s urgency to the finding\'s severity — password reuse and pasted credentials get immediate action, a names-only breach gets a lower-priority note.',
      'The first echo line must use ">" to create remediation_plan.txt; the rest use ">>" to append.'
    ],
    challenge: {
      prompt: 'Write remediation_plan.txt with a prioritized action for each finding from this module.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'remediation_plan.txt']);
        return !!node && node.type === 'file' && node.content.toUpperCase().includes('FORCE RESET') && node.content.toUpperCase().includes('ROTATE');
      }
    }
  },
  {
    id: 'breachint-capstone',
    tag: '16.8',
    title: 'Capstone: Full Breach Exposure Assessment',
    theory: [
      'This closes the module by running the complete breach-monitoring workflow — checking every harvested address, searching for leaked credentials and reuse, scanning paste sites and dark-web forums — then producing one prioritized report, exactly like a real security team\'s periodic exposure review.',
      'This module is the clearest example yet of OSINT used purely defensively: every tool here exists so an organization can find its own exposure before an attacker exploits it, not to attack anyone.'
    ],
    commands: [
      { cmd: 'hibp jmartinez@corp-target.lab', desc: 'Check the first employee for breaches' },
      { cmd: 'hibp achen@corp-target.lab', desc: 'Check the second employee for breaches' },
      { cmd: 'credsearch jmartinez@corp-target.lab', desc: 'Search for leaked credential hashes' },
      { cmd: 'passpattern jmartinez@corp-target.lab', desc: 'Check for password reuse' },
      { cmd: 'pastesearch corp-target.lab', desc: 'Scan paste sites for the domain' },
      { cmd: 'darkmentions Nova Retail Group', desc: 'Scan dark-web forums for the company' },
      { cmd: "echo 'Breach Exposure Report: Nova Retail Group' > breach_report.txt", desc: 'Start the report' },
      { cmd: "echo 'Critical: jmartinez password reuse across 2 breaches - force reset' >> breach_report.txt", desc: 'Record the critical finding' },
      { cmd: "echo 'Critical: admin credentials referenced in a paste-site dump - rotate now' >> breach_report.txt", desc: 'Record the paste-site finding' },
      { cmd: "echo 'Watch: unverified dark-web listing selling employee data' >> breach_report.txt", desc: 'Record the dark-web finding' },
      { cmd: 'cat breach_report.txt', desc: 'Review the finished report' }
    ],
    hints: [
      'Work through all six lookup tools before writing the report — check both employees, not just one.',
      'Rank findings the same way real incident response does: reuse and pasted credentials are CRITICAL; a names-only breach or an unverified listing is a lower WATCH-level item.'
    ],
    challenge: {
      prompt: 'Run hibp (both employees), credsearch, passpattern, pastesearch, and darkmentions, then write breach_report.txt with prioritized findings.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'breach_report.txt']);
        const built = !!node && node.type === 'file' && node.content.toLowerCase().includes('force reset') && node.content.toLowerCase().includes('rotate');
        return built &&
          historyIncludes(state, (l) => l.startsWith('hibp') && l.includes('jmartinez@corp-target.lab')) &&
          historyIncludes(state, (l) => l.startsWith('hibp') && l.includes('achen@corp-target.lab')) &&
          historyIncludes(state, (l) => l.startsWith('credsearch') && l.includes('jmartinez@corp-target.lab')) &&
          historyIncludes(state, (l) => l.startsWith('passpattern') && l.includes('jmartinez@corp-target.lab')) &&
          historyIncludes(state, (l) => l.startsWith('pastesearch') && l.includes('corp-target.lab')) &&
          historyIncludes(state, (l) => l.startsWith('darkmentions') && l.toLowerCase().includes('nova retail group'));
      }
    }
  },
  {
    id: 'socmint-intro',
    tag: '17.1',
    title: 'SOCMINT: Social Media Intelligence & Network Analysis',
    theory: [
      '"SOCMINT" (Social Media Intelligence) studies not just what one account posts, but how accounts connect to each other, when they post, and how coordinated (or fake) activity around a topic looks.',
      'This goes beyond Module 13\'s username lookup — sherlock just confirms an account exists. SOCMINT maps the relationships and patterns around those accounts once found.',
      'This module continues with jmartinez and achen, the two Nova Retail Group employees identified back in Module 13.'
    ],
    commands: [
      { cmd: 'sherlock jmartinez', desc: 'Recall which platforms this account exists on (from Module 13)' }
    ],
    hints: [
      'This reuses a Module 13 tool as a starting point — SOCMINT builds on an account you\'ve already confirmed exists.'
    ],
    challenge: {
      prompt: 'Run sherlock again on jmartinez to recall its confirmed platforms before mapping its network.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('sherlock') && l.includes('jmartinez'))
    }
  },
  {
    id: 'socmint-social-graph',
    tag: '17.2',
    title: 'Mapping a Social Graph',
    theory: [
      '"socialgraph" maps who an account follows and who follows it back — turning a single profile into a small network of connections worth investigating further.',
      'jmartinez follows a personal/professional mix — achen, a Kubernetes account, a Terraform account — and the technical accounts alone corroborate the tech stack found in Module 15\'s job postings.',
      'A "followed by" list matters just as much: psingh_vendor following jmartinez back suggests an external vendor relationship worth a closer look.'
    ],
    commands: [
      { cmd: 'socialgraph jmartinez', desc: 'Map this account\'s social connections' }
    ],
    hints: [
      'Notice the technical accounts jmartinez follows — they line up with Module 15\'s jobscrape findings almost exactly.',
      '"psingh_vendor" stands out as the one connection that isn\'t an internal employee or a topic account — a good next lead.'
    ],
    challenge: {
      prompt: 'Run socialgraph on jmartinez and identify the one external vendor connection.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('socialgraph') && l.includes('jmartinez'))
    }
  },
  {
    id: 'socmint-posting-patterns',
    tag: '17.3',
    title: 'Posting Pattern & Timezone Analysis',
    theory: [
      '"postpattern" looks at when an account posts, not what it posts — timestamps alone can reveal a work schedule, a timezone, and even routine deviations worth noting.',
      'jmartinez\'s posts cluster during Pacific business hours, consistent with the Sacramento facility Module 14\'s GEOINT work confirmed — timing evidence corroborating a location finding from an entirely different technique.',
      'A single late-night outlier post is also worth flagging — not as a security problem by itself, but as a reminder that the same account can behave differently outside its usual pattern.'
    ],
    commands: [
      { cmd: 'postpattern jmartinez', desc: 'Analyze this account\'s posting times' }
    ],
    hints: [
      'Look for the cluster of times during a normal business day — that\'s the routine.',
      'The one timestamp that breaks the pattern is flagged separately in the output — notice how it\'s described, not judged.'
    ],
    challenge: {
      prompt: 'Run postpattern on jmartinez and identify both the normal posting window and the one outlier.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('postpattern') && l.includes('jmartinez'))
    }
  },
  {
    id: 'socmint-hashtag-tracking',
    tag: '17.4',
    title: 'Hashtag & Campaign Tracking',
    theory: [
      '"hashtag" pulls together every post using a specific tag — useful for tracking a company\'s own marketing campaign, or for finding what employees post about an internal event using an official (or unofficial) event hashtag.',
      '#NovaAllHands turns up posts from both achen and jmartinez naming the exact offsite event referenced in Module 13\'s team_photo.jpg metadata comment — three completely different techniques converging on the same event.',
      'A hashtag search is often the fastest way to find a specific event\'s date and location once you already suspect it exists — much faster than manually reading every employee\'s timeline.'
    ],
    commands: [
      { cmd: 'hashtag #NovaAllHands', desc: 'Pull every post using this event hashtag' }
    ],
    hints: [
      'Compare the location and event name here to the "Comment" field exiftool found in Module 13\'s team_photo.jpg.',
      'Hashtags are case-insensitive in most real platforms and in this lab — try it with or without matching case.'
    ],
    challenge: {
      prompt: 'Run hashtag against #NovaAllHands and confirm it names the same event as Module 13\'s photo metadata.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('hashtag') && l.toLowerCase().includes('novaallhands'))
    }
  },
  {
    id: 'socmint-sentiment-bots',
    tag: '17.5',
    title: 'Sentiment Analysis & Spotting Inauthentic Activity',
    theory: [
      '"sentiment" summarizes overall opinion about a company or topic across many posts — useful for reputational monitoring — but its real value here is flagging activity that looks coordinated rather than organic.',
      'A cluster of nearly identical five-star reviews posted seconds apart by different accounts is a classic astroturfing signature — real customer feedback is rarely that repetitive or that perfectly timed.',
      'A "bot score" like this is a signal to investigate further, not a final verdict — confirming inauthentic activity usually needs more than a timing pattern alone.'
    ],
    commands: [
      { cmd: 'sentiment Nova Retail Group', desc: 'Check overall sentiment and flag suspicious activity' }
    ],
    hints: [
      'Compare the two sample reviews in the output — one reads as genuine feedback, the other reads as a templated, mass-posted review.',
      'A high bot score paired with near-identical wording and clustered timestamps is the specific combination that raises suspicion — any one alone would not be.'
    ],
    challenge: {
      prompt: 'Run sentiment against Nova Retail Group and identify the suspicious review cluster.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('sentiment') && l.toLowerCase().includes('nova retail group'))
    }
  },
  {
    id: 'socmint-cross-reference',
    tag: '17.6',
    title: 'Cross-Referencing Social Findings with Earlier Modules',
    theory: [
      'SOCMINT rarely stands alone — its real power shows up when a social-media finding lines up with something already known from another module: the vendor connection, the tech-stack accounts jmartinez follows, and the event hashtag all corroborate earlier findings rather than introducing something isolated.',
      'Write these cross-references down explicitly — a report that just lists "found X on social media" is weaker than one that says "X, which independently confirms Y from an earlier module."'
    ],
    commands: [
      { cmd: "echo 'Social Media Cross-References: Nova Retail Group' > socmint_notes.txt", desc: 'Start the notes' },
      { cmd: "echo 'jmartinez follows Kubernetes/Terraform accounts - confirms Module 15 tech stack findings' >> socmint_notes.txt", desc: 'Record the tech-stack corroboration' },
      { cmd: "echo '#NovaAllHands posts confirm the offsite event and location from Module 13 photo metadata' >> socmint_notes.txt", desc: 'Record the hashtag corroboration' },
      { cmd: 'cat socmint_notes.txt', desc: 'Review the cross-referenced notes' }
    ],
    hints: [
      'Each note should name both the social-media finding and the earlier module it confirms.',
      'This is the same "connect the dots across modules" habit the Module 15 capstone called out explicitly.'
    ],
    challenge: {
      prompt: 'Write socmint_notes.txt cross-referencing at least two social-media findings with earlier module findings.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'socmint_notes.txt']);
        return !!node && node.type === 'file' && node.content.includes('Module 15') && node.content.includes('Module 13');
      }
    }
  },
  {
    id: 'socmint-opsec-risk',
    tag: '17.7',
    title: 'OPSEC Risk from Oversharing',
    theory: [
      'Everything gathered in this module came from what employees chose to post publicly — which is exactly the point: oversharing on social media is one of the largest, most preventable sources of organizational exposure, and it costs an attacker nothing to collect.',
      'A good security-awareness recommendation is specific, not just "post less": lock down account visibility, avoid naming internal event details before they happen, and remember that posting patterns themselves (timing, followers) leak information even when the text of a post seems harmless.',
      'Write a short set of recommendations based specifically on what this module actually found — not generic advice.'
    ],
    commands: [
      { cmd: "echo 'OPSEC Recommendations: Nova Retail Group' > opsec_notes.txt", desc: 'Start the recommendations' },
      { cmd: "echo 'Avoid naming internal event details (e.g. #NovaAllHands) publicly before or during the event' >> opsec_notes.txt", desc: 'Record the hashtag-specific recommendation' },
      { cmd: "echo 'Review vendor/follower connections periodically for unexpected external accounts' >> opsec_notes.txt", desc: 'Record the social-graph-specific recommendation' },
      { cmd: 'cat opsec_notes.txt', desc: 'Review the finished recommendations' }
    ],
    hints: [
      'Tie each recommendation back to a specific finding from this module — generic "be careful online" advice isn\'t the goal here.'
    ],
    challenge: {
      prompt: 'Write opsec_notes.txt with at least two specific recommendations tied to this module\'s findings.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'opsec_notes.txt']);
        return !!node && node.type === 'file' && node.content.toLowerCase().includes('novaallhands') && node.content.toLowerCase().includes('vendor');
      }
    }
  },
  {
    id: 'socmint-capstone',
    tag: '17.8',
    title: 'Capstone: Full Social Media Intelligence Profile',
    theory: [
      'This closes the module by running every SOCMINT tool against jmartinez and Nova Retail Group in one pass and producing a single report, exactly like a real social-media intelligence deliverable.',
      'Notice how much of this report is corroboration rather than new discovery — SOCMINT here mostly confirmed and enriched findings from Modules 13-15, which is itself the point: independent confirmation is what turns a guess into a confident finding.'
    ],
    commands: [
      { cmd: 'sherlock jmartinez', desc: 'Confirm platform presence' },
      { cmd: 'socialgraph jmartinez', desc: 'Map social connections' },
      { cmd: 'postpattern jmartinez', desc: 'Analyze posting patterns' },
      { cmd: 'hashtag #NovaAllHands', desc: 'Track the internal event hashtag' },
      { cmd: 'sentiment Nova Retail Group', desc: 'Check brand sentiment and inauthentic activity' },
      { cmd: "echo 'SOCMINT Report: Nova Retail Group' > socmint_report.txt", desc: 'Start the report' },
      { cmd: "echo 'Network: jmartinez connected to vendor psingh_vendor and internal tech accounts' >> socmint_report.txt", desc: 'Record network findings' },
      { cmd: "echo 'Pattern: Pacific business-hours posting, consistent with Sacramento HQ' >> socmint_report.txt", desc: 'Record pattern findings' },
      { cmd: "echo 'Event: #NovaAllHands confirms offsite location and timing' >> socmint_report.txt", desc: 'Record hashtag findings' },
      { cmd: "echo 'Risk: suspected astroturfed reviews (bot score 0.62)' >> socmint_report.txt", desc: 'Record sentiment findings' },
      { cmd: 'cat socmint_report.txt', desc: 'Review the finished report' }
    ],
    hints: [
      'Work through all five tools before writing the report.',
      'Each report line should name a concrete finding, not just "checked X."'
    ],
    challenge: {
      prompt: 'Run sherlock, socialgraph, postpattern, hashtag, and sentiment, then write socmint_report.txt.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'socmint_report.txt']);
        const built = !!node && node.type === 'file' && node.content.toLowerCase().includes('vendor') && node.content.toLowerCase().includes('sacramento');
        return built &&
          historyIncludes(state, (l) => l.startsWith('sherlock') && l.includes('jmartinez')) &&
          historyIncludes(state, (l) => l.startsWith('socialgraph') && l.includes('jmartinez')) &&
          historyIncludes(state, (l) => l.startsWith('postpattern') && l.includes('jmartinez')) &&
          historyIncludes(state, (l) => l.startsWith('hashtag') && l.toLowerCase().includes('novaallhands')) &&
          historyIncludes(state, (l) => l.startsWith('sentiment') && l.toLowerCase().includes('nova retail group'));
      }
    }
  },
  {
    id: 'darkweb-intro',
    tag: '18.1',
    title: 'The Dark Web: What Tor Actually Is',
    theory: [
      '"Dark web" specifically refers to sites only reachable through an anonymity network like Tor — not just "anything sketchy on the internet." Tor routes traffic through three relays (guard, middle, exit) so no single point knows both who you are and what you\'re requesting.',
      '".onion" addresses are Tor\'s own naming scheme — they don\'t resolve through normal DNS at all, which is exactly why Module 13\'s dig and nslookup can\'t reach them.',
      'This module\'s use case is narrow and defensive: security teams and threat-intel analysts monitor these forums specifically for mentions of their own organization\'s stolen data, the same motivation behind Module 16\'s breach monitoring.'
    ],
    commands: [
      { cmd: 'tor status', desc: 'Check whether Tor is currently running' }
    ],
    hints: [
      'It should report not running yet — that\'s expected, you haven\'t started it.',
      '".onion" sites are unreachable without Tor running first — that\'s covered in the next lesson.'
    ],
    challenge: {
      prompt: 'Run tor status and confirm Tor is not yet running.',
      check: (state) => historyIncludes(state, (l) => l.trim() === 'tor status')
    }
  },
  {
    id: 'darkweb-connecting',
    tag: '18.2',
    title: 'Connecting to Tor Safely',
    theory: [
      '"tor start" brings up the client and establishes a three-relay circuit — only after this succeeds can any .onion address be reached, by this lab\'s tools or a real Tor Browser alike.',
      'In a real investigation, connecting over Tor is itself an operational security decision: it protects the investigator\'s own identity while browsing forums that would otherwise see a direct, identifiable connection.',
      'A professional analyst never logs into a personal account, reuses a work username, or otherwise de-anonymizes themselves while doing this — anonymity only works if it\'s maintained consistently.'
    ],
    commands: [
      { cmd: 'tor start', desc: 'Start the Tor client and build a circuit' },
      { cmd: 'tor status', desc: 'Confirm the circuit is now up' }
    ],
    hints: [
      'Watch the bootstrap percentages in the output — 100% "Done" means the circuit is ready.',
      'Run tor status again afterward — it should now report the circuit is established.'
    ],
    challenge: {
      prompt: 'Start Tor and confirm its status shows an established circuit.',
      check: (state) => state.torActive === true && historyIncludes(state, (l) => l.trim() === 'tor start')
    }
  },
  {
    id: 'darkweb-onion-search',
    tag: '18.3',
    title: 'Searching an Onion Index',
    theory: [
      'Regular search engines don\'t index .onion sites — you need a dedicated onion search engine (in the real world, services like Ahmia), which "onionsearch" simulates here.',
      'Running it before Tor is connected fails on purpose — this mirrors reality: nothing reaches an onion address without an active Tor circuit first.',
      'Searching "Nova Retail Group" surfaces the same forum thread darkmentions previewed back in Module 16 — this module goes one step further and actually opens it.'
    ],
    commands: [
      { cmd: 'onionsearch Nova Retail Group', desc: 'Search the onion index for the company name' }
    ],
    hints: [
      'If this errors saying Tor isn\'t running, go back and run "tor start" first — this lesson requires that order.',
      'The result includes a .onion address — you\'ll fetch its content in the next lesson.'
    ],
    challenge: {
      prompt: 'With Tor running, search onionsearch for Nova Retail Group and note the .onion address returned.',
      check: (state) => state.torActive === true && historyIncludes(state, (l) => l.startsWith('onionsearch') && l.toLowerCase().includes('nova retail group'))
    }
  },
  {
    id: 'darkweb-onion-fetch',
    tag: '18.4',
    title: 'Browsing an Onion Site Passively',
    theory: [
      '"onioncurl" fetches a specific .onion address\'s content, the same passive-read idea as Module 13\'s curl, just over Tor instead of the regular internet.',
      'The content confirms what onionsearch already suggested: a forum thread offering an "employee database" for sale, already met with skepticism by another forum member questioning whether the data is recycled from an older, unrelated leak.',
      'Reading a page passively like this is very different from purchasing anything, registering an account, or otherwise interacting with a criminal marketplace — the line this module stays firmly on the right side of.'
    ],
    commands: [
      { cmd: 'onioncurl novadumpx7z2fabc.onion', desc: 'Fetch the forum thread content' }
    ],
    hints: [
      'Use the exact .onion address returned by onionsearch in the last lesson.',
      'Notice the skeptical reply already present in the thread — a first hint that this listing may not be what it claims.'
    ],
    challenge: {
      prompt: 'Fetch the .onion address found by onionsearch and read the thread content.',
      check: (state) => state.torActive === true && historyIncludes(state, (l) => l.startsWith('onioncurl') && l.includes('novadumpx7z2fabc.onion'))
    }
  },
  {
    id: 'darkweb-forum-monitoring',
    tag: '18.5',
    title: 'Monitoring Criminal Forums in Depth',
    theory: [
      '"forummonitor" goes further than a one-off onioncurl fetch — it pulls a full thread with every reply, including forum moderation activity, giving a much richer picture than a single snapshot.',
      'Notice the moderator reply flagging the seller\'s history of prior unverified listings — forums like this often have their own internal reputation systems, and that context matters as much as the listing itself.',
      'This is the kind of ongoing monitoring a commercial threat-intel feed automates at scale — checking hundreds of forums continuously rather than a human manually revisiting one thread.'
    ],
    commands: [
      { cmd: 'forummonitor Nova Retail Group', desc: 'View the full forum thread including replies and moderation' }
    ],
    hints: [
      'Read every reply, not just the original post — the moderator\'s note changes how seriously this listing should be taken.',
      'A seller with "prior unverified listings" is a specific, checkable reputation signal — not just a vague feeling that something seems off.'
    ],
    challenge: {
      prompt: 'Run forummonitor against Nova Retail Group and note the seller\'s prior reputation.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('forummonitor') && l.toLowerCase().includes('nova retail group'))
    }
  },
  {
    id: 'darkweb-market-monitoring',
    tag: '18.6',
    title: 'Monitoring Stolen-Data Marketplaces',
    theory: [
      'Beyond forums, dedicated marketplaces list stolen data for direct sale with a price and a claimed row count — "marketmonitor" simulates checking one of these for mentions of an organization.',
      'Every listing here is explicitly marked verified or unverified — a distinction real threat-intel platforms track carefully, since sellers on these markets have every incentive to exaggerate what they actually have.',
      'The correct response to an unverified listing is neither to panic nor to dismiss it — it\'s to escalate it for verification through legitimate means, exactly like Module 16\'s remediation-planning approach.'
    ],
    commands: [
      { cmd: 'marketmonitor Nova Retail Group', desc: 'Check marketplace listings mentioning the company' }
    ],
    hints: [
      'The listing is explicitly marked "unverified" — treat that word as load-bearing, not decorative.',
      'Compare the row count and price here to the forum thread from two lessons ago — same listing, different vantage point.'
    ],
    challenge: {
      prompt: 'Run marketmonitor against Nova Retail Group and note whether the listing is verified.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('marketmonitor') && l.toLowerCase().includes('nova retail group'))
    }
  },
  {
    id: 'darkweb-verification-skepticism',
    tag: '18.7',
    title: 'Verifying Claims & Avoiding Panic',
    theory: [
      'Dark-web marketplaces and forums are full of exaggeration and recycled old data resold as new — sellers scamming other criminals is common, and analysts need to apply the same skepticism a journalist would to an anonymous tip.',
      'A defensible verification step doesn\'t mean paying a seller for a "sample" — it means checking whether the specific details claimed (row counts, specific fields) match what the organization actually knows about its own data, without engaging the seller directly.',
      'Write a verification note now, applying this skepticism explicitly to the Nova Retail Group listing investigated across this module.'
    ],
    commands: [
      { cmd: "echo 'Verification Note: Nova Retail Group dark-web listing' > darkweb_verification.txt", desc: 'Start the note' },
      { cmd: "echo 'Claim: 4200-row employee DB, seller data_broker_88, $500 Monero' >> darkweb_verification.txt", desc: 'Record the claim as stated' },
      { cmd: "echo 'Skepticism flags: unverified, moderator notes prior unverified listings, recycled-data accusation' >> darkweb_verification.txt", desc: 'Record the reasons for skepticism' },
      { cmd: "echo 'Recommendation: treat as UNCONFIRMED pending internal data match - do not engage seller' >> darkweb_verification.txt", desc: 'Record the recommendation' },
      { cmd: 'cat darkweb_verification.txt', desc: 'Review the finished verification note' }
    ],
    hints: [
      'The recommendation should explicitly avoid engaging the seller — verification never means paying for a sample.',
      'Reuse the CONFIRMED/UNCONFIRMED language from Module 14\'s GEOINT confidence-rating lesson — the same rigor applies here.'
    ],
    challenge: {
      prompt: 'Write darkweb_verification.txt documenting the claim, the reasons for skepticism, and a recommendation not to engage the seller.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'darkweb_verification.txt']);
        return !!node && node.type === 'file' && node.content.toUpperCase().includes('UNCONFIRMED') && node.content.toLowerCase().includes('do not engage');
      }
    }
  },
  {
    id: 'darkweb-capstone',
    tag: '18.8',
    title: 'Capstone: Dark Web Threat Monitoring Report',
    theory: [
      'This closes the module by connecting to Tor and running the complete monitoring workflow — onion search, onion fetch, forum monitoring, and marketplace monitoring — then writing a credibility-assessed report, exactly like a real threat-intel team\'s dark-web monitoring deliverable.',
      'The report explicitly separates what was found from how credible it is — the same discipline from Module 14\'s confidence ratings and Module 16\'s remediation prioritization, applied one more time to the least verifiable source type in the whole curriculum.'
    ],
    commands: [
      { cmd: 'tor start', desc: 'Connect to Tor' },
      { cmd: 'onionsearch Nova Retail Group', desc: 'Search the onion index' },
      { cmd: 'onioncurl novadumpx7z2fabc.onion', desc: 'Fetch the listing thread' },
      { cmd: 'forummonitor Nova Retail Group', desc: 'Review the full forum thread' },
      { cmd: 'marketmonitor Nova Retail Group', desc: 'Check the marketplace listing' },
      { cmd: "echo 'Dark Web Threat Monitoring Report: Nova Retail Group' > darkweb_report.txt", desc: 'Start the report' },
      { cmd: "echo 'Finding: alleged employee DB for sale (data_broker_88, 4200 rows, $500 Monero)' >> darkweb_report.txt", desc: 'Record the finding' },
      { cmd: "echo 'Credibility: UNVERIFIED - moderator flags seller history, possible recycled data' >> darkweb_report.txt", desc: 'Record the credibility assessment' },
      { cmd: "echo 'Recommendation: escalate to internal verification, do not engage seller' >> darkweb_report.txt", desc: 'Record the recommendation' },
      { cmd: 'cat darkweb_report.txt', desc: 'Review the finished report' }
    ],
    hints: [
      'Connect to Tor before anything else in this module — every onion tool depends on that first step.',
      'The report should assess credibility explicitly, not just restate the listing as fact.'
    ],
    challenge: {
      prompt: 'Connect to Tor, then run onionsearch, onioncurl, forummonitor, and marketmonitor, then write darkweb_report.txt with a credibility assessment.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'darkweb_report.txt']);
        const built = !!node && node.type === 'file' && node.content.toUpperCase().includes('UNVERIFIED');
        return built && state.torActive === true &&
          historyIncludes(state, (l) => l.trim() === 'tor start') &&
          historyIncludes(state, (l) => l.startsWith('onionsearch') && l.toLowerCase().includes('nova retail group')) &&
          historyIncludes(state, (l) => l.startsWith('onioncurl') && l.includes('novadumpx7z2fabc.onion')) &&
          historyIncludes(state, (l) => l.startsWith('forummonitor') && l.toLowerCase().includes('nova retail group')) &&
          historyIncludes(state, (l) => l.startsWith('marketmonitor') && l.toLowerCase().includes('nova retail group'));
      }
    }
  },
  {
    id: 'threatintel-intro',
    tag: '19.1',
    title: 'Threat Intelligence: From Listing to Actor',
    theory: [
      '"Threat intelligence" turns a single indicator — an IP, a domain, a hash — into context: who\'s behind it, what they\'re after, and what else they\'ve done. It\'s the discipline that answers "so what?" after Module 18\'s dark-web listing.',
      'An "IOC" (Indicator of Compromise) is any observable artifact tied to malicious activity — an IP address is the simplest kind, and it\'s where this module starts.',
      'The IP 203.0.113.77 is the starting indicator for this module — treat it as if it surfaced during the Module 18 investigation and now needs to be run down.'
    ],
    commands: [
      { cmd: 'vtcheck 203.0.113.77', desc: 'Check this IP against a threat database' }
    ],
    hints: [
      'The detection ratio (like "42/70") mirrors how real multi-engine scanners report consensus across many detection engines.',
      'Note the tags returned — one of them names an actor group you\'ll investigate further in this module.'
    ],
    challenge: {
      prompt: 'Run vtcheck against 203.0.113.77 and note the actor tag in the results.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('vtcheck') && l.includes('203.0.113.77'))
    }
  },
  {
    id: 'threatintel-attck-mapping',
    tag: '19.2',
    title: 'Mapping Behavior to MITRE ATT&CK',
    theory: [
      'MITRE ATT&CK is a shared, industry-standard vocabulary for describing attacker behavior — instead of describing an attack in vague terms, analysts reference a specific technique ID like T1566, which every other analyst in the field recognizes immediately.',
      '"attckmap" looks up what a technique ID actually means — T1566 (Phishing) is the technique most directly tied to the phishing domain this module will uncover shortly.',
      'Using shared vocabulary like this is what lets threat-intel teams at different organizations compare notes on the same actor without re-explaining basic terms every time.'
    ],
    commands: [
      { cmd: 'attckmap T1566', desc: 'Look up this technique\'s name and tactic' },
      { cmd: 'attckmap T1078', desc: 'Look up a second technique' }
    ],
    hints: [
      'Technique IDs are case-insensitive in this lab — "T1566" and "t1566" both work.',
      'Notice each technique lists a "tactic" — the higher-level goal (like Initial Access) the specific technique serves.'
    ],
    challenge: {
      prompt: 'Run attckmap for both T1566 and T1078 and note each technique\'s tactic.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('attckmap') && l.toLowerCase().includes('t1566')) &&
        historyIncludes(state, (l) => l.startsWith('attckmap') && l.toLowerCase().includes('t1078'))
    }
  },
  {
    id: 'threatintel-actor-profile',
    tag: '19.3',
    title: 'Threat Actor Profiling',
    theory: [
      '"actorprofile" pulls together everything attributed to a named threat actor: aliases, motivation, known techniques (in ATT&CK terms), and past campaigns — the tag from vtcheck names exactly this actor.',
      'ShadowLedger\'s profile shows a financially motivated group, not a state-sponsored one — that distinction changes what response is proportionate: this calls for standard incident response and law-enforcement referral, not a nation-state-level escalation.',
      'Notice T1590 (Gather Victim Network Information) among ShadowLedger\'s known techniques — a reminder that OSINT itself is a technique attackers use too, the same tools this course has taught turned toward an intrusion instead of a defense.'
    ],
    commands: [
      { cmd: 'actorprofile ShadowLedger', desc: 'Pull the full profile for the actor tagged on the IOC' }
    ],
    hints: [
      'Compare the technique list here (T1566, T1078, T1590) to what attckmap explained in the last lesson.',
      'The "campaigns" list directly references the Nova Retail Group listing from Module 18 — same actor, same investigation.'
    ],
    challenge: {
      prompt: 'Run actorprofile against ShadowLedger and identify its motivation and known techniques.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('actorprofile') && l.toLowerCase().includes('shadowledger'))
    }
  },
  {
    id: 'threatintel-passive-dns',
    tag: '19.4',
    title: 'Passive DNS & Infrastructure Pivoting',
    theory: [
      '"Pivoting" means using one piece of infrastructure to find related infrastructure — passive DNS history is the classic pivot: what domains has this IP hosted over time, even ones no longer active?',
      '"passivedns 203.0.113.77" reveals two historical hostnames on this IP — including a domain clearly designed to impersonate Nova Retail Group\'s real support portal.',
      'This single pivot connects an IOC, an actor, an ATT&CK technique, and a concrete phishing domain into one coherent picture — exactly what makes infrastructure pivoting so valuable in real threat-intel work.'
    ],
    commands: [
      { cmd: 'passivedns 203.0.113.77', desc: 'View this IP\'s historical DNS resolutions' }
    ],
    hints: [
      'The most recent hostname is the one worth the closest attention — it\'s still marked "present."',
      'Compare "nova-retail-support-portal.net" to the real corp-target.lab domain — notice how a lookalike domain is designed to be read quickly and trusted.'
    ],
    challenge: {
      prompt: 'Run passivedns against 203.0.113.77 and identify the phishing domain impersonating Nova Retail Group.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('passivedns') && l.includes('203.0.113.77'))
    }
  },
  {
    id: 'threatintel-feed-aggregation',
    tag: '19.5',
    title: 'Aggregating Threat Feeds',
    theory: [
      'Individual lookups are slow to repeat — "threatfeed" simulates a subscribed, continuously-updated aggregator that surfaces new IOCs and observations about a company automatically, without an analyst re-running every tool by hand each day.',
      'Searching "Nova Retail Group" surfaces both the phishing domain and the C2 IP as separate, dated feed entries — the same facts found manually in this module, but delivered as an automatic alert.',
      'This is the operational payoff of everything so far in this module: once an organization is being tracked by name, new related infrastructure gets flagged automatically as it\'s discovered elsewhere.'
    ],
    commands: [
      { cmd: 'threatfeed Nova Retail Group', desc: 'Search the aggregated threat feed' }
    ],
    hints: [
      'Entries are dated — note which one came first.',
      'Both entries reference facts you already found manually in this module — that\'s the point: aggregation, not new discovery.'
    ],
    challenge: {
      prompt: 'Run threatfeed against Nova Retail Group and confirm both the domain and IP findings appear.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('threatfeed') && l.toLowerCase().includes('nova retail group'))
    }
  },
  {
    id: 'threatintel-defensive-action',
    tag: '19.6',
    title: 'From IOCs to Defensive Action',
    theory: [
      'A threat-intel finding that never reaches a firewall rule or a blocklist accomplished nothing operationally — the entire point of identifying an IOC is to act on it: block the IP, block the domain, and alert anyone who may have already interacted with either.',
      'This connects directly back to Modules 3 and 7\'s iptables work — threat intelligence supplies the "what to block," defensive infrastructure supplies the "how."',
      'Apply that now: block the malicious IP with iptables and document why.'
    ],
    commands: [
      { cmd: 'iptables -A INPUT -s 203.0.113.77 -j DROP', desc: 'Block the malicious IP at the firewall' },
      { cmd: "echo 'Blocked 203.0.113.77 (ShadowLedger C2) and flagged nova-retail-support-portal.net as phishing' > threatintel_actions.txt", desc: 'Document the action taken' },
      { cmd: 'cat threatintel_actions.txt', desc: 'Review the documented action' }
    ],
    hints: [
      'This reuses "iptables -A" from Modules 3/7 — threat intelligence and defensive infrastructure are meant to connect like this.',
      'Documenting why a block was added (which actor, which finding) matters as much as adding the rule — a bare IP with no context is hard to audit later.'
    ],
    challenge: {
      prompt: 'Add an iptables DROP rule for 203.0.113.77 and document the action in threatintel_actions.txt.',
      check: (state) => {
        const blocked = state.firewallRules.some((r) => r.chain === 'INPUT' && r.rule.includes('203.0.113.77') && r.rule.includes('DROP'));
        const node = getNode(state.root, ['home', 'student', 'threatintel_actions.txt']);
        return blocked && !!node && node.type === 'file' && node.content.includes('203.0.113.77');
      }
    }
  },
  {
    id: 'threatintel-alerting-employees',
    tag: '19.7',
    title: 'Alerting Potentially Targeted Employees',
    theory: [
      'Blocking infrastructure protects the network, but a phishing domain impersonating a company\'s support portal is specifically designed to trick people, not systems — the org-chart and employee list from Module 15 tells you exactly who needs a heads-up.',
      'A good alert is specific and actionable: name the exact fake domain, describe what it impersonates, and tell people what to do if they already clicked it — vague "be careful online" alerts get ignored.',
      'Write that alert now, naming the phishing domain and referencing an employee contact identified earlier in this course.'
    ],
    commands: [
      { cmd: "echo 'Security Alert: Phishing domain impersonating Nova Retail Group support portal' > phishing_alert.txt", desc: 'Start the alert' },
      { cmd: "echo 'Domain: nova-retail-support-portal.net - DO NOT enter credentials on this site' >> phishing_alert.txt", desc: 'Name the fake domain' },
      { cmd: "echo 'If you clicked this link or entered credentials, reset your password immediately and notify IT (Jordan Martinez)' >> phishing_alert.txt", desc: 'Give a clear action for anyone affected' },
      { cmd: 'cat phishing_alert.txt', desc: 'Review the finished alert' }
    ],
    hints: [
      'Name the fake domain explicitly — employees need to recognize it by name, not by a vague description.',
      'Referencing Jordan Martinez (the IT Director from Module 15\'s org chart) as the contact point makes the alert immediately actionable.'
    ],
    challenge: {
      prompt: 'Write phishing_alert.txt naming the phishing domain and giving a clear action for anyone who may have been targeted.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'phishing_alert.txt']);
        return !!node && node.type === 'file' && node.content.includes('nova-retail-support-portal.net') && node.content.includes('Jordan Martinez');
      }
    }
  },
  {
    id: 'threatintel-capstone',
    tag: '19.8',
    title: 'Capstone: Full Threat Intelligence Assessment',
    theory: [
      'This closes the module by running the complete threat-intel workflow — IOC check, ATT&CK mapping, actor profiling, passive DNS pivoting, and feed aggregation — then acting on it and reporting, exactly like a real SOC/threat-intel deliverable.',
      'This report is the technical mirror of Module 16\'s breach-remediation plan and Module 18\'s dark-web report — the same three-part shape (finding, attribution/severity, action taken) shows up across every intelligence discipline in this curriculum.'
    ],
    commands: [
      { cmd: 'vtcheck 203.0.113.77', desc: 'Check the IOC' },
      { cmd: 'attckmap T1566', desc: 'Map the associated technique' },
      { cmd: 'actorprofile ShadowLedger', desc: 'Profile the attributed actor' },
      { cmd: 'passivedns 203.0.113.77', desc: 'Pivot to related infrastructure' },
      { cmd: 'threatfeed Nova Retail Group', desc: 'Confirm via the aggregated feed' },
      { cmd: 'iptables -A INPUT -s 203.0.113.77 -j DROP', desc: 'Block the malicious IP' },
      { cmd: "echo 'Threat Intelligence Assessment: Nova Retail Group' > threatintel_report.txt", desc: 'Start the report' },
      { cmd: "echo 'Actor: ShadowLedger (financially motivated), techniques T1566/T1078/T1590' >> threatintel_report.txt", desc: 'Record attribution' },
      { cmd: "echo 'Infrastructure: 203.0.113.77 (C2), nova-retail-support-portal.net (phishing)' >> threatintel_report.txt", desc: 'Record infrastructure' },
      { cmd: "echo 'Action taken: blocked IP at firewall, alerted employees to phishing domain' >> threatintel_report.txt", desc: 'Record actions taken' },
      { cmd: 'cat threatintel_report.txt', desc: 'Review the finished report' }
    ],
    hints: [
      'Work through all five lookup tools before blocking anything or writing the report.',
      'The report should cover attribution, infrastructure, and action taken — all three, not just the indicators themselves.'
    ],
    challenge: {
      prompt: 'Run vtcheck, attckmap, actorprofile, passivedns, and threatfeed, block the IP, then write threatintel_report.txt.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'threatintel_report.txt']);
        const built = !!node && node.type === 'file' && node.content.toLowerCase().includes('shadowledger') && node.content.includes('203.0.113.77');
        const blocked = state.firewallRules.some((r) => r.chain === 'INPUT' && r.rule.includes('203.0.113.77'));
        return built && blocked &&
          historyIncludes(state, (l) => l.startsWith('vtcheck') && l.includes('203.0.113.77')) &&
          historyIncludes(state, (l) => l.startsWith('attckmap') && l.toLowerCase().includes('t1566')) &&
          historyIncludes(state, (l) => l.startsWith('actorprofile') && l.toLowerCase().includes('shadowledger')) &&
          historyIncludes(state, (l) => l.startsWith('passivedns') && l.includes('203.0.113.77')) &&
          historyIncludes(state, (l) => l.startsWith('threatfeed') && l.toLowerCase().includes('nova retail group'));
      }
    }
  },
  {
    id: 'peoplesearch-intro',
    tag: '20.1',
    title: 'People Search & Public Records: Investigating an Individual',
    theory: [
      'People-search aggregators compile scattered public records — property records, voter registration, phone carrier registrations — into a single searchable profile. None of it is private data; it\'s public records a broker has simply organized and made easy to query.',
      'This module investigates Jordan Martinez, Nova Retail Group\'s IT Director, continuing this course\'s ongoing, authorized assessment of the company — the same person named throughout Modules 13-19.',
      'Real people-search results are frequently wrong or outdated — treat every field here the same way Module 14 taught confidence-rating: as a lead to verify, not a confirmed fact.'
    ],
    commands: [
      { cmd: 'pubrecords Jordan Martinez', desc: 'Look up public records for this name' }
    ],
    hints: [
      'Note the age range and city returned — the city should look familiar from Module 14\'s GEOINT work.',
      'This kind of broad public-records lookup is usually the first step, narrowed down by later, more specific lookups.'
    ],
    challenge: {
      prompt: 'Run pubrecords against Jordan Martinez and note the city returned.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('pubrecords') && l.toLowerCase().includes('jordan martinez'))
    }
  },
  {
    id: 'peoplesearch-phone-intel',
    tag: '20.2',
    title: 'Phone Number Intelligence',
    theory: [
      '"phonelookup" identifies a phone number\'s carrier, line type (mobile vs. landline vs. VoIP), and registered region — useful for judging whether a number is worth trusting as a real, personal line before using it for anything else.',
      'The 916 area code on Jordan Martinez\'s number matches Sacramento — one more independent confirmation of the same city GEOINT (Module 14) and pubrecords (previous lesson) already pointed to.',
      'A mobile line registered to a real wireless carrier is a much stronger signal than a VoIP line, which can be provisioned anonymously in seconds — line type alone is a useful credibility check.'
    ],
    commands: [
      { cmd: 'phonelookup +1-916-555-0148', desc: 'Identify this number\'s carrier and region' }
    ],
    hints: [
      'Compare the area code to the city from the last lesson\'s pubrecords result.',
      '"Mobile" on a named carrier is a stronger signal than a VoIP line would be — note which one this is.'
    ],
    challenge: {
      prompt: 'Run phonelookup against +1-916-555-0148 and confirm its registered region matches Sacramento.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('phonelookup') && l.includes('916-555-0148'))
    }
  },
  {
    id: 'peoplesearch-reverse-lookup',
    tag: '20.3',
    title: 'Reverse Lookup: Number or Email to Name',
    theory: [
      '"reverselookup" works backward from a phone number or email address to a name — useful when you have a contact detail from another source and need to identify who it actually belongs to.',
      'Running it on both the phone number and the email address from earlier modules should return the same name — cross-confirmation, the same discipline this course has emphasized since Module 14.',
      'This is also useful in the other direction: if a reverse lookup on a number claimed to belong to someone returns a completely different name, that mismatch is a strong signal something doesn\'t add up.'
    ],
    commands: [
      { cmd: 'reverselookup +1-916-555-0148', desc: 'Reverse-lookup the phone number' },
      { cmd: 'reverselookup jmartinez@corp-target.lab', desc: 'Reverse-lookup the email address too' }
    ],
    hints: [
      'Both lookups should return the same name — that agreement is the point of running both.',
      'If these ever disagreed, that mismatch itself would be the actual finding worth investigating.'
    ],
    challenge: {
      prompt: 'Run reverselookup on both the phone number and the email, and confirm they return the same name.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('reverselookup') && l.includes('916-555-0148')) &&
        historyIncludes(state, (l) => l.startsWith('reverselookup') && l.includes('jmartinez@corp-target.lab'))
    }
  },
  {
    id: 'peoplesearch-address-history',
    tag: '20.4',
    title: 'Address History',
    theory: [
      '"addresshistory" lists an individual\'s known past addresses — sourced from things like property records, voter rolls, and utility connections, all public in most US jurisdictions.',
      'A move from Davis, CA to Sacramento, CA lines up with Nova Retail Group\'s own Sacramento expansion timeline from Module 15\'s biznews findings — a personal record corroborating a corporate one.',
      'Address history matters most in physical-security assessments and identity verification — far less in a typical technical security review, which is worth noting as a scope judgment call.'
    ],
    commands: [
      { cmd: 'addresshistory Jordan Martinez', desc: 'Look up this person\'s address history' }
    ],
    hints: [
      'Compare the move date to Module 15\'s biznews timeline for the Sacramento facility.',
      'Ask yourself whether this specific data point is actually in-scope for whatever assessment you\'re running — not every available lookup is a relevant one.'
    ],
    challenge: {
      prompt: 'Run addresshistory against Jordan Martinez and note the timing of the move to Sacramento.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('addresshistory') && l.toLowerCase().includes('jordan martinez'))
    }
  },
  {
    id: 'peoplesearch-databroker-profile',
    tag: '20.5',
    title: 'Data Broker Profiles & the Opt-Out Problem',
    theory: [
      '"databroker" simulates a consumer-facing people-search site that aggregates everything from the last four lessons into one easily accessible profile — exactly the kind of exposure that makes this data trivially available to anyone, not just trained investigators.',
      'This is why "opt-out" processes exist: most US data brokers are legally required to let an individual request their profile be removed, though in practice a person has to repeat this across dozens of separate broker sites, since none of them share opt-out requests with each other.',
      'From a corporate-security standpoint, an employee\'s public data-broker exposure is real organizational risk — the raw material for a physical or social-engineering attack — even though the company itself did nothing wrong to create it.'
    ],
    commands: [
      { cmd: 'databroker Jordan Martinez', desc: 'Pull the aggregated data-broker profile' }
    ],
    hints: [
      'Notice this single command returns everything the last four lessons found individually, all in one place — that\'s exactly the aggregation risk being taught here.',
      'The opt-out note at the end of the output is not decorative — it\'s the actual recommended remediation for this kind of exposure.'
    ],
    challenge: {
      prompt: 'Run databroker against Jordan Martinez and review the aggregated profile and opt-out note.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('databroker') && l.toLowerCase().includes('jordan martinez'))
    }
  },
  {
    id: 'peoplesearch-accuracy-limits',
    tag: '20.6',
    title: 'Consent, Accuracy & the Limits of People-Search Data',
    theory: [
      'People-search data is frequently stale or simply wrong — brokers scrape and resell old records without verifying them, so an outdated address or phone number showing up is completely normal, not a rare edge case.',
      'Using this data on real people carries real legal and ethical weight depending on jurisdiction and purpose — the same authorized, in-scope, documented standard from Module 15\'s ethics lesson applies here even more strictly, since this module touches an individual rather than a corporate entity.',
      'A professional deliverable always flags confidence, exactly like Module 14\'s GEOINT ratings: a fact confirmed by two independent sources is CONFIRMED; a single-source data-broker field is, at best, LIKELY.'
    ],
    commands: [
      { cmd: "echo 'Confidence Review: Jordan Martinez profile' > peoplesearch_confidence.txt", desc: 'Start the confidence review' },
      { cmd: "echo 'City Sacramento: CONFIRMED - corroborated by pubrecords, phonelookup, and Module 14 GEOINT' >> peoplesearch_confidence.txt", desc: 'Rate the strongest finding' },
      { cmd: "echo 'Exact street address: LIKELY - single-source data broker record, unverified elsewhere' >> peoplesearch_confidence.txt", desc: 'Rate the weaker finding' },
      { cmd: 'cat peoplesearch_confidence.txt', desc: 'Review the confidence-rated notes' }
    ],
    hints: [
      'Reuse CONFIRMED/LIKELY/UNCONFIRMED from Module 14 — the same rating scale applies to people-search data.',
      'A fact repeated across multiple independent tools earns a higher confidence rating than one appearing in a single broker record.'
    ],
    challenge: {
      prompt: 'Write peoplesearch_confidence.txt rating at least one finding CONFIRMED and one LIKELY.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'peoplesearch_confidence.txt']);
        return !!node && node.type === 'file' && node.content.toUpperCase().includes('CONFIRMED') && node.content.toUpperCase().includes('LIKELY');
      }
    }
  },
  {
    id: 'peoplesearch-scope-and-authorization',
    tag: '20.7',
    title: 'Scope, Authorization & Responsible Use',
    theory: [
      'Everything in this module is legally accessible public-record data, but "legally accessible" and "appropriate to use" are not the same question — a real engagement operates under a written scope defining exactly which individuals, and which categories of data about them, are actually authorized to investigate.',
      'Employee-focused OSINT (this module, and the org-chart work in Module 15) is standard practice specifically for security assessments — always under an organization\'s own authorization to investigate its own staff, never as a hobby against private individuals.',
      'Write a short scope note now, the same habit as Module 15\'s ethics lesson, confirming this module\'s work stayed inside an authorized, employee-focused security assessment.'
    ],
    commands: [
      { cmd: "echo 'Scope Note: lookups performed under an authorized Nova Retail Group security assessment, limited to its named IT Director in a professional capacity' >> peoplesearch_confidence.txt", desc: 'Append a scope/authorization note' },
      { cmd: 'cat peoplesearch_confidence.txt', desc: 'Review the complete, scoped file' }
    ],
    hints: [
      'This reuses the same file from the previous lesson — a real profile document accumulates its confidence ratings and its scope justification together, not as separate deliverables.'
    ],
    challenge: {
      prompt: 'Append a scope/authorization note to peoplesearch_confidence.txt and review the complete file.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'peoplesearch_confidence.txt']);
        return !!node && node.type === 'file' && node.content.toLowerCase().includes('authoriz') &&
          historyIncludes(state, (l) => l.startsWith('cat') && l.includes('peoplesearch_confidence.txt'));
      }
    }
  },
  {
    id: 'peoplesearch-capstone',
    tag: '20.8',
    title: 'Capstone: Full People-Search Profile (Authorized Assessment)',
    theory: [
      'This closes the module by running the complete people-search workflow against Jordan Martinez under the same authorized-assessment framing established throughout, producing one confidence-rated, properly-scoped profile.',
      'Notice how many of this module\'s findings are corroboration rather than new discovery — Sacramento shows up here for at least the fourth independent time across this course (GEOINT, corporate news, phone area code, and address history).'
    ],
    commands: [
      { cmd: 'pubrecords Jordan Martinez', desc: 'Pull baseline public records' },
      { cmd: 'phonelookup +1-916-555-0148', desc: 'Identify the phone number' },
      { cmd: 'reverselookup +1-916-555-0148', desc: 'Confirm the name behind the number' },
      { cmd: 'addresshistory Jordan Martinez', desc: 'Check address history' },
      { cmd: 'databroker Jordan Martinez', desc: 'Pull the aggregated data-broker profile' },
      { cmd: "echo 'People-Search Profile: Jordan Martinez (authorized assessment)' > peoplesearch_report.txt", desc: 'Start the report' },
      { cmd: "echo 'City: Sacramento, CA - CONFIRMED across four independent sources' >> peoplesearch_report.txt", desc: 'Record the confirmed finding' },
      { cmd: "echo 'Exposure: full profile aggregated by public data brokers - opt-out recommended' >> peoplesearch_report.txt", desc: 'Record the exposure finding' },
      { cmd: 'cat peoplesearch_report.txt', desc: 'Review the finished report' }
    ],
    hints: [
      'Work through all five lookup tools before writing the report.',
      'The report should note both what was found and how confirmed each finding is — the habit from every module since Module 14.'
    ],
    challenge: {
      prompt: 'Run pubrecords, phonelookup, reverselookup, addresshistory, and databroker, then write peoplesearch_report.txt.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'peoplesearch_report.txt']);
        const built = !!node && node.type === 'file' && node.content.toLowerCase().includes('sacramento') && node.content.toLowerCase().includes('opt-out');
        return built &&
          historyIncludes(state, (l) => l.startsWith('pubrecords') && l.toLowerCase().includes('jordan martinez')) &&
          historyIncludes(state, (l) => l.startsWith('phonelookup') && l.includes('916-555-0148')) &&
          historyIncludes(state, (l) => l.startsWith('reverselookup') && l.includes('916-555-0148')) &&
          historyIncludes(state, (l) => l.startsWith('addresshistory') && l.toLowerCase().includes('jordan martinez')) &&
          historyIncludes(state, (l) => l.startsWith('databroker') && l.toLowerCase().includes('jordan martinez'));
      }
    }
  },
  {
    id: 'counterosint-intro',
    tag: '21.1',
    title: 'Counter-OSINT: Turning the Tools on Yourself',
    theory: [
      'Every technique from Modules 13-20 works exactly the same way turned around: an investigator, a red-teamer, or an attacker can run the same lookups against you that you\'ve been running against Nova Retail Group all course.',
      '"Counter-OSINT" (often called OPSEC, operational security) is the practice of auditing and reducing your own footprint before someone else finds it for you.',
      'This module runs a simulated self-audit against a fictional "you" (student@linuxlab.dev) using the same methodology as every module before it.'
    ],
    commands: [
      { cmd: 'selfaudit', desc: 'Run a self-audit across your own simulated footprint' }
    ],
    hints: [
      'This one command surfaces findings that would otherwise take four or five separate tools (hibp, sherlock, exiftool, privacycheck) to discover manually.',
      'Read every line — you\'ll fix each finding one at a time over the next few lessons.'
    ],
    challenge: {
      prompt: 'Run selfaudit and read through every finding it reports.',
      check: (state) => historyIncludes(state, (l) => l.trim() === 'selfaudit')
    }
  },
  {
    id: 'counterosint-breach-check',
    tag: '21.2',
    title: 'Checking Your Own Breach Exposure',
    theory: [
      'The first selfaudit finding was a breach hit — exactly the Module 16 workflow, just pointed at yourself instead of an investigation target.',
      'Confirm it directly with the same tool from Module 16 — self-auditing isn\'t a separate skill, it\'s the same skill applied to a different name.',
      'A low-severity breach (name and email only, no password) still deserves a note, even if it doesn\'t require the urgent password reset Module 16\'s password-reuse finding did.'
    ],
    commands: [
      { cmd: 'hibp student@linuxlab.dev', desc: 'Confirm the breach finding directly' }
    ],
    hints: [
      'This is the exact same hibp command from Module 16 — nothing new to learn here, just a new target.'
    ],
    challenge: {
      prompt: 'Run hibp against student@linuxlab.dev and confirm the breach selfaudit reported.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('hibp') && l.includes('student@linuxlab.dev'))
    }
  },
  {
    id: 'counterosint-metadata-scrub',
    tag: '21.3',
    title: 'Scrubbing Metadata Before It Is Ever Posted',
    theory: [
      'selfaudit flagged a conference-badge photo carrying visible GPS metadata — precisely the Module 13/14 exiftool finding, just discovered in your own photo instead of an investigation target\'s.',
      '"metadatascrub" strips that metadata permanently — the actual fix for every exiftool finding this course has surfaced, applied here for the first time instead of just observed.',
      'The right time to scrub metadata is before uploading a photo anywhere, not after — but confirming the fix worked is still worth doing every time.'
    ],
    commands: [
      { cmd: 'exiftool ~/osint/conference_badge.jpg', desc: 'Confirm the exposed metadata first' },
      { cmd: 'metadatascrub ~/osint/conference_badge.jpg', desc: 'Strip the metadata' },
      { cmd: 'exiftool ~/osint/conference_badge.jpg', desc: 'Confirm it is gone' }
    ],
    hints: [
      'Run exiftool before and after metadatascrub — comparing the two outputs is how you confirm the fix actually worked.'
    ],
    challenge: {
      prompt: 'Confirm the metadata exists, scrub it, then confirm it is gone.',
      check: (state) =>
        state.scrubbedMetadata.includes('/home/student/osint/conference_badge.jpg') &&
        historyIncludes(state, (l) => l.startsWith('metadatascrub') && l.includes('conference_badge.jpg'))
    }
  },
  {
    id: 'counterosint-privacy-settings',
    tag: '21.4',
    title: 'Locking Down Social Privacy Settings',
    theory: [
      'selfaudit also flagged a public Instagram profile with location tagging enabled — the same style of exposure Module 14 and Module 17 relied on to geolocate and pattern-match a target, just about your own account this time.',
      '"privacycheck" reviews current settings; "privacyset" changes them — switching an account to private and disabling location tagging removes exactly the kind of data those earlier modules depended on.',
      'This is the single highest-leverage OPSEC change most people can make: it costs nothing and immediately removes an entire category of exposure.'
    ],
    commands: [
      { cmd: 'privacycheck instagram', desc: 'Review current privacy settings' },
      { cmd: 'privacyset instagram visibility private', desc: 'Switch the account to private' },
      { cmd: 'privacyset instagram locationTagging off', desc: 'Disable location tagging' },
      { cmd: 'privacycheck instagram', desc: 'Confirm both changes took effect' }
    ],
    hints: [
      'Run privacycheck before and after the two privacyset commands to see the actual change.',
      'Both settings matter independently — a private account that still tags location leaks less, but not nothing.'
    ],
    challenge: {
      prompt: 'Set the instagram account to private with location tagging off, and confirm with privacycheck.',
      check: (state) =>
        state.socialPrivacy.instagram?.visibility === 'private' &&
        state.socialPrivacy.instagram?.locationTagging === false &&
        historyIncludes(state, (l) => l.startsWith('privacycheck') && l.includes('instagram'))
    }
  },
  {
    id: 'counterosint-username-reuse',
    tag: '21.5',
    title: 'Reused Usernames & Sock-Puppet Hygiene',
    theory: [
      'selfaudit also flagged that your username reappears across multiple platforms — confirm it the Module 13 way, with sherlock, applied to yourself instead of an investigation target.',
      'A reused username lets anyone who finds one of your accounts trivially find the others — the fix is deliberately using different, unlinkable usernames for different contexts, especially for investigative work.',
      'A proper investigative "sock puppet" account is built with this in mind from the start: its own email, its own never-reused username, no personal photos, and ideally its own isolated browser/VPN — "sockpuppet create" walks through that checklist.'
    ],
    commands: [
      { cmd: 'sherlock student_learns', desc: 'Confirm the username-reuse finding' },
      { cmd: 'sockpuppet create osint_researcher_47', desc: 'Create a properly isolated investigative persona' }
    ],
    hints: [
      'Compare how many platforms student_learns turns up on versus how clean a brand-new sock-puppet alias would be.',
      'The sockpuppet checklist is worth rereading any time you start a new investigation, not just memorizing once.'
    ],
    challenge: {
      prompt: 'Run sherlock on student_learns, then create a sock-puppet persona with sockpuppet create.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('sherlock') && l.includes('student_learns')) &&
        state.sockPuppets.length > 0
    }
  },
  {
    id: 'counterosint-recheck',
    tag: '21.6',
    title: 'Rechecking Your Footprint After Remediation',
    theory: [
      'A fix that\'s never verified is just a hope — rerun selfaudit after the last three lessons\' changes and confirm the metadata and privacy findings no longer appear the same way.',
      'The breach-history finding from lesson 21.2 will still show up — past breaches cannot be un-leaked, only monitored and responded to; that\'s an important, realistic limit on what "fixing your OPSEC" can actually undo.'
    ],
    commands: [
      { cmd: 'selfaudit', desc: 'Rerun the self-audit after remediation' }
    ],
    hints: [
      'Compare this output line-by-line against the very first lesson\'s selfaudit output.',
      'The old breach entry is expected to still appear — remediation controls future exposure, not history.'
    ],
    challenge: {
      prompt: 'Rerun selfaudit and confirm the metadata and privacy findings have changed since the first lesson.',
      check: (state) => state.history.filter((l) => l.trim() === 'selfaudit').length >= 2
    }
  },
  {
    id: 'counterosint-checklist',
    tag: '21.7',
    title: 'Building a Personal OPSEC Checklist',
    theory: [
      'A one-time cleanup drifts back to its old state without a repeatable checklist — the same habit-forming idea behind every capstone report this course has built.',
      'Write a short, personal, reusable checklist based specifically on what this module found and fixed — not generic "be safe online" advice.'
    ],
    commands: [
      { cmd: "echo 'Personal OPSEC Checklist' > opsec_checklist.txt", desc: 'Start the checklist' },
      { cmd: "echo '1. Scrub metadata from any photo before posting it' >> opsec_checklist.txt", desc: 'Add the metadata rule' },
      { cmd: "echo '2. Set social accounts to private and disable location tagging' >> opsec_checklist.txt", desc: 'Add the privacy rule' },
      { cmd: "echo '3. Never reuse a username across personal and investigative accounts' >> opsec_checklist.txt", desc: 'Add the username rule' },
      { cmd: 'cat opsec_checklist.txt', desc: 'Review the finished checklist' }
    ],
    hints: [
      'Each rule should map to one specific finding from earlier in this module, not be generic advice.'
    ],
    challenge: {
      prompt: 'Write opsec_checklist.txt with at least three specific rules drawn from this module.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'opsec_checklist.txt']);
        return !!node && node.type === 'file' &&
          node.content.toLowerCase().includes('metadata') &&
          node.content.toLowerCase().includes('private') &&
          node.content.toLowerCase().includes('username');
      }
    }
  },
  {
    id: 'counterosint-capstone',
    tag: '21.8',
    title: 'Capstone: Full Counter-OSINT Hardening Pass',
    theory: [
      'This closes the module by running a baseline selfaudit, applying every fix from this module, re-running selfaudit to verify, and reporting the results — including the one finding that can\'t be undone.',
      'This is the defensive mirror of this entire course: everything used to investigate Nova Retail Group across Modules 13-20 applies just as well pointed inward, and a security-minded professional runs both directions.'
    ],
    commands: [
      { cmd: 'selfaudit', desc: 'Baseline self-audit' },
      { cmd: 'metadatascrub ~/osint/conference_badge.jpg', desc: 'Scrub photo metadata' },
      { cmd: 'privacyset instagram visibility private', desc: 'Lock down account visibility' },
      { cmd: 'privacyset instagram locationTagging off', desc: 'Disable location tagging' },
      { cmd: 'sockpuppet create osint_researcher_47', desc: 'Set up a proper investigative persona' },
      { cmd: 'selfaudit', desc: 'Re-audit after hardening' },
      { cmd: "echo 'Counter-OSINT Hardening Report' > hardening_report.txt", desc: 'Start the report' },
      { cmd: "echo 'Fixed: photo metadata scrubbed, Instagram set private with location tagging off' >> hardening_report.txt", desc: 'Record fixes' },
      { cmd: "echo 'Unfixable: 2020 breach history remains on record - historical, monitored only' >> hardening_report.txt", desc: 'Record the unfixable finding' },
      { cmd: 'cat hardening_report.txt', desc: 'Review the finished report' }
    ],
    hints: [
      'Run selfaudit both before and after the fixes — that comparison is the actual deliverable of this capstone.',
      'Not every finding can be fixed — the report should say so explicitly rather than implying a perfect clean slate.'
    ],
    challenge: {
      prompt: 'Run selfaudit, apply all three fixes (metadata scrub, privacy settings, sock puppet), re-run selfaudit, then write hardening_report.txt.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'hardening_report.txt']);
        const built = !!node && node.type === 'file' && node.content.toLowerCase().includes('scrubbed') && node.content.toLowerCase().includes('breach');
        const scrubbed = state.scrubbedMetadata.includes('/home/student/osint/conference_badge.jpg');
        const privacyFixed = state.socialPrivacy.instagram?.visibility === 'private' && state.socialPrivacy.instagram?.locationTagging === false;
        const sockpuppetCreated = state.sockPuppets.length > 0;
        const auditedTwice = state.history.filter((l) => l.trim() === 'selfaudit').length >= 2;
        return built && scrubbed && privacyFixed && sockpuppetCreated && auditedTwice;
      }
    }
  },
  {
    id: 'automation-intro',
    tag: '22.1',
    title: 'OSINT Automation & Frameworks: Why Repeat Yourself?',
    theory: [
      'Every module so far has run tools one at a time, by hand — real OSINT work at any scale uses frameworks that chain modules together and automation that removes the repetitive parts, freeing an analyst to focus on judgment instead of typing the same commands over and over.',
      '"recon-ng" (the real-world tool this module\'s "reconng" simulates) organizes work into workspaces (one per investigation) and modules (one per data source) — the same organizing idea as this course\'s per-module structure, just built into a single tool.',
      'This module automates the exact Nova Retail Group investigation already run by hand across Modules 13-21.'
    ],
    commands: [
      { cmd: 'reconng workspace novaretail', desc: 'Create a workspace for this investigation' }
    ],
    hints: [
      'A workspace keeps one investigation\'s findings separate from another\'s — the same reason this course used one consistent target throughout.'
    ],
    challenge: {
      prompt: 'Create a reconng workspace named novaretail.',
      check: (state) => state.reconWorkspace === 'novaretail'
    }
  },
  {
    id: 'automation-recon-framework',
    tag: '22.2',
    title: 'Loading & Running Recon Modules',
    theory: [
      '"reconng use <module>" loads a specific data-source module — "recon/domains-hosts/subfinder" runs the same subdomain enumeration from Module 13, just through the framework\'s standard module interface instead of a bespoke command.',
      'Every module in a real framework like this follows the same load-then-run pattern, which is exactly what makes chaining dozens of them together in a script practical — one consistent interface instead of memorizing each tool\'s own flags.',
      'Run it now and compare the output to Module 13\'s original subfinder result — same data, different delivery mechanism.'
    ],
    commands: [
      { cmd: 'reconng use recon/domains-hosts/subfinder', desc: 'Load the subdomain enumeration module' },
      { cmd: 'reconng run', desc: 'Run the loaded module' }
    ],
    hints: [
      'You must load a workspace (last lesson) before a module will load — the framework enforces that order.',
      'Compare this output to Module 13\'s subfinder result — same subdomains, framework wrapper.'
    ],
    challenge: {
      prompt: 'Load the subfinder module and run it inside the novaretail workspace.',
      check: (state) => state.reconModule === 'recon/domains-hosts/subfinder' && historyIncludes(state, (l) => l.trim() === 'reconng run')
    }
  },
  {
    id: 'automation-second-module',
    tag: '22.3',
    title: 'Chaining a Second Module',
    theory: [
      'Switching modules mid-workspace is normal — "reconng use" simply swaps which module is loaded without losing the workspace itself, letting one investigation accumulate results from many different data sources over time.',
      'Load the contact-harvesting module next — the same theHarvester data from Module 13, again through the framework interface.',
      'A real recon-ng workspace stores every module\'s results in one queryable database rather than scattered terminal output — this lab keeps things simple by printing each run directly, but the organizing principle is the same.'
    ],
    commands: [
      { cmd: 'reconng use recon/domains-contacts/theharvester', desc: 'Switch to the contact-harvesting module' },
      { cmd: 'reconng run', desc: 'Run it' }
    ],
    hints: [
      'You do not need to recreate the workspace — it is still loaded from the first lesson.'
    ],
    challenge: {
      prompt: 'Load the theharvester module and run it in the same workspace.',
      check: (state) => state.reconModule === 'recon/domains-contacts/theharvester' && historyIncludes(state, (l) => l.startsWith('reconng') && l.includes('theharvester'))
    }
  },
  {
    id: 'automation-link-graphing',
    tag: '22.4',
    title: 'Entity & Relationship Graphing',
    theory: [
      '"linkgraph" simulates the core idea behind tools like Maltego: instead of a list of disconnected findings, build an explicit graph of entities — a domain, a person, an IP, an actor — and the relationships between them.',
      'This is where a scattered investigation becomes a coherent story — corp-target.lab isn\'t just a domain, it is owned by Nova Retail Group, which employs Jordan Martinez, whose email was found in a breach alongside infrastructure tied to ShadowLedger.',
      'Add the first few relationships from this course\'s investigation now — you\'ll keep building this graph in the next lesson.'
    ],
    commands: [
      { cmd: 'linkgraph add corp-target.lab owned-by "Nova Retail Group"', desc: 'Link the domain to its parent company' },
      { cmd: 'linkgraph add "Nova Retail Group" employs "Jordan Martinez"', desc: 'Link the company to an employee' },
      { cmd: 'linkgraph show', desc: 'View the graph so far' }
    ],
    hints: [
      'Each linkgraph add takes exactly three things: an entity, a relationship word, and a second entity.',
      'Quote any entity name containing spaces, exactly like you would with any other command argument.'
    ],
    challenge: {
      prompt: 'Add both relationships and view the graph with linkgraph show.',
      check: (state) => state.linkGraph.length >= 2 && historyIncludes(state, (l) => l.trim() === 'linkgraph show')
    }
  },
  {
    id: 'automation-building-the-graph',
    tag: '22.5',
    title: 'Building the Full Investigation Graph',
    theory: [
      'A graph is only useful once it actually connects the dots across modules — add the remaining links tying together the phishing infrastructure (Module 19), the breach exposure (Module 16), and the actor behind it, all in one place.',
      'Once built, a graph like this answers questions a flat list of findings cannot: "what connects to Jordan Martinez?" pulls back the email, the breach, and the phishing domain in one view, instead of requiring you to remember which module found which fact.'
    ],
    commands: [
      { cmd: 'linkgraph add "Jordan Martinez" email jmartinez@corp-target.lab', desc: 'Link the employee to their email' },
      { cmd: 'linkgraph add jmartinez@corp-target.lab exposed-in-breach LinkedIn2021', desc: 'Link the email to its breach' },
      { cmd: 'linkgraph add nova-retail-support-portal.net impersonates corp-target.lab', desc: 'Link the phishing domain to the real one' },
      { cmd: 'linkgraph add nova-retail-support-portal.net attributed-to ShadowLedger', desc: 'Link the phishing domain to the actor behind it' },
      { cmd: 'linkgraph show', desc: 'View the complete graph' }
    ],
    hints: [
      'Each of these links reuses a fact from an earlier module — this lesson is assembly, not new discovery.',
      'Read the finished graph top to bottom as a story: domain to company to employee to breach, and separately, phishing domain to real domain to actor.'
    ],
    challenge: {
      prompt: 'Add all four relationships and view the complete graph.',
      check: (state) => state.linkGraph.length >= 6 && historyIncludes(state, (l) => l.trim() === 'linkgraph show')
    }
  },
  {
    id: 'automation-scripting-workflow',
    tag: '22.6',
    title: 'Scripting a Recon Workflow',
    theory: [
      'Everything run by hand in this module can be written as a single bash script — the same scripting skills from Module 4, applied to chain OSINT tools instead of generic commands.',
      'A script that runs whois, then subfinder, then theharvester in sequence removes the risk of forgetting a step or a flag, and lets the exact same investigation be repeated identically later.',
      'Build one now covering the core lookups from this course\'s investigation.'
    ],
    commands: [
      { cmd: "echo 'whois corp-target.lab' > recon_pipeline.sh", desc: 'Start the script with a domain lookup' },
      { cmd: "echo 'subfinder -d corp-target.lab' >> recon_pipeline.sh", desc: 'Append subdomain enumeration' },
      { cmd: "echo 'theharvester -d corp-target.lab -b all' >> recon_pipeline.sh", desc: 'Append email harvesting' },
      { cmd: 'cat recon_pipeline.sh', desc: 'Review the script before running it' },
      { cmd: 'bash recon_pipeline.sh', desc: 'Run the whole pipeline in one command' }
    ],
    hints: [
      'This is the same echo + redirection pattern from every capstone in this course, just building a runnable script instead of a report.',
      'Running "bash recon_pipeline.sh" executes all three lookups in order, one command instead of three.'
    ],
    challenge: {
      prompt: 'Build recon_pipeline.sh with whois, subfinder, and theharvester, then run it with bash.',
      check: (state) => {
        const node = getNode(state.root, [...state.cwd, 'recon_pipeline.sh']);
        const built = !!node && node.type === 'file' && node.content.includes('whois') && node.content.includes('subfinder') && node.content.includes('theharvester');
        return built && historyIncludes(state, (l) => l.startsWith('bash') && l.includes('recon_pipeline.sh'));
      }
    }
  },
  {
    id: 'automation-rate-limits',
    tag: '22.7',
    title: 'Respecting Rate Limits & API Etiquette',
    theory: [
      'Automation makes it trivially easy to send far more requests, far faster, than any human typing commands ever could — which means automated OSINT carries a specific new responsibility: not overwhelming the services you depend on.',
      'Real APIs (search engines, breach databases, WHOIS servers) enforce rate limits and will revoke access or block an IP that ignores them — a script that is polite to its dependencies keeps working; one that is not gets cut off.',
      'There is also a sharper line worth restating here: automating passive, publicly-offered lookups (this whole course) is very different from automating requests directly against a target\'s own infrastructure without authorization — the second one is active recon and carries real legal weight.'
    ],
    commands: [
      { cmd: 'cat ~/osint/rate_limit_notes.txt', desc: 'Read the etiquette notes before scaling up any script' }
    ],
    hints: [
      'Rule 4 in the notes is the one worth rereading any time you\'re tempted to point a script at a real, non-lab target.'
    ],
    challenge: {
      prompt: 'Read rate_limit_notes.txt and identify the distinction between automating passive lookups and automating active recon against a target.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('cat') && l.includes('rate_limit_notes.txt'))
    }
  },
  {
    id: 'automation-capstone',
    tag: '22.8',
    title: 'Capstone: Build a Custom Automated Recon Pipeline',
    theory: [
      'This closes the module — and effectively synthesizes Modules 13 through 22 — by using the framework, the link graph, and a script together: a workspace-driven investigation, a visual entity graph, and a repeatable pipeline, the three automation patterns real OSINT teams actually use in combination.',
      'Everything here was learned individually across this course; the only new skill in this capstone is combining them into one coherent, repeatable, documented workflow.'
    ],
    commands: [
      { cmd: 'reconng workspace novaretail-final', desc: 'Set up a fresh workspace for the final pass' },
      { cmd: 'reconng use recon/domains-hosts/subfinder', desc: 'Load subdomain enumeration' },
      { cmd: 'reconng run', desc: 'Run it' },
      { cmd: 'linkgraph add corp-target.lab owned-by "Nova Retail Group"', desc: 'Record the core entity relationship' },
      { cmd: 'linkgraph show', desc: 'Review the graph' },
      { cmd: "echo 'whois corp-target.lab' > final_pipeline.sh", desc: 'Start a reusable pipeline script' },
      { cmd: "echo 'subfinder -d corp-target.lab' >> final_pipeline.sh", desc: 'Append subdomain enumeration' },
      { cmd: 'bash final_pipeline.sh', desc: 'Run the pipeline' },
      { cmd: "echo 'Automation Summary: novaretail-final workspace, graph with core entities, reusable pipeline script' > automation_report.txt", desc: 'Document what was built' },
      { cmd: 'cat automation_report.txt', desc: 'Review the finished summary' }
    ],
    hints: [
      'This capstone is about combining the three tools from this module (framework, graph, script), not introducing a new one.',
      'Reuse facts and relationships from throughout this course rather than inventing new ones — automation packages existing knowledge, it does not replace the investigation itself.'
    ],
    challenge: {
      prompt: 'Set up a workspace and run a module, add at least one link to the graph, build and run a pipeline script, then write automation_report.txt.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'automation_report.txt']);
        const pipelineNode = getNode(state.root, ['home', 'student', 'final_pipeline.sh']);
        const built = !!node && node.type === 'file';
        const pipelineBuilt = !!pipelineNode && pipelineNode.type === 'file' && pipelineNode.content.includes('whois') && pipelineNode.content.includes('subfinder');
        return built && pipelineBuilt && state.reconWorkspace === 'novaretail-final' && state.linkGraph.length >= 1 &&
          historyIncludes(state, (l) => l.startsWith('reconng') && l.includes('run')) &&
          historyIncludes(state, (l) => l.startsWith('bash') && l.includes('final_pipeline.sh'));
      }
    }
  },
  {
    id: 'megacapstone-scoping',
    tag: '23.1',
    title: 'Scoping the Full-Scope Engagement',
    theory: [
      'Every professional OSINT engagement begins with a written scope: what target, what individuals, what categories of data, and what is explicitly out of bounds — agreed upon before a single lookup runs, not decided improvised along the way.',
      'This capstone formalizes what has been implicit since Module 13: Nova Retail Group has authorized a full-scope OSINT assessment covering its domain (corp-target.lab), its named IT Director (Jordan Martinez) in a professional capacity, and its public-facing security posture — nothing more.',
      'Write that scope document now — the single most important artifact of a real engagement, and the one most often skipped by beginners eager to just start running tools.'
    ],
    commands: [
      { cmd: "echo 'Rules of Engagement: Nova Retail Group Full-Scope OSINT Assessment' > scope.txt", desc: 'Start the scope document' },
      { cmd: "echo 'In scope: corp-target.lab and subdomains, Nova Retail Group corporate entity, Jordan Martinez (IT Director, professional capacity only)' >> scope.txt", desc: 'Define what is in scope' },
      { cmd: "echo 'Out of scope: any active exploitation, any individual beyond the named IT Director, any non-public data source' >> scope.txt", desc: 'Define what is explicitly out of scope' },
      { cmd: 'cat scope.txt', desc: 'Review the finished scope document' }
    ],
    hints: [
      'A scope document is only useful if it explicitly names what is NOT included, not just what is.',
      'This mirrors Module 15 and Module 20\'s ethics lessons — this capstone just makes the same discipline official and written down first.'
    ],
    challenge: {
      prompt: 'Write scope.txt naming both what is in scope and what is explicitly out of scope.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'scope.txt']);
        return !!node && node.type === 'file' && node.content.includes('In scope') && node.content.includes('Out of scope');
      }
    }
  },
  {
    id: 'megacapstone-full-sweep',
    tag: '23.2',
    title: 'Executing the Full-Scope Passive Investigation',
    theory: [
      'With scope agreed, this lesson runs one representative tool from every discipline covered across Modules 13-21 against corp-target.lab and Jordan Martinez — domain intelligence, GEOINT, corporate intelligence, breach intelligence, SOCMINT, dark-web monitoring, threat intelligence, and people search.',
      'This is the broadest single command list in the whole course — that\'s intentional: a real full-scope assessment really does touch every discipline, one after another, exactly like this.',
      'This lesson is deliberately about breadth, not depth — the next lesson turns this wide sweep into a focused, prioritized narrative.'
    ],
    commands: [
      { cmd: 'whois corp-target.lab', desc: 'Module 13: domain ownership' },
      { cmd: 'mapsearch sacramento', desc: 'Module 14: GEOINT facility confirmation' },
      { cmd: 'corpreg Nova Retail Group', desc: 'Module 15: corporate registry' },
      { cmd: 'hibp jmartinez@corp-target.lab', desc: 'Module 16: breach exposure' },
      { cmd: 'socialgraph jmartinez', desc: 'Module 17: social network mapping' },
      { cmd: 'darkmentions Nova Retail Group', desc: 'Module 18: dark-web mentions' },
      { cmd: 'actorprofile ShadowLedger', desc: 'Module 19: threat actor attribution' },
      { cmd: 'pubrecords Jordan Martinez', desc: 'Module 20: public records' },
      { cmd: 'selfaudit', desc: 'Module 21: counter-OSINT self-check, for comparison' }
    ],
    hints: [
      'This is a checklist, not a puzzle — work through each command from the list above, same as every wide-sweep capstone earlier in this course.',
      'Every one of these commands has already been used successfully earlier in the course — this lesson is about running them together, not learning anything new.'
    ],
    challenge: {
      prompt: 'Run at least one representative command from each of Modules 13 through 21 as listed above.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('whois') && l.includes('corp-target.lab')) &&
        historyIncludes(state, (l) => l.startsWith('mapsearch')) &&
        historyIncludes(state, (l) => l.startsWith('corpreg') && l.toLowerCase().includes('nova retail group')) &&
        historyIncludes(state, (l) => l.startsWith('hibp') && l.includes('jmartinez@corp-target.lab')) &&
        historyIncludes(state, (l) => l.startsWith('socialgraph') && l.includes('jmartinez')) &&
        historyIncludes(state, (l) => l.startsWith('darkmentions')) &&
        historyIncludes(state, (l) => l.startsWith('actorprofile')) &&
        historyIncludes(state, (l) => l.startsWith('pubrecords') && l.toLowerCase().includes('jordan martinez')) &&
        historyIncludes(state, (l) => l.trim() === 'selfaudit')
    }
  },
  {
    id: 'megacapstone-executive-summary',
    tag: '23.3',
    title: 'Synthesizing Findings into an Executive Summary',
    theory: [
      'A pile of raw tool output is not a deliverable — decision-makers need a short, prioritized executive summary: the two or three findings that actually matter, in plain language, before any technical detail.',
      'Order matters: lead with the most urgent, actionable finding (the phishing domain and its actor attribution), not the first thing you happened to look up.',
      'This is the same severity-first instinct from Module 16\'s remediation plan and Module 19\'s threat report, scaled up to summarize an entire multi-discipline investigation in a few lines a busy executive will actually read.'
    ],
    commands: [
      { cmd: "echo 'Executive Summary: Nova Retail Group OSINT Assessment' > executive_summary.txt", desc: 'Start the summary' },
      { cmd: "echo '1. URGENT: active phishing domain (nova-retail-support-portal.net) impersonating our support portal, attributed to ShadowLedger' >> executive_summary.txt", desc: 'Lead with the most urgent finding' },
      { cmd: "echo '2. Employee credential reuse found in breach data - recommend forced reset plus MFA' >> executive_summary.txt", desc: 'Record the second-priority finding' },
      { cmd: "echo '3. Job postings and social media disclose more of our tech stack than necessary - recommend a review' >> executive_summary.txt", desc: 'Record a lower-priority finding' },
      { cmd: 'cat executive_summary.txt', desc: 'Review the finished summary' }
    ],
    hints: [
      'The most urgent, actively-exploitable finding goes first — not the first thing chronologically discovered.',
      'Each line should be readable by someone who has never touched a terminal — no raw command output, no jargon without context.'
    ],
    challenge: {
      prompt: 'Write executive_summary.txt with at least three prioritized findings, most urgent first.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'executive_summary.txt']);
        return !!node && node.type === 'file' &&
          node.content.includes('URGENT') && node.content.includes('ShadowLedger') &&
          node.content.includes('1.') && node.content.includes('2.') && node.content.includes('3.');
      }
    }
  },
  {
    id: 'megacapstone-final-report',
    tag: '23.4',
    title: 'Final Capstone: Deliver the Complete OSINT Investigation Report',
    theory: [
      'This is the last lesson of the entire OSINT curriculum: assembling the scope document, the full-sweep findings, and the executive summary into one final, complete deliverable — exactly what a real engagement hands back to the client at its conclusion.',
      'Every fact in this final report was earned honestly across ten modules: nothing here was invented for this lesson — it is all synthesis of investigations already run, corroborated across independent tools and rated for confidence throughout, the entire discipline this course has been teaching from Module 13 onward.',
      'Congratulations on completing the OSINT track — from a single whois lookup in Module 13 to a fully scoped, multi-discipline investigation with a professional deliverable here.'
    ],
    commands: [
      { cmd: 'cat scope.txt', desc: 'Review the scope agreed at the start' },
      { cmd: 'cat executive_summary.txt', desc: 'Review the prioritized executive summary' },
      { cmd: "echo 'FINAL REPORT: Nova Retail Group Full-Scope OSINT Assessment' > final_investigation_report.txt", desc: 'Start the final report' },
      { cmd: 'cat scope.txt >> final_investigation_report.txt', desc: 'Fold in the scope document' },
      { cmd: 'cat executive_summary.txt >> final_investigation_report.txt', desc: 'Fold in the executive summary' },
      { cmd: "echo 'Methodology: investigation conducted across Modules 13-22 - domain, GEOINT, corporate, breach, SOCMINT, dark web, threat intel, people search, counter-OSINT, and automation.' >> final_investigation_report.txt", desc: 'Document the methodology' },
      { cmd: 'cat final_investigation_report.txt', desc: 'Review the complete, final deliverable' }
    ],
    hints: [
      '"cat scope.txt >> final_investigation_report.txt" appends one whole file into another — a handy pattern for assembling a final document from pieces built earlier.',
      'This report should read as one coherent document, not three disconnected pastes — that coherence is the actual skill being tested here.'
    ],
    challenge: {
      prompt: 'Assemble scope.txt and executive_summary.txt into final_investigation_report.txt, along with a methodology line, then review the complete report.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'final_investigation_report.txt']);
        return !!node && node.type === 'file' &&
          node.content.includes('In scope') &&
          node.content.includes('URGENT') &&
          node.content.toLowerCase().includes('modules 13-22');
      }
    }
  },
  {
    id: 'enum-intro',
    tag: '24.1',
    title: 'Intro to Enumeration: From Recon to Actionable Detail',
    theory: [
      'Reconnaissance (Module 8) tells you WHAT exists — open ports, a web app, a hidden path. Enumeration goes further: WHO has access, WHAT software version exactly, and WHAT that version is specifically known to be weak against. It is the bridge between recon and actually gaining access.',
      'This module returns to webserver01.lab, the same host recon\'d in Module 8 — /admin, /backup.zip, and /.git/config were already found there. Enumeration now digs into each of those findings for something actionable.',
      'Everything in this module and the next stays inside this lab\'s own fictional host under an implicit authorized-training scope, exactly like every other simulated exercise in this course — the same passive-vs-active discipline from the OSINT track applies here too, just one step further along the attack chain.'
    ],
    commands: [
      { cmd: 'nmap webserver01.lab', desc: 'Recall what Module 8 already found open' },
      { cmd: 'curl http://webserver01.lab/api/status', desc: 'Recall the app version already discovered' }
    ],
    hints: [
      'Nothing new to run yet — this lesson is about orienting to exactly where Module 8 left off.'
    ],
    challenge: {
      prompt: 'Run nmap and curl against webserver01.lab to recall Module 8\'s findings before enumerating further.',
      check: (state) =>
        historyIncludes(state, (l) => l.startsWith('nmap') && l.includes('webserver01.lab')) &&
        historyIncludes(state, (l) => l.startsWith('curl') && l.includes('/api/status'))
    }
  },
  {
    id: 'enum-service-fingerprint',
    tag: '24.2',
    title: 'Service & Version Fingerprinting',
    theory: [
      '"whatweb" fingerprints exactly what is running on a target — application name, version, and underlying framework — going beyond a bare port scan or a generic banner.',
      'Running it against webserver01.lab confirms the same version curl\'s /api/status already showed (1.4.2) — cross-confirmation from an independent tool, the same corroboration habit from the OSINT track.',
      'A confirmed, precise version number is exactly what you need before looking up known vulnerabilities for it later in this module.'
    ],
    commands: [
      { cmd: 'whatweb http://webserver01.lab', desc: 'Fingerprint the web application' }
    ],
    hints: [
      'Compare the version number here to the /api/status JSON from Module 8 — they should match exactly.'
    ],
    challenge: {
      prompt: 'Run whatweb against webserver01.lab and confirm the version matches Module 8\'s finding.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('whatweb') && l.includes('webserver01.lab'))
    }
  },
  {
    id: 'enum-smb-shares',
    tag: '24.3',
    title: 'SMB Share Enumeration',
    theory: [
      '"enum4linux" probes a host\'s SMB service for shares, users, and OS details — a goldmine on real engagements where SMB is exposed, since Windows and Samba-on-Linux hosts alike often over-share.',
      'webserver01.lab exposes a "backups$" share — explaining exactly why /backup.zip from Module 8 was reachable in the first place — and reveals a set of local usernames.',
      'One username in particular is worth remembering for the rest of this module: "dsilva".'
    ],
    commands: [
      { cmd: 'enum4linux webserver01.lab', desc: 'Enumerate SMB shares and users' }
    ],
    hints: [
      'The "backups$" share explains the /backup.zip path Module 8 already found via gobuster.'
    ],
    challenge: {
      prompt: 'Run enum4linux against webserver01.lab and note the discovered usernames.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('enum4linux') && l.includes('webserver01.lab'))
    }
  },
  {
    id: 'enum-snmp',
    tag: '24.4',
    title: 'SNMP Enumeration',
    theory: [
      'SNMP, when left on a default "public" read-only community string, leaks far more than its name suggests — system descriptions, uptime, and often an administrator contact.',
      '"snmpwalk" against webserver01.lab reveals a system contact field naming an actual person, "D. Silva" — the same username enum4linux just surfaced, now with a name attached. Two independent tools, same identity.'
    ],
    commands: [
      { cmd: 'snmpwalk -c public webserver01.lab', desc: 'Walk the SNMP tree with the default community string' }
    ],
    hints: [
      'Compare the sysContact field to the username enum4linux found in the last lesson.'
    ],
    challenge: {
      prompt: 'Run snmpwalk against webserver01.lab and confirm the sysContact matches the enum4linux username.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('snmpwalk') && l.includes('webserver01.lab'))
    }
  },
  {
    id: 'enum-leaked-backup',
    tag: '24.5',
    title: 'Extracting Credentials from a Leaked Backup',
    theory: [
      'Module 8 found /backup.zip publicly exposed but never opened it. Enumeration means finishing that thought: download it, extract it, and read what is inside.',
      'This is one of the single most common ways real engagements get their first foothold — not a clever exploit, just a backup file someone forgot was reachable, containing exactly the credentials needed to log in properly.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Start from home so the download lands somewhere predictable' },
      { cmd: 'wget http://webserver01.lab/backup.zip', desc: 'Download the exposed backup' },
      { cmd: 'unzip backup.zip', desc: 'Extract its contents' },
      { cmd: 'cat webapp_config.txt', desc: 'Read the extracted config file' }
    ],
    hints: [
      'Extracting lands the file in your current directory — "ls" if you are not sure what unzip produced.',
      'This file contains both database credentials and an admin account — the admin one is what you need for the rest of this module.'
    ],
    challenge: {
      prompt: 'Download and extract backup.zip, then read webapp_config.txt to find the admin credentials.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'webapp_config.txt']);
        return !!node && node.type === 'file' && node.content.includes('dsilva') &&
          historyIncludes(state, (l) => l.startsWith('cat') && l.includes('webapp_config.txt'));
      }
    }
  },
  {
    id: 'enum-vuln-lookup',
    tag: '24.6',
    title: 'Looking Up Known Vulnerabilities by Version',
    theory: [
      '"searchsploit" queries a database of documented, publicly known vulnerabilities and advisories by product name and version — the standard bridge between "I know exactly what this is" and "I know exactly what is wrong with it."',
      'Searching the version confirmed by whatweb surfaces an advisory about weak default administrative credentials — exactly matching what the leaked backup already handed you directly. Confirmation, not new information — which is itself valuable: it tells you this is a known, documented issue, not a fluke.',
      'This is the last enumeration step before moving to Module 25 — everything needed to attempt access is now in hand.'
    ],
    commands: [
      { cmd: 'searchsploit "internal app 1.4.2"', desc: 'Look up known vulnerabilities for this exact version' }
    ],
    hints: [
      'This does not tell you anything you don\'t already know from the leaked config — it confirms this is a documented issue, not a coincidence.'
    ],
    challenge: {
      prompt: 'Run searchsploit for the fingerprinted version and review the advisory.',
      check: (state) => state.redteam.enumerationDone === true && historyIncludes(state, (l) => l.startsWith('searchsploit'))
    }
  },
  {
    id: 'enum-report',
    tag: '24.7',
    title: 'Writing an Enumeration Report',
    theory: [
      'Same discipline as every module before it: raw tool output is not a deliverable. Compile the SMB, SNMP, leaked-credential, and advisory findings into one report before moving on to using any of it.',
      'This report is what Module 25 picks up from — treat it as the handoff document between the enumeration phase and the initial-access phase of the same engagement.'
    ],
    commands: [
      { cmd: "echo 'Enumeration Report: webserver01.lab' > enum_report.txt", desc: 'Start the report' },
      { cmd: "echo 'SMB: backups$ share (no auth), users: dsilva, svc-backup' >> enum_report.txt", desc: 'Record the SMB findings' },
      { cmd: "echo 'SNMP: sysContact D. Silva <dsilva@webserver01.lab>' >> enum_report.txt", desc: 'Record the SNMP findings' },
      { cmd: "echo 'Leaked credential: dsilva / Winter2025! (from backup.zip webapp_config.txt)' >> enum_report.txt", desc: 'Record the leaked credential' },
      { cmd: "echo 'Advisory: Internal App <= 1.4.2 - Default Administrative Credentials' >> enum_report.txt", desc: 'Record the searchsploit advisory' },
      { cmd: 'cat enum_report.txt', desc: 'Review the finished report' }
    ],
    hints: [
      'Every line here traces back to a specific command earlier in this module — nothing invented for the report itself.'
    ],
    challenge: {
      prompt: 'Write enum_report.txt covering the SMB, SNMP, leaked-credential, and advisory findings.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'enum_report.txt']);
        return !!node && node.type === 'file' &&
          node.content.includes('dsilva') &&
          node.content.toLowerCase().includes('backups$') &&
          node.content.toLowerCase().includes('advisory');
      }
    }
  },
  {
    id: 'enum-capstone',
    tag: '24.8',
    title: 'Capstone: Full Enumeration Sweep of webserver01.lab',
    theory: [
      'This closes the module by running the complete enumeration workflow against webserver01.lab — service fingerprinting, SMB, SNMP, the leaked backup, and a vulnerability lookup — then documenting it, exactly like a real engagement\'s enumeration phase.',
      'Everything gathered here becomes Module 25\'s starting point: a confirmed username, a confirmed password, and a confirmed, documented reason those credentials are expected to work.'
    ],
    commands: [
      { cmd: 'whatweb http://webserver01.lab', desc: 'Fingerprint the application version' },
      { cmd: 'enum4linux webserver01.lab', desc: 'Enumerate SMB shares and users' },
      { cmd: 'snmpwalk -c public webserver01.lab', desc: 'Walk the SNMP tree' },
      { cmd: 'cd ~', desc: 'Move home before downloading' },
      { cmd: 'wget http://webserver01.lab/backup.zip', desc: 'Download the exposed backup' },
      { cmd: 'unzip backup.zip', desc: 'Extract it' },
      { cmd: 'cat webapp_config.txt', desc: 'Read the leaked credentials' },
      { cmd: 'searchsploit "internal app 1.4.2"', desc: 'Confirm the known-vulnerability advisory' },
      { cmd: "echo 'Enumeration complete: dsilva / Winter2025! confirmed via leaked backup + advisory' > enum_report.txt", desc: 'Summarize the outcome' },
      { cmd: 'cat enum_report.txt', desc: 'Review the finished summary' }
    ],
    hints: [
      'Work through every tool in order — each one either confirms or adds to what the previous one found.',
      'The searchsploit step must run for enumeration to be considered complete — it is what sets this lesson\'s pass condition.'
    ],
    challenge: {
      prompt: 'Run whatweb, enum4linux, snmpwalk, the backup download/extraction, and searchsploit against webserver01.lab, then summarize in enum_report.txt.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'enum_report.txt']);
        const built = !!node && node.type === 'file' && node.content.includes('dsilva');
        return built && state.redteam.enumerationDone === true &&
          historyIncludes(state, (l) => l.startsWith('whatweb') && l.includes('webserver01.lab')) &&
          historyIncludes(state, (l) => l.startsWith('enum4linux') && l.includes('webserver01.lab')) &&
          historyIncludes(state, (l) => l.startsWith('snmpwalk') && l.includes('webserver01.lab')) &&
          historyIncludes(state, (l) => l.startsWith('wget') && l.includes('backup.zip')) &&
          historyIncludes(state, (l) => l.startsWith('unzip') && l.includes('backup.zip')) &&
          historyIncludes(state, (l) => l.startsWith('searchsploit'));
      }
    }
  },
  {
    id: 'ia-intro',
    tag: '25.1',
    title: 'Intro to Initial Access & Rules of Engagement',
    theory: [
      '"Initial Access" is the MITRE ATT&CK tactic covering exactly one goal: turning everything enumeration found into an actual foothold on the target — nothing more, nothing less.',
      'Every technique in this module maps to a real, named ATT&CK technique (the IDs themselves appear directly in the tool output) — the same vocabulary introduced in the OSINT track\'s threat-intelligence module, now used from the other side.',
      'This entire exercise stays inside this lab\'s own fictional, sandboxed webserver01.lab under an implicit authorized-training scope — real engagements always require a signed authorization before this step, never assumed.'
    ],
    commands: [
      { cmd: 'cd ~', desc: 'Make sure you are home, where Module 24 left the leaked config' },
      { cmd: 'cat webapp_config.txt', desc: 'Recall the leaked admin credential' }
    ],
    hints: [
      'If this file is missing, revisit Module 24.5 (Extracting Credentials from a Leaked Backup) first.'
    ],
    challenge: {
      prompt: 'Review webapp_config.txt to recall the admin credential before attempting access.',
      check: (state) => historyIncludes(state, (l) => l.startsWith('cat') && l.includes('webapp_config.txt'))
    }
  },
  {
    id: 'ia-credential-validation',
    tag: '25.2',
    title: 'Validating Credentials with hydra',
    theory: [
      '"hydra" tests a specific username/password pair directly against a live service — the step between "I found a credential somewhere" and "I know for certain it actually works," without yet committing to a full interactive login.',
      'Testing the leaked admin credential against webserver01.lab\'s ssh service confirms it works before you rely on it — exactly the discipline a real engagement follows, rather than assuming a found password is still valid.',
      'A successful hydra run here maps directly to MITRE ATT&CK technique T1078 (Valid Accounts): using a legitimate, working credential rather than exploiting a software flaw.'
    ],
    commands: [
      { cmd: 'hydra -l dsilva -p Winter2025! webserver01.lab ssh', desc: 'Validate the leaked credential against the SSH service' }
    ],
    hints: [
      'Use the exact username and password extracted from webapp_config.txt in Module 24.',
      '"0 valid passwords found" means a typo somewhere in the credential — double-check it against webapp_config.txt.'
    ],
    challenge: {
      prompt: 'Run hydra with the leaked credential against webserver01.lab and confirm it succeeds.',
      check: (state) => state.redteam.footholdGained === true && historyIncludes(state, (l) => l.startsWith('hydra'))
    }
  },
  {
    id: 'ia-ssh-foothold',
    tag: '25.3',
    title: 'Establishing the Foothold via SSH',
    theory: [
      'With the credential validated, connecting is now exactly the same "ssh user@host" command from Module 2 — the only difference is this time the credential came from your own enumeration work instead of being handed to you.',
      'Watch the prompt: once connected, it changes to show webserver01.lab instead of your local machine — the same visual cue from Module 2, now meaning something real: you are on the target.'
    ],
    commands: [
      { cmd: 'ssh dsilva@webserver01.lab', desc: 'Connect using the validated credential' }
    ],
    hints: [
      'This will fail with "Permission denied" unless the hydra validation in the last lesson actually succeeded first — order matters.'
    ],
    challenge: {
      prompt: 'SSH into webserver01.lab as dsilva.',
      check: (state) => state.sshHost === 'webserver01.lab' && state.redteam.compromisedHost === 'webserver01.lab'
    }
  },
  {
    id: 'ia-verify-access',
    tag: '25.4',
    title: 'Verifying Access & Capturing Proof',
    theory: [
      'A foothold is not confirmed access — get in the habit of proving it. Real engagements do this to remove any doubt when writing the final report; training labs do it with a literal proof-of-access flag.',
      'The login banner from the last lesson shows exactly this kind of proof — read it carefully, then record what it says.'
    ],
    commands: [
      { cmd: "echo 'flag{f0oth0ld_via_leaked_creds}' > initial_access_proof.txt", desc: 'Record the proof-of-access flag shown in the ssh banner' },
      { cmd: 'cat initial_access_proof.txt', desc: 'Review it' }
    ],
    hints: [
      'The flag appeared directly in the banner text after your ssh command in the last lesson — copy it exactly.'
    ],
    challenge: {
      prompt: 'Record the proof-of-access flag from the ssh banner into initial_access_proof.txt.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'initial_access_proof.txt']);
        return !!node && node.type === 'file' && node.content.includes('flag{f0oth0ld_via_leaked_creds}');
      }
    }
  },
  {
    id: 'ia-attck-log',
    tag: '25.5',
    title: 'Reviewing the Attack Technique Log',
    theory: [
      '"attcklog" shows every MITRE ATT&CK technique this engagement has triggered so far, in order — automatically logged as each one happened, not written up after the fact.',
      'This is the same T1078 (Valid Accounts) technique named back in the OSINT track\'s threat-intelligence module, from the other side: there, you investigated an attacker using this technique against someone else; here, you used it yourself under an authorized, simulated engagement.'
    ],
    commands: [
      { cmd: 'attcklog', desc: 'Review the logged techniques for this engagement' }
    ],
    hints: [
      'One entry should reference the hydra credential validation and T1078 — that is the technique this whole module has been building toward.'
    ],
    challenge: {
      prompt: 'Run attcklog and review the technique(s) logged so far.',
      check: (state) => historyIncludes(state, (l) => l.trim() === 'attcklog') && state.redteam.techniquesLogged.length >= 1
    }
  },
  {
    id: 'ia-exit-session',
    tag: '25.6',
    title: 'Ending the Session Cleanly',
    theory: [
      'Closing a remote session properly with "exit" or "logout" is basic hygiene — leaving sessions open is both an operational-security risk and just sloppy practice on a real engagement.',
      'Notice the prompt returns to showing your local machine once the session closes — the same reversible visual cue from Module 2, confirming you are back home.'
    ],
    commands: [
      { cmd: 'exit', desc: 'Close the ssh session and return home' }
    ],
    hints: [
      'The prompt switching back to your local hostname is the confirmation the session actually closed.'
    ],
    challenge: {
      prompt: 'Exit the ssh session and confirm you are back on your local machine.',
      check: (state) => state.sshHost === null && historyIncludes(state, (l) => l.trim() === 'exit' || l.trim() === 'logout')
    }
  },
  {
    id: 'ia-documentation',
    tag: '25.7',
    title: 'Documenting Initial Access for a Pentest Report',
    theory: [
      'A real engagement report always documents initial access precisely: the exact entry vector, the specific technique (with its ATT&CK ID), and the evidence proving it happened — enough detail that someone else could reproduce and verify the finding.',
      'Write that entry now, pulling directly from this module\'s own findings rather than summarizing from memory.'
    ],
    commands: [
      { cmd: "echo 'Initial Access Report: webserver01.lab' > initial_access_report.txt", desc: 'Start the report' },
      { cmd: "echo 'Entry vector: leaked credential (dsilva) found in publicly exposed backup.zip' >> initial_access_report.txt", desc: 'Record the entry vector' },
      { cmd: "echo 'Technique: T1078 Valid Accounts, validated via hydra, confirmed via ssh' >> initial_access_report.txt", desc: 'Record the ATT&CK technique' },
      { cmd: "echo 'Evidence: flag{f0oth0ld_via_leaked_creds} captured from login banner' >> initial_access_report.txt", desc: 'Record the evidence' },
      { cmd: 'cat initial_access_report.txt', desc: 'Review the finished report' }
    ],
    hints: [
      'Each line should be traceable to a specific earlier lesson in this module — entry vector to 24.5/25.2, technique to 25.2/25.5, evidence to 25.4.'
    ],
    challenge: {
      prompt: 'Write initial_access_report.txt covering the entry vector, the ATT&CK technique, and the evidence.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'initial_access_report.txt']);
        return !!node && node.type === 'file' &&
          node.content.includes('T1078') &&
          node.content.includes('dsilva') &&
          node.content.includes('flag{f0oth0ld_via_leaked_creds}');
      }
    }
  },
  {
    id: 'ia-capstone',
    tag: '25.8',
    title: 'Capstone: Full Initial Access Chain',
    theory: [
      'This closes the module — and the enumeration/initial-access arc — by running the complete chain from validated credential to documented foothold: hydra, ssh, proof capture, the ATT&CK log, and a final report.',
      'Everything here was earned across two modules: Module 24 found the version, the shares, the contact, and the leaked credential; Module 25 validated it, used it, proved it, and wrote it up. That full arc — enumerate, validate, access, document — is the shape of a real engagement\'s opening phase.'
    ],
    commands: [
      { cmd: 'hydra -l dsilva -p Winter2025! webserver01.lab ssh', desc: 'Validate the credential' },
      { cmd: 'ssh dsilva@webserver01.lab', desc: 'Establish the foothold' },
      { cmd: "echo 'flag{f0oth0ld_via_leaked_creds}' > initial_access_proof.txt", desc: 'Capture proof of access' },
      { cmd: 'attcklog', desc: 'Review the logged techniques' },
      { cmd: 'exit', desc: 'Close the session cleanly' },
      { cmd: "echo 'Initial Access Report: webserver01.lab' > initial_access_report.txt", desc: 'Start the final report' },
      { cmd: "echo 'Entry vector: leaked credential (dsilva) via exposed backup.zip' >> initial_access_report.txt", desc: 'Record the entry vector' },
      { cmd: "echo 'Technique: T1078 Valid Accounts' >> initial_access_report.txt", desc: 'Record the technique' },
      { cmd: "echo 'Evidence: flag{f0oth0ld_via_leaked_creds}' >> initial_access_report.txt", desc: 'Record the evidence' },
      { cmd: 'cat initial_access_report.txt', desc: 'Review the finished report' }
    ],
    hints: [
      'Work through the chain in order — hydra before ssh, ssh before the proof capture, exit before writing the final report.',
      'This capstone reuses every command from this module — nothing new is introduced here, only combined.'
    ],
    challenge: {
      prompt: 'Validate the credential, establish the foothold, capture proof, review the attack log, exit cleanly, and write initial_access_report.txt.',
      check: (state) => {
        const node = getNode(state.root, ['home', 'student', 'initial_access_report.txt']);
        const built = !!node && node.type === 'file' && node.content.includes('T1078') && node.content.includes('flag{f0oth0ld_via_leaked_creds}');
        return built &&
          state.redteam.footholdGained === true &&
          state.redteam.compromisedHost === 'webserver01.lab' &&
          state.sshHost === null &&
          historyIncludes(state, (l) => l.startsWith('hydra')) &&
          historyIncludes(state, (l) => l.startsWith('ssh') && l.includes('webserver01.lab')) &&
          historyIncludes(state, (l) => l.trim() === 'attcklog');
      }
    }
  }
];
