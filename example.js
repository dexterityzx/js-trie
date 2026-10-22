// Example / smoke test for js-trie. Run with: node example.js
var Trie = require('./js-trie');

var trie = new Trie();

trie.addBatch(['aaad', 'aac', 'ab']);
console.log(trie.searchByPrefix('a'));
console.log(trie.searchByPrefix('aa'));
console.log(trie.searchByPrefix('aaa'));
