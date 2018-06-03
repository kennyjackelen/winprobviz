import * as pouchdb from 'pouchdb';
import { GameState } from './GameState';
import GetWinProbability from './GetWinProbability';

const db = new pouchdb( './db/winprob' );

async function changeID( oldID, newID ) {
  let doc = await db.get<{}>( oldID );
  let oldRev = doc._rev;
  doc._id = newID;
  delete doc._rev;
  await db.put( doc );
  await db.remove( oldID, oldRev );
}

( async function () {
  let result = await db.allDocs<WinProbDocument>(
    {
      startkey: `state_`,
      endkey: `state_\uffff`,
      include_docs: true
    }
  );
  let totalRows = result.rows.length;
  let counter = 0;
  for ( let row of result.rows ) {
    let existingDoc = row.doc;
    let newDoc = {
      _id: `atBatIndex_${existingDoc.gamePk}^${existingDoc.atBatIndex}`,
      state: existingDoc.state
    }
    await db.put( newDoc );
    console.log( `indexed ${counter++} of ${totalRows}` );
  }
} );//();

( async function () {
  for ( let inning = 9; inning >0; inning-- ) {
    for ( let isTopOfInning of [true, false] ) {
      let halfInning: 'top' | 'bottom' = isTopOfInning ? 'top' : 'bottom';
      for ( let outs = 2; outs >=0; outs-- ) {
        for ( let runnerOnFirst of [true, false] ) {
          for ( let runnerOnSecond of [true, false] ) {
            for ( let runnerOnThird of [true, false] ) {
              for ( let homeLead = -10; homeLead <= 10; homeLead++ ) {
                if ( halfInning === 'top' && inning === 1 && homeLead > 0 ) continue;
                if ( halfInning === 'bottom' && inning === 9 && homeLead > 0 ) continue;
                let state = new GameState( {
                  firstOccupied: runnerOnFirst,
                  secondOccupied: runnerOnSecond,
                  thirdOccupied: runnerOnThird,
                  inning: inning,
                  halfInning: halfInning,
                  outs: outs,
                  homeLead: homeLead
                } )
                await GetWinProbability( state, 10 );
              }
            }
          }
        }
      }
    }
  }
} )();
