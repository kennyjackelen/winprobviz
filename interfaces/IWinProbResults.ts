export interface IWinProbDistribution { [margin: string]: number; }

export interface IWinProbResults {
  gameCount: number;
  situationGameCount: number;
  homeTeamWinCount: number;
  dist: IWinProbDistribution;
}
