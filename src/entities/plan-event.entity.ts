import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { PlanPlfEntity } from './plan-plf.entity';
import { EventEntity } from './event.entity';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_PLAN_EVENT_PLV")
 */
@Entity('T_PLAN_EVENT_PLV')
export class PlanEventEntity {
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
  // protected $plan;
  @Column({
    name: 'PLF_ID',
    type: 'int',
    width: 11,
  })
  plfId?: number;

  @ManyToOne(() => PlanPlfEntity, (e) => e.events, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'PLF_ID',
  })
  plan?: PlanPlfEntity;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\Event", inversedBy="planEvent")
   * @ORM\JoinColumn(name="EVT_ID", referencedColumnName="EVT_ID")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="NONE")
   */
  // protected $event;
  @Column({
    name: 'EVT_ID',
    type: 'int',
    width: 11,
  })
  evtId?: number;

  @OneToOne(() => EventEntity, (e) => e.planEvent, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'EVT_ID',
  })
  event?: EventEntity;
}

// application/Entities/Plan/Event.php
