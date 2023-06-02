import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_SYNC_WZAGENDA_EVENT_SWE")
 */
@Entity('T_SYNC_WZAGENDA_EVENT_SWE')
export class SyncWzagendaEvent {
  /**
   * @ORM\Column(name="SWE_ID", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @var integer Identifiant de l'enregistrement.
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'SWE_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="SWE_EVENT_ID", type="integer")
   * @var integer Identifiant du rendez-vous WzAgenda.
   */
  @Column({
    name: 'SWE_EVENT_ID',
    type: 'int',
    length: 11,
  })
  eventId?: number;

  /**
   * @ORM\Column(name="SWE_EVENT_UPDATE", type="integer", nullable=true)
   * @var integer Date de dernière modification du rendez-vous WzAgenda.
   */
  @Column({
    name: 'SWE_EVENT_UPDATE',
    type: 'int',
    length: 11,
    nullable: true,
  })
  eventUpdate?: number;

  @Column({
    name: 'event_occurrence_id',
    type: 'int',
    length: 11,
    nullable: true,
  })
  eventoccurrenceid?: number;

  @Column({
    name: 'last_modified',
    type: 'datetime',
    nullable: true,
  })
  lastmodified?: string;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\Event")
   * @ORM\JoinColumn(name="EVT_ID", referencedColumnName="EVT_ID")
   * @var \App\Entities\Event Entité représentant le rendez-vous.
   */
  // @TODO EntityMissing
  //   protected $event;
}
// application/Entities/Sync/WzAgenda/Event.php
