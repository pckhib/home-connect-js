# home-connect-js

This is a JavaScript library for the BSH Home Connect API. It uses the Swagger API.

## Requirements
For usage a Client ID is required. This can be received from the home connect developer page:

https://developer.home-connect.com/

* After setting up an account, register a new application and select **Authorization Code Grant Flow** as the OAuth Flow.
* The Redirect URI must be **http://localhost:3000/o2c**. This will be used to receive the authorization code.

## Installation
To install the library, run one of the following commands:
```
yarn add home-connect-js
// or
npm install home-connect-js
```

## Usage
```js
const HomeConnect = require('./main');

const hc = new HomeConnect(/* client id */, /* client secret */);
hc.init({
    isSimulated: false // whether or not to use simulated instead of physical devices (for testing)
})
.then(() => {
    // Get a list of all available appliances
    hc.command('default', 'get_home_appliances')
    .then(result => {
        console.log(result);
    });

    // Subscribe for events for specific appliance
    hc.subscribe(/* haid */, 'NOTIFY', callback);
    
    // Unsubscribe for events for specific appliance
    hc.unsubscribe(/* haid */, 'NOTIFY', callback);
});
```
