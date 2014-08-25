// from --> https://github.com/visionmedia/co/blob/master/index.js

function co (fn) { //generatorFunction

	return function() {
		var ctx = this,
			gen = fn;

		function next() {
			// this return is a function, because of thunkify
			var ret = gen.next(); 
			if('function' == ret.value) {
				// second argument is callback
				ret.value.call(ctx, function() {
					next.apply(ctx, arguments);
				});
			}
		}

		// call every generator's next step by step
		next();
	}
}


// ======================= The isXXX Function ============================= //
function isGenerator(obj) {
	return obj && 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

function isGeneratorFunction(obj) {
	return obj && obj.constructor && 'generatorFunction' == obj.constructor.name;
}

function isPromise(obj) {
	return obj && 'function' == typeof obj.then;
}

module.exports = co;