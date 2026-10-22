# js-trie

Two small trie implementations in JavaScript.

## Files

- js-trie.js - prototype-based Trie (case-sensitive).
- js-trie-v2.js - factory-based Trie() using Map/Set and lower-casing keys.

## API contract

### js-trie.js

- new Trie() - construct an empty trie.
- trie.add(word) - insert a single word. Throws TypeError when word is not a string.
- trie.addBatch(words) - insert many words.
  - words must be an iterable (array, Set, generator, cross-realm array, etc.). A non-iterable argument causes a TypeError.
  - Every element must be a string; otherwise a TypeError is thrown identifying the offending index.
  - Atomic: the input is fully validated before any insertion, so either every word is indexed or none is. The trie is never left partially populated by a bad batch.
- trie.searchByPrefix(prefix) - returns an array of indexed words sharing prefix, or null when the prefix is not present.

### js-trie-v2.js

- Trie() - factory that returns a new trie. Keys are lower-cased on insert and lookup.
- trie.add(word) - insert a single word. Throws TypeError when word is not a string.
- trie.addMany(words) - insert many words.
  - words must be an iterable; non-iterables cause a TypeError.
  - Every element must be a string; otherwise a TypeError is thrown identifying the offending index.
  - Atomic: the input is fully validated before any insertion, so the trie is never left partially populated when a batch contains a bad element.
- trie.prefix(prefix) - returns an array of indexed words sharing prefix (case-insensitive); returns an empty array when the prefix is not present.

## Error reporting

Both batch APIs fail loudly on bad input instead of silently discarding data. Callers using the trie as a denylist, allowlist or validation index can therefore detect an incomplete corpus load and refuse to run in a fail-open state.
