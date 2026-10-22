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
        if (!Array.isArray(words)) {
            throw new TypeError('addMany(words): expected an array');
        }
        // Pre-pass: validate every element before mutating any state so a bad
        // element cannot leave the trie half-built.
        for (let i = 0; i < words.length; i++) {
            if (typeof words[i] !== 'string') {
                throw new TypeError(
                    'addMany(words): expected string at index ' + i +
                    ', got ' + (words[i] === null ? 'null' : typeof words[i])
                );
            }
        }
        for (let i = 0; i < words.length; i++) {
            _pub.add(words[i]);
        }
    };

    _pub.remove = function (word) {
        if (typeof word !== 'string') {
            throw new TypeError('remove(word): expected a string');
        }
        const chars = word.toLowerCase().split('');

        // Walk the trie, deleting the exact `word` from each node's words set
        // along the path. Prune empty branches on the way back up so a diverged
        // trie can be repaired without recreating the process state.
        const path = [];
        let root = _root;
        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            if (!root.nodes.has(char)) {
                return false;
            }
            path.push({ parent: root, char: char });
            root = root.nodes.get(char);
        }

        if (!root.words.has(word)) {
            return false;
        }

        for (let i = 0; i < path.length; i++) {
            path[i].parent.nodes.get(path[i].char).words.delete(word);
        }

        // Prune now-empty subtrees from the leaf upward.
        for (let i = path.length - 1; i >= 0; i--) {
            const node = path[i].parent.nodes.get(path[i].char);
            if (node.words.size === 0 && node.nodes.size === 0) {
                path[i].parent.nodes.delete(path[i].char);
            } else {
                break;
            }
        }

        return true;
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