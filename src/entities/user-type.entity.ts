import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * @ORM\Entity
 * @ORM\Table(name="T_USER_TYPE_UST")
 */

@Entity('T_USER_TYPE_UST')
export class UserTypeEntity {

  /**
   * @ORM\Column(name="UST_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'UST_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="UST_NAME", type="string", length=45, nullable=false)
   */
  @Column({
    name: 'UST_NAME',
    type: 'varchar',
    length: 45,
    nullable: false
  })
  name?: string;

  /**
   * @ORM\Column(name="UST_PRO", type="integer", nullable=false)
   */
  @Column({
    name: 'UST_PRO',
    type: 'tinyint',
    width: 1,
    nullable: false
  })
  professional?: number;
}

//application/Entities/User/Type.php