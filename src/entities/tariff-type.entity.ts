import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';

/**
 * @ORM\Entity(repositoryClass="App\Repository\TariffTypeRepository")
 * @ORM\Table(
 *  name="tariff_type",
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="UNIQ_F18CA59332C8A3DE5E237E06", columns={"organization_id", "name"})
 *  }
 * )
 * @ORM\AssociationOverrides({
 *  @ORM\AssociationOverride(name="organization", inversedBy="tariffTypes")
 * })
 * @UniqueEntity(fields={"name", "organization"}, message="tariffType.validation.unique")
 * @AcmeAssert\MaxEntries(max=TariffType::MAX_ENTRIES, message="tariffType.validation.maxEntries", groups={"tariffType:create"})
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('tariff_type')
export class TariffTypeEntity {
  /**
   * @var int Nombre maximal de types de tarif.
   */
  MAX_ENTRIES = 5;

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"tariffType:index", "tariffType:read", "libraryActQuantity:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="name", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"tariffType:index", "tariffType:read", "libraryActQuantity:read"})
   * @Assert\Type(type="string")
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
   * @ORM\ManyToOne(targetEntity="Organization")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  //protected $organization;
  @Column({ name: 'organization_id', type: 'int', width: 11 })
  organizationId?: number;

  @ManyToOne(() => OrganizationEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'organization_id' })
  organization?: OrganizationEntity;
}

//application/Entity/TariffType.php
