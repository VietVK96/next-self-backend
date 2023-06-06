import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="App\Repository\ContraindicationRepository")
 * @ORM\Table(
 *  name="T_MEDICAL_LIBRARY_CONTRAINDICATION_MLC",
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="UNIQ_BC7E63D732C8A3DE2664B178", columns={"organization_id", "internal_reference"})
 *  }
 * )
 * @ORM\AssociationOverrides({
 *  @ORM\AssociationOverride(name="organization", inversedBy="contraindications")
 * })
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('T_MEDICAL_LIBRARY_CONTRAINDICATION_MLC')
export class Contraindication {
  // use OrganizationTrait;
  /**
   * @ORM\ManyToOne(targetEntity="Organization")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  // @TODO EntityMissing
  // protected $organization;

  // use TimestampableEntity;
  // use SoftDeleteableEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="MLC_ID", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"contraindication:index", "contraindication:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'MLC_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="MLC_LABEL", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"contraindication:index", "contraindication:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'MLC_LABEL',
    type: 'text',
    nullable: true,
  })
  name?: string;

  /**
   * @ORM\Column(name="position", type="integer", options={"default": 0})
   * @Gedmo\SortablePosition
   * @Serializer\Expose
   * @Serializer\Groups({"contraindication:index", "contraindication:read"})
   * @Serializer\Type("int")
   */
  @Column({
    name: 'position',
    type: 'int',
    width: 11,
    default: 0,
  })
  position?: number;

  /**
   * @ORM\Column(name="MLC_BCB_ID", type="string", length=10, nullable=true)
   * @Assert\Type("string")
   * @Assert\Length(max=10)
   */
  @Column({
    name: 'MLC_BCB_ID',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  bcbdextherId?: string;

  /**
   * @ORM\Column(name="MLC_BCB_TYPE", type="integer")
   * @Assert\Type("int")
   */
  @Column({
    name: 'MLC_BCB_TYPE',
    type: 'int',
    width: 11,
    nullable: true,
  })
  bcbdextherType?: number;

  /**
   * @ORM\Column(name="internal_reference", type="string", length=7, nullable=true, options={"fixed": true})
   */
  @Column({
    name: 'internal_reference',
    type: 'char',
    length: 7,
    nullable: true,
  })
  internalReference?: string;
}

//application\Entity\Contraindication.php
