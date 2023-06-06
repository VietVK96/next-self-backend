import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\User")
 * @ORM\Table(name="T_USER_USR", uniqueConstraints={
 *  @ORM\UniqueConstraint(name="UNIQ_1C904FF51FF1335", columns={"USR_LOG"})
 * })
 * @ORM\HasLifecycleCallbacks
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 */
@Entity('T_USER_USR')
export class UserEntity {
  /**
   * @ORM\Column(name="USR_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'USR_ID',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Resource")
   * @ORM\JoinColumn(name="resource_id", referencedColumnName="id")
   * @var \App\Entities\Resource Entité représentant la resource principale.
   */
  // @TODO EntityMissing
  // protected $resource;

  /**
   * @ORM\Column(name="USR_ADMIN", type="integer", nullable=false)
   */
  @Column({
    name: 'USR_ADMIN',
    type: 'tinyint',
    length: 1,
    default: 0,
  })
  admin?: number;

  /**
   * @ORM\Column(name="USR_LOG", type="string", unique=true)
   */
  @Column({
    name: 'USR_LOG',
  })
  log?: string;

  /**
   * @ORM\Column(name="USR_PWD", type="string", length=255)
   */
  @Column({
    name: 'USR_PWD',
  })
  password?: string;

  /**
   * @ORM\Column(name="password_hash", type="boolean", options={"default": false})
   */
  @Column({
    name: 'password_hash',
  })
  passwordHash?: boolean;

  /**
   * @ORM\Column(name="USR_MAIL", type="string", nullable=false)
   */
  @Column({
    name: 'USR_MAIL',
  })
  email?: string;

  /**
   * @ORM\Column(name="USR_VALIDATED", type="date", nullable=true)
   */
  @Column({
    name: 'USR_VALIDATED',
    nullable: true,
    type: 'date',
  })
  validated?: string;

  /**
   * @ORM\Column(name="USR_ABBR", type="string", length=3)
   * @var string Abrégé du nom de l'utilisateur
   */
  @Column({
    name: 'USR_ABBR',
    length: 3,
  })
  abbr?: string;

  /**
   * @ORM\Column(name="USR_LASTNAME", type="string", length=50)
   */
  @Column({
    name: 'USR_LASTNAME',
    length: 50,
  })
  lastname?: string;

  /**
   * @ORM\Column(name="USR_FIRSTNAME", type="string", length=50)
   */
  @Column({
    name: 'USR_FIRSTNAME',
    length: 50,
  })
  firstname?: string;

  /**
   * @ORM\Column(name="color", type="color")
   */
  @Column({
    name: 'color',
    default: -25344,
  })
  color?: number;

  /**
   * @ORM\Column(name="USR_GSM", type="string", length=20, nullable=true)
   */
  @Column({
    name: 'USR_GSM',
    length: 20,
    nullable: true,
  })
  gsm?: string;

  /**
   * @ORM\Column(name="USR_PHONE_NUMBER", type="string", length=45, nullable=true)
   */
  @Column({
    name: 'USR_PHONE_NUMBER',
    nullable: true,
    length: 45,
  })
  phoneNumber?: string;

  /**
   * @ORM\Column(name="USR_FAX_NUMBER", type="string", length=45, nullable=true)
   */
  @Column({
    name: 'USR_FAX_NUMBER',
    length: 45,
    nullable: true,
  })
  faxNumber?: string;

  /**
   * @ORM\Column(name="USR_PERMISSION_LIBRARY", type="integer")
   * @var integer Permission bibliothèques.
   */
  @Column({
    name: 'USR_PERMISSION_LIBRARY',
    type: 'tinyint',
    length: 4,
  })
  permissionLibrary?: number;

  /**
   * @ORM\Column(name="USR_PERMISSION_PATIENT", type="integer")
   * @var integer Permission état civil.
   */
  @Column({
    name: 'USR_PERMISSION_LIBRARY',
    type: 'tinyint',
    length: 4,
  })
  permissionPatient?: number;

  /**
   * @ORM\Column(name="permission_patient_view", type="integer")
   * @var boolean Autorisation d'affichage d'un patient
   */
  @Column({
    name: 'permission_patient_view',
    type: 'tinyint',
    length: 1,
  })
  permissionPatientView?: number;

  /**
   * @ORM\Column(name="USR_PERMISSION_PASSWORD", type="integer")
   * @var integer Permission modification du mot de passe.
   */
  @Column({
    name: 'USR_PERMISSION_PASSWORD',
    type: 'tinyint',
    length: 4,
  })
  permissionPassword?: number;

  /**
   * @ORM\Column(name="USR_PERMISSION_DELETE", type="integer")
   * @var integer Permission suppression.
   */
  @Column({
    name: 'USR_PERMISSION_DELETE',
    type: 'tinyint',
    length: 4,
  })
  permissionDelete?: number;

  /**
   * @ORM\Column(name="USR_AGA_MEMBER", type="integer")
   * @var boolean Membre d'une Association de Gestion Agréée.
   */
  @Column({
    name: 'USR_AGA_MEMBER',
    type: 'tinyint',
    length: 4,
  })
  agaMember?: number;

  /**
   * @ORM\Column(name="freelance", type="boolean", options={"default": false})
   */
  @Column({
    name: 'freelance',
  })
  freelance?: boolean;

  /**
   * @ORM\Column(name="USR_DEPASSEMENT_PERMANENT", type="integer")
   * @var boolean Droit permanent à dépassement.
   */
  @Column({
    name: 'USR_DEPASSEMENT_PERMANENT',
  })
  droitPermanentDepassement?: boolean;

