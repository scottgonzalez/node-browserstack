var https = require("https"),
	util = require( "util" ),
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

function Client( settings ) {
	if ( !settings.username ) {
		throw new Error( "Username is required." );
	}
	if ( !settings.password ) {
		throw new Error( "Password is required." );
	}

	extend( this, settings );
	this.authHeader = "Basic " +
		new Buffer( this.username + ":" + this.password ).toString( "base64" );

	this.server = extend({
		host: "www.browserstack.com"
	}, this.server || {});
}



// public API
extend( Client.prototype, {
	getBrowsers: function( fn ) {
		this.request({
			path: this.path( "/browsers.json" )
		}, fn );
	},

	getScreenshot: function( options, fn ) {
		var data = JSON.stringify( options );
		this.request({
			method: "POST",
			path: this.path( "" )
		}, data, fn );
	},

	getJob: function( id, fn ) {
		this.request({
			path: this.path( "/" + id + ".json" )
		}, fn );
	}
});



// internal API
extend( Client.prototype, {

	path: function( path ) {
		return "/screenshots" + path;
	},

	request: function( options, data, fn ) {
		if ( typeof data === "function" ) {
			fn = data;
			data = null;
		}

		fn = fn || function() {};

		var req = https.request( extend({
			host: this.server.host,
			port: this.server.port,
			method: "GET",
			headers: {
				authorization: this.authHeader,
				"content-type": "application/json",
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
						response = JSON.parse( response );
						message = response.message;
						if ( response.errors && response.errors.length ) {
							message += " - " + response.errors.map(function( error ) {
								return "`" + error.field + "` " + error.code;
							}).join( ", " );
						}
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

		req.on( "error", fn );

		if ( data ) {
			req.write( data );
		}

		req.end();
	}
});




module.exports = {
	createClient: function( settings ) {
		return new Client( settings );
	}
};
