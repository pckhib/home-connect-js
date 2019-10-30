const SwaggerClient = require('swagger-client');
const request = require('request');
const opn = require('opn');
const express = require('express');

global.urls = {
    simulation: {
        base: 'https://simulator.home-connect.com/',
        api: 'https://apiclient.home-connect.com/hcsdk.yaml'
    },
    physical: {
        base: 'https://api.home-connect.com/',
        api: 'https://apiclient.home-connect.com/hcsdk-production.yaml'
    }
}

async function authorize(clientId, clientSecret) {
    let authCode = await getAuthorizationCode(clientId);
    let tokens = await getTokens(clientId, clientSecret, authCode);
    return tokens;
}

function getClient(accessToken) {
    return new Promise((resolve, reject) => {
        SwaggerClient({
            url: isSimulated ? urls.simulation.api : urls.physical.api,
            requestInterceptor: req => {
                req.headers['accept'] = 'application/vnd.bsh.sdk.v1+json',
                req.headers['authorization'] = 'Bearer ' + accessToken
            }
        })
        .then(client => {
            resolve(client);
        }).catch(reject);
    });
}

function refreshToken(clientSecret, refreshToken) {
    return new Promise((resolve, reject) => {
        request.post({
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            url: isSimulated ? urls.simulation.base + 'security/oauth/token' : urls.physical.base + 'security/oauth/token',
            body: 'grant_type=refresh_token&client_secret=' + clientSecret + '&refresh_token=' + refreshToken
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                const json = JSON.parse(body);
                resolve({
                    access_token: json.access_token,
                    refresh_token: json.refresh_token,
                    expires_in: json.expires_in,
                    timestamp: Math.floor(Date.now()/1000)
                });
            } else {
                reject(response);
            }
        });
    });
}

/**
 * Private functions
 */

function getAuthorizationCode(clientId) {
    return new Promise((resolve, reject) => {
        const app = express();
        app.get('/o2c', (req, res) => {
            res.send('Authorization complete. You can now close this window.');
            server.close();

            resolve(req.query.code);
        });
        const server = app.listen(3000);
        let url = isSimulated ? urls.simulation.base + 'security/oauth/authorize' : urls.physical.base + 'security/oauth/authorize';
        opn(url + '?client_id=' + clientId + '&response_type=code');
    });
}

function getTokens(clientId, clientSecret, authCode) {
    return new Promise((resolve, reject) => {
        request.post({
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            url: isSimulated ? urls.simulation.base + 'security/oauth/token' : urls.physical.base + 'security/oauth/token',
            body: 'client_id=' + clientId + '&client_secret=' + clientSecret + '&grant_type=authorization_code&code=' + authCode
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                const json = JSON.parse(body);
                resolve({
                    access_token: json.access_token,
                    refresh_token: json.refresh_token,
                    expires_in: json.expires_in,
                    timestamp: Math.floor(Date.now()/1000)
                });
            } else {
                reject(response);
            }
        });
    });
}

module.exports = {
    authorize,
    getClient,
    refreshToken
};