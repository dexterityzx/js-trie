# js-trie

A small JavaScript trie with prefix search.

## Install

    npm install js-trie

## Usage

Default (v2, factory-based, case-insensitive, returns copies):

    const Trie = require('js-trie');
    const t = Trie();
    t.add('abc');
    t.addMany(['abd', 'xyz']);
    t.prefix('ab'); // returns ['abc', 'abd']
    t.prefix('zz'); // returns []

Legacy v1 (class-based, case-sensitive, returns the live internal
array on hit and null on miss) is still exported via a subpath:

    const Trie = require('js-trie/v1');
    const t = new Trie();
    t.addBatch(['abc', 'abd']);
    t.searchByPrefix('ab'); // returns ['abc', 'abd'] (live internal array)
    t.searchByPrefix('zz'); // returns null

The two APIs are not drop-in replacements for one another. See
CHANGELOG.md for the full behavioural contract and the differences
between v1 and v2.

## License

MIT. See LICENSE.
