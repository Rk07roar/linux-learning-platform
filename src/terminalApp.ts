import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { ShellState } from './state';
import { executeLine } from './parser';

const GREEN = '\x1b[1;32m';
const BLUE = '\x1b[1;34m';
const YELLOW = '\x1b[1;33m';
const RESET = '\x1b[0m';

export class TerminalApp {
  private term: Terminal;
  private fit: FitAddon;
  private buffer = '';
  private cursorPos = 0;
  private histIndex: number | null = null;
  private onAfterCommand: (() => void) | null = null;

  constructor(private state: ShellState, container: HTMLElement) {
    this.term = new Terminal({
      cursorBlink: true,
      fontFamily: "'Cascadia Code', 'Consolas', monospace",
      fontSize: 14,
      lineHeight: 1.25,
      theme: {
        background: '#0a0e13',
        foreground: '#d6dde5',
        cursor: '#4fd1c5',
        selectionBackground: '#264f4a'
      },
      convertEol: false
    });
    this.fit = new FitAddon();
    this.term.loadAddon(this.fit);
    this.term.open(container);
    this.fit.fit();

    window.addEventListener('resize', () => this.fit.fit());
    const ro = new ResizeObserver(() => this.fit.fit());
    ro.observe(container);

    this.term.onData((data) => this.handleData(data));

    this.printWelcome();
    this.printPrompt();
  }

  onCommand(cb: () => void) {
    this.onAfterCommand = cb;
  }

  private printWelcome() {
    this.term.writeln(`${GREEN}LinuxLab${RESET} — simulated Ubuntu terminal`);
    this.term.writeln(`Type ${YELLOW}help${RESET} to see available commands, or follow the lessons on the right.`);
    this.term.writeln('');
  }

  /** Render a custom PS1 (set via "export PS1=...") using the common bash prompt escapes. */
  private renderCustomPS1(ps1: string): string {
    const w = this.state.promptPath;
    const wBase = w === '/' ? '/' : (w.split('/').pop() || w);
    return ps1
      .replace(/\\u/g, this.state.currentUser)
      .replace(/\\h/g, this.state.promptHost)
      .replace(/\\w/g, w)
      .replace(/\\W/g, wBase)
      .replace(/\\\$/g, this.state.currentUser === 'root' ? '#' : '$')
      + ' ';
  }

  private promptString(): string {
    const ps1 = this.state.env.PS1;
    if (ps1) return this.renderCustomPS1(ps1);
    return `${GREEN}${this.state.currentUser}@${this.state.promptHost}${RESET}:${BLUE}${this.state.promptPath}${RESET}$ `;
  }

  private printPrompt() {
    this.term.write(this.promptString());
  }

  private redrawLine() {
    this.term.write('\x1b[2K\r');
    this.term.write(this.promptString());
    this.term.write(this.buffer);
    const back = this.buffer.length - this.cursorPos;
    if (back > 0) this.term.write(`\x1b[${back}D`);
  }

  private runScrollbackCommand() {
    const raw = this.buffer;
    this.term.write('\r\n');
    const output = executeLine(this.state, raw);
    if (output === '\x1bCLEAR\x1b') {
      this.term.clear();
    } else if (output) {
      this.term.write(output.split('\n').join('\r\n'));
      this.term.write('\r\n');
    }
    this.buffer = '';
    this.cursorPos = 0;
    this.histIndex = null;
    this.printPrompt();
    if (this.onAfterCommand) this.onAfterCommand();
  }

  private handleData(data: string) {
    if (data === '\r') {
      this.runScrollbackCommand();
      return;
    }
    if (data === '\x7f') {
      if (this.cursorPos > 0) {
        this.buffer = this.buffer.slice(0, this.cursorPos - 1) + this.buffer.slice(this.cursorPos);
        this.cursorPos--;
        this.redrawLine();
      }
      return;
    }
    if (data === '\x03') {
      this.term.write('^C\r\n');
      this.buffer = '';
      this.cursorPos = 0;
      this.histIndex = null;
      this.printPrompt();
      return;
    }
    if (data === '\x1b[A') { // up
      const hist = this.state.history;
      if (hist.length === 0) return;
      this.histIndex = this.histIndex === null ? hist.length - 1 : Math.max(0, this.histIndex - 1);
      this.buffer = hist[this.histIndex];
      this.cursorPos = this.buffer.length;
      this.redrawLine();
      return;
    }
    if (data === '\x1b[B') { // down
      const hist = this.state.history;
      if (this.histIndex === null) return;
      if (this.histIndex >= hist.length - 1) {
        this.histIndex = null;
        this.buffer = '';
      } else {
        this.histIndex++;
        this.buffer = hist[this.histIndex];
      }
      this.cursorPos = this.buffer.length;
      this.redrawLine();
      return;
    }
    if (data === '\x1b[C') { // right
      if (this.cursorPos < this.buffer.length) { this.cursorPos++; this.redrawLine(); }
      return;
    }
    if (data === '\x1b[D') { // left
      if (this.cursorPos > 0) { this.cursorPos--; this.redrawLine(); }
      return;
    }
    if (data.charCodeAt(0) < 32) return; // ignore other control sequences

    this.buffer = this.buffer.slice(0, this.cursorPos) + data + this.buffer.slice(this.cursorPos);
    this.cursorPos += data.length;
    this.redrawLine();
  }

  focus() {
    this.term.focus();
  }
}
