//js-trie

// Explicit, documented limits to prevent unbounded allocation from untrusted input.
// A caller-settable `length` on a non-string value must never drive the insert loop.
var TRIE_MAX_WORD_LENGTH = 256;      // maximum characters per word
var TRIE_MAX_BATCH_SIZE = 100000;    // maximum elements per addBatch call
var TRIE_MAX_TOTAL_NODES = 1000000;  // maximum TrieNodes allocated across the trie

var TrieNode = function(){
    this.nodes = Object.create(null); // remove object prototype property
    this.words = [];
}

var Trie = function(){
    this.root = new TrieNode();
    this.nodeCount = 1; // the root node
}

Trie.prototype.addBatch = function(words){
    if(!Array.isArray(words)){
        return;
    }
    if(words.length > TRIE_MAX_BATCH_SIZE){
        return;
    }
    for(let i=0; i<words.length; i++){
        // Validate every element: only real strings drive the per-character loop.
        if(typeof words[i] !== 'string'){
            continue;
        }
        this.add(words[i]);
    }
}

Trie.prototype.add = function(word){
    // Require a real string so the loop bound comes from a genuine string length,
    // not an attacker-settable `length` property on an arbitrary object.
    if(typeof word !== 'string'){
        return;
    }
    if(word.length > TRIE_MAX_WORD_LENGTH){
        return;
    }
    var root = this.root;
    for(let i=0;i<word.length;i++){
        if(root.nodes[word[i]] === undefined){
            if(this.nodeCount >= TRIE_MAX_TOTAL_NODES){
                return;
            }
            root.nodes[word[i]] = new TrieNode();
            this.nodeCount++;
        }
        root.nodes[word[i]].words.push(word);
        root = root.nodes[word[i]];
    }
}

Trie.prototype.searchByPrefix = function(prefix){
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
