import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="App\Repository\NoemieRepository")
 * @ORM\Table(
 *  name="noemie",
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="UNIQ_5D4E356E32C8A3DED84CFD7B", columns={"organization_id", "external_reference_id"})
 *  },
 *  indexes={
 *      @ORM\Index(name="INDEX_5D4E356E38CB2958BF4434F7", columns={"finess_number", "file_content_hash"})
 *  }
 * )
 */
@Entity('noemie')
export class NoemieEntity {
  /**
   * @ORM\ManyToOne(targetEntity="Organization")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  // @TODO EntityMissing
  // organization;

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="finess_number", type="string", length=255)
   * @Assert\Type("alnum")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'finess_number',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  finessNumber?: string;

  /**
   * @ORM\Column(name="creation_date", type="date")
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   * @Assert\NotNull
   */
  @Column({
    name: 'creation_date',
    type: 'date',
    nullable: false,
  })
  creationDate?: string;

  /**
   * @ORM\Column(name="reference", type="string", length=3, options={"fixed": true})
   * @Assert\Type("alnum")
   * @Assert\NotBlank
   * @Assert\Length(min=3, max=3)
   */
  @Column({
    name: 'reference',
    type: 'varchar',
    length: 3,
    nullable: false,
  })
  reference?: string;

  /**
   * @ORM\Column(name="file_content", type="text")
   * @Assert\Type("string")
   * @Assert\NotBlank
   */
  @Column({
    name: 'file_content',
    type: 'blob',
    nullable: false,
  })
  fileContent?: string;

  /**
   * @ORM\Column(name="file_content_hash", type="string", length=40, options={"fixed": true})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(min=40, max=40)
   */
  @Column({
    name: 'file_content_hash',
    type: 'char',
    length: 40,
    nullable: false,
  })
  fileContentHash?: string;

  /**
   * @ORM\Column(name="external_reference_id", type="integer")
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\GreaterThan(0)
   */
  @Column({
    name: 'external_reference_id',
    type: 'int',
    nullable: false,
  })
  externalReferenceId?: number;

  /**
   * @ORM\ManyToMany(targetEntity="Caresheet", inversedBy="noemies", cascade={"persist"})
   * @ORM\JoinTable(name="noemie_caresheet", joinColumns={
   *  @ORM\JoinColumn(name="noemie_id", referencedColumnName="id")
   * }, inverseJoinColumns={
   *  @ORM\JoinColumn(name="caresheet_id", referencedColumnName="FSE_ID")
   * })
   * @Serializer\Groups({"caresheets_group"})
   */
  // @TODO EntityMissing
  // protected $caresheets;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

//application/Entity/Noemie.php
