import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_LICENSE_LIC")
 */
@Entity('T_LICENSE_LIC')
export class LicenseEntity {
  /**
   * @ORM\Column(name="LIC_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'LIC_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="LIC_START", type="datetime")
   */
  @Column({
    name: 'LIC_START',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  start?: string;

  /**
   * @ORM\Column(name="LIC_END", type="date", nullable=true)
   */
  @Column({
    name: 'LIC_END',
    type: 'date',
    nullable: true,
  })
  end?: string;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\User", inversedBy="license")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   */
  //   protected $user;
  @Column({
    name: 'USR_ID',
    type: 'int',
    width: 11,
  })
  usrId?: number;
  @OneToOne(() => UserEntity, (e) => e.license, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'USR_ID'
  })
  user?: UserEntity;
}

// application\Entities\License.php
