import * as React from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import { DropShadowDefinition } from './dropshadow';
import { Refresh } from './refresh';
import { Component } from './react-wrapper';
import * as Bezier from 'bezier-easing';
import { IMuiTheme } from '../../../interfaces';

interface IWinProbGaugeProps {
  winProbability: number | null;
  isRefreshing: boolean;
  muiTheme?: IMuiTheme;
}

interface IWinProbGaugeState {
  computedAngle: number;
}

const AnimationDuration = 1000;

const Origin = {
  x: 65,
  y: 70,
};

const Radius = 45;

const NeedleDimensions = {
  bladeLength: 55,
  length: 60,
  width: 10,
};

class InnerWinProbGauge extends Component<IWinProbGaugeProps, IWinProbGaugeState> {
  private animationStartTime: Date;
  private animationEndTime: Date;
  private animationStartAngle: number;
  private animationEndAngle: number;
  private easingFunction: Bezier.Easing;

  constructor( props ) {
    super( props );
    this.state = { computedAngle: null };
    // https://easings.net/#easeInOutBack
    this.easingFunction = Bezier( 0.68, -0.25, 0.32, 1.25 );
  }

  public componentDidMount() {
    if ( this.props.winProbability === null ) { return; }
    this.startAnimation();
  }

  public componentDidUpdate( prevProps: IWinProbGaugeProps, prevState: IWinProbGaugeState ) {
    let targetAngle = this.getAngleFromWinProb();
    if ( this.props.winProbability === prevProps.winProbability ) { return; }
    if ( this.props.winProbability === null ) {
      // if the win probability is gone, wipe out the state angle too, so when
      // we come back, we animate from 50% for some visual interest
      this.setState( { computedAngle: null } );
      return;
    }
    if ( this.state.computedAngle === null ) {
      // just appear if the needle wasn't shown - animation doesn't
      // look natural in this scenario
      this.setState( { computedAngle: targetAngle } );
      return;
    }
    this.startAnimation();
  }

  public render() {
    const shadow = {
      'box-shadow': '0 1px 3px rgba(0,0,0,0.12) 0 1px 2px rgba(0,0,0,0.24)',
    };
    const quarterCircumference = 2 * Radius * Math.PI / 4;
    const winProbFromAngle = this.getWinProbFromAngle();
    return (
      <React.Fragment>
        <Refresh
          top={0}
          left={0}
          status={this.props.isRefreshing ? 'loading' : 'hide'}
        />
        <svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 130 80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <DropShadowDefinition id="dropshadow" />
          </defs>
          <circle
            r={Radius}
            cx={Origin.x}
            cy={Origin.y}
            stroke={this.props.muiTheme.palette.accent1Color}
            strokeWidth="10"
            fill="none"
            strokeDasharray={`${quarterCircumference},${3 * quarterCircumference}`}
            strokeDashoffset={2 * quarterCircumference}
          >
          </circle>
          <circle
            r={Radius}
            cx={Origin.x}
            cy={Origin.y}
            stroke={this.props.muiTheme.palette.primary1Color}
            strokeWidth="10"
            fill="none"
            strokeDasharray={`${quarterCircumference},${3 * quarterCircumference}`}
            strokeDashoffset={quarterCircumference}
          >
          </circle>
          {this.state.computedAngle !== null && <React.Fragment>
            <g filter="url(#dropshadow)">
              {/*TODO: update points attr to use constants*/}
              <polygon
                points="65,75 60,70 65,15 70,70"
                fill="#B9975B"
                transform={`rotate(${this.state.computedAngle} ${Origin.x} ${Origin.y})`}
              >
              </polygon>
            </g>
            <text
              fontSize={4}
              x={Origin.x -
                ( NeedleDimensions.bladeLength + 5 ) * Math.cos( ( this.state.computedAngle + 90 ) * Math.PI / 180 )}
              y={Origin.y -
                ( NeedleDimensions.bladeLength + 5 ) * Math.sin( ( this.state.computedAngle + 90 ) * Math.PI / 180 )}
              alignmentBaseline="middle" textAnchor="middle"
              fill={
                winProbFromAngle > 50 ?
                  this.props.muiTheme.palette.primary1Color :
                  this.props.muiTheme.palette.accent1Color
              }>
              {`${
                winProbFromAngle > 50 ?
                  winProbFromAngle.toFixed( 0 ) :
                  ( 100 - winProbFromAngle ).toFixed( 0 )
                }`}
              <tspan fontSize={3} dx={0.5} dy={0.5}>%</tspan>
            </text>
          </React.Fragment>
          }
        </svg>
      </React.Fragment>
    );
  }

  private startAnimation() {
    // start a new animation
    let now = new Date();
    this.animationStartTime = new Date( now );
    this.animationEndTime = new Date( now.valueOf() + AnimationDuration );
    this.animationStartAngle = this.state.computedAngle;
    this.animationEndAngle = this.getAngleFromWinProb();
    requestAnimationFrame( this.animate.bind( this ) );

  }

  private async animate() {
    let now = new Date();
    if ( now.valueOf() >= this.animationEndTime.valueOf() ) {
      this.setState( { computedAngle: this.animationEndAngle } );
      return;
    }
    let elapsed = now.valueOf() - this.animationStartTime.valueOf();
    let animationDuration = this.animationEndTime.valueOf() - this.animationStartTime.valueOf();
    let x = elapsed / animationDuration;
    let y = this.easingFunction( x );
    let newAngle = this.animationStartAngle + y * ( this.animationEndAngle - this.animationStartAngle );
    await this.setState( { computedAngle: newAngle } );
    requestAnimationFrame( this.animate.bind( this ) );
  }

  private getAngleFromWinProb(): number {
    if ( this.props.winProbability === null ) { return 0; }
    return -90 + 180 * this.props.winProbability;
  }

  private getWinProbFromAngle(): number {
    // inverse of getAngleFromWinProb, times 100
    if ( this.state.computedAngle === null ) { return 50; }
    return 100 * ( this.state.computedAngle + 90 ) / 180;
  }
}

export const WinProbGauge = muiThemeable()( InnerWinProbGauge );
