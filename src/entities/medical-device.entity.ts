import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TraceabilityEntity } from './traceability.entity';
import { OrganizationEntity } from './organization.entity';

/**
 * @ORM\Entity(repositoryClass="App\Repository\MedicalDeviceRepository")
 * @ORM\Table(
 *  name="medical_device",
 *  indexes={
 *      @ORM\Index(name="INDEX_6271012132C8A3DE5E237E06", columns={"organization_id", "name"})
 *  }
 * )
 * @ORM\AssociationOverrides({
 *  @ORM\AssociationOverride(name="organization", inversedBy="medicalDevices")
 * })
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('medical_device')
export class MedicalDeviceEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"medicalDevice:index", "medicalDevice:read", "traceability:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="name", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"medicalDevice:index", "medicalDevice:read", "traceability:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'name',
    type: 'varchar',
    length: 255,
  })
  name?: string;

  /**
   * @ORM\OneToMany(targetEntity="Traceability", mappedBy="medicalDevice")
   */
  //   protected $traceabilities;
  @OneToMany(() => TraceabilityEntity, (e) => e.medicalDevice, {
    createForeignKeyConstraints: false
  })
  traceabilities?: TraceabilityEntity[];

  // from file extends
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
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'organization_id'
  })
  organization?: OrganizationEntity;

  // @Check TimeStamp
  //use TimestampableEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}
// application/Entity/MedicalDevice.php
