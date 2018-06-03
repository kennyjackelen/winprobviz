import { ISimpleGameState } from '.';

export interface IScheduleGame {
  home: string;
  homeName: string;
  homeScore: number;
  away: string;
  awayName: string;
  awayScore: number;
  gamePk: number;
  state: ISimpleGameState;
}
