import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LibraryBankEntity } from './library-bank.entity';
import { CashingEntity } from './cashing.entity';
import { UserEntity } from './user.entity';

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
  // protected $libraryBank;
  @Column({
    name: 'LBK_ID',
    type: 'int',
    width: 11,
  })
  lbkId?: number;
  @ManyToOne(() => LibraryBankEntity, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'LBK_ID',
  })
  libraryBank?: LibraryBankEntity;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Cashing", mappedBy="slipCheck")
   */
  // protected $cashings;
  @OneToMany(() => CashingEntity, (e) => e.slipCheck, {
    createForeignKeyConstraints: false
  })
  cashings?: CashingEntity[];

  /**
   * @ORM\ManyToOne(targetEntity="User")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   * @Assert\NotBlank
   */
  // protected $user;
  @Column({
    name: 'user_id',
    type: 'int',
    width: 11,
  })
  userId?: number;
  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'user_id',
  })
  user?: UserEntity;

  /**
   * @ORM\ManyToOne(targetEntity="Bank")
   * @ORM\JoinColumn(name="LBK_ID", referencedColumnName="LBK_ID")
   * @Serializer\Expose
   * @Serializer\MaxDepth(1)
   * @Assert\NotBlank
   */
  // protected $bank;
  @ManyToOne(() => LibraryBankEntity, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'LBK_ID',
  })
  bank?: LibraryBankEntity;

  /**
   * @ORM\Column(name="SLC_NBR", type="integer", options={"default": 1})
   * @Serializer\Expose
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(1)
   */
  // protected $number = 1;
  @Column({
    name: 'SLC_NBR',
    type: 'int',
    width: 11,
    default: 1,
  })
  number?: number;

  /** File: application\Entity\Bordereau.php
   * @ORM\OneToMany(targetEntity="Payment", mappedBy="bordereau")
   * @Serializer\Expose
   * @Serializer\Groups({"payments_group"})
   * @Serializer\MaxDepth(1)
   */
  // @TODO EntityMissing
  // protected $payments;
  @OneToMany(() => CashingEntity, (e) => e.bordereau, {
    createForeignKeyConstraints: false,
  })
  payments?: CashingEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

// application/Entities/Slip/Check.php
