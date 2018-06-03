import * as React from 'react';

export const DropShadowDefinition = ( props: { id: string } ) =>
  <filter id={props.id} height="130%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" />
    <feOffset dx="0.5" dy="0.5" result="offsetblur" />
    <feComponentTransfer>
      <feFuncA type="linear" slope="0.4" />
    </feComponentTransfer>
    <feMerge>
      <feMergeNode />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>;
