import * as React from 'react';
import { WinProbGauge } from './gauge';
import { Situation } from './situation';
import { getJSON } from './utilities';
import { Histogram } from './histogram';
import { Component } from './react-wrapper';
import { GameList } from './gamelist';
import { Game } from './game';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import SvgIcon from 'material-ui/SvgIcon';
import { ISimpleGameState, IScheduleGame, IWinProbDistribution, IWinProbResults } from '../../../interfaces';

const RefreshInterval = 10000;

interface IAppState {
  games: IScheduleGame[];
  situation: ISimpleGameState;
  winprobResult: IWinProbResults;
  requestInFlight: boolean;
  isAttachedToSelectedGame: boolean;
  selectedGame: IScheduleGame;
  gameListInDrawer: boolean;
  everythingInOneColumn: boolean;
  useMaxTitleForFontSize: boolean;
  isDrawerOpen: boolean;
}

const GameListInDrawerBreakpoint = 1315;
const EverythingInOneColumnBreakpoint = 1000;

const MaxTitleFontSizePx = 32;
const TitleViewportUnitsForSmallScreens = 7;
const UseMaxTitleForFontSizeBreakpoint = ( 100 * MaxTitleFontSizePx / TitleViewportUnitsForSmallScreens );

const AppMainFrame = ( props: { children: JSX.Element | JSX.Element[], useMaxTitleForFontSize: boolean } ) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
    <AppTitleBar useMaxTitleForFontSize={props.useMaxTitleForFontSize} />
    <AppBody>
      {props.children}
    </AppBody>
    <AppFooter />
  </div>
);

const AppTitleBar = ( props: { useMaxTitleForFontSize: boolean } ) => {
  const fontSize = props.useMaxTitleForFontSize ? `${MaxTitleFontSizePx}px` : `${TitleViewportUnitsForSmallScreens}vw`;
  return <div
    style={{
      display: 'flex',
      fontSize: fontSize,
      justifyContent: 'center',
      padding: '1em',
      textAlign: 'center',
    }}
  >
    Win Probability Visualizer
  </div>;
};

const AppFooter = () => (
  <div style={Object.assign( { display: 'flex', justifyContent: 'center', padding: '1em' } )}>
    <span>© {( new Date() ).getFullYear()} Kenny Jackelen</span>
    <a href="https://github.com/kennyjackelen/winprobviz" target="_blank">
      <SvgIcon style={{
        paddingLeft: '0.5em',
        position: 'relative',
        top: '-4px',
      }}>
        {/* tslint:disable-next-line max-line-length */}
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </SvgIcon>
    </a>
  </div>
);

const AppBody = ( props: { children: JSX.Element | JSX.Element[] } ) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'row', margin: '2em' }}>
    {props.children}
  </div>
);

const AppColumn = ( props: { children: JSX.Element | JSX.Element[], flex: number, style?: React.CSSProperties } ) => (
  <div
    style={Object.assign(
      {
        display: 'flex',
        flex: props.flex,
      },
      props.style,
    )}
  >
    {props.children}
  </div>
);

export class App extends Component<{}, IAppState> {

  private loadScheduleTimeoutID: number;
  private winProbRequestCounter: number;

  constructor( props ) {
    super( props );
    this.winProbRequestCounter = 0;
    this.state = {
      everythingInOneColumn: ( document.body.clientWidth < EverythingInOneColumnBreakpoint ),
      gameListInDrawer: ( document.body.clientWidth < GameListInDrawerBreakpoint ),
      games: [],
      isAttachedToSelectedGame: false,
      isDrawerOpen: false,
      requestInFlight: false,
      selectedGame: null,
      situation: {
        firstOccupied: false,
        halfInning: 'top',
        homeLead: 0,
        inning: 1,
        outs: 0,
        secondOccupied: false,
        thirdOccupied: false,
      },
      useMaxTitleForFontSize: ( document.body.clientWidth > UseMaxTitleForFontSizeBreakpoint ),
      winprobResult: null,
    };
  }

  public async componentDidMount() {
    window.addEventListener( 'resize', this.windowResize.bind( this ) );
    this.updateWinProbability();
    this.loadSchedule();
  }

