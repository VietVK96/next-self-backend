export const mailVariable = {
  'Date du jour': '{{today}}',
  'Date du jour (long)': '{{todayLong}}',
  Logo: '{{logo}}',
  Praticien: {
    'Nom complet': '{{praticien.fullname}}',
    Nom: '{{praticien.lastname}}',
    Prénom: '{{praticien.firstname}}',
    'Adresse mail': '{{praticien.email}}',
    Rue: '{{praticien.address.street}}',
    'Code postal': '{{praticien.address.zipCode}}',
    Ville: '{{praticien.address.city}}',
    Pays: '{{praticien.address.country}}',
    'Téléphone fixe': '{{praticien.phoneNumber}}',
    'Téléphone mobile': '{{praticien.gsm}}',
    'Télécopie (FAX)': '{{praticien.faxNumber}}',
    'Numéro ADELI': '{{praticien.numeroFacturant}}',
    'Numéro RPPS': '{{praticien.medical.rppsNumber}}',
    Signature: "<img class='signaturePraticien' alt='Signature praticien' />",
  },
  Patient: {
    'Genre (abrégé)': '{{contact.gender}}',
    Genre: '{{contact.genderLong}}',
    'Chèr(e)': '{{contact.dear}}',
    'N° patient': '{{contact.nbr}}',
    Nom: '{{contact.lastname}}',
    Prénom: '{{contact.firstname}}',
    'Date de naissance': '{{contact.birthday}}',
    Age: '{{contact.age}}',
    'Adresse mail': '{{contact.email}}',
    Rue: '{{contact.address.street}}',
    'Code postal': '{{contact.address.zipCode}}',
    Ville: '{{contact.address.city}}',
    Pays: '{{contact.address.country}}',
    'Téléphone domicile': '{{contact.phones.home}}',
    'Téléphone mobile': '{{contact.phones.mobile}}',
    'Téléphone bureau': '{{contact.phones.office}}',
    'Téléphone fax': '{{contact.phones.fax}}',
    'N° SS': '{{contact.dental.insee}}{{contact.dental.inseeKey}}',
    'Montant dû': '{{contact.amountDue}}',
    'Date dernière recette': '{{contact.dateLastRec}}',
    'Date dernier soin coté': '{{contact.dateLastSoin}}',
    'Date du prochain rappel': '{{contact.dateOfNextReminder}}',
    'Date du prochain rendez-vous': '{{contact.nextAppointmentDate}}',
    'Heure du prochain rendez-vous': '{{contact.nextAppointmentTime}}',
    'Durée du prochain rendez-vous': '{{contact.nextAppointmentDuration}}',
    'Titre du prochain rendez-vous': '{{contact.nextAppointmentTitle}}',
    Signature: "<img class='signaturePatient' alt='Signature patient' />",
  },
  Correspondant: {
    'Genre (abrégé)': '{{correspondent.gender}}',
    Genre: '{{correspondent.genderLong}}',
    'Chèr(e)': '{{correspondent.dear}}',
    Nom: '{{correspondent.lastname}}',
    Prénom: '{{correspondent.firstname}}',
    Type: '{{correspondent.type}}',
    'Adresse mail': '{{correspondent.email}}',
    Commentaire: '{{correspondent.msg}}',
    Rue: '{{correspondent.address.street}}',
    'Code postal': '{{correspondent.address.zipCode}}',
    Ville: '{{correspondent.address.city}}',
    Pays: '{{correspondent.address.country}}',
    'Téléphone domicile': '{{correspondent.phones.home}}',
    'Téléphone mobile': '{{correspondent.phones.mobile}}',
    'Téléphone bureau': '{{correspondent.phones.office}}',
    'Téléphone fax': '{{correspondent.phones.fax}}',
  },
  Echéancier: '{{payment_schedule}}',
};