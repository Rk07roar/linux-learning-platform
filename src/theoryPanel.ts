import { Lesson } from './content/types';
import { ShellState } from './state';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function moduleNumber(tag: string): string {
  return tag.split('.')[0];
}

export class TheoryPanel {
  private index = 0;
  private completed = new Set<string>();
  private revealedHints = new Set<number>();

  constructor(
    private container: HTMLElement,
    private lessons: Lesson[],
    private state: ShellState
  ) {
    this.render();
  }

  /** Called after every terminal command; silently updates completion state. */
  recheck() {
    const lesson = this.lessons[this.index];
    if (lesson.challenge.check(this.state)) this.completed.add(lesson.id);
    this.updateStatusOnly();
  }

  private updateStatusOnly() {
    const counter = this.container.querySelector('.counter');
    if (counter) counter.textContent = this.counterText();
  }

  private counterText(): string {
    const done = this.completed.size;
    return `Lesson ${this.index + 1} of ${this.lessons.length} · ${done}/${this.lessons.length} completed`;
  }

  /** Group lessons by module number (the part of the tag before the dot), preserving order. */
  private moduleGroups(): { module: string; firstIndex: number }[] {
    const groups: { module: string; firstIndex: number }[] = [];
    const seen = new Set<string>();
    this.lessons.forEach((l, i) => {
      const m = moduleNumber(l.tag);
      if (!seen.has(m)) { seen.add(m); groups.push({ module: m, firstIndex: i }); }
    });
    return groups;
  }

  private goTo(i: number) {
    if (i < 0 || i >= this.lessons.length) return;
    this.index = i;
    this.revealedHints.clear();
    this.render();
  }

  private render() {
    const lesson = this.lessons[this.index];
    const isDone = this.completed.has(lesson.id);

    const theoryHtml = lesson.theory.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
    const bulletsHtml = lesson.bullets
      ? `<ul>${lesson.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
      : '';
    const cmdsHtml = lesson.commands.length
      ? `<div class="section-heading">Try these commands</div>
         <div class="cmd-list">${lesson.commands
           .map((c) => `<div class="cmd-item"><code>${escapeHtml(c.cmd)}</code><span>${escapeHtml(c.desc)}</span></div>`)
           .join('')}</div>`
      : '';
    const hintsHtml = `<div class="section-heading">Hints</div>
      <div class="hints">${lesson.hints
        .map((h, i) => {
          const revealed = this.revealedHints.has(i);
          return `<div class="hint-item ${revealed ? 'revealed' : ''}" data-hint-index="${i}">
            <span class="hint-label">Hint ${i + 1}</span>${revealed ? escapeHtml(h) : '<em>click to reveal</em>'}
          </div>`;
        })
        .join('')}</div>`;

    const currentModule = moduleNumber(lesson.tag);
    const moduleOptions = this.moduleGroups()
      .map((g) => `<option value="${g.firstIndex}" ${g.module === currentModule ? 'selected' : ''}>Module ${escapeHtml(g.module)}</option>`)
      .join('');

    this.container.innerHTML = `
      <div class="module-select-row">
        <select id="module-select" class="module-select">${moduleOptions}</select>
      </div>
      <div class="lesson-nav">
        <button class="nav-btn" id="prev-btn" ${this.index === 0 ? 'disabled' : ''}>&larr; Prev</button>
        <span class="counter">${this.counterText()}</span>
        <button class="nav-btn" id="next-btn" ${this.index === this.lessons.length - 1 ? 'disabled' : ''}>Next &rarr;</button>
      </div>
      <div class="lesson-tag">Module ${escapeHtml(currentModule)} &middot; ${escapeHtml(lesson.tag)}${isDone ? ' &middot; ✓ done' : ''}</div>
      <h2 class="lesson-title">${escapeHtml(lesson.title)}</h2>
      <div class="theory-body">${theoryHtml}${bulletsHtml}</div>
      ${cmdsHtml}
      ${hintsHtml}
      <div class="challenge-box">
        <h4>Challenge</h4>
        <div>${escapeHtml(lesson.challenge.prompt)}</div>
        <button class="check-btn" id="check-btn">Check my progress</button>
        <div class="result-msg" id="result-msg"></div>
      </div>
    `;

    this.container.querySelector('#module-select')?.addEventListener('change', (e) => {
      const i = Number((e.target as HTMLSelectElement).value);
      this.goTo(i);
    });
    this.container.querySelector('#prev-btn')?.addEventListener('click', () => this.goTo(this.index - 1));
    this.container.querySelector('#next-btn')?.addEventListener('click', () => this.goTo(this.index + 1));
    this.container.querySelectorAll('.hint-item').forEach((el) => {
      el.addEventListener('click', () => {
        const i = Number((el as HTMLElement).dataset.hintIndex);
        this.revealedHints.add(i);
        this.render();
      });
    });
    this.container.querySelector('#check-btn')?.addEventListener('click', () => {
      const pass = lesson.challenge.check(this.state);
      if (pass) this.completed.add(lesson.id);
      const msg = this.container.querySelector('#result-msg') as HTMLElement;
      msg.textContent = pass
        ? "Nice work — that's correct. Move on to the next lesson whenever you're ready."
        : "Not quite yet — check the hints above and try the suggested commands in the terminal.";
      msg.className = `result-msg show ${pass ? 'pass' : 'fail'}`;
      this.updateStatusOnly();
    });
  }
}
