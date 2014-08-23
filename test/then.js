var assert = require("assert"),
	Promise = require('promise'),
	Mock = require('mockjs'),
	http = require('http');

describe('resolve', function() {

	it('should resolve as correct', function(done) {
		var promise = new Promise(function(resolve, reject) {
			resolve("correct");
		});
		promise.then(function(result) {
			assert.equal("correct", result);
		}).then(function(){
			done();
		}, function(err) {
			done(err);
		});
	});

	it('should reject with error', function(done) {
		var promise = new Promise(function(resolve, reject) {
			reject("error");
		});
		promise.then(null, function(err) {
			assert.equal("error", err);
		}).then(function() {
			done();
		}, function(err) {
			done(err);
		});
	});
});

describe('async', function() {
	it('should resolve after a few seconds', function(done) {
		var promise = new Promise(function(resolve, reject) {
			setTimeout(function() {
				resolve(1);
			}, 2000);
		});
		promise.then(function(val) {
			assert.equal(val, 1);
		}).then(function() {
			done();
		}, function(err) {
			done(err);
		});
	});

	it('should resolve normal http request', function(done) {
		var promise = new Promise(function(resolve, reject) {
				http.get('http://code.jquery.com/jquery-latest.js', function(res) {
					resolve(res.statusCode);
				});
			});
		promise.then(function(code) {
			assert.equal(code, 200);
		}).then(function() {
			done();
		}, function(err) {
			done(err);
		});
	});

	it('should reject unreachable request', function(done) {
		var promise = new Promise(function(resolve, reject) {
			var req = http.get('http://code.jquery.com/is/not/cool.js', function(res) {
				if(res.statusCode == 404) {
					reject('error');
				}
			});
			req.end();
		});
		promise.then(null, function(error) {
			assert.equal(error, 'error');
		}).then(function() {
			done();
		}, function(err) {
			done(err);
		});
	});
	
});

describe('chainable', function() {
	it('should add one for the result', function(done) {
		var promise = new Promise(function(resolve, reject) {
			resolve(1);
		});

		promise.then(function(val) {
			return val+1;
		}).then(function(val) {
			assert.equal(val, 2);
		}).then(function() {
			done();
		}, function(err) {
			done(err);
		});
	});

	it('should convert to JSON', function(done) {
		var user = {name: 'Shark', age: 29},
			promise = new Promise(function(resolve, reject) {
				resolve(user);
			});
		promise.then(JSON.stringify).then(function(user) {
			assert.equal(user, '{"name":"Shark","age":29}');
		}).then(function() {
			done();
		}, function(err) {
			done(err);
		});
	});

	it('should continue async operation', function() {

	});
});