import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { UserEntity } from './user.entity';
/**
 * @ORM\Entity
 * @ORM\Table(name="T_USER_SMS_USS")
 */

@Entity('T_USER_SMS_USS')
export class UserSmsEntity {
  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\User", inversedBy="sms")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="NONE")
   */
  // protected $user;

  @PrimaryColumn({
    name: 'USR_ID',
    type: 'int',
    width: 11,
  })
  usrId?: number;
  @OneToOne(() => UserEntity, (e) => e.sms, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'USR_ID' })
  user?: UserEntity;

  /**
   * @ORM\Column(name="USS_PHONE", type="string", length=45, nullable=true)
   */
  @Column({
    name: 'USS_PHONE',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  phone?: string;

  /**
   * @ORM\Column(name="USS_COUNTRY", type="string", length=3, nullable=true)
   */
  @Column({
    name: 'USS_COUNTRY',
    type: 'varchar',
    length: 3,
    nullable: true,
  })
  country?: string;

  /**
   * @ORM\Column(name="USS_CODE", type="string", length=45, nullable=true)
   */
  @Column({
    name: 'USS_CODE',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  code?: string;

  /**
   * @ORM\Column(name="USS_VALIDATED", type="integer", nullable=false)
   */
  @Column({
    name: 'USS_VALIDATED',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0,
  })
  validated?: number;

  /**
   * @ORM\Column(name="USS_STOCK", type="integer", nullable=false)
   */
  @Column({
    name: 'USS_STOCK',
    type: 'int',
    nullable: false,
    default: 0,
  })
  stock?: number;

  /**
   * @ORM\Column(name="USS_STOCK", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'USS_STOCK',
    type: 'int',
    nullable: false,
    default: 0,
  })
  quantity?: number;
}

//application/Entities/User/Sms.php
