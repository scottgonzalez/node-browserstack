var http = require( "http" ),
	querystring = require( "querystring" );

function extend( a, b ) {
	for ( var p in b ) {
		a[ p ] = b[ p ];
	}

	return a;
};

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

extend( Client.prototype, {
	version: 1,

	getBrowsers: function( fn ) {
		this.request({
			path: this.path( "/browsers" )
		}, fn );
	},

	createWorker: function( options, fn ) {
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

	path: function( path ) {
		return "/" + this.version + path;
	},

	request: function( options, data, fn ) {
		if ( typeof data === "function" ) {
			fn = data;
			data = null;
		}
		fn = fn || function() {};

		var headers = {
			authorization: this.authHeader
		};
		headers[ "content-length" ] = typeof data === "string" ? data.length : 0;

		var req = http.request( extend({
			host: "api.browserstack.com",
			port: 80,
			method: "GET",
			headers: headers
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
	}
});

module.exports = {
	createClient: function( settings ) {
		return new Client( settings );
	}
};
