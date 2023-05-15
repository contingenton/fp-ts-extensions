import { either, option, taskEither, apply } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import { Errors, Validation } from 'io-ts';
import * as RA from 'fp-ts/ReadonlyArray';

export const errorOnNone =
  <E1, E2, A>(
    error: () => E2
  ): ((
    result: taskEither.TaskEither<E1, option.Option<A>>
  ) => taskEither.TaskEither<E1 | E2, A>) =>
  (
    result: taskEither.TaskEither<E1, option.Option<A>>
  ): taskEither.TaskEither<E1 | E2, A> =>
    pipe(
      result,
      taskEither.chain(
        option.match(
          () => taskEither.left<E1 | E2, A>(error()),
          (a) => taskEither.right<E1 | E2, A>(a)
        )
      )
    );

const toResult = <E, T>(result: taskEither.TaskEither<E, T>) =>
  pipe(
    result,
    taskEither.match(
      (e: E) => {
        throw e;
      },
      (a: T) => a
    )
  );

export const taskEitherToPromise: <E, T>(
  p: taskEither.TaskEither<E, T>
) => Promise<T> = <E, T>(p: taskEither.TaskEither<E, T>) => pipe(p, toResult)();

export const tryCatchError: <A>(
  f: () => Promise<A>
) => taskEither.TaskEither<Error, A> = <A>(f: () => Promise<A>) =>
  taskEither.tryCatch(f, either.toError);

export const taskEitherTap =
  <E, A>(action: (right: A) => void) =>
  (te: taskEither.TaskEither<E, A>) =>
    pipe(
      te,
      taskEither.map((a: A) => {
        action(a);
        return a;
      })
    );

export const taskEitherChainTap =
  <E1, A, E2, B>(taskEitherToChain: () => taskEither.TaskEither<E2, B>) =>
  (te: taskEither.TaskEither<E1, A>) =>
    pipe(
      te,
      taskEither.chainW((a: A) =>
        pipe(
          taskEitherToChain(),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          taskEither.map((b: B) => a)
        )
      )
    );

export const taskEitherTapLeft =
  <E, A>(action: (left: E) => void) =>
  (te: taskEither.TaskEither<E, A>) =>
    pipe(
      te,
      taskEither.mapLeft((e: E) => {
        action(e);
        return e;
      })
    );

export const logError =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any


    (logger: (message: string, ...meta: any[]) => unknown) =>
    (error: Error | unknown) => {
      const e =
        error instanceof Error
          ? error
          : new Error(`Unknown error: ${JSON.stringify(error)}`);
      logger('An error occurred {error}', {
        error: {
          message: e.message,
          stack: e.stack,
        },
      });
      return e;
    };

export const ensureAllValid = <T>(arrayOfEither: readonly Validation<T>[]) =>
  RA.reduce(either.right(new Array<T>()), (result: either.Either<Errors, T[]>, eitherItem: Validation<T>) =>
    pipe(
      apply.sequenceS(either.Monad)({
        result,
        entity: eitherItem as either.Either<Errors, T>,
      }),
      either.map(({ result, entity }) => [...result, entity]),
    ),
  )(arrayOfEither);
