import * as React from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import { Component } from './react-wrapper';
import { getJSON } from './utilities';
import Paper from 'material-ui/Paper';
import { Game } from './game';
import { IScheduleGame, IMuiTheme } from '../../../interfaces';

interface IGameListProps {
  muiTheme?: IMuiTheme;
  onGameSelected: ( game: IScheduleGame ) => void;
  selectedGamePk: number;
  style?: React.CSSProperties;
  games: IScheduleGame[];
}

const RefreshInterval = 10000;

class InnerGameList extends Component<IGameListProps, {}> {

  constructor( props ) {
    super( props );
    this.state = { games: [] };
  }

  public render() {
    return <Paper style={Object.assign( { fontSize: '1.25em' }, this.props.style )}>
      {
        this.props.games.map( game => <React.Fragment key={game.gamePk}>
          <Game
            game={game}
            selected={this.props.selectedGamePk === game.gamePk}
            onClick={() => { this.props.onGameSelected( game ); }}
          />
        </React.Fragment>,
        )
      }
    </Paper>;
  }

  private getClickHandler( game: IScheduleGame ) {
    return () => {
      if ( this.props.selectedGamePk === game.gamePk ) {
        this.props.onGameSelected( null );
        return;
      }
      this.props.onGameSelected( game );
    };
  }
}

export const GameList = muiThemeable()( InnerGameList );
