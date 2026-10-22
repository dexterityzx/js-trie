//js-trie

var MAX_WORD_LEN = 1024;
var MAX_BATCH_LEN = 100000;

var TrieNode = function(){
    this.nodes = Object.create(null); // remove object prototype property
    this.words = [];
}

var Trie = function(){
    this.root = new TrieNode();
}

Trie.prototype.addBatch = function(words){
    if(!Array.isArray(words)){
        throw new TypeError('addBatch expects an Array');
    }
    if(words.length > MAX_BATCH_LEN){
        throw new RangeError('addBatch: batch exceeds MAX_BATCH_LEN (' + MAX_BATCH_LEN + ')');
    }
    var len = Math.min(words.length, MAX_BATCH_LEN);
    for(let i=0; i<len; i++){
        this.add(words[i]);
    }
}

Trie.prototype.add = function(word){
    if(typeof word !== 'string'){
        throw new TypeError('add expects a string');
    }
    if(word.length > MAX_WORD_LEN){
        throw new RangeError('add: word length exceeds MAX_WORD_LEN (' + MAX_WORD_LEN + ')');
    }
    var root = this.root;
    var bound = Math.min(word.length, MAX_WORD_LEN);
    for(let i=0;i<bound;i++){
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
