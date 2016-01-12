var BaseClient = require( "./client" ),
	extend = require( "./extend" ),
	util = require( "util" );


function AutomateClient( settings ) {
	this.server = {
		host: "www.browserstack.com"
	};
	BaseClient.call( this, settings );
}
util.inherits( AutomateClient, BaseClient );


// public API
extend( AutomateClient.prototype, {

	getPlan: function( fn ) {
		this.request({
			path: this.path( "/plan.json" )
		}, fn );
	},

	getBrowsers: function( fn ) {
		this.request({
			path: this.path( "/browsers.json" )
		}, fn );
	},

	getProjects: function( fn ) {
		this.request({
			path: this.path( "/projects.json" )
		}, fn );  
	},

	getProject: function( id, fn ) {
		this.request({
			path: this.path( "/projects/" + id + ".json" )
		}, fn );  
	},
	
	getBuilds: function( options, fn ) {
		if (typeof fn === "undefined") {
			fn = options;
			options = {};
		}
		this.request({
			path: this.path( "/builds.json" )
		}, fn );  
	},
	
	getSessions: function( buildId, options, fn ) {
		if (typeof fn === "undefined") {
			fn = options;
			options = {};
		}
		this.request({
			path: this.path( "/builds/" + buildId + "/sessions.json" )
		}, fn );  
	},
	
	getSession: function( id, fn ) {
		this.request({
			path: this.path( "/sessions/" + id + ".json" )
		}, fn );  
	},
	
	getSessionLogs: function( buildId, id, fn ) {
		this.request({
			path: this.path( "/builds/" + buildId + "/sessions/" + id + "/logs" )
		}, fn );  
	},

	updateSession: function( id, options, fn ) {
		var data = JSON.stringify( options );
		this.request({
			method: "PUT",
			path: this.path( "/sessions/" + id + "/.json" )
		}, data, fn );
	},

});


// internal API
extend( AutomateClient.prototype, {

	path: function( path ) {
		return "/automate" + path;
	}

});

module.exports = {
	createClient: function ( settings ) {
		return new AutomateClient( settings );
	}
};
