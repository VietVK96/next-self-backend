import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./user.entity";
import { ContactEntity } from "./contact.entity";
import { FseEntity } from "./fse.entity";
import { AmcEntity } from "./amc.entity";

export enum EnumThirdPartyStatus {
  WAITING = 'WTN',
  INCOMPLETE = 'INK',
  PAID = 'PYD',
  REJECTED = 'RJT',
}

/**
 * @ORM\Entity(repositoryClass="App\Repository\ThirdPartyAmcRepository")
 * @ORM\Table(name="third_party_amc", uniqueConstraints={
 *  @ORM\UniqueConstraint(name="UNIQ_20852EE5BF3B79EDA35B8A6F", columns={"caresheet_id", "amc_id"})
 * })
 * @ORM\AssociationOverrides({
 *  @ORM\AssociationOverride(name="caresheet", inversedBy="thirdPartyAmc")
 * })
 */
@Entity('third_party_amc')
export class ThirdPartyAmcEntity {
  /**
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(name="id", type="integer")
     * @Serializer\Groups({"Default", "third_party_summary", "caresheet:index", "caresheet:read", "tiersPayant:index"})
     * @Serializer\Type("int")
     */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\OneToOne(targetEntity="User")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   * @Serializer\Exclude
   */
  // protected $user;
  @Column({ name: "user_id", type: 'int', width: 11 })
  userId?: number;

  @OneToOne(() => UserEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  /**
   * @ORM\OneToOne(targetEntity="Patient")
   * @ORM\JoinColumn(name="patient_id", referencedColumnName="CON_ID")
   * @Serializer\Exclude
   */
  // protected $patient;
  @Column({ name: "patient_id", type: 'int', width: 11 })
  patientId?: number;

  @OneToOne(() => ContactEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'patient_id' })
  patient?: ContactEntity;

  /**
   * @ORM\OneToOne(targetEntity="Caresheet")
   * @ORM\JoinColumn(name="caresheet_id", referencedColumnName="FSE_ID")
   * @Serializer\Exclude
   */
  // protected $caresheet;
  @Column({ name: "caresheet_id", type: 'int', width: 11 })
  caresheetId?: number;

  @OneToOne(() => FseEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'caresheet_id' })
  caresheet?: FseEntity;

  /**
   * @ORM\Column(name="amount", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amount?: number;

  /**
   * @ORM\Column(name="amount_paid", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'amount_paid',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountPaid?: number;

  /**
   * @ORM\Column(name="amount_paid_manually", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'amount_paid_manually',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountPaidManually?: number;

  /**
   * @ORM\Column(name="amount_paid_noemie", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'amount_paid_noemie',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountPaidNoemie?: number;

  /**
   * @ORM\Column(name="amount_care", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'amount_care',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountCare?: number;

  /**
   * @ORM\Column(name="amount_care_paid", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'amount_care_paid',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountCarePaid?: number;

  /**
   * @ORM\Column(name="amount_prosthesis", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'amount_prosthesis',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountProsthesis?: number;

  /**
   * @ORM\Column(name="amount_prosthesis_paid", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'amount_prosthesis_paid',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountProsthesisPaid?: number;

  /**
   * @ORM\Column(name="status", type="string", length=3, options={"fixed": true})
   * @Serializer\Groups({"Default", "third_party_summary", "caresheet:index", "caresheet:read", "tiersPayant:index"})
   * @Assert\Choice(callback={"App\Enum\ThirdPartyStatusEnum", "getValues"})
   * @Assert\NotNull
   */
  @Column({
    name: 'status',
    type: 'char',
    length: 3,
    default: EnumThirdPartyStatus.WAITING,
  })
  status?: EnumThirdPartyStatus;

  /**
   * @ORM\ManyToOne(targetEntity="Amc")
   * @ORM\JoinColumn(name="amc_id", referencedColumnName="id")
   * @Serializer\Expose
   * @Serializer\Groups({"amc:index"})
   */
  // protected $amc;
  @Column({ name: 'amc_id', type: 'int', width: 11 })
  amcId?: number;

  @ManyToOne(() => AmcEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'amc_id' })
  amc?: AmcEntity;

  /**
   * @ORM\Column(name="is_dre", type="boolean", options={"default": false})
   * @Serializer\Type("boolean")
   * @Assert\Type("boolean")
   * @Assert\NotNull
   */
  @Column({
    name: 'is_dre',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  isDre?: number;
}

//application/Entity/ThirdPartyAmc.php
