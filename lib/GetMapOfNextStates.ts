import * as pouchdb from 'pouchdb';
import { GameState } from './GameState';
import { IWinProbDocument } from '../interfaces';

const db = new pouchdb( './db/winprob' );

export default async function GetMapOfNextStates( originalState: GameState | string )
  : Promise<[Map<string, number>, Map<number, number>]> {
  let key: string;
  if ( typeof ( originalState ) === 'string' ) {
    key = originalState;
  } else {
    key = originalState.ToString();
  }
  let allInstancesOfOriginalState = await getInstancesOfGameState( key );
  // look at which game states came right after this one in the
  // games that had this game state
  // build a map of game states to how many times they were the
  // state that happened next
  let nextStates = await getNextStateForEachInstance( allInstancesOfOriginalState );
  let nextStatesMap: Map<string, number> = new Map();
  let finalScoresMap: Map<number, number> = new Map();
  let index: number = 0;
  for ( let nextState of nextStates ) {
    if ( nextState !== null ) {
      incrementMap( nextStatesMap, nextState );
    } else {
      incrementMap( finalScoresMap, allInstancesOfOriginalState[index].finalHomeTeamMargin );
    }
    index++;
  }
  return [nextStatesMap, finalScoresMap];
}

async function getInstancesOfGameState( key: string ): Promise<IWinProbDocument[]> {
  return ( await db.allDocs<IWinProbDocument>(
    {
      endkey: `state_${key}|\uffff`,
      include_docs: true,
      startkey: `state_${key}|`,
    },
  ) ).rows.map( x => x.doc );
}

async function getNextStateForEachInstance( instances: IWinProbDocument[] ): Promise<string[]> {
  let IDs = instances.map( x => `atBatIndex_${x.gamePk}^${x.atBatIndex + 1}` );
  let nextStates = await db.allDocs<{ state: string }>(
    { keys: IDs, include_docs: true },
  );
  return nextStates.rows.map( x => ( x.doc ? x.doc.state : null ) );
}

function incrementMap<T>( map: Map<T, number>, key: T ) {
  if ( map.has( key ) ) {
    map.set( key, map.get( key ) + 1 );
  } else {
    map.set( key, 1 );
  }
}
