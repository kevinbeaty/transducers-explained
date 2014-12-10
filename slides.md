---
Transducers Explained
---
Transducers are composable algorithmic transformations.

They are independent from the context of their input and output sources and specify only the essence of the transformation in terms of an individual element.
   
Because transducers are decoupled from input or output sources, they can be used in many different processes - collections, streams, channels, observables, etc.
   
Transducers compose directly, without awareness of input or creation of intermediate aggregates.

http://clojure.org/transducers
---
Reducing Function
---
Reducing Function

```javascript
function sum(result, item){
  return result + item;
}

var summed = [2,3,4].reduce(sum, 1);
// 10 (=1+2+3+4)
```
---
Reducing Function

```javascript
function mult(result, item){
  return result * item;
}

var multed = [2,3,4].reduce(mult, 1);
// 24 (=1*2*3*4)
```
---
Transformer
---
Transformer
```javascript
var transformer = function(reducingFunction){
  return {
    // Start with an initial value
    init: function(){
      return 1;
    },

    // Input one item at a time, passing each result
    // to next iteration using reducing function
    step: reducingFunction,

    // Output last computed result
    result: function(result){
      return result;
    }
  };
};
```
---
Transformer
```javascript
var input = [2,3,4];
var xf = transformer(sum);
var output = input.reduce(xf.step, xf.init());
// output = 10 (=1+2+3+4)
```
---
Transformer
```javascript
var input = [2,3,4];
var xf = transformer(mult);
var output = input.reduce(xf.step, xf.init());
// output = 24 (=1*2*3*4)
```
---
Reduce with Transformers
---
Reduce with Transformers
```javascript
function reduce(xf, init, input){
  var result = input.reduce(xf.step, init);
  return xf.result(result);
}
```
---
Reduce with Transformers
```javascript
var input = [2,3,4];
var xf = transformer(sum);
var output = reduce(xf, xf.init(), input);
// output = 10 (=1+2+3+4)
```
---
Reduce with Transformers
```javascript
var input = [2,3,4];
var xf = transformer(mult);
var output = reduce(xf, xf.init(), input);
// output = 24 (=1*2*3*4)
```
---
Reduce with Transformers
```javascript
var input = [2,3,4];
var xf = transformer(sum);
var output = reduce(xf, 2, input);
// output = 11 (=2+2+3+4)
```
---
Reduce with Transformers
```javascript
var input = [2,3,4];
var xf = transformer(mult);
var output = reduce(xf, 2, input);
// output = 48 (=2*2*3*4)
```
---
Reduce with Wrapped Transformers
---
Reduce with Wrapped Transformers
```javascript
function reduce(xf, init, input){
  if(typeof xf === 'function'){
    // make sure we have a transformer
    xf = wrap(xf);
  }
  var result = input.reduce(xf.step, init);
  return xf.result(result);
}
```
---
Reduce with Wrapped Transformers
```javascript
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
```
---
Reduce with Wrapped Transformers
```javascript
var input = [2,3,4];
var output = reduce(sum, 1, input);
// output = 10 (=1+2+3+4)
```
---
Reduce with Wrapped Transformers
```javascript
var input = [2,3,4];
var output = reduce(mult, 2, input);
// output = 48 (=2*2*3*4)
```
---
Reduce with Wrapped Transformers
```javascript
var input = [2,3,4];
var xf = wrap(sum);
var output = reduce(xf, 2, input);
// output = 11 (=2+2+3+4)
```
---
Reduce with Wrapped Transformers
```javascript
var input = [2,3,4];
var xf = wrap(mult);
var output = reduce(xf, 1, input);
// output = 24 (=1*2*3*4)
```
---
Fancy array copy
---
Fancy array copy
```javascript
function append(result, item){
  result.push(item);
  return result;
}

var input = [2,3,4];
var output = reduce(append, [], input);
// output = [2, 3, 4]
```
---
Transform then Append
---
Transform then Append
```javascript
function plus1(item){
  return item + 1;
}
```
---
Transform then Append
```javascript
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
```
---
Transform then Append
```javascript
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
```
---
Transform then Append
```javascript
var output = reduce(sum, 0, output);
// 12 (=0+3+4+5)
// But needed intermediate array...
```
---
Transducer +1
---
Transducer +1
```javascript
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
```
---
Transducer +1
```javascript
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
```
---
Transducer +1
```javascript
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
```
---
Transducer +2
---
Transducer +2
```javascript
function plus2(input){
  return input+2;
}
var transducerPlus2 = ???
```
---
Transducer +1
```javascript
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
```
---
Transducer +2
```javascript
var transducerPlus2 = function(xf){
  return {
    init: function(){
      return xf.init();
    },
    step: function(result, item){
      var plus1ed = plus2(item);
      return xf.step(result, plus1ed);
    },
    result: function(result){
      return xf.result(result);
    }
  };
};
```
---
Mapping Transducer
```javascript
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
```
---
Transducer +2
```javascript
var transducer = map(plus2);
var stepper = wrap(append);
var xf = transducer(stepper);
var init = [];
var result = xf.step(init, 2);
// [4] (=append([], 2+2)))

result = xf.step(result, 3);
// [4,5] (=append([4], 3+2)))

result = xf.step(result, 4);
// [4,5,6] (=append([4,5], 4+2)))

var output = xf.result(result);
// [4,5,6]
```
---
Transducer +1
```javascript
var transducer = map(plus1);
var stepper = wrap(append);
var xf = transducer(stepper);
var init = [];
var result = xf.step(init, 2);
// [3] (=append([], 2+1)))

result = xf.step(result, 3);
// [3,4] (=append([3], 3+1)))

result = xf.step(result, 4);
// [3,4,5] (=append([3,4], 4+1)))

var output = xf.result(result);
// [3,4,5]
```
---
Transduce
---
Transduce
```javascript
// First, initialize the transformation by calling a transducer
// with a stepper transformation and defining initial value.
var transducer = map(plus1);
var stepper = wrap(append);
var xf = transducer(stepper);
var init = [];
```
---
Transduce
```javascript
// Then step through each input item by using the reducing function
var result = xf.step(init, 2);
// [3] (=append([], 2+1)))

result = xf.step(result, 3);
// [3,4] (=append([3], 3+1)))

result = xf.step(result, 4);
// [3,4,5] (=append([3,4], 4+1)))
```
---
Transduce
```javascript
// Finalize the result to our output using
var output = xf.result(result);
// [3,4,5]
```
---
Transduce
```javascript
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
```
---
Transduce
```javascript
var transducer = map(plus1);
var stepper = append;
var init = [];
var input = [2,3,4];
var output = transduce(transducer, stepper, init, input);
// [3,4,5]
```
---
Transduce
```javascript
var transducer = map(plus2);
var stepper = append;
var init = [];
var input = [2,3,4];
var output = transduce(transducer, stepper, init, input);
// [4,5,6]
```
---
Transduce
```javascript
var transducer = map(plus1);
var stepper = sum;
var init = 0;
var input = [2,3,4];
var output = transduce(transducer, stepper, init, input);
// 12 (=3+4+5)
```
---
Transduce
```javascript
var transducer = map(plus2);
var stepper = sum;
var init = 0;
var input = [2,3,4];
var output = transduce(transducer, stepper, init, input);
// 15 (=4+5+6)
```
---
Transduce
```javascript
var transducer = map(plus1);
var stepper = mult;
var init = 1;
var input = [2,3,4];
var output = transduce(transducer, stepper, init, input);
// 60 (=3*4*5)
```
---
Transduce
```javascript
var transducer = map(plus2);
var stepper = mult;
var init = 1;
var input = [2,3,4];
var output = transduce(transducer, stepper, init, input);
// 120 (=4*5*6)
```
---
Composition
```javascript
var plus3 = function(item){
  var result = plus2(item);
  result = plus1(result);
  return result;
};
```
---
Composition
```javascript
function compose2(fn1, fn2){
  return function(item){
    var result = fn2(item);
    result = fn1(result);
    return result;
  };
}
```
---
Composition
```javascript
var plus3 = compose2(plus1, plus2);

var output = [plus3(2), plus3(3), plus3(4)];
// [5,6,7]
```
---
Composition
```javascript
var transducerPlus3 = map(compose2(plus1, plus2));
var transducer = transducerPlus3;
var stepper = append;
var init = [];
var input = [2,3,4];
var output = transduce(transducer, stepper, init, input);
// [5,6,7]
```
---
Composition
```javascript
var transducerPlus3 = compose2(map(plus1), map(plus2));
var transducer = transducerPlus3;
var stepper = append;
var init = [];
var input = [2,3,4];
var output = transduce(transducer, stepper, init, input);
// [5,6,7]
```
---
Composition
```javascript
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
```
