import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="App\Repository\CaresheetStatusRepository")
 * @ORM\Table(name="caresheet_status")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('caresheet_status')
export class CaresheetStatusEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"caresheet:index", "caresheet:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="value", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"caresheet:index", "caresheet:read"})
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
   * @Serializer\Groups({"caresheet:index", "caresheet:read"})
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

  /**
   * @ORM\Column(name="description", type="text", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"caresheet:index", "caresheet:read"})
   * @Assert\Type("string")
   */
  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
  })
  description?: string;
}

// application\Entity\CaresheetStatus.php
