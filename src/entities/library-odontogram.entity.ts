import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { LibraryActEntity } from './library-act.entity';
import { LibraryActQuantityEntity } from './library-act-quantity.entity';

/**
 * @ORM\Entity(repositoryClass="App\Repositories\LibraryOdontogramRepository")
 * @ORM\Table(name="library_odontogram", uniqueConstraints={
 *  @ORM\UniqueConstraint(columns={"organization_id", "internal_reference_id"})
 * })
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('library_odontogram')
export class LibraryOdontogramEntity {
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
   * @Serializer\Groups({"detail"})
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="color", type="json")
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
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
   * @ORM\Column(name="visible_crown", type="boolean", options={"default": true})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'visible_crown',
    type: 'tinyint',
    width: 1,
    default: 1,
  })
  visibleCrown?: number;

  /**
   * @ORM\Column(name="visible_root", type="boolean", options={"default": true})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'visible_root',
    type: 'tinyint',
    width: 1,
    default: 1,
  })
  visibleRoot?: number;

  /**
   * @ORM\Column(name="visible_implant", type="boolean", options={"default": false})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'visible_implant',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  visibleImplant?: number;

  /**
   * @ORM\Column(name="visible_areas", type="simple_array", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("array")
   */
  @Column({
    name: 'visible_areas',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  visibleAreas?: string;

  /**
   * @ORM\Column(name="invisible_areas", type="simple_array", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("array")
   */
  @Column({
    name: 'invisible_areas',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  invisibleAreas?: string;

  /**
   * @ORM\Column(name="rank_of_tooth", type="integer", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("int")
   */
  @Column({
    name: 'rank_of_tooth',
    type: 'int',
    width: 11,
    nullable: true,
  })
  rankOfTooth?: number;

  /**
   * @ORM\Column(name="internal_reference_id", type="integer", nullable=true)
   */
  @Column({
    name: 'internal_reference_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  internalReferenceId?: number;

  /**
   * @ORM\ManyToMany(targetEntity="LibraryAct", mappedBy="odontograms")
   */
  //   protected $libraryActs;
  @ManyToMany(() => LibraryActEntity, (e) => e.odontograms, {
    createForeignKeyConstraints: false,
  })
  @JoinTable({
    name: 'library_act_odontogram',
    joinColumn: {
      name: 'library_odontogram_id',
    },
    inverseJoinColumn: {
      name: 'library_act_id',
    },
  })
  libraryActs?: LibraryActEntity[];

  /**
   * @ORM\ManyToMany(targetEntity="LibraryActQuantity", mappedBy="odontograms")
   */
  //   protected $libraryActQuantities;
  @ManyToMany(() => LibraryActQuantityEntity)
  @JoinTable({
    name: 'library_act_quantity_odontogram',
    joinColumn: {
      name: 'library_odontogram_id',
    },
    inverseJoinColumn: {
      name: 'library_act_quantity_id',
    },
  })
  libraryActQuantities?: LibraryActQuantityEntity[];
}

// application\Entities\LibraryOdontogram.php
