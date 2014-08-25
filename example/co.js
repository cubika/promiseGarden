var co = require('co');
var fs = require('fs');
var thunk = require('thunkify');
var request = require('request');

// 1. Simple Read File
(function() {
	function read (file) {
		return function (fn) {
			fs.readFile(file, 'utf8', fn);
		}
	}

	co(function *() {
		var a = yield read('.gitignore');
		var b = yield read('package.json');
		console.log("Simple Read: " + a);
		console.log("Simple Read: " + b);
	})()
})();

// 2. array
(function() {
	function size(file) {
		return function(fn) {
			fs.stat(file, function(err, stat) {
				if(err) return fn(stat);
				fn(null, stat.size);
			});
		}
	}

	// two concurrent stat()s
	co(function * () {
		var a = yield [size('.gitignore'), size('package.json')];
		var b = yield [size('.gitignore'), size('package.json')];
		console.log("Method 1: " + a);
		console.log("Method 1: " + b);
	})()

	// four concurrent stat()
	co(function * () {
		var a = [size('.gitignore'), size('package.json')];
		var b = [size('.gitignore'), size('package.json')];
		var c = yield [a, b];
		console.log("Method 2: " + c);
	})()

	// two concurrent stat()
	co(function * () {
		var a = size('.gitignore');
		var b = size('package.json');
		var c = yield [a, b];
		console.log("Method 3: " + c);
	})()
})();

// 3. Thunk and with arguments
(function() {
	var thunkRead = thunk(fs.readFile);

	function * sizeGen(file1, file2) {
		var a = thunkRead(file1);
		var b = thunkRead(file2);

		return [
			(yield a).length,
			(yield b).length
		];
	}

	var thunkSize = co(sizeGen);
	thunkSize('.gitignore', 'package.json', function(err, res) {
		if(err) return console.log(err);
		console.log(res);
	});
})();

// 4. generator-array
(function() {
	var get = thunk(request.get);

	function * latency(url, times) {
		var ret = [];
		while(times--) {
			var start = new Date;
			yield get(url);
			ret.push(new Date - start);
		}
		return ret;
	}

	// run each test in sequence
	co(function * (){
		var a = yield latency('http://google.com', 5);
		 console.log("Method 1: " + a);

		var b = yield latency('http://yahoo.com', 5);
		console.log("Method 1: " + b);
	})()

	// run in parallel
	co(function *(){
	  var a = latency('http://google.com', 5);
	  var b = latency('http://yahoo.com', 5);

	  var res = yield [a, b];
	  console.log("Method 2: " + res);
	})()
})();