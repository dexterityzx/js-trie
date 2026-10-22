# js-trie

A tiny prefix-trie reference implementation in two variants:

- `js-trie.js` — constructor-based (`new Trie()`), case-**sensitive**.
- `js-trie-v2.js` — factory-based (`Trie()`), case-**insensitive** (both corpus
  and queries are lowercased for matching; the originally-cased string is
  stored and returned).

The two files are independent demos; they are **not** published as a package
and neither file exports a module. Integrators who copy this code into their
own project MUST read the input/output contract below — the two variants
intentionally differ, and several behaviours are security-sensitive.

> This is a reference / demo implementation. It is **not** hardened for
> adversarial inputs by itself. The host application is responsible for
> authorization, output encoding, pagination and resource limits as described
> in the "Security notes for integrators" section.

## API

### `js-trie.js` (v1, case-sensitive)

```js
var trie = new Trie();
trie.addBatch(['foo', 'bar']);     // adds every string in the array
trie.add('baz');                   // adds a single string
trie.searchByPrefix('ba');         // => ['bar', 'baz']  (live internal array)
trie.searchByPrefix('zzz');        // => null            (miss sentinel)
```

Methods:

- `new Trie()` — construct a new trie.
- `trie.add(word)` — insert one string. `word` must be a non-empty `string`
  of length <= `Trie.MAX_WORD_LENGTH` (default 1024). Throws `TypeError` for
  non-strings and `RangeError` for empty or too-long strings. Returns
  `undefined`.
- `trie.addBatch(words)` — insert every element. `words` must be an `Array`
  of length <= `Trie.MAX_BATCH_SIZE` (default 10 000); each element must
  satisfy the `add` contract. Throws `TypeError` if not an array and
  `RangeError` if too large; element errors propagate from `add` and abort
  the batch, leaving the trie partially populated. Returns `undefined`.
- `trie.searchByPrefix(prefix)` — look up every stored word that begins with
  `prefix`. `prefix` must be a `string` (may be empty) of length <=
  `Trie.MAX_WORD_LENGTH`. Throws `TypeError` for non-strings and
  `RangeError` for too-long prefixes. Returns `null` on miss, otherwise an
  `Array<string>` of matching words.

**v1-specific caveats:**

- `searchByPrefix` returns the **live internal `words` array**. Mutating the
  returned array mutates the trie's storage. Callers that need to filter,
  slice, or hand the result to untrusted code MUST copy it first
  (`result.slice()` or `[...result]`).
- `searchByPrefix` returns `null` (not `[]`) when no node matches the prefix.
  Callers that chain `.length` / `.map` / `.filter` on the result MUST
  null-check first.
- Matching is **case-sensitive**: `searchByPrefix('ab')` will not match a
  stored `'Abc'`.
- An **empty prefix** (`''`) walks zero characters and returns the entire
  corpus. See "Security notes for integrators".

### `js-trie-v2.js` (v2, case-insensitive)

```js
let trie = Trie();                 // factory, NOT invoked with `new`
trie.add('Abc');
trie.addMany(['bbb', 'bar']);
trie.prefix('abc');                // => ['Abc']  (fresh copy)
trie.prefix('zzz');                // => []       (miss sentinel)
```

Methods:

- `Trie()` — factory. Returns a trie instance (plain object). Do not call
  with `new`.
- `trie.add(word)` — insert one string. Same type/length contract as v1;
  throws the same errors.
- `trie.addMany(words)` — insert every element. `words` must be iterable
  (typically an `Array`) of length <= `MAX_BATCH_SIZE` (default 10 000);
  each element must satisfy `add`. Throws `TypeError` if not iterable,
  `RangeError` if too large; **element errors abort the batch, leaving the
  trie partially populated**.
- `trie.prefix(prefix)` — look up every stored word that begins with
  `prefix` (case-insensitive). Same type/length contract on `prefix` as v1.
  Returns an `Array<string>` — empty on miss, otherwise a **fresh copy** of
  the matches.

**v2-specific caveats:**

- Matching is **case-insensitive**: both the stored word and the query are
  lowercased for comparison, but the trie **stores and returns the
  originally-cased string**. A lowercase query will therefore return
  original-case data — do not assume the returned casing matches the query.
- `prefix` returns a fresh `Array` built from the internal `Set`, so mutating
  it is safe. Iteration order follows `Set` insertion order.
- `prefix` returns `[]` (not `null`) on a miss. **This differs from v1.**
- An **empty prefix** (`''`) returns the entire corpus. See "Security notes
  for integrators".

### Behavioural differences at a glance

| Behaviour | v1 (`js-trie.js`) | v2 (`js-trie-v2.js`) |
| --- | --- | --- |
| Construction | `new Trie()` | `Trie()` (factory) |
| Case sensitivity | case-sensitive | case-insensitive matching, original case preserved |
| Miss return value | `null` | `[]` |
| Hit return aliasing | live internal array | fresh copy |
| Batch insert | `addBatch(array)` | `addMany(iterable)` |
| Internal storage | null-prototype object + Array | Map + Set |

## Security notes for integrators

These properties are inherent to how a prefix trie works. They are not fixed
by this library — the **host application** must handle them:

1. **Output is returned verbatim.** Both variants store and return the exact
   strings that were inserted, with no HTML escaping, URL encoding, control-
   character stripping, Unicode normalisation, or any other filtering. If
   results are rendered in a browser (an autocomplete UI is the obvious use
   case) the host MUST escape them at the sink — assign via `textContent`,
   not via unsanitised HTML sinks. Any injection payload stored into the
   trie round-trips unchanged, so output encoding is strictly the caller's
   responsibility.

2. **No delete or remove API exists.** Memory used by inserted strings
   cannot be reclaimed short of discarding the whole `Trie`. Every character
   of every inserted word allocates a fresh node, and the full word is also
   stored at every depth, so a single word of length n uses roughly O(n^2)
   bytes. The library enforces a per-word length cap (`MAX_WORD_LENGTH`,
   default 1024) and a per-batch size cap (`MAX_BATCH_SIZE`, default
   10 000) as a defence-in-depth guard, but the host MUST additionally
   bound the **total corpus size** it feeds in. Treat the trie as unbounded
   growth over its lifetime.

3. **Enumeration oracle.** An empty prefix returns the full corpus and a
   one-character prefix returns the whole subtree. There is no result cap.
   If the stored strings are sensitive, the host MUST enforce its own
   authorization checks on every lookup and MUST paginate or cap the result
   before returning it to a client. Do not expose `searchByPrefix` or
   `prefix` directly as a network endpoint over untrusted data.

4. **Partial-batch state on error.** Both `addBatch` and `addMany` iterate
   serially and do not roll back on a mid-batch error. If any element is
   rejected (bad type, length, etc.) the elements already processed remain
   in the trie. Callers that need atomicity MUST validate the whole batch
   up front.

5. **Prototype safety.** v1 uses a null-prototype object for the per-node
   children map, so inherited prototype keys cannot collide with child
   characters. v2 uses `Map`, which is also safe. Do not change these to a
   plain object literal.

## Tuning the limits

Both files expose two knobs that the host may override before adding data:

```js
// js-trie.js
Trie.MAX_WORD_LENGTH = 256;        // reject add/searchByPrefix beyond this
Trie.MAX_BATCH_SIZE  = 1000;       // reject addBatch beyond this

// js-trie-v2.js
trie.MAX_WORD_LENGTH = 256;
trie.MAX_BATCH_SIZE  = 1000;
```

Lower them whenever the corpus is attacker-influenced.
