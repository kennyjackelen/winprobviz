import { App } from './app';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

const theme = getMuiTheme(
  {
    palette: {
      accent1Color: '#BA0C2F',
      primary1Color: '#0C2340',
    },
  },
);

export function main() {
  ReactDOM.render(
    <MuiThemeProvider muiTheme={theme}>
      <App />
    </MuiThemeProvider>,
    document.getElementById( 'app' ),
  );
}
