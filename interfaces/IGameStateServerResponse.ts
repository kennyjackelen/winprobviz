import { ISimpleGameState, IWinProbResults } from '.';

export interface IGameStateServerResponse {
  state: ISimpleGameState;
  winProbability: IWinProbResults;
}
