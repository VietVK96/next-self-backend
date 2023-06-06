import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="App\Repository\PlanRepository")
 * @ORM\Table(name="plan")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('plan')
export class PlanEntity {

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"plan:index", "plan:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id'
  })
  id?: number;

  /**
   * @ORM\Column(name="name", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"plan:index", "plan:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'name',
    type: 'varchar',
    length: 255,
    nullable: false
  })
  name?: string;

}

//application/Entity/Plan.php