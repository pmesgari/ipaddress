import { IPv4Address, IPv4Network, IPv4Interface, AddressValueError, ValueError, NetmaskValueError } from './ipaddress';


describe('AddressTestCase_v4', () => {
  test('network passed as address', () => {
    expect(() => new IPv4Address('127.0.0.1/24')).toThrow(new AddressValueError(`Unexpected '/' in ${'127.0.0.1/24'}`));
  });

  test('bad address split', () => {
    const assertBadSplit = (addr) => {
      expect(() => new IPv4Address(addr)).toThrow(new AddressValueError(`Expected 4 octets in ${addr}`));
    };

    assertBadSplit("127.0.1");
    assertBadSplit("42.42.42.42.42");
    assertBadSplit("42.42.42");
    assertBadSplit("42.42");
    assertBadSplit("42");
    assertBadSplit("42..42.42.42");
    assertBadSplit("42.42.42.42.");
    assertBadSplit("42.42.42.42...");
    assertBadSplit(".42.42.42.42");
    assertBadSplit("...42.42.42.42");
    assertBadSplit("016.016.016");
    assertBadSplit("016.016");
    assertBadSplit("016");
    assertBadSplit("000");
    assertBadSplit("0x0a.0x0a.0x0a");
    assertBadSplit("0x0a.0x0a");
    assertBadSplit("0x0a");
    assertBadSplit(".");
    assertBadSplit("bogus");
    assertBadSplit("bogus.com");
    assertBadSplit("1000");
    assertBadSplit("1000000000000000");
    assertBadSplit("192.168.0.1.com");
  });

  test('empty octet', () => {
    const assertBadOctet = (addr) => {
      expect(() => new IPv4Address(addr)).toThrow(`Empty octet not permitted in ${addr}`);
    };

    assertBadOctet('42..42.42');
    assertBadOctet('...');
  });

  test('invalid characters', () => {
    const assertBadOctet = (addr, octet) => {
      let msg = `Only decimal digits permitted in ${octet}`;
      expect(() => new IPv4Address(addr)).toThrow(msg);
    };

    assertBadOctet("0x0a.0x0a.0x0a.0x0a", "0x0a");
    assertBadOctet("0xa.0x0a.0x0a.0x0a", "0xa")
    assertBadOctet("42.42.42.-0", "-0")
    assertBadOctet("42.42.42.+0", "+0")
    assertBadOctet("42.42.42.-42", "-42")
    assertBadOctet("+1.+2.+3.4", "+1")
    assertBadOctet("1.2.3.4e0", "4e0")
    assertBadOctet("1.2.3.4::", "4::")
    assertBadOctet("1.a.2.3", "a")
  });

  test('octet length', () => {
    const assertBadOctet = (addr, octet) => {
      let msg = `At most 3 characters permitted in ${octet}`
      expect(() => new IPv4Address(addr)).toThrow(msg);
    };

    assertBadOctet("0000.000.000.000", "0000");
    assertBadOctet("12345.67899.-54321.-98765", "12345");
  });

  test('octet limit', () => {
    const assertBadOctet = (addr, octet) => {
      let msg = `Octet ${octet} (> 255) not permitted`
      expect(() => new IPv4Address(addr)).toThrow(msg);
    };

    assertBadOctet("257.0.0.0", 257);
  });
});

// def test_no_mask(self):
// for address in ('1.2.3.4', 0x01020304, b'\x01\x02\x03\x04'):
//     net = self.factory(address)
//     self.assertEqual(str(net), '1.2.3.4/32')
//     self.assertEqual(str(net.netmask), '255.255.255.255')
//     self.assertEqual(str(net.hostmask), '0.0.0.0')

describe('InterfaceTestCase_v4', () => {
  // test('no mask', () => {
  //   ['1.2.3.4'].forEach((item) => {
  //     let net = new IPv4Interface(item)
  //     expect(net.toString()).toEqual('1.2.3.4/32');
  //   });
  // });
  test('make netmask from string prefix length', () => {
    let [netmask, prefixlen] = IPv4Network.makeNetmask('16');
    let ip = new IPv4Address('255.255.0.0');
    expect(netmask.equals(ip)).toBeTruthy();
  });

  test('prefix from prefix string', () => {
    let prefixlen = IPv4Network._prefixFromPrefixString('16')
    expect(prefixlen).toEqual(16)
  });

  test('prefix from prefix string with invalid values should throw netmask value error', () => {
    expect(() => IPv4Network._prefixFromPrefixString('+16')).toThrow(new NetmaskValueError('+16 is not a valid netmask'));
    expect(() => IPv4Network._prefixFromPrefixString('s16')).toThrow(new NetmaskValueError('s16 is not a valid netmask'));
    expect(() => IPv4Network._prefixFromPrefixString('sss')).toThrow(new NetmaskValueError('sss is not a valid netmask'));
    expect(() => IPv4Network._prefixFromPrefixString('0')).toThrow(new NetmaskValueError('0 is not a valid netmask'));
    expect(() => IPv4Network._prefixFromPrefixString('32')).toThrow(new NetmaskValueError('32 is not a valid netmask'));
    expect(() => IPv4Network._prefixFromPrefixString('-5')).toThrow(new NetmaskValueError('-5 is not a valid netmask'));
    expect(() => IPv4Network._prefixFromPrefixString('33')).toThrow(new NetmaskValueError('33 is not a valid netmask'));
  });

  test('prefix from ip int', () => {
    expect(IPv4Network.prefixFromIpInt(IPv4Address.ipIntFromString('255.255.255.0'))).toEqual(24)
  })
  // test('prefix from ip string with netmask', () => {
  //   expect(IPv4Network._prefixFromIpString('255.255.255.0')).toEqual(24);
  // });
});