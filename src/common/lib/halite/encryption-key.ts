import { HaliteConfig } from './config';
//https://www.npmjs.com/package/sodium-native
import * as sodium from 'sodium-native';
import { Hex } from './hex';
import { HaliteUtil } from './util';
import { hashEquals } from 'src/common/util/hash-equal';

export class EncryptionKey {
  private key: Buffer;
  constructor(_key: string) {
    if (
      HaliteUtil.safeStrlen(_key) !== HaliteConfig.SODIUM_CRYPTO_STREAM_KEYBYTES
    ) {
      throw new Error(
        `Encryption key must be CRYPTO_STREAM_KEYBYTES (${HaliteConfig.SODIUM_CRYPTO_STREAM_KEYBYTES}) bytes long`,
      );
    }
    this.key = this.getKeyDataFromString(
      Hex.decode(HaliteUtil.safeStrcpy(_key)),
    );
  }

  getKey(): Buffer {
    return this.key;
  }

  getKeyDataFromString(data: string): Buffer {
    const len = data.length;
    if (len < HaliteConfig.VERSION_TAG_LEN) {
      throw new Error('Message is too short');
    }
    const bufData = Buffer.from(data, 'ascii');

    const keyData = bufData.subarray(
      HaliteConfig.VERSION_TAG_LEN,
      len - HaliteConfig.SODIUM_CRYPTO_GENERICHASH_BYTES_MAX,
    );
    const keyForCheck = bufData.subarray(
      0,
      len - HaliteConfig.SODIUM_CRYPTO_GENERICHASH_BYTES_MAX,
    );
    const checksum = bufData
      .subarray(len - HaliteConfig.SODIUM_CRYPTO_GENERICHASH_BYTES_MAX)
      .toString('ascii');
    const calc = Buffer.alloc(64);
    sodium.crypto_generichash(calc, keyForCheck);
    if (!hashEquals(calc.toString('ascii'), checksum)) {
      throw new Error('Checksum validation fail');
    }
    return keyData;
  }
}
