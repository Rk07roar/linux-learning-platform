import { ShellState } from '../state';

export interface LessonCommand {
  cmd: string;
  desc: string;
}

export interface Challenge {
  prompt: string;
  check: (state: ShellState) => boolean;
}

export interface Lesson {
  id: string;
  tag: string;
  title: string;
  theory: string[];
  bullets?: string[];
  commands: LessonCommand[];
  hints: string[];
  challenge: Challenge;
}
