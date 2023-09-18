import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { ContactEntity } from './contact.entity';
import { BillEntity } from './bill.entity';
import { LibraryBankEntity } from './library-bank.entity';
import { SlipCheckEntity } from './slip-check.entity';
import { CorrespondentEntity } from './correspondent.entity';
import { CashingContactEntity } from './cashing-contact.entity';
import { ThirdPartyAmoEntity } from './third-party-amo.entity';
import { ThirdPartyAmcEntity } from './third-party-amc.entity';

export enum EnumCashingPayment {
  ESPECE = 'espece',
  CHEQUE = 'cheque',
  CARTE = 'carte',
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
  // protected $correspondent;
  @Column({
    name: 'correspondent_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  correspondentId?: number;

  @ManyToOne(() => CorrespondentEntity, (e) => e.cashings, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'correspondent_id',
  })
  correspondent?: CorrespondentEntity;

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
    nullable: true,
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

  // /**
  //  * @ORM\Column(name="CSG_CHECK_NBR", type="string", length=45, nullable=true)
  //  */
  // @Column({
  //   name: 'CSG_CHECK_NBR',
  //   type: 'varchar',
  //   length: 45,
  //   nullable: true,
  // })
  // checkNbr?: string;

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
  amount?: number;

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
  amountCare?: number;

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
  amountProsthesis?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User", inversedBy="cashings")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   */
  //   protected $user;
  @Column({
    name: 'USR_ID',
    type: 'int',
    width: 11,
  })
  usrId?: number;

  @ManyToOne(() => UserEntity, (e) => e.cashings, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'USR_ID',
  })
  user?: UserEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Contact", inversedBy="cashings")
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

