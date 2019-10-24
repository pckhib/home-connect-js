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
    }

    init(options) {
        global.isSimulated = (options != undefined
            && 'isSimulated' in options
            && typeof options.isSimulated === 'boolean') ? options.isSimulated : false;

        return new Promise((resolve, reject) => {

          if(this.tokens.refresh_token){
            utils.refreshToken(this.clientSecret, this.tokens.refresh_token)
            .then(tokens => {
                this.tokens = tokens;
                this.emit("newRefreshToken", tokens.refresh_token);
                return utils.getClient(this.tokens.access_token);
            })
            .then(client => {
                this.client = client;
                resolve();
            }).catch(reject);
          }else{
            utils.authorize(this.clientId, this.clientSecret)
            .then(tokens => {
                this.tokens = tokens;
                this.emit("newRefreshToken", tokens.refresh_token);
                return utils.getClient(this.tokens.access_token);
            })
            .then(client => {
                this.client = client;
                resolve();
            }).catch(reject);
          }
        });
    }

    async command(tag, operationId, haid, body) {
        if (Math.floor(Date.now()/1000) > (this.tokens.timestamp + this.tokens.expires_in)) {
            this.tokens = await utils.refreshToken(this.clientSecret, this.tokens.refresh_token);
            this.emit("newRefreshToken", this.tokens.refresh_token);
            this.client = await utils.getClient(this.tokens.access_token);
        }
        return this.client.apis[tag][operationId]({ haid, body });
    }

    subscribe(haid, event, cb) {
        if (this.eventSources && !(haid in this.eventSources)) {
            let url = isSimulated ? urls.simulation.base : urls.physical.base;
            const es = new EventSource(url + 'api/homeappliances/' + haid + '/events', {
                headers: {
                    accept: 'text/event-stream',
                    authorization: 'Bearer ' + this.tokens.access_token
                }
            });

            this.eventSources = { ...this.eventSources, [haid]: es };
        }

        this.eventSources[haid].addEventListener(event, cb);
    }

    unsubscribe(haid, event, cb) {
        if (this.eventSources && haid in this.eventSources) {
            this.eventSources[haid].removeEventListener(event, cb);
        }
    }
}

module.exports = HomeConnect;
