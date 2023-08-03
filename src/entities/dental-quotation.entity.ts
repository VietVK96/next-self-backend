import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UploadEntity } from './upload.entity';
import { UserEntity } from './user.entity';
import { ContactEntity } from './contact.entity';
import { DentalQuotationActEntity } from './dental-quotation-act.entity';
import { PaymentPlanEntity } from './payment-plan.entity';
import { LettersEntity } from './letters.entity';
import { PlanPlfEntity } from './plan-plf.entity';

export enum EnumDentalQuotationSchemes {
  NONE = 'none',
  BOTH = 'both',
  THREE = 'three',
}

export enum EnumDentalQuotationDetails {
  NONE = 'none',
  BOTH = 'both',
  ONLY = 'only',
}

/**
 * @ORM\Entity
 * @ORM\Table(name="T_DENTAL_QUOTATION_DQO")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_DENTAL_QUOTATION_DQO')
export class DentalQuotationEntity {
  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  /**
   * @ORM\Column(name="DQO_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'DQO_ID',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Upload")
   * @ORM\JoinColumn(name="logo_id", referencedColumnName="UPL_ID")
   * @var \App\Entities\Upload Entité représentant le logo du devis.
   */
  // protected $logo;
  @Column({ name: 'logo_id', type: 'int', width: 11, nullable: true })
  logoId?: number;

  @ManyToOne(() => UploadEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'logo_id' })
  logo?: UploadEntity;

  /** File: application\Entity\Quote.php
   * @ORM\OneToOne(targetEntity="File", cascade={"persist", "remove"})
   * @ORM\JoinColumn(name="logo_id", referencedColumnName="UPL_ID", nullable=true)
   */
  // @TODO EntityMissing
  // protected $logo = null;

  /**
   * @ORM\Column(name="DQO_TYPE", type="integer", nullable=false)
   */
  @Column({
    name: 'DQO_TYPE',
    type: 'int',
    width: 11,
    default: 0,
  })
  type?: number;

  /**
   * @ORM\Column(name="reference", type="string", length=13, nullable=true)
   * @var string Numéro unique du devis au format XXXXXXX-XXXXX.
   */
  @Column({
    name: 'reference',
    type: 'varchar',
    length: 13,
    nullable: true,
  })
  reference?: string;

  /** File: application\Entity\Quote.php
   * @ORM\Column(name="reference", type="string", length=13, nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("string")
   * @Assert\Length(max=13)
   */
  // @Column({
  //   name: 'reference',
  //   type: 'varchar',
  //   length: 13,
  //   nullable: true,
  // })
  // referenceNumber?: string;

  /**
   * @ORM\Column(name="DQO_COLOR", type="text", nullable=true)
   */
  @Column({
    name: 'DQO_COLOR',
    type: 'text',
    nullable: true,
  })
  color?: string;

  /**
   * @ORM\Column(name="DQO_SCHEMES", type="text", nullable=true)
   */
  @Column({
    name: 'DQO_SCHEMES',
    type: 'enum',
    enum: EnumDentalQuotationSchemes,
    nullable: true,
  })
  schemes?: EnumDentalQuotationSchemes;

  /**
   * @ORM\Column(name="DQO_DETAILS", type="string", nullable=true)
   * @var string
   */
  @Column({
    name: 'DQO_DETAILS',
    type: 'enum',
    enum: EnumDentalQuotationDetails,
    nullable: true,
  })
  details?: EnumDentalQuotationDetails;

  /**
   * @ORM\Column(name="DQO_TITLE", type="text", nullable=true)
   */
  @Column({
    name: 'DQO_TITLE',
    type: 'text',
    nullable: true,
  })
  title?: string;

  /**
   * @ORM\Column(name="DQO_DATE_ACCEPT", type="date", nullable=true)
   */
  @Column({
    name: 'DQO_DATE_ACCEPT',
    type: 'date',
    nullable: true,
  })
  dateAccept?: string;

  /** File: application\Entity\Quote.php
   * @ORM\Column(name="DQO_DATE_ACCEPT", type="date", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   */
  // @Column({
  //   name: 'DQO_DATE_ACCEPT',
  //   type: 'date',
  //   nullable: true,
  // })
  // acceptedOn?: string;

  /**
   * @ORM\Column(name="DQO_DATE", type="date", nullable=true)
   */
  @Column({
    name: 'DQO_DATE',
    type: 'date',
    nullable: true,
  })
  date?: string;

  /**
   * @ORM\Column(name="DQO_TIME", type="time", nullable=true)
   */
  @Column({
    name: 'DQO_TIME',
    type: 'time',
    nullable: true,
  })
  time?: string;

  /**
   * @ORM\Column(name="DQO_DURATION", type="text", nullable=true)
   */
  @Column({
    name: 'DQO_DURATION',
    type: 'text',
    nullable: true,
  })
  duration?: string;

  /**
   * @ORM\Column(name="DQO_MSG", type="text", nullable=true)
   */
  @Column({
    name: 'DQO_MSG',
    type: 'text',
    nullable: true,
  })
  msg?: string;

  /** File: application\Entity\Quote.php
   * @ORM\Column(name="DQO_MSG", type="text", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("string")
   */
  // @Column({
  //   name: 'DQO_MSG',
  //   type: 'text',
  //   nullable: true,
  // })
  // description?: string;

  /**
   * @ORM\Column(name="DQO_IDENT_PRAT", type="text", nullable=false)
   */
  @Column({
    name: 'DQO_IDENT_PRAT',
    type: 'text',
  })
  identPrat?: string;

  /**
   * @ORM\Column(name="DQO_ADDR_PRAT", type="text", nullable=false)
   */
  @Column({
    name: 'DQO_ADDR_PRAT',
    type: 'text',
  })
  addrPrat?: string;

  /**
   * @ORM\Column(name="DQO_IDENT_CONTACT", type="text", nullable=false)
   */
  @Column({
    name: 'DQO_IDENT_CONTACT',
    type: 'text',
  })
  identContact?: string;

  /**
   * @ORM\Column(name="customer_number", type="integer", nullable=true)
   * @var integer Numéro de dossier client du groupe.
   */
  @Column({
    name: 'customer_number',
    type: 'int',
    width: 11,
    nullable: true,
  })
  customerNumber?: number;

  /**
   * @ORM\Column(name="DQO_INSEE", type="text", nullable=true)
   */
  @Column({
    name: 'DQO_INSEE',
    type: 'text',
    nullable: true,
  })
  insee?: string;

  /**
   * @ORM\Column(name="DQO_BIRTHDAY", type="date", nullable=true)
   */
  @Column({
    name: 'DQO_BIRTHDAY',
    type: 'date',
    nullable: true,
  })
  birthday?: string;

  /**
   * @ORM\Column(name="DQO_ADDRESS", type="text", nullable=true)
   */
  @Column({
    name: 'DQO_ADDRESS',
    type: 'text',
    nullable: true,
  })
  address?: string;

  /**
   * @ORM\Column(name="DQO_TEL", type="text", nullable=true)
   */
  @Column({
    name: 'DQO_TEL',
    type: 'text',
    nullable: true,
  })
  tel?: string;

  /**
   * @ORM\Column(name="DQO_ORGANISM", type="text", nullable=true)
   */
  @Column({
    name: 'DQO_ORGANISM',
    type: 'text',
    nullable: true,
  })
  organism?: string;

  /**
   * @ORM\Column(name="DQO_CONTRACT", type="text", nullable=true)
   */
  @Column({
    name: 'DQO_CONTRACT',
    type: 'text',
    nullable: true,
  })
  contract?: string;

  /**
   * @ORM\Column(name="DQO_REF", type="text", nullable=true)
   */
  @Column({
    name: 'DQO_REF',
    type: 'text',
    nullable: true,
  })
  ref?: string;

  /**
   * @ORM\Column(name="DQO_DISPO", type="integer", nullable=false)
   */
  @Column({
    name: 'DQO_DISPO',
    type: 'tinyint',
    width: 1,
  })
  dispo?: number;

  /**
   * @ORM\Column(name="DQO_DISPO_MSG", type="text", nullable=true)
   */
  @Column({
    name: 'DQO_DISPO_MSG',
    type: 'text',
    nullable: true,
  })
  dispoMsg?: string;

  /**
   * @ORM\Column(name="DQO_AMOUNT", type="float")
   * @var float
   */
  @Column({
    name: 'DQO_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amount?: number;

  /**
   * @ORM\Column(name="DQO_PERSON_REPAYMENT", type="float")
   * @var float
   */
  @Column({
    name: 'DQO_PERSON_REPAYMENT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  personRepayment?: number;

  /**
   * @ORM\Column(name="DQO_PERSON_AMOUNT", type="float")
   * @var float
   */
  @Column({
    name: 'DQO_PERSON_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  personAmount?: number;

  /**
   * @ORM\Column(name="DQO_PLACE_OF_MANUFACTURE", type="integer", nullable=true)
   * @var integer Lieu du fabricant
   */
  @Column({
    name: 'DQO_PLACE_OF_MANUFACTURE',
    type: 'int',
    width: 11,
    nullable: true,
  })
  placeOfManufacture?: number;

  /**
   * @ORM\Column(name="DQO_PLACE_OF_MANUFACTURE_LABEL", type="string", length=16, nullable=true)
   * @var string Libellé du lieu du fabricant
   */
  @Column({
    name: 'DQO_PLACE_OF_MANUFACTURE_LABEL',
    type: 'varchar',
    length: 16,
    nullable: true,
  })
  placeOfManufactureLabel?: string;

  /**
   * @ORM\Column(name="DQO_WITH_SUBCONTRACTING", type="integer", nullable=true)
   * @var boolean Avec / Sans sous-traitant
   */
  @Column({
    name: 'DQO_WITH_SUBCONTRACTING',
    type: 'tinyint',
    width: 1,
    nullable: true,
  })
  withSubcontracting?: number;

  /**
   * @ORM\Column(name="DQO_PLACE_OF_SUBCONTRACTING", type="integer", nullable=true)
   * @var integer Lieu du sous-traitant
   */
  @Column({
    name: 'DQO_PLACE_OF_SUBCONTRACTING',
    type: 'int',
    width: 11,
    nullable: true,
  })
  placeOfSubcontracting?: number;

  /**
   * @ORM\Column(name="DQO_PLACE_OF_SUBCONTRACTING_LABEL", type="string", length=16, nullable=true)
   * @var string Libellé du lieu du sous-traitant
   */
  @Column({
    name: 'DQO_PLACE_OF_SUBCONTRACTING_LABEL',
    type: 'varchar',
    length: 16,
    nullable: true,
  })
  placeOfSubcontractingLabel?: string;

  /**
   * @ORM\Column(name="DQO_DISPLAY_NOTICE", type="integer")
   * @var boolean Affichage de la notice explicative.
   */
  @Column({
    name: 'DQO_DISPLAY_NOTICE',
    type: 'tinyint',
    width: 1,
    default: 1,
  })
  displayNotice?: number;

  /** File: application\Entity\Quote.php
   * @ORM\Column(name="DQO_DISPLAY_NOTICE", type="boolean", options={"default": true})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  // @Column({
  //   name: 'DQO_DISPLAY_NOTICE',
  //   type: 'tinyint',
  //   width: 1,
  //   default: 1,
  // })
  // printExplanatoryNote?: number;

  /**
   * @ORM\Column(name="DQO_SIGNATURE_PATIENT", type="text", nullable=true)
   * @var string Signature électronique du patient encodée en base64.
   */
  @Column({
    name: 'DQO_SIGNATURE_PATIENT',
    type: 'mediumtext',
    nullable: true,
  })
  signaturePatient?: string;

  /** File: application\Entity\Quote.php
   * @ORM\Column(name="DQO_SIGNATURE_PATIENT", type="text", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("string")
   */
  // @Column({
  //   name: 'DQO_SIGNATURE_PATIENT',
  //   type: 'mediumtext',
  //   nullable: true,
  // })
  // patientSignature?: string;

  /**
   * @ORM\Column(name="DQO_SIGNATURE_PRATICIEN", type="text", nullable=true)
   * @var string Signature électronique du praticien encodée en base64.
   */
  @Column({
    name: 'DQO_SIGNATURE_PRATICIEN',
    type: 'mediumtext',
    nullable: true,
  })
  signaturePraticien?: string;

  /** File: application\Entity\Quote.php
   * @ORM\Column(name="DQO_SIGNATURE_PRATICIEN", type="text", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("string")
   */
  // @Column({
  //   name: 'DQO_SIGNATURE_PRATICIEN',
  //   type: 'mediumtext',
  //   nullable: true,
  // })
  // practitionerSignature?: string;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   */
  // protected $user;
  @Column({ name: 'USR_ID', type: 'int', width: 11 })
  userId?: number;

  @ManyToOne(() => UserEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'USR_ID' })
  user?: UserEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Contact", inversedBy="quotations")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   */
  // protected $contact;
  @Column({ name: 'CON_ID', type: 'int', width: 11 })
  contactId?: number;

  @ManyToOne(() => ContactEntity, (e) => e.quotations, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'CON_ID' })
  contact?: ContactEntity;

  /** File: application\Entity\Quote.php
   * @ORM\ManyToOne(targetEntity="Patient")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   * @Serializer\Expose
   * @Serializer\MaxDepth(1)
   */
  // @TODO EntityMissing
  // protected $patient;
  @ManyToOne(() => ContactEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'CON_ID' })
  patient?: ContactEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Plan")
   * @ORM\JoinColumn(name="PLF_ID", referencedColumnName="PLF_ID")
   */
  // protected $planification;
  @Column({ name: 'PLF_ID', type: 'int', width: 11, nullable: true })
  planificationId?: number;

  @ManyToOne(() => PlanPlfEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'PLF_ID' })
  planification?: PlanPlfEntity;

  /** File: application\Entity\Quote.php
   * @ORM\ManyToOne(targetEntity="TreatmentPlan")
   * @ORM\JoinColumn(name="PLF_ID", referencedColumnName="PLF_ID", nullable=true)
   */
  // protected $treatmentPlan = null;
  @ManyToOne(() => PlanPlfEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'PLF_ID' })
  treatmentPlan?: PlanPlfEntity;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Dental\Quotation\Act", mappedBy="quotation")
   */
  // protected $acts;
  @OneToMany(() => DentalQuotationActEntity, (e) => e.quotation, {
    createForeignKeyConstraints: false,
  })
  acts?: DentalQuotationActEntity[];

  /** File: application\Entity\Quote.php
   * @ORM\OneToMany(targetEntity="QuoteAct", mappedBy="quote", cascade={"persist"})
   * @ORM\OrderBy({"position": "ASC"})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   */
  // @TODO EntityMissing
  // protected $acts;

  /**
   * @ORM\OneToOne(targetEntity="PaymentPlan")
   * @ORM\JoinColumn(name="payment_schedule_id", referencedColumnName="id", nullable=true)
   */
  // protected $paymentPlan = null;
  @Column({
    name: 'payment_schedule_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  paymentScheduleId?: number;

  @OneToOne(() => PaymentPlanEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'payment_schedule_id' })
  paymentPlan?: PaymentPlanEntity;

  /**
   * @ORM\Column(name="valid_until", type="date", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   */
  @Column({
    name: 'valid_until',
    type: 'date',
    nullable: true,
  })
  validUntil?: string;

  /**
   * @ORM\Column(type="boolean", options={"default": false})
   */
  @Column({
    name: 'treatment_timeline',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  treatmentTimeline?: number;

  /**
   * @ORM\OneToMany(targetEntity="Mail", mappedBy="quote", cascade={"persist"})
   */
  // protected $attachments;
  @OneToMany(() => LettersEntity, (e) => e.quote, {
    createForeignKeyConstraints: false,
  })
  attachments?: LettersEntity[];
}

// application/Entities/Dental/Quotation.php
// application/Entity/Quote.php
