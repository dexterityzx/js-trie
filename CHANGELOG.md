# Changelog

All notable changes to this project are documented in this file.
This project adheres to Semantic Versioning.

## 2.0.0

Added:
- package.json with name, version, license, engines, files, main and
  exports entries so the project can be installed as a versioned
  dependency instead of vendor-copied.
- UMD export boundary on both js-trie.js and js-trie-v2.js
  (CommonJS module.exports, AMD define, and a browser global Trie
  fallback) so consumers can require or import the module directly.
- LICENSE (MIT) and CHANGELOG.md.
- package-lock.json so a registry-recorded integrity hash is produced
  on publish and reproducible installs are possible.
- Subpath exports "./v1" (legacy, case-sensitive API) and "./v2"
  (current, case-insensitive API) so consumers can pin to a specific
  API variant explicitly.

Changed:
- The demo console.log calls at the bottom of each file now only run
  when the file is executed directly (for example, node js-trie.js).
  When the module is required or imported, no side-effects are
  produced. Running the files directly produces the same output as
  before.

Notes on semantic differences between the two API variants:

Consumers must choose one of the two exported APIs explicitly; the
behavioural contract differs and swapping them is a breaking change.

js-trie v1 (subpath "./v1"):
- Constructor: new Trie().
- Add one word: trie.add(word).
- Add many words: trie.addBatch(arr).
- Prefix search: trie.searchByPrefix(prefix).
- Prefix matching is case-sensitive.
- On a miss, returns null.
- On a hit, returns the internal live array. Callers must treat it as
  read-only; mutating the returned array corrupts the trie.

js-trie v2 (default, subpath "./v2"):
- Constructor: Trie() (factory, no "new").
- Add one word: trie.add(word).
- Add many words: trie.addMany(arr).
- Prefix search: trie.prefix(prefix).
- Input is lower-cased before lookup.
- On a miss, returns an empty array.
- On a hit, returns a new array, safe to mutate.

## 1.0.0

- Initial js-trie.js implementation (unversioned until 2.0.0).
