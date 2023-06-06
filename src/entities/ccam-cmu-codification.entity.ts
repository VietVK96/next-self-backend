import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="App\Repository\CcamCmuCodificationRepository")
 * @ORM\Table(name="ccam_cmu_codification")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('ccam_cmu_codification')
export class CcamCmuCodificationEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="Ccam", inversedBy="cmuCodifications")
   * @ORM\JoinColumn(name="ccam_id", referencedColumnName="id")
   */
  // @TODO EntityMissing
  // protected $ccam;

  /**
   * @ORM\Column(name="codification", type="string", length=3, nullable=true, options={"fixed": true})
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Assert\Type("string")
   * @Assert\Length(min=3, max=3)
   */
  @Column({
    name: 'codification',
    type: 'char',
    length: 3,
    nullable: true,
    default: null,
  })
  codification?: string;

  /**
   * @ORM\Column(name="codification_price", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'codification_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  codificationPrice?: number;

  /**
   * @ORM\Column(name="unit_price", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  unitPrice?: number;

  /**
   * @ORM\Column(name="maximum_price", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'maximum_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  maximumPrice?: number;

  /**
   * @ORM\Column(name="forbidden_teeth", type="simple_array", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("array")
   */
  @Column({
    name: 'forbidden_teeth',
    type: 'varchar',
    length: 255,
    nullable: true,
    default: null,
  })
  forbiddenTeeth?: string;

}

// application\Entity\CcamCmuCodification.php
