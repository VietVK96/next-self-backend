import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="App\Repository\PatientAmcRepository")
 * @ORM\Table(name="patient_amc", uniqueConstraints={
 *  @ORM\UniqueConstraint(name="UNIQ_F0DA75946B89927995275AB88", columns={"patient_id", "start_date", "end_date"})
 * })
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('patient_amc')
export class PatientAmc {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="Patient", inversedBy="amcs")
   * @ORM\JoinColumn(name="patient_id", referencedColumnName="CON_ID")
   */
  // @TODO EntityMissing
  // protected $patient;

  /**
   * @ORM\ManyToOne(targetEntity="Amc", cascade={"persist"})
   * @ORM\JoinColumn(name="amc_id", referencedColumnName="id", nullable=true)
   * @Serializer\Expose
   */
  // @TODO EntityMissing
  // protected $amc = null;

  /**
   * @ORM\Column(name="start_date", type="date", nullable=true)
   * @Serializer\Expose
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   */
  @Column({
    name: 'start_date',
    type: 'date',
    nullable: true,
  })
  startDate?: string;

  /**
   * @ORM\Column(name="end_date", type="date", nullable=true)
   * @Serializer\Expose
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   * @Assert\GreaterThan(propertyPath="startDate")
   */
  @Column({
    name: 'end_date',
    type: 'date',
    nullable: true,
  })
  endDate?: string;

  /**
   * @ORM\Column(name="is_tp", type="boolean", options={"default": false})
   * @Serializer\Expose
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'is_tp',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0,
  })
  isTp?: number;

  /**
   * @ORM\Column(name="is_cmu", type="boolean", options={"default": false})
   * @Serializer\Expose
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'is_cmu',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0,
  })
  isCmu?: number;

  /**
   * @ORM\Column(name="is_dre_possible", type="boolean", options={"default": false})
   * @Serializer\Expose
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'is_dre_possible',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0,
  })
  isDrePossible?: number;

  /**
   * @ORM\Column(name="type_ame", type="string", length=1, options={"fixed": true})
   * @Serializer\Expose
   * @Assert\Type("string")
   * @Assert\Length(min=1, max=1)
   */
  @Column({
    name: 'type_ame',
    type: 'char',
    length: 1,
    nullable: true,
  })
  typeAme?: string;

  /**
   * @ORM\Column(name="lecture_adr", type="date", nullable=true)
   * @Serializer\Expose
   * @Serializer\Type("DateTime<'Y-m-d'>")
   */
  @Column({
    name: 'lecture_adr',
    type: 'date',
    nullable: true,
  })
  lectureAdr?: string;
}

//application/Entity/PatientAmc.php
