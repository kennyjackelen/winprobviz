export interface ISimpleGameState {
  inning: number;
  halfInning: 'top' | 'bottom';
  outs: number;
  homeLead: number;
  firstOccupied: boolean;
  secondOccupied: boolean;
  thirdOccupied: boolean;
}
