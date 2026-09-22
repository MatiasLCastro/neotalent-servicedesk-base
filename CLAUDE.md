# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Mini Service Desk — a course project ("IA generativa y agéntica con Claude", Neotalent
Conclusion). A ticket triage tool for a fictional physical-security service: ticket list +
detail, Claude-assisted priority/category classification, and a metrics panel. Data is 100%
synthetic (`data/tickets.json`).

The project follows a fixed Sesión/Fase curriculum (see `README.md`'s table). Don't build
ahead of the current phase without confirming with the user first — e.g. don't start Fase 4
(tests/validation) or Fase 5 (deploy) work while Fase 3 (development) is still in progress.

Binding project rules and the functional spec are not duplicated here — read them directly:
- @docs/constitution.md — non-negotiable, verifiable rules (no build, no deps, no LLM calls
  from the browser, strict `js/utils`/`js/components` separation, closed scope). Wins any
  conflict with the spec or the design docs.
- @docs/spec.md — Fase 1 functional spec: the 3 features, their acceptance criteria, and
  what's explicitly out of scope.

## Stack

Plain HTML + CSS + JS. **No build step, no bundler, no npm, no `package.json`, no
`node_modules/` — ever.** `index.html` opens directly in a browser. Do not suggest adding one
of these; it's a deliberate, constitution-level constraint (Art. 1), not an oversight.

## Testing

`js/utils/**` and `js/components/**` are plain, DOM-free/fetch-free-except-injected functions,
each with a same-directory `*.test.js` file using Node's **built-in** test runner:

```
node --test js/utils/tickets.test.js          # one file
node --test                                    # whole suite
```

No test framework dependency (no Jest/Vitest/Mocha) — `node:test` and `node:assert/strict`
ship with Node itself. `js/app.js` (DOM + `fetch` wiring) has no automated tests by design —
a headless-browser test runner would itself be a "dependency" this project's constitution
forbids. Those parts are verified manually against the spec's acceptance criteria instead.

## The UMD export pattern

Every file under `js/utils/` and `js/components/` ends with this exact shape, so the same file
works unmodified as a classic browser `<script>` tag (loaded in `index.html`, no `type="module"`)
**and** as a Node `require()`-able module for tests:

```js
if (typeof window !== "undefined") {
  window.Utils = window.Utils || {};
  window.Utils.myFunction = myFunction;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { myFunction };
}
```

`js/utils/` functions attach to `window.Utils`; `js/components/` functions (which take data and
return an HTML string — never touch `document` themselves) attach to `window.Components`. Keep
using this pattern for new files in either directory — don't switch to ES modules or `import`/
`export`, which would need a bundler or `type="module"` script tags this project doesn't use.

## Linting

`eslint.config.js` is checked in, but ESLint itself is **not** — installing it via
`package.json`/`node_modules` would violate Art. 1. Run it with a globally installed ESLint
(`npm install -g eslint`, once, outside this repo), then `eslint .` from the repo root.

## Classification workflow (no LLM calls from the browser)

Ticket priority/category are never fetched from a live model in the browser (constitution
Art. 3). The "Clasificar con Claude Code" button in the UI builds a prompt
(`Utils.generarPromptClasificacion`) and copies it to the clipboard; a human pastes it into
Claude Code, which reads/writes `data/tickets.json` directly for that one ticket. If you're
handling one of these pasted prompts: write back only `prioridad` (one of
`Crítica`/`Alta`/`Media`/`Baja`) and `categoria` (one of the 6 values listed in
`docs/spec.md` Feature 2) for the named ticket id, and touch nothing else in the file.
