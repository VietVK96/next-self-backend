import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { CorrespondentTypeEntity } from './correspondent-type.entity';
import { CorrespondentEntity } from './correspondent.entity';
import { AddressEntity } from './address.entity';
import { UploadEntity } from './upload.entity';
import { LibraryBankEntity } from './library-bank.entity';
import { ContactEntity } from './contact.entity';
import { NgapKeyEntity } from './ngapKey.entity';
import { LibraryActFamilyEntity } from './library-act-family.entity';
import { BankCheckEntity } from './bank-check.entity';
import { ContraindicationEntity } from './contraindication.entity';
import { GlossaryEntity } from './glossary.entity';
import { MedicalDeviceEntity } from './medical-device.entity';
import { MedicamentFamilyEntity } from './medicament-family.entity';
import { PrescriptionTemplateEntity } from './prescription-template.entity';
import { ResourceEntity } from './resource.entity';
import { OrganizationSubscriptionEntity } from './organization-subcription.entity';
import { TagEntity } from './tag.entity';
import { TariffTypeEntity } from './tariff-type.entity';
import { WorkstationEntity } from './workstation.entity';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_GROUP_GRP")
 * @ORM\HasLifecycleCallbacks
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('T_GROUP_GRP')
export class OrganizationEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="GRP_ID", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'GRP_ID',
  })
  id?: number;

  /**
   * @ORM\OneToOne(targetEntity="Address", cascade={"persist"}, orphanRemoval=true)
   * @ORM\JoinColumn(name="ADR_ID", referencedColumnName="ADR_ID", nullable=true)
   * @Serializer\Expose
   * @Assert\Valid
   */
  // protected $address = null;

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
   * @ORM\OneToOne(targetEntity="File", cascade={"persist"}, orphanRemoval=true)
   * @ORM\JoinColumn(name="UPL_ID", referencedColumnName="UPL_ID", nullable=true)
   */
  // protected $logo = null;

  @Column({
    name: 'UPL_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  uplId?: number;
  @OneToOne(() => UploadEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'UPL_ID' })
  logo?: UploadEntity;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\Upload")
   * @ORM\JoinColumn(name="UPL_ID", referencedColumnName="UPL_ID")
   */
  // protected $upload;

  @OneToOne(() => UploadEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'UPL_ID' })
  upload?: UploadEntity;

  /**
   * @ORM\Column(name="GRP_NAME", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(
   *  max=255
   * )
   */
  @Column({
    name: 'GRP_NAME',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  name?: string;

  /**
   * @ORM\Column(name="GRP_EMAIL", type="string", length=255, nullable=true)
   * @Serializer\Expose
   * @Assert\Email(mode=Assert\Email::VALIDATION_MODE_STRICT)
   */
  @Column({
    name: 'GRP_EMAIL',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  email?: string;

  /**
   * @ORM\Column(name="GRP_PHONE", type="string", length=20, nullable=true)
   */
  @Column({
    name: 'GRP_PHONE',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  tel?: string;

  /**
   * @ORM\Column(name="GRP_PHONE", type="string", length=15, nullable=true)
   * @AcmeAssert\PhoneNumber(regionPath="countryCode")
   */
  @Column({
    name: 'GRP_PHONE',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  phoneNumber?: string;

  /**
   * @ORM\Column(name="GRP_URL", type="text", nullable=true)
   */
  @Column({
    name: 'GRP_URL',
    type: 'text',
    nullable: true,
  })
  url?: string;

  /**
   * @ORM\Column(name="image_library_link", type="string", length=255, nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"organization:read"})
   * @Assert\Type("string")
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'image_library_link',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  imageLibraryLink?: string;

  /**
   * @ORM\Column(name="GRP_SHARE_SMS", type="boolean", options={"default": false})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'GRP_SHARE_SMS',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  smsSharing?: number;

  /**
   * @ORM\Column(name="GRP_SHARE_SMS", type="integer")
   */
  @Column({
    name: 'GRP_SHARE_SMS',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  shareSms?: number;

  /**
   * @ORM\Column(name="GRP_SHARE_SMS", type="boolean", options={"default": false})
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'GRP_SHARE_SMS',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  smsShared?: number;

  /**
   * @ORM\Column(name="GRP_CCAM_ENABLED", type="integer")
   * @var boolean Nomenclature CCAM activée lors de la saisie
   */
  @Column({
    name: 'GRP_CCAM_ENABLED',
    type: 'tinyint',
    width: 1,
    default: 1,
  })
  ccamEnabled?: number;

  /**
   * @ORM\Column(name="settings", type="json")
   * @Serializer\Expose
   * @Serializer\Groups({"organization:read"})
   */
  @Column({
    name: 'settings',
    type: 'json',
  })
  protected $settings;

  /**
   * @ORM\Column(name="customer_max_number", type="integer", options={"default": 0})
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'customer_max_number',
    type: 'int',
    width: 11,
    default: 0,
  })
  maxPatientNumber?: number;

  /**
   * @ORM\Column(name="GRP_STORAGE_SPACE_USED", type="bigint")
   * @var integer Espace de stockage utilisé, en octets.
   */
  @Column({
    name: 'GRP_STORAGE_SPACE_USED',
    type: 'bigint',
    width: 20,
    default: 0,
  })
  storageSpaceUsed?: number;

  /**
   * @ORM\Column(name="GRP_STORAGE_SPACE_USED", type="bigint", options={"default": 0})
   * @Serializer\Type("int")
   */
  // @Column({
  //   name: 'GRP_STORAGE_SPACE_USED',
  //   type: 'bigint',
  //   width: 20,
  //   default: 0,
  // })
  quotaBytesUsed?: number;

  /**
   * @ORM\Column(name="GRP_TOTAL_STORAGE_SPACE", type="bigint")
   * @var integer Espace de stockage total, en octets.
   */
  @Column({
    name: 'GRP_TOTAL_STORAGE_SPACE',
    type: 'bigint',
    width: 20,
    default: 2147483648,
  })
  totalStorageSpace?: number;

  /**
   * @ORM\Column(name="GRP_TOTAL_STORAGE_SPACE", type="bigint", options={"default": 2147483648})
   * @Serializer\Type("int")
   */
  // @Column({
  //   name: 'GRP_TOTAL_STORAGE_SPACE',
  //   type: 'bigint',
  //   width: 20,
  //   default: 2147483648,
  // })
  quotaBytesTotal?: number;

  /**
   * @ORM\Column(name="GRP_TOKEN", type="string", length=36)
   */
  @Column({
    name: 'GRP_TOKEN',
    type: 'varchar',
    length: 40,
  })
  token?: string;

  /**
   * @ORM\OneToMany(targetEntity="UserEntity", mappedBy="organization", cascade={"persist"})
   */
  @OneToMany(() => UserEntity, (e) => e.group, {
    createForeignKeyConstraints: false,
  })
  users?: UserEntity[];

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Library\Bank", mappedBy="group")
   */
  // protected $libraryBanks;

  @OneToMany(() => LibraryBankEntity, (e) => e.group, {
    createForeignKeyConstraints: false,
  })
  libraryBanks?: LibraryBankEntity[];

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Contact", mappedBy="group")
   * @ORM\OrderBy({"lastname" = "ASC", "firstname" = "ASC", "birthday" = "DESC"})
   */
  // protected $contacts;

  @OneToMany(() => ContactEntity, (e) => e.group, {
    createForeignKeyConstraints: false,
  })
  contacts?: ContactEntity[];

  /**
   * @ORM\OneToMany(targetEntity="NgapKey", mappedBy="organization", cascade={"persist"})
   */
  // protected $ngapKeys;

  @OneToMany(() => NgapKeyEntity, (e) => e.organization, {
    createForeignKeyConstraints: false,
  })
  ngapKeys?: NgapKeyEntity[];

  /**
   * @ORM\OneToMany(targetEntity="LibraryActFamily", mappedBy="organization", cascade={"persist"})
   */
  // protected $libraryActFamilies;
  @OneToMany(() => LibraryActFamilyEntity, (e) => e.organization, {
    createForeignKeyConstraints: false,
  })
  libraryActFamilies?: LibraryActFamilyEntity[];

  /**
   * @ORM\OneToMany(targetEntity="BankCheck", mappedBy="organization")
   * @ORM\OrderBy({"position": "ASC", "name": "ASC"})
   */
  // protected $bankChecks;

  @OneToMany(() => BankCheckEntity, (e) => e.organization, {
    createForeignKeyConstraints: false,
  })
  bankChecks?: BankCheckEntity[];

  /**
   * @ORM\OneToMany(targetEntity="Contraindication", mappedBy="organization")
   * @ORM\OrderBy({"position": "ASC", "name": "ASC"})
   */
  // protected $contraindications;

  @OneToMany(() => ContraindicationEntity, (e) => e.organization, {
    createForeignKeyConstraints: false,
  })
  contraindications?: ContraindicationEntity[];

  /**
   * @ORM\OneToMany(targetEntity="Glossary", mappedBy="organization")
   * @ORM\OrderBy({"position": "ASC"})
   */
  // protected $glossaries;

  @OneToMany(() => GlossaryEntity, (e) => e.organization, {
    createForeignKeyConstraints: false,
  })
  glossaries?: GlossaryEntity[];

  /**
   * @ORM\OneToMany(targetEntity="MedicalDevice", mappedBy="organization")
   * @ORM\OrderBy({"name": "ASC"})
   */
  //  protected $medicalDevices;

  @OneToMany(() => MedicalDeviceEntity, (e) => e.organization, {
    createForeignKeyConstraints: false,
  })
  medicalDevices?: MedicalDeviceEntity[];

  /**
   * @ORM\OneToMany(targetEntity="MedicamentFamily", mappedBy="organization")
   * @ORM\OrderBy({"position": "ASC", "name": "ASC"})
   */
  // protected $medicamentFamilies;

  @OneToMany(() => MedicamentFamilyEntity, (e) => e.organization, {
    createForeignKeyConstraints: false,
  })
  medicamentFamilies?: MedicamentFamilyEntity[];

  /**
   * @ORM\OneToMany(targetEntity="PrescriptionTemplate", mappedBy="organization")
   * @ORM\OrderBy({"position": "ASC", "name": "ASC"})
   */
  // protected $prescriptionTemplates;

  @OneToMany(() => PrescriptionTemplateEntity, (e) => e.organization, {
    createForeignKeyConstraints: false,
  })
  prescriptionTemplates?: PrescriptionTemplateEntity[];

  /**
   * @ORM\OneToMany(targetEntity="Resource", mappedBy="organization", cascade={"persist"}, orphanRemoval=true)
   * @ORM\OrderBy({"name": "ASC"})
   */
  // protected $resources;

  @OneToMany(() => ResourceEntity, (e) => e.organization, {
    createForeignKeyConstraints: false,
  })
  resources?: ResourceEntity[];

  /**
   * @ORM\OneToMany(targetEntity="OrganizationSubscription", mappedBy="organization", cascade={"persist"}, orphanRemoval=true)
   */
  // protected $subscriptions;

  @OneToMany(() => OrganizationSubscriptionEntity, (e) => e.organization, {
    createForeignKeyConstraints: false,
  })
  subscriptions?: OrganizationSubscriptionEntity[];

  /**
   * @ORM\OneToMany(targetEntity="Tag", mappedBy="organization", cascade={"persist"}, orphanRemoval=true)
   * @ORM\OrderBy({"title": "ASC"})
   */
  // protected $tags;

  @OneToMany(() => TagEntity, (e) => e.organization, {
    createForeignKeyConstraints: false,
  })
  tags?: TagEntity[];

  /**
   * @ORM\OneToMany(targetEntity="TariffType", mappedBy="organization")
   * @ORM\OrderBy({"name": "ASC"})
   */
  // protected $tariffTypes;

  @OneToMany(() => TariffTypeEntity, (e) => e.organization, {
    createForeignKeyConstraints: false,
  })
  tariffTypes?: TariffTypeEntity[];

  /**
   * @ORM\OneToMany(targetEntity="Workstation", mappedBy="organization")
   * @ORM\OrderBy({"name": "ASC"})
   */
  //  protected $workstations;

  @OneToMany(() => WorkstationEntity, (e) => e.organization, {
    createForeignKeyConstraints: false,
  })
  workstations?: WorkstationEntity[];

  @OneToMany(() => CorrespondentTypeEntity, (e) => e.group, {
    createForeignKeyConstraints: false,
  })
  correspondentTypes?: CorrespondentTypeEntity[];

  @OneToMany(() => CorrespondentEntity, (e) => e.group, {
    createForeignKeyConstraints: false,
  })
  correspondents?: CorrespondentEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

// application/Entities/Organization.php
// application/Entities/Group.php