  public componentWillUnmount() {
    if ( this.loadScheduleTimeoutID ) {
      clearTimeout( this.loadScheduleTimeoutID );
      this.loadScheduleTimeoutID = null;
    }
  }
  public render() {
    let winProbPct: number;
    let situationGameCount: number;
    let dist: IWinProbDistribution;
    if ( this.state.winprobResult === null || this.state.winprobResult.situationGameCount === 0 ) {
      winProbPct = null;
      dist = null;
      situationGameCount = 0;
    } else {
      winProbPct = this.state.winprobResult.homeTeamWinCount / this.state.winprobResult.situationGameCount;
      dist = this.state.winprobResult.dist;
      situationGameCount = this.state.winprobResult.situationGameCount;
    }
    const gaugeElement = <WinProbGauge
      winProbability={winProbPct}
      isRefreshing={this.state.requestInFlight}
    />;
    const histogramElement = <Histogram
      distribution={dist}
      situationGameCount={situationGameCount}
      isRefreshing={this.state.requestInFlight}
    />;
    const gameListElement = ( this.state.games.length > 0 ) && <GameList
      games={this.state.games}
      selectedGamePk={this.state.selectedGame && this.state.selectedGame.gamePk}
      onGameSelected={this.gameSelected.bind( this )}
      style={{ margin: 'auto' }}
    />;
    const situationElement = <div style={{ margin: 'auto' }} >
      {
        ( this.state.games.length > 0 ) &&
        this.state.gameListInDrawer &&
        !this.state.everythingInOneColumn &&
        <div style={{ textAlign: 'center', margin: '0.5em' }}>
          <FlatButton
            label="View current games"
            onClick={() => { this.setState( { isDrawerOpen: true } ); }}
          />
        </div>
      }
      {
        this.state.selectedGame &&
        <React.Fragment>
          {
            !this.state.everythingInOneColumn &&
            <div style={{ textAlign: 'center', margin: '0.5em' }}>
              Attached to {this.state.selectedGame.awayName} vs {this.state.selectedGame.homeName}
            </div>
          }
          <div style={{ textAlign: 'center', margin: '0.5em', fontSize: '0.75em' }}>
            {this.state.isAttachedToSelectedGame ?
              'The game situation will update automatically' :
              <RaisedButton
                label="Resume automatic updates"
                onClick={this.reattach.bind( this )}
              />
            }
          </div>
        </React.Fragment>
      }
      {
        ( this.state.isAttachedToSelectedGame && this.state.everythingInOneColumn ) ?
          <div style={{ maxWidth: '11em', margin: 'auto' }}>
            <Game
              game={this.state.selectedGame}
              onClick={() => { this.setState( { isAttachedToSelectedGame: false } ); }}
            />
          </div> :
          <Situation
            value={this.state.situation}
            onChange={this.situationChanged.bind( this )}
            awayTeamName={this.state.selectedGame && this.state.selectedGame.awayName}
            homeTeamName={this.state.selectedGame && this.state.selectedGame.homeName}
            style={this.state.everythingInOneColumn ? { width: '100%' } : {}}
          />
      }
    </div>;

    let drawerElement: JSX.Element;
    if ( this.state.gameListInDrawer ) {
      drawerElement = <React.Fragment>
        <Drawer
          docked={false}
          open={this.state.isDrawerOpen}
          onRequestChange={( open ) => this.setState( { isDrawerOpen: open } )}
        >
          {gameListElement}
        </Drawer>
      </React.Fragment>;
    }
    if ( this.state.everythingInOneColumn ) {
      return <React.Fragment>
        <AppTitleBar useMaxTitleForFontSize={this.state.useMaxTitleForFontSize} />
        {
          ( this.state.games.length > 0 ) && <FlatButton
            label="View current games"
            fullWidth={true}
            onClick={() => { this.setState( { isDrawerOpen: true } ); }}
          />
        }
        <div style={{ marginLeft: 'auto', marginRight: 'auto' }}>
          {situationElement}
        </div>
        <div style={{ marginLeft: 'auto', marginRight: 'auto', position: 'relative', maxWidth: '500px' }}>
          {gaugeElement}
        </div>
        <div style={{ marginLeft: 'auto', marginRight: 'auto', position: 'relative', maxWidth: '650px' }}>
          {histogramElement}
        </div>
        <AppFooter />
        {drawerElement}
      </React.Fragment>;
    }

    return <React.Fragment>
      <AppMainFrame useMaxTitleForFontSize={this.state.useMaxTitleForFontSize}>
        {
          ( this.state.games.length > 0 ) &&
          !this.state.gameListInDrawer &&
          <AppColumn flex={1} style={{ overflow: 'auto', padding: '0.25em' }}>
            {gameListElement}
          </AppColumn>
        }
        <AppColumn flex={2}>
          {situationElement}
        </AppColumn>
        <AppColumn flex={3} style={{ flexDirection: 'column' }} >
          {/* position: relative so that the refresh div is absolutely positioned within it */}
          <div style={{ display: 'flex', flex: 1.25, flexDirection: 'column', width: '100%', position: 'relative' }}>
            {gaugeElement}
          </div>
          {/* position: relative so that the refresh div is absolutely positioned within it */}
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', width: '100%', position: 'relative' }}>
            {histogramElement}
          </div>
        </AppColumn>
      </AppMainFrame>
      {( this.state.games.length > 0 ) && this.state.gameListInDrawer && drawerElement}
    </React.Fragment>;
  }

