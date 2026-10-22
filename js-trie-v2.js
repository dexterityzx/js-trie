const Trie = () => {

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

    // prefix(prefix, limit = 50, filter)
    //
    // Returns up to `limit` words stored under the node reached by `prefix`.
    // A fresh array is always returned (never a view into internal state).
    // An optional `filter(word)` predicate lets the host drop entries the
    // current requester may not see; this structure performs NO access-
    // control filtering of its own (see README.md).
    const DEFAULT_PREFIX_LIMIT = 50;

    _pub.prefix = function (prefix, limit, filter) {
        prefix = prefix.toLowerCase();
        const cap = (typeof limit === 'number' && limit >= 0)
            ? Math.floor(limit)
            : DEFAULT_PREFIX_LIMIT;
        const predicate = (typeof filter === 'function') ? filter : null;

        let root = _root;
        for (let i = 0; i < prefix.length; i++) {
            if (!root.nodes.has(prefix[i])) {
                return [];
            }
            root = root.nodes.get(prefix[i]);
        }

        const out = [];
        for (const word of root.words) {
            if (out.length >= cap) break;
            if (predicate && !predicate(word)) continue;
            out.push(word);
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