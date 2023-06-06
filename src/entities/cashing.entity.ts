import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EnumCashingPayment {
  CHEQUE = 'cheque',
  CARTE = 'carte',
  ESPECE = 'espece',
  VIREMENT = 'virement',
  PRELEVEMENT = 'prelevement',
}

export enum EnumCashingType {
  SOLDE = 'solde',
  ACOMPTE = 'acompte',
  HONORAIRE = 'honoraire',
  REMBOURSEMENT = 'remboursement',
}

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\Cashing")
 * @ORM\Table(name="T_CASHING_CSG")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_CASHING_CSG')
export class CashingEntity {
  // use TimestampableTrait;
  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  /**
   * @ORM\Column(name="CSG_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'CSG_ID',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Correspondent")
   * @ORM\JoinColumn(name="correspondent_id", referencedColumnName="CPD_ID")
   * @var \App\Entities\Correspondent
   */
  // @TODO EntityMissing
  //   protected $correspondent;

  /**
   * @ORM\Column(name="CSG_NAME", type="text", nullable=true)
   */
  @Column({
    name: 'CSG_NAME',
    type: 'text',
    nullable: true,
  })
  name?: string;

  /**
   * @ORM\Column(name="CSG_DEBTOR", type="text", nullable=true)
   */
  @Column({
    name: 'CSG_DEBTOR',
    type: 'text',
    nullable: true,
  })
  debtor?: string;

  /**
   * @ORM\Column(name="CSG_DATE", type="date", nullable=true)
   */
  @Column({
    name: 'CSG_DATE',
    type: 'date',
    nullable: true,
  })
  date?: string;

  /**
   * @ORM\Column(name="CSG_MSG", type="text", nullable=true)
   */
  @Column({
    name: 'CSG_MSG',
    type: 'text',
    nullable: true,
  })
  msg?: string;

  /**
   * @ORM\Column(name="CSG_PAYMENT", type="string", nullable=false)
   */
  @Column({
    name: 'CSG_PAYMENT',
    type: 'enum',
    enum: EnumCashingPayment,
    default: EnumCashingPayment.CHEQUE,
  })
  payment?: EnumCashingPayment;

  /**
   * @ORM\Column(name="CSG_PAYMENT_DATE", type="date")
   */
  @Column({
    name: 'CSG_PAYMENT_DATE',
    type: 'date',
  })
  paymentDate?: string;

  /**
   * @ORM\Column(name="CSG_CHECK_NBR", type="string", length=45, nullable=true)
   */
  @Column({
    name: 'CSG_CHECK_NBR',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  checkNbr?: string;

  /**
   * @ORM\Column(name="CSG_CHECK_BANK", type="string", length=100, nullable=true)
   */
  @Column({
    name: 'CSG_CHECK_BANK',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  checkBank?: string;

  /**
   * @ORM\Column(name="CSG_TYPE", type="string", nullable=false)
   */
  @Column({
    name: 'CSG_TYPE',
    type: 'enum',
    enum: EnumCashingType,
    default: EnumCashingType.SOLDE,
  })
  type?: EnumCashingType;

  /**
   * @ORM\Column(name="CSG_AMOUNT", type="float", nullable=false)
   */
  @Column({
    name: 'CSG_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  amount?: string;

  /**
   * @ORM\Column(name="amount_care", type="decimal", precision=10, scale=2)
   * @var decimal Montant total des soins.
   */
  @Column({
    name: 'amount_care',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  amountCare?: string;

  /**
   * @ORM\Column(name="amount_prosthesis", type="decimal", precision=10, scale=2)
   * @var decimal Montant total des prothèses.
   */
  @Column({
    name: 'amount_prosthesis',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  amountProsthesis?: string;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User", inversedBy="cashings")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   */
  // @TODO EntityMissing
  //   protected $user;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Contact", inversedBy="cashings")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   */
  // @TODO EntityMissing
  //   protected $contact;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Bill")
   * @ORM\JoinColumn(name="BIL_ID", referencedColumnName="BIL_ID")
   */
  // @TODO EntityMissing
  //   protected $bill;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Library\Bank")
   * @ORM\JoinColumn(name="LBK_ID", referencedColumnName="LBK_ID")
   */
  // @TODO EntityMissing
  //   protected $libraryBank;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Slip\Check", inversedBy="cashings")
   * @ORM\JoinColumn(name="SLC_ID", referencedColumnName="SLC_ID")
   */
  // @TODO EntityMissing
  //   protected $slipCheck;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Cashing\Contact", mappedBy="cashing")
   */
  // @TODO EntityMissing
  //   protected $cashingContacts;
}

// application\Entities\Cashing.php
