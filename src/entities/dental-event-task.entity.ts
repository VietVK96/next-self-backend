import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { CcamEntity } from './ccam.entity';
import { NgapKeyEntity } from './ngapKey.entity';
import { EventTaskEntity } from './event-task.entity';
import { FseEntity } from './fse.entity';
import { DentalMaterialEntity } from './dental-material.entity';

export enum EnumDentalEventTaskType {
  NGAP = 'NGAP',
  CCAM = 'CCAM',
}

export enum EnumDentalEventTaskExceeding {
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
  N = 'N',
  A = 'A',
  M = 'M',
  B = 'B',
  C = 'C',
  L = 'L',
}

export enum EnumDentalEventTaskComp {
  N = 'N',
  F = 'F',
}

/**
 * @ORM\Entity
 * @ORM\Table(name="T_DENTAL_EVENT_TASK_DET")
 */
@Entity('T_DENTAL_EVENT_TASK_DET')
export class DentalEventTaskEntity {
  /**
   * @var string $_separator Teeth separator
   */
  _separator?: string = ',';

  @PrimaryColumn({
    name: 'ETK_ID',
    type: 'int',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Ccam")
   * @ORM\JoinColumn(name="ccam_id", referencedColumnName="id", nullable=true)
   */
  // protected $ccam = null;
  @Column({
    name: 'ccam_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  ccamId?: number;

  @ManyToOne(() => CcamEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'ccam_id' })
  ccam?: CcamEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\NgapKey")
   * @ORM\JoinColumn(name="ngap_key_id", referencedColumnName="id", nullable=true)
   */
  // protected $ngapKey = null;
  @Column({
    name: 'ngap_key_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  ngapKeyId?: number;

  @ManyToOne(() => NgapKeyEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'ngap_key_id' })
  ngapKey?: NgapKeyEntity;

  /**
   * @ORM\Column(name="DET_ALD", type="integer")
   */
  @Column({
    name: 'DET_ALD',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  ald?: number;

  /**
   * @ORM\Column(name="DET_TOOTH", type="text", nullable=true)
   */
  @Column({
    name: 'DET_TOOTH',
    type: 'text',
    nullable: true,
  })
  teeth?: string;

  /**
   * @ORM\Column(name="DET_TYPE", type="string", nullable=true, options={"default": "CCAM"})
   */
  @Column({
    name: 'DET_TYPE',
    type: 'enum',
    enum: EnumDentalEventTaskType,
    nullable: true,
    default: EnumDentalEventTaskType.NGAP,
  })
  type?: EnumDentalEventTaskType;

  /**
   * @ORM\Column(name="DET_COEF", type="decimal", precision=10, scale=2, nullable=true)
   */
  @Column({
    name: 'DET_COEF',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 1,
  })
  coef?: number;

  /**
   * @ORM\Column(name="DET_EXCEEDING", type="string", nullable=false)
   */
  @Column({
    name: 'DET_EXCEEDING',
    type: 'enum',
    enum: EnumDentalEventTaskExceeding,
    nullable: true,
  })
  exceeding?: EnumDentalEventTaskExceeding;

  /**
   * @ORM\Column(name="DET_CODE", type="string", length=7, nullable=true)
   * @deprecated
   */
  @Column({
    name: 'DET_CODE',
    type: 'varchar',
    length: 7,
    nullable: true,
  })
  code?: string;

  /**
   * @ORM\Column(name="DET_COMP", type="string", nullable=true)
   */
  @Column({
    name: 'DET_COMP',
    type: 'enum',
    enum: EnumDentalEventTaskComp,
    nullable: true,
  })
  comp?: EnumDentalEventTaskComp;

  /**
   * @ORM\Column(name="DET_PURCHASE_PRICE", type="float", nullable=false)
   */
  @Column({
    name: 'DET_PURCHASE_PRICE',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  purchasePrice?: number;

  /**
   * @ORM\Column(name="DET_CCAM_CODE", type="string", length=7, nullable=true)
   * @var string Code CCAM
   */
  @Column({
    name: 'DET_CCAM_CODE',
    type: 'varchar',
    length: 7,
    nullable: true,
  })
  ccamCode?: string;

  /**
   * @ORM\Column(name="DET_CCAM_OPPOSABLE", type="integer")
   * @var boolean Opposable - Tarif sécu
   */
  @Column({
    name: 'DET_CCAM_OPPOSABLE',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  ccamOpposable?: number;

  /**
   * @ORM\Column(name="DET_CCAM_NPC", type="integer")
   * @var boolean Non remboursable - Pas sur FS/FSE
   */
  @Column({
    name: 'DET_CCAM_NPC',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  ccamNPC?: number;

  /**
   * @ORM\Column(name="DET_CCAM_NR", type="integer")
   * @var boolean Non pris en charge - Pas sur FS/FSE
   */
  @Column({
    name: 'DET_CCAM_NR',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  ccamNR?: number;

  /**
   * @ORM\Column(name="DET_CCAM_TELEM", type="integer")
   * @var boolean Peut être mis sur feuille de soin
   */
  @Column({
    name: 'DET_CCAM_TELEM',
    type: 'tinyint',
    width: 1,
    default: 1,
  })
  ccamTelem?: number;

  /**
   * @ORM\Column(name="DET_CCAM_MODIFIER", type="string", length=45, nullable=true)
   */
  @Column({
    name: 'DET_CCAM_MODIFIER',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  ccamModifier?: string;

  /**
   * @ORM\Column(name="exceptional_refund", type="boolean", options={"default": false})
   */
  @Column({
    name: 'exceptional_refund',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  exceptionalRefund?: number;

  /**
   * @ORM\Column(name="DET_SECU_AMOUNT", type="float")
   * @var float Tarif sécurité sociale
   */
  @Column({
    name: 'DET_SECU_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  secuAmount?: number;

  /**
   * @ORM\Column(name="DET_SECU_REPAYMENT", type="float")
   * @var float Montant remboursé par la sécurité sociale
   */
  @Column({
    name: 'DET_SECU_REPAYMENT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  secuRepayment?: number;

  /**
   * @ORM\Column(name="DET_MUTUAL_REPAYMENT_TYPE", type="float")
   * @var integer Type de calcul pour le remboursement de la mutuelle
   */
  @Column({
    name: 'DET_MUTUAL_REPAYMENT_TYPE',
    type: 'int',
    width: 11,
    default: 1,
  })
  mutualRepaymentType?: number;

  /**
   * @ORM\Column(name="DET_MUTUAL_REPAYMENT_RATE", type="float")
   * @var float Taux du remboursement de la mutuelle
   */
  @Column({
    name: 'DET_MUTUAL_REPAYMENT_RATE',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  mutualRepaymentRate?: number;

  /**
   * @ORM\Column(name="DET_MUTUAL_REPAYMENT", type="float")
   * @var float Montant remboursé par le mutuelle
   */
  @Column({
    name: 'DET_MUTUAL_REPAYMENT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  mutualRepayment?: number;

  /**
   * @ORM\Column(name="DET_MUTUAL_COMPLEMENT", type="float")
   * @var float Complement de la mutuelle
   */
  @Column({
    name: 'DET_MUTUAL_COMPLEMENT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  mutualComplement?: number;

  /**
   * @ORM\Column(name="DET_PERSON_REPAYMENT", type="float")
   * @var float Montant remboursé pour le patient
   */
  @Column({
    name: 'DET_PERSON_REPAYMENT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  personRepayment?: number;

  /**
   * @ORM\Column(name="DET_PERSON_AMOUNT", type="float")
   * @var float Montant à charge du patient
   */
  @Column({
    name: 'DET_PERSON_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  personAmount?: number;

  @Column({
    name: 'DLK_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  dlk?: number;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\Event\Task", inversedBy="dental")
   * @ORM\JoinColumn(name="ETK_ID", referencedColumnName="ETK_ID")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="NONE")
   */
  // protected $task;
  @OneToOne(() => EventTaskEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'ETK_ID' })
  task?: EventTaskEntity;

  /** File: application\Entity\ActMedical.php
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="NONE")
   * @ORM\OneToOne(targetEntity="Act", inversedBy="medical", fetch="EAGER")
   * @ORM\JoinColumn(name="ETK_ID", referencedColumnName="ETK_ID")
   */
  // act?: number;
  @OneToOne(() => EventTaskEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'ETK_ID' })
  act?: EventTaskEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Fse", inversedBy="tasks")
   * @ORM\JoinColumn(name="FSE_ID", referencedColumnName="FSE_ID")
   */
  // protected $fse;
  @Column({ name: 'FSE_ID', type: 'int', width: 11, nullable: true })
  fseId?: number;

  @ManyToOne(() => FseEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'FSE_ID' })
  fse?: FseEntity;

  /**
   * @ORM\ManyToOne(targetEntity="DentalMaterial", fetch="EAGER")
   * @ORM\JoinColumn(name="dental_material_id", referencedColumnName="id", nullable=true)
   * @Serializer\Expose
   */
  // protected $material = null;
  @Column({
    name: 'dental_material_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  dentalMaterialId?: number;

  @ManyToOne(() => DentalMaterialEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'dental_material_id' })
  material?: DentalMaterialEntity;

  /** File: application\Entity\ActMedical.php
   * @ORM\Column(name="DET_TYPE", type="enum_nomenclature", nullable=true, options={"default": "CCAM"})
   * @Serializer\Expose
   * @Assert\Choice(callback={"App\Enum\NomenclatureEnum", "getValues"})
   */
  @Column({
    name: 'DET_TYPE',
    type: 'enum',
    enum: EnumDentalEventTaskType,
    nullable: true,
    default: EnumDentalEventTaskType.NGAP,
  })
  nomenclature?: EnumDentalEventTaskType;

  /** File: application\Entity\ActMedical.php
   * @ORM\Column(name="DET_CCAM_CODE", type="string", length=255, nullable=true)
   * @Serializer\Expose
   * @Assert\Type("string")
   */
  @Column({
    name: 'DET_CCAM_CODE',
    type: 'varchar',
    length: 7,
    nullable: true,
  })
  cotation?: string;

  /** File: application\Entity\ActMedical.php
   * @ORM\Column(name="DET_COEF", type="decimal", precision=10, scale=2, options={"default": 1})
   * @Serializer\Expose
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   * @Assert\GreaterThan(0)
   */
  @Column({
    name: 'DET_COEF',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 1,
  })
  coefficient?: number;

  /** File: application\Entity\ActMedical.php
   * @ORM\Column(name="DET_COMP", type="string", length=1, nullable=true)
   * @Serializer\Expose
   * @Assert\Choice({"F", "N", "U"})
   */
  @Column({
    name: 'DET_COMP',
    type: 'enum',
    enum: EnumDentalEventTaskComp,
    nullable: true,
  })
  complement?: EnumDentalEventTaskComp;

  /** File: application\Entity\ActMedical.php
   * @ORM\Column(name="DET_CCAM_MODIFIER", type="simple_array", nullable=true)
   * @Serializer\Expose
   * @Assert\Type("array")
   */
  @Column({
    name: 'DET_CCAM_MODIFIER',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  modifiers?: string;

  /** File: application\Entity\ActMedical.php
   * @ORM\Column(type="string", length=2, options={"fixed": true, "default": 10})
   * @Serializer\Expose
   */
  @Column({
    name: 'code_nature_assurance',
    type: 'char',
    length: 2,
    default: '10',
  })
  codeNatureAssurance?: string;

  /** File: application\Entity\ActMedical.php
   * @ORM\Column(name="exemption_code", type="string", length=1, options={"fixed": true, "default": 0})
   * @Assert\Choice(callback={"App\Enum\ExemptionCodeEnum", "getValues"})
   */
  @Column({
    name: 'exemption_code',
    type: 'char',
    length: 1,
    default: '0',
  })
  exemptionCode?: string;

  /** File: application\Entity\ActMedical.php
   * @ORM\Column(name="association_code", type="integer", nullable=true)
   * @Serializer\Expose
   * @Serializer\Type("int")
   * @Assert\Type("int")
   */
  @Column({
    name: 'association_code',
    type: 'int',
    width: 11,
    nullable: true,
  })
  associationCode?: number;

  /** File: application\Entity\ActMedical.php
   * @ORM\Column(name="DET_CCAM_TELEM", type="boolean", options={"default": true})
   * @Serializer\Expose
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'DET_CCAM_TELEM',
    type: 'tinyint',
    width: 1,
    default: 1,
  })
  transmitted?: number;

  /** File: application\Entity\ActMedical.php
   * @ORM\Column(name="DET_PURCHASE_PRICE", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'DET_PURCHASE_PRICE',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  buyingPrice?: number;

  /** File: application\Entity\ActMedical.php
   * @ORM\Column(name="DET_SECU_AMOUNT", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'DET_SECU_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amoAmount?: number;

  /** File: application\Entity\ActMedical.php
   * @ORM\Column(name="DET_SECU_REPAYMENT", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'DET_SECU_REPAYMENT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amoRefund?: number;

  /** File: application\Entity\ActMedical.php
   * @ORM\Column(name="DET_MUTUAL_REPAYMENT_TYPE", type="integer", options={"default": 1})
   * @Serializer\Expose
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(1)
   */
  @Column({
    name: 'DET_MUTUAL_REPAYMENT_TYPE',
    type: 'int',
    width: 11,
    default: 1,
  })
  amcRefundType?: number;

  /** File: application\Entity\ActMedical.php
   * @ORM\Column(name="DET_MUTUAL_REPAYMENT_RATE", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'DET_MUTUAL_REPAYMENT_RATE',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amcRefundRate?: number;

  /** File: application\Entity\ActMedical.php
   * @ORM\Column(name="DET_MUTUAL_REPAYMENT", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'DET_MUTUAL_REPAYMENT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amcRefund?: number;

  /** File: application\Entity\ActMedical.php
   * @ORM\Column(name="DET_MUTUAL_COMPLEMENT", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'DET_MUTUAL_COMPLEMENT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amcComplement?: number;

  /** File: application\Entity\ActMedical.php
   * @ORM\Column(name="DET_PERSON_AMOUNT", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'DET_PERSON_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  patientAmount?: number;

  /** File: application\Entity\ActMedical.php
   * @ORM\Column(name="DET_PERSON_REPAYMENT", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'DET_PERSON_REPAYMENT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  patientRefund?: number;
}

// application/Entities/Dental/Event/Task.php
// application/Entity/ActMedical.php
