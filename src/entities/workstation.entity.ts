import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ImagingSoftwareEntity } from './imaging-software.entity';
import { OrganizationEntity } from './organization.entity';

/**
 * @ORM\Entity(repositoryClass="App\Repository\WorkstationRepository")
 * @ORM\Table(
 *  name="workstation",
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="UNIQ_CDF3D91032C8A3DE5E237E06", columns={"organization_id", "name"})
 *  }
 * )
 * @ORM\AssociationOverrides({
 *  @ORM\AssociationOverride(name="organization", inversedBy="workstations")
 * })
 * @Serializer\ExclusionPolicy("all")
 * @UniqueEntity(fields={"organization", "name"}, errorPath="name")
 */
@Entity('workstation')
export class WorkstationEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"workstation:index", "workstation:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="name", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"workstation:index", "workstation:read"})
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
   * @ORM\Column(name="platform", type="platformEnum", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"workstation:index", "workstation:read"})
   * @Serializer\Type("int")
   * @Assert\Choice(callback={"App\Enum\PlatformEnum", "getValues"})
   * @Assert\NotNull
   */
  @Column({
    name: 'platform',
    type: 'tinyint',
    width: 4,
    default: 0,
  })
  platform?: number;

  /**
   * @ORM\OneToMany(targetEntity="ImagingSoftware", mappedBy="workstation", cascade={"persist"})
   * @Serializer\Expose
   */
  //   protected $imagingSoftwares;

  @OneToMany(() => ImagingSoftwareEntity, (e) => e.workstation, {
    createForeignKeyConstraints: false,
  })
  imagingSoftwares?: ImagingSoftwareEntity[];

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
}
// application/Entity/Workstation.php