  private async loadSchedule() {
    try {
      let games = await getJSON<IScheduleGame[]>( `./schedule` );
      let selectedGame = games.find( x => this.state.selectedGame && ( x.gamePk === this.state.selectedGame.gamePk ) );
      let newState = { games: games };
      let updatedGameState = false;
      if ( selectedGame ) {
        newState = Object.assign( newState, { selectedGame: selectedGame } );
        if ( this.state.isAttachedToSelectedGame ) {
          let newSituation = Object.assign( {}, selectedGame.state );
          newState = Object.assign( newState, { situation: newSituation } );
          updatedGameState = true;
        }
      }
      await this.setState( newState );
      if ( updatedGameState ) {
        this.updateWinProbability();
      }
    } catch ( e ) {
      // error loading schedule - just try again in a bit
    }
    this.loadScheduleTimeoutID = setTimeout( this.loadSchedule.bind( this ), RefreshInterval );
  }

  private windowResize( window: Window, event: UIEvent ) {
    let gameListInDrawer = ( document.body.clientWidth < GameListInDrawerBreakpoint );
    let everythingInOneColumn = ( document.body.clientWidth < EverythingInOneColumnBreakpoint );
    let useMaxTitleForFontSize = ( document.body.clientWidth > UseMaxTitleForFontSizeBreakpoint );
    if (
      this.state.gameListInDrawer === gameListInDrawer
      && this.state.everythingInOneColumn === everythingInOneColumn
      && this.state.useMaxTitleForFontSize === useMaxTitleForFontSize
    ) {
      return;
    }
    this.setState( {
      everythingInOneColumn: everythingInOneColumn,
      gameListInDrawer: gameListInDrawer,
      useMaxTitleForFontSize: useMaxTitleForFontSize,
    } );
  }

  private async situationChanged( newSituation: ISimpleGameState ) {
    await this.setState( {
      isAttachedToSelectedGame: false,
      situation: newSituation,
    } );
    await this.updateWinProbability();
  }

  private async gameSelected( newGame: IScheduleGame ) {
    await this.setState( {
      isAttachedToSelectedGame: ( newGame !== null ),
      isDrawerOpen: ( newGame === null ),
      selectedGame: newGame,
      situation: newGame === null ? this.state.situation : Object.assign( {}, newGame.state ),
    } );
    await this.updateWinProbability();
  }

  private async reattach() {
    await this.setState( {
      isAttachedToSelectedGame: true,
      situation: Object.assign( {}, this.state.selectedGame.state ),
    } );
    await this.updateWinProbability();
  }

  private async updateWinProbability() {
    let requestID = ++this.winProbRequestCounter;
    await this.setState( { requestInFlight: true } );
    try {
      let result = await getJSON<IWinProbResults>( `./winprob/ ${JSON.stringify( this.state.situation )}` );
      // make sure this is the most recent request
      if ( requestID === this.winProbRequestCounter ) {
        await this.setState(
          {
            requestInFlight: false,
            winprobResult: result,
          },
        );
      }
    } catch ( e ) {
      // error in request
      await this.setState(
        {
          requestInFlight: false,
          winprobResult: null,
        },
      );
    }
  }
}
