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

/**
 * @ORM\Entity
 * @ORM\Table(name="T_PAYPAL_PAYMENT_PPY")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_PAYPAL_PAYMENT_PPY')
export class PaypalPaymentEntity {
  /**
   * @ORM\Column(name="PPY_ID", type="string", length=30)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'PPY_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="PPY_TXN_ID", type="string", length=30)
   */
  @Column({
    name: 'PPY_TXN_ID',
    type: 'varchar',
    length: 30,
    nullable: false,
  })
  txnId?: string;

  /**
   * @ORM\Column(name="PPY_TXN_TYPE", type="string", length=100, nullable=true)
   */
  @Column({
    name: 'PPY_TXN_TYPE',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  txnType?: string;

  /**
   * @ORM\Column(name="PPY_PAYER_ID", type="string", length=30, nullable=true)
   */
  @Column({
    name: 'PPY_PAYER_ID',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  payerId?: string;

  /**
   * @ORM\Column(name="PPY_PAYER_STATUS", type="string", length=100, nullable=true)
   */
  @Column({
    name: 'PPY_PAYER_STATUS',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  payerStatus?: string;

  /**
   * @ORM\Column(name="PPY_PAYER_LASTNAME", type="string", length=100, nullable=true)
   */
  @Column({
    name: 'PPY_PAYER_LASTNAME',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  payerLastname?: string;

  /**
   * @ORM\Column(name="PPY_PAYER_FIRSTNAME", type="string", length=100, nullable=true)
   */
  @Column({
    name: 'PPY_PAYER_FIRSTNAME',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  payerFirstname?: string;

  /**
   * @ORM\Column(name="PPY_PAYER_MAIL", type="string", length=100, nullable=true)
   */
  @Column({
    name: 'PPY_PAYER_MAIL',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  payerEmail?: string;

  /**
   * @ORM\Column(name="PPY_PAYER_STREET", type="string", length=100, nullable=true)
   */
  @Column({
    name: 'PPY_PAYER_STREET',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  payerStreet?: string;

  /**
   * @ORM\Column(name="PPY_PAYER_CITY", type="string", length=50, nullable=true)
   */
  @Column({
    name: 'PPY_PAYER_CITY',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  payerCity?: string;

  /**
   * @ORM\Column(name="PPY_PAYER_STATE", type="string", length=3, nullable=true)
   */
  @Column({
    name: 'PPY_PAYER_STATE',
    type: 'char',
    length: 3,
    nullable: true,
  })
  payerState?: string;

  /**
   * @ORM\Column(name="PPY_PAYER_ZIP_CODE", type="string", length=11, nullable=true)
   */
  @Column({
    name: 'PPY_PAYER_ZIP_CODE',
    type: 'varchar',
    length: 11,
    nullable: true,
  })
  payerZipCode?: string;

  /**
   * @ORM\Column(name="PPY_PAYER_COUNTRY", type="string", length=20, nullable=true)
   */
  @Column({
    name: 'PPY_PAYER_COUNTRY',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  payerCountry?: string;

  /**
   * @ORM\Column(name="PPY_ITEM_NAME", type="string", length=255, nullable=true)
   */
  @Column({
    name: 'PPY_ITEM_NAME',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  itemName?: string;

  /**
   * @ORM\Column(name="PPY_ITEM_NBR", type="string", length=50, nullable=true)
   */
  @Column({
    name: 'PPY_ITEM_NBR',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  itemNbr?: string;

  /**
   * @ORM\Column(name="PPY_ITEM_QTY", type="string", length=3, nullable=true)
   */
  @Column({
    name: 'PPY_ITEM_QTY',
    type: 'char',
    length: 3,
    nullable: true,
  })
  itemQty?: string;

  /**
   * @ORM\Column(name="PPY_PAYMENT_DATE", type="string", length=50, nullable=true)
   */
  @Column({
    name: 'PPY_PAYMENT_DATE',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  paymentDate?: string;

  /**
   * @ORM\Column(name="PPY_PAYMENT_TYPE", type="string", length=10, nullable=true)
   */
  @Column({
    name: 'PPY_PAYMENT_TYPE',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  paymentType?: string;

  /**
   * @ORM\Column(name="PPY_PAYMENT_STATUS", type="string", length=15, nullable=true)
   */
  @Column({
    name: 'PPY_PAYMENT_STATUS',
    type: 'varchar',
    length: 15,
    nullable: true,
  })
  paymentStatus?: string;

  /**
   * @ORM\Column(name="PPY_PAYMENT_GROSS", type="string", length=6, nullable=true)
   */
  @Column({
    name: 'PPY_PAYMENT_GROSS',
    type: 'varchar',
    length: 6,
    nullable: true,
  })
  paymentGross?: string;

  /**
   * @ORM\Column(name="PPY_PAYMENT_FEE", type="string", length=5, nullable=true)
   */
  @Column({
    name: 'PPY_PAYMENT_FEE',
    type: 'varchar',
    length: 5,
    nullable: true,
  })
  paymentFee?: string;

  /**
   * @ORM\Column(name="PPY_PAYMENT_TAX", type="string", length=10, nullable=true)
   */
  @Column({
    name: 'PPY_PAYMENT_TAX',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  paymentTax?: string;

  /**
   * @ORM\Column(name="PPY_PAYMENT_CURRENCY", type="string", length=5, nullable=true)
   */
  @Column({
    name: 'PPY_PAYMENT_CURRENCY',
    type: 'varchar',
    length: 5,
    nullable: true,
  })
  paymentCurrency?: string;

  /**
   * @ORM\Column(name="PPY_CUSTOM", type="string", length=255, nullable=true)
   */
  @Column({
    name: 'PPY_CUSTOM',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  custom?: string;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   */
  // protected $user;
  @Column({
    name: 'USR_ID',
    type: 'int',
    width: 11,
  })
  usrId?: number;

  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'USR_ID',
  })
  user?: UserEntity;

  // protected $profil;
  @Column({
    name: 'PPL_ID',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  profil?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

// application/Entities/Paypal/Payment.php
