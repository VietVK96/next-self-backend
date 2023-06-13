/**
 * @ORM\Entity(repositoryClass="App\Repository\GlossaryEntryRepository")
 * @ORM\Table(name="glossary_entry")
 * @Serializer\ExclusionPolicy("all")
 * @AcmeAssert\MaxEntries(max=GlossaryEntry::MAX_ENTRIES, repositoryMethod="getCountByGlossary", message="glossaryEntry.validation.maxEntries", groups={"glossaryEntry:create"})
 */

import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { GlossaryEntity } from './glossary.entity';

// File: application\Entity\GlossaryEntry.php: class GlossaryEntry extends AbstractEntity implements OrganizationInterface
@Entity('glossary_entry')
export class GlossaryEntryEntity {
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
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'organization_id',
  })
  organization?: OrganizationEntity;

  /**
   * @var int Nombre maximal d'entrée dans un glossaire
   */
  MAX_ENTRIES?: number = 50;

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"glossaryEntry:index", "glossaryEntry:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="Glossary", inversedBy="entries")
   * @Gedmo\SortableGroup
   */
  // protected $glossary;
  @Column({
    name: '	glossary_id',
    type: 'int',
    width: 11,
  })
  glossaryId?: number;
  @ManyToOne(() => GlossaryEntity, (e) => e.entries, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: '	glossary_id'
  })
  glossary?: GlossaryEntity;

  /**
   * @ORM\Column(name="content", type="text")
   * @Serializer\Expose
   * @Serializer\Groups({"glossaryEntry:index", "glossaryEntry:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   */
  @Column({
    name: 'content',
    type: 'text',
  })
  content?: string;

  /**
   * @ORM\Column(name="position", type="integer", options={"default": 0})
   * @Gedmo\SortablePosition
   * @Serializer\Expose
   * @Serializer\Groups({"glossaryEntry:index", "glossaryEntry:read"})
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
}
// application\Entity\GlossaryEntry.php
