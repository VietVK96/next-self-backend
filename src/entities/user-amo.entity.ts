import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';

/**
 * @ORM\Entity(repositoryClass="App\Repository\UserAmoRepository")
 * @ORM\Table(name="user_amo", uniqueConstraints={
 *  @ORM\UniqueConstraint(name="UNIQ_501C70ADA76ED395", columns={"user_id"})
 * })
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('user_amo')
export class UserAmoEntity {
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
   * @ORM\OneToOne(targetEntity="User", inversedBy="amo")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   */
  //   protected $user;
  @OneToOne(() => UserEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: "user_id" })
  user?: UserEntity;

  /**
   * @ORM\Column(name="is_tp", type="boolean", options={"default": false})
   * @Serializer\Expose
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'is_tp',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  isTp?: number;

  /**
   * @ORM\Column(name="code_convention", type="integer", options={"default": 1})
   * @Serializer\Expose
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   */
  @Column({
    name: 'code_convention',
    type: 'tinyint',
    width: 4,
    default: 1,
  })
  codeConvention?: number;
}
// application/Entity/UserAmo.php
