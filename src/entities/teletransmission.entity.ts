import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="App\Repository\TeletransmissionRepository")
 * @ORM\Table(
 *  name="teletransmission",
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="UNIQ_27F3E71A32C8A3DED84CFD7B", columns={"organization_id", "external_reference_id"})
 *  },
 *  indexes={
 *      @ORM\Index(name="INDEX_27F3E71A32C8A3DE38CB2958", columns={"organization_id", "finess_number"})
 *  }
 * )
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('teletransmission')
export class TeletransmissionEntity {

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="finess_number", type="string", length=255)
   * @Serializer\Expose
   * @Assert\Type("alnum")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'finess_number',
    type: 'varchar',
    length: 255,
  })
  finessNumber?: string;

  /**
   * @ORM\Column(type="string", length=255, nullable=true)
   */
  @Column({
    name: 'operating_system',
    type: 'varchar',
    length: 255,
    nullable: true,
    default: null,
  })
  operatingSystem?: string;

  /**
   * @ORM\Column(name="external_reference_id", type="integer")
   * @Serializer\Expose
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThan(0)
   */
  @Column({
    name: 'external_reference_id',
    type: 'int',
    width: 11,
  })
  externalReferenceId?: number;

  /**
 * @ORM\ManyToOne(targetEntity="Organization")
 * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
 */
  // @TODO EntityMissing
  //protected $organization;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

//application/Entity/Teletransmission.php
