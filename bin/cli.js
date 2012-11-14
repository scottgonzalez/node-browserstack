#!/usr/bin/env node

var browserstack = require('../lib/browserstack');
var fs = require('fs');
var path = require('path');
var cmd = require('commander');
var async = require('async');


// ## Helpers
function extend( a, b ) {
	for ( var p in b ) {
		a[ p ] = b[ p ];
	}
	return a;
}

// Parse a string into a dictionary with the given keys.
function parsePair(str, key1, separator, key2) {
	var arr = str.split(separator);
	var obj = {};
	obj[key1] = arr[0];
	obj[key2] = arr[1];
	return obj;
}

// Parse browser:version into {browser, version}.
//
// Example: parseBrowser("firefox:3.6") produces:
//
// ```
// {browser: "firefox", version: "3.6"}
// ```
function parseBrowser(str) {
	return parsePair(str, "browser", ":", "version");
}

// Parse username:password into {username, password}.
//
// Example: parseBrowser("dougm:fruity777") produces:
//
// ```
// {username: "dougm", password: "fruity777"}
// ```
function parseUser(str) {
	return parsePair(str, "username", ":", "password");
}

// Kill a running browser
function killBrowser(bs, id) {
	console.log('Killing browser...');
	bs.terminateWorker(id, function(err, results) {
		exitIfError(err);
		console.log('...done.');
	});
}

// ## Config File
// Located at ``~/.browserstack.json``
var config = {};
var CONFIG_FILE = path.join(process.env.HOME, "/.browserstack.json");
// Try load a config file from user's home directory
try {
	config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
} catch(e) {}

// Create a browserstack client.
function createClient(settings) {
	settings = settings || {};
	settings.version = settings.version || 1;

	// Get authentication data
	var auth;

	if(cmd.user) {
		// get auth from commandline
		auth = parseUser(cmd.user);
	} else if(config.username && config.password) {
		// get auth info from config
		auth = {
			username: config.username,
			password: config.password
		};
	} else {
		console.error('Authentication required. Use option "--user" or put a "username" and "password" in ' + CONFIG_FILE);
		process.exit(1);
	}

	return browserstack.createClient(extend(settings, auth));
}

// ## CLI
cmd.version('0.1.0')
.option('-u, --user <user:password>', 'Launch authentication username:password')
.option('-t, --timeout <seconds>', "Launch duration after which browsers exit")
.option('--attach', "Attach process to remote browser.");

// ### Command: launch
cmd.command('launch <browser> <url>')
.description('Launch remote browser:version at a url. e.g. browserstack firefox:3.6 http://google.com')
.action(function(browserVer, url) {

	var options = parseBrowser(browserVer);
	options.url = url;
	options.timeout = cmd.timeout;

	var bs = createClient();

	options.timeout =
		cmd.timeout ? cmd.timeout :
		cmd.attach  ? 0 :
		/* else */    30;

	bs.createWorker(options, function(err, worker) {
		exitIfError(err);

		console.log('Launched ' + browserVer + ' at ' + url);

		if(cmd.attach) {
			attach(function() {
				killBrowser(bs, worker.id);
			});
		}
	});
});

// ### Command: kill
cmd.command('kill <id>')
.description('Kill a running browser. An id of "all" will kill all running browsers')
.action(function(id) {
	var bs = createClient();
	if (id !== "all") {
		killBrowser(bs, id);

	} else {
		console.log('Killing all workers...');
		bs.getWorkers(function(err, workers) {
			exitIfError(err);

			async.forEach(workers, function(worker, cb) {
				bs.terminateWorker(worker.id, cb);

			}, function() {
				console.log('...done');
			});
		});
	}
});

// ### Command: list
cmd.command('list')
.description('List running browsers')
.action(function() {
	createClient().getWorkers(function(err, result) {
		exitIfError(err);
		console.log(result);
	});
});

// ### Command: browsers
cmd.command('browsers')
.description('List available browsers and versions')
.action(function() {
	createClient().getBrowsers(function(err, result) {
		exitIfError(err);
		result.forEach(function(browser) {
			console.log(browser.browser + ":" + browser.version);
		});
	});
});

cmd.parse(process.argv);

// Show help if no arguments were passed.
if(!cmd.args.length) {
	cmd.outputHelp();
}


// ## Termination

function exitIfError(err) {
	if(err) {
		console.error(err.message);
		process.exit(1);
	}
}

// The cleanup work assigned by a command
function attach(cleanup) {
	// Keep this process alive
	process.stdin.resume();
	onExit = function() {
		// Allow process to die
		process.stdin.pause();
		cleanup();
	}
};

var onExit;

// Try to cleanup before exit
function niceExit() {
	if(onExit) {
		onExit();
		onExit = null;
	}
};

// Handle exiting
process.on('SIGINT', niceExit);
process.on('SIGTERM', niceExit);
process.on('exit', niceExit);