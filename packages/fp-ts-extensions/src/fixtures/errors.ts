export class GetProjectionError extends Error {
  public readonly _tag: 'GetProjectionError';

  private constructor() {
    super('failed to get projection');
    this._tag = 'GetProjectionError';
  }

  public static readonly of = (): GetProjectionError =>
    new GetProjectionError();
}

export class AnotherError extends Error {
  public readonly _tag: 'AnotherError';

  private constructor() {
    super('something bad happened');
    this._tag = 'AnotherError';
  }

  public static readonly of = (): AnotherError => new AnotherError();
}
