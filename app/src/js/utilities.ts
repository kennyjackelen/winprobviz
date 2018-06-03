export async function getJSON<T extends {}>( URL: string ): Promise<T> {
  return new Promise<T>(
    ( resolve, reject ) => {
      const request = new XMLHttpRequest();
      request.open( 'GET', URL, true );

      request.onload = () => {
        if ( request.status >= 200 && request.status < 400 ) {
          resolve( JSON.parse( request.responseText ) );
        } else {
          reject( new Error( `Request failed with code ${request.status} - ${request.statusText}` ) );
        }
      };

      request.onerror = () => {
        reject( new Error( 'Request failed: connection error' ) );
      };

      request.send();
    },
  );
}
