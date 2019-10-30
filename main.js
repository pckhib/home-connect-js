const EventSource = require('eventsource');
const utils = require('./lib/utils');
const EventEmitter = require('events');

class HomeConnect extends EventEmitter {
    constructor(clientId, clientSecret, refreshToken) {
      super()
      this.clientId = clientId;
      this.clientSecret = clientSecret;
      this.tokens = {}
      this.tokens.refresh_token = refreshToken;
      this.eventSources = {};
      this.eventListeners = {};
      this.tokenRefreshTimeout = null
    }

    async init(options) {
        global.isSimulated = (options != undefined
            && 'isSimulated' in options
            && typeof options.isSimulated === 'boolean') ? options.isSimulated : false;

        try {
            // refresh tokens or authorize app
            this.tokens = await (this.tokens.refresh_token ?
                utils.refreshToken(this.clientSecret, this.tokens.refresh_token)
                :
                utils.authorize(this.clientId, this.clientSecret))

            // schendule token refresh
            if (!this.tokenRefreshTimeout) {
                const timeToExpire = (this.tokens.timestamp + this.tokens.expires_in * 0.9) - Math.floor(Date.now() / 1000)
                this.tokenRefreshTimeout = setTimeout(() => this.refreshTokens(), timeToExpire * 1000)
            }
    
            this.emit("newRefreshToken", this.tokens.refresh_token);
            this.client = await utils.getClient(this.tokens.access_token);
        } catch (error) {
            throw error
        }
    }

    async command(tag, operationId, haid, body) {
        try {
            return this.client.apis[tag][operationId]({ haid, body })
        } catch (error) {
            throw error
        }
    }

    subscribe(haid, event, callback) {
        if (this.eventSources && !(haid in this.eventSources)) {
            const url = isSimulated ? urls.simulation.base : urls.physical.base;
            const eventSource = new EventSource(url + 'api/homeappliances/' + haid + '/events', {
                headers: {
                    accept: 'text/event-stream',
                    authorization: 'Bearer ' + this.tokens.access_token
                }
            });
            this.eventSources = { ...this.eventSources, [haid]: eventSource };
        }

        if (this.eventListeners && !(haid in this.eventListeners)) {
            const listeners = new Map()
            listeners.set(event, callback)
            this.eventListeners = { ...this.eventListeners, [haid]: listeners }
        }

        this.eventSources[haid].addEventListener(event, callback);
        this.eventListeners[haid].set(event, callback)
    }

    unsubscribe(haid, event, callback) {
        if (this.eventSources && haid in this.eventSources) {
            this.eventSources[haid].removeEventListener(event, callback);
        }
        if (this.eventListeners && haid in this.eventListeners) {
            this.eventListeners[haid].delete(event)
        }
    }

    async refreshTokens(){
        clearTimeout(this.tokenRefreshTimeout)
        let timeToNextTokenRefresh
        try {
            this.tokens = await utils.refreshToken(this.clientSecret, this.tokens.refresh_token);
            this.emit("newRefreshToken", this.tokens.refresh_token);
            this.client = await utils.getClient(this.tokens.access_token);
            this.recreateEventSources()
            timeToNextTokenRefresh = (this.tokens.timestamp + this.tokens.expires_in * 0.9) - Math.floor(Date.now() / 1000)
        } catch (event) {
            timeToNextTokenRefresh = 60
            throw event
        }
        // schendule token refresh
        this.tokenRefreshTimeout = setTimeout(() => this.refreshTokens(), timeToNextTokenRefresh * 1000)
    }

    recreateEventSources() {
        for (const haid of Object.keys(this.eventSources)) {
            // close EventSourve
            this.eventSources[haid].close()
            // remove all EventListeners from EventSource
            for (const [ event, callback ] of this.eventListeners[haid]) {
                this.eventSources[haid].removeEventListener(event, callback)
            }
            // create new EventSource with current acces_token
            const url = isSimulated ? urls.simulation.base : urls.physical.base;
            this.eventSources[haid] = new EventSource(
                url + 'api/homeappliances/' + haid + '/events',
                {
                    headers: {
                        accept: 'text/event-stream',
                        authorization: 'Bearer ' + this.tokens.access_token
                    }
                }
            )
            // aply old EventListeners
            for (const [ event, callback ] of this.eventListeners[haid]) {
                this.eventSources[haid].addEventListener(event, callback)
            }
        }
    }
}

module.exports = HomeConnect;
