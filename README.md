# js-trie

A tiny in-memory prefix trie for autocomplete-style lookups.

## API

### js-trie.js

- new Trie() constructs an empty trie.
- trie.add(word) inserts a single word.
- trie.addBatch(words) inserts an array of words.
- trie.searchByPrefix(prefix, limit, filter) returns up to limit words
  stored under the node reached by prefix, as a fresh array (so the
  caller cannot mutate internal state through the result). limit
  defaults to 50. Returns null when the prefix is not present. The
  optional filter(word) predicate (truthy to keep) lets the host drop
  entries the current requester may not see.

### js-trie-v2.js

- Trie() is a factory that returns an object with add, addMany, and
  prefix.
- prefix(prefix, limit, filter) uses the same bounded, filterable
  contract as above and returns an empty array when the prefix is not
  present. limit defaults to 50.

## Security notes

This structure performs no access-control filtering of its own. It stores
no ownership, tenant, or visibility metadata and will return every word
that was inserted beneath the matched prefix, up to limit. If your corpus
mixes content with different visibility scopes (for example records
belonging to different users or tenants), do not share a single trie
instance across those scopes: build one trie per visibility scope, or
pass a filter callback that drops entries the current requester may not
see. The limit default (50) is a conservative cap intended to blunt bulk
enumeration and response amplification against hosts that expose this
API to untrusted callers; hosts should additionally consider requiring a
minimum prefix length before querying.
