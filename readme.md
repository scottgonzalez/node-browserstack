# node-browserstack

A node.js JavaScript client for working with the [http://browserstack.com](BrowserStack) API.

## Usage

```javascript
var BrowserStack = require( "browserstack" );
var client = BrowserStack.createClient({
	username: "foo",
	password: "p455w0rd!!1"
});

client.getBrowsers(function( error, browsers ) {
	console.log( "The following browsers are avaialable for testing" );
	console.log( browsers );
});
```

## API

### BrowserStack.createClient( settings )

Creates a new client instance. Must provide username and password.

### client.getBrowsers( cb )

Gets the list of avaialable browsers.

### client.createWorker( options, cb )

Creates a worker.

### client.terminateWorker( id, cb )

Terminates an active worker.

## License

node-browserstack is licensed under the MIT license.
