/*
  run this script to replicate the pouchDB database to a local
  CouchDB instance so you can explore it with the web interface
*/

import * as pouchdb from 'pouchdb';

( async () => {
  await pouchdb.replicate( './db/winprob', 'http://localhost:5984/winprob' );
} )();
