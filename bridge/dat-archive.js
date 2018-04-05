const datDns = require('dat-dns')();

class DatArchive {
    constructor (url, {localPath, datOptions, netOptions} = {}) {

    }

    static async resolveName (name) {
        return datDns.resolveName(name);
    }
}

module.exports = DatArchive;