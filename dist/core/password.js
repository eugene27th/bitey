const config = require(`${process.cwd()}/config.json`);

if (!config.password) {
    return module.exports = null;
};

const util = require(`util`);
const crypto = require(`crypto`);

const scrypt = util.promisify(crypto.scrypt);


const hash = async function(password, salt) {
    if (!salt) {
        salt = crypto.randomBytes(8).toString(`hex`);
    };

    return `${(await scrypt(password, `${salt}${config.password.salt}`, config.password.length)).toString(`hex`)}${salt}`;
};

const compare = async function(password, encrypted) {
    return crypto.timingSafeEqual(Buffer.from(await hash(password, encrypted.slice(-16))), Buffer.from(encrypted));
};


module.exports = {
    hash,
    compare
};