  @ManyToOne(() => ContactEntity, (e) => e.cashings, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'CON_ID',
  })
  contact?: ContactEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Bill")
   * @ORM\JoinColumn(name="BIL_ID", referencedColumnName="BIL_ID")
   */
  //   protected $bill;
  @Column({
    name: 'BIL_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  bilId?: number;

  @ManyToOne(() => BillEntity, (e) => e.cashings, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'BIL_ID',
  })
  bill?: BillEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Library\Bank")
   * @ORM\JoinColumn(name="LBK_ID", referencedColumnName="LBK_ID")
   */
  //   protected $libraryBank;
  @Column({
    name: 'LBK_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  lbkId?: number;

  @ManyToOne(() => LibraryBankEntity, (e) => e.cashings, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'LBK_ID',
  })
  libraryBank?: LibraryBankEntity;

  @Column({
    name: 'FSE_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  fseId?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Slip\Check", inversedBy="cashings")
   * @ORM\JoinColumn(name="SLC_ID", referencedColumnName="SLC_ID")
   */
  //   protected $slipCheck;
  @Column({
    name: 'SLC_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  slcId?: number;

  @ManyToOne(() => SlipCheckEntity, (e) => e.cashings, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'SLC_ID',
  })
  slipCheck?: SlipCheckEntity;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Cashing\Contact", mappedBy="cashing")
   */
  //   protected $cashingContacts;
  @OneToMany(() => CashingContactEntity, (e) => e.cashing, {
    createForeignKeyConstraints: false,
  })
  cashingContacts?: CashingContactEntity[];

  /**
   * @ORM\ManyToOne(targetEntity="Patient")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID", nullable=true)
   */
  // protected $payer = NULL;
  @ManyToOne(() => ContactEntity, (e) => e.cashings, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'CON_ID',
  })
  payer?: ContactEntity;

  /**
   * @ORM\ManyToOne(targetEntity="Bank")
   * @ORM\JoinColumn(name="LBK_ID", referencedColumnName="LBK_ID", nullable=true)
   * @Serializer\Expose
   * @Serializer\MaxDepth(1)
   */
  // protected $bank = null;
  @ManyToOne(() => LibraryBankEntity, (e) => e.cashings, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'LBK_ID',
  })
  bank?: LibraryBankEntity;

  /**
   * @ORM\ManyToOne(targetEntity="Bordereau", inversedBy="payments")
   * @ORM\JoinColumn(name="SLC_ID", referencedColumnName="SLC_ID", nullable=true)
   */
  // protected $bordereau = NULL;
  @ManyToOne(() => SlipCheckEntity, (e) => e.payments, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'SLC_ID',
  })
  bordereau?: SlipCheckEntity;

  // /**
  //  * @ORM\Column(name="CSG_DEBTOR", type="string", length=255)
  //  * @Serializer\Expose
  //  * @Assert\Type("string")
  //  * @Assert\NotBlank
  //  * @Assert\Length(max=255)
  //  */
  // @Column({
  //   name: 'CSG_DEBTOR',
  //   type: 'text',
  //   nullable: true,
  // })
  // label?: string;

  // /**
  //  * @ORM\Column(name="CSG_MSG", type="text", nullable=true)
  //  * @Serializer\Expose
  //  * @Assert\Type("string")
  //  */
  // @Column({
  //   name: 'CSG_MSG',
  //   type: 'text',
  //   nullable: true,
  // })
  // observation?: string;

  // /**
  //  * @ORM\Column(name="CSG_DATE", type="date", nullable=true)
  //  * @Serializer\Expose
  //  * @Serializer\Type("DateTime<'Y-m-d'>")
  //  * @Assert\Date
  //  */
  // @Column({
  //   name: 'CSG_DATE',
  //   type: 'date',
  //   nullable: true,
  // })
  // entryDate?: string;

  /**
   * @ORM\Column(name="CSG_PAYMENT", type="enum_payment_method", nullable=true, options={"default": "cheque"})
   * @Serializer\Expose
   * @Assert\Choice(callback={"App\Enum\PaymentMethodEnum", "getValues"})
   */
  // @Column({
  //   name: 'CSG_PAYMENT',
  //   type: 'enum',
  //   enum: EnumCashingPayment,
  //   default: EnumCashingPayment.CHEQUE,
  //   nullable: true,
  // })
  // method?: EnumCashingPayment;

  /**
   * @ORM\Column(name="CSG_CHECK_NBR", type="string", length=255, nullable=true)
   * @Assert\Type("string")
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'CSG_CHECK_NBR',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  checkNumber?: string;

  /**
   * @ORM\Column(name="is_tp", type="boolean", options={"default": false})
   * @Serializer\Expose
   * @Serializer\Type("boolean")
   * @Assert\Type("boolean")
   * @Assert\NotNull
   */
  @Column({
    name: 'is_tp',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  isTp?: number;

  /**
   * @ORM\OneToMany(targetEntity="PaymentPayee", mappedBy="payment", cascade={"persist", "remove"}, orphanRemoval=true)
   * @Serializer\Expose
   */
  // protected $payees;
  @OneToMany(() => CashingContactEntity, (e) => e.payment, {
    createForeignKeyConstraints: false,
  })
  payees?: CashingContactEntity[];

  /**
   * @ORM\ManyToMany(targetEntity="ThirdPartyAmo")
   * @ORM\JoinTable(name="payment_third_party_amo", joinColumns={
   *  @ORM\JoinColumn(name="payment_id", referencedColumnName="CSG_ID")
   * }, inverseJoinColumns={
   *  @ORM\JoinColumn(name="third_party_amo_id", referencedColumnName="id")
   * })
   */
  // protected $thirdPartyAmos;
  @ManyToMany(() => ThirdPartyAmoEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinTable({
    name: 'payment_third_party_amo',
    joinColumn: {
      name: 'payment_id',
    },
    inverseJoinColumn: {
      name: 'third_party_amo_id',
    },
  })
  thirdPartyAmos?: ThirdPartyAmoEntity[];

  /**
   * @ORM\ManyToMany(targetEntity="ThirdPartyAmc")
   * @ORM\JoinTable(name="payment_third_party_amc", joinColumns={
   *  @ORM\JoinColumn(name="payment_id", referencedColumnName="CSG_ID")
   * }, inverseJoinColumns={
   *  @ORM\JoinColumn(name="third_party_amc_id", referencedColumnName="id")
   * })
   */
  // protected $thirdPartyAmcs;
  @ManyToMany(() => ThirdPartyAmcEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinTable({
    name: 'payment_third_party_amc',
    joinColumn: {
      name: 'payment_id',
    },
    inverseJoinColumn: {
      name: 'third_party_amc_id',
    },
  })
  thirdPartyAmcs?: ThirdPartyAmcEntity[];
}

// application\Entities\Cashing.php
// application\Entity\Payment.php
