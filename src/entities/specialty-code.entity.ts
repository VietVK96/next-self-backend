import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="App\Repository\SpecialtyCodeRepository")
 * @ORM\Table(name="specialty_code")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('specialty_code')
export class SpecialtyCodeEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="NONE")
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotBlank
   */
  @PrimaryGeneratedColumn({
    name: 'id',
  })
  id?: number;

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
    nullable: false,
  })
  label?: string;
}

//application/Entity/SpecialtyCode.php
