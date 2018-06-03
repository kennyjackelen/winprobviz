/*
  run this script to populate the database with play-by-play data
  from MLB's stats API
*/

/* tslint:disable max-classes-per-file no-debugger no-console */
import * as pouchdb from 'pouchdb';
import { MLBStatsAPI } from 'mlbstatsapi';
import { GameState } from '../lib/GameState';
import { IWinProbDocument } from '../interfaces';

const SeasonsToInclude = [2015, 2016, 2017];

class Throttler {
  private static INTERVAL_MS: number = 100;
  private lastRequest: Date;

  constructor() {
    this.lastRequest = new Date( 0 );
  }

  public async throttle(): Promise<void> {
    let now = new Date();
    if ( now.valueOf() >= this.lastRequest.valueOf() + Throttler.INTERVAL_MS ) {
      this.lastRequest = new Date();
      return;
    }
    return new Promise<void>(
      ( resolve, reject ) => {
        setTimeout( () => {
          this.lastRequest = new Date();
          resolve();
        }, this.lastRequest.valueOf() - now.valueOf() + Throttler.INTERVAL_MS );
      },
    );
  }
}

class Getter {
  private throttler: Throttler;
  private db: PouchDB.Database;
  private processedGamePKs: number[];
  private sidetrackedGames: MLBStatsAPI.ScheduleGame[];
  private erroredOutGamePKs: number[];

  constructor() {
    this.throttler = new Throttler();
    this.db = new pouchdb<IWinProbDocument>( './db/winprob' );
  }

  public async DestroyDB() {
    await this.db.destroy();
    this.db = new pouchdb( './db/winprob' );
  }

  public async Main() {
    this.processedGamePKs = [];
    this.sidetrackedGames = [];
    this.erroredOutGamePKs = [];
    for ( let season of SeasonsToInclude ) {
      await this.OneSeason( season );
    }
    await this.HandleSidetrackedGames();
    await this.PutGameCount();
  }

  private async OneSeason( season: number ) {
    const schedule = await MLBStatsAPI.getSchedule( season );
    for ( let date of schedule.dates ) {
      await this.OneDate( date );
    }
  }

  private async OneDate( date: MLBStatsAPI.ScheduleDate ) {
    console.log( `${date.date}` );
    for ( let game of date.games ) {
      try {
        await this.OneGame( game );
      } catch ( e ) {
        if ( ( e as Error ).message === 'MLBAPI' ) {
          this.sidetrackedGames.push( game );
        } else {
          this.erroredOutGamePKs.push( game.gamePk );
        }
      }
    }
  }

  private async OneGame( game: MLBStatsAPI.ScheduleGame ) {
    // already processed this game (this happens for games that were resumed on a later date)
    if ( this.processedGamePKs.indexOf( game.gamePk ) > -1 ) { return; }
    // not a final score
    if ( game.status.statusCode !== 'F' ) { return; }
    // not a regular season game
    if ( game.gameType !== 'R' ) { return; }
    const state = new GameState();
    let linescore: MLBStatsAPI.LinescoreResponse;
    let playByPlay: MLBStatsAPI.PlayByPlayResponse;
    try {
      await this.throttler.throttle();
      linescore = await MLBStatsAPI.getLinescore( game );
      await this.throttler.throttle();
      playByPlay = await MLBStatsAPI.getPlayByPlay( game );
    } catch ( e ) {
      throw new Error( 'MLBAPI' );
    }
    let finalHomeTeamMargin = linescore.teams.home.runs - linescore.teams.away.runs;
    let atBatIndex: number = -1;
    let playDesc: string = '';
    for ( let play of playByPlay.allPlays ) {
      if ( play.result.event === 'Ejection' ) { continue; }
      let stateString = `state_${state.ToString()}|${game.gamePk}-${state.inning}`;
      try {
        await this.db.put<IWinProbDocument>( {
          _id: stateString,
          atBatIndex: atBatIndex,
          finalHomeTeamMargin: finalHomeTeamMargin,
          gamePk: game.gamePk,
          innings: linescore.currentInning,
          playDesc: playDesc,
          state: state.ToString(),
        } );
      } catch ( e ) {
        throw new Error();
      }
      try {
        await this.db.put<any>( {
          _id: `atBatIndex_${game.gamePk}^${atBatIndex}`,
          state: state.ToString(),
        } );
      } catch ( e ) {
        throw new Error();
      }
      state.Update( play );
      atBatIndex = play.about.atBatIndex;
      playDesc = play.result.event;
    }
    this.processedGamePKs.push( game.gamePk );
  }

  private async HandleSidetrackedGames() {
    while ( this.sidetrackedGames.length > 0 ) {
      let innerSidetrack: MLBStatsAPI.ScheduleGame[] = [];
      for ( let game of this.sidetrackedGames ) {
        try {
          await this.OneGame( game );
        } catch ( e ) {
          if ( ( e as Error ).message === 'MLBAPI' ) {
            innerSidetrack.push( game );
          } else {
            this.erroredOutGamePKs.push( game.gamePk );
          }
        }
      }
      this.sidetrackedGames = innerSidetrack;
    }
  }

  private async PutGameCount() {
    try {
      await this.db.put(
        {
          _id: 'misc_GAME_COUNT',
          gameCount: this.processedGamePKs.length,
        },
      );
    } catch ( e ) { debugger; }
    try {
      await this.db.put(
        {
          _id: 'misc_ERRORED_GAMES',
          games: this.erroredOutGamePKs,
        },
      );
    } catch ( e ) { debugger; }
  }
}

( async () => {
  let getter = new Getter();
  // await getter.DestroyDB();
  await getter.Main();
} )();
