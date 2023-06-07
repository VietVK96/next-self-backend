import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="App\Repositories\CcamUnitPriceRepository")
 * @ORM\Table(name="ccam_unit_price")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('ccam_unit_price')
export class CcamUnitPriceEntity {
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
   * @ORM\ManyToOne(targetEntity="Ccam", inversedBy="unitPrices")
   * @ORM\JoinColumn(name="ccam_id", referencedColumnName="id")
   */
  // @TODO EntityMissing
  //   protected $ccam;

  /**
   * @ORM\Column(name="grid", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'grid',
    type: 'int',
    width: 11,
    default: 0,
  })
  grid?: string;

  /**
   * @ORM\Column(name="unit_price", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("float")
   * @Assert\Type("numeric")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  unitPrice?: number;

  /**
   * @ORM\Column(name="maximum_price", type="decimal", precision=10, scale=2, nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("float")
   * @Assert\Type("numeric")
   * @Assert\GreaterThanOrEqual(
   *  propertyPath="unitPrice"
   * )
   */
  @Column({
    name: 'maximum_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  maximumPrice?: number;

  /**
   * @ORM\Column(name="created_on", type="date")
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   * @Assert\NotNull
   */
  @Column({
    name: 'created_on',
    type: 'date',
  })
  createdOn?: number;
}

// application\Entities\CcamUnitPrice.php
// application\Entity\CcamUnitPrice.php
