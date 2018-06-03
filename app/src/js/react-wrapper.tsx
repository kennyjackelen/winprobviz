import * as React from 'react';

export class Component<P = {}, S = {}, SS = never> extends React.Component<P, S, SS> {

  public async setState<K extends keyof S>(
    state: ( ( prevState: Readonly<S>, props: P ) => ( Pick<S, K> | S | null ) ) |
      ( Pick<S, K> | S | null ) ): Promise<void> {
    return new Promise<void>(
      ( resolve, reject ) => {
        super.setState( state, () => {
          resolve();
        } );
      },
    );
  }
}
