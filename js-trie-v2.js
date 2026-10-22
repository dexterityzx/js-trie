// Trie v2
//
// Memory model and limits
// -----------------------
// A trie allocates one node per UTF-16 code unit along every inserted word's
// path. Each node may hold a children map and a terminal-word flag, which
// are created lazily to keep empty branches cheap. To prevent an untrusted
// caller from exhausting the host heap with a single oversized string or an
// unbounded corpus, the following limits are enforced:
//
//   * MAX_WORD_LENGTH  - longest word accepted by add()/addMany().
//   * MAX_WORDS        - maximum number of distinct indexed words.
//   * MAX_NODES        - maximum number of allocated trie nodes.
//
// Inserts that would exceed any limit throw a RangeError and leave the trie
// unchanged. Callers that index user-generated content should still apply
// their own request-size and rate limits; these library-side caps are a
// defence-in-depth backstop, not a replacement for input validation.
//
// The structure also exposes remove(word), clear() and size so hosts can
// evict entries and monitor growth.

const DEFAULT_MAX_WORD_LENGTH = 1024;
const DEFAULT_MAX_WORDS = 100000;
const DEFAULT_MAX_NODES = 1000000;

const Trie = (options) => {

    const opts = options || {};
    const MAX_WORD_LENGTH = (typeof opts.maxWordLength === 'number' && opts.maxWordLength > 0)
        ? opts.maxWordLength : DEFAULT_MAX_WORD_LENGTH;
    const MAX_WORDS = (typeof opts.maxWords === 'number' && opts.maxWords > 0)
        ? opts.maxWords : DEFAULT_MAX_WORDS;
    const MAX_NODES = (typeof opts.maxNodes === 'number' && opts.maxNodes > 0)
        ? opts.maxNodes : DEFAULT_MAX_NODES;

    const TrieNode = function () {
        // Child map is created lazily to avoid paying an empty-collection
        // allocation per node on long single-branch paths. The terminal flag
        // marks the end of an indexed word; the original-casing string is
        // held only on terminal nodes, which removes the O(sum of |w|)
        // duplicate references from the previous implementation.
        this.nodes = null;
        this.terminal = false;
        this.word = null;
    };

    let _root = new TrieNode();
    let _nodeCount = 1;
    let _wordCount = 0;

    const _pub = {};

    // Returns true if `chars` already describes an indexed word.
    const _hasWord = function (chars) {
        let node = _root;
        for (let i = 0; i < chars.length; i++) {
            if (!node.nodes) return false;
            const next = node.nodes.get(chars[i]);
            if (!next) return false;
            node = next;
        }
        return node.terminal === true;
    };

    _pub.add = function (word) {
        if (typeof word !== 'string') {
            throw new TypeError('Trie.add: word must be a string');
        }
        if (word.length > MAX_WORD_LENGTH) {
            throw new RangeError(
                'Trie.add: word length ' + word.length +
                ' exceeds MAX_WORD_LENGTH (' + MAX_WORD_LENGTH + ')'
            );
        }

        const chars = word.toLowerCase().split('');

        // Walk the existing path first to determine how many new nodes an
        // insert would require, so the limit check is accurate before any
        // allocation happens.
        let probe = _root;
        let newNodes = 0;
        for (let i = 0; i < chars.length; i++) {
            const ch = chars[i];
            if (probe.nodes && probe.nodes.has(ch)) {
                probe = probe.nodes.get(ch);
            } else {
                newNodes = chars.length - i;
                break;
            }
        }

        const alreadyIndexed = _hasWord(chars);
        if (!alreadyIndexed && _wordCount + 1 > MAX_WORDS) {
            throw new RangeError(
                'Trie.add: would exceed MAX_WORDS (' + MAX_WORDS + ')'
            );
        }
        if (_nodeCount + newNodes > MAX_NODES) {
            throw new RangeError(
                'Trie.add: would exceed MAX_NODES (' + MAX_NODES + ')'
            );
        }

        let node = _root;
        for (let i = 0; i < chars.length; i++) {
            const ch = chars[i];
            if (!node.nodes) {
                node.nodes = new Map();
            }
            let next = node.nodes.get(ch);
            if (!next) {
                next = new TrieNode();
                node.nodes.set(ch, next);
                _nodeCount++;
            }
            node = next;
        }

        if (!node.terminal) {
            node.terminal = true;
            node.word = word; // preserve first-seen casing
            _wordCount++;
        }
    };

    _pub.addMany = function (words) {
        if (!Array.isArray(words)) {
            throw new TypeError('Trie.addMany: argument must be an array');
        }
        if (_wordCount + words.length > MAX_WORDS) {
            // Fast rejection; a precise count would require pre-dedup, which
            // defeats the purpose of a cheap cap. Callers that need partial
            // success should chunk their input.
            throw new RangeError(
                'Trie.addMany: batch of ' + words.length +
                ' would exceed MAX_WORDS (' + MAX_WORDS + ')'
            );
        }
        words.forEach(word => {
            _pub.add(word);
        });
    };

    _pub.remove = function (word) {
        if (typeof word !== 'string') return false;
        if (word.length > MAX_WORD_LENGTH) return false;

        const chars = word.toLowerCase().split('');
        // Record the path so we can prune childless, non-terminal nodes.
        const path = [];
        let node = _root;
        for (let i = 0; i < chars.length; i++) {
            if (!node.nodes) return false;
            const next = node.nodes.get(chars[i]);
            if (!next) return false;
            path.push({ parent: node, ch: chars[i], node: next });
            node = next;
        }
        if (!node.terminal) return false;

        node.terminal = false;
        node.word = null;
        _wordCount--;

        // Prune empty tail nodes.
        for (let i = path.length - 1; i >= 0; i--) {
            const step = path[i];
            const n = step.node;
            const hasChildren = n.nodes && n.nodes.size > 0;
            if (!n.terminal && !hasChildren) {
                step.parent.nodes.delete(step.ch);
                _nodeCount--;
                if (step.parent.nodes.size === 0) {
                    step.parent.nodes = null;
                }
            } else {
                break;
            }
        }
        return true;
    };

    _pub.clear = function () {
        _root = new TrieNode();
        _nodeCount = 1;
        _wordCount = 0;
    };

    Object.defineProperty(_pub, 'size', {
        enumerable: true,
        get: function () { return _wordCount; }
    });

    Object.defineProperty(_pub, 'nodeCount', {
        enumerable: true,
        get: function () { return _nodeCount; }
    });

    // Collect every terminal word in the subtree rooted at `node`.
    const _collect = function (node, out) {
        if (node.terminal && node.word !== null) {
            out.push(node.word);
        }
        if (node.nodes) {
            // Map preserves insertion order; iterate deterministically.
            node.nodes.forEach(child => {
                _collect(child, out);
            });
        }
    };

    _pub.prefix = function (prefix) {
        if (typeof prefix !== 'string') return [];
        prefix = prefix.toLowerCase();

        let node = _root;
        for (let i = 0; i < prefix.length; i++) {
            if (!node.nodes) return [];
            const next = node.nodes.get(prefix[i]);
            if (!next) return [];
            node = next;
        }

        const out = [];
        _collect(node, out);
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