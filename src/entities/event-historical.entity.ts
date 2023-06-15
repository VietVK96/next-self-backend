import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EventEntity } from './event.entity';
import { UserEntity } from './user.entity';

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
  //protected $event;
  @Column({
    name: 'EVT_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  evtId?: number;
  @ManyToOne(() => EventEntity, (e) => e.historical, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'EVT_ID',
  })
  event?: EventEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   */
  //protected $user;
  @Column({
    name: 'USR_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  usrId?: number;
  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'USR_ID',
  })
  user?: UserEntity;
}

// application/Entities/Event/Historical.php
