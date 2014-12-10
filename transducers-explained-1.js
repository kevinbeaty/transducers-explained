// This is abbreviated source for [Transducers Explained: Part 1](http://simplectic.com/blog/2014/transducers-explained-1/)

//## What are they?
//Straight from the [source](http://clojure.org/transducers).

//> Transducers are composable algorithmic transformations. They are independent from the context of their input and output sources and specify only the essence of the transformation in terms of an individual element. Because transducers are decoupled from input or output sources, they can be used in many different processes - collections, streams, channels, observables, etc. Transducers compose directly, without awareness of input or creation of intermediate aggregates.

//Hmm...

//## I don't get it
//Let's walk through some code.
//
//The "algorithmic transformations" are defined by *reducing functions*

//## Reduce

//> The reduce() method applies a function against an accumulator and each value of the array (from left-to-right) has to reduce it to a single value.

function sum(result, item){
  return result + item;
}

function mult(result, item){
  return result * item;
}

// 10 (=1+2+3+4)
var summed = [2,3,4].reduce(sum, 1);

// 24 (=1\*2\*3\*4)
var multed = [2,3,4].reduce(mult, 1);

// ## Transformer

// Formalize the steps to reduce in a *transformer*:

var transformer = function(reducingFunction){
  return {
    // Start with an initial value
    init: function(){
      return 1;
    },

    //  Input one item at a time, passing each result to next iteration using reducing function
    step: reducingFunction,

    // Output last computed result
    result: function(result){
      return result;
    }
  };
};

// We will focus on the `step` function for now.

var input = [2,3,4];

var xf = transformer(sum);
var output = input.reduce(xf.step, xf.init());
// output = 10 (=1+2+3+4)

var xf = transformer(mult);
var output = input.reduce(xf.step, xf.init());
// output = 24 (=1\*2\*3\*4)

// Define `reduce` as function to decouple from input.

function reduce(xf, init, input){
  var result = input.reduce(xf.step, init);
  return xf.result(result);
}

// Using the new reduce function is similar to what we did before.

var input = [2,3,4];
var xf = transformer(sum);
var output = reduce(xf, xf.init(), input);
// output = 10 (=1+2+3+4)

var input = [2,3,4];
var xf = transformer(mult);
var output = reduce(xf, xf.init(), input);
// output = 24 (=1\*2\*3\*4)

// We can change the initial value by passing it in.

var input = [2,3,4];
var xf = transformer(sum);
var output = reduce(xf, 2, input);
// output = 11 (=2+2+3+4)

var input = [2,3,4];
var xf = transformer(mult);
var output = reduce(xf, 2, input);
// output = 48 (=2\*2\*3\*4)

// Create helper that wraps `step`
function reduce(xf, init, input){
  if(typeof xf === 'function'){
    // make sure we have a transformer
    xf = wrap(xf);
  }
  var result = input.reduce(xf.step, init);
  return xf.result(result);
}

function wrap(xf){
  return {
    // We require init as arg, so do not need here
    init: function(){
      throw new Error('init not supported');
    },

    // Input one item at a time, passing each result to next iteration
    step: xf,

    // Output last computed result
    result: function(result){
      return result;
    }
  };
}

// Now we can pass the reducing function directly to reduce.

var input = [2,3,4];
var output = reduce(sum, 1, input);
// output = 10 (=1+2+3+4)

var input = [2,3,4];
var output = reduce(mult, 2, input);
// output = 48 (=2\*2\*3\*4)

// But we can still pass in transformers if we so desire.

var input = [2,3,4];
var xf = wrap(sum);
var output = reduce(xf, 2, input);
// output = 11 (=2+2+3+4)

var input = [2,3,4];
var xf = wrap(mult);
var output = reduce(xf, 1, input);
// output = 24 (=1\*2\*3\*4)

// ## Fancy array copy
// We can also use `reduce` with arrays.
function append(result, item){
  result.push(item);
  return result;
}

var input = [2,3,4];
var output = reduce(append, [], input);
// output = [2, 3, 4]

// Where it gets interesting is when you add the ability to transform items before appending to the output array.
// ## The loneliest number
// Define a function that increments a single value.
function plus1(item){
  return item + 1;
}

