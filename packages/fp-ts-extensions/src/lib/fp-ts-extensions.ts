import { either, option, taskEither } from 'fp-ts';
import { pipe } from 'fp-ts/function';

export const errorOnNone =
  <A>(
    error: () => Error
  ): ((
    result: taskEither.TaskEither<Error, option.Option<A>>
  ) => taskEither.TaskEither<Error, A>) =>
  (
    result: taskEither.TaskEither<Error, option.Option<A>>
  ): taskEither.TaskEither<Error, A> =>
    pipe(
      result,
      taskEither.chain(
        option.match(
          () => taskEither.left(error()),
          (a) => taskEither.right(a)
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
