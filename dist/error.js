const api = class {
    constructor(status, code, extra) {
        this.status = status;
        this.code = code;

        if (extra) {
            this.extra = extra;
        };
    }
};


module.exports = {
    api
};