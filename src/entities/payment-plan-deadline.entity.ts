import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="App\Repository\PaymentPlanDeadlineRepository")
 * @ORM\Table(name="payment_schedule_line")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('payment_schedule_line')
export class PaymentPlanDeadlineEntity {

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "paymentPlan:read"
   * })
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="PaymentPlan", inversedBy="deadlines")
   * @ORM\JoinColumn(name="payment_schedule_id", referencedColumnName="id")
   */
  // @TODO EntityMissing
  // protected $paymentPlan;

  /**
   * @ORM\Column(name="date", type="date")
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "paymentPlan:read"
   * })
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   * @Assert\NotNull
   */
  @Column({
    name: 'date',
    type: 'date',
  })
  dueDate?: string;

  /**
   * @ORM\Column(name="amount", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "paymentPlan:read"
   * })
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  amount?: number;

}

//application/Entity/PaymentPlanDeadline.php