// Now create a transformer using this function to transform individual items within `step`.
var xfplus1 = {
  init: function(){
    throw new Error('init not needed');
  },
  step: function(result, item){
    var plus1ed = plus1(item);
    return append(result, plus1ed);
  },
  result: function(result){
    return result;
  }
};

// We can use the transformer to step through the results.
var xf = xfplus1;
var init = [];
var result = xf.step(init, 2);
// [3] (=append([], 2+1)))

result = xf.step(result, 3);
// [3,4] (=append([3], 3+1)))

result = xf.step(result, 4);
// [3,4,5] (=append([3,4], 4+1)))

var output = xf.result(result);
// [3,4,5]

// What if what we really want is the sum of the incremented items?  We can use reduce.
var output = reduce(sum, 0, output);
// 12 (=0+3+4+5)

// We had to create an intermediate array to get the final answer. Can we do better?

// Since the change from `append` to `sum` is the only change, it would be nice to have a function that can define the transformation regardless of the transformer used to combine the results.

var transducerPlus1 = function(xf){
  return {
    init: function(){
      return xf.init();
    },
    step: function(result, item){
      var plus1ed = plus1(item);
      return xf.step(result, plus1ed);
    },
    result: function(result){
      return xf.result(result);
    }
  };
};

// ## Transducer

// We've created our first *transducer*: a function that accepts an existing transformer and returns a new transformer that modifies the transformation in some way, and delegates additional handling to the wrapped transformer.

var stepper = wrap(append);
var init = [];
var transducer = transducerPlus1;
var xf = transducer(stepper);
var result = xf.step(init, 2);
// [3] (=append([], 2+1)))

result = xf.step(result, 3);
// [3,4] (=append([3], 3+1)))

result = xf.step(result, 4);
// [3,4,5] (=append([3,4], 4+1)))

var output = xf.result(result);
// [3,4,5]

// ## Intermediate aggregates

// We can use that same transducer to get our final summation without the need for an intermediate array by changing the stepper and initial value.

var stepper = wrap(sum);
var init = 0;
var transducer = transducerPlus1;
var xf = transducer(stepper);
var result = xf.step(init, 2);
// 3 (=sum(0, 2+1)))

result = xf.step(result, 3);
// 7 (=sum(3, 3+1)))

result = xf.step(result, 4);
// 12 (=sum(7, 4+1)))

var output = xf.result(result);
// 12

// We get our answer in one pass of iteration, without computing an intermediate array.  Only two things changed from the previous example:

// 1. We wrap sum instead of append when creating the stepper
// 2. We started with an initial value of 0 instead of `[]`.

// Notice that only the `stepper` transformation is aware of the type of `result`. The `item` can be anything, as long as the stepper knows how to combine the result with the new item and return a new combined result, which it can then combine on the possible next iteration.

// These properties allow defining transformations independent of output sources.

// ## Can be as bad as one

// What if we want `plus2`? What would have to change?  We could define a new `transducerPlus2` that works like `transducerPlus1`.

// Can we do better?

// It turns out that everything would be the same with the exception of calling `plus2` instead of `plus1` in the transformation step function.

var map = function(f){
  return function(xf){
    return {
      init: function(){
        return xf.init();
      },
      step: function(result, item){
        var mapped = f(item);
        return xf.step(result, mapped);
      },
      result: function(result){
        return xf.result(result);
      }
    };
  };
};

// We have defined the mapping transducer.  Let's use it to step through the transformation.

function plus2(input){
  return input+2;
}
var transducer = map(plus2);
var stepper = wrap(append);
var xf = transducer(stepper);
var init = [];
var result = xf.step(init, 2);
// [4] (=append([], 2+2)))

result = xf.step(result, 3);
// [4,5] (=append([4], 3+2)))

result = xf.step(result, 4);
// [4,5,6] (=append([4,5], 4+1)))

var output = xf.result(result);
// [4,5,6]

// Compare this to the example with `plus1` and `append` above.  The only difference is the creation of the transducer using `map`.  We could similarly create the `plus1` transducer using `map(plus1)`.

// ## Transduce

// The previous examples illustrated using transducers to manually transform a series of inputs.  Let's break this down.

// First, we initialize the transformation by calling a transducer with a stepper transformation and defining our initial value.

