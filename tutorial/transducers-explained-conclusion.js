// This is abbreviated source for [Transducers Explained Conlusion](http://simplectic.com/blog/2014/transducers-explained-conclusion/)
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

function isOdd(num){
  return num % 2 === 1;
}
function isEqual(y){
  return function(x){
    return x === y;
  };
}
function not(predicate){
  return function(x){
    return !predicate(x);
  };
}

function remove(predicate){
  return filter(not(predicate));
}

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

function transduce(transducer, stepper, init, input){
  if(typeof stepper === 'function'){
    stepper = wrap(stepper);
  }

  var xf = transducer(stepper);
  return reduce(xf, init, input);
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

var transducer = compose(
    drop(1),    // [2,3,4,5]
    take(3),    // [2,3,4]
    drop(1));   // [3,4]
var stepper = append;
var init = [];
var input = [1,2,3,4,5];
var output = transduce(transducer, stepper, init, input);
// [3,4]

function appending(toAppend){
  return function(xf){
    return {
      init: function(){
        return xf.init();
      },
      step: function(value, item){
        return xf.step(value, item);
      },
      result: function(value){
        value = xf.step(value, toAppend);
        if(isReduced(value)){
          value = deref(value);
        }
        return xf.result(value);
      }
    };
  };
}

var transducer = appending(7);
var stepper = append;
var init = [];
var input = [1,2,3,4,5];
var output = transduce(transducer, stepper, init, input);
// [1,2,3,4,5,7]

var transducer = compose(
    map(plus1),    // [2,3,4,5,6]
    appending(7)); // [2,3,4,5,6,7]
var stepper = append;
var init = [];
var input = [1,2,3,4,5];
var output = transduce(transducer, stepper, init, input);
// [2,3,4,5,6,7]

function xxx(){
  return function(xf){
    return {
      init: function(){
        // reserved for future use
        return xf.init();
      },
      step: function(value, item){
        // Optionally:
        //   1. Step to wrapped transformer
        //   2. Transform item
        //   3. Terminate with reduced
        //
        // Value/Accumulator is off limits
        // Pass all the way to stepper
        return xf.step(value, item);
      },
      result: function(value){
        // Optionally cleanup
        // Must check for reduced if stepped
        // Should call result on nested transformer.
        return xf.result(value);
      }
    };
  };
}

function transduce(transducer, stepper, init, input){
  if(typeof stepper === 'function'){
    stepper = wrap(stepper);
  }

  var xf = transducer(stepper);
  return reduce(xf, init, input);
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
