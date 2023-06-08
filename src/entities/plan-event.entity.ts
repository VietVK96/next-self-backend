import { Column, Entity } from 'typeorm';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_PLAN_EVENT_PLV")
 */
@Entity('T_PLAN_EVENT_PLV')
export class PlanEventEnity {
  /**
   * @ORM\Column(name="PLV_POS", type="integer", nullable=false)
   */
  @Column({
    name: 'PLV_POS',
    type: 'integer',
    nullable: false,
    default: 1,
  })
  pos?: number;

  /**
   * @ORM\Column(name="PLV_DELAY", type="integer", nullable=false)
   */
  @Column({
    name: 'PLV_DELAY',
    type: 'integer',
    nullable: false,
    default: 7,
  })
  delay?: number;

  /**
   * Durée de la séance.
   *
   * @ORM\Column(name="duration", type="time", nullable=true)
   * @var \DateTime|null
   */
  @Column({
    name: 'duration',
    type: 'time',
    nullable: true,
  })
  duration?: string;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Plan", inversedBy="events")
   * @ORM\JoinColumn(name="PLF_ID", referencedColumnName="PLF_ID")
   */
  // @TODO EntityMissing
  // protected $plan;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\Event", inversedBy="planEvent")
   * @ORM\JoinColumn(name="EVT_ID", referencedColumnName="EVT_ID")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="NONE")
   */
  // @TODO EntityMissing
  // protected $event;
}

// application/Entities/Plan/Event.php
