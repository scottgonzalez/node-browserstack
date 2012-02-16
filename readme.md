# node-browserstack

A node.js JavaScript client for working with [BrowserStack](http://browserstack.com) through its [API](https://github.com/browserstack/api).

## Installation

```
npm install browserstack
```

## Usage

```javascript
var BrowserStack = require( "browserstack" );
var client = BrowserStack.createClient({
	username: "foo",
	password: "p455w0rd!!1"
});

client.getBrowsers(function( error, browsers ) {
	console.log( "The following browsers are available for testing" );
	console.log( browsers );
});
```

## API

### BrowserStack.createClient( settings )

Creates a new client instance.

* `settings`: A hash of settings that apply to all requests for the new client.
  * `username`: The username for the BrowserStack account.
  * `password`: The password for the BrowserStack account.
  * `version` (optional; default: `1`): Which version of the BrowserStack API to use.

*Note: A special value of "latest" is supported for `version`, which will use the latest stable version.*

### client.getBrowsers( callback )

Gets the list of available browsers.

* `callback` (`function( error, browsers )`): A callback to invoke when the API call is complete.
  * `browsers`: An array of objects with `browser` and `version` properties. 

### client.createWorker( settings, callback )

Creates a worker.

* `settings`: A hash of settings for the worker.
  * `browser`: Which browser to use in the new worker.
  * `version`: Which version of the specified browser to use.
  * `url` (optional): Which URL to navigate to upon creation.
  * `timeout` (optional): Maximum life of the worker (in seconds). Use 0 for "forever" (BrowserStack will kill the worker after 1,800 seconds).
* `callback` (`function( error, worker )`): A callback to invoke when the API call is complete.
  * `worker` An object with an `id` property for the worker that was created.

### client.getWorker( id, callback )

Gets the status of a worker.

* `id`: The id of the worker.
* `callback` (`function( error, worker )`): A callback to invoke when the API call is complete.
  * `worker`: An object with `id`, `browser`, and `status` properties for the worker.

### client.terminateWorker( id, callback )

Terminates an active worker.

* `id`: The id of the worker to terminate.
* `callback` (`function( error, data )`): A callback to invoke when the API call is complete.
  * `data`: An object with a `time` property indicating how long the worker was alive.

### client.getWorkers( callback )

Gets the status of all workers.

* `callback` (`function( error, workers )`): A callback to invoke when the API call is complete.
  * `workers`: An array of objects containing with `id`, `browser`, and `status` properties.

### client.getLatest( browser, callback )

Gets the latest version of a browser.

* `browser`: Which browser to get the latest version for.
* `callback` (`function( error, version )`): A callback to invoke when the version is determined.
  * `version`: The latest version of the browser.

### client.getLatest( callback )

Gets the latest version of all browsers.

* `callback` (`function( error, versions )`): A callback to invoke when the versions are determined.
  * `versions`: An hash of browser names and versions.

## License

node-browserstack is licensed under the MIT license.
