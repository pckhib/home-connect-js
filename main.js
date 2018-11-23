const utils = require('./lib/utils');

class HomeConnect {

    constructor(clientId, clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    init() {
        return new Promise((resolve, reject) => {
            return utils.authorize(this.clientId, this.clientSecret)
            .then(tokens => {
                this.tokens = tokens;
                return utils.getClient(this.tokens.access_token);
            })
            .then(client => {
                this.client = client;
                resolve();
            });
        });
    }

    async command(tag, operationId, haid, body) {
        if (Date.now() > (this.tokens.timestamp + this.tokens.expires_in)) {
            this.tokens = await utils.refreshToken(this.clientSecret, this.tokens.refresh_token);
            this.client = await utils.getClient(this.tokens.access_token);
        }
        return this.client.apis[tag][operationId]({ ...haid, ...body });
    }
}