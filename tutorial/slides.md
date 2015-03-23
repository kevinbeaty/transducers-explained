---
Transducers Explained
---
JavaScript Transducers in the Wild

- transducers-js
- transducers.js
- RxJs
- Highland
- Kefir.js
- js-csp
- transduce
- transduce-stream
- Ramda (soon)
- Most.js (soon)
- Bacon.js (soon)
- ... likely more to come
---
Transducers are composable algorithmic transformations.

They are independent from the context of their input and output sources and specify only the essence of the transformation in terms of an individual element.

Because transducers are decoupled from input or output sources, they can be used in many different processes - collections, streams, channels, observables, etc.

Transducers compose directly, without awareness of input or creation of intermediate aggregates.

http://clojure.org/transducers
---
Reducing Function
```javascript
function sum(aggregate, element){
  return aggregate + element
}

var output = [2,3,4].reduce(sum, 1)
// 10 (=1+2+3+4)

var output = arrayReduce(sum, 1, [2,3,4])
// 10 (=1+2+3+4)

function arrayReduce(step, init, input){
  // Start with an initial aggregate
  var aggregate = init

  // Input one element at a time, passing each result
  // to next iteration using reducing function
  for(var idx = 0; idx < input.length; idx++){
    var element = input[idx]
    aggregate = step(aggregate, element)
  }

   // Output last computed result
  return aggregate
}
```
---
Reducing Function
```javascript
function mult(aggregate, element){
  return aggregate * element
}

var output = [2,3,4].reduce(mult, 1)
// 24 (=1*2*3*4)

var output = arrayReduce(mult, 1, [2,3,4])
// 24 (=1*2*3*4)

function arrayReduce(step, init, input){
  // Start with an initial aggregate
  var aggregate = init

  // Input one element at a time, passing each result
  // to next iteration using reducing function
  for(var idx = 0; idx < input.length; idx++){
    var element = input[idx]
    aggregate = step(aggregate, element)
  }

   // Output last computed result
  return aggregate
}
```
---
Reducing Function
```javascript
function mult(aggregate, element){
  return aggregate * element
}

var output = [2,3,4].reduce(mult, 2)
// 48 (=2*2*3*4)

var output = arrayReduce(mult, 2, [2,3,4])
// 48 (=2*2*3*4)

function arrayReduce(step, init, input){
  // Start with an initial aggregate
  var aggregate = init

  // Input one element at a time, passing each result
  // to next iteration using reducing function
  for(var idx = 0; idx < input.length; idx++){
    var element = input[idx]
    aggregate = step(aggregate, element)
  }

   // Output last computed result
  return aggregate
}
```
---
Transformer
```javascript
function transformer(reducingFunction){
  return {
    // Start with an initial aggregate
    init: function(){
      return 1
    },

    // Input one element at a time, passing each result
    // to next iteration using reducing function
    step: reducingFunction,

    // Output last computed result
    result: function(aggregate){
      return aggregate
    }
  }
}
```
---
Transformer
```javascript
// Input source
var input = [2,3,4]

// Create transformer from reducing function
var xf = transformer(sum)

// start with an initial aggregate
var init = xf.init()

// reduce using step reducing function
var aggregate = input.reduce(xf.step, init)

// Output last computed result
var output = xf.result(aggregate)
// output = 10 (=1+2+3+4)
```
---
Transformer
```javascript
// Input source
var input = [2,3,4]

// Create transformer from reducing function
var xf = transformer(mult)

// start with an initial aggregate
var init = xf.init()

// reduce using step reducing function
var aggregate = input.reduce(xf.step, init)

// Output last computed result
var output = xf.result(aggregate)
// output = 24 (=1*2*3*4)
```
---
Reduce with Functions and Transformers
```javascript
function reduce(xf, init, input){
  // wrap function as transformer if necessary
  xf = transformer(xf)
  // reduce using step function
  var aggregate = input.reduce(xf.step, init)
  // extract result
  return xf.result(aggregate)
}
```
---
Reduce with Functions and Transformers
```javascript
function transformer(xf){
  // Assume we already have a transformer
  // if not a function
  if(typeof xf !== 'function'){
    return xf
  }

  // wrap reducing function as transformer
  // with init, step, result
  return {
    init: function(){},
    step: xf,
    result: function(aggregate){
      return aggregate
    }
  }
}
```
---
Reduce with Transformers
```javascript
var input = [2,3,4]
var init = 2
var xf = transformer(mult)
var output = reduce(xf, init, input)
// output = 48 (=2*2*3*4)
```
---
Reduce with Transformers
```javascript
var input = [2,3,4]
var init = 1
var xf = transformer(sum)
var output = reduce(xf, init, input)
// output = 10 (=1+2+3+4)
```
---
Reduce with Functions
```javascript
var input = [2,3,4]
var init = 1
var xf = sum
var output = reduce(xf, init, input)
// output = 10 (=1+2+3+4)
```
---
Reduce with Functions
```javascript
var input = [2,3,4]
var init = 2
var xf = mult
var output = reduce(xf, init, input)
// output = 48 (=2*2*3*4)
```
---
Append +1
```javascript
function append(aggregate, element){
  return aggregate.concat([element])
}

var input = [2,3,4]
var output = reduce(append, [], input)
// output = [2, 3, 4]
```
---
Append +1
```javascript
function plus1(element){
  return element + 1
}

var xfplus1 = {
  init: function(){},
  step: function(aggregate, element){
    var plus1ed = plus1(element)
    return append(aggregate, plus1ed)
  },
  result: function(aggregate){
    return aggregate
  }
}
```
---
Append +1
```javascript
var xf = xfplus1
var init = []
var aggregate = xf.step(init, 2)
// [3] (=append([], 2+1)))

aggregate = xf.step(aggregate, 3)
// [3,4] (=append([3], 3+1)))

aggregate = xf.step(aggregate, 4)
// [3,4,5] (=append([3,4], 4+1)))

var output = xf.result(aggregate)
// [3,4,5]
```
---
Sum +1
```javascript
var output = reduce(sum, 0, output)
// 12 (=0+3+4+5)
// But needed intermediate aggregate...
```
---
Sum +1
```javascript

  var xfplus1 = {
    init: function(){
      return
    },
    step: function(aggregate, element){
      var plus1ed = plus1(element)
      return sum(aggregate, plus1ed)
    },
    result: function(aggregate){
      return aggregate
    }
  }

  // sum of [el1 + 1, el2 + 1 ...]
```
---
Append +1
```javascript

  var xfplus1 = {
    init: function(){
      return
    },
    step: function(aggregate, element){
      var plus1ed = plus1(element)
      return append(aggregate, plus1ed)
    },
    result: function(aggregate){
      return aggregate
    }
  }

  // array of [el1 + 1, el2 + 1 ...]
```
---
Append +1
```javascript
  var step = append
  var xfplus1 = {
    init: function(){
      return
    },
    step: function(aggregate, element){
      var plus1ed = plus1(element)
      return step(aggregate, plus1ed)
    },
    result: function(aggregate){
      return aggregate
    }
  }

  // array of [el1 + 1, el2 + 1 ...]
```
---
Append +1
```javascript
  var xf = transformer(append)
  var xfplus1 = {
    init: function(){
      return xf.init()
    },
    step: function(aggregate, element){
      var plus1ed = plus1(element)
      return xf.step(aggregate, plus1ed)
    },
    result: function(aggregate){
      return xf.result(aggregate)
    }
  }

  // array of [el1 + 1, el2 + 1 ...]
```
---
Sum +1
```javascript
  var xf = transformer(sum)
  var xfplus1 = {
    init: function(){
      return xf.init()
    },
    step: function(aggregate, element){
      var plus1ed = plus1(element)
      return xf.step(aggregate, plus1ed)
    },
    result: function(aggregate){
      return xf.result(aggregate)
    }
  }

  // sum of [el1 + 1, el2 + 1 ...]
```
---
Transducer +1
```javascript
function transducerPlus1(xf){
  var xfplus1 = {
    init: function(){
      return xf.init()
    },
    step: function(aggregate, element){
      var plus1ed = plus1(element)
      return xf.step(aggregate, plus1ed)
    },
    result: function(aggregate){
      return xf.result(aggregate)
    }
  }
  return xfplus1
}
```
---
Transducer +1
```javascript
var baseXf = transformer(append)
var init = []
var transducer = transducerPlus1
var xf = transducer(baseXf)
var aggregate = xf.step(init, 2)
// [3] (=append([], 2+1)))

aggregate = xf.step(aggregate, 3)
// [3,4] (=append([3], 3+1)))

aggregate = xf.step(aggregate, 4)
// [3,4,5] (=append([3,4], 4+1)))

var output = xf.result(aggregate)
// [3,4,5]
```
---
Transducer +1
```javascript
var baseXf = transformer(sum)
var init = 0
var transducer = transducerPlus1
var xf = transducer(baseXf)
var aggregate = xf.step(init, 2)
// 3 (=sum(0, 2+1)))

aggregate = xf.step(aggregate, 3)
// 7 (=sum(3, 3+1)))

aggregate = xf.step(aggregate, 4)
// 12 (=sum(7, 4+1)))

var output = xf.result(aggregate)
// 12
```
---
Transducer +2
```javascript
function plus2(element){
  return element + 2
}
var transducerPlus2 = ???
```
---
Transducer +1
```javascript

  function transducer(xf){
    return {
      init: function(){
        return xf.init()
      },
      step: function(aggregate, element){
        var mapped = plus1(element)
        return xf.step(aggregate, mapped)
      },
      result: function(aggregate){
        return xf.result(aggregate)
      }
    }
  }
  // transducerPlus1
```
---
Transducer +2
```javascript

  function transducer(xf){
    return {
      init: function(){
        return xf.init()
      },
      step: function(aggregate, element){
        var mapped = plus2(element)
        return xf.step(aggregate, mapped)
      },
      result: function(aggregate){
        return xf.result(aggregate)
      }
    }
  }
  // transducerPlus2
```
---
Transducer +2
```javascript
  var mappingFunction = plus2
  function transducer(xf){
    return {
      init: function(){
        return xf.init()
      },
      step: function(aggregate, element){
        var mapped = mappingFunction(element)
        return xf.step(aggregate, mapped)
      },
      result: function(aggregate){
        return xf.result(aggregate)
      }
    }
  }
  // transducerPlus2
```
---
Transducer +1
```javascript
  var mappingFunction = plus1
  function transducer(xf){
    return {
      init: function(){
        return xf.init()
      },
      step: function(aggregate, element){
        var mapped = mappingFunction(element)
        return xf.step(aggregate, mapped)
      },
      result: function(aggregate){
        return xf.result(aggregate)
      }
    }
  }
  // transducerPlus1
```
---
Mapping Transducer
```javascript
function map(mappingFunction){
  return function transducer(xf){
    return {
      init: function(){
        return xf.init()
      },
      step: function(aggregate, element){
        var mapped = mappingFunction(element)
        return xf.step(aggregate, mapped)
      },
      result: function(aggregate){
        return xf.result(aggregate)
      }
    }
  }
}
```
---
Transducer +2
```javascript
var transducer = map(plus2)
var baseXf = transformer(append)
var xf = transducer(baseXf)
var init = []
var aggregate = xf.step(init, 2)
// [4] (=append([], 2+2)))

aggregate = xf.step(aggregate, 3)
// [4,5] (=append([4], 3+2)))

aggregate = xf.step(aggregate, 4)
// [4,5,6] (=append([4,5], 4+2)))

var output = xf.result(aggregate)
// [4,5,6]
```
---
Transducer +1
```javascript
var transducer = map(plus1)
var baseXf = transformer(append)
var xf = transducer(baseXf)
var init = []
var aggregate = xf.step(init, 2)
// [3] (=append([], 2+1)))

aggregate = xf.step(aggregate, 3)
// [3,4] (=append([3], 3+1)))

aggregate = xf.step(aggregate, 4)
// [3,4,5] (=append([3,4], 4+1)))

var output = xf.result(aggregate)
// [3,4,5]
```
---
Transduce
```javascript
// Create a transducer and compatible
// base transformer and initial aggregate
var transducer = map(plus1)
var baseXf = transformer(append)
var init = []

// Initialize the transducer with base
// transformer to get new transformer
var xf = transducer(baseXf)

// Step through each input element
// using the reducing function
var aggregate = xf.step(init, 2)
// [3] (=append([], 2+1)))

aggregate = xf.step(aggregate, 3)
// [3,4] (=append([3], 3+1)))

aggregate = xf.step(aggregate, 4)
// [3,4,5] (=append([3,4], 4+1)))

// Finalize to output using result
var output = xf.result(aggregate)
// [3,4,5]
```
---
Transduce
```javascript
// Create a transducer and compatible
// base transformer and initial aggregate
var transducer = map(plus1)
var baseXf = transformer(append)
var init = []

// Initialize the transducer with base
// transformer to get new transformer
var xf = transducer(baseXf)

// Step through each input element
// using the reducing function
// var aggregate = xf.step(init, 2)
// [3] (=append([], 2+1)))

// aggregate = xf.step(aggregate, 3)
// [3,4] (=append([3], 3+1)))

// aggregate = xf.step(aggregate, 4)
// [3,4,5] (=append([3,4], 4+1)))

// Finalize to output using result
var output = reduce(xf, init, [2,3,4])
// [3,4,5]
```
---
Transduce
```javascript
// Create a transducer and compatible
// base transformer and initial aggregate
var transducer = map(plus1)
var baseXf = transformer(append)
var init = []

function transduce(transducer, baseXf, init, input){
  // initialize transducer with base transformer
  var xf = transducer(baseXf)

  // Reduce result over input
  return reduce(xf, init, input)
}

// Transduce result over input
var input = [2,3,4]
var output = transduce(transducer, baseXf, init, input)
// [3,4,5]
```
---
Transduce
```javascript
// Create a transducer and compatible
// base transformer and initial aggregate
var transducer = map(plus1)
var baseXf = append
var init = []

function transduce(transducer, baseXf, init, input){
  // initialize transducer with base transformer
  var xf = transducer(transformer(baseXf))

  // Reduce result over input
  return reduce(xf, init, input)
}

// Transduce result over input
var input = [2,3,4]
var output = transduce(transducer, baseXf, init, input)
// [3,4,5]
```
---
Transduce
```javascript
var transducer = map(plus1)
var baseXf = append
var init = []
var input = [2,3,4]
var output = transduce(transducer, baseXf, init, input)
// [3,4,5]
```
---
Transduce
```javascript
var transducer = map(plus2)
var baseXf = append
var init = []
var input = [2,3,4]
var output = transduce(transducer, baseXf, init, input)
// [4,5,6]
```
---
Transduce
```javascript
var transducer = map(plus1)
var baseXf = sum
var init = 0
var input = [2,3,4]
var output = transduce(transducer, baseXf, init, input)
// 12 (=3+4+5)
```
---
Transduce
```javascript
var transducer = map(plus2)
var baseXf = sum
var init = 0
var input = [2,3,4]
var output = transduce(transducer, baseXf, init, input)
// 15 (=4+5+6)
```
---
Transduce
```javascript
var transducer = map(plus1)
var baseXf = mult
var init = 1
var input = [2,3,4]
var output = transduce(transducer, baseXf, init, input)
// 60 (=3*4*5)
```
---
Transduce
```javascript
var transducer = map(plus2)
var baseXf = mult
var init = 1
var input = [2,3,4]
var output = transduce(transducer, baseXf, init, input)
// 120 (=4*5*6)
```
---
Transducer +3
```javascript
function plus3(element){
  return element + 3
}
var transducerPlus3 = ???
```
---
Transducer +3
```javascript
var transducerPlus3 = map(plus3)
```
---
Transducer +3
```javascript
var plus3 = function(value){
  var value2 = plus2(value)
  var value1 = plus1(value2)
  return value1
}
```
---
Composition
```javascript
function compose2(f, g){
  return function f_after_g(value){
    var valueG = g(value)
    var valueF = f(valueG)
    return valueF
    // return f(g(value))
  }
}
```
---
Composition
```javascript
var plus3 = compose2(plus1, plus2)

var output = [plus3(2), plus3(3), plus3(4)]
// [5,6,7]
```
---
Composition
```javascript
var transducerPlus3 = map(plus3)
var transducer = transducerPlus3
var baseXf = append
var init = []
var input = [2,3,4]
var output = transduce(transducer, baseXf, init, input)
// [5,6,7]
```
---
Composition
```javascript
var transducerPlus3 = map(compose2(plus1, plus2))
var transducer = transducerPlus3
var baseXf = append
var init = []
var input = [2,3,4]
var output = transduce(transducer, baseXf, init, input)
// [5,6,7]
```
---
Composition
```javascript
var transducerPlus3 = compose2(map(plus1), map(plus2))
var transducer = transducerPlus3
var baseXf = append
var init = []
var input = [2,3,4]
var output = transduce(transducer, baseXf, init, input)
// [5,6,7]
```
---
Composition
```javascript
var transducerPlus1 = map(plus1)
var transducerPlus2 = map(plus2)
var transducerPlus3 = compose2(transducerPlus1, transducerPlus2)
var transducerPlus4 = compose2(transducerPlus3, transducerPlus1)
var transducer = transducerPlus4
var baseXf = append
var init = []
var input = [2,3,4]
var output = transduce(transducer, baseXf, init, input)
// [6,7,8]
```
---
Composition
```javascript
function compose(/*fns*/){
  var fns = arguments
  return function(xf){
    var i = fns.length - 1
    for(; i >= 0; i--){
      xf = fns[i](xf)
    }
    return xf
  }
}
```
---
Composition
```javascript
var value = plus1(plus1(plus2(5)))
// 9

var value = compose(plus1, plus1, plus2)(5)
// 9
```
---
Composition
```javascript
var transducer = compose(
      map(plus1),  // [3,4,5]
      map(plus2),  // [5,6,7]
      map(plus1),  // [6,7,8]
      map(plus1))  // [7,8,9]
var baseXf = append
var init = []
var input = [2,3,4]
var output = transduce(transducer, baseXf, init, input)
// [7,8,9]
```
---
Filter
```javascript
function isOdd(num){
  return num % 2 === 1
}
var transducer = filter(isOdd)
var baseXf = append
var init = []
var input = [1,2,3,4,5]
var output = transduce(transducer, baseXf, init, input)
// [1,3,5]
```
---
Map
```javascript
function map(f){
  return function transducer(xf){
    return {
      init: function(){
        return xf.init()
      },
      step: function(aggregate, element){
        var mapped = f(element)
        return xf.step(aggregate, mapped)
      },
      result: function(aggregate){
        return xf.result(aggregate)
      }
    }
  }
}
```
---
---
Filter
```javascript
function filter(predicate){
  return function transducer(xf){
    return {
      init: function(){
        return xf.init()
      },
      step: function(aggregate, element){
        var allow = predicate(element)
        if(allow){
          aggregate = xf.step(aggregate, element)
        }
        return aggregate
      },
      result: function(aggregate){
        return xf.result(aggregate)
      }
    }
  }
}
```
---
Pipeline order
```javascript
var transducer = compose(
      map(plus1),         // [2,3,4,5,6]
      filter(isOdd))      // [3,5]
var baseXf = append
var init = []
var input = [1,2,3,4,5]
var output = transduce(transducer, baseXf, init, input)
// [3,5]
```
---
Pipeline order
```javascript
var transducer = compose(
      filter(isOdd),      // [1,3,5]
      map(plus1))         // [2,4,6]
var baseXf = append
var init = []
var input = [1,2,3,4,5]
var output = transduce(transducer, baseXf, init, input)
// [2,4,6]
```
---
Drop
```javascript
var transducer = drop(2)
var baseXf = append
var init = []
var input = [1,2,3,4,5]
var output = transduce(transducer, baseXf, init, input)
// [3,4,5]
```
---
Drop
```javascript
function drop(n){
  return function transducer(xf){
    var left = n
    return {
      init: function(){
        return xf.init()
      },
      step: function(aggregate, element){
        if(left > 0){
          left--
        } else {
          aggregate = xf.step(aggregate, element)
        }
        return aggregate
      },
      result: function(aggregate){
        return xf.result(aggregate)
      }
    }
  }
}
```
---
Take
```javascript
var transducer = take(3)
var baseXf = append
var init = []
var input = [1,2,3,4,5]
var output = transduce(transducer, baseXf, init, input)
// [1,2,3]
```
---
Take
```javascript
function take(n){
  return function transducer(xf){
    var left = n
    return {
      init: function(){
        return xf.init()
      },
      step: function(aggregate, element){
        aggregate = xf.step(aggregate, element)
        if(--left <= 0){
          // how do we stop???
        }
        return aggregate
      },
      result: function(aggregate){
        return xf.result(aggregate)
      }
    }
  }
}
```
---
Reduce Redux
```javascript
function transduce(transducer, baseXf, init, input){
  var xf = transducer(transformer(baseXf))
  return reduce(xf, init, input)
}

function reduce(xf, init, input){
  xf = transformer(xf)

  // how do we stop??
  var aggregate = input.reduce(xf.step, init)
  return xf.result(aggregate)
}
```
---
Reduce Redux
```javascript
function transduce(transducer, baseXf, init, input){
  var xf = transducer(transformer(baseXf))
  return reduce(xf, init, input)
}

function reduce(xf, init, input){
  return arrayReduce(transformer(xf), init, input)
}

function arrayReduce(xf, init, input){
  var aggregate = init
  for(var idx = 0; idx < input.length; idx++){
    var element = input[idx]
    aggregate = xf.step(aggregate, element)
    // We need to break here, but how do we know?
  }
  return xf.result(aggregate)
}
```
---
Reduce Redux
```javascript
function reduced(aggregate){
  return {
    value: aggregate,
    __transducers_reduced__: true
  }
}

function isReduced(aggregate){
  return aggregate && aggregate.__transducers_reduced__
}

function deref(reducedAggregate){
  return reducedAggregate.value
}
```
---
Reduce Redux
```javascript
function transduce(transducer, baseXf, init, input){
  var xf = transducer(transformer(baseXf))
  return reduce(xf, init, input)
}

function reduce(xf, init, input){
  return arrayReduce(transformer(xf), init, input)
}

function arrayReduce(xf, init, input){
  var aggregate = init
  for(var idx = 0; idx < input.length; idx++){
    var element = input[idx]
    aggregate = xf.step(aggregate, element)
    if(isReduced(aggregate)){
      aggregate = deref(aggregate)
      break
    }
  }
  return xf.result(aggregate)
}
```
---
Take 2
```javascript
function take(n){
  return function transducer(xf){
    var left = n
    return {
      init: function(){
        return xf.init()
      },
      step: function(aggregate, element){
        aggregate = xf.step(aggregate, element)
        if(--left <= 0){
          // we are done, so signal reduced
          return reduced(aggregate)
        }
        return aggregate
      },
      result: function(aggregate){
        return xf.result(aggregate)
      }
    }
  }
}
```
---
Take 2
```javascript
var transducer = take(3)
var baseXf = append
var init = []
var input = [1,2,3,4,5]
var output = transduce(transducer, baseXf, init, input)
// [1,2,3]
```
---
Take 2
```javascript
var transducer = compose(
    drop(1),    // [2,3,4,5]
    take(3),    // [2,3,4]
    drop(1))    // [3,4]
var baseXf = append
var init = []
var input = [1,2,3,4,5]
var output = transduce(transducer, baseXf, init, input)
// [3,4]
```
---
In Review
```javascript
function transducerFactory(/*factory args*/){
  return function transducer(xf/*:transformer*/){
    return /* transformed transformer */{
      init: function initialAggregate(){
        return xf.init()
      },
      step: function reducing(aggregate, element){
        // Optionally:
        //   1. Step to wrapped transformer
        //   2. Transform element
        //   3. Terminate with reduced
        //
        // Aggregate is off limits
        // Pass all the way to baseXf
        return xf.step(aggregate, element)
      },
      result: function resultExtraction(aggregate){
        // Optionally cleanup
        // Must check for reduced if stepped
        // Should call result on nested transformer.
        return xf.result(aggregate)
      }
    }
  }
}
```
---
In Review
```javascript
function transduce(transducer, baseXf, init, input){
  var xf = transducer(transformer(baseXf))
  return reduce(xf, init, input)
}

function reduce(xf, init, input){
  return arrayReduce(transformer(xf), init, input)
  // or objectReduce, iteratorReduce
}

function arrayReduce(xf, init, input){
  var aggregate = init
  for(var idx = 0; idx < input.length; idx++){
    var element = input[idx]
    aggregate = xf.step(aggregate, element)
    if(isReduced(aggregate)){
      aggregate = deref(aggregate)
      break
    }
  }
  return xf.result(aggregate)
}
```
---
Transducers are composable algorithmic transformations.

They are independent from the context of their input and output sources and specify only the essence of the transformation in terms of an individual element.

Because transducers are decoupled from input or output sources, they can be used in many different processes - collections, streams, channels, observables, etc.

Transducers compose directly, without awareness of input or creation of intermediate aggregates.

http://clojure.org/transducers
---
Transducers Explained

- https://github.com/kevinbeaty
- https://github.com/transduce
- http://simplectic.com/blog/
- Twitter: @simplectic
