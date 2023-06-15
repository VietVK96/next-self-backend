import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { CorrespondentEntity } from './correspondent.entity';
import { DentalQuotationEntity } from './dental-quotation.entity';
import { ContactEntity } from './contact.entity';

export enum EnumLettersType {
  CONTACT = 'contact',
  CORRESPONDENT = 'correspondent',
  EMAIL = 'email',
  SMS = 'sms',
  MEDICAL_QUESTIONNAIRE = 'medical-questionnaire',
  HEADER = 'header',
  FOOTER = 'footer',
}

/**
 * @ORM\Entity
 * @ORM\Table(name="T_LETTERS_LET")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_LETTERS_LET')
export class LettersEntity {
  /**
   * @ORM\Column(name="LET_ID", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'LET_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="LET_TITLE", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"mail:index", "mail:read", "attachment:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'LET_TITLE',
    type: 'varchar',
    length: 80,
  })
  title?: string;

  /** File: application\Entities\Letters.php
   * @ORM\Column(name="LET_MSG", type="text")
   */
  @Column({
    name: 'LET_MSG',
    type: 'mediumtext',
  })
  msg?: string;

  /** File: application\Entity\Mail.php
   * @ORM\Column(name="LET_MSG", type="text")
   * @Serializer\Expose
   * @Serializer\Groups({"mail:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   */
  @Column({
    name: 'LET_MSG',
    type: 'mediumtext',
  })
  content?: string;

  /** File: application\Entities\Mail.php
   * @ORM\Column(name="LET_MSG", type="text")
   * @var string Corps du courrier.
   */
  @Column({
    name: 'LET_MSG',
    type: 'mediumtext',
  })
  body?: string;

  /** File: application\Entities\Letters.php and application\Entities\Mail.php
   * @ORM\Column(name="LET_TYPE", type="string")
   */
  @Column({
    name: 'LET_TYPE',
    type: 'enum',
    enum: EnumLettersType,
    nullable: true,
  })
  type?: EnumLettersType;

  /** File: application\Entity\Mail.php
   * @ORM\Column(name="LET_TYPE", type="string", length=255, options={"default": "contact"})
   * @Serializer\Expose
   * @Serializer\Groups({"mail:index", "mail:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   */
  @Column({
    name: 'LET_TYPE',
    type: 'enum',
    enum: EnumLettersType,
    nullable: true,
    default: EnumLettersType.CONTACT,
  })
  category?: EnumLettersType;

  /** File: application\Entities\Letters.php and application\Entity\Mail.php
   * @ORM\ManyToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   */
  //   protected $user;

  @Column({
    name: 'USR_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  usrId?: number;
  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'USR_ID',
  })
  user?: UserEntity;

  /** File: application\Entities\Mail.php
   * @ORM\ManyToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   * @var \App\Entities\User Docteur propriétaire du courrier.
   */
  //   protected $doctor;

  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'USR_ID',
  })
  doctor?: UserEntity;

  /** File: application\Entities\Letters.php
   * @ORM\ManyToOne(targetEntity="\App\Entities\Contact")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   */
  //   protected $contact;

  @Column({
    name: 'CON_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  conId?: number;
  @ManyToOne(() => ContactEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'CON_ID',
  })
  contact?: ContactEntity;

  /** File: application\Entities\Mail.php and application\Entity\Mail.php
   * @ORM\ManyToOne(targetEntity="\App\Entities\Contact")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   * @var \App\Entities\Contact Patient destinataire du courrier.
   */
  //   protected $patient;

  @ManyToOne(() => ContactEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'CON_ID',
  })
  patient?: ContactEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Correspondent")
   * @ORM\JoinColumn(name="CPD_ID", referencedColumnName="CPD_ID")
   * @var \App\Entities\Correspondent Correspondent destinataire du courrier.
   */
  //   protected $correspondent;

  @Column({
    name: 'CPD_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  cpdId?: number;
  @ManyToOne(() => CorrespondentEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'CPD_ID',
  })
  correspondent?: CorrespondentEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Mail")
   * @ORM\JoinColumn(name="header_id", referencedColumnName="LET_ID")
   * @var \App\Entities\Mail En-tête du courrier.
   */
  //   protected $header;

  @Column({
    name: 'header_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  headerId?: number;
  @ManyToOne(() => LettersEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'header_id',
  })
  header?: LettersEntity;

  /**
   * @ORM\ManyToOne(targetEntity="Mail")
   * @ORM\JoinColumn(name="footer_id", referencedColumnName="LET_ID", nullable=true)
   */
  //   protected $footer = null;

  @Column({
    name: 'footer_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  footerId?: number;
  @ManyToOne(() => LettersEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'footer_id',
  })
  footer?: LettersEntity;

  /**
   * @ORM\Column(type="decimal", precision=10, scale=2, nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"mail:read"})
   */
  @Column({
    name: 'height',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  height?: number;

  /**
   * @ORM\Column(type="boolean", options={"default": false})
   * @Serializer\Expose
   * @Serializer\Groups({"mail:index", "mail:read"})
   */
  @Column({
    name: 'favorite',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  favorite?: number;

  /**
   * @ORM\ManyToOne(targetEntity="Quote", inversedBy="attachments")
   * @ORM\JoinColumn(referencedColumnName="DQO_ID", nullable=true, onDelete="SET NULL")
   */
  //   protected $quote = null;

  @Column({
    name: 'quote_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  quoteId?: number;
  @ManyToOne(() => DentalQuotationEntity, (e) => e.attachments, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'quote_id',
  })
  quote?: DentalQuotationEntity;

  /**
   * @ORM\Column(type="text", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"mail:read"})
   */
  @Column({
    name: 'footer_content',
    type: 'text',
    nullable: true,
  })
  footerContent?: string;

  /**
   * @ORM\Column(type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"mail:read"})
   */
  @Column({
    name: 'footer_height',
    type: 'int',
    width: 11,
    default: 0,
  })
  footerHeight?: number;

  // @Check TimeStamp
  // use TimestampableEntity;
  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

// application/Entities/Letters.php
// application/Entities/Mail.php
// application/Entity/Mail.php
