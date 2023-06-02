import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity
 * @ORM\Table(name="cmcic_payment_cpy")
 */
@Entity('cmcic_payment_cpy')
export class CmcicPaymentEntity {
  /**
   * @ORM\Column(name="cpy_id", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @var integer Identifiant unique de l'enregistrement.
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'cpy_id',
  })
  id?: number;

  /**
   * @ORM\Column(name="cpy_mac", type="string", length=41, nullable=true)
   * @var string Sceau résultant de la certification des données.
   */
  @Column({
    name: 'cpy_mac',
    type: 'varchar',
    length: 41,
    nullable: true,
  })
  mac?: string;

  /**
     * @ORM\Column(name="cpy_date", type="string", length=21, nullable=true)
     * @var string Date de la demande d’autorisation de la commande au format JJ/MM/AAAA_a_HH:MM:SS.

     */
  @Column({
    name: 'cpy_date',
    type: 'varchar',
    length: 21,
    nullable: true,
  })
  date?: string;

  /**
   * @ORM\Column(name="cpy_tpe", type="string", length=7, nullable=true)
   * @var string Numéro de TPE Virtuel du commerçant.
   */
  @Column({
    name: 'cpy_tpe',
    type: 'varchar',
    length: 7,
    nullable: true,
  })
  tpe?: string;

