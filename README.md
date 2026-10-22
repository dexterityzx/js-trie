# js-trie

## API contract (js-trie-v2.js)

`Trie()` returns an object with:

- `add(word)` — inserts `word` into the trie. `word` MUST be a string;
  passing a non-string throws `TypeError`. Callers that forward untrusted
  input (e.g. request bodies / query parameters) should either validate
  the type first or wrap the call in `try/catch`.
- `addMany(words)` — iterates `words` and calls `add` on each element.
  Each element MUST be a string (same contract as `add`).
- `prefix(prefix)` — returns an array of words that start with `prefix`.
  Non-string or empty inputs return `[]` instead of throwing, so a
  malformed query parameter (number, `null`/`undefined`, object, or the
  array Express produces for a repeated query parameter) cannot become
  an uncaught exception / unhandled rejection in the host.
