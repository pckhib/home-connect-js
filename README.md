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

    // Subscribe for events from specific appliance
    hc.subscribe(/* haid */, 'NOTIFY', callback);
    
    // Unsubscribe for events for specific appliance
    hc.unsubscribe(/* haid */, 'NOTIFY', callback);
});
```

## API
```js
// Make an API call
hc.command(tag, operationId, haid /* optional */, body /* optional */);

// Subscribe for events from specific appliance
hc.subscribe(haid, event, callback);

// Unsubscribe for events
hc.unsubscribe(haid, event, callback);
```
For the command request, the following tags and operationIds are available.
<details><summary>Available commands</summary>
<p>

```
{ default:
   { get_home_appliances: [Function],
     get_specific_appliance: [Function] },
  programs:
   { get_active_program: [Function],
     start_program: [Function],
     stop_program: [Function],
     get_active_program_options: [Function],
     set_active_program_options: [Function],
     get_active_program_option: [Function],
     set_active_program_option: [Function],
     get_selected_program: [Function],
     set_selected_program: [Function],
     get_selected_program_options: [Function],
     set_selected_program_options: [Function],
     get_selected_program_option: [Function],
     set_selected_program_option: [Function],
     get_available_programs: [Function],
     get_available_program: [Function] },
  images: { get_images: [Function], get_image: [Function] },
  settings:
   { get_settings: [Function],
     get_setting: [Function],
     set_setting: [Function] },
  status_events:
   { get_status: [Function],
     get_status_value: [Function] }
}
```

</p>
</details>

More information about each function is available in the API documentation: https://apiclient.home-connect.com/

For the available events checkout the official documentation: https://developer.home-connect.com/docs/monitoring/availabilitymatrix
