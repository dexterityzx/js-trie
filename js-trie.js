//js-trie

var TrieNode = function(){
    this.nodes = Object.create(null); // remove object prototype property
    this.words = [];
}

var Trie = function(){
    this.root = new TrieNode();
}

Trie.prototype.addBatch = function(words){
    if(!Array.isArray(words)){
        return;
    }
    for(let i=0; i<words.length; i++){
        if(typeof words[i] !== 'string'){
            throw new TypeError('word must be a string');
        }
        this.add(words[i]);
    }
}

Trie.prototype.add = function(word){
    if(typeof word !== 'string'){
        throw new TypeError('word must be a string');
    }
    var root = this.root;
    for(let i=0;i<word.length;i++){
        var ch = word.charAt(i);
        if(root.nodes[ch] === undefined){
            root.nodes[ch] = new TrieNode();
        }
        root.nodes[ch].words.push(word);
        root = root.nodes[ch];
    }
}

Trie.prototype.searchByPrefix = function(prefix){
    if(typeof prefix !== 'string'){
        throw new TypeError('prefix must be a string');
    }
    var root = this.root;
    for(let i=0; i<prefix.length; i++){
        var ch = prefix.charAt(i);
        if(root.nodes[ch] === undefined){
            return null;
        }
        root = root.nodes[ch];
    }
    return root.words;
}

//testing
var trie = new Trie();

trie.addBatch(['aaad','aac','ab']);
console.log(trie.searchByPrefix('a'));
console.log(trie.searchByPrefix('aa'));
console.log(trie.searchByPrefix('aaa'));
