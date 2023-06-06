import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="App\Repository\PaymentPlanRepository")
 * @ORM\Table(name="payment_schedule")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('payment_schedule')
export class PaymentPlanEntity {

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "paymentPlan:index",
   *  "paymentPlan:read"
   * })
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="label", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "paymentPlan:index",
   *  "paymentPlan:read"
   * })
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'label',
    type: 'varchar',
    length: 255,
    nullable: false
  })
  title?: string;

  /**
   * @ORM\Column(name="amount", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "paymentPlan:index",
   *  "paymentPlan:read"
   * })
   * @Assert\Type("float")
   * @Assert\NotNull
   * @Assert\GreaterThan(0)
   */
  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false
  })
  amount?: number;

  /**
   * @ORM\Column(name="observation", type="text", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "paymentPlan:read"
   * })
   * @Assert\Type("string")
   */
  @Column({
    name: 'observation',
    type: 'text',
    nullable: true
  })
  observation?: string;

  /**
   * @ORM\OneToMany(targetEntity="PaymentPlanDeadline", mappedBy="paymentPlan")
   * @ORM\OrderBy({"dueDate": "ASC"})
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "paymentPlan:read"
   * })
   */
  // @TODO EntityMissing
  // protected $deadlines;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

//application/Entity/PaymentPlan.php