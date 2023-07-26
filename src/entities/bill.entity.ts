import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CashingEntity } from './cashing.entity';
import { UploadEntity } from './upload.entity';
import { UserEntity } from './user.entity';
import { DentalQuotationEntity } from './dental-quotation.entity';
import { BillLineEntity } from './bill-line.entity';
import { ContactEntity } from './contact.entity';
// 'cheque','carte','espece','virement','prelevement','autre','non payee'
export enum EnumBillPayment {
  CHEQUE = 'cheque',
  CARTE = 'carte',
  ESPECE = 'espece',
  VIREMENT = 'virement',
  PRELEVEMENT = 'prelevement',
  AUTRE = 'autre',
  NON_PAYEE = 'non payee',
}
/**
 * @ORM\Entity
 * @ORM\Table(name="T_BILL_BIL")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_BILL_BIL')
export class BillEntity {
  /**
   * @ORM\Column(name="BIL_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'BIL_ID',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Upload")
   * @ORM\JoinColumn(name="logo_id", referencedColumnName="UPL_ID")
   * @var \App\Entities\Upload Entité représentant le logo du devis.
   */
  //   protected $logo;
  @Column({
    name: 'logo_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  logoId?: number;

  @ManyToOne(() => UploadEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'logo_id',
  })
  logo?: UploadEntity;

  /**
   * @ORM\Column(name="BIL_NBR", type="string", length=30, nullable=false)
   */
  @Column({
    name: 'BIL_NBR',
    type: 'varchar',
    length: 30,
  })
  nbr?: string;

  /**
   * @ORM\Column(name="BIL_DATE", type="date", nullable=false)
   */
  @Column({
    name: 'BIL_DATE',
    type: 'date',
    nullable: true,
  })
  date?: string;

  /**
   * @ORM\Column(name="BIL_DATE", type="date")
   * @Serializer\Expose
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   * @Assert\NotNull
   */
  // @Column({
  //   name: 'BIL_DATE',
  //   type: 'date',
  //   nullable: true,
  // })
  // creationDate?: string;

  /**
   * @ORM\Column(name="BIL_NAME", type="text", nullable=false)
   */
  @Column({
    name: 'BIL_NAME',
    type: 'text',
  })
  name?: string;

  /**
   * @ORM\Column(name="BIL_IDENT_PRAT", type="text", nullable=false)
   */
  @Column({
    name: 'BIL_IDENT_PRAT',
    type: 'text',
  })
  identPrat?: string;

  /**
   * @ORM\Column(name="BIL_ADDR_PRAT", type="text", nullable=false)
   */
  @Column({
    name: 'BIL_ADDR_PRAT',
    type: 'text',
  })
  addrPrat?: string;

  /**
   * @ORM\Column(name="BIL_IDENT_CONTACT", type="text", nullable=false)
   */
  @Column({
    name: 'BIL_IDENT_CONTACT',
    type: 'text',
  })
  identContact?: string;

  /**
   * @ORM\Column(name="BIL_PAYMENT", type="string", nullable=false)
   */
  @Column({
    name: 'BIL_PAYMENT',
    type: 'enum',
    enum: EnumBillPayment,
  })
  payment?: EnumBillPayment;

  /**
   * @ORM\Column(name="BIL_INFO", type="text", nullable=false)
   */
  @Column({
    name: 'BIL_INFO',
    type: 'text',
  })
  info?: string;

  /**
   * @ORM\Column(name="BIL_AMOUNT", type="float", nullable=true)
   * @var float Montant total de la facture.
   */
  @Column({
    name: 'BIL_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  amount?: number;

  /**
   * @ORM\Column(name="BIL_SECU_AMOUNT", type="float", nullable=true)
   * @var float Montant total de la base de remboursement AMO.
   */
  @Column({
    name: 'BIL_SECU_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  secuAmount?: number;

  /**
   * @ORM\Column(name="signature_doctor", type="text", nullable=true)
   * @var string Image en base64 de la signature électronique.
   */
  @Column({
    name: 'signature_doctor',
    type: 'mediumtext',
    nullable: true,
  })
  signature_doctor?: string;

  /**
   * @ORM\Column(name="BIL_DELETE", type="integer", nullable=false)
   */
  @Column({
    name: 'BIL_DELETE',
    type: 'tinyint',
    width: 1,
    default: 1,
  })
  delete?: number = 1;

  /**
   * @ORM\Column(name="BIL_LOCK", type="integer", nullable=false)
   */
  @Column({
    name: 'BIL_LOCK',
    type: 'tinyint',
    width: 1,
    default: 1,
  })
  lock?: number = 1;

  /**
   * @ORM\Column(name="BIL_TEMPLATE", type="integer")
   * @var integer Modèle de facture utilisé.
   */
  @Column({
    name: 'BIL_TEMPLATE',
    type: 'int',
    width: 11,
    default: 1,
  })
  template?: number = 1;

  /**
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

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Dental\Quotation")
   * @ORM\JoinColumn(name="DQO_ID", referencedColumnName="DQO_ID")
   * @var \App\Entities\Dental\Quotation Entité représentant un devis.
   */
  //   protected $dentalQuotation;
  @Column({
    name: 'DQO_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  dqoId?: number;

  @ManyToOne(() => DentalQuotationEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'DQO_ID',
  })
  dentalQuotation?: DentalQuotationEntity;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Bill\Line", mappedBy="bill")
   */
  //   protected $lines;
  @OneToMany(() => BillLineEntity, (e) => e.bill)
  lines?: BillLineEntity[];

  /** File: application\Entities\Bill.php
   * @ORM\ManyToOne(targetEntity="\App\Entities\Contact", inversedBy="bills")
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

  @ManyToOne(() => ContactEntity, (e) => e.bills, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'CON_ID',
  })
  contact?: ContactEntity;

  /** File: application\Entity\Invoice.php
   * @ORM\ManyToOne(targetEntity="Patient")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   * @Serializer\Expose
   */
  //   protected $patient;

  @ManyToOne(() => ContactEntity, (e) => e.bills, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'CON_ID',
  })
  patient?: ContactEntity;

  // @Check TimeStamp
  //use TimestampableEntity;

  @OneToMany(() => CashingEntity, (e) => e.bill, {
    createForeignKeyConstraints: false,
  })
  cashings?: CashingEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}

// application/Entities/Bill.php
// application/Entity/Invoice.php