  /**
   * @ORM\Column(name="cpy_montant", type="string", length=45, nullable=true)
   * @var string Montant TTC de la commande.
   */
  @Column({
    name: 'cpy_montant',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  montant?: string;

  /**
   * @ORM\Column(name="cpy_reference", type="string", length=12, nullable=true)
   * @var string Référence unique de la commande.
   */
  @Column({
    name: 'cpy_reference',
    type: 'varchar',
    length: 12,
    nullable: true,
  })
  reference?: string;

  /**
   * @ORM\Column(name="cpy_texte_libre", type="text", nullable=true)
   * @var string Zone de texte libre.
   */
  @Column({
    name: 'cpy_texte_libre',
    type: 'text',
    nullable: true,
  })
  texteLibre?: string;

  /**
   * @ORM\Column(name="cpy_code_retour", type="string", length=16, nullable=true)
   * @var string Le résultat du paiement.
   */
  @Column({
    name: 'cpy_code_retour',
    type: 'varchar',
    length: 16,
    nullable: true,
  })
  codeRetour?: string;

  /**
   * @ORM\Column(name="cpy_cvx", type="string", length=3, nullable=true)
   * @var string Si le cryptogramme visuel (obligatoire pour les cartes Visa et MasterCard) a été saisi.
   */
  @Column({
    name: 'cpy_cvx',
    type: 'varchar',
    length: 3,
    nullable: true,
  })
  cvx?: string;

  /**
   * @ORM\Column(name="cpy_vld", type="string", length=45, nullable=true)
   * @var string Date de validité de la carte de crédit utilisée pour effectuer le paiement.
   */
  @Column({
    name: 'cpy_vld',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  vld?: string;

  /**
   * @ORM\Column(name="cpy_brand", type="string", length=2, nullable=true)
   * @var string Code réseau de la carte.
   */
  @Column({
    name: 'cpy_brand',
    type: 'varchar',
    length: 2,
    nullable: true,
  })
  brand?: string;

  /**
   * @ORM\Column(name="cpy_status3ds", type="integer", nullable=true)
   * @var integer Indicateur d’échange 3DSecure.
   */
  @Column({
    name: 'cpy_status3ds',
    type: 'tinyint',
    length: 4,
    nullable: true,
  })
  status3ds?: number;

  /**
   * @ORM\Column(name="cpy_numauto", type="string", length=45, nullable=true)
   * @var string Numéro d’autorisation tel que fourni par la banque émetteur .
   */
  @Column({
    name: 'cpy_numauto',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  numauto?: string;

  /**
   * @ORM\Column(name="cpy_motifrefus", type="string", length=12, nullable=true)
   * @var string Motif du refus de la demande de paiement.
   */
  @Column({
    name: 'cpy_motifrefus',
    type: 'varchar',
    length: 12,
    nullable: true,
  })
  motifrefus?: string;

  /**
   * @ORM\Column(name="cpy_originecb", type="string", length=3, nullable=true)
   * @var string Code pays de la banque émettrice de la carte bancaire.
   */
  @Column({
    name: 'cpy_originecb',
    type: 'varchar',
    length: 3,
    nullable: true,
  })
  originecb?: string;

  /**
   * @ORM\Column(name="cpy_bincb", type="string", length=45, nullable=true)
   * @var string Code BIN de la banque du porteur de la carte de crédit.
   */
  @Column({
    name: 'cpy_bincb',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  bincb?: string;

  /**
   * @ORM\Column(name="cpy_hpancb", type="string", length=41, nullable=true)
   * @var string Hachage irréversible (HMAC-SHA1) du numéro de la carte de crédit utilisée pour effectuer le paiement.
   */
  @Column({
    name: 'cpy_hpancb',
    type: 'varchar',
    length: 41,
    nullable: true,
  })
  hpancb?: string;

  /**
   * @ORM\Column(name="cpy_ipclient", type="string", length=45, nullable=true)
   * @var string Adresse IP du client ayant fait la transaction.
   */
  @Column({
    name: 'cpy_ipclient',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  ipclient?: string;

  /**
   * @ORM\Column(name="cpy_originetr", type="string", length=3, nullable=true)
   * @var string Code pays de l’origine de la transaction.
   */
  @Column({
    name: 'cpy_originetr',
    type: 'varchar',
    length: 3,
    nullable: true,
  })
  originetr?: string;

  /**
   * @ORM\Column(name="cpy_veres", type="string", length=45, nullable=true)
   * @var string Etat 3DSecure du VERes.
   */
  @Column({
    name: 'cpy_veres',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  veres?: string;

  /**
   * @ORM\Column(name="cpy_pares", type="string", length=45, nullable=true)
   * @var string Etat 3DSecure du PARes.
   */
  @Column({
    name: 'cpy_pares',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  pares?: string;

  /**
   * @ORM\Column(name="cpy_montantech", type="string", length=45, nullable=true)
   * @var string Montant de l’échéance en cours.
   */
  @Column({
    name: 'cpy_montantech',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  montantech?: string;

  /**
   * @ORM\Column(name="cpy_filtragecause", type="integer", nullable=true)
   * @var integer Numéros des types de filtres bloquant le paiement.
   */
  @Column({
    name: 'cpy_filtragecause',
    type: 'tinyint',
    length: 4,
    nullable: true,
  })
  filtragecause?: number;

  /**
   * @ORM\Column(name="cpy_filtragevaleur", type="string", length=45, nullable=true)
   * @var string Données ayant engendrées le blocage.
   */
  @Column({
    name: 'cpy_filtragevaleur',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  filtragevaleur?: string;

  /**
   * @ORM\Column(name="cpy_cbenregistree", type="integer", nullable=true)
   * @var boolean Booléen indiquant si la carte a été enregistrée sous un aliascb donné.
   */
  @Column({
    name: 'cpy_cbenregistree',
    type: 'tinyint',
    length: 4,
    nullable: true,
  })
  cbenregistree?: number;

  /**
   * @ORM\Column(name="cpy_cbmasquee", type="string", length=16, nullable=true)
   * @var string 6 premiers et 4 derniers chiffres de la carte bancaire du client.
   */
  @Column({
    name: 'cpy_cbmasquee',
    type: 'varchar',
    length: 16,
    nullable: true,
  })
  cbmasquee?: string;

  /**
   * @ORM\Column(name="cpy_motifdebrayage", type="string", length=15, nullable=true)
   * @var string Motif pour lequel 3DSecure a été débrayé.
   */
  @Column({
    name: 'cpy_motifdebrayage',
    type: 'varchar',
    length: 15,
    nullable: true,
  })
  motifdebrayage?: string;

  /**
   * @ORM\Column(name="cpy_modepaiement", type="string", length=8, nullable=true)
   * @var string Moyen de paiement utilisé.
   */
  @Column({
    name: 'cpy_modepaiement',
    type: 'varchar',
    length: 8,
    nullable: true,
  })
  modepaiement?: string;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="usr_id", referencedColumnName="USR_ID")
   * @var \App\Entities\User Entité représentant l'utilisateur.
   */
  // @TODO EntityMissing
  //   protected $user;
}
// application/Entities/Cmcic/Payment.php
