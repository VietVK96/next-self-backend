import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
  // @TODO EntityMissing
  // protected $user;

  /**
   * @ORM\OneToOne(targetEntity="Patient")
   * @ORM\JoinColumn(name="patient_id", referencedColumnName="CON_ID")
   * @Serializer\Exclude
   */
  // @TODO EntityMissing
  // protected $patient;

  /**
   * @ORM\OneToOne(targetEntity="Caresheet")
   * @ORM\JoinColumn(name="caresheet_id", referencedColumnName="FSE_ID")
   * @Serializer\Exclude
   */
  // @TODO EntityMissing
  // protected $caresheet;

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
  // @TODO EntityMissing
  // protected $amc;

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
