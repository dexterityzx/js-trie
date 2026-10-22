const Trie = () => {

    const DEFAULT_LIMIT = 50;

    const TrieNode = function () {
        this.nodes = new Map();
        this.words = new Set();
    };

    const _root = new TrieNode();

    const _pub = {};

    _pub.add = function (word) {
        const chars = word.toLowerCase().split('');

        let root = _root;
        chars.forEach(char => {
            if (!root.nodes.has(char)) {
                root.nodes.set(char, new TrieNode());
            }
            root.nodes.get(char).words.add(word);
            root = root.nodes.get(char);
        });
    };

    _pub.addMany = function (words) {
        words.forEach(word => {
            _pub.add(word);
        });
    };

    // Remove a previously added word from the index. Returns true if
    // the word was present on its full path and removed from every
    // node, false otherwise. Case-insensitive path, matching add().
    _pub.remove = function (word) {
        if (typeof word !== 'string' || word.length === 0) {
            return false;
        }
        const chars = word.toLowerCase().split('');
        let root = _root;
        for (let i = 0; i < chars.length; i++) {
            if (!root.nodes.has(chars[i])) {
                return false;
            }
            root = root.nodes.get(chars[i]);
        }
        let removed = false;
        root = _root;
        for (let i = 0; i < chars.length; i++) {
            const node = root.nodes.get(chars[i]);
            if (!node) {
                break;
            }
            if (node.words.delete(word)) {
                removed = true;
            }
            root = node;
        }
        return removed;
    };

    // prefix(prefix, limit, filter):
    //   prefix - string prefix (required). Lower-cased to match add().
    //   limit  - optional maximum number of results. When omitted a
    //            safe default is applied so a single-character probe
    //            cannot sweep the whole corpus. Pass Infinity to opt
    //            out of the bound explicitly.
    //   filter - optional predicate function evaluated against each
    //            candidate word; callers use this to scope results
    //            to the caller's own entries before they leave the
    //            library.
    // Returns an Array of matching words, same shape as before,
    // truncated to at most 'limit' entries. When more results were
    // available the returned array carries a non-enumerable 'next'
    // property containing the next word, usable as a continuation
    // marker for pagination.
    _pub.prefix = function (prefix, limit, filter) {
        if (typeof prefix !== 'string') {
            return [];
        }
        prefix = prefix.toLowerCase();

        if (limit === undefined || limit === null) {
            limit = DEFAULT_LIMIT;
        }
        if (typeof limit !== 'number' || Number.isNaN(limit) || limit < 0) {
            limit = DEFAULT_LIMIT;
        }

        let root = _root;
        for (let i = 0; i < prefix.length; i++) {
            if (!root.nodes.has(prefix[i])) {
                return [];
            }
            root = root.nodes.get(prefix[i]);
        }

        const out = [];
        let next = null;
        for (const w of root.words) {
            if (typeof filter === 'function' && !filter(w)) {
                continue;
            }
            if (out.length >= limit) {
                next = w;
                break;
            }
            out.push(w);
        }
        if (next !== null) {
            Object.defineProperty(out, 'next', {
                value: next,
                enumerable: false,
                writable: false,
                configurable: false
            });
        }
        return out;
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