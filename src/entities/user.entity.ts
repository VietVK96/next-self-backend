import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { ResourceEntity } from './resource.entity';
import { UploadEntity } from './upload.entity';
import { AddressEntity } from './address.entity';
import { UserTypeEntity } from './user-type.entity';
import { PrivilegeEntity } from './privilege.entity';
import { EventEntity } from './event.entity';
import { MemoEntity } from './memo.entity';
import { LicenseEntity } from './license.entity';
import { UserConnectionEntity } from './user-connection.entity';
import { UserSmsEntity } from './user-sms.entity';
import { UserPreferenceEntity } from './user-preference.entity';
import { CashingEntity } from './cashing.entity';
import { UserPreferenceQuotationEntity } from './user-preference-quotation.entity';
import { UserMedicalEntity } from './user-medical.entity';
import { UserAmoEntity } from './user-amo.entity';
import { FseEntity } from './fse.entity';
import { EmailAccountEntity } from './email-account.entity';
import { EventTypeEntity } from './event-type.entity';
import { SendingLogEntity } from './sending-log.entity';
import { AppointmentReminderLibraryEntity } from './appointment-reminder-library.entity';
import { MobileSettingEntity } from './mobile-setting.entity';
import { MobileSubscriptionEntity } from './mobile-subscription.entity';

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
  // protected $resource;

  @Column({
    name: 'resource_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  resourceId?: number;
  @ManyToOne(() => ResourceEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'resource_id',
  })
  resource?: ResourceEntity;

  @Column({
    name: 'avatar_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  avatarId?: number;
  @OneToMany(() => UploadEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  uploads?: UploadEntity[];

  /**
   * @ORM\Column(name="USR_ADMIN", type="integer", nullable=false)
   */
  @Column({
    name: 'USR_ADMIN',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  admin?: number;

  /**
   * @ORM\Column(name="USR_LOG", type="string", unique=true)
   */
  @Column({
    name: 'USR_LOG',
    type: 'varchar',
    length: 31,
  })
  log?: string;

  /**
   * @ORM\Column(name="USR_LOG", type="string", length=255)
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  // @Column({
  //   name: 'USR_LOG',
  //   type: 'varchar',
  //   length: 31,
  // })
  // username?: string;

  /**
   * @ORM\Column(name="password_accounting", type="string", length=255, nullable=true)
   * @Assert\Type("string")
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'password_accounting',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  passwordAccounting?: string;

  /**
   * @ORM\Column(name="USR_PWD", type="string", length=255)
   */
  @Column({
    name: 'USR_PWD',
    type: 'varchar',
    length: 255,
  })
  password?: string;

  /**
   * @ORM\Column(name="password_hash", type="boolean", options={"default": false})
   */
  @Column({
    name: 'password_hash',
    type: 'int',
    width: 1,
    default: 0,
  })
  passwordHash?: number;

  /**
   * @ORM\Column(name="USR_MAIL", type="string", nullable=false)
   */
  @Column({
    name: 'USR_MAIL',
    type: 'varchar',
    length: 50,
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
    type: 'varchar',
    length: 3,
  })
  abbr?: string;

  /**
   * @ORM\Column(name="USR_ABBR", type="string", length=3)
   * @Serializer\Expose
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=3)
   */
  // @Column({
  //   name: 'USR_ABBR',
  //   type: 'varchar',
  //   length: 3,
  // })
  // shortName?: string;

  /**
   * @ORM\Column(name="USR_LASTNAME", type="string", length=50)
   */
  @Column({
    name: 'USR_LASTNAME',
    type: 'varchar',
    length: 50,
  })
  lastname?: string;

  /**
   * @ORM\Column(name="USR_FIRSTNAME", type="string", length=50)
   */
  @Column({
    name: 'USR_FIRSTNAME',
    type: 'varchar',
    length: 50,
  })
  firstname?: string;

  /**
   * @ORM\Column(name="color", type="color")
   */
  @Column({
    name: 'color',
    type: 'int',
    width: 11,
    default: -25344,
  })
  color?: number;

  /**
   * @ORM\Column(name="USR_GSM", type="string", length=20, nullable=true)
   */
  @Column({
    name: 'USR_GSM',
    type: 'varchar',
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
    type: 'varchar',
    length: 45,
  })
  phoneNumber?: string;

  /**
   * @ORM\Column(name="USR_PHONE_NUMBER", type="string", length=45, nullable=true)
   * @Serializer\Expose
   * @Assert\Type("string")
   * @Assert\Length(max=45)
   */
  // @Column({
  //   name: 'USR_PHONE_NUMBER',
  //   nullable: true,
  //   type: 'varchar',
  //   length: 45,
  // })
  // homePhoneNumber?: string;

  /**
   * @ORM\Column(name="USR_FAX_NUMBER", type="string", length=45, nullable=true)
   */
  @Column({
    name: 'USR_FAX_NUMBER',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  faxNumber?: string;

  /**
   * @ORM\Column(name="company_name", type="string", length=255, nullable=true)
   * @Assert\Type("string")
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'company_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  companyName?: string;

  /**
   * @ORM\Column(name="USR_PERMISSION_LIBRARY", type="integer")
   * @var integer Permission bibliothèques.
   */
  @Column({
    name: 'USR_PERMISSION_LIBRARY',
    type: 'tinyint',
    width: 4,
    default: 15,
  })
  permissionLibrary?: number;

  /**
   * @ORM\Column(name="USR_PERMISSION_PATIENT", type="integer")
   * @var integer Permission état civil.
   */
  @Column({
    name: 'USR_PERMISSION_PATIENT',
    type: 'tinyint',
    width: 4,
    default: 15,
  })
  permissionPatient?: number;

  /**
   * @ORM\Column(name="permission_patient_view", type="integer")
   * @var boolean Autorisation d'affichage d'un patient
   */
  @Column({
    name: 'permission_patient_view',
    type: 'tinyint',
    width: 1,
    default: 1,
  })
  permissionPatientView?: number;

  /**
   * @ORM\Column(name="USR_PERMISSION_PASSWORD", type="integer")
   * @var integer Permission modification du mot de passe.
   */
  @Column({
    name: 'USR_PERMISSION_PASSWORD',
    type: 'tinyint',
    width: 4,
    default: 15,
  })
  permissionPassword?: number;

  /**
   * @ORM\Column(name="USR_PERMISSION_DELETE", type="integer")
   * @var integer Permission suppression.
   */
  @Column({
    name: 'USR_PERMISSION_DELETE',
    type: 'tinyint',
    width: 4,
    default: 15,
  })
  permissionDelete?: number;

  /**
   * @ORM\Column(name="USR_AGA_MEMBER", type="integer")
   * @var boolean Membre d'une Association de Gestion Agréée.
   */
  @Column({
    name: 'USR_AGA_MEMBER',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  agaMember?: number;

  /**
   * @ORM\Column(name="USR_AGA_MEMBER", type="boolean", options={"default": false})
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  // @Column({
  //   name: 'USR_AGA_MEMBER',
  //   type: 'tinyint',
  //   width: 1,
  //   default: 0,
  // })
  // memberOfApprovedAssociation?: number;

  /**
   * @ORM\Column(name="freelance", type="boolean", options={"default": false})
   */
  @Column({
    name: 'freelance',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  freelance?: number;

  /**
   * @ORM\Column(name="USR_DEPASSEMENT_PERMANENT", type="integer")
   * @var boolean Droit permanent à dépassement.
   */
  @Column({
    name: 'USR_DEPASSEMENT_PERMANENT',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  droitPermanentDepassement?: number;

  /**
   * @ORM\Column(name="USR_NUMERO_FACTURANT", type="string", length=13, nullable=true)
   * @var string Numéro facturant utilisé lors de la télétransmission.
   */
  @Column({
    name: 'USR_NUMERO_FACTURANT',
    type: 'varchar',
    length: 13,
    nullable: true,
  })
  numeroFacturant?: string;

  /**
   * Numéro ADELI.
   *
   * @ORM\Column(name="USR_NUMERO_FACTURANT", type="string", length=13, nullable=true)
   * @Expose
   * @var string
   */
  // @Column({
  //   name: 'USR_NUMERO_FACTURANT',
  //   type: 'varchar',
  //   length: 13,
  //   nullable: true,
  // })
  // adeliNumber?: string;

  /**
   * @ORM\Column(name="finess", type="string", length=9, nullable=true)
   * @var string Numéro FINESS/AM de la structure.
   */
  @Column({
    name: 'finess',
    type: 'varchar',
    length: 9,
    nullable: true,
  })
  finess?: string;

  /**
   * @ORM\Column(name="finess", type="string", length=9, nullable=true)
   * @Assert\Type("string")
   * @Assert\Length(max=9)
   */
  // @Column({
  //   name: 'finess',
  //   type: 'varchar',
  //   length: 9,
  //   nullable: true,
  // })
  // finessNumber?: string;

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
    default: 0,
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
   * @ORM\Column(name="USR_BCB_LICENSE", type="string", length=255, nullable=true)
   */
  // @Column({
  //   name: 'USR_BCB_LICENSE',
  //   type: 'text',
  //   nullable: true,
  // })
  // claudeBernardLicence?: string;

  /**
   * @ORM\Column(name="settings", type="json")
   * @Serializer\Expose
   * @Assert\Type("array")
   */
  @Column({
    name: 'settings',
    type: 'json',
  })
  settings?: any;

  /**
   * @ORM\Column(name="USR_SIGNATURE", type="text", nullable=true)
   * @var string Signature numérique de l'utilisateur.
   */
  @Column({
    name: 'USR_SIGNATURE',
    type: 'mediumtext',
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
    width: 1,
    default: 0,
  })
  pendingDeletion?: number;

  /**
   * @ORM\Column(name="USR_CLIENT", type="integer")
   * @var boolean
   */
  @Column({
    name: 'USR_CLIENT',
    type: 'tinyint',
    width: 4,
    default: 0,
  })
  client?: number;
  /**
   * @ORM\Column(name="USR_CLIENT", type="integer", options={"default": 0})
   * @Assert\Choice(callback={"App\Enum\AccountStatusEnum", "getValues"})
   */
  // @Column({
  //   name: 'USR_CLIENT',
  //   type: 'tinyint',
  //   width: 4,
  //   default: 0,
  // })
  // accountStatus?: number;

  /**
   * @ORM\Column(name="USR_TOKEN", type="string", length=23, nullable=false)
   */
  @Column({
    name: 'USR_TOKEN',
    type: 'varchar',
    length: 40,
  })
  token?: string;

  @Column({
    name: 'archived_at',
    type: 'datetime',
    nullable: true,
  })
  archivedAt?: number;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\Address")
   * @ORM\JoinColumn(name="ADR_ID", referencedColumnName="ADR_ID")
   */
  // protected $address;

  @Column({
    name: 'ADR_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  adrId?: number;
  @OneToOne(() => AddressEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'ADR_ID' })
  address?: AddressEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Group", inversedBy="users")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  @Column({
    name: 'organization_id',
    type: 'int',
    width: 11,
  })
  organizationId?: number;

  @ManyToOne(() => OrganizationEntity, (e) => e.users, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'organization_id',
  })
  group?: OrganizationEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User\Type")
   * @ORM\JoinColumn(name="UST_ID", referencedColumnName="UST_ID")
   */
  // protected $type;

  @Column({
    name: 'UST_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  ustId?: number;

  @ManyToOne(() => UserTypeEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'UST_ID',
  })
  type?: UserTypeEntity;

  /**
   * privilèges de l'utilisateur
   *
   * @ORM\OneToMany(targetEntity="\App\Entities\Privilege", mappedBy="user")
   * @ORM\OrderBy({"pos" = "ASC"})
   */
  // protected $privileges;

  @OneToMany(() => PrivilegeEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  privileges?: PrivilegeEntity[];

  /**
   * privilèges dont l'utilisateur est le destinataire
   *
   * @ORM\OneToMany(targetEntity="\App\Entities\Privilege", mappedBy="userWith")
   * @ORM\OrderBy({"id" = "ASC", "pos" = "ASC"})
   */
  // protected $privileged;

  @OneToMany(() => PrivilegeEntity, (e) => e.userWith, {
    createForeignKeyConstraints: false,
  })
  privileged?: PrivilegeEntity[];

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Event", mappedBy="user")
   * @ORM\OrderBy({"start" = "ASC", "end" = "ASC"})
   */
  // protected $events;

  @OneToMany(() => EventEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  events?: EventEntity[];

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Memo", mappedBy="user")
   * @ORM\OrderBy({"date" = "ASC"})
   */
  // protected $memos;

  @OneToMany(() => MemoEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  memos?: MemoEntity[];

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\License", mappedBy="user")
   */
  // protected $license;

  @OneToOne(() => LicenseEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  license?: LicenseEntity;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\UserConnection", mappedBy="user")
   * @ORM\OrderBy({"id" = "DESC"})
   */
  // protected $connections;

  @OneToMany(() => UserConnectionEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  connections?: UserConnectionEntity[];

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\User\Sms", mappedBy="user")
   */
  // protected $sms;

  @OneToOne(() => UserSmsEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  sms?: UserSmsEntity;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\User\Preference", mappedBy="user")
   */
  // protected $preference;

  @OneToOne(() => UserPreferenceEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  preference?: UserPreferenceEntity;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Cashing", mappedBy="user")
   */
  // protected $cashings;

  @OneToMany(() => CashingEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  cashings?: CashingEntity[];

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\User\Preference\Quotation", mappedBy="user")
   * @var \App\Entities\User\Preference\Quotation Preference de l'utilisateur concernant les devis
   */
  // protected $userPreferenceQuotation;

  @OneToOne(() => UserPreferenceQuotationEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  userPreferenceQuotation?: UserPreferenceQuotationEntity;

  /**
   * Entité des réglages.
   *
   * @ORM\OneToOne(targetEntity="UserSettingEntity", mappedBy="user")
   * @var \App\Entities\UserSettingEntity
   */
  // protected $setting;

  @OneToOne(() => UserPreferenceEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  setting?: UserPreferenceEntity;

  /**
   * Entité de l'abonnement mobile.
   *
   * @ORM\OneToOne(targetEntity="MobileSubscriptionEntity", mappedBy="user")
   * @var \App\Entities\MobileSubscriptionEntity|null
   */
  // protected $mobileSubscription = null;

  @OneToOne(() => MobileSubscriptionEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  mobileSubscription?: MobileSubscriptionEntity;

  /**
   * Entité des réglages mobile.
   *
   * @ORM\OneToOne(targetEntity="MobileSettingEntity", mappedBy="user")
   * @var \App\Entities\MobileSettingEntity|null
   */
  // protected $mobileSetting = null;

  @OneToOne(() => MobileSettingEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  mobileSetting?: MobileSettingEntity;

  /**
   * @ORM\OneToOne(targetEntity="UserMedical", mappedBy="user", fetch="EAGER", cascade={"persist"})
   * @Serializer\Expose
   * @Assert\Valid
   */
  // protected $medical = null;

  @OneToOne(() => UserMedicalEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  medical?: UserMedicalEntity;

  /**
   * @ORM\OneToOne(targetEntity="UserAmo", mappedBy="user", fetch="EAGER", cascade={"persist"})
   * @Serializer\Expose
   * @Assert\Valid
   */
  // protected $amo = null;

  @OneToOne(() => UserAmoEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  amo?: UserAmoEntity;

  /**
   * @ORM\OneToMany(targetEntity="Caresheet", mappedBy="user")
   */
  // protected $caresheets;

  @OneToMany(() => FseEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  caresheets?: FseEntity[];

  /**
   * @ORM\OneToMany(targetEntity="EmailAccount", mappedBy="user")
   * @ORM\OrderBy({"position": "ASC"})
   */
  // protected $emailAccounts;

  @OneToMany(() => EmailAccountEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  emailAccounts?: EmailAccountEntity[];

  /**
   * @ORM\OneToMany(targetEntity="EventType", mappedBy="user")
   * @ORM\OrderBy({"position": "asc"})
   */
  // protected $eventTypes;

  @OneToMany(() => EventTypeEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  eventTypes?: EventTypeEntity[];

  /**
   * @ORM\ManyToMany(targetEntity="Resource", mappedBy="subscribers")
   * @ORM\OrderBy({"name": "ASC"})
   */
  // protected $resources;

  @ManyToMany(() => ResourceEntity, (e) => e.subscribers, {
    createForeignKeyConstraints: false,
  })
  @JoinTable({
    name: 'user_resource',
    joinColumn: {
      name: 'user_id',
    },
    inverseJoinColumn: {
      name: 'resource_id',
    },
  })
  resources?: ResourceEntity[];

  /**
   * @ORM\OneToMany(targetEntity="SendingLog", mappedBy="user", cascade={"persist"})
   * @ORM\OrderBy({"sendingDate": "desc"})
   */
  // protected $sendingLogs;

  @OneToMany(() => SendingLogEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  sendingLogs?: SendingLogEntity[];

  /**
   * @ORM\ManyToMany(targetEntity="EmailAccount", mappedBy="subscribers")
   */
  // protected $subscribedEmailAccounts;

  @ManyToMany(() => EmailAccountEntity, (e) => e.subscribers, {
    createForeignKeyConstraints: false,
  })
  subscribedEmailAccounts?: EmailAccountEntity[];

  /**
   * @ORM\OneToMany(targetEntity="AppointmentReminderLibrary", mappedBy="user", cascade={"persist"})
   */
  // protected $appointmentReminderLibraries;

  @OneToMany(() => AppointmentReminderLibraryEntity, (e) => e.user, {
    createForeignKeyConstraints: false,
  })
  appointmentReminderLibraries?: AppointmentReminderLibraryEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
// application/Entities/User.php
// application/Entities/UserEntity.php
// application/Entity/User.php
