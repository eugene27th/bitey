export const apiError = class {
    constructor(status, code, extra) {
        this.status = status;
        this.code = code;

        if (extra) {
            this.extra = extra;
        };
    }
};