import * as dayjs from 'dayjs';
import { OrderContext } from './orderContext';

export class PaymentRequest {
  private reference: string;
  private date: Date;
  private montant: number;
  private devise: string;
  private langue: string;
  private contexteCommande: OrderContext;
  private texteLibre: string | null;
  private mail: string | null;
  private urlRetourOk: string | null;
  private urlRetourErreur: string | null;
  private threeDSecureDebrayable: boolean | null;
  private threeDSecureChallenge: string | null;
  private libelleMonetique: string | null;
  private libelleMonetiqueLocalite: string | null;
  private desactiveMoyenPaiement: string[] | null;
  private aliasCb: string | null;
  private forceSaisieCb: boolean | null;
  private protocole: string | null;

  constructor(
    reference: string,
    montant: number,
    devise: string,
    langue: string,
    contexteCommande: OrderContext,
    email?: string,
    urlRetourOk?: string,
    urlRetourErreur?: string,
  ) {
    this.setReference(reference);
    this.setMontant(montant);
    this.setLangue(langue);
    this.setDevise(devise);
    this.setContexteCommande(contexteCommande);
    this.setDate(new Date());
    if (email) this.setMail(email);
    if (urlRetourOk) this.setUrlRetourOk(urlRetourOk);
    if (urlRetourErreur) this.setUrlRetourErreur(urlRetourErreur);
  }

  getFormFields(eptCode: string, companyCode: string, version: string): any {
    const formFields: any = {
      TPE: eptCode,
      societe: companyCode,
      lgue: this.langue,
      version: version,
      reference: this.reference,
      date: dayjs(this.date).format('DD/MM/YYYY:hh:mm:ss'),
      montant: this.formatAmount(this.montant, this.devise),
      contexte_commande: Buffer.from(
        JSON.stringify(this.contexteCommande),
      ).toString('base64'),
    };

    if (typeof this.getTexteLibre() === 'string') {
      formFields['texte-libre'] = this.getTexteLibre();
    }

    if (typeof this.getMail() === 'string') {
      formFields['mail'] = this.getMail();
    }

    if (typeof this.getUrlRetourOk() === 'string') {
      formFields['url_retour_ok'] = this.getUrlRetourOk();
    }

    if (typeof this.getUrlRetourErreur() === 'string') {
      formFields['url_retour_err'] = this.getUrlRetourErreur();
    }

    if (this.getThreeDSecureDebrayable() !== null) {
      formFields['3dsdebrayable'] = this.getThreeDSecureDebrayable()
        ? '1'
        : '0';
    }

    if (typeof this.getThreeDSecureChallenge() === 'string') {
      formFields['ThreeDSecureChallenge'] = this.getThreeDSecureChallenge();
    }

    if (typeof this.getLibelleMonetique() === 'string') {
      formFields['libelleMonetique'] = this.getLibelleMonetique();
    }

    if (typeof this.getLibelleMonetiqueLocalite() === 'string') {
      formFields['libelleMonetiqueLocalite'] =
        this.getLibelleMonetiqueLocalite();
    }

    if (
      this.getDesactiveMoyenPaiement() !== null &&
      this.getDesactiveMoyenPaiement()?.length > 0
    ) {
      formFields['desactivemoyenpaiement'] =
        this.getDesactiveMoyenPaiement().join(',');
    }

    if (typeof this.getAliasCb() === 'string') {
      formFields['aliascb'] = this.getAliasCb();
    }

    if (this.getForceSaisieCb() !== null) {
      formFields['forcesaisiecb'] = this.getForceSaisieCb() ? '1' : '0';
    }

    if (typeof this.getProtocole() === 'string') {
      formFields['protocole'] = this.getProtocole();
    }

    return formFields;
  }

  public formatAmount(amount: number, devise: string): string {
    return `${amount} ${devise}`;
  }

  public getReference(): string {
    return this.reference;
  }

  public setReference(reference: string): this {
    this.reference = reference;
    return this;
  }

  public getDate(): Date {
    return this.date;
  }

  setDate(date: Date): this {
    this.date = date;
    return this;
  }

  public getMontant(): number {
    return this.montant;
  }

  setMontant(montant: number): this {
    this.montant = montant;
    return this;
  }

  public getDevise(): string {
    return this.devise;
  }

  setDevise(devise: string): this {
    this.devise = devise;
    return this;
  }

  public getLangue(): string {
    return this.langue;
  }

  setLangue(langue: string): this {
    this.langue = langue;
    return this;
  }

  public getContexteCommande(): OrderContext {
    return this.contexteCommande;
  }

  setContexteCommande(contexteCommande: OrderContext): this {
    this.contexteCommande = contexteCommande;
    return this;
  }

  public getTexteLibre(): string | null {
    return this.texteLibre;
  }

  setTexteLibre(texteLibre: string | null): this {
    this.texteLibre = texteLibre;
    return this;
  }

  public getMail(): string | null {
    return this.mail;
  }

  setMail(mail: string | null): this {
    this.mail = mail;
    return this;
  }

  public getUrlRetourOk(): string | null {
    return this.urlRetourOk;
  }

  setUrlRetourOk(urlRetourOk: string | null): this {
    this.urlRetourOk = urlRetourOk;
    return this;
  }

  public getUrlRetourErreur(): string | null {
    return this.urlRetourErreur;
  }

  setUrlRetourErreur(urlRetourErreur: string | null): this {
    this.urlRetourErreur = urlRetourErreur;
    return this;
  }

  public getThreeDSecureDebrayable(): boolean | null {
    return this.threeDSecureDebrayable;
  }

  setThreeDSecureDebrayable(threeDSecureDebrayable: boolean | null): this {
    this.threeDSecureDebrayable = threeDSecureDebrayable;
    return this;
  }

  public getThreeDSecureChallenge(): string | null {
    return this.threeDSecureChallenge;
  }

  setThreeDSecureChallenge(threeDSecureChallenge: string | null): this {
    this.threeDSecureChallenge = threeDSecureChallenge;
    return this;
  }

  public getLibelleMonetique(): string | null {
    return this.libelleMonetique;
  }

  setLibelleMonetique(libelleMonetique: string | null): this {
    this.libelleMonetique = libelleMonetique;
    return this;
  }

  public getLibelleMonetiqueLocalite(): string | null {
    return this.libelleMonetiqueLocalite;
  }

  setLibelleMonetiqueLocalite(libelleMonetiqueLocalite: string | null): this {
    this.libelleMonetiqueLocalite = libelleMonetiqueLocalite;
    return this;
  }

  public getDesactiveMoyenPaiement(): string[] | null {
    return this.desactiveMoyenPaiement;
  }

  setDesactiveMoyenPaiement(desactiveMoyenPaiement: string[] | null): this {
    this.desactiveMoyenPaiement = desactiveMoyenPaiement;
    return this;
  }

  public getAliasCb(): string | null {
    return this.aliasCb;
  }

  setAliasCb(aliasCb: string | null): this {
    this.aliasCb = aliasCb;
    return this;
  }

  public getForceSaisieCb(): boolean | null {
    return this.forceSaisieCb;
  }

  setForceSaisieCb(forceSaisieCb: boolean | null): this {
    this.forceSaisieCb = forceSaisieCb;
    return this;
  }

  public getProtocole(): string | null {
    return this.protocole;
  }

  setProtocole(protocole: string | null): this {
    this.protocole = protocole;
    return this;
  }
}
