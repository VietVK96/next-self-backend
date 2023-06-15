import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { EventEntity } from "./event.entity";
import { ResourceEntity } from "./resource.entity";

/**
 * @ORM\Entity
 * @ORM\Table(name="event_occurrence_evo")
 */
@Entity('event_occurrence_evo')
export class EventOccurrenceEntity {

  /**
   * @ORM\Column(name="evo_id", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @var integer Identifiant de l'enregistrement
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'evo_id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Event")
   * @ORM\JoinColumn(name="evt_id", referencedColumnName="EVT_ID")
   * @var \App\Entities\Event Entité représentant un rendez-vous.
   */
  // protected $event;
  @Column({
    name: 'evt_id',
    type: 'int',
    width: 11,
  })
  evtId?: number;
  @ManyToOne(() => EventEntity, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'evt_id'
  })
  event?: EventEntity;

  /**
   * @ORM\ManyToOne(targetEntity="Resource")
   * @ORM\JoinColumn(name="resource_id", referencedColumnName="id")
   */
  // protected $resource = null;
  @Column({
    name: 'resource_id',
    type: 'int',
    width: 11,
    nullable: true
  })
  resourceId?: number;
  @ManyToOne(() => ResourceEntity, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'resource_id'
  })
  resource?: ResourceEntity;

  /**
   * @ORM\Column(name="evo_date", type="date")
   * @var \DateTime Date de l'occurrence.
   */
  @Column({
    name: 'evo_date',
    type: 'date',
  })
  date?: string;

  /**
   * @ORM\Column(name="evo_exception", type="integer")
   * @var boolean Etat d'exception de l'occurrence.
   */
  @Column({
    name: 'evo_exception',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  exception?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

}

// application/Entities/EventOccurrence.php
// application/Entity/EventOccurrence.php
