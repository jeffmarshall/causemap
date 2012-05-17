# Causemap

A javascript implementation of the [Causemap](http://causemap.org) API. Relies
on [CouchDB](http://couchdb.apache.org/) for persistence.


## Requirements

- node.js
- nano
- async
- underscore


## Example

Create two situations and link them by a cause/effect relationship.

```javascript
var cm = require('./');
cm.config.set({
  dbhost: 'http://username:password@example.com:5984',
  dbname: 'causemap'
});

cm.create.situation('Global Warming', console.log);
// => null { ok: true,
//    id: '8bb64c66c8e46092abb94cccf4053572',
//    change: '8bb64c66c8e46092abb94cccf4053a57' }

cm.create.situation('Polar Icecaps Melting', console.log);
// => null { ok: true,
//    id: '8bb64c66c8e46092abb94cccf405469a',
//    change: '8bb64c66c8e46092abb94cccf4055638' }

cm.create.relation(
  '8bb64c66c8e46092abb94cccf4053572', // global warming
  '8bb64c66c8e46092abb94cccf405469a', // polar icecaps melting
  console.log)
// => null { ok: true,
//    id: '8bb64c66c8e46092abb94cccf4055ba6',
//    change: '8bb64c66c8e46092abb94cccf40563d3' }

// List the causes of 'Polar Icecaps Melting'
cm.list.causes('8bb64c66c8e46092abb94cccf4053572', console.log)
// => null [ { _id: '8bb64c66c8e46092abb94cccf4055ba6',
//    _rev: '1-2d8de2ff04ef6c6a4a44882ac6277364',
//    type: 'relation',
//    creation_date: '2012-05-17T18:39:36.444Z',
//    cause: 
//     { _id: '8bb64c66c8e46092abb94cccf4053572',
//       _rev: '1-b0f9e6d0a081aaf13ea32270fcd01c01',
//       title: 'Global Warming',
//       type: 'situation',
//       creation_date: '2012-05-17T18:36:02.624Z' },
//    effect: { _id: '8bb64c66c8e46092abb94cccf405469a' } } ]
```

## Installation

```bash
$ cd node_modules
$ git clone git://github.com/classy/causemap.git
$ cd causemap && npm install
```


# License

Copyright © 2012 Classy Applications

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
