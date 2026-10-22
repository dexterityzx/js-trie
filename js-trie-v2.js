// js-trie-v2
//
// A case-INSENSITIVE prefix trie (factory-style). See README.md for the full
// input/output contract, security notes, and the behavioural differences
// from js-trie.js (notably: this file returns `[]` -- not `null` -- on a
// prefix miss, returns a fresh copy of the matching words rather than the
// live internal collection, and lowercases both corpus and query for
// matching while storing/returning the originally-cased string).

/**
 * Create a new case-insensitive prefix trie.
 *
 * The returned object exposes `add`, `addMany`, and `prefix`. Two knobs --
 * `MAX_WORD_LENGTH` and `MAX_BATCH_SIZE` -- are attached to the instance and
 * may be adjusted before data is loaded.
 *
 * @returns {{
 *   MAX_WORD_LENGTH: number,
 *   MAX_BATCH_SIZE: number,
 *   add: (word: string) => void,
 *   addMany: (words: Iterable<string>) => void,
 *   prefix: (prefix: string) => string[]
 * }}
 */
const Trie = () => {

    const TrieNode = function () {
        this.nodes = new Map();
        this.words = new Set();
    };

    const _root = new TrieNode();

    const _pub = {};

    // Defence-in-depth input caps. The host application is still responsible
    // for bounding the total corpus size -- these only cap individual calls.
    // See README.md "Security notes for integrators".
    _pub.MAX_WORD_LENGTH = 1024;
    _pub.MAX_BATCH_SIZE  = 10000;

    /**
     * Insert a single string. The ORIGINAL-case string is stored and will be
     * returned by `prefix`; matching is done on the lowercased form.
     *
     * @param {string} word Non-empty string, length <= `MAX_WORD_LENGTH`.
     * @throws {TypeError}  if `word` is not a string.
     * @throws {RangeError} if `word` is empty or exceeds `MAX_WORD_LENGTH`.
     * @returns {void}
     */
    _pub.add = function (word) {
        if (typeof word !== 'string') {
            throw new TypeError('Trie.add: word must be a string');
        }
        if (word.length === 0) {
            throw new RangeError('Trie.add: word must not be empty');
        }
        if (word.length > _pub.MAX_WORD_LENGTH) {
            throw new RangeError('Trie.add: word length ' + word.length +
                ' exceeds MAX_WORD_LENGTH (' + _pub.MAX_WORD_LENGTH + ')');
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

    /**
     * Insert every string in `words`. Iterates serially; if any element
     * fails validation, the error propagates and the batch is aborted
     * mid-way, leaving the trie partially populated.
     *
     * @param {Iterable<string>} words Iterable (typically an Array) whose
     *     length <= `MAX_BATCH_SIZE`; every element must satisfy `add`.
     * @throws {TypeError}  if `words` is not iterable.
     * @throws {RangeError} if the batch size exceeds `MAX_BATCH_SIZE`.
     * @throws {TypeError|RangeError} propagated from `add` for any bad element.
     * @returns {void}
     */
    _pub.addMany = function (words) {
        if (words === null || words === undefined ||
            typeof words[Symbol.iterator] !== 'function') {
            throw new TypeError('Trie.addMany: words must be iterable');
        }
        // When we can cheaply check length (Array, TypedArray, ...) enforce
        // the batch cap up front. For arbitrary iterables we count during
        // iteration.
        if (typeof words.length === 'number' &&
            words.length > _pub.MAX_BATCH_SIZE) {
            throw new RangeError('Trie.addMany: batch size ' + words.length +
                ' exceeds MAX_BATCH_SIZE (' + _pub.MAX_BATCH_SIZE + ')');
        }
        let count = 0;
        for (const word of words) {
            if (++count > _pub.MAX_BATCH_SIZE) {
                throw new RangeError('Trie.addMany: batch size exceeds ' +
                    'MAX_BATCH_SIZE (' + _pub.MAX_BATCH_SIZE + ')');
            }
            _pub.add(word);
        }
    };

    /**
     * Return every stored word that begins with `prefix` (case-insensitive).
     *
     * The result is a fresh `Array` built from the internal `Set`, so
     * mutating it is safe. An empty prefix returns the entire corpus; there
     * is no result cap, so the host must paginate / authorize. The returned
     * strings are the ORIGINAL-case strings as inserted, NOT lowercased, and
     * are returned verbatim with no HTML/URL encoding.
     *
     * @param {string} prefix String (may be empty), length <= `MAX_WORD_LENGTH`.
     * @throws {TypeError}  if `prefix` is not a string.
     * @throws {RangeError} if `prefix` exceeds `MAX_WORD_LENGTH`.
     * @returns {string[]} Possibly-empty array of matching words. NOTE: v1
     *     returns `null` on a miss instead of `[]` -- do not share caller
     *     code between the two variants.
     */
    _pub.prefix = function (prefix) {
        if (typeof prefix !== 'string') {
            throw new TypeError('Trie.prefix: prefix must be a string');
        }
        if (prefix.length > _pub.MAX_WORD_LENGTH) {
            throw new RangeError('Trie.prefix: prefix length ' + prefix.length +
                ' exceeds MAX_WORD_LENGTH (' + _pub.MAX_WORD_LENGTH + ')');
        }
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
