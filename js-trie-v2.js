const Trie = () => {

    const TrieNode = function () {
        this.nodes = new Map();
        this.words = new Set();
    };

    const _root = new TrieNode();

    const _pub = {};

    _pub.add = function (word) {
        if (typeof word !== 'string') {
            throw new TypeError('add: expected a string');
        }
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
        // Realm-safe iterable handling: accept any iterable, reject
        // non-iterables with a TypeError so callers can detect bad input
        // instead of silently loading nothing.
        if (words === null || words === undefined || typeof words[Symbol.iterator] !== 'function') {
            throw new TypeError('addMany: expected an iterable of strings');
        }
        // Materialize and validate every element before inserting so a
        // single non-string entry cannot abort the batch mid-way and leave
        // the trie partially populated.
        const list = Array.from(words);
        for (let i = 0; i < list.length; i++) {
            if (typeof list[i] !== 'string') {
                throw new TypeError('addMany: element at index ' + i + ' is not a string');
            }
        }
        list.forEach(word => {
            _pub.add(word);
        });
    };

    _pub.prefix = function (prefix) {
        prefix = prefix.toLowerCase();

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
