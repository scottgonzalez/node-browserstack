var http = require( "http" ),
	querystring = require( "querystring" ),
	userAgent = getUA();

function getUA() {
	var os = require( "os" ),
		version = require( "../package.json" ).version;
	return os.platform() + "/" + os.release() + " " +
		"node/" + process.versions.node + " " +
		"node-browserstack/" + version;
}

function extend( a, b ) {
	for ( var p in b ) {
		a[ p ] = b[ p ];
	}

	return a;
}

function Client( settings) {
	if ( !settings.username ) {
		throw new Error( "Username is required." );
	}
	if ( !settings.password ) {
		throw new Error( "Password is required." );
	}

	extend( this, settings );
	this.authHeader = "Basic " +
		new Buffer( this.username + ":" + this.password ).toString( "base64" );
}

// public API
extend( Client.prototype, {
	// BrowserStack API version
	version: 1,

	getBrowsers: function( fn ) {
		this.request({
			path: this.path( "/browsers" )
		}, function( error, browsers ) {
			if ( !error ) {
				this.updateLatest( browsers );
			}

			fn( error, browsers );
		}.bind( this ) );
	},

	createWorker: function( options, fn ) {
		if ( options.version === "latest" ) {
			return this.getLatest( options.browser, function( error, version ) {
				if ( error ) {
					return fn( error );
				}

				options = extend( {}, options );
				options.version = version;
				this.createWorker( options, fn );
			}.bind( this ) );
		}

		var data = querystring.stringify( options );
		this.request({
			path: this.path( "/worker" ),
			method: "POST"
		}, data, fn );
	},

	getWorker: function( id, fn ) {
		this.request({
			path: this.path( "/worker/" + id )
		}, fn );
	},

	terminateWorker: function( id, fn ) {
		this.request({
			path: this.path( "/worker/" + id ),
			method: "DELETE"
		}, fn );
	},

	getWorkers: function( fn ) {
		this.request({
			path: this.path( "/workers" )
		}, fn );
	},

	getLatest: function( browser, fn ) {
		var latest = this.latest;

		if ( typeof browser === "function" ) {
			fn = browser;
			browser = null;
		}

		// there may be a lot of createWorker() calls with "latest" version
		// so minimize the number of calls to getBrowsers()
		if ( this.latestPending ) {
			return setTimeout(function() {
				this.getLatest( browser, fn );
			}.bind( this ), 50 );
		}

		// only cache browsers for one day
		if ( !latest || this.latestUpdate < (new Date() - 864e5) ) {
			this.latestPending = true;
			return this.getBrowsers(function( error ) {
				this.latestPending = false;

				if ( error ) {
					return fn( error );
				}

				this.getLatest( browser, fn );
			}.bind( this ) );
		}

		process.nextTick(function() {
			fn( null, browser ? latest[ browser ] : extend( {}, latest ) );
		});
	}
});

// internal API
extend( Client.prototype, {
	latest: null,
	latestUpdate: 0,
	latestPending: false,

	path: function( path ) {
		return "/" + this.version + path;
	},

	request: function( options, data, fn ) {
		if ( typeof data === "function" ) {
			fn = data;
			data = null;
		}
		fn = fn || function() {};

		var req = http.request( extend({
			host: "api.browserstack.com",
			port: 80,
			method: "GET",
			headers: {
				authorization: this.authHeader,
				"user-agent": userAgent,
				"content-length": typeof data === "string" ? data.length : 0
			}
		}, options ), function( res ) {
			var response = "";
			res.setEncoding( "utf8" );
			res.on( "data", function( chunk ) {
				response += chunk;
			});
			res.on( "end", function() {
				if ( res.statusCode !== 200 ) {
					var message;
					if ( res.headers[ "content-type" ].indexOf( "json" ) !== -1 ) {
						message = JSON.parse( response ).message;
					} else {
						message = response;
					}
					if ( !message && res.statusCode === 403 ) {
						message = "Forbidden";
					}
					fn( new Error( message ) );
				} else {
					fn( null, JSON.parse( response ) );
				}
			});
		});

		if ( data ) {
			req.write( data );
		}
		req.end();
	},

	updateLatest: function( browsers ) {
		var latest = this.latest = {};

		this.latestUpdate = new Date();
		browsers.forEach(function( browser ) {
			var version = browser.version;

			// ignore pre-release versions
			if ( /\s/.test( version ) ) {
				return;
			}

			if ( parseFloat( version ) >
					(parseFloat( latest[ browser.browser ] ) || 0) ) {
				latest[ browser.browser ] = version;
			}
		});
	}
});

module.exports = {
	createClient: function( settings ) {
		return new Client( settings );
	}
};
