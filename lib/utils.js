const SwaggerClient = require('swagger-client');
const request = require('request');

async function authorize(clientId, clientSecret) {
    let authCode = await getAuthorizationCode(clientId);
    let tokens = await getTokens(clientId, clientSecret, authCode);
    return tokens;
}

function getClient(accessToken) {
    return new Promise((resolve, reject) => {
        SwaggerClient({
            url: 'https://apiclient.home-connect.com/hcsdk.yaml',
            requestInterceptor: req => {
                req.headers['accept'] = 'application/vnd.bsh.sdk.v1+json',
                req.headers['authorization'] = 'Bearer ' + accessToken
            }
        })
        .then(client => {
            resolve(client);
        });
    });
}

function refreshToken(clientSecret, refreshToken) {
    return new Promise((resolve, reject) => {
        request.post({
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            url: 'https://simulator.home-connect.com/security/oauth/token',
            body: 'grant_type=refresh_token&client_secret=' + clientSecret + '&refresh_token=' + refreshToken
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                const json = JSON.parse(body);
                resolve({
                    access_token: json.access_token,
                    refresh_token: json.refresh_token,
                    expires_in: json.expires_in,
                    timestamp: Date.now()
                });
            } else {
                reject(error);
            }
        });
    });
}

/**
 * Private functions
 */

function getAuthorizationCode(clientId) {
    return new Promise((resolve, reject) => {
        let url = 'https://simulator.home-connect.com/security/oauth/authorize';
        request.get({
            url: url + '?client_id=' + clientId + '&response_type=code'
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                resolve(response.request.uri.query);
            } else {
                reject(error);
            }
        });
    });
}

function getTokens(clientId, clientSecret, authCode) {
    return new Promise((resolve, reject) => {
        request.post({
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            url: 'https://simulator.home-connect.com/security/oauth/token',
            body: 'client_id=' + clientId + '&client_secret=' + clientSecret + '&' + authCode
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                const json = JSON.parse(body);
                resolve({
                    access_token: json.access_token,
                    refresh_token: json.refresh_token,
                    expires_in: json.expires_in,
                    timestamp: Date.now()
                });
            } else {
                reject(error);
            }
        });
    });
}

module.exports = {
    authorize,
    getClient,
    refreshToken
};