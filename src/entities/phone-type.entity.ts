import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\Phone\Type")
 * @ORM\Table(name="T_PHONE_TYPE_PTY")
 */
@Entity('T_PHONE_TYPE_PTY')
export class PhoneTypeEntity {

  /**
   * @ORM\Column(name="PTY_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'PTY_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="PTY_NAME", type="string", length=81, nullable=false)
   */
  @Column({
    name: 'PTY_NAME',
    type: 'string',
    length: 81,
    nullable: false
  })
  name?: string;

  /**
   * @ORM\Column(name="PTY_POS", type="integer")
   * @var integer
   */
  @Column({
    name: 'PTY_POS',
    type: 'integer',
    default: 0
  })
  pos?: number;

}

// application/Entites/Phone/Type.php