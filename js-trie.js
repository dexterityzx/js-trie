//js-trie

var DEFAULT_LIMIT = 50;

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

// Remove a previously added word from the index. Returns true if the
// word was present and removed, false otherwise. Entries that were
// never added (or already removed) are a no-op.
Trie.prototype.remove = function(word){
    if(typeof word !== 'string' || word.length === 0){
        return false;
    }
    var root = this.root;
    for(let i=0; i<word.length; i++){
        if(root.nodes[word[i]] === undefined){
            return false;
        }
        root = root.nodes[word[i]];
    }
    var found = false;
    root = this.root;
    for(let i=0; i<word.length; i++){
        var node = root.nodes[word[i]];
        if(node === undefined){
            break;
        }
        var idx = node.words.indexOf(word);
        if(idx !== -1){
            node.words.splice(idx, 1);
            found = true;
        }
        root = node;
    }
    return found;
}

// searchByPrefix(prefix, limit, filter):
//   prefix - string prefix to look up (required).
//   limit  - optional maximum number of results. When omitted a safe
//            default is applied so that an uncapped single-character
//            probe cannot sweep the whole corpus. Pass Infinity to
//            opt out of the bound explicitly.
//   filter - optional predicate function evaluated against each
//            candidate word; callers use this to scope results to
//            the current user's own entries before they leave the
//            library.
// Returns an Array of matching words, preserving the historical
// return shape, truncated to at most 'limit' entries. When the
// underlying match set was larger than 'limit', the returned array
// also carries a non-enumerable 'next' property containing a
// continuation marker (the next word that would have been returned)
// so the caller can implement pagination. Returns null when the
// prefix is not indexed, preserving the previous contract.
Trie.prototype.searchByPrefix = function(prefix, limit, filter){
    if(typeof prefix !== 'string'){
        return null;
    }
    if(limit === undefined || limit === null){
        limit = DEFAULT_LIMIT;
    }
    if(typeof limit !== 'number' || isNaN(limit) || limit < 0){
        limit = DEFAULT_LIMIT;
    }
    var root = this.root;
    for(let i=0; i<prefix.length; i++){
        if(root.nodes[prefix[i]] === undefined){
            return null;
        }
        root = root.nodes[prefix[i]];
    }
    var out = [];
    var next = null;
    var source = root.words;
    for(let i=0; i<source.length; i++){
        var w = source[i];
        if(typeof filter === 'function' && !filter(w)){
            continue;
        }
        if(out.length >= limit){
            next = w;
            break;
        }
        out.push(w);
    }
    if(next !== null){
        Object.defineProperty(out, 'next', {
            value: next,
            enumerable: false,
            writable: false,
            configurable: false
        });
    }
    return out;
}

//testing
var trie = new Trie();

trie.addBatch(['aaad','aac','ab']);
console.log(trie.searchByPrefix('a'));
console.log(trie.searchByPrefix('aa'));
console.log(trie.searchByPrefix('aaa'));
