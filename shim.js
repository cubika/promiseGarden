// copied from https://github.com/chemdemo/promiseA/blob/master/lib/Promise.js

// =============== Public Standard API =========================== //
function Promise(resolver) {
	// must be used as constructor
	if(!(this instanceof Promise)) return new Promise(resolver);

	this.status = "pending";
	this.value = null;
	this.reason = null;

	this.__resolves = [];
	this.__rejects = [];
	// call the resolver function immediately
	if(isFn(resolver)) {
		resolver(this.resolve.bind(this), this.reject.bind(this));
	}
	return this;
}

Promise.prototype.then = function(onFulfilled, onRejected) {
	var next = this._next || (this._next = Promise()); // empty promise
	var status = this.status;
	var x;

	// store the callbacks so we can call when state changed
	if('pending' === status) {
		isFn(onFulfilled) && this.__resolves.push(onFulfilled);
		isFn(onRejected) && this.__rejects.push(onRejected);
		return next;
	}

	// promise is already done, we cannot resolve 'this' promise, but a new one
	if('resolved' === status) {
		if(!isFn(onFulfilled)) { // may pass the resolved value directly
			next.resolve(onFulfilled);
		}else {
			try{
				// execute the callback
				x = onFulfilled(this.value);
				// resolve next with the returned promise
				resolveX(next, x);
			}catch(e) {
				this.reject(e);
			}
		}
		// each then method return a new Promise
		// be useful for chainable
		return next;
	}

	// same as resolved
	if('rejected' === status) {
		if(!isFn(onRejected)) {
			next.resolve(onRejected);
		}else {
			try{
				x = onRejected(this.value);
				resolveX(next, x);
			}catch(e) {
				this.reject(e);
			}
		}
		return next;
	}
}

Promise.prototype.resolve = function(value) {
	if('rejected' === this.status) throw Error('Illegal call');
	this.status = 'resolved';
	this.value = value;
	// we have our value now, so we iterate all the callbacks
	this.__resolves.length && fireQ(this);
	return this;
}

Promise.prototype.reject = function(reason) {
	if('resolved' === this.status) throw Error('Illegal call');
	this.status = 'rejected';
	this.reason = reason;
	this.__rejects.length && fireQ(this);
	return this;
}

Promise.resolve = function(value) {
	var p = new Promise();
	if(isThenable(value)) {
		return resolveThen(p, value);
	}else {
		return p.resolve(value);
	}
}

Promise.reject = function(reason) {
	var p = new Promise();
	p.reject(reason);
	return p;
}

Promise.all = function(promises) {
	var len = promises.length;
	var promise = Promise();
	var r = [];
	var pending = 0;
	var locked;

	each(promises, function(p, i) {
		p.then(function(v) {
			r[i] = v;
			if(++pending == len && !locked) promise.resolve(r); // resolve with [promises[0].value, promises[2].value, ...]
		}, function(e) {
			locked = true;
			promise.reject(e);
		});
	});
	return promise;
}


// =============== Internal function =========================== //

// resolve procedure
// --> see: http://promisesaplus.com/
function resolveX(promise, x) {
	// 2.3.1
	if(x === promise) {
		promise.reject(new Error('TypeError'));
	}
	if(x instanceof Promise) { // 2.3.2
		return resolvePromise(promise, x);
	}else if(isThenable(x)) { // 2.3.3
		return resolveThen(promise, x);
	}else { // 2.3.4
		return promise.resolve(x);
	}
}

function resolvePromise(promise, promise2) {
	var status = promise2.status;

	if('pending' === status) { // 2.3.2.1
		promise2.then(promise.resolve.bind(promise), promise.reject.bind(promise)); 
	}else if('resolved' === status) { // 2.3.2.2
		promise.resolve(promise2.value);
	}else if('rejected' === status) { // 2.3.2.3
		promise.reject(promise2.reason);
	}
}

function resolveThen(promise, thenable) {
	var called;
	var resolve = once(function(x) {
		if(called) return; // 2.3.3.3.3
		resolveX(promise, x); // 2.3.3.3.1
		called = true;
	});
	var reject = once(function(r) {
		if(called) return; // 2.3.3.3.3
		promise.reject(r); // 2.3.3.3.2
		called = true;
	});

	try{
		thenable.then.call(thenable, resolve, reject); // 2.3.3.3
	}catch(e) {
		if(!called) { // 2.3.3.3.4.1
			throw e;
		}else {
			promise.reject(e); // 2.3.3.2
		}
	}

	return promise;
}

// run all callbacks once
function fireQ(promise) {
	var status = promise.status;
	var queue = promise['resolved' === status ? '_resolves' : '_rejects'];
	var arg = promise['resolved' === status ? 'value' : 'reason'];
	var fn, x;

	while(fn = queue.shift()) {
		// call each callback(onFulfilled or onRejected)
		x = fn.call(promise, arg); 
		// resolve next promise with return value
		//TODO: write some scenario
		x && resolveX(promise._next, x); 
	}

	return promise;
}


// =============== Utility =========================== //
function isFn() {
	return 'function' === type(fn);
}

function type(obj) {
	var o = {};
    return o.toString.call(obj).replace(/\[object (\w+)\]/, '$1').toLowerCase();
}

// return function exactly as fn, except that it will only run once
function once(fn) {
	var called; //shared variable

	return function() {
		if(called) return;
		fn.apply(this, arguments);
		called = true;
	};
}

function each(arr, iterator) {
	for(var i=0; i<arr.length; i++) {
		iterator(arr[i], i, arr);
	}
}