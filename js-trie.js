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

// searchByPrefix(prefix, limit = 50, filter)
//
// Returns up to `limit` words stored under the node reached by `prefix`.
// A fresh array is always returned so callers cannot mutate internal state
// through the result. An optional `filter(word)` predicate lets the host
// drop entries the current requester may not see (this structure performs
// NO access-control filtering of its own - see README.md).
//
// Returns null when the prefix is not present in the trie (unchanged).
Trie.prototype.DEFAULT_SEARCH_LIMIT = 50;

Trie.prototype.searchByPrefix = function(prefix, limit, filter){
    var cap = (typeof limit === 'number' && limit >= 0)
        ? Math.floor(limit)
        : Trie.prototype.DEFAULT_SEARCH_LIMIT;
    var predicate = (typeof filter === 'function') ? filter : null;

    var root = this.root;
    for(let i=0; i<prefix.length; i++){
        if(root.nodes[prefix[i]] === undefined){
            return null;
        }
        root = root.nodes[prefix[i]];
    }

    var out = [];
    var words = root.words;
    for(let i=0; i<words.length && out.length<cap; i++){
        if(predicate && !predicate(words[i])){
            continue;
        }
        out.push(words[i]);
    }
    return out;
}

//testing
var trie = new Trie();

trie.addBatch(['aaad','aac','ab']);
console.log(trie.searchByPrefix('a'));
console.log(trie.searchByPrefix('aa'));
console.log(trie.searchByPrefix('aaa'));
