//js-trie
(function (root, factory) {
    "use strict";
    if (typeof module === "object" && module && typeof module.exports === "object") {
        // CommonJS / Node
        module.exports = factory();
    } else if (typeof define === "function" && define.amd) {
        // AMD
        define([], factory);
    } else {
        // Browser <script>: expose a single namespaced global without
        // clobbering a pre-existing one.
        root.JsTrie = root.JsTrie || factory();
    }
}(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    var TrieNode = function () {
        this.nodes = Object.create(null); // remove object prototype property
        this.words = [];
    };

    var Trie = function () {
        this.root = new TrieNode();
    };

    Trie.prototype.addBatch = function (words) {
        if (words.constructor !== Array) {
            return;
        }
        for (let i = 0; i < words.length; i++) {
            this.add(words[i]);
        }
    };

    Trie.prototype.add = function (word) {
        var root = this.root;
        for (let i = 0; i < word.length; i++) {
            if (root.nodes[word[i]] === undefined) {
                root.nodes[word[i]] = new TrieNode();
            }
            root.nodes[word[i]].words.push(word);
            root = root.nodes[word[i]];
        }
    };

    Trie.prototype.searchByPrefix = function (prefix) {
        var root = this.root;
        for (let i = 0; i < prefix.length; i++) {
            if (root.nodes[prefix[i]] === undefined) {
                return null;
            }
            root = root.nodes[prefix[i]];
        }
        return root.words;
    };

    // Defense in depth: freeze the prototype so a later-loaded script in the
    // same realm cannot swap add / addBatch / searchByPrefix.
    Object.freeze(Trie.prototype);

    return Trie;
}));

//testing
if (typeof require === "function" && typeof module === "object" && require.main === module) {
    "use strict";
    var Trie = module.exports;
    var trie = new Trie();
    trie.addBatch(['aaad', 'aac', 'ab']);
    console.log(trie.searchByPrefix('a'));
    console.log(trie.searchByPrefix('aa'));
    console.log(trie.searchByPrefix('aaa'));
}
