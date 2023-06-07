import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum EnumDentalQuotationActType {
  OPERATION = 'operation',
  LIGNEBLANCHE = 'ligneBlanche',
  LIGNESEPARATION = 'ligneSeparation',
}

export enum EnumDentalQuotationActRefundable {
  NON = 'non',
  OUI = 'oui',
}

/**
 * @ORM\Entity
 * @ORM\Table(name="T_DENTAL_QUOTATION_ACT_DQA")
 */
@Entity('T_DENTAL_QUOTATION_ACT_DQA')
export class DentalQuotationActEntity {
  /**
   * @ORM\Column(name="DQA_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'DQA_ID',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\LibraryAct")
   * @ORM\JoinColumn(name="library_act_id", referencedColumnName="id", nullable=true)
   */
  // @TODO EntityMissing
  // protected $libraryAct = null;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\LibraryActQuantity")
   * @ORM\JoinColumn(name="library_act_quantity_id", referencedColumnName="id", nullable=true)
   */
  // @TODO EntityMissing
  // protected $libraryActQuantity = null;

  /**
   * @ORM\Column(name="DQA_POS", type="integer", nullable=true)
   */
  @Column({
    name: 'DQA_POS',
    type: 'int',
    width: 11,
    nullable: true,
  })
  pos?: number;

  /** File: application\Entity\QuoteAct.php
   * @ORM\Column(name="DQA_POS", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'DQA_POS',
    type: 'int',
    width: 11,
    nullable: true,
  })
  position?: number;

  /**
   * @ORM\Column(name="DQA_TYPE", type="string", nullable=true)
   */
  @Column({
    name: 'DQA_TYPE',
    type: 'enum',
    enum: EnumDentalQuotationActType,
    nullable: true,
  })
  type?: EnumDentalQuotationActType;

  /**
   * @ORM\Column(name="DQA_LOCATION", type="text", nullable=true)
   */
  @Column({
    name: 'DQA_LOCATION',
    type: 'text',
    nullable: true,
  })
  location?: string;

  /** File: application\Entity\QuoteAct.php
   * @ORM\Column(name="DQA_LOCATION", type="simple_array", length=255, nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("array")
   */
  @Column({
    name: 'DQA_LOCATION',
    type: 'text',
    nullable: true,
  })
  teeth?: string;

  /**
   * @ORM\Column(name="DQA_NAME", type="text", nullable=true)
   */
  @Column({
    name: 'DQA_NAME',
    type: 'text',
    nullable: true,
  })
  name?: string;

  /** File: application\Entity\QuoteAct.php
   * @ORM\Column(name="DQA_NAME", type="string", length=255, nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("string")
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'DQA_NAME',
    type: 'text',
    nullable: true,
  })
  label?: string;

  /**
   * @ORM\Column(name="DQA_MATERIAL", type="integer", nullable=true)
   */
  @Column({
    name: 'DQA_MATERIAL',
    type: 'varchar',
    length: 11,
    nullable: true,
  })
  material?: string;

  /** File: application\Entity\QuoteAct.php
   * @ORM\Column(name="DQA_MATERIAL", type="simple_array", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("array")
   */
  @Column({
    name: 'DQA_MATERIAL',
    type: 'varchar',
    length: 11,
    nullable: true,
  })
  materials?: string;

  /**
   * @ORM\Column(name="DQA_NGAP_CODE", type="text", nullable=true)
   */
  @Column({
    name: 'DQA_NGAP_CODE',
    type: 'text',
    nullable: true,
  })
  ngapCode?: string;

  /** File: application\Entity\QuoteAct.php
   * @ORM\Column(name="DQA_NGAP_CODE", type="string", length=255, nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("string")
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'DQA_NGAP_CODE',
    type: 'text',
    nullable: true,
  })
  cotation?: string;

  @Column({
    name: 'DQA_PURCHASE_PRICE',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  purchasePrice?: number;

  /**
   * @ORM\Column(name="DQA_REFUNDABLE", type="string", nullable=false)
   */
  @Column({
    name: 'DQA_REFUNDABLE',
    type: 'enum',
    enum: EnumDentalQuotationActRefundable,
    default: EnumDentalQuotationActRefundable.NON,
  })
  refundable?: EnumDentalQuotationActRefundable;

