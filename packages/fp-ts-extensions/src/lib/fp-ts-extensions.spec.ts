/* eslint-disable @typescript-eslint/no-unused-vars */
import '@relmify/jest-fp-ts';
import { errorOnNone, taskEitherChainTap } from './fp-ts-extensions';
import { either, option, taskEither } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import { AnotherError, GetProjectionError } from '../fixtures/errors';

describe('fp-ts extensions', () => {
  describe('errorOnNone', () => {
    describe('when taskEither right option none', () => {
      class MyError extends Error {}
      class MappedError extends Error {}
      let result: either.Either<MyError | MappedError, string>;
      beforeEach(async () => {
        result = await pipe(
          taskEither.right<MyError, option.Option<string>>(option.none),
          errorOnNone(() => new MappedError('mapped error'))
        )();
      });
      it('should return left with the mapped error', () => {
        expect(result).toBeLeft();
        pipe(
          result,
          either.mapLeft((e) => {
            expect(e instanceof MappedError).toBeTruthy();
            expect(e.message).toEqual('mapped error');
          })
        );
      });
    });
  });

  describe('taskEitherChainTap', () => {
    describe('when previous taskEither fails', () => {
      const getProjection = (
        _: string
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
