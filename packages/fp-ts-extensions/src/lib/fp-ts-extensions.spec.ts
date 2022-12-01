import {taskEitherChainTap} from "@contingent/fp-ts-extensions";

describe('fp-ts extensions', ()=> {
  describe('taskEitherChainTap', ()=>{
    describe('when the chained taskEither returns right', ()=> {
      let result: either.Either<Error, string>;
      beforeEach(()=>{
        result = pipe(
          taskEither.of('some string'),
          taskEitherChainTap(()=> taskEither.of({ prop: 'this is another task either'}))
        )()
      })

      it('should return the right result of the previous taskEither in the pipe', ()=> {
        expect(result).toEqualRight('some string');
      })
    })
  })
})
