export enum ErrorCode {
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  INVALID_PASSWORD_ACCOUNTING = 'INVALID_PASSWORD_ACCOUNTING',
  CAN_NOT_LOGIN = 'CAN_NOT_LOGIN', // Une erreur est survenue : veuillez vérifier votre nom d'utilisateur et mot de passe.
  FORBIDDEN = 'http_error_forbidden',
  FRESH_TOKEN_WRONG = 'FRESH_TOKEN_WRONG',
  NOT_FOUND = 'NOT FOUND',
}

export enum HttpStatus {
  BAD_REQUEST = 400,
}
