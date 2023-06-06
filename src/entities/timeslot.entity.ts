import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="App\Repository\TimeslotRepository")
 * @ORM\Table(name="timeslot", indexes={
 *  @ORM\Index(name="INDEX_3BE452F789329D258CD980F8", columns={"resource_id", "start_date"})
 * })
 */
@Entity('timeslot')
export class TimeslotEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Groups({"list", "details"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="Resource", fetch="EAGER")
   * @ORM\JoinColumn(name="resource_id", referencedColumnName="id")
   * @Serializer\Groups({"list", "details"})
   * @Serializer\MaxDepth(1)
   */
  // @TODO EntityMissing
  // protected $resource;

  /**
   * @ORM\ManyToOne(targetEntity="RecurringPattern", inversedBy="timeslots", fetch="EAGER", cascade={"persist"})
   * @ORM\JoinColumn(name="recurring_pattern_id", referencedColumnName="id")
   * @Serializer\Groups({"details"})
   * @Serializer\MaxDepth(1)
   */
  // @TODO EntityMissing
  // protected $recurringPattern = null;

  /**
   * @ORM\Column(name="start_date", type="datetime")
   * @Serializer\Groups({"list", "details"})
   * @Serializer\Type("DateTime<'Y-m-d H:i:s'>")
   * @Assert\Type("DateTimeInterface")
   * @Assert\NotNull
   */
  @Column({
    name: 'start_date',
    type: 'datetime'
  })
  startDate?: string;

  /**
   * @ORM\Column(name="end_date", type="datetime")
   * @Serializer\Groups({"list", "details"})
   * @Serializer\Type("DateTime<'Y-m-d H:i:s'>")
   * @Assert\Type("DateTimeInterface")
   * @Assert\NotNull
   * @Assert\GreaterThan(propertyPath="startDate")
   */
  @Column({
    name: 'end_date',
    type: 'datetime'
  })
  endDate?: string;

  /**
   * @ORM\Column(name="color", type="json")
   * @Serializer\Groups({"list", "details"})
   * @Assert\NotBlank
   * @AcmeAssert\Color
   */
  @Column({
    name: 'color',
    type: 'json',
  })
  color?: string;

  /**
   * @ORM\Column(name="title", type="text", nullable=true)
   * @Serializer\Groups({"list", "details"})
   * @Assert\Type("string")
   */
  @Column({
    name: 'title',
    type: 'text',
    nullable: true,
    default: null,
  })
  title?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

//application/Entity/Timeslot.php