var transducer = map(plus1);
var stepper = wrap(append);
var xf = transducer(stepper);
var init = [];

// We then step through each input item by using the reducing function `xf.step`. We use the initial value as the first `result` to the step function, and the return value of the previous step function for all subsequent items.

var result = xf.step(init, 2);
// [3] (=append([], 2+1)))

result = xf.step(result, 3);
// [3,4] (=append([3], 3+1)))

result = xf.step(result, 4);
// [3,4,5] (=append([3,4], 4+1)))

// We finalize the result to our output using `xf.result`.
var output = xf.result(result);
// [3,4,5]

// Similar to our `reduce` implementation defined above.  We can encapsulate this process into a new function `transduce`.

function transduce(transducer, stepper, init, input){
  if(typeof stepper === 'function'){
    // make sure we have a transformer for stepping
    stepper = wrap(stepper);
  }

  // pass in stepper to create transformer
  var xf = transducer(stepper);

  // xf is now a transformer
  // we now can use reduce defined above to
  // iterate and transform input
  return reduce(xf, init, input);
}

var transducer = map(plus1);
var stepper = append;
var init = [];
var input = [2,3,4];
var output = transduce(transducer, stepper, init, input);
// [3,4,5]

var transducer = map(plus2);
var stepper = append;
var init = [];
var input = [2,3,4];
var output = transduce(transducer, stepper, init, input);
// [4,5,6]

// The only thing that changed is the function passed to map.

var transducer = map(plus1);
var stepper = sum;
var init = 0;
var input = [2,3,4];
var output = transduce(transducer, stepper, init, input);
// 12 (=3+4+5)

var transducer = map(plus2);
var stepper = sum;
var init = 0;
var input = [2,3,4];
var output = transduce(transducer, stepper, init, input);
// 15 (=4+5+6)

var transducer = map(plus1);
var stepper = mult;
var init = 1;
var input = [2,3,4];
var output = transduce(transducer, stepper, init, input);
// 60 (=3\*4\*5)

var transducer = map(plus2);
var stepper = mult;
var init = 1;
var input = [2,3,4];
var output = transduce(transducer, stepper, init, input);
// 120 (=4\*5\*6)

// Only changing the stepper and initial value.

// ## Composition

// What if we want to add 3?  We could define `plus3` and use `map`.
// It turns out we can define `plus3` in terms of two other functions: `plus1` and `plus2`.

var plus3 = function(item){
  var result = plus2(item);
  result = plus1(result);
  return result;
};

// You may recognize this as [function composition][6].  Let's redefine `plus3` in terms of composition.

function compose2(fn1, fn2){
  return function(item){
    var result = fn2(item);
    result = fn1(result);
    return result;
  };
}

var plus3 = compose2(plus1, plus2);

var output = [plus3(2), plus3(3), plus3(4)];
// [5,6,7]

// Use `compose2` to define a transducer for adding 3 to each item by composing `plus1` and `plus2`.

var transducerPlus3 = map(compose2(plus1, plus2));
var transducer = transducerPlus3;
var stepper = append;
var init = [];
var input = [2,3,4];
var output = transduce(transducer, stepper, init, input);
// [5,6,7]

// It turns out we can also create new transducers by composing other transducers.

var transducerPlus1 = map(plus1);
var transducerPlus2 = map(plus2);
var transducerPlus3 = compose2(transducerPlus1, transducerPlus2);
var transducer = transducerPlus3;
var stepper = append;
var init = [];
var input = [2,3,4];
var output = transduce(transducer, stepper, init, input);
// [5,6,7]

// You can use the new composed transducer to compose again.

var transducerPlus1 = map(plus1);
var transducerPlus2 = map(plus2);
var transducerPlus3 = compose2(transducerPlus1, transducerPlus2);
var transducerPlus4 = compose2(transducerPlus3, transducerPlus1);
var transducer = transducerPlus4;
var stepper = append;
var init = [];
var input = [2,3,4];
var output = transduce(transducer, stepper, init, input);
// [6,7,8]

// Notice, again, that the only difference in the preceding examples in this section is the creation of the transducer.  Everything else is the same.

// Composition works because transducers are defined to accept a transformer and return a transformer.

// We have shown that transducers are "composable algorithmic transformations".