  /**
   * @ORM\Column(name="USR_NUMERO_FACTURANT", type="string", length=13, nullable=true)
   * @var string Numéro facturant utilisé lors de la télétransmission.
   */
  @Column({
    name: 'USR_NUMERO_FACTURANT',
    length: 13,
    nullable: true,
  })
  numeroFacturant?: string;

  /**
   * @ORM\Column(name="finess", type="string", length=9, nullable=true)
   * @var string Numéro FINESS/AM de la structure.
   */
  @Column({
    name: 'finess',
    length: 9,
    nullable: true,
  })
  finess?: string;

  /**
   * @ORM\Column(name="USR_FLUX_CPS", type="text", nullable=true)
   * @var string Flux de la carte de professionnel de santé.
   */
  @Column({
    name: 'USR_FLUX_CPS',
    type: 'text',
    nullable: true,
  })
  fluxCps?: string;

  /**
   * @ORM\Column(name="USR_RATE_CHARGES", type="float")
   * @var float Taux de charges du cabinet pour le praticien,
   * exprimé en pourcentage.
   * decimal(10,2)
   */
  @Column({
    name: 'USR_RATE_CHARGES',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  rateCharges?: number;

  /**
   * @ORM\Column(name="social_security_reimbursement_base_rate", type="decimal", precision=10, scale=2, options={"default": 100})
   */
  @Column({
    name: 'social_security_reimbursement_base_rate',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 100,
  })
  socialSecurityReimbursementBaseRate?: number = 100;

  /**
   * @ORM\Column(name="social_security_reimbursement_rate", type="decimal", precision=10, scale=2, options={"default": 70})
   */
  @Column({
    name: 'social_security_reimbursement_rate',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 70,
  })
  socialSecurityReimbursementRate?: number = 70;

  /**
   * @ORM\Column(name="USR_BCB_LICENSE", type="text", nullable=true)
   * @var string Numéro de licence de la Base Claude Bernard.
   */
  @Column({
    name: 'USR_BCB_LICENSE',
    type: 'text',
    nullable: true,
  })
  bcbLicense?: string;

  /**
   * @ORM\Column(name="USR_SIGNATURE", type="text", nullable=true)
   * @var string Signature numérique de l'utilisateur.
   */
  @Column({
    name: 'USR_SIGNATURE',
    type: 'text',
    nullable: true,
  })
  signature?: string;

  /**
   * @ORM\Column(name="USR_PENDING_DELETION", type="integer")
   * @var integer En attente de validation de suppression.
   */
  @Column({
    name: 'USR_PENDING_DELETION',
    type: 'tinyint',
    length: 1,
    default: 0,
  })
  pendingDeletion?: string;

  /**
   * @ORM\Column(name="USR_CLIENT", type="integer")
   * @var boolean
   */
  @Column({
    name: 'USR_CLIENT',
    type: 'tinyint',
    length: 1,
    default: 0,
  })
  client?: number;

  /**
   * @ORM\Column(name="USR_TOKEN", type="string", length=23, nullable=false)
   */
  @Column({
    name: 'USR_TOKEN',
    length: 23,
  })
  token?: string;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\Address")
   * @ORM\JoinColumn(name="ADR_ID", referencedColumnName="ADR_ID")
   */
  // @TODO EntityMissing
  // protected $address;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Group", inversedBy="users")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */

  @Column({
    name: 'organization_id',
  })
  organizationId?: number;

  @ManyToOne(() => OrganizationEntity, (e) => e.users, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'organization_id',
    referencedColumnName: 'GRP_ID',
  })
  group?: OrganizationEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User\Type")
   * @ORM\JoinColumn(name="UST_ID", referencedColumnName="UST_ID")
   */
  // @TODO EntityMissing
  // protected $type;

  /**
   * privilèges de l'utilisateur
   *
   * @ORM\OneToMany(targetEntity="\App\Entities\Privilege", mappedBy="user")
   * @ORM\OrderBy({"pos" = "ASC"})
   */
  // @TODO EntityMissing
  // protected $privileges;

  /**
   * privilèges dont l'utilisateur est le destinataire
   *
   * @ORM\OneToMany(targetEntity="\App\Entities\Privilege", mappedBy="userWith")
   * @ORM\OrderBy({"id" = "ASC", "pos" = "ASC"})
   */
  // @TODO EntityMissing
  // protected $privileged;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Event", mappedBy="user")
   * @ORM\OrderBy({"start" = "ASC", "end" = "ASC"})
   */
  // @TODO EntityMissing
  // protected $events;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Memo", mappedBy="user")
   * @ORM\OrderBy({"date" = "ASC"})
   */
  // @TODO EntityMissing
  // protected $memos;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\License", mappedBy="user")
   */
  // @TODO EntityMissing
  // protected $license;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\UserConnection", mappedBy="user")
   * @ORM\OrderBy({"id" = "DESC"})
   */
  // @TODO EntityMissing
  // protected $connections;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\User\Sms", mappedBy="user")
   */
  // @TODO EntityMissing
  // protected $sms;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\User\Preference", mappedBy="user")
   */
  // @TODO EntityMissing
  // protected $preference;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Cashing", mappedBy="user")
   */
  // @TODO EntityMissing
  // protected $cashings;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\User\Preference\Quotation", mappedBy="user")
   * @var \App\Entities\User\Preference\Quotation Preference de l'utilisateur concernant les devis
   */
  // @TODO EntityMissing
  // protected $userPreferenceQuotation;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
// application/Entities/User.php
// application/Entities/UserEntity.php
