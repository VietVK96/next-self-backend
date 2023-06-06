import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="App\Repository\PatientAmoRepository")
 * @ORM\Table(name="patient_amo", uniqueConstraints={
 *  @ORM\UniqueConstraint(name="UNIQ_F96C39BF6B89927995275AB88", columns={"patient_id", "start_date", "end_date"})
 * })
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('patient_amo')
export class PatientAmo {

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
   * @ORM\ManyToOne(targetEntity="Patient", inversedBy="amos")
   * @ORM\JoinColumn(name="patient_id", referencedColumnName="CON_ID")
   */
  // @TODO EntityMissing
  // protected $patient;

  /**
   * @ORM\ManyToOne(targetEntity="Amo", cascade={"persist"})
   * @ORM\JoinColumn(name="amo_id", referencedColumnName="id", nullable=true)
   * @Serializer\Expose
   */
  // @TODO EntityMissing
  // protected $amo = null;

  /**
   * @ORM\Column(name="start_date", type="date", nullable=true)
   * @Serializer\Expose
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   */
  @Column({
    name: 'start_date',
    type: 'date',
    nullable: true
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
    nullable: true
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
    default: 0
  })
  isTp?: number;

  /**
   * @ORM\Column(name="is_ald", type="boolean", options={"default": false})
   * @Serializer\Expose
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'is_ald',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0
  })
  isAld?: number;

  /**
   * @ORM\Column(name="maternity_date", type="date", nullable=true)
   * @Serializer\Expose
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   */
  @Column({
    name: 'maternity_date',
    type: 'date',
    nullable: true
  })
  maternityDate?: string;

  /**
   * @ORM\Column(name="childbirth_date", type="date", nullable=true)
   * @Serializer\Expose
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   * @Assert\GreaterThan(propertyPath="maternityDate")
   */
  @Column({
    name: 'childbirth_date',
    type: 'date',
    nullable: true
  })
  childbirthDate?: string;

  /**
   * @ORM\Column(name="code_nature_assurance", type="string", length=2, options={"fixed": true, "default": "10"})
   * @Assert\Choice(callback={"App\Enum\CodeNatureAssuranceEnum", "getValues"})
   * @Assert\NotNull
   */
  @Column({
    name: 'code_nature_assurance',
    type: 'char',
    length: 2,
    nullable: false,
    default: 10
  })
  codeNatureAssurance?: string;

  /**
   * @ORM\Column(name="code_exoneration", type="string", length=1, options={"fixed": true, "default": "0"})
   * @Assert\Choice(callback={"App\Enum\ExemptionCodeEnum", "getValues"})
   * @Assert\NotNull
   */
  @Column({
    name: 'code_exoneration',
    type: 'char',
    length: 1,
    nullable: false,
    default: 0
  })
  codeExoneration?: string;

  /**
   * @ORM\Column(name="lecture_adr", type="date", nullable=true)
   * @Serializer\Expose
   * @Serializer\Type("DateTime<'Y-m-d'>")
   */
  @Column({
    name: 'lecture_adr',
    type: 'date',
    nullable: true
  })
  lectureAdr?: string;

}

//application/Entity/PatientAmo.php