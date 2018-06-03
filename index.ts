import * as Express from 'express';
import * as Compression from 'compression';
import * as pouchdb from 'pouchdb';
import { GameState } from './lib/GameState';
import { MLBStatsAPI } from 'mlbstatsapi';
import GetWinProbability from './lib/GetWinProbability';
import Cache from './lib/cache';
import { ISimpleGameState, IScheduleGame } from './interfaces';

const PORT = process.env.PORT || 8080;
const app = Express();
app.use( Compression() );
const router = Express.Router();

const scheduleCache = new Cache<any, MLBStatsAPI.ScheduleResponse>( 1000 );
const linescoreCache = new Cache<number, MLBStatsAPI.LinescoreResponse>( 1000 );

declare const emit: ( any ) => void;

function log( msg: string ): void {
  console.log( `[${new Date()}] ${msg}` );  // tslint:disable-line no-console
}

async function getMLBSchedule(): Promise<MLBStatsAPI.ScheduleResponse> {
  let schedule: MLBStatsAPI.ScheduleResponse;
  schedule = scheduleCache.get( 'schedule' );
  if ( schedule ) { return schedule; }
  return await MLBStatsAPI.getCurrentSchedule();
}

async function getLinescore( game: MLBStatsAPI.ScheduleGame ): Promise<MLBStatsAPI.LinescoreResponse> {
  let linescore: MLBStatsAPI.LinescoreResponse;
  linescore = linescoreCache.get( game.gamePk );
  if ( linescore ) { return linescore; }
  return await MLBStatsAPI.getLinescore( game );
}

( async () => {

  const teamList = await MLBStatsAPI.getListOfTeams();

  router.use( '/winprob/:situation',
    async ( req, res, next ) => {
      let situation: ISimpleGameState;
      try {
        situation = JSON.parse( req.params.situation );
      } catch ( e ) {
        res.status( 400 ).send( 'invalid game situation' );
        return;
      }
      try {
        const state = new GameState( situation );
        res.json( await GetWinProbability( state, 10 ) );
      } catch ( e ) {
        res.status( 500 );
      }
    },
  );

  router.use( '/schedule',
    async ( req, res, next ) => {
      try {
        const gameList: IScheduleGame[] = [];
        const schedule = await getMLBSchedule();
        for ( let date of schedule.dates ) {
          for ( let game of date.games.filter( x => x.status.abstractGameCode === 'L' ) ) {
            const linescore = await getLinescore( game );
            const awayAbbr = teamList.teams.find( x => x.id === game.teams.away.team.id ).abbreviation;
            const homeAbbr = teamList.teams.find( x => x.id === game.teams.home.team.id ).abbreviation;
            const awayName = teamList.teams.find( x => x.id === game.teams.away.team.id ).teamName;
            const homeName = teamList.teams.find( x => x.id === game.teams.home.team.id ).teamName;
            let inning = Number( linescore.currentInning );
            let halfInning = linescore.inningHalf.toLowerCase();
            let outs = Number( linescore.outs );
            if ( halfInning === 'middle' ) {
              halfInning = 'bottom';
              outs = 0;
            } else if ( halfInning === 'end' ) {
              halfInning = 'top';
              outs = 0;
              inning++;
            }
            const gameState = new GameState( {
              firstOccupied: !!linescore.offense.first,
              halfInning: halfInning as 'top' | 'bottom',
              homeLead: linescore.teams.home.runs - linescore.teams.away.runs,
              inning: inning,
              outs: outs,
              secondOccupied: !!linescore.offense.second,
              thirdOccupied: !!linescore.offense.third,
            } );
            gameList.push(
              {
                away: awayAbbr,
                awayName: awayName,
                awayScore: linescore.teams.away.runs,
                gamePk: game.gamePk,
                home: homeAbbr,
                homeName: homeName,
                homeScore: linescore.teams.home.runs,
                state: gameState.ToISimpleGameState(),
              },
            );
          }
        }
        res.json( gameList );
      } catch ( e ) {
        res.status( 500 );
      }
    },
  );

  app.use( '/', router );

  // set up static directory
  app.use( Express.static( 'app' ) );

  // go baby go!
  log( 'Starting web server...' );
  app.listen( PORT );

} )();
