import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="App\Repository\TagRepository")
 * @ORM\Table(
 *  name="tag",
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="UNIQ_389B78332C8A3DE2B36786B", columns={"organization_id", "title"}),
 *      @ORM\UniqueConstraint(name="UNIQ_389B78332C8A3DE2664B178", columns={"organization_id", "internal_reference"})
 *  }
 * )
 * @ORM\AssociationOverrides({
 *  @ORM\AssociationOverride(name="organization", inversedBy="tags")
 * })
 * @UniqueEntity(fields={"title", "organization"})
 * @UniqueEntity(fields={"internalReference", "organization"})
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('tag')
export class TagEntity {

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"tag:index", "tag:read", "file:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="title", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"tag:index", "tag:read", "file:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'tiltle',
    type: 'varchar',
    length: 255,
  })
  title?: string;

  /**
   * @ORM\Column(name="color", type="json", options={"default": "{""background"": ""#e0e0e0"", ""foreground"": ""#343a40""}"})
   * @Serializer\Expose
   * @Serializer\Groups({"tag:index", "tag:read", "file:read"})
   * @Serializer\Type("array")
   * @Assert\Collection(
   *  fields={
   *      "background"=@Assert\Required({@Assert\NotBlank}),
   *      "foreground"=@Assert\Required({@Assert\NotBlank})
   *  }
   * )
   * @Assert\NotNull
   */
  @Column({
    name: 'color',
    type: 'json',
    default: '{""background"": ""#e0e0e0"", ""foreground"": ""#343a40""}',
  })
  color?: string;

  /**
   * @ORM\Column(name="internal_reference", type="string", length=4, nullable=true, options={"fixed": true})
   * @Serializer\Expose
   * @Serializer\Groups({"tag:read", "file:read"})
   * @Assert\Type("string")
   * @Assert\Length(min=4, max=4)
   */
  @Column({
    name: 'internal_reference',
    type: 'char',
    length: 4,
    nullable: true,
    default: null,
  })
  internalReference?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  /**
     * @ORM\ManyToOne(targetEntity="Organization")
     * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
     */
  // @TODO EntityMissing
  //protected $organization;
}

//application/Entity/Tag.php
