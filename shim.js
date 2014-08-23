var Resolver = function() {}

function Promise(resolver) {
	// must be used as constructor
	if(!(this instanceof Promise)) return new Promise(resolver);

	this.status = "pending";
	this.value = null;
	this.reason = null;

	this.__resolves = [];
	this.__rejects = [];
	if(isFn(resolver)) {
		resolver(this.resolve.bind(this), this.reject.bind(this));
	}
	return this;
}

Promise.prototype.then = function(onFulfilled, onRejected) {
	var next = this._next || (this._next = Promise());
	var status = this.status;
	var x;
	if('pending' === status) {
		isFn(onFulfilled) && this.__resolves.push(onFulfilled);
		isFn(onRejected) && this.__rejects.push(onRejected);
		return next;
	}

	if('resolved' === status) {
		if(!isFn(onFulfilled)) {
			next.resolve(onFulfilled);
		}else {
			try{
				x = onFulfilled(this.value);
				resolveX(next, x);
			}catch(e) {
				this.reject(e);
			}
		}
		return next;
	}

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
	
}