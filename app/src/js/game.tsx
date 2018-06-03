import * as React from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import { Component } from './react-wrapper';
import Divider from 'material-ui/Divider';
import { IScheduleGame, IMuiTheme } from '../../../interfaces';

interface IGameProps {
  muiTheme?: IMuiTheme;
  game: IScheduleGame;
  selected?: boolean;
  onClick?: () => void;
}

const styles: { [key: string]: React.CSSProperties } = {
  FlexColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  FlexRow: {
    display: 'flex',
    flexDirection: 'row',
  },
};

const RefreshInterval = 10000;

class InnerGame extends Component<IGameProps, {}> {

  public render() {
    const containerStyle: React.CSSProperties = Object.assign( { cursor: 'pointer' }, styles.FlexRow );
    if ( this.props.selected ) {
      containerStyle.borderLeft = `0.25em solid ${this.props.muiTheme.palette.primary1Color}`;
    } else {
      containerStyle.borderLeft = `0.25em solid transparent`;
    }
    return <div
      style={containerStyle}
      onClick={this.props.onClick}
    >
      <div style={Object.assign( { flex: 1 }, styles.FlexColumn )}>
        <div style={Object.assign( { flex: 1, minHeight: '2em' }, styles.FlexRow )}>
          <div style={{ flex: 1, margin: '0.5em' }}>
            {this.props.game.away}
          </div>
          <div style={{ margin: '0.5em' }}>
            {this.props.game.awayScore}
          </div>
        </div>
        <div style={Object.assign( { flex: 1, minHeight: '1.5em' }, styles.FlexRow )}>
          <div style={{ flex: 1, margin: '0.5em', marginTop: 0 }}>
            {this.props.game.home}
          </div>
          <div style={{ margin: '0.5em', marginTop: 0 }}>
            {this.props.game.homeScore}
          </div>
        </div>
      </div>
      <div style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
      }}>
        <div
          style={{
            fontSize: '0.5em', transform: 'translateY(0.5em)',
            visibility: this.props.game.state.halfInning === 'top' ? 'visible' : 'hidden',
          }}
        >▲</div>
        <div style={{ margin: '0.5em', width: '1.5em' }}>
          {this.props.game.state.inning}
        </div>
        <div
          style={{
            fontSize: '0.5em', transform: 'translateY(-0.5em)',
            visibility: this.props.game.state.halfInning === 'bottom' ? 'visible' : 'hidden',
          }}
        >▼</div>
      </div>
      <div>
        <div style={{ marginTop: '0.25em' }}>
          <svg viewBox="-5 -5 32 24" width="3em" height="2em">
            <g transform="rotate(-45,10.5,10.5)">
              <rect
                x="0" y="0" width="9" height="9"
                stroke={this.props.muiTheme.palette.primary1Color}
                fill={this.props.game.state.thirdOccupied ? this.props.muiTheme.palette.primary1Color : 'none'}
                opacity={this.props.game.state.thirdOccupied ? 1 : 0.5}
              />
              <rect
                x="11" y="0" width="9" height="9"
                stroke={this.props.muiTheme.palette.primary1Color}
                fill={this.props.game.state.secondOccupied ? this.props.muiTheme.palette.primary1Color : 'none'}
                opacity={this.props.game.state.secondOccupied ? 1 : 0.5}
              />
              <rect
                x="11" y="11" width="9" height="9"
                stroke={this.props.muiTheme.palette.primary1Color}
                fill={this.props.game.state.firstOccupied ? this.props.muiTheme.palette.primary1Color : 'none'}
                opacity={this.props.game.state.firstOccupied ? 1 : 0.5}
              />
            </g>
          </svg>
        </div>
        <div style={{ fontSize: '0.75em', textAlign: 'center' }}>
          {this.props.game.state.outs === 1 ? '1 out' : `${this.props.game.state.outs} outs`}
        </div>
      </div>
    </div>;
  }
}

export const Game = muiThemeable()( InnerGame );
