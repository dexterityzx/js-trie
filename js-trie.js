//js-trie

var TrieNode = function(){
    this.nodes = Object.create(null); // remove object prototype property
    this.words = [];
}

var Trie = function(){
    this.root = new TrieNode();
}

Trie.prototype.addBatch = function(words){
    if(words.constructor !== Array){
        return;
    }
    var root = this.root;
    for(let i=0; i<words.length; i++){
        this.add(words[i]);
    }
}

Trie.prototype.add = function(word){
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Trie;
}
