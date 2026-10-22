//js-trie

// --- Resource bounds (defense against unbounded insert input) ---------------
// These caps are intentionally generous for ordinary use (tags, usernames,
// search terms, UGC words) but refuse pathological inputs that would turn
// attacker-chosen text into unbounded TrieNode allocation. Embedding
// applications SHOULD still size-check their own request bodies; see README.
var MAX_WORD_LEN   = 1024;         // characters per single word
var MAX_BATCH_LEN  = 10000;        // elements per addBatch call
var MAX_BATCH_BYTES = 1 << 20;     // 1 MiB total characters per addBatch call
var MAX_TRIE_NODES = 1 << 20;      // ~1M nodes per Trie instance (hard quota)

var TrieNode = function(){
    this.nodes = Object.create(null); // remove object prototype property
    this.terminal = false;            // true iff a word ends exactly here
}

var Trie = function(){
    this.root = new TrieNode();
    this.nodeCount = 1;               // counts the root
    this.wordCount = 0;
}

Trie.prototype.addBatch = function(words){
    if(words === null || words === undefined || words.constructor !== Array){
        return;
    }
    if(words.length > MAX_BATCH_LEN){
        throw new RangeError('addBatch: batch length ' + words.length +
            ' exceeds MAX_BATCH_LEN');
    }
    var total = 0;
    for(let i=0; i<words.length; i++){
        var w = words[i];
        if(typeof w !== 'string'){
            throw new TypeError('addBatch: element is not a string');
        }
        if(w.length > MAX_WORD_LEN){
            throw new RangeError('addBatch: element exceeds MAX_WORD_LEN');
        }
        total += w.length;
        if(total > MAX_BATCH_BYTES){
            throw new RangeError('addBatch: cumulative size exceeds budget');
        }
    }
    for(let i=0; i<words.length; i++){
        this.add(words[i]);
    }
}

Trie.prototype.add = function(word){
    if(typeof word !== 'string'){
        throw new TypeError('add: word must be a string');
    }
    if(word.length > MAX_WORD_LEN){
        throw new RangeError('add: word exceeds MAX_WORD_LEN');
    }
    if(word.length === 0){
        return;
    }
    if(this.nodeCount + word.length > MAX_TRIE_NODES){
        var probe = this.root;
        var newNodes = 0;
        for(let i=0;i<word.length;i++){
            if(probe.nodes[word[i]] === undefined){
                newNodes = word.length - i;
                break;
            }
            probe = probe.nodes[word[i]];
        }
        if(this.nodeCount + newNodes > MAX_TRIE_NODES){
            throw new RangeError('add: trie node quota exceeded');
        }
    }
    var root = this.root;
    for(let i=0;i<word.length;i++){
        if(root.nodes[word[i]] === undefined){
            root.nodes[word[i]] = new TrieNode();
            this.nodeCount++;
        }
        root = root.nodes[word[i]];
    }
    if(!root.terminal){
        root.terminal = true;
        this.wordCount++;
    }
}

function collectWords(node, prefix, out){
    if(node.terminal){
        out.push(prefix);
    }
    for(var ch in node.nodes){
        collectWords(node.nodes[ch], prefix + ch, out);
    }
}

Trie.prototype.searchByPrefix = function(prefix){
    if(typeof prefix !== 'string'){
        return null;
    }
    var root = this.root;
    for(let i=0; i<prefix.length; i++){
        if(root.nodes[prefix[i]] === undefined){
            return null;
        }
        root = root.nodes[prefix[i]];
    }
    var out = [];
    collectWords(root, prefix, out);
    return out;
}

Trie.prototype.remove = function(word){
    if(typeof word !== 'string' || word.length === 0){
        return false;
    }
    var stack = [];
    var node = this.root;
    for(let i=0;i<word.length;i++){
        var child = node.nodes[word[i]];
        if(child === undefined){
            return false;
        }
        stack.push({parent: node, ch: word[i], child: child});
        node = child;
    }
    if(!node.terminal){
        return false;
    }
    node.terminal = false;
    this.wordCount--;
    for(let i=stack.length-1; i>=0; i--){
        var frame = stack[i];
        var c = frame.child;
        var hasChildren = false;
        for(var k in c.nodes){ hasChildren = true; break; }
        if(!c.terminal && !hasChildren){
            delete frame.parent.nodes[frame.ch];
            this.nodeCount--;
        } else {
            break;
        }
    }
    return true;
}

Trie.prototype.clear = function(){
    this.root = new TrieNode();
    this.nodeCount = 1;
    this.wordCount = 0;
}

//testing
var trie = new Trie();

trie.addBatch(['aaad','aac','ab']);
console.log(trie.searchByPrefix('a'));
console.log(trie.searchByPrefix('aa'));
console.log(trie.searchByPrefix('aaa'));
