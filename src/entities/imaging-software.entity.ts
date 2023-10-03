/**
 * @ORM\Entity(repositoryClass="App\Repository\ImagingSoftwareRepository")
 * @ORM\Table(name="imaging_software")
 * @Serializer\ExclusionPolicy("all")
 */

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { WorkstationEntity } from './workstation.entity';

// File: application\Entity\ImagingSoftware.php: class ImagingSoftware extends AbstractEntity implements OrganizationInterface
@Entity('imaging_software')
export class ImagingSoftwareEntity {
  // use OrganizationTrait;
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
   * @Serializer\Groups({"imagingSoftware:index", "imagingSoftware:read"})
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="Workstation", inversedBy="imagingSoftwares")
   */
  // @TODO EntityMissing
  // protected $workstation;
  @Column({
    name: 'workstation_id',
    type: 'int',
    width: 11,
  })
  workstationId?: number;
  @ManyToOne(() => WorkstationEntity, (e) => e.imagingSoftwares, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'workstation_id',
  })
  workstation?: WorkstationEntity;

  /**
   * @ORM\Column(name="original_name", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"imagingSoftware:index", "imagingSoftware:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'original_name',
    type: 'varchar',
    length: 255,
  })
  originalName?: string;

  /**
   * @ORM\Column(name="name", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"imagingSoftware:index", "imagingSoftware:read"})
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
   * @ORM\Column(name="executable_path", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"imagingSoftware:index", "imagingSoftware:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'executable_path',
    type: 'varchar',
    length: 255,
  })
  executablePath?: string;

  /**
   * @ORM\Column(name="configuration_file_path", type="string", length=255, nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"imagingSoftware:read"})
   * @Assert\Type("string")
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'configuration_file_path',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  configurationFilePath?: string;

  /**
   * @ORM\Column(name="image_dirname", type="string", length=255, nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"imagingSoftware:read"})
   * @Assert\Type("string")
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'image_dirname',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  imageDirname?: string;

  /**
   * @ORM\Column(name="image_basename_prefix", type="string", length=1, nullable=true, options={"fixed": true})
   * @Serializer\Expose
   * @Serializer\Groups({"imagingSoftware:read"})
   * @Assert\Type("string")
   * @Assert\Length(min=1, max=1)
   */
  @Column({
    name: 'image_basename_prefix',
    type: 'char',
    width: 1,
    nullable: true,
  })
  imageBasenamePrefix?: string;

  /**
   * @ORM\Column(name="image_basename_length", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"imagingSoftware:read"})
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'image_basename_length',
    type: 'int',
    width: 11,
    default: 0,
  })
  imageBasenameLength?: number;

  /**
   * @ORM\Column(name="computer_name", type="string", length=255, nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"imagingSoftware:read"})
   * @Assert\Type("string")
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'computer_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  computerName?: string;

  getImageBasename?() {
    return `${this.imageBasenamePrefix}%0${this.imageBasenameLength}`;
  }
}
// application\Entity\ImagingSoftware.php
