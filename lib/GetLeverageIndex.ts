/*
import * as pouchdb from 'pouchdb';
import { GameState } from './GameState';

const db = new pouchdb( './db/winprob' );

let cacheCount = 0;

export default async function GetLeverageIndex( originalState: GameState | string, depth: number ): Promise<number> {
  let key: string;
  if ( typeof ( originalState ) === 'string' ) {
    key = originalState;
  }
  else {
    key = originalState.ToString();
  }
  let cachedResult = await GetCachedResult( key, depth );
  if ( cachedResult !== undefined ) return cachedResult;
  let leverageIndex: number;
  let originalStateResult = await db.allDocs<WinProbDocument>(
    {
      startkey: `state_${key}|`,
      endkey: `state_${key}|\uffff`,
      include_docs: true
    }
  );
  let originalStateWinProb: WinProbResults = {
    gameCount: 0,
    situationGameCount: 0,
    homeTeamWinCount: 0,
    dist: {}
  }
  originalStateWinProb.gameCount = ( await db.get<any>( 'misc_GAME_COUNT' ) ).gameCount;
  originalStateWinProb.situationGameCount = originalStateResult.rows.length;
  if ( depth === 1 ) {
    // just count the home team win probability and final margins
    // for games that had this game state
    for ( let row of originalStateResult.rows ) {
      let finalHomeTeamMargin = row.doc.finalHomeTeamMargin;
      if ( finalHomeTeamMargin > 0 ) {
        originalStateWinProb.homeTeamWinCount++;
      }
      if ( originalStateWinProb.dist[finalHomeTeamMargin] === undefined ) {
        originalStateWinProb.dist[finalHomeTeamMargin] = 0;
      }
      originalStateWinProb.dist[finalHomeTeamMargin]++;
    }
    return originalStateWinProb;
  }
  if ( depth > 1 ) {
    // look at which game states came right after this one in the
    // games that had this game state
    let IDs: string[] = [];
    for ( let row of originalStateResult.rows ) {
      // use the at-bat index to find which states came next
      let gamePK = row.doc.gamePk;
      let atBatIndex = row.doc.atBatIndex;
      IDs.push( `atBatIndex_${gamePK}^${atBatIndex + 1}` )
    }
    // build a map of game states to how many times they were the
    // state that happened next
    let nextStatesResult = await db.allDocs<{ state: string }>( { keys: IDs, include_docs: true } );
    let nextStatesMap: Map<string, number> = new Map();
    let index: number = 0;
    for ( let nextStateRow of nextStatesResult.rows ) {
      if ( nextStateRow.doc ) {
        let state = nextStateRow.doc.state;
        if ( nextStatesMap.has( state ) ) {
          nextStatesMap.set( state, nextStatesMap.get( state ) + 1 );
        }
        else {
          nextStatesMap.set( state, 1 );
        }
      }
      else {
        // must have been the end of the game
        let finalHomeTeamMargin = originalStateResult.rows[index].doc.finalHomeTeamMargin;
        if ( finalHomeTeamMargin > 0 ) {
          originalStateWinProb.homeTeamWinCount++;
        }
        if ( originalStateWinProb.dist[finalHomeTeamMargin] === undefined ) {
          originalStateWinProb.dist[finalHomeTeamMargin] = 0;
        }
        originalStateWinProb.dist[finalHomeTeamMargin]++;
      }
      index++;
    }
    for ( let [state, weight] of nextStatesMap ) {
      // now we have a set of game states (variable `state`) with corresponding weights
      // each state occurred weight times the original game state happened
      let nextAtBatResult = await GetWinProbability( state, depth - 1 );
      // what is the home team's win pct in the game state we care about?
      let nextAtBatWinPct = nextAtBatResult.homeTeamWinCount / nextAtBatResult.situationGameCount;
      // turn that into a home team "win count" for the original game state by multiplying that
      // win pct by the number of times this state followed our original game state
      originalStateWinProb.homeTeamWinCount += nextAtBatWinPct * weight;
      // do the same with the home team's margins of victory (or defeat)
      for ( let margin in nextAtBatResult.dist ) {
        let nextAtBatMarginFrequency = nextAtBatResult.dist[margin] / nextAtBatResult.situationGameCount;
        if ( originalStateWinProb.dist[margin] === undefined ) {
          originalStateWinProb.dist[margin] = 0;
        }
        originalStateWinProb.dist[margin] += nextAtBatMarginFrequency * weight;
      }
    }
  }
  await StoreCachedResult( key, leverageIndex );
  return leverageIndex;
}

async function GetCachedResult( stateString: string, depth: number ): Promise<number> {
  try {
    return ( await db.get<{ leverageIndex: number }>( `li_cache_${depth}_${stateString}` ) ).leverageIndex;
  }
  catch ( e ) {
    return undefined;
  }
}

async function StoreCachedResult( stateString: string, leverageIndex: number ): Promise<void> {
  try {
    await db.put<{ leverageIndex: number }>(
      {
        _id: `li_cache_${stateString}`,
        leverageIndex: leverageIndex
      }
    );
  }
  catch ( e ) {
    console.log( e );
  }
}

async function GetRangeOfNextWinProbabilities( gameStateKey: string ): Promise<number> {

}
*/
