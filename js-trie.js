//js-trie

var TrieNode = function(){
    this.nodes = Object.create(null); // remove object prototype property
    this.words = [];
}

var Trie = function(){
    this.root = new TrieNode();
}

Trie.prototype.addBatch = function(words){
    // Realm-safe iterable handling: accept any iterable (including arrays
    // from other realms), reject non-iterables with a TypeError so callers
    // can distinguish an empty load from a bad input.
    if(words === null || words === undefined || typeof words[Symbol.iterator] !== 'function'){
        throw new TypeError('addBatch: expected an iterable of strings');
    }
    // Materialize once so we can validate every element before mutating the
    // trie. This makes the batch atomic: either every word is indexed or
    // none is, so a single bad element cannot leave the index partially
    // populated.
    var list = Array.from(words);
    for(let i=0; i<list.length; i++){
        if(typeof list[i] !== 'string'){
            throw new TypeError('addBatch: element at index ' + i + ' is not a string');
        }
    }
    for(let i=0; i<list.length; i++){
        this.add(list[i]);
    }
}

Trie.prototype.add = function(word){
    if(typeof word !== 'string'){
        throw new TypeError('add: expected a string');
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
