// It is interface and convert from https://github.com/paragonie/halite/blob/master/src/Symmetric/Crypto.php
import * as sodium from 'sodium-native';
import { randomBytes } from 'crypto';
import { hashEquals } from 'src/common/util/hash-equal';
import { HaliteConfig } from './config';
import { EncryptionKey } from './encryption-key';
import { IConfigEncrypt } from './halite.interface';
import { HaliteUtil } from './util';

export class HaliteEncryptorHelper {
  private key: EncryptionKey;

  constructor(key: string) {
    this.key = new EncryptionKey(key);
  }

  encrypt(plaintext: string, additionalData = ''): string {
    const texBuff = Buffer.from(plaintext, 'ascii');
    const additionalBuff = Buffer.from(additionalData, 'ascii');
    const config = HaliteConfig.getConfig<IConfigEncrypt>(
      HaliteConfig.HALITE_VERSION,
      'encrypt',
    );
    let nonce: Buffer;
    let salt: Buffer;
    try {
      nonce = randomBytes(HaliteConfig.SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
      salt = randomBytes(config.HKDF_SALT_LEN);
    } catch (e) {
      throw new Error(e.getMessage());
    }
    /* Split our key into two keys: One for encryption, the other for
           authentication. By using separate keys, we can reasonably dismiss
           likely cross-protocol attacks.

           This uses salted HKDF to split the keys, which is why we need the
           salt in the first place. */
    const split = HaliteUtil.splitKeys(this.key, salt, config);

    const encrypted = Buffer.alloc(texBuff.byteLength);
    sodium.crypto_stream_xor(encrypted, texBuff, nonce, split.encKey);
    const msg = Buffer.concat([
      Buffer.from(HaliteConfig.HALITE_VERSION, 'utf8'),
      salt,
      nonce,
      additionalBuff,
      encrypted,
    ]);
    const auth = HaliteEncryptorHelper.calculateMAC(msg, split.authKey, config);

    const message = Buffer.concat([
      Buffer.from(HaliteConfig.HALITE_VERSION, 'utf8'),
      salt,
      nonce,
      encrypted,
      auth,
    ]);
    return message.toString('base64') + '<ENC>';
  }

  decrypt(ciphertext: string): string {
    if (!ciphertext || ciphertext.trim() === '') {
      throw new Error('You must provint ciphertext');
    }

    const buff = Buffer.from(ciphertext.replace('<ENC>', ''), 'base64');

    const unpack = this.unpackMessageForDecryption(buff);
    const config = unpack.config;
    // pack('P', '12', '1213');
    const split = HaliteUtil.splitKeys(this.key, unpack.salt, unpack.config);

    let verified = false;

    const message = Buffer.concat([
      unpack.version,
      unpack.salt,
      unpack.nonce,
      unpack.encrypted,
    ]);
    verified = HaliteEncryptorHelper.verifyMAC(
      unpack.auth,
      message,
      split.authKey,
      config,
    );

    if (!verified) {
      throw new Error('Invalid message authentication code');
    }

    const decodeBuf = Buffer.alloc(unpack.encrypted.byteLength);
    if (config.ENC_ALGO === 'XChaCha20') {
      sodium.crypto_stream_chacha20_xor(
        decodeBuf,
        unpack.encrypted,
        unpack.nonce,
        split.encKey,
      );
    } else {
      // export function crypto_stream_xor(ciphertext: Buffer, message: Buffer, nonce: Buffer, key: Buffer): void;
      sodium.crypto_stream_xor(
        decodeBuf,
        unpack.encrypted,
        unpack.nonce,
        split.encKey,
      );
    }

    return decodeBuf.toString('ascii');
  }

  unpackMessageForDecryption(ciphertext: Buffer): {
    version: Buffer;
    config: IConfigEncrypt;
    salt: Buffer;
    nonce: Buffer;
    encrypted: Buffer;
    auth: Buffer;
  } {
    const len = ciphertext.byteLength;
    if (len < HaliteConfig.VERSION_TAG_LEN) {
      throw new Error('Message is too short');
    }

    // The first 4 bytes are reserved for the version size
    // Binary::safeSubstr
    // const version = ciphertext.substring(0, HaliteConfig.VERSION_TAG_LEN);
    const version = ciphertext.subarray(0, HaliteConfig.VERSION_TAG_LEN);
    const config = HaliteConfig.getConfig<IConfigEncrypt>(
      version.toString('ascii'),
      'encrypt',
    );

    if (len < config.SHORTEST_CIPHERTEXT_LENGTH) {
      throw new Error('Message is too short');
    }
    // The salt is used for key splitting (via HKDF)
    const salt = ciphertext.subarray(
      HaliteConfig.VERSION_TAG_LEN,
      config.HKDF_SALT_LEN + HaliteConfig.VERSION_TAG_LEN,
    );

    // This is the nonce (we authenticated it):
    const nonce = ciphertext.subarray(
      HaliteConfig.VERSION_TAG_LEN + config.HKDF_SALT_LEN,
      HaliteConfig.VERSION_TAG_LEN + config.HKDF_SALT_LEN + config.NONCE_BYTES,
    );

    // This is the crypto_stream_xor()ed ciphertext
    const encryptFirst =
      HaliteConfig.VERSION_TAG_LEN + config.HKDF_SALT_LEN + config.NONCE_BYTES;
    const encryptedLast = len - config.MAC_SIZE;
    const encrypted = ciphertext.subarray(encryptFirst, encryptedLast);

    // $auth is the last 32 bytes
    const auth = ciphertext.subarray(encryptedLast, len);
    return {
      version,
      config,
      salt,
      nonce,
      encrypted,
      auth,
    };
  }

  static verifyMAC(
    mac: Buffer,
    message: Buffer,
    authKey: Buffer,
    config: IConfigEncrypt,
  ): boolean {
    const len = mac.length;
    if (len !== config.MAC_SIZE) {
      throw new Error(
        'Argument 1: Message Authentication Code is not the correct length; is it encoded?',
      );
    }
    if (config.MAC_ALGO === 'BLAKE2b') {
      const calc = Buffer.alloc(config.MAC_SIZE);
      sodium.crypto_generichash(calc, message, authKey);
      return hashEquals(mac.toString('ascii'), calc.toString('ascii'));
    }
    throw new Error('Invalid Halite version');
  }

  static calculateMAC(
    message: Buffer,
    authKey: Buffer,
    config: IConfigEncrypt,
  ): Buffer {
    if (config.MAC_ALGO === 'BLAKE2b') {
      const buf = Buffer.alloc(config.MAC_SIZE);
      sodium.crypto_generichash(buf, message, authKey);
      return buf;
    }
    throw new Error('Invalid Halite version');
  }
}
