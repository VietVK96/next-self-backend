import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { ReminderReceiverEntity } from './reminder-receiver.entity';
import { ReminderTypeEntity } from './reminder-type.entity';
import { ReminderUnitEntity } from './reminder-unit.entity';
import { UploadEntity } from './upload.entity';

/**
 * @ORM\Entity(repositoryClass="App\Repository\AppointmentReminderLibraryRepository")
 * @ORM\Table(name="T_REMINDER_LIBRARY_RML")
 * @Serializer\ExclusionPolicy("all")
 * @UniqueEntity(fields={"user", "addressee", "category", "timelimitUnit", "timelimit"}, errorPath="addressee", message="appointmentReminderLibrary.validation.unique")
 * @AcmeAssert\MaxEntries(max=4, repositoryMethod="getCountByUser", message="appointmentReminderLibrary.validation.maxEntries")
 */
@Entity('T_REMINDER_LIBRARY_RML')
export class AppointmentReminderLibraryEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="RML_ID", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "appointmentReminderLibrary:index",
   *  "appointmentReminderLibrary:read"
   * })
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'RML_ID',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="User", inversedBy="appointmentReminderLibraries")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   */
  // protected $user;
  @Column({
    name: 'USR_ID',
    type: 'int',
    width: 11,
  })
  usrId?: number;

  @ManyToOne(() => UserEntity, (e) => e.appointmentReminderLibraries, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'USR_ID',
  })
  user?: UserEntity;

  /**
   * @ORM\ManyToOne(targetEntity="AppointmentReminderAddressee")
   * @ORM\JoinColumn(name="RMR_ID", referencedColumnName="RMR_ID")
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "appointmentReminderLibrary:index",
   *  "appointmentReminderLibrary:read"
   * })
   */
  // protected $addressee;
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
  addressee?: ReminderReceiverEntity;

  /**
   * @ORM\ManyToOne(targetEntity="AppointmentReminderCategory")
   * @ORM\JoinColumn(name="RMT_ID", referencedColumnName="RMT_ID")
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "appointmentReminderLibrary:index",
   *  "appointmentReminderLibrary:read"
   * })
   */
  // protected $category;
  @Column({
    name: 'RMT_ID',
    type: 'int',
    width: 11,
  })
  RMTID?: number;

  @ManyToOne(() => ReminderTypeEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'RMT_ID',
  })
  category?: ReminderTypeEntity;

  /**
   * @ORM\ManyToOne(targetEntity="AppointmentReminderUnit")
   * @ORM\JoinColumn(name="RMU_ID", referencedColumnName="RMU_ID")
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "appointmentReminderLibrary:index",
   *  "appointmentReminderLibrary:read"
   * })
   */
  // protected $timelimitUnit;
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
  timelimitUnit?: ReminderUnitEntity;

  /**
   * @ORM\Column(name="RML_NBR", type="integer", options={"default": 1440})
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "appointmentReminderLibrary:index",
   *  "appointmentReminderLibrary:read"
   * })
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'RML_NBR',
    type: 'int',
    width: 11,
    default: 1440,
  })
  timelimit?: number;

  /**
   * @ORM\Column(name="attachment_count", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "appointmentReminderLibrary:index",
   *  "appointmentReminderLibrary:read"
   * })
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'attachment_count',
    type: 'int',
    width: 11,
    default: 0,
  })
  attachmentCount?: number;

  /**
   * @var bool
   */
  // protected $updateAllFutureAppointments = true;

  /**
   * @ORM\ManyToMany(targetEntity="File", cascade={"persist", "remove"}, orphanRemoval=true)
   * @ORM\JoinTable(
   *  name="appointment_reminder_library_attachment",
   *  joinColumns={
   *      @ORM\JoinColumn(name="appointment_reminder_library_id", referencedColumnName="RML_ID")
   *  },
   *  inverseJoinColumns={
   *      @ORM\JoinColumn(name="file_id", referencedColumnName="UPL_ID")
   *  }
   * )
   */
  // protected $attachments;
  @ManyToMany(() => UploadEntity)
  @JoinTable({
    name: 'appointment_reminder_library_attachment',
    joinColumn: {
      name: 'appointment_reminder_library_id',
    },
    inverseJoinColumn: {
      name: 'file_id',
    },
  })
  attachments?: UploadEntity[];
}

// application\Entity\AppointmentReminderLibrary.php
