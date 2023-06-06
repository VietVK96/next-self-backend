import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity
 * @ORM\Table(name="library_act_quantity_tariff",
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="UNIQ_77BB6B4528578A43553CF0A", columns={"library_act_quantity_id", "tariff_type_id"})
 *  }
 * )
 * @UniqueEntity(fields={"libraryActQuantity", "tariffType"}, errorPath="tariffType", message="libraryActQuantityTariff.validation.unique")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('library_act_quantity_tariff')
export class LibraryActQuantityTariffEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="LibraryActQuantity", inversedBy="tariffs")
   * @ORM\JoinColumn(name="library_act_quantity_id", referencedColumnName="id")
   */
  // @TODO EntityMissing
  //   protected $libraryActQuantity;

  /**
   * @ORM\ManyToOne(targetEntity="App\Entity\TariffType")
   * @ORM\JoinColumn(name="tariff_type_id", referencedColumnName="id")
   * @Serializer\Expose
   * @Serializer\Groups({"libraryActQuantity:read"})
   */
  // @TODO EntityMissing
  //   protected $tariffType;

  /**
   * @ORM\Column(name="tariff", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"libraryActQuantity:read"})
   * @Serializer\Type("float")
   */
  @Column({
    name: 'tariff',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  tariff?: number;
}

//application\Entities\LibraryActQuantityTariff.php
//application\Entity\LibraryActQuantityTariff.php
