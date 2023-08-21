export interface IConfigEncrypt {
  SHORTEST_CIPHERTEXT_LENGTH: number;
  NONCE_BYTES: number;
  HKDF_SALT_LEN: number;
  ENC_ALGO: string;
  USE_PAE: boolean;
  MAC_ALGO: string;
  MAC_SIZE: number;
  HKDF_USE_INFO: boolean;
  HKDF_SBOX: string;
  HKDF_AUTH: string;
}

export interface IConfigAuth {
  USE_PAE: boolean;
  HKDF_SALT_LEN: number;
  MAC_ALGO: string;
  MAC_SIZE: number;
  PUBLICKEY_BYTES: number;
  HKDF_USE_INFO: boolean;
  HKDF_SBOX: string;
  HKDF_AUTH: string;
}
