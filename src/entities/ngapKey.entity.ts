import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';

/**
 * @ORM\Entity(repositoryClass="App\Repositories\NgapKeyRepository")
 * @ORM\Table(name="ngap_key", uniqueConstraints={
 *  @ORM\UniqueConstraint(columns={"organization_id", "internal_reference_id"})
 * })
 * @ORM\AssociationOverrides({
 *  @ORM\AssociationOverride(name="organization", inversedBy="ngapKeys")
 * })
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('ngap_key')
export class NgapKeyEntity {
  /**
   * @ORM\ManyToOne(targetEntity="Organization")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  // organization;

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
   * @Serializer\Groups({"list", "detail"})
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="name", type="string", length=10)
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(
   *  max=10
   * )
   */
  @Column({
    name: 'name',
    type: 'varchar',
    length: 10,
    nullable: false,
  })
  name?: string;

  /**
   * @ORM\Column(name="unit_price", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Serializer\Type("float")
   * @Assert\Type("numeric")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.0,
  })
  unitPrice?: number;

  /**
   * @ORM\Column(name="complement_night", type="decimal", precision=10, scale=2, options={"default": 25.15})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("float")
   * @Assert\Type("numeric")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'complement_night',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 25.15,
  })
  complementNight?: number;

  /**
   * @ORM\Column(name="complement_holiday", type="decimal", precision=10, scale=2, options={"default": 19.06})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("float")
   * @Assert\Type("numeric")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'complement_holiday',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 19.06,
  })
  complementHoliday?: number;

  /**
   * @ORM\Column(name="used", type="boolean", options={"default": true})
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'used',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 1,
  })
  used?: number;

  /**
   * @ORM\Column(name="internal_reference_id", type="integer", nullable=true)
   */
  @Column({
    name: 'internal_reference_id',
    type: 'int',
    nullable: true,
  })
  internalReferenceId?: number;
}

//application/Entities/NgapKey.php
