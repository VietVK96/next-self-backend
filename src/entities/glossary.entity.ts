/**
 * @ORM\Entity(repositoryClass="App\Repository\GlossaryRepository")
 * @ORM\Table(
 *  name="glossary",
 *  indexes={
 *      @ORM\Index(name="INDEX_B0850B4332C8A3DE462CE4F5", columns={"organization_id", "position"})
 *  }
 * )
 * @ORM\AssociationOverrides({
 *  @ORM\AssociationOverride(name="organization", inversedBy="glossaries")
 * })
 * @Serializer\ExclusionPolicy("all")
 * @AcmeAssert\MaxEntries(max=Glossary::MAX_ENTRIES, message="glossary.validation.maxEntries", groups={"glossary:create"})
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// File: application\Entity\EventType.php: class GlossaryEntity extends AbstractEntity implements OrganizationInterface, ProtectedInterface
@Entity('glossary')
export class GlossaryEntity {
  // use OrganizationTrait;
  /**
   * @ORM\ManyToOne(targetEntity="Organization")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  // @TODO EntityMissing
  // protected $organization;

  // @Check TimeStamp
  // use TimestampableEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  /**
   * @var int Nombre maximal de glossaire
   */
  MAX_ENTRIES?: number = 10;

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"glossary:index", "glossary:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="name", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"glossary:index", "glossary:read"})
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
   * @ORM\Column(name="position", type="integer", options={"default": 0})
   * @Gedmo\SortablePosition
   * @Serializer\Expose
   * @Serializer\Groups({"glossary:index", "glossary:read"})
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
  position?: number;

  /**
   * @ORM\Column(name="entry_count", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"glossary:index", "glossary:read"})
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'entry_count',
    type: 'int',
    width: 11,
    default: 0,
  })
  entryCount?: number;

  /**
   * @ORM\OneToMany(targetEntity="GlossaryEntry", mappedBy="glossary")
   * @ORM\OrderBy({"position": "ASC"})
   */
  // @TODO EntityMissing
  // protected $entries;
}
// application\Entity\Glossary.php
