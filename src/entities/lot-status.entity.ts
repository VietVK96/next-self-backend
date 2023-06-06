import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="App\Repository\LotStatusRepository")
 * @ORM\Table(
 *  name="lot_status",
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="UNIQ_9CCE00761D775834", columns={"value"})
 *  }
 * )
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('lot_status')
export class LotStatusEntity {
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
   * @ORM\Column(name="value", type="integer")
   * @Serializer\Expose
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'value',
    type: 'int',
    width: 11,
  })
  value?: number;

  /**
   * @ORM\Column(name="label", type="string", length=255)
   * @Serializer\Expose
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'label',
    type: 'varchar',
    length: 255,
  })
  label?: string;
}
// application/Entity/LotStatus.php
