interface ICacheEntry<T extends {}> {
  value: T;
  instant: Date;
}

export default class Cache<K, T extends {}> {

  private entries: Map<K, ICacheEntry<T>>;
  private TTL: number;

  constructor( TTL: number ) {
    this.TTL = TTL;
    this.entries = new Map<K, ICacheEntry<T>>();
  }

  public get( key: K ): T {
    let entry = this.entries.get( key );
    if ( !entry ) {
      return undefined;
    }
    if ( ( new Date() ).valueOf() - entry.instant.valueOf() > this.TTL ) {
      // too old, throw it out
      this.entries.delete( key );
      return undefined;
    }
    return entry.value;
  }

  public set( key: K, value: T ) {
    let entry: ICacheEntry<T> = {
      instant: new Date(),
      value: value,
    };
    this.entries.set( key, entry );
  }
}
