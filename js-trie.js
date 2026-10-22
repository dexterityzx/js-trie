//js-trie
//
// A case-sensitive prefix trie. See README.md for the full input/output
// contract, security notes, and the behavioural differences from
// js-trie-v2.js (notably: this file returns `null` on a prefix miss and
// returns the LIVE internal `words` array on a hit -- mutating the result
// mutates the trie's storage).

/**
 * Internal node. One `TrieNode` is allocated per character of every inserted
 * word, so word length and corpus size dominate memory usage. The host MUST
 * bound both; see `Trie.MAX_WORD_LENGTH` / `Trie.MAX_BATCH_SIZE`.
 *
 * @constructor
 */
var TrieNode = function(){
    this.nodes = Object.create(null); // remove object prototype property
    this.words = [];
}

/**
 * Case-sensitive prefix trie.
 *
 * @constructor
 */
var Trie = function(){
    this.root = new TrieNode();
}

// Defence-in-depth input caps. The host application is still responsible for
// bounding the total corpus size -- these only cap individual calls. See
// README.md "Security notes for integrators".
Trie.MAX_WORD_LENGTH = 1024;
Trie.MAX_BATCH_SIZE  = 10000;

/**
 * Insert every string in `words` into the trie.
 *
 * Iterates serially and calls `add` on every element. If any element fails
 * validation, the error propagates and the batch is aborted mid-way, leaving
 * the trie partially populated. Callers that need atomicity must validate
 * the whole array first.
 *
 * @param {string[]} words Array of non-empty strings, each of length
 *     <= `Trie.MAX_WORD_LENGTH`. Array length <= `Trie.MAX_BATCH_SIZE`.
 * @throws {TypeError}  if `words` is not an Array.
 * @throws {RangeError} if `words.length` exceeds `Trie.MAX_BATCH_SIZE`.
 * @throws {TypeError|RangeError} propagated from `add` for any bad element.
 * @returns {void}
 */
Trie.prototype.addBatch = function(words){
    if(!Array.isArray(words)){
        throw new TypeError('Trie.addBatch: words must be an Array');
    }
    if(words.length > Trie.MAX_BATCH_SIZE){
        throw new RangeError('Trie.addBatch: batch size ' + words.length +
            ' exceeds Trie.MAX_BATCH_SIZE (' + Trie.MAX_BATCH_SIZE + ')');
    }
    for(let i=0; i<words.length; i++){
        this.add(words[i]);
    }
}

/**
 * Insert a single string.
 *
 * Allocates one `TrieNode` per character of `word` (unless the path already
 * exists) and pushes the full `word` onto every node on the path. No
 * `delete`/`remove` API exists; memory is reclaimed only by discarding the
 * whole `Trie`.
 *
 * @param {string} word Non-empty string, length <= `Trie.MAX_WORD_LENGTH`.
 * @throws {TypeError}  if `word` is not a string.
 * @throws {RangeError} if `word` is empty or longer than `Trie.MAX_WORD_LENGTH`.
 * @returns {void}
 */
Trie.prototype.add = function(word){
    if(typeof word !== 'string'){
        throw new TypeError('Trie.add: word must be a string');
    }
    if(word.length === 0){
        throw new RangeError('Trie.add: word must not be empty');
    }
    if(word.length > Trie.MAX_WORD_LENGTH){
        throw new RangeError('Trie.add: word length ' + word.length +
            ' exceeds Trie.MAX_WORD_LENGTH (' + Trie.MAX_WORD_LENGTH + ')');
    }
    var root = this.root;
    for(let i=0;i<word.length;i++){
        if(root.nodes[word[i]] === undefined){
            root.nodes[word[i]] = new TrieNode();
        }
        root.nodes[word[i]].words.push(word);
        root = root.nodes[word[i]];
    }
}

/**
 * Return every stored word that begins with `prefix`.
 *
 * Matching is case-SENSITIVE. The returned value is the LIVE internal array
 * at the node for `prefix` -- mutating it mutates the trie. Copy the result
 * (`.slice()` / `[...result]`) before handing it to untrusted code. An empty
 * prefix returns the entire top-level `words` array, i.e. every string ever
 * inserted; there is no result cap, so the host must paginate / authorize.
 *
 * @param {string} prefix String (may be empty), length <= `Trie.MAX_WORD_LENGTH`.
 * @throws {TypeError}  if `prefix` is not a string.
 * @throws {RangeError} if `prefix` is longer than `Trie.MAX_WORD_LENGTH`.
 * @returns {string[] | null} The live `words` array on a hit, or `null` on a
 *     prefix miss. NOTE: v2 returns `[]` instead of `null` -- do not share
 *     caller code between the two variants without null-checking here.
 */
Trie.prototype.searchByPrefix = function(prefix){
    if(typeof prefix !== 'string'){
        throw new TypeError('Trie.searchByPrefix: prefix must be a string');
    }
    if(prefix.length > Trie.MAX_WORD_LENGTH){
        throw new RangeError('Trie.searchByPrefix: prefix length ' + prefix.length +
            ' exceeds Trie.MAX_WORD_LENGTH (' + Trie.MAX_WORD_LENGTH + ')');
    }
    var root = this.root;
    for(let i=0; i<prefix.length; i++){
        if(root.nodes[prefix[i]] === undefined){
            return null;
        }
        root = root.nodes[prefix[i]];
    }
    return root.words;
}

//testing
var trie = new Trie();

trie.addBatch(['aaad','aac','ab']);
console.log(trie.searchByPrefix('a'));
console.log(trie.searchByPrefix('aa'));
console.log(trie.searchByPrefix('aaa'));
