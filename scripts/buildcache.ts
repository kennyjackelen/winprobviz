/*
  run this script to calculate the Win Probabilities for all game
  states so that they are cached for fast retrieval
*/

import { GameState } from '../lib/GameState';
import GetWinProbability from '../lib/GetWinProbability';

const MaxLead = 10;
const Depth = 10;

( async () => {
  for ( let inning = 9; inning > 0; inning-- ) {
    for ( let isTopOfInning of [true, false] ) {
      let halfInning: 'top' | 'bottom' = isTopOfInning ? 'top' : 'bottom';
      for ( let outs = 2; outs >= 0; outs-- ) {
        for ( let runnerOnFirst of [true, false] ) {
          for ( let runnerOnSecond of [true, false] ) {
            for ( let runnerOnThird of [true, false] ) {
              for ( let homeLead = -MaxLead; homeLead <= MaxLead; homeLead++ ) {
                if ( halfInning === 'top' && inning === 1 && homeLead > 0 ) { continue; }
                if ( halfInning === 'bottom' && inning === 9 && homeLead > 0 ) { continue; }
                let state = new GameState( {
                  firstOccupied: runnerOnFirst,
                  halfInning: halfInning,
                  homeLead: homeLead,
                  inning: inning,
                  outs: outs,
                  secondOccupied: runnerOnSecond,
                  thirdOccupied: runnerOnThird,
                } );
                await GetWinProbability( state, Depth );
              }
            }
          }
        }
      }
    }
  }
} )();
