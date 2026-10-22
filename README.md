# js-trie

A minimal in-memory prefix-trie index with two reference implementations:

- `js-trie.js` -- classic prototype-based `Trie` class.
- `js-trie-v2.js` -- closure-based factory; keys are lower-cased on insert and lookup.

## Public API

### `js-trie.js`

- `trie.add(word)` -- index a single word at every prefix depth.
- `trie.addBatch(words)` -- index an array of words.
- `trie.remove(word)` -- remove a previously indexed word; returns `true` if
  it was present, `false` otherwise.
- `trie.searchByPrefix(prefix, limit, filter)` -- return matching words.
  Returns `null` when the prefix is not indexed.

### `js-trie-v2.js`

- `trie.add(word)` -- index a single word (case-insensitive path).
- `trie.addMany(words)` -- index an iterable of words.
- `trie.remove(word)` -- remove a previously indexed word.
- `trie.prefix(prefix, limit, filter)` -- return matching words. Returns `[]`
  when the prefix is not indexed.

### Query parameters

- `limit` -- optional maximum number of results. When omitted a safe default
  (currently 50) is applied so that a one-character probe cannot sweep the
  whole corpus. Pass `Infinity` to opt out of the bound explicitly; do not do
  this for attacker-reachable callers.
- `filter` -- optional predicate `function(word)` returning a boolean,
  evaluated against each candidate word. Callers use this to scope results
  to the current user's own entries (for example, by consulting a side table
  of `word -> ownerId`) before the results leave the library.
- Continuation -- when more matches were available than `limit`, the
  returned array carries a non-enumerable `next` property holding the next
  word, which callers can use as a pagination cursor on the next call.

## Security notes for host applications

This library is a bare in-memory data structure. It performs no I/O, applies
no authentication, no authorization, no rate limiting, no output encoding
and no per-caller scoping of its own. In particular:

- Results are raw stored strings. Whatever you put in with `add` /
  `addBatch` / `addMany` is what comes back out of `searchByPrefix` /
  `prefix`. If those strings contain HTML, control characters, or any other
  interpretable payload, the host must encode or escape them before writing
  them into a response, HTML page, log line, or other sink.
- Prefix queries are a bulk-read primitive. A short prefix (even a single
  character) can match a large fraction of the indexed corpus. The host
  must apply its own authorization check -- either by passing a `filter`
  predicate that only admits entries the caller is allowed to see, or by
  partitioning per-tenant indices -- before returning results to an end
  user. The built-in `limit` bounds the response size but is not an
  access-control mechanism.
- Attacker-controlled prefixes should be rate-limited at the host layer.
  Enumeration by iterating single-character prefixes is cheap for the
  caller; pair the library with request-level rate limits and (optionally)
  a minimum-prefix-length policy enforced by the host.
- Deletion is best-effort and local. `remove(word)` only affects the
  in-process index. If entries were persisted elsewhere, the host is
  responsible for also removing them from durable storage.
- No persistence, no replication. State lives in the process; restarts
  wipe it. Do not treat this as a system of record.

In short: treat `searchByPrefix` / `prefix` as a lookup primitive that
returns unfiltered raw stored strings, and apply authorization, rate
limiting, and output encoding in the host application before any result
reaches a user.
