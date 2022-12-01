import '@relmify/jest-fp-ts';
import { taskEitherChainTap } from '@contingent/fp-ts-extensions';
import { either, taskEither } from 'fp-ts';
import { pipe } from 'fp-ts/function';

export class GetProjectionError extends Error {
  public readonly _tag: 'GetProjectionError';

  private constructor() {
    super('failed to get projection');
    // eslint-disable-next-line functional/no-this-expression
    this._tag = 'GetProjectionError';
  }

  public static readonly of = (): GetProjectionError =>
    new GetProjectionError();
}

export class AnotherError extends Error {
  public readonly _tag: 'AnotherError';

  private constructor() {
    super('something bad happened');
    // eslint-disable-next-line functional/no-this-expression
    this._tag = 'AnotherError';
  }

  public static readonly of = (): AnotherError => new AnotherError();
}

describe('fp-ts extensions', () => {
  describe('taskEitherChainTap', () => {
    describe('when previous taskEither fails', () => {
      const getProjection = (
        id: string
      ): taskEither.TaskEither<GetProjectionError, { id: string }> =>
        taskEither.left(GetProjectionError.of());

      let result: either.Either<
        GetProjectionError | AnotherError,
        { id: string }
      >;
      beforeEach(async () => {
        result = await pipe(
          getProjection('some id'),
          taskEitherChainTap(() => taskEither.left(AnotherError.of()))
        )();
      });

      it('should return the left result of the first failed taskEither', () => {
        expect(result).toEqualLeft(GetProjectionError.of());
      });
    });

    describe('when previous taskEither succeeds', () => {
      const getProjection = (
        id: string
      ): taskEither.TaskEither<GetProjectionError, { id: string }> =>
        taskEither.of({ id });

      describe('when the chained taskEither returns right', () => {
        const doSomethingElse = (): taskEither.TaskEither<
          AnotherError,
          string
        > => taskEither.of('something else');

        let result: either.Either<
          GetProjectionError | AnotherError,
          { id: string }
        >;
        beforeEach(async () => {
          result = await pipe(
            getProjection('some id'),
            taskEitherChainTap(() => doSomethingElse())
          )();
        });

        it('should return the right result of the previous taskEither in the pipe', () => {
          expect(result).toEqualRight({ id: 'some id' });
        });
      });

      describe('when the chained taskEither returns left', () => {
        const error = AnotherError.of();
        const doSomethingElse = (): taskEither.TaskEither<
          AnotherError,
          string
        > => taskEither.left(error);

        let result: either.Either<Error, { id: string }>;
        beforeEach(async () => {
          result = await pipe(
            getProjection('some id'),
            taskEitherChainTap(() => doSomethingElse())
          )();
        });

        it('should return the left result of the chained taskEither', () => {
          expect(result).toEqualLeft(error);
        });
      });
    });
  });
});
