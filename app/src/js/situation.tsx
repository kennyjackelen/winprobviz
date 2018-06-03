import * as React from 'react';
import { GameState } from '../../../lib/GameState';
import Checkbox from 'material-ui/Checkbox';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton';
import Divider from 'material-ui/Divider';
import Paper from 'material-ui/Paper';
import { ISimpleGameState } from '../../../interfaces';

interface ISituationProps {
  awayTeamName?: string;
  homeTeamName?: string;
  onChange: ( newSituation: ISimpleGameState ) => void;
  style?: React.CSSProperties;
  value: ISimpleGameState;
}

const SectionStyle: React.CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
};

const ControlGroupStyle: React.CSSProperties = Object.assign( {},
  SectionStyle,
  {
    margin: '1em',
    padding: '1em',
  },
);

const InlineStyles: React.CSSProperties = {
  display: 'inline-block',
  height: '1.5em',
  marginLeft: '0.5em',
  marginRight: '0.5em',
  whiteSpace: 'nowrap',
  width: 'auto',
};

interface IInlineCheckboxProps {
  checked?: boolean;
  label?: React.ReactNode;
  onCheck?( event: React.MouseEvent<{}>, checked: boolean ): void;
}

const InlineCheckbox = ( props: IInlineCheckboxProps ) =>
  <Checkbox {...props} style={InlineStyles} />;

interface IIconButtonProps {
  disabled?: boolean;
  onClick?: React.MouseEventHandler<{}>;
  style?: React.CSSProperties;
}

const IncrementButton = ( props: IIconButtonProps ) =>
  <IconButton {...props}  >
    <svg viewBox="0 0 24 24" >
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
      <path d="M0 0h24v24H0z" fill="none" />
    </svg>
  </IconButton>;

const DecrementButton = ( props: IIconButtonProps ) =>
  <IconButton {...props}  >
    <svg viewBox="0 0 24 24">
      <path d="M19 13H5v-2h14v2z" />
      <path d="M0 0h24v24H0z" fill="none" />
    </svg>
  </IconButton>;

function ordinal( n: number ): string {
  if ( n % 10 === 1 && n % 100 !== 11 ) { return `${n}st`; }
  if ( n % 10 === 2 && n % 100 !== 12 ) { return `${n}nd`; }
  if ( n % 10 === 3 && n % 100 !== 13 ) { return `${n}rd`; }
  return `${n}th`;
}

const LargestLead = 10;
const HomeLeads: number[] = [];
for ( let i = -LargestLead; i <= LargestLead; i++ ) { HomeLeads.push( i ); }

function homeTeamCanBeAhead( value: ISimpleGameState ) {
  // home team has not batted yet
  if ( value.inning === 1 && value.halfInning === 'top' ) { return false; }
  // if the home team is ahead, the game is over
  if ( value.inning === 9 && value.halfInning === 'bottom' ) { return false; }
  return true;
}

export class Situation extends React.Component<ISituationProps, {}> {
  constructor( props ) {
    super( props );
  }

  public render() {
    const el = this;
    const homeLabel = this.props.homeTeamName || 'Home';
    const awayLabel = this.props.awayTeamName || 'Away';
    return <Paper
      zDepth={2}
      style={Object.assign(
        { display: 'inline-block' },
        this.props.style,
      )}
    >
      <div style={ControlGroupStyle}>
        <InlineCheckbox
          label="1B"
          checked={this.props.value.firstOccupied}
          onCheck={( e, val ) => el.update( 'firstOccupied', val )}
        />
        <InlineCheckbox
          label="2B"
          checked={this.props.value.secondOccupied}
          onCheck={( e, val ) => el.update( 'secondOccupied', val )}
        />
        <InlineCheckbox
          label="3B"
          checked={this.props.value.thirdOccupied}
          onCheck={( e, val ) => el.update( 'thirdOccupied', val )}
        />
      </div>
      <Divider />
      <RadioButtonGroup
        style={ControlGroupStyle}
        name="Outs"
        valueSelected={this.props.value.outs}
        onChange={( e, val ) => el.update( 'outs', val )}
      >
        {[0, 1, 2].map( outs =>
          <RadioButton
            key={outs}
            value={outs}
            label={`${outs} ${outs === 1 ? 'out' : 'outs'}`}
            style={InlineStyles}
          />,
        )}
      </RadioButtonGroup>
      <Divider />
      <div style={SectionStyle}  >
        <DecrementButton
          style={{ top: '12px' }}
          disabled={this.props.value.inning <= 1}
          onClick={( e ) => el.update( 'inning', this.props.value.inning - 1 )}
        />
        <SelectField
          floatingLabelText="Inning"
          value={this.props.value.inning}
          onChange={( e, i, val ) => el.update( 'inning', val )}
          menuStyle={{
            textAlign: 'center',
          }}
          menuItemStyle={{
            textAlign: 'center',
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map( inning =>
            <MenuItem
              key={inning}
              value={inning}
              primaryText={`${ordinal( inning )} inning`}
            /> )}
          <MenuItem value={9} primaryText="9th inning or later" />
        </SelectField>
        <IncrementButton
          style={{ top: '12px' }}
          disabled={this.props.value.inning >= 9}
          onClick={( e ) => el.update( 'inning', this.props.value.inning + 1 )}
        />
      </div>
      <div>
        <RadioButtonGroup
          style={ControlGroupStyle}
          name="Half Inning"
          valueSelected={this.props.value.halfInning}
          onChange={( e, val ) => el.update( 'halfInning', val )}
        >
          <RadioButton
            value="top"
            label="Top"
            style={InlineStyles}
          />
          <RadioButton
            value="bottom"
            label="Bottom"
            style={InlineStyles}
          />
        </RadioButtonGroup>
      </div>
      <Divider />
      <div style={SectionStyle}>
        <DecrementButton
          style={{ top: '12px' }}
          disabled={this.props.value.homeLead <= -LargestLead}
          onClick={( e ) => el.update( 'homeLead', this.props.value.homeLead - 1 )}
        />
        <SelectField
          floatingLabelText="Score"
          value={this.props.value.homeLead}
          onChange={( e, i, val ) => el.update( 'homeLead', val )}
          menuStyle={{
            textAlign: 'center',
          }}
          menuItemStyle={{
            textAlign: 'center',
          }}
        >
          {HomeLeads.map( lead =>
            <MenuItem
              key={lead}
              value={lead}
              primaryText={
                lead === 0 ?
                  'Tied' :
                  `${lead > 0 ? homeLabel : awayLabel} up by ${Math.abs( lead )}` +
                  `${Math.abs( lead ) === LargestLead ? ' or more' : ''}`
              }
              disabled={lead > 0 && !homeTeamCanBeAhead( this.props.value )}
            />,
          )}
        </SelectField>
        <IncrementButton
          style={{ top: '12px' }}
          disabled={
            this.props.value.homeLead >= LargestLead
            || (
              !homeTeamCanBeAhead( this.props.value ) && this.props.value.homeLead >= 0
            )
          }
          onClick={( e ) => el.update( 'homeLead', this.props.value.homeLead + 1 )}
        />
      </div>
    </Paper>;
  }

  private update( key: keyof ISimpleGameState, value: any ) {
    let newValue = {};
    newValue[key] = value;
    const newSituation: ISimpleGameState = Object.assign( this.props.value, newValue );
    this.props.onChange( newSituation );
  }
}
