import { IConfigAuth, IConfigEncrypt } from './halite.interface';

export class HaliteConfig {
  static VERSION_TAG_LEN = 4;
  static HALITE_VERSION = '\x31\x42\x04\x00';
  static SODIUM_CRYPTO_GENERICHASH_BYTES_MIN = 16;
  static SODIUM_CRYPTO_GENERICHASH_BYTES = 32;
  static SODIUM_CRYPTO_GENERICHASH_BYTES_MAX = 64;
  static SODIUM_CRYPTO_STREAM_KEYBYTES = 200;
  static SODIUM_CRYPTO_GENERICHASH_KEYBYTES = 32;
  static SODIUM_CRYPTO_SECRETBOX_KEYBYTES = 32;
  static SODIUM_CRYPTO_AUTH_KEYBYTES = 32;
  static SODIUM_CRYPTO_SECRETBOX_NONCEBYTES = 24;

  static getConfig<T extends IConfigAuth | IConfigEncrypt>(
    header: string,
    mode = 'encrypt',
  ): T {
    if (!header || header.length < HaliteConfig.VERSION_TAG_LEN) {
      throw new Error('Invalid version tag');
    }
    if (header[0].charCodeAt(0) !== 49 || header[1].charCodeAt(0) !== 66) {
      throw new Error('Invalid version tag');
    }
    const major = header[2].charCodeAt(0);
    const minor = header[3].charCodeAt(0);
    if (mode === 'encrypt') {
      return HaliteConfig.getConfigEncrypt(major, minor) as T;
    } else {
      return HaliteConfig.getConfigAuth(major, minor) as T;
    }
  }

  static getConfigEncrypt(major: number, minor: number): IConfigEncrypt {
    if (minor === 0) {
      if (major === 5) {
        return {
          SHORTEST_CIPHERTEXT_LENGTH: 124,
          NONCE_BYTES: 24, //SODIUM_CRYPTO_STREAM_NONCEBYTES in PHP
          HKDF_SALT_LEN: 32,
          ENC_ALGO: 'XChaCha20',
          USE_PAE: true,
          MAC_ALGO: 'BLAKE2b',
          MAC_SIZE: 64, // SODIUM_CRYPTO_GENERICHASH_BYTES_MAX
          HKDF_USE_INFO: true,
          HKDF_SBOX: 'Halite|EncryptionKey',
          HKDF_AUTH: 'AuthenticationKeyFor_|Halite',
        };
      }
      if (major === 4 || major === 3) {
        return {
          SHORTEST_CIPHERTEXT_LENGTH: 124,
          NONCE_BYTES: 24, //SODIUM_CRYPTO_STREAM_NONCEBYTES in PHP
          HKDF_SALT_LEN: 32,
          ENC_ALGO: 'XSalsa20',
          USE_PAE: false,
          MAC_ALGO: 'BLAKE2b',
          MAC_SIZE: 64, // SODIUM_CRYPTO_GENERICHASH_BYTES_MAX
          HKDF_USE_INFO: false,
          HKDF_SBOX: 'Halite|EncryptionKey',
          HKDF_AUTH: 'AuthenticationKeyFor_|Halite',
        };
      }
    }
    throw new Error('Invalid version tag');
  }

  static getConfigAuth(major: number, minor: number): IConfigAuth {
    if ((major === 4 || major === 5) && minor === 0) {
      return {
        USE_PAE: major === 5,
        HKDF_SALT_LEN: 32,
        MAC_ALGO: 'BLAKE2b',
        MAC_SIZE: 64,
        PUBLICKEY_BYTES: 32,
        HKDF_USE_INFO: major === 5,
        HKDF_SBOX: 'Halite|EncryptionKey',
        HKDF_AUTH: 'AuthenticationKeyFor_|Halite',
      };
    }
    throw new Error('Invalid version tag');
  }
}
