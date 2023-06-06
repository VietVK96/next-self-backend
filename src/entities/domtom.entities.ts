import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="App\Repository\DomtomRepository")
 * @ORM\Table(name="domtom")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('domtom')
export class Domtom {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="NONE")
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"domtom:index", "domtom:read"})
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotBlank
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="name", type="string", length=50)
   * @Serializer\Expose
   * @Serializer\Groups({"domtom:index", "domtom:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=50)
   */
  @Column({
    name: 'name',
    type: 'varchar',
    length: 50,
  })
  name?: string;
}

//application\Entity\Domtom.php
