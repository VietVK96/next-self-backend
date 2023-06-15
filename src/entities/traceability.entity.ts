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
import { LibraryActEntity } from './library-act.entity';
import { LibraryActQuantityEntity } from './library-act-quantity.entity';
import { MedicalDeviceEntity } from './medical-device.entity';
import { EventTaskEntity } from './event-task.entity';

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
  // protected $organization;
  @Column({ name: 'organization_id', type: 'int', width: 11 })
  organizationId?: number;

  @ManyToOne(() => OrganizationEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'organization_id' })
  organization?: OrganizationEntity;

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
  // protected $libraryAct = null;
  @Column({ name: 'library_act_id', type: 'int', width: 11, nullable: true })
  libraryActId?: number;

  @ManyToOne(() => LibraryActEntity, e => e.traceabilities, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'library_act_id' })
  libraryAct?: LibraryActEntity;

  /**
   * @ORM\ManyToOne(targetEntity="LibraryActQuantity", inversedBy="traceabilities")
   * @ORM\JoinColumn(nullable=true)
   */
  // protected $libraryActQuantity = null;
  @Column({ name: 'library_act_quantity_id', type: 'int', width: 11, nullable: true })
  libraryActQuantityId?: number;

  @ManyToOne(() => LibraryActQuantityEntity, e => e.traceabilities, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'library_act_quantity_id' })
  libraryActQuantity?: LibraryActQuantityEntity;

  /**
  * @ORM\ManyToOne(targetEntity="MedicalDevice", inversedBy="traceabilities")
  * @ORM\JoinColumn(name="medical_device_id", referencedColumnName="id", nullable=true)
  */
  // protected $medicalDevice = null;

  /**
   * @ORM\ManyToOne(targetEntity="App\Entity\MedicalDevice")
   * @ORM\JoinColumn(nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"traceability:read"})
   */
  // protected $medicalDevice = null;
  @Column({ name: 'medical_device_id', type: 'int', width: 11, nullable: true })
  medicalDeviceId?: number;

  @ManyToOne(() => MedicalDeviceEntity, e => e.traceabilities, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'medical_device_id' })
  medicalDevice?: MedicalDeviceEntity;

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
  // protected $act = null;
  @Column({ name: 'act_id', nullable: true, type: 'int', width: 11 })
  actId?: number;

  @ManyToOne(() => EventTaskEntity, e => e.traceabilities, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'act_id' })
  act?: EventTaskEntity;
}

// application\Entities\Traceability.php
// application\Entity\Traceability.php
