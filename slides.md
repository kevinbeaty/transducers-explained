---
Transducers Explained
---
Reduce

```javascript
var summed = [2,3,4].reduce(sum, 1);
// 10 (=1+2+3+4)

function sum(result, item){
  return result + item;
}
```
---
Reduce

```javascript
var multed = [2,3,4].reduce(mult, 1);
// 24 (=1*2*3*4)

function mult(result, item){
  return result * item;
}
```
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
var xf = transformer(sum);
var output = input.reduce(xf.step, xf.init());
// output = 10 (=1+2+3+4)
```
---
Transformer
```javascript
var xf = transformer(mult);
var output = input.reduce(xf.step, xf.init());
// output = 24 (=1*2*3*4)
```
---
Reduce
```javascript
function reduce(xf, init, input){
  var result = input.reduce(xf.step, init);
  return xf.result(result);
}
```
---
Reduce
```javascript
var input = [2,3,4];
var xf = transformer(sum);
var output = reduce(xf, xf.init(), input);
// output = 10 (=1+2+3+4)
```
---
Reduce
```javascript
var input = [2,3,4];
var xf = transformer(mult);
var output = reduce(xf, xf.init(), input);
// output = 24 (=1*2*3*4)
```
---
Reduce
```javascript
var input = [2,3,4];
var xf = transformer(sum);
var output = reduce(xf, 2, input);
// output = 11 (=2+2+3+4)
```
---
Reduce
```javascript
var input = [2,3,4];
var xf = transformer(mult);
var output = reduce(xf, 2, input);
// output = 48 (=2*2*3*4)
```
