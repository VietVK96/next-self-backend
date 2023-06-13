import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ContactEntity } from './contact.entity';
import { UserEntity } from './user.entity';
/**
 * @ORM\Entity
 * @ORM\Table(name="contact_user_cou")
 */

@Entity('contact_user_cou')
export class ContactUserEntity {
  /**
   * @ORM\Column(name="cou_id", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @var integer $id Identifiant de l'enregistrement.
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'cou_id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Contact", inversedBy="contactUsers")
   * @ORM\JoinColumn(name="con_id", referencedColumnName="CON_ID")
   * @var \App\Entities\Contact $contact Entité représentant le patient.
   */
  // protected $contact;
  @Column({
    name: 'con_id',
    type: 'int',
    width: 11,
  })
  conId?: number;

  @ManyToOne(() => ContactEntity, (e) => e.contactUsers, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'con_id',
    referencedColumnName: 'CON_ID',
  })
  contact: ContactEntity;

  /**
   * @ORM\ManyToOne(targetEntity="Patient")
   * @ORM\JoinColumn(name="con_id", referencedColumnName="CON_ID")
   * @Serializer\Expose
   * @Serializer\Groups({"unpaid:index"})
   * @Assert\NotNull
   */
  // protected $patient;

  @Column({
    name: 'con_id',
    type: 'int',
    width: 11,
  })
  patientId?: number;

  @ManyToOne(() => ContactEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'con_id',
    referencedColumnName: 'CON_ID',
  })
  patient: ContactEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="usr_id", referencedColumnName="USR_ID")
   * @var \App\Entities\User $user Entité représentant le praticien.
   */
  // protected $user;

  @Column({
    name: 'usr_id',
    type: 'int',
    width: 11,
  })
  usrId?: number;

  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'usr_id',
    referencedColumnName: 'USR_ID',
  })
  user: UserEntity;

  /**
   * @ORM\Column(name="cou_unpaid_level", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"unpaid:index"})
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'cou_unpaid_level',
    type: 'int',
    nullable: false,
    default: 0,
  })
  relaunchLevel?: number;

  /**
   * @ORM\Column(name="cou_unpaid_last_recovery", type="date", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"unpaid:index"})
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   */
  @Column({
    name: 'cou_unpaid_last_recovery',
    type: 'date',
    nullable: true,
  })
  relaunchDate?: string;

  /**
   * @ORM\Column(name="cou_amount_due", type="decimal", precision=10, scale=2)
   * @var float Montant dû.
   */
  @Column({
    name: 'cou_amount_due',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.0,
  })
  amountDue?: number;

  /**
   * @ORM\Column(name="cou_amount_due", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'cou_amount_due',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.0,
  })
  balance?: number;

  /**
   * @ORM\Column(name="cou_amount_due", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"unpaid:index"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'cou_amount_due',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.0,
  })
  amount?: number;

  /**
   * @ORM\Column(name="amount_due_care", type="decimal", precision=10, scale=2)
   * @var float Montant dû des soins.
   */
  @Column({
    name: 'amount_due_care',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.0,
  })
  amountDueCare?: number;

  /**
   * @ORM\Column(name="amount_due_care", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'amount_due_care',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.0,
  })
  balanceCare?: number;

  /**
   * @ORM\Column(name="amount_due_care", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"unpaid:index"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'amount_due_care',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.0,
  })
  amountCare?: number;

  /**
   * @ORM\Column(name="amount_due_prosthesis", type="decimal", precision=10, scale=2)
   * @var float Montant dû des prothèses.
   */
  @Column({
    name: 'amount_due_prosthesis',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.0,
  })
  amountDueProsthesis?: number;

  /**
   * @ORM\Column(name="amount_due_prosthesis", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'amount_due_prosthesis',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.0,
  })
  balanceProsthesis?: number;

  /**
   * @ORM\Column(name="amount_due_prosthesis", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"unpaid:index"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'amount_due_prosthesis',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.0,
  })
  amountProsthesis?: number;

  /**
   * @ORM\Column(name="cou_last_payment", type="date", nullable=true)
   * @var \DateTime|NULL $lastPayment Date de dernier paiement.
   */
  @Column({
    name: 'cou_last_payment',
    type: 'date',
    nullable: true,
  })
  lastPayment?: string;

  /**
   * @ORM\Column(name="cou_last_care", type="date", nullable=true)
   * @var \DateTime|NULL $lastCare Date de dernier soin.
   */
  @Column({
    name: 'cou_last_care',
    type: 'date',
    nullable: true,
  })
  lastCare?: string;

  /**
   * @ORM\Column(name="cou_last_care", type="date", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"unpaid:index"})
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   */
  @Column({
    name: 'cou_last_care',
    type: 'date',
    nullable: true,
  })
  visitDate?: string;

  /**
   * @ORM\Column(name="cou_force_update", type="integer")
   * @var boolean $forceUpdate Force la mise à jour des informations.
   */
  @Column({
    name: 'cou_force_update',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0,
  })
  forceUpdate?: number;

  /**
   * @ORM\Column(name="third_party_balance", type="decimal", precision=0, scale=2, options={"default": 0})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'third_party_balance',
    type: 'decimal',
    precision: 0,
    scale: 2,
    default: 0.0,
  })
  thirdPartyBalance?: number;
}

//application/Entiteies/ContactUser.php
// application\Entities\PatientUserEntity.php
// application\Entity\PatientBalance.php
// application\Entity\PatientUser.php
