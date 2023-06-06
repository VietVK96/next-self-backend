import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="App\Repository\RecurringPatternRepository")
 * @ORM\Table(name="recurring_pattern")
 */
@Entity('recurring_pattern')
export class RecurringPatternEntity {

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Groups({"details"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn({
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="week_frequency", type="integer", options={"default": 1})
   * @Serializer\Groups({"details"})
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThan(0)
   */
  @Column({
    name: 'week_frequency',
    type: 'tinyint',
    nullable: false,
    default: 1
  })
  weekFrequency?: number;

  /**
   * @ORM\Column(name="week_days", type="simple_array", nullable=true)
   * @Serializer\Groups({"details"})
   * @Serializer\Type("array")
   * @Assert\Choice(choices=RecurringPattern::WEEK_DAYS)
   */
  @Column({
    name: 'week_days',
    type: 'varchar',
    nullable: true,
  })
  weekDays?: string;

  /**
   * @ORM\Column(name="until", type="date", nullable=true)
   * @Serializer\Groups({"details"})
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   */
  @Column({
    name: 'until',
    type: 'date',
    nullable: true
  })
  until?: string;
}

//application/Entity/RecurringPattern.php