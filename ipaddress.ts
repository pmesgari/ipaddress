class _IPAddressBase {
    protected _splitOptionalNetmask(address) {
        let addr = address.split('/');
        if (addr.length > 2)
            throw new AddressValueError(`Only one "/" permitted in ${address}`);
        return addr;
    }
    protected _splitAddrPrefix(address) {
        let _address = address;
        if (!(_address instanceof Array)) {
            _address = this._splitOptionalNetmask(_address);
        }

        if (_address.length > 1)
            return _address;
        return [_address[0], IPv4Address.maxPrefixLen];
    }
    static isAsciiDigit(str) {
        return str.match(/^[0-9]*$/g);
    };
}

class IPv4Address extends _IPAddressBase {
    address: string;
    _ip: Number;

    static maxPrefixLen = 32;

    constructor(address: string | Number) {
        super();

        if (typeof address == 'number') {
            this._ip = address;
            return
        }
        let addrStr = address.toString();
        if (addrStr.indexOf('/') !== -1)
            throw new AddressValueError(`Unexpected '/' in ${addrStr}`);

        this._ip = IPv4Address.ipIntFromString(addrStr);
    }

    ip() {
        return this._ip;
    }

    equals(other) {
        return this._ip == other._ip;
    }

    static ipIntFromString(ipStr) {
        let octets = ipStr.split('.');
        if (octets.length !== 4)
            throw new AddressValueError(`Expected 4 octets in ${ipStr}`);
        try {
            return octets
                .map(octet => this.parseOctet(octet))
                .map((item) => Number(item))
                .reverse() // we want big endian int
                .reduce((acc, val, index) => acc + (val * (256**index)), 0);
        } catch (e) {
            throw new AddressValueError(`${e.toString()} in ${ipStr}`)
        }
    }

    static parseOctet(octetStr) {
        if (!octetStr)
            throw new ValueError('Empty octet not permitted');
        if (!this.isAsciiDigit(octetStr))
            throw new ValueError(`Only decimal digits permitted in ${octetStr}`);
        if (octetStr.length > 3)
            throw new ValueError(`At most 3 characters permitted in ${octetStr}`);
        let octetInt = parseInt(octetStr);
        if (octetInt > 255)
            throw new ValueError(`Octet ${octetStr} (> 255) not permitted`);
        return octetInt;
    }

}

class IPv4Network extends _IPAddressBase {
    static _ALL_ONES = (2**32) - 1;
    static MAX_PREFIX_LENGTH = 32;
    networkAddress: IPv4Address;
    netmask: IPv4Address;
    prefixlen: Number;

    constructor(address) {
        super();

        let [addr, mask] = this._splitAddrPrefix(address);
        this.networkAddress = new IPv4Address(addr);
        let [netmask, prefixlen] = IPv4Network.makeNetmask(mask);
        this.netmask = netmask;
        this.prefixlen = prefixlen;
    }

    static _prefixFromPrefixString(prefixlenStr) {
        let prefixlen;

        if (!this.isAsciiDigit(prefixlenStr))
            throw new NetmaskValueError(`${prefixlenStr} is not a valid netmask`);
        
        prefixlen = parseInt(prefixlenStr);
        if (prefixlen <=0 || prefixlen >= this.MAX_PREFIX_LENGTH)
            throw new NetmaskValueError(`${prefixlenStr} is not a valid netmask`);

        return prefixlen;
    }

    static prefixFromIpInt(ipInt) {
        let trailingZeros = 8;
        let prefixlen = 32 - trailingZeros;
        return prefixlen;
    }

    static ipIntFromPrefix(prefixlen) {
        return Number(BigInt(IPv4Network._ALL_ONES) ^ (BigInt(IPv4Network._ALL_ONES >>> prefixlen)));
    };

    static _prefixFromIpString(ipStr) {
        let ipInt;
        try {
            ipInt = IPv4Address.ipIntFromString(ipStr);
        } catch (e) {
            throw new NetmaskValueError(`${ipStr} is not a valid netmask`);
        }
        return IPv4Network.prefixFromIpInt(ipInt);
    }

    static makeNetmask(arg) {
        let prefixlen;
        if (arg instanceof Number)
            prefixlen = arg;
        else {
            try {
                prefixlen = this._prefixFromPrefixString(arg);
            } catch (e) {
                prefixlen = this._prefixFromIpString(arg);
            }
        }
        let netmask = new IPv4Address(IPv4Network.ipIntFromPrefix(prefixlen));
        return [netmask, prefixlen];
    }
    static ipFromPrefix(prefixlen: any): string {
        throw new Error("Method not implemented.");
    }
}

class IPv4Interface extends IPv4Address {
    addr: string;
    mask: string;
    network: IPv4Network;
    private _prefixlen: string;

    constructor(address) {
        super(address);
        let [addr, mask] = this._splitAddrPrefix(address);
        this.network = new IPv4Network([addr, mask]);
        this._prefixlen = '';
    }

}


class ValueError extends Error {
    constructor(message) {
        super();
        this.message = message;
        this.name = "ValueError";
    }
}


class AddressValueError extends Error {
    constructor(message) {
        super();
        this.message = message;
        this.name = "AddressValueError";
    }
}

class NetmaskValueError extends Error {
    constructor(message) {
        super();
        this.message = message;
        this.name = "NetmaskValueError";
    }
}
export { IPv4Address, IPv4Network, IPv4Interface, AddressValueError, ValueError, NetmaskValueError };