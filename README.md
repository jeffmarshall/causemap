# Causemap

A [coffeescript](http://coffeescript.org/) implementation of the [Causemap](http://causemap.org) API. Relies on [CouchDB](http://couchdb.apache.org/).


## Requirements

- node.js
- coffeescript
- npm


## Example

Create two situations and link them by a cause/effect relationship.

    cm = require 'causemap'
    cm.config.set 
      dbhost: 'http://example.com:5984'
      dbname: 'causemap'

    cm.create.situation 'Global Warming', (err, res) ->
      console.log res.id 		# => '123jhk1j2h3kjh123'

    cm.create.situaiton 'Burning Fossil Fuels', (err, res) ->
      console.log res.id 		# => 'as09d8a0s7f897as1'

    cm.create.relation 'as09d8a0s7f897as1', '123jhk1j2h3kjh123'

    cm.list.situation.causes '123jhk1j2h3kjh123', (err, res) ->
      console.log res.rows.length # => 1


## Installation

  $ npm install causemap


# API

- fetch
  - situation
  - change
  - relation
- create
  - situation
  - relation
  - change
- modify
  - situation
    - title
    - slug
    - description
    - location
    - period
    - addTag
    - removeTag
    - markForDeletion
    - unmarkForDeletion
  - relation
    - description    
    - markForDeletion
    - unmarkForDeletion
- list
  - latest
    - situations
    - changes
    - relations
  - situation
    - causes
    - effects


# License

Copyright © 2012 Classy Applications

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.