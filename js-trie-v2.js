// Matcher normalization contract:
//
//   `add(word)` and `prefix(query)` apply the SAME normalization pipeline to
//   both the key path and the value that callers consume. The default
//   pipeline is `s.normalize('NFC').toLowerCase()`, producing case-insensitive
//   prefix search whose returned strings are byte-equal to what the
//   normalized query would produce. This lets callers re-verify equality by
//   comparing `normalizer(candidate) === storedValue` and removes the
//   asymmetry where `toLowerCase()` was applied to the key but the
//   original-case `word` was retained as the stored value.
//
//   Pass `{ caseSensitive: true }` to get exact matching (equivalent to
//   js-trie.js v1 semantics apart from NFC canonicalization), or supply your
//   own `{ normalizer: fn }`. The `normalizer` must be idempotent.
//
//   Caveat: `String.prototype.toLowerCase()` is neither injective nor
//   length-preserving in Unicode -- U+212A (KELVIN SIGN) folds to ASCII 'k'
//   and U+0130 (LATIN CAPITAL LETTER I WITH DOT ABOVE) folds to
//   'i' + U+0307. This structure must therefore not be the sole authority
//   for a security decision (allowlist / denylist / identity / uniqueness).
//   Hosts using it as part of such a decision must apply their own
//   canonicalization and compare the normalized candidate to the normalized
//   stored value, rather than treating a non-empty `prefix()` result as
//   equality.
const Trie = (options) => {

    const opts = options || {};
    const _normalizer = typeof opts.normalizer === 'function'
        ? opts.normalizer
        : (opts.caseSensitive
            ? (s) => String(s).normalize('NFC')
            : (s) => String(s).normalize('NFC').toLowerCase());

    const TrieNode = function () {
        this.nodes = new Map();
        this.words = new Set();
    };

    const _root = new TrieNode();

    const _pub = {};

    _pub.add = function (word) {
        const normalized = _normalizer(word);
        const chars = normalized.split('');

        let root = _root;
        chars.forEach(char => {
            if (!root.nodes.has(char)) {
                root.nodes.set(char, new TrieNode());
            }
            root.nodes.get(char).words.add(normalized);
            root = root.nodes.get(char);
        });
    };

    _pub.addMany = function (words) {
        words.forEach(word => {
            _pub.add(word);
        });
    };

    _pub.prefix = function (prefix) {
        prefix = _normalizer(prefix);

        let root = _root;
        for (let i = 0; i < prefix.length; i++) {
            if (!root.nodes.has(prefix[i])) {
                return [];
            }
            root = root.nodes.get(prefix[i]);
        }

        return [...root.words];
    };

    return _pub;
};

let trie = Trie();
trie.add('aaaa');
trie.add('aab');
trie.add('ab');
trie.add('abc');
trie.add('Abc');
trie.add('bbb');
console.log(trie.prefix('abC'));