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

    // Conservative default cap on the number of matches returned by prefix().
    // Each TrieNode's `words` Set holds *every* descendant word (see _pub.add
    // above), so the shallower the matched node, the larger the Set — a
    // 1-character query matches every indexed word beginning with that
    // character. Spreading the whole Set makes the work O(corpus) for an
    // attacker-supplied single byte, which is a resource-allocation hazard
    // in a shared single-threaded host. Callers that genuinely need every
    // match can pass an explicit `limit` (e.g. Infinity) and own the cost.
    const DEFAULT_PREFIX_LIMIT = 1000;

    _pub.prefix = function (prefix, limit) {
        prefix = prefix.toLowerCase();

        // Normalise the cap: non-numeric / missing values fall back to the
        // conservative default; negative or zero values short-circuit to [].
        if (limit === undefined || limit === null) {
            limit = DEFAULT_PREFIX_LIMIT;
        } else if (typeof limit !== 'number' || Number.isNaN(limit)) {
            limit = DEFAULT_PREFIX_LIMIT;
        }
        if (limit <= 0) {
            return [];
        }

        let root = _root;
        for (let i = 0; i < prefix.length; i++) {
            if (!root.nodes.has(prefix[i])) {
                return [];
            }
            root = root.nodes.get(prefix[i]);
        }

        // Iterate the Set with an explicit counter instead of spreading it,
        // so the work and allocation are bounded by `limit` rather than by
        // the size of the matched subtree.
        const results = [];
        for (const word of root.words) {
            if (results.length >= limit) {
                break;
            }
            results.push(word);
        }
        return results;
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