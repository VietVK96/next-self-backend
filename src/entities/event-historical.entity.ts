import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_EVENT_HISTORY_EHT")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_EVENT_HISTORY_EHT')
export class EventHistoricalEntity {
  // use TimestampableTrait;
  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  /**
   * @ORM\Column(name="EHT_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'EHT_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="EHT_MSG", type="text", nullable=true)
   */
  @Column({
    name: 'EHT_MSG',
    type: 'text',
    nullable: true,
  })
  msg?: string;

  /**
   * @ORM\Column(name="EHT_PREVIOUS", type="text", nullable=true)
   */
  @Column({
    name: 'EHT_PREVIOUS',
    type: 'text',
    nullable: true,
  })
  previous?: string;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Event", inversedBy="historical")
   * @ORM\JoinColumn(name="EVT_ID", referencedColumnName="EVT_ID")
   */
  // @TODO EntityMissing
  //protected $event;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   */
  // @TODO EntityMissing
  //protected $user;

  /**
   *
   */
}
