import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * @ORM\Entity
 * @ORM\Table(name="traceability")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('traceability')
export class TraceabilityEntity {
  /**
   * @ORM\ManyToOne(targetEntity="Organization")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  // @TODO EntityMissing
  // protected $organization;

  // @check Timestamp
  // use TimestampableEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"traceability:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="LibraryAct", inversedBy="traceabilities")
   * @ORM\JoinColumn(nullable=true)
   */
  // @TODO EntityMissing
  // protected $libraryAct = null;

  /**
   * @ORM\ManyToOne(targetEntity="LibraryActQuantity", inversedBy="traceabilities")
   * @ORM\JoinColumn(nullable=true)
   */
  // @TODO EntityMissing
  // protected $libraryActQuantity = null;

  /**
   * @ORM\ManyToOne(targetEntity="App\Entity\MedicalDevice")
   * @ORM\JoinColumn(nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"traceability:read"})
   */
  // @TODO EntityMissing
  // protected $medicalDevice = null;

  /**
   * @ORM\Column(name="reference", type="string", length=255, nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"traceability:read"})
   * @Assert\Type("string")
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'reference',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  reference?: string;

  /**
   * @ORM\Column(name="observation", type="text", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"traceability:read"})
   * @Assert\Type("string")
   */
  @Column({
    name: 'observation',
    type: 'text',
    nullable: true,
  })
  observation?: string;

  /** File: application\Entity\Traceability.php
   * @ORM\ManyToOne(targetEntity="Act", inversedBy="traceabilities")
   * @ORM\JoinColumn(name="act_id", referencedColumnName="ETK_ID", nullable=true)
   */
  // @TODO EntityMissing
  // protected $act = null;

  /**
   * @ORM\ManyToOne(targetEntity="MedicalDevice", inversedBy="traceabilities")
   * @ORM\JoinColumn(name="medical_device_id", referencedColumnName="id", nullable=true)
   */
  // @TODO EntityMissing
  // protected $medicalDevice = null;
}

// application\Entities\Traceability.php
// application\Entity\Traceability.php