  /**
   * @ORM\Column(name="DQA_AMOUNT", type="float", nullable=false)
   */
  @Column({
    name: 'DQA_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amount?: number;

  /**
   * @ORM\Column(name="DQA_AMOUNT_SECU", type="float", nullable=false)
   */
  @Column({
    name: 'DQA_AMOUNT_SECU',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountSecu?: number;

  /**
   * @ORM\Column(name="DQA_RSS", type="float", nullable=false)
   */
  @Column({
    name: 'DQA_RSS',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  rss?: number;

  /**
   * @ORM\Column(name="DQA_ROC", type="float", nullable=false)
   */
  @Column({
    name: 'DQA_ROC',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  roc?: number;

  /**
   * @ORM\Column(name="DQA_SECU_AMOUNT", type="float")
   * @var float
   */
  @Column({
    name: 'DQA_SECU_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  secuAmount?: number;

  /** File: application\Entity\QuoteAct.php
   * @ORM\Column(name="DQA_SECU_AMOUNT", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'DQA_SECU_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amoAmount?: number;

  /**
   * @ORM\Column(name="DQA_SECU_REPAYMENT", type="float")
   * @var float
   */
  @Column({
    name: 'DQA_SECU_REPAYMENT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  secuRepayment?: number;

  /** File: application\Entity\QuoteAct.php
   * @ORM\Column(name="DQA_SECU_REPAYMENT", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'DQA_SECU_REPAYMENT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amoRefund?: number;

  /**
   * @ORM\Column(name="DQA_MUTUAL_REPAYMENT_TYPE", type="integer")
   * @var integer
   */
  @Column({
    name: 'DQA_MUTUAL_REPAYMENT_TYPE',
    type: 'int',
    width: 11,
    default: 1,
  })
  mutualRepaymentType?: number;

  /**
   * @ORM\Column(name="DQA_MUTUAL_REPAYMENT_RATE", type="float")
   * @var float
   */
  @Column({
    name: 'DQA_MUTUAL_REPAYMENT_RATE',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  mutualRepaymentRate?: number;

  /** File: application\Entity\QuoteAct.php
   * @ORM\Column(name="DQA_MUTUAL_REPAYMENT_RATE", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'DQA_MUTUAL_REPAYMENT_RATE',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amcRefundRate?: number;

  /**
   * @ORM\Column(name="DQA_MUTUAL_REPAYMENT", type="float")
   * @var float
   */
  @Column({
    name: 'DQA_MUTUAL_REPAYMENT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  mutualRepayment?: number;

  /**
   * @ORM\Column(name="DQA_MUTUAL_COMPLEMENT", type="float")
   * @var float
   */
  @Column({
    name: 'DQA_MUTUAL_COMPLEMENT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  mutualComplement?: number;

  /**
   * @ORM\Column(name="DQA_PERSON_REPAYMENT", type="float")
   * @var float
   */
  @Column({
    name: 'DQA_PERSON_REPAYMENT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  personRepayment?: number;

  /** File: application\Entity\QuoteAct.php
   * @ORM\Column(name="DQA_PERSON_REPAYMENT", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'DQA_PERSON_REPAYMENT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  patientRefund?: number;

  /**
   * @ORM\Column(name="DQA_PERSON_AMOUNT", type="float")
   * @var float
   */
  @Column({
    name: 'DQA_PERSON_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  personAmount?: number;

  /** File: application\Entity\QuoteAct.php
   * @ORM\Column(name="DQA_PERSON_AMOUNT", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'DQA_PERSON_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  patientAmount?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Dental\Quotation", inversedBy="acts")
   * @ORM\JoinColumn(name="DQO_ID", referencedColumnName="DQO_ID")
   */
  // @TODO EntityMissing
  // protected $quotation;

  /** File: application\Entity\QuoteAct.php
   * @ORM\ManyToOne(targetEntity="Quote", inversedBy="acts")
   * @ORM\JoinColumn(name="DQO_ID", referencedColumnName="DQO_ID")
   */
  // @TODO EntityMissing
  // protected $quote;

  /** File: application\Entity\QuoteAct.php
   * @ORM\Column(name="treatment_number", type="integer", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\GreaterThan(0)
   */
  @Column({
    name: 'treatment_number',
    type: 'int',
    width: 11,
    nullable: true,
  })
  treatmentNumber?: number;

  /** File: application\Entity\QuoteAct.php
   * @ORM\Column(type="string", length=1000, nullable=true)
   */
  @Column({
    name: 'descriptive_text',
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  descriptiveText?: string;

  /** File: application\Entity\QuoteAct.php
   * @ORM\Column(name="dental_localization", type="simple_array", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("array")
   */
  @Column({
    name: 'dental_localization',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  dentalLocalization?: string;

  /** File: application\Entity\QuoteAct.php
   * @ORM\Column(type="date", nullable=true)
   */
  @Column({
    name: 'estimated_month_treatment',
    type: 'date',
    nullable: true,
  })
  estimatedMonthTreatment?: string;
}

// application/Entities/Dental/Quotation/Act.php
// application/Entity/QuoteAct.php
