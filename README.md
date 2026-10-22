# js-trie

A tiny in-memory trie for prefix lookup of string words.

## API

Trie()                 create a new trie
trie.add(word)         insert a single word
trie.addBatch(words)   insert an array of words
trie.searchByPrefix(p) return an array of matching words, or null
trie.remove(word)      remove a word and prune empty nodes
trie.clear()           drop every stored word

## Resource limits

add and addBatch enforce defensive caps so a single bad call cannot
allocate unbounded heap. Embedding applications remain responsible for
request-level size limits and rate limiting.

Built-in caps:

MAX_WORD_LEN     1024 characters per word
MAX_BATCH_LEN    10000 elements per addBatch call
MAX_BATCH_BYTES  1 MiB total characters per addBatch call
MAX_TRIE_NODES   ~1048576 nodes per Trie instance

Violations throw TypeError or RangeError. addBatch validates the whole
batch up-front and does not write partial state if any element is
rejected. add is a no-op for the empty string and deduplicates repeated
inserts of the same word.

Recommended host controls: validate request body size before calling
add or addBatch; hold the Trie behind a bounded cache or call remove or
clear so growth is not monotonic across the process lifetime; run with
a process memory limit.
