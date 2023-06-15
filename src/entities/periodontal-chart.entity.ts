import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { ContactEntity } from './contact.entity';

/**
 * @ORM\Entity(repositoryClass="App\Repository\PeriodontalChartRepository")
 * @ORM\Table(name="periodontal_chart")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('periodontal_chart')
export class PeriodontalChartEntity {
  /**
   * @ORM\ManyToOne(targetEntity="Organization")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  // protected $organization;
  @Column({
    name: 'organization_id',
    type: 'int',
    width: 11,
  })
  organizationId?: number;

  @ManyToOne(() => OrganizationEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'organization_id',
  })
  organization?: OrganizationEntity;

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"periodontalChart:index", "periodontalChart:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="User")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   */
  // protected $user;
  @Column({
    name: 'user_id',
    type: 'int',
    width: 11,
  })
  userId?: number;

  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'user_id',
  })
  user?: UserEntity;

  /**
   * @ORM\ManyToOne(targetEntity="Patient", inversedBy="periodontalCharts")
   * @ORM\JoinColumn(name="patient_id", referencedColumnName="CON_ID")
   */
  // protected $patient;
  @Column({
    name: 'patient_id',
    type: 'int',
    width: 11,
  })
  patientId?: number;

  @ManyToOne(() => ContactEntity, (e) => e.periodontalCharts, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'patient_id',
  })
  patient?: ContactEntity;

  /**
   * @ORM\Column(name="creation_date", type="date")
   * @Serializer\Expose
   * @Serializer\Groups({"periodontalChart:index", "periodontalChart:read"})
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   * @Assert\NotNull
   */
  @Column({
    name: 'creation_date',
    type: 'date',
  })
  creationDate?: string;

  /**
   * @ORM\Column(name="status", type="periodontalStatusEnum", options={"default": 1})
   * @Serializer\Expose
   * @Serializer\Groups({"periodontalChart:index", "periodontalChart:read"})
   * @Assert\Choice(callback={"App\Enum\PeriodontalStatusEnum", "getValues"})
   * @Assert\NotNull
   */
  @Column({
    name: 'status',
    type: 'int',
    width: 11,
    default: 1,
  })
  status?: number;

  /**
   * @ORM\Column(name="probing_depth", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"periodontalChart:read"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'probing_depth',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  probingDepth?: number;

  /**
   * @ORM\Column(name="gingival_margin", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"periodontalChart:read"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'gingival_margin',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  gingivalMargin?: number;

  /**
   * @ORM\Column(name="plaque", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"periodontalChart:read"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'plaque',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  plaque?: number;

  /**
   * @ORM\Column(name="bleeding_on_probing", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"periodontalChart:read"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'bleeding_on_probing',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  bleedingOnProbing?: number;

  /**
   * @ORM\Column(name="matrix", type="json")
   * @Serializer\Expose
   * @Serializer\Groups({"periodontalChart:read"})
   * @Assert\Type("array")
   * @Assert\NotBlank
   */
  @Column({
    name: 'matrix',
    type: 'json',
  })
  matrix?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

//application/Entity/PeriodontalChart.php
