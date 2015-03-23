// This is abbreviated source for [Transducers Explained Pipelines](http://simplectic.com/blog/2014/transducers-explained-pipelines/)

function plus(x){
  return function(y){
    return x+y;
  };
}
var plus1 = plus(1);
var plus2 = plus(2);

function append(result, item){
  result.push(item);
  return result;
}

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

// ## Pipelines

// composes an arbitrary number of functions
function compose(/*fns*/){
  var fns = arguments;
  return function(xf){
    var i = fns.length - 1;
    for(; i >= 0; i--){
      xf = fns[i](xf);
    }
    return xf;
  };
}
// calling manually
var value = plus1(plus1(plus2(5)));
// 9

// using composed function (allows reuse)
var plus4 = compose(plus1, plus1, plus2);
var value = plus4(5);
// 9

// Create a `plus5` tranducer by composing `map` transducers.
var transducer = compose(
      map(plus1),  // [3,4,5]
      map(plus2),  // [5,6,7]
      map(plus1),  // [6,7,8]
      map(plus1)); // [7,8,9]
var stepper = append;
var init = [];
var input = [2,3,4];
var output = transduce(transducer, stepper, init, input);
// [7,8,9]

// The order of transformation is actually left to right.

// ## Filter
function filter(predicate){
  return function(xf){
    return {
      init: function(){
        return xf.init();
      },
      step: function(value, item){
        var allow = predicate(item);
        if(allow){
          value = xf.step(value, item);
        }
        return value;
      },
      result: function(value){
        return xf.result(value);
      }
    };
  };
}

// transducer that filters all odd values.
function isOdd(num){
  return num % 2 === 1;
}
var transducer = filter(isOdd);
var stepper = append;
var init = [];
var input = [1,2,3,4,5];
var output = transduce(transducer, stepper, init, input);
// [1,3,5]


// another predicate 
function isEqual(y){
  return function(x){
    return x === y;
  };
}
var transducer = filter(isEqual(2));
var stepper = append;
var init = [];
var input = [1,2,3,4,5];
var output = transduce(transducer, stepper, init, input);
// [2]

function not(predicate){
  return function(x){
    return !predicate(x);
  };
}
var transducer = filter(not(isEqual(2)));
var stepper = append;
var init = [];
var input = [1,2,3,4,5];
var output = transduce(transducer, stepper, init, input);
// [1,3,4,5]

// ## Pipeline order

// increment each item and then filter odd values.
var transducer = compose(
      map(plus1),         // [2,3,4,5,6]
      filter(isOdd));     // [3,5]
var stepper = append;
var init = [];
var input = [1,2,3,4,5];
var output = transduce(transducer, stepper, init, input);
// [3,5]

// swap these transducers and see what happens.

var transducer = compose(
      filter(isOdd),      // [1,3,5]
      map(plus1));        // [2,4,6]
var stepper = append;
var init = [];
var input = [1,2,3,4,5];
var output = transduce(transducer, stepper, init, input);
// [2,4,6]

// This demonstrates two important properties of composed transducers:
//
// 1. Although composition is right-to-left, transformation happens left-to-right
// 2. It may be more efficient to use transducers that reduce the number of items earlier in the pipeline, if possible.

// ## Remove

function remove(predicate){
  return filter(not(predicate));
}

var transducer = compose(
      filter(isOdd),        // [1,3,5]
      map(plus1),           // [2,4,6] 
      remove(isEqual(4)));  // [2,6]
var stepper = append;
var init = [];
var input = [1,2,3,4,5];
var output = transduce(transducer, stepper, init, input);
// [2,6]

// ## Drop
function drop(n){
  return function(xf){
    var left = n;
    return {
      init: function(){
        return xf.init();
      },
      step: function(value, item){
        if(left > 0){
          left--;
        } else {
          value = xf.step(value, item);
        }
        return value;
      },
      result: function(value){
        return xf.result(value);
      }
    };
  };
}

var transducer = drop(2);
var stepper = append;
var init = [];
var input = [1,2,3,4,5];
var output = transduce(transducer, stepper, init, input);
// [3,4,5]

// It is our first example of a transducer that creates a stateful transformation.
// State is created with the transformer, not the transducer.

// ## Take
function take(n){
  return function(xf){
    var left = n;
    return {
      init: function(){
        return xf.init();
      },
      step: function(value, item){
        value = xf.step(value, item);
        if(--left <= 0){
          // how do we stop???
        }
        return value;
      },
      result: function(value){
        return xf.result(value);
      }
    };
  };
}

// So how do we signal early termination?  We're going to have to take another look at our source of iteration: `transduce`.

// ## Reduce redux
function transduce(transducer, stepper, init, input){
  if(typeof stepper === 'function'){
    stepper = wrap(stepper);
  }

  var xf = transducer(stepper);
  return reduce(xf, init, input);
}

function reduce(xf, init, input){
  if(typeof xf === 'function'){
    xf = wrap(xf);
  }
  // how do we stop?? 
  var value = input.reduce(xf.step, init); 
  return xf.result(value);
}

function wrap(stepper){
  return {
    init: function(){
      throw new Error('init not supported');
    },
    step: stepper,
    result: function(value){
      return value;
    }
  };
}

function reduce(xf, init, input){
  if(typeof xf === 'function'){
    xf = wrap(xf);
  }

  return arrayReduce(xf, init, input);
}

function arrayReduce(xf, init, array){
  var value = init;
  var idx = 0;
  var length = array.length;
  for(; idx < length; idx++){
    value = xf.step(value, array[idx]);
    // We need to break here, but how do we know?
  }
  return xf.result(value);
}

// We can wrap our *reduced* value in an object with two attributes:

// 1. `value` with the actual wrapped value
// 2. `__transducers_reduced__` of `true` signals the object is reduced. 

function reduced(value){
  return {
    value: value,
    __transducers_reduced__: true
  };
}

function isReduced(value){
  return value && value.__transducers_reduced__;
}

function deref(reducedValue){
  return reducedValue.value;
}

// We can now adjust `arrayReduce` to handle early termination of reduced values.

function arrayReduce(xf, init, array){
  var value = init;
  var idx = 0;
  var length = array.length;
  for(; idx < length; idx++){
    value = xf.step(value, array[idx]);
    if(isReduced(value)){
      value = deref(value);
      break;
    }
  }
  return xf.result(value);
}

// ## Take 2

// Now we are ready to complete our implementation of take:
function take(n){
  return function(xf){
    var left = n;
    return {
      init: function(){
        return xf.init();
      },
      step: function(value, item){
        value = xf.step(value, item);
        if(--left <= 0){
          // we are done, so signal reduced
          value = reduced(value);
        }
        return value;
      },
      result: function(value){
        return xf.result(value);
      }
    };
  };
}

var transducer = take(3);
var stepper = append;
var init = [];
var input = [1,2,3,4,5];
var output = transduce(transducer, stepper, init, input);
// [1,2,3]

var transducer = compose(
    drop(1),    // [2,3,4,5]
    take(3),    // [2,3,4]
    drop(1));   // [3,4]
var stepper = append;
var init = [];
var input = [1,2,3,4,5];
var output = transduce(transducer, stepper, init, input);
// [3,4]
