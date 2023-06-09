import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="App\Repository\MedicamentFamilyRepository")
 * @ORM\Table(
 *  name="T_MEDICAL_PRESCRIPTION_TYPE_MDT",
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="UNIQ_D0275BDF32C8A3DE2664B178", columns={"organization_id", "internal_reference"})
 *  }
 * )
 * @ORM\AssociationOverrides({
 *  @ORM\AssociationOverride(name="organization", inversedBy="medicamentFamilies")
 * })
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('T_MEDICAL_PRESCRIPTION_TYPE_MDT')
export class MedicamentFamilyEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="MDT_ID", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"medicamentFamily:index", "medicamentFamily:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'MDT_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="MDT_NAME", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"medicamentFamily:index", "medicamentFamily:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'MDT_NAME',
    type: 'text',
    nullable: true,
  })
  name?: string;

  /**
   * @ORM\Column(name="position", type="integer", options={"default": 0})
   * @Gedmo\SortablePosition
   * @Serializer\Expose
   * @Serializer\Groups({"medicamentFamily:index", "medicamentFamily:read"})
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   */
  @Column({
    name: 'position',
    type: 'int',
    width: 11,
    default: 0,
  })
  position?: number = 0;

  /**
   * @ORM\Column(name="internal_reference", type="string", length=7, nullable=true, options={"fixed": true})
   * @Assert\Type("string")
   * @Assert\Length(max=7)
   */
  @Column({
    name: 'internal_reference',
    type: 'char',
    length: 7,
    nullable: true,
  })
  internalReference?: string;

  /**
   * @ORM\OneToMany(targetEntity="Medicament", mappedBy="family", cascade={"persist"})
   * @ORM\OrderBy({"position": "ASC", "name": "ASC"})
   * @Serializer\Expose
   * @Serializer\Groups({"medicament:index", "medicament:read"})
   */
  // @TODO EntityMissing
  //   protected $medicaments;

  // from file extends
  /**
   * @ORM\ManyToOne(targetEntity="Organization")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  // @TODO EntityMissing
  // protected $organization;

  // @Check TimeStamp
  //use TimestampableEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
// application/Entity/MedicamentFamily.php
