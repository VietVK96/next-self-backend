import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LibraryActEntity } from './library-act.entity';
import { OrganizationEntity } from './organization.entity';

/**
 * @ORM\Entity(repositoryClass="App\Repositories\LibraryActFamilyRepository")
 * @ORM\Table(name="library_act_family", uniqueConstraints={
 *  @ORM\UniqueConstraint(columns={"organization_id", "internal_reference_id"})
 * })
 * @ORM\AssociationOverrides({
 *  @ORM\AssociationOverride(name="organization", inversedBy="libraryActFamilies")
 * })
 * @ORM\HasLifecycleCallbacks
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('library_act_family')
export class LibraryActFamilyEntity {
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
   * @ORM\Column(name="label", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(
   *  max=255
   * )
   */
  @Column({
    name: 'label',
    type: 'varchar',
    length: 255,
  })
  label?: string;

  /**
   * @ORM\Column(name="color", type="json")
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Assert\NotBlank
   * @AcmeAssert\Color
   */
  @Column({
    name: 'color',
    type: 'json',
    nullable: true,
  })
  color?: string;

  /**
   * @ORM\Column(name="position", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'position',
    type: 'int',
    width: 11,
    default: 0,
  })
  position?: number = 0;

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
    default: 1,
  })
  used?: number = 1;

  /**
   * @ORM\Column(name="internal_reference_id", type="integer", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   */
  @Column({
    name: 'internal_reference_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  internalReferenceId?: number;

  /**
   * @ORM\OneToMany(targetEntity="LibraryAct", mappedBy="family", cascade={"persist"}, orphanRemoval=true)
   * @ORM\OrderBy({"position" = "ASC", "id" = "ASC"})
   */
  //   protected $acts;

  @OneToMany(() => LibraryActEntity, (e) => e.family, {
    // createForeignKeyConstraints: false,
    cascade: true,
  })
  acts?: LibraryActEntity[];

  /**
   * @ORM\ManyToOne(targetEntity="Organization")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  // @TODO EntityMissing
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

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
// application/Entities/LibraryActFamily.php
