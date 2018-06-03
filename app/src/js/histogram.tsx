import * as React from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import { DropShadowDefinition } from './dropshadow';
import { Refresh } from './refresh';
import * as Bezier from 'bezier-easing';
import { Component } from './react-wrapper';
import { IWinProbDistribution, IMuiTheme } from '../../../interfaces';

interface IHistogramProps {
  distribution: IWinProbDistribution;
  situationGameCount: number;
  isRefreshing: boolean;
  muiTheme?: IMuiTheme;
}

interface IHistogramState {
  distribution: IWinProbDistribution;
  isAnimating: boolean;
}

const AnimationDuration = 1000;

const Margins: number[] = [];
for ( let i = -10; i <= 10; i++ ) {
  if ( i !== 0 ) { Margins.push( i ); }
}

const getMaxValueFromDistribution = ( dist: IWinProbDistribution ) => {
  try {
    return Math.max( ...Object.keys( dist ).map( x => dist[x] ) );
  } catch ( e ) {
    return 0;
  }
};

const initialDistribution: IWinProbDistribution = {};
for ( let margin of Margins ) { initialDistribution[margin] = 0; }

class InnerHistogram extends Component<IHistogramProps, IHistogramState> {

  private animationStartTime: Date;
  private animationEndTime: Date;
  private animationStartDistribution: IWinProbDistribution;
  private animationEndDistribution: IWinProbDistribution;
  private easingFunction: Bezier.Easing;

  constructor( props ) {
    super( props );
    this.state = { distribution: initialDistribution, isAnimating: false };
    // https://easings.net/#easeInOutBack
    this.easingFunction = Bezier( 0.68, -0.25, 0.32, 1.25 );
  }

  public componentDidMount() {
    if ( this.props.distribution === null ) { return; }
    this.startAnimation();
  }

  public componentDidUpdate( prevProps: IHistogramProps, prevState: IHistogramState ) {
    if ( JSON.stringify( this.props.distribution ) === JSON.stringify( prevProps.distribution ) ) { return; }
    if ( this.props.distribution === null ) {
      // if the distribution is gone, wipe out the state distribution too, so when
      // we come back, we animate from zeros across the board
      this.setState( { distribution: initialDistribution, isAnimating: false } );
      return;
    }
    this.startAnimation();
  }

  public startAnimation() {
    // start a new animation
    let now = new Date();
    this.animationStartTime = new Date( now );
    this.animationEndTime = new Date( now.valueOf() + AnimationDuration );
    this.animationStartDistribution = Object.assign( {}, this.state.distribution );
    this.animationEndDistribution = {};
    const max = getMaxValueFromDistribution( this.props.distribution );
    for ( let margin of Margins ) {
      if ( this.props.distribution[margin] === undefined ) {
        this.animationEndDistribution[margin] = 0;
      } else {
        this.animationEndDistribution[margin] = this.props.distribution[margin] / max;
      }
    }
    requestAnimationFrame( this.animate.bind( this ) );
  }

  public render() {
    const shadow = {
      'box-shadow': '0 1px 3px rgba(0,0,0,0.12) 0 1px 2px rgba(0,0,0,0.24)',
    };
    const histogramHeight = 50;
    const axisLabelHeight = 10;
    const dataLabelHeight = 7;

    if ( this.props.distribution === null || this.props.situationGameCount === 0 ) {
      return <div
        style={{
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.25)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <div>
          There is no data for this situation.
        </div>
        <div>
          This means it never happened in an MLB game from 2015 to 2017.
        </div>
      </div>;
    }
    return (
      <React.Fragment>
        <Refresh
          top={0}
          left={0}
          status={this.props.isRefreshing ? 'loading' : 'hide'}
        />
        <svg
          preserveAspectRatio="xMidYMid meet"
          viewBox={`-100 0 200 ${histogramHeight + axisLabelHeight}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <DropShadowDefinition id="dropshadow" />
          </defs>
          {Margins.map( margin => {
            let pct = this.state.distribution[margin.toString()];
            if ( pct === 0 ) { return; }
            const teamColor = margin > 0 ?
              this.props.muiTheme.palette.primary1Color :
              this.props.muiTheme.palette.accent1Color;
            if ( pct < 0 ) { pct = 0; }
            let height = histogramHeight * pct;
            const enoughRoomForLabelInsideBar = ( height ) > dataLabelHeight;
            return <React.Fragment key={margin}>
              <rect
                filter="url(#dropshadow)"
                x={margin > 0 ? margin * 10 - 10 : margin * 10}
                y={histogramHeight - height}
                width={9}
                height={height}
                fill={teamColor}
              />
              <text
                key={margin}
                textAnchor="middle"
                alignmentBaseline="middle"
                fill={enoughRoomForLabelInsideBar ? '#FFF' : teamColor}
                x={4.5 + ( margin > 0 ? margin * 10 - 10 : margin * 10 )}
                y={
                  enoughRoomForLabelInsideBar ?
                    histogramHeight - height + dataLabelHeight / 2 :
                    histogramHeight - height - dataLabelHeight / 2
                }
                fontSize={dataLabelHeight / 2}
                style={{
                  /* disappear right away when we start animating */
                  /* fade in when we stop animating */
                  opacity: this.state.isAnimating ? 0 : 1,
                  transition: this.state.isAnimating ? '' : 'opacity 1s',
                }}
              >
                {( () => {
                  let pctLabel = 100 * this.props.distribution[margin] / this.props.situationGameCount;
                  return pctLabel < 0.1 ? `< ${( 0.1 ).toFixed( 1 )}` : pctLabel.toFixed( 1 );
                } )()}
              </text>
            </React.Fragment>;
          },
          )}

          {Margins.map( margin =>
            <text
              key={margin}
              textAnchor="middle"
              alignmentBaseline="middle"
              fill={
                margin > 0 ?
                  this.props.muiTheme.palette.primary1Color :
                  this.props.muiTheme.palette.accent1Color
              }
              x={4.5 + ( margin > 0 ? margin * 10 - 10 : margin * 10 )}
              y={histogramHeight + dataLabelHeight / 2}
              fontSize={dataLabelHeight / 2}>
              {Math.abs( margin )}
            </text>,
          )}
        </svg>
        <div style={{ margin: 'auto', textAlign: 'center' }}>Distribution of final run differentials</div>
      </React.Fragment>
    );
  }

  private async animate() {
    let now = new Date();
    if ( now.valueOf() >= this.animationEndTime.valueOf() ) {
      this.setState( { distribution: this.animationEndDistribution, isAnimating: false } );
      return;
    }
    let elapsed = now.valueOf() - this.animationStartTime.valueOf();
    let animationDuration = this.animationEndTime.valueOf() - this.animationStartTime.valueOf();
    let x = elapsed / animationDuration;
    let y = this.easingFunction( x );
    let newDist: IWinProbDistribution = {};
    for ( let margin of Margins ) {
      let distanceToTravel = this.animationEndDistribution[margin] - this.animationStartDistribution[margin];
      let newValue = this.animationStartDistribution[margin] + y * distanceToTravel;
      newDist[margin] = newValue;
    }
    const max = getMaxValueFromDistribution( newDist );
    await this.setState( { distribution: newDist, isAnimating: true } );
    requestAnimationFrame( this.animate.bind( this ) );
  }


}

export const Histogram = muiThemeable()( InnerHistogram );
