import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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
    nullable: true
  })
  appointmentReminderLibraryId?: number;

  /**
   * @ORM\Column(name="RMD_MSG", type="text", nullable=true)
   */
  @Column({
    name: 'RMD_MSG',
    type: 'text',
    nullable: true
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
    default: 1
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
    default: 0
  })
  flag?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   */
  // @TODO EntityMissing
  // protected $user;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Event", inversedBy="reminders")
   * @ORM\JoinColumn(name="EVT_ID", referencedColumnName="EVT_ID")
   */
  // @TODO EntityMissing
  // protected $event;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Reminder\Type")
   * @ORM\JoinColumn(name="RMT_ID", referencedColumnName="RMT_ID")
   */
  // @TODO EntityMissing
  // protected $type;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Reminder\Receiver")
   * @ORM\JoinColumn(name="RMR_ID", referencedColumnName="RMR_ID")
   */
  // @TODO EntityMissing
  // protected $receiver;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Reminder\Unit")
   * @ORM\JoinColumn(name="RMU_ID", referencedColumnName="RMU_ID")
   */
  // @TODO EntityMissing
  // protected $unit;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

//application/Entities/Reminder.php