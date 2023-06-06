import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
  // @TODO EntityMissing
  // protected $user;

  /**
   * @ORM\ManyToOne(targetEntity="AppointmentReminderAddressee")
   * @ORM\JoinColumn(name="RMR_ID", referencedColumnName="RMR_ID")
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "appointmentReminderLibrary:index",
   *  "appointmentReminderLibrary:read"
   * })
   */
  // @TODO EntityMissing
  // protected $addressee;

  /**
   * @ORM\ManyToOne(targetEntity="AppointmentReminderCategory")
   * @ORM\JoinColumn(name="RMT_ID", referencedColumnName="RMT_ID")
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "appointmentReminderLibrary:index",
   *  "appointmentReminderLibrary:read"
   * })
   */
  // @TODO EntityMissing
  // protected $category;

  /**
   * @ORM\ManyToOne(targetEntity="AppointmentReminderUnit")
   * @ORM\JoinColumn(name="RMU_ID", referencedColumnName="RMU_ID")
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "appointmentReminderLibrary:index",
   *  "appointmentReminderLibrary:read"
   * })
   */
  // @TODO EntityMissing
  // protected $timelimitUnit;

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
  timelimit?: number

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
  // @TODO EntityMissing
  // protected $attachments;
}

// application\Entity\AppointmentReminderLibrary.php
