import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { EventEntity } from './event.entity';
import { ReminderTypeEntity } from './reminder-type.entity';
import { ReminderReceiverEntity } from './reminder-receiver.entity';
import { ReminderUnitEntity } from './reminder-unit.entity';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_REMINDER_RMD")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_REMINDER_RMD')
export class ReminderEntity {
  /**
   * @ORM\Column(name="RMD_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'RMD_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="RMD_MSG", type="text", nullable=true)
   */
  @Column({
    name: 'appointment_reminder_library_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  appointmentReminderLibraryId?: number;

  /**
   * @ORM\Column(name="RMD_MSG", type="text", nullable=true)
   */
  @Column({
    name: 'RMD_MSG',
    type: 'text',
    nullable: true,
  })
  msg?: string;

  /**
   * @ORM\Column(name="RMD_NBR", type="integer", nullable=false)
   */
  @Column({
    name: 'RMD_NBR',
    type: 'int',
    width: 11,
    nullable: false,
    default: 1,
  })
  nbr?: number;

  @Column({
    name: 'sending_date_utc',
    type: 'datetime',
    nullable: true,
  })
  sendingDateUTC?: string;

  /**
   * @ORM\Column(name="RMD_FLAG", type="integer", nullable=false)
   */
  @Column({
    name: 'RMD_FLAG',
    type: 'tinyint',
    width: 4,
    nullable: false,
    default: 0,
  })
  flag?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   */
  // protected $user;

  @Column({
    name: 'USR_ID',
    type: 'int',
    width: 11,
  })
  usrId?: number;

  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'USR_ID',
  })
  user?: UserEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Event", inversedBy="reminders")
   * @ORM\JoinColumn(name="EVT_ID", referencedColumnName="EVT_ID")
   */
  // protected $event;

  @Column({
    name: 'EVT_ID',
    type: 'int',
    width: 11,
  })
  eventId?: number;

  @ManyToOne(() => EventEntity,(e)=>e.reminders, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'EVT_ID',
  })
  event?: EventEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Reminder\Type")
   * @ORM\JoinColumn(name="RMT_ID", referencedColumnName="RMT_ID")
   */
  // protected $type;
  @Column({
    name: 'RMT_ID',
    type: 'int',
    width: 11,
  })
  rmtId?: number;

  @ManyToOne(() => ReminderTypeEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'RMT_ID',
  })
  type?: ReminderTypeEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Reminder\Receiver")
   * @ORM\JoinColumn(name="RMR_ID", referencedColumnName="RMR_ID")
   */
  // protected $receiver;

  @Column({
    name: 'RMR_ID',
    type: 'int',
    width: 11,
  })
  rmrId?: number;

  @ManyToOne(() => ReminderReceiverEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'RMR_ID',
  })
  receiver?: ReminderReceiverEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Reminder\Unit")
   * @ORM\JoinColumn(name="RMU_ID", referencedColumnName="RMU_ID")
   */
  // protected $unit;

  @Column({
    name: 'RMU_ID',
    type: 'int',
    width: 11,
  })
  rmuId?: number;

  @ManyToOne(() => ReminderUnitEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'RMU_ID',
  })
  unit?: ReminderUnitEntity;
  
  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

//application/Entities/Reminder.php
