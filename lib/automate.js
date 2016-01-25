var util = require("util");
var querystring = require("querystring");
var BaseClient = require("./client");
var extend = require("./extend");

function AutomateClient(settings) {
	this.server = {
		host: "www.browserstack.com"
	};
	BaseClient.call(this, settings);
}

util.inherits(AutomateClient, BaseClient);

// public API
extend(AutomateClient.prototype, {
	getPlan: function(fn) {
		this.request({
			path: this.path("/plan.json")
		}, fn);
	},

	getBrowsers: function(fn) {
		this.request({
			path: this.path("/browsers.json")
		}, fn);
	},

	getProjects: function(fn) {
		this.request({
			path: this.path("/projects.json")
		}, function(error, response) {
			if (error) {
				return fn(error);
			}

			response = response.map(function(value) {
				return value.automation_project;
			});
			fn(null, response);
		});
	},

	getProject: function(id, fn) {
		this.request({
			path: this.path("/projects/" + id + ".json")
		}, function(error, response) {
			if (error) {
				return fn(error);
			}

			response = response.project;
			response.builds = response.builds.map(function(value) {
				return value.automation_build;
			});
			fn(null, response);
		});
	},

	getBuilds: function(options, fn) {
		if (typeof options === "function") {
			fn = options;
			options = {};
		}

		this.request({
			path: this.path("/builds.json?" + querystring.stringify(options))
		}, function(error, response) {
			if (error) {
				return fn(error);
			}

			response = response.map(function(value) {
				return value.automation_build;
			});
			fn(null, response);
		});
	},

	getSessions: function(buildId, options, fn) {
		if (typeof fn === "undefined") {
			fn = options;
			options = {};
		}

		this.request({
			path: this.path("/builds/" + buildId + "/sessions.json?" +
				querystring.stringify(options))
		}, function(error, response) {
			if (error) {
				return fn(error);
			}

			response = response.map(function(value) {
				return value.automation_session;
			});
			fn(null, response);
		});
	},

	getSession: function(id, fn) {
		this.request({
			path: this.path("/sessions/" + id + ".json")
		}, function(error, response) {
			if (error) {
				return fn(error);
			}

			response = response.automation_session;
			fn(null, response);
		});
	},

	updateSession: function(id, options, fn) {
		var data = JSON.stringify(options);
		this.request({
			method: "PUT",
			path: this.path("/sessions/" + id + "/.json")
		}, data, fn);
	}

});

// internal API
extend(AutomateClient.prototype, {
	path: function(path) {
		return "/automate" + path;
	}
});

module.exports = {
	createClient: function(settings) {
		return new AutomateClient(settings);
	}
};
