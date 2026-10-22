# js-trie

A small trie demonstration with two variants:

- js-trie.js: prototype-based Trie exposing add(word), addBatch(words), and searchByPrefix(prefix).
- js-trie-v2.js: factory-based Trie() exposing add(word), addMany(words), and prefix(prefix).

## Argument contract

Both query functions (searchByPrefix in js-trie.js and prefix in js-trie-v2.js) accept exactly one argument: a string.

- Passing any non-string value (undefined, null, numbers, booleans, arrays, or plain objects) causes the function to throw a synchronous TypeError with the message "prefix must be a string". The two files agree on this behaviour and neither silently coerces nor type-confuses array-like input.
- The corpus-side APIs (add, addBatch, addMany) expect string words, and for the batch variants an array of strings.

## Hosting these functions behind an HTTP endpoint

Values pulled from an HTTP query string are not guaranteed to be strings. Express with qs turns q as a bracketed array into a JavaScript array, and q with a bracketed key into a plain object. Hosts must normalize the value to a string before calling the trie, for example by checking that typeof is string and falling back to an empty string, or by rejecting the request with 400 Bad Request when the query parameter is not a string.
