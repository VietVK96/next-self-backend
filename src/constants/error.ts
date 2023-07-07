export enum ErrorCode {
  CAN_NOT_LOGIN = 'CAN_NOT_LOGIN', // Une erreur est survenue : veuillez vérifier votre nom d'utilisateur et mot de passe.
  USER_NOT_ACTIVE = 'USER_NOT_ACTIVE', //Une erreur est survenue : votre compte n'a pas été activé. Veuillez contacter le service commercial.
  FRESH_TOKEN_WRONG = 'FRESH_TOKEN_WRONG',
  YOU_NOT_HAVE_DOCTOR = 'YOU_NOT_HAVE_DOCTOR', // Custome
  FORBIDDEN = 'FORBIDDEN REQUEST',
  NOT_FOUND = 'NOT FOUND',
  NOT_FOUND_PATIENT = 'NOT_FOUND_PATIENT',
  NOT_FOUND_HISTORICAL = 'NOT_FOUND_HISTORICAL',
  NOT_FOUND_CONTACT = 'NOT_FOUND_CONTACT',
  CANNOT_DELETE_HISTORICAL = 'CANNOT_DELETE_HISTORICAL',
  DELETE_UNSUCCESSFUL = 'DELETE_UNSUCCESSFUL',
  STATUS_NOT_FOUND = '404',
  STATUS_INTERNAL_SERVER_ERROR = 'STATUS_INTERNAL_SERVER_ERROR',
}

export enum HttpStatus {
  BAD_REQUEST = 400,
}
