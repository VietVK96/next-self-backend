import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { EnumThirdPartyStatus } from "./third-party-amc.entity";

/**
 * @ORM\Entity(repositoryClass="App\Repository\ThirdPartyAmoRepository")
 * @ORM\Table(name="third_party_amo", uniqueConstraints={
 *  @ORM\UniqueConstraint(name="UNIQ_293362CEBF3B79EDE98D35D7", columns={"caresheet_id", "amo_id"})
 * })
 * @ORM\AssociationOverrides({
 *  @ORM\AssociationOverride(name="caresheet", inversedBy="thirdPartyAmo")
 * })
 */
@Entity('third_party_amo')
export class ThirdPartyAmoEntity {
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
   * @ORM\ManyToOne(targetEntity="Amo")
   * @ORM\JoinColumn(name="amo_id", referencedColumnName="id")
   * @Serializer\Expose
   * @Serializer\Groups({"amo:index"})
   */
  // @TODO EntityMissing
  // protected $amo;
}

//application/Entity/ThirdPartyAmo.php
