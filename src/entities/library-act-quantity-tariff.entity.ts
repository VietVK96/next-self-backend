import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LibraryActQuantityEntity } from './library-act-quantity.entity';
import { TariffTypeEntity } from './tariff-type.entity';

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
  //   protected $libraryActQuantity;

  @Column({
    name: 'library_act_quantity_id',
    type: 'int',
    width: 11,
  })
  libraryActChildId?: number;
  @ManyToOne(() => LibraryActQuantityEntity, (e) => e.tariffs, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'library_act_quantity_id',
  })
  libraryActQuantity?: LibraryActQuantityEntity;

  /**
   * @ORM\ManyToOne(targetEntity="App\Entity\TariffType")
   * @ORM\JoinColumn(name="tariff_type_id", referencedColumnName="id")
   * @Serializer\Expose
   * @Serializer\Groups({"libraryActQuantity:read"})
   */
  //   protected $tariffType;

  @Column({
    name: 'tariff_type_id',
    type: 'int',
    width: 11,
  })
  tariffTypeId?: number;
  @ManyToOne(() => TariffTypeEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'tariff_type_id',
  })
  tariffType?: TariffTypeEntity;

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
    default: 0,
  })
  tariff?: number;
}

//application\Entities\LibraryActQuantityTariff.php
//application\Entity\LibraryActQuantityTariff.php
