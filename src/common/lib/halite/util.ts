import { HaliteConfig } from './config';
import * as sodium from 'sodium-native';
import { EncryptionKey } from './encryption-key';
import { IConfigEncrypt } from './halite.interface';

export class HaliteUtil {
  static splitKeys(
    key: EncryptionKey,
    salt: Buffer,
    config: IConfigEncrypt,
  ): {
    encKey: Buffer;
    authKey: Buffer;
  } {
    if (config.HKDF_USE_INFO) {
      const prk = HaliteUtil.rawKeyedKHash(
        key.getKey(),
        Buffer.alloc(HaliteConfig.SODIUM_CRYPTO_GENERICHASH_KEYBYTES),
      );

      const encKey = HaliteUtil.rawKeyedKHash(
        Buffer.from(
          config.HKDF_SBOX + salt.toString('ascii') + '\x01',
          'ascii',
        ),
        prk,
      );
      const authKey = HaliteUtil.rawKeyedKHash(
        Buffer.from(
          config.HKDF_AUTH + salt.toString('ascii') + '\x01',
          'ascii',
        ),
        prk,
      );
      return {
        encKey,
        authKey,
      };
    }
    const encKey = HaliteUtil.hkdfBlake2b(
      key.getKey(),
      HaliteConfig.SODIUM_CRYPTO_SECRETBOX_KEYBYTES,
      config.HKDF_SBOX,
      salt,
    );
    const authKey = HaliteUtil.hkdfBlake2b(
      key.getKey(),
      HaliteConfig.SODIUM_CRYPTO_AUTH_KEYBYTES,
      config.HKDF_AUTH,
      salt,
    );

    return {
      encKey,
      authKey,
    };
  }

  static hkdfBlake2b(
    ikm: Buffer,
    length: number,
    info = '',
    salt: Buffer = Buffer.alloc(0),
  ): Buffer {
    if (
      length < 0 ||
      length > 255 * HaliteConfig.SODIUM_CRYPTO_GENERICHASH_KEYBYTES
    ) {
      throw new Error('Argument 2: Bad HKDF Digest Length');
    }
    // "If [salt] not provided, is set to a string of HashLen zeroes."
    if (!salt || salt.toString('ascii') === '') {
      // salt = "\x00".repeat(HaliteConfig.SODIUM_CRYPTO_GENERICHASH_KEYBYTES);
      salt = Buffer.alloc(HaliteConfig.SODIUM_CRYPTO_GENERICHASH_KEYBYTES);
    }

    // HKDF-Extract:
    // PRK = HMAC-Hash(salt, IKM)
    // The salt is the HMAC key.
    //
    // Note: The notation used by the RFC is backwards from what we're doing here.
    // They use (Key, Msg) while our API is (Msg, Key).
    const prk = HaliteUtil.rawKeyedKHash(ikm, salt);
    if (prk.byteLength < HaliteConfig.SODIUM_CRYPTO_GENERICHASH_KEYBYTES) {
      throw new Error('An unknown error has occurred');
    }

    let t: Buffer = Buffer.alloc(0);
    let lastBlock: Buffer = Buffer.alloc(0);

    for (let iBlock = 1; t.byteLength < length; iBlock++) {
      const buf = Buffer.concat([
        lastBlock,
        Buffer.from(info),
        Buffer.from(String.fromCharCode(iBlock)),
      ]);
      lastBlock = HaliteUtil.rawKeyedKHash(
        //String.fromCharCode(2) is pack('C', $block_index)
        // `${lastBlock}${info}${String.fromCharCode(iBlock)}`,
        buf,
        prk,
      );
      t = Buffer.concat([t, lastBlock]);
      // console.log(iBlock, t.toString('ascii'), t.toString('hex'));
    }
    return t.subarray(0, length);
  }

  //SODIUM_CRYPTO_GENERICHASH_BYTES
  static rawKeyedKHash(
    input: Buffer,
    key: Buffer,
    length: number = HaliteConfig.SODIUM_CRYPTO_GENERICHASH_BYTES,
  ): Buffer {
    if (length < HaliteConfig.SODIUM_CRYPTO_GENERICHASH_BYTES_MIN) {
      throw new Error(
        `Output length must be at least ${HaliteConfig.SODIUM_CRYPTO_GENERICHASH_BYTES_MIN} bytes.`,
      );
    }
    if (length > HaliteConfig.SODIUM_CRYPTO_GENERICHASH_BYTES_MAX) {
      throw new Error(
        `Output length must be at most ${HaliteConfig.SODIUM_CRYPTO_GENERICHASH_BYTES_MAX} bytes.`,
      );
    }

    const inputCheck = input;
    const reBuff = Buffer.alloc(length);
    // const keyBuff = Buffer.from(key, 'ascii');
    const keyBuff = key;
    sodium.crypto_generichash(reBuff, inputCheck, keyBuff);
    // sodium.crypto_generichash(reBuff, keyBuff, inputCheck);
    // return sodium.crypto_generichash(length, sodium.from_string(input), key, 'text');
    return reBuff;
  }

  static safeStrcpy(key: string): string {
    if (!key || key.length === 0) {
      return '';
    }
    let re = '';
    const len = key.length;
    let chunk = len >> 1;
    if (chunk < 1) {
      chunk = 1;
    }

    for (let i = 0; i < len; i += chunk) {
      re += key.substring(i, i + chunk);
    }
    return re;
  }

  static safeStrlen(str: string): number {
    let len = 0;
    for (let i = 0; i < str.length; i++) {
      len += str.charCodeAt(i) < 0 || str.charCodeAt(i) > 255 ? 2 : 1;
    }
    return len;
  }

  static PAE(...pieces: string[]): string {
    const out: string[] = [];

    const al = Buffer.alloc(8).fill(pieces.length, 0, 1);
    // const first = Buffer.from([pieces.length]).toString('ascii');
    out.push(al.toString('ascii'));

    for (const piece of pieces) {
      const alPiece = Buffer.alloc(8).fill(piece.length, 0, 1);
      out.push(alPiece.toString('ascii') + piece);
    }
    console.log(al.toString('ascii'), al);
    return out.join('');
  }

  // conver bin2hex in php
  static bin2hex(hex: string): string {
    const bytes = [];

    for (let i = 0; i < hex.length - 1; i += 2) {
      bytes.push(String.fromCharCode(parseInt(hex.substring(i, 2), 16)));
    }

    return bytes.join('');
  }
}
