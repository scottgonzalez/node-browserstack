#!/usr/bin/env node

var browserstack = require('../lib/browserstack');
var fs = require('fs');
var path = require('path');
var cmd = require('commander');
var async = require('async');

// Indefinite timeout. We use one day because browserstack cleans up their browsers once a day.
var FOREVER = 60 * 60 * 24;

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
	console.log('Killing worker ' + id);
	bs.terminateWorker(id, function(err, results) {
		exitIfError(err);
		console.log('Done.');
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
	settings.version = settings.version || 2;

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
.option('-u, --user <user:password>', 'Browserstack authentication')
.option('--os', 'The os of the browser or device. Defaults to win.')
.option('-t, --timeout <seconds>', "Launch duration after which browsers exit")
.option('--attach', "Attach process to remote browser.")
.option('-k, --key', "Tunnling key.")
.option('--ssl', "ssl flag for tunnel.");

// ### Command: launch
cmd.command('launch <browser> <url>')
.description('Launch remote browser:version at a url. e.g. browserstack firefox:3.6 http://google.com')
.action(function(browserVer, url) {

	var options = parseBrowser(browserVer);
	options.url = url;
	options.timeout = cmd.timeout == "0" || cmd.attach ? FOREVER : cmd.timeout || 30;
	options.os = cmd.os || 'win';

	var bs = createClient();

	console.log('Launching ' + browserVer + '...');

	bs.createWorker(options, function(err, worker) {
		exitIfError(err);

		console.log('Worker ' + worker.id + ' was created.');

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
		console.log('Killing all workers.');
		bs.getWorkers(function(err, workers) {
			exitIfError(err);

			async.forEach(workers, function(worker, cb) {
				bs.terminateWorker(worker.id, cb);

			}, function() {
				console.log('Done.');
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
		console.log(result);
	});
});

cmd.command('tunnel <host:port>')
.description('Create a browserstack tunnel')
.action(function(hostPort) {
	var host = parsePair(hostPort, 'name', ':', 'port');
	var key = cmd.key || config.key;
	if(!key) {
		console.error('Browserstack tunnel key required. Use option "--key" or put a "key" in ' + CONFIG_FILE);
		process.exit(1);
	}
	var tunnel = browserstack.createTunnel(key, host.name, host.port, cmd.ssl);

	tunnel.on('exit', function() {
		process.exit(1);
	});

	attach(function() {
		tunnel.kill('SIGTERM');
	});
});

cmd.command('*')
.action(function(unknown) {
	exitIfError({message: "Unknown command '"+unknown+"'."});
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

var onExit;

// The cleanup work assigned by a command
function attach(cleanup) {
	// Keep this process alive
	process.stdin.resume();
	onExit = function() {
		// Allow process to die
		process.stdin.pause();
		cleanup();
	};
}

// Try to cleanup before exit
function niceExit() {
	if(onExit) {
		onExit();
		onExit = null;
	}
}

// Handle exiting
process.on('SIGINT', niceExit);
process.on('SIGTERM', niceExit);
process.on('exit', niceExit);
