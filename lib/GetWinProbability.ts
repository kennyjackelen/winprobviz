import * as pouchdb from 'pouchdb';
import { GameState } from './GameState';
import GetMapOfNextStates from './GetMapOfNextStates';
import { IWinProbDocument, IWinProbResults } from '../interfaces';

const db = new pouchdb( './db/winprob' );

let cacheCount = 0;

export default async function GetWinProbability( originalState: GameState | string, depth: number )
  : Promise<IWinProbResults> {
  let key: string;
  if ( typeof ( originalState ) === 'string' ) {
    key = originalState;
  } else {
    key = originalState.ToString();
  }
  let cachedResult = await GetCachedResult( key, depth );
  if ( cachedResult !== undefined ) { return cachedResult; }
  // initialize object to return
  let originalStateWinProb: IWinProbResults = {
    dist: {},
    gameCount: ( await db.get<any>( 'misc_GAME_COUNT' ) ).gameCount,
    homeTeamWinCount: 0,
    situationGameCount: 0,
  };
  if ( depth === 1 ) {
    // just count the home team win probability and final margins
    // for games that had this game state
    let originalStateResult = await db.allDocs<IWinProbDocument>(
      {
        endkey: `state_${key}|\uffff`,
        include_docs: true,
        startkey: `state_${key}|`,
      },
    );
    originalStateWinProb.situationGameCount = originalStateResult.rows.length;
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
    let [nextStatesMap, finalScoreMap] = await GetMapOfNextStates( key );
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
      for ( let margin of Object.keys( nextAtBatResult.dist ) ) {
        let nextAtBatMarginFrequency = nextAtBatResult.dist[margin] / nextAtBatResult.situationGameCount;
        if ( originalStateWinProb.dist[margin] === undefined ) {
          originalStateWinProb.dist[margin] = 0;
        }
        originalStateWinProb.dist[margin] += nextAtBatMarginFrequency * weight;
      }
      originalStateWinProb.situationGameCount += weight;
    }
    for ( let [homeTeamMargin, weight] of finalScoreMap ) {
      if ( homeTeamMargin > 0 ) {
        originalStateWinProb.homeTeamWinCount += weight;
      }
      if ( originalStateWinProb.dist[homeTeamMargin] === undefined ) {
        originalStateWinProb.dist[homeTeamMargin] = 0;
      }
      originalStateWinProb.dist[homeTeamMargin] += weight;
      originalStateWinProb.situationGameCount += weight;
    }
  }
  await StoreCachedResult( key, depth, originalStateWinProb );
  return originalStateWinProb;
}

async function GetCachedResult( stateString: string, depth: number ): Promise<IWinProbResults> {
  try {
    return ( await db.get<{ result: IWinProbResults }>( `cache_${depth}_${stateString}` ) ).result;
  } catch ( e ) {
    return undefined;
  }
}

async function StoreCachedResult( stateString: string, depth: number, result: IWinProbResults ): Promise<void> {
  await db.put<{ result: IWinProbResults }>(
    {
      _id: `cache_${depth}_${stateString}`,
      result: result,
    },
  );
}
