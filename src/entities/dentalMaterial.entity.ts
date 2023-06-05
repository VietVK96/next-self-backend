import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="App\Repositories\DentalMaterialRepository")
 * @ORM\Table(name="dental_material")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('dental_material')
export class DentalMaterialEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="label", type="string", length=17)
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(
   *  max=17
   * )
   */
  @Column({
    name: 'label',
    type: 'varchar',
    length: 17,
  })
  label?: string;

  @Column({
    name: 'code',
    type: 'int',
    width: 11,
  })
  code?: number;

  /**
   * @ORM\Column(name="position", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'position',
    type: 'int',
    width: 11,
    default: 0,
  })
  position?: number
}

// application/Entities/DentalMaterial.php
