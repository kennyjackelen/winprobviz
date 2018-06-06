import { MLBStatsAPI } from 'mlbstatsapi';
import { ISimpleGameState, IParsedGameStateKey } from '../interfaces';

export class GameState {
  public inning: number;
  public halfInning: 'top' | 'bottom';
  public outs: number;
  public homeScore: number;
  public awayScore: number;
  public firstOccupied: boolean;
  public secondOccupied: boolean;
  public thirdOccupied: boolean;

  constructor( state?: ISimpleGameState ) {
    this.homeScore = 0;
    this.awayScore = 0;
    this.halfInning = 'top';
    this.inning = 1;
    this.outs = 0;
    if ( state ) {
      if ( !Number.isInteger( state.inning ) ) {
        throw new Error( 'Inning must be an integer' );
      }
      if ( !Number.isInteger( state.outs ) ) {
        throw new Error( 'Outs must be an integer' );
      }
      if ( !Number.isInteger( state.homeLead ) ) {
        throw new Error( 'Home lead must be an integer' );
      }
      this.inning = state.inning;
      this.halfInning = state.halfInning;
      this.outs = state.outs;
      this.homeScore = state.homeLead;
      this.awayScore = 0;
      this.firstOccupied = state.firstOccupied;
      this.secondOccupied = state.secondOccupied;
      this.thirdOccupied = state.thirdOccupied;
      if ( this.outs === 3 ) {
        this.outs = 0;
        this.halfInning = ( this.halfInning === 'top' ) ? 'bottom' : 'top';
        if ( this.halfInning === 'top' ) { this.inning++; }
        this.firstOccupied = false;
        this.secondOccupied = false;
        this.thirdOccupied = false;
      }
    }
  }

  public Update( play: MLBStatsAPI.Play ) {
    this.inning = play.about.inning;
    this.halfInning = play.about.halfInning;
    this.outs = play.count.outs;
    // you'd be tempted to filter down to playEvents where details.isScoringPlay is
    // true, but I've found at least one game where that's not consistently set
    // see gamePK 380567, atBatIndex 28
    for ( let playEvent of play.playEvents ) {
      if ( !isNaN( playEvent.details.homeScore ) && !isNaN( playEvent.details.awayScore ) ) {
        this.homeScore = Number( playEvent.details.homeScore );
        this.awayScore = Number( playEvent.details.awayScore );
      }
    }
    if ( !isNaN( play.result.homeScore ) && !isNaN( play.result.awayScore ) ) {
      this.homeScore = Number( play.result.homeScore );
      this.awayScore = Number( play.result.awayScore );
    }
    let runnersRemoved: number[] = [];
    for ( let runner of play.runners ) {
      let runnerID = runner.details.runner.id;
      if ( runnersRemoved.indexOf( runnerID ) > -1 ) { continue; }
      runnersRemoved.push( runnerID );
      switch ( runner.movement.start ) {
        case '1B':
          this.firstOccupied = false;
          break;
        case '2B':
          this.secondOccupied = false;
          break;
        case '3B':
          this.thirdOccupied = false;
          break;
      }
    }
    let runnersPlaced: number[] = [];
    for ( let runner of play.runners.reverse() ) {
      let runnerID = runner.details.runner.id;
      if ( runnersPlaced.indexOf( runnerID ) > -1 ) { continue; }
      runnersPlaced.push( runnerID );
      switch ( runner.movement.end ) {
        case '1B':
          this.firstOccupied = true;
          break;
        case '2B':
          this.secondOccupied = true;
          break;
        case '3B':
          this.thirdOccupied = true;
          break;
      }
    }
  }
  public ToString(): string {
    let bases = '';
    bases += this.firstOccupied ? 'x' : '-';
    bases += this.secondOccupied ? 'x' : '-';
    bases += this.thirdOccupied ? 'x' : '-';
    if ( this.outs === 3 && bases !== '---' ) {
      throw new Error( 'Invalid Game State' );
    }
    let halfInning = ( this.halfInning === 'top' ) ? 'T' : 'B';
    let inning = this.inning > 8 ? 'X' : this.inning.toString();
    // use caution here - changing anything below (even the order of the
    // keys) will make existing DB entries incompatible with the application
    let parsedKey: IParsedGameStateKey = {
      bases: bases,
      homeLead: this.homeScore - this.awayScore,
      inning: `${halfInning}${inning}`,
      outs: this.outs,
    };
    return JSON.stringify( parsedKey );
  }
  public ToISimpleGameState(): ISimpleGameState {
    return {
      firstOccupied: this.firstOccupied,
      halfInning: this.halfInning,
      homeLead: this.homeScore - this.awayScore,
      inning: ( this.inning > 9 ) ? 9 : this.inning,
      outs: this.outs,
      secondOccupied: this.secondOccupied,
      thirdOccupied: this.thirdOccupied,
    };
  }
}
