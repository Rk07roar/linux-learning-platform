import { ShellState } from './state';
import { TerminalApp } from './terminalApp';
import { TheoryPanel } from './theoryPanel';
import { lessons } from './content/lessons';

const state = new ShellState();

const terminalContainer = document.getElementById('terminal')!;
const theoryContainer = document.getElementById('theory-content')!;

const terminal = new TerminalApp(state, terminalContainer);
const theoryPanel = new TheoryPanel(theoryContainer, lessons, state);

terminal.onCommand(() => theoryPanel.recheck());
terminal.focus();
