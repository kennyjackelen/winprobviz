import * as React from 'react';
import RefreshIndicator from 'material-ui/RefreshIndicator';

/* copied from material-ui typings since it's only exported through material-ui itself */
declare interface IRefreshIndicatorProps {
    color?: string;
    left: number;
    loadingColor?: string;
    percentage?: number;
    size?: number;
    status?: 'ready' | 'loading' | 'hide';
    style?: React.CSSProperties;
    top: number;
}

export const Refresh = ( props: IRefreshIndicatorProps ) => {
  const outerDivStyles: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.25)',
    bottom: 0,
    left: 0,
    opacity: 1,
    position: 'absolute',
    right: 0,
    top: 0,
    transition: 'opacity 1s',
  };
  if ( props.status === 'hide' ) {
    // visibility:hidden is important so user can interact with the main content
    outerDivStyles.visibility = 'hidden';
    outerDivStyles.opacity = 0;
  }
  const innerDivStyles: React.CSSProperties = {
    bottom: 'calc(50% - 20px)',
    left: 'calc(50% - 20px)',
    position: 'absolute',
    right: 'calc(50% - 20px)',
    top: 'calc(50% - 20px)',
  };
  return <div style={outerDivStyles} >
    <div style={innerDivStyles} >
      <RefreshIndicator {...props} />
    </div>
  </div>;
};
