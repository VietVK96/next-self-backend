import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EnumSlipCheckPaymentChoice {
  ESPECE = 'espece',
  CHEQUE = 'cheque',
  CARTE = 'carte',
  VIREMENT = 'virement',
  PRELEVEMENT = 'prelevement',
}

/**
 * @ORM\Entity
 * @ORM\Table(name="T_SLIP_CHECK_SLC")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_SLIP_CHECK_SLC')
export class SlipCheckEntity {
  /**
   * @ORM\Column(name="SLC_ID", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @var integer Identifiant de l'enregistrement.
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'SLC_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="SLC_NBR", type="integer")
   * @var integer Numéro du bordereau de remise de chèques.
   */
  @Column({
    name: 'SLC_NBR',
    default: 1,
  })
  nbr?: number;

  /**
   * @ORM\Column(name="SLC_DATE", type="date")
   * @var DateTime Date du bordereau de remise de chèques.
   */
  @Column({
    name: 'SLC_DATE',
    type: 'date',
  })
  date?: string;

  /**
   * @ORM\Column(name="label", type="string", length=255)
   * @Serializer\Expose
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'label',
    length: 255,
  })
  label?: string;

  /**
   * @ORM\Column(name="payment_choice", type="enum_payment_method", options={"default": "cheque"})
   * @Serializer\Expose
   * @Assert\Choice(callback={"App\Enum\PaymentMethodEnum", "getValues"})
   */
  @Column({
    name: 'payment_choice',
    type: 'varchar',
    length: 255,
    default: EnumSlipCheckPaymentChoice.CHEQUE,
  })
  paymentChoice?: EnumSlipCheckPaymentChoice;

  /**
   * @ORM\Column(name="payment_count", type="integer", options={"default": 1})
   * @Serializer\Expose
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(1)
   */
  @Column({
    name: 'payment_count',
    default: 1,
  })
  paymentCount?: number;

  /**
   * @ORM\Column(name="amount", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  amount?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Library\Bank")
   * @ORM\JoinColumn(name="LBK_ID", referencedColumnName="LBK_ID")
   * @var \App\Entities\Library\Bank Entité représentant la banque.
   */
  // @TODO EntityMissing
  // protected $libraryBank;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Cashing", mappedBy="slipCheck")
   */
  // @TODO EntityMissing
  // protected $cashings;

  /**
   * @ORM\ManyToOne(targetEntity="User")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   * @Assert\NotBlank
   */
  // @TODO EntityMissing
  // protected $user;

  /**
   * @ORM\ManyToOne(targetEntity="Bank")
   * @ORM\JoinColumn(name="LBK_ID", referencedColumnName="LBK_ID")
   * @Serializer\Expose
   * @Serializer\MaxDepth(1)
   * @Assert\NotBlank
   */
  // @TODO EntityMissing
  // protected $bank;

  /**
   * @ORM\Column(name="SLC_NBR", type="integer", options={"default": 1})
   * @Serializer\Expose
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(1)
   */
  // @TODO EntityMissing
  // protected $number = 1;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

// application/Entities/Slip/Check.php
