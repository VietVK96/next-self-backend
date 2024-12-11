import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\User")
 * @ORM\Table(name="T_USER_USR", uniqueConstraints={
 *  @ORM\UniqueConstraint(name="UNIQ_1C904FF51FF1335", columns={"USR_LOG"})
 * })
 * @ORM\HasLifecycleCallbacks
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 */
@Entity('T_USER_USR')
export class UserEntity {
  /**
   * @ORM\Column(name="USR_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'USR_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="USR_LOG", type="string", unique=true)
   */
  @Column({
    name: 'USR_USERNAME',
    type: 'varchar',
    length: 31,
  })
  log?: string;

  @Column({
    name: 'USR_PWD',
    type: 'varchar',
    length: 255,
  })
  password?: string;

  /**
   * @ORM\Column(name="password_hash", type="boolean", options={"default": false})
   */
  @Column({
    name: 'password_hash',
    type: 'int',
    width: 1,
    default: 0,
  })
  passwordHash?: number;

  /**
   * @ORM\Column(name="USR_MAIL", type="string", nullable=false)
   */
  @Column({
    name: 'USR_MAIL',
    type: 'varchar',
    length: 50,
  })
  email?: string;

  /**
   * @ORM\Column(name="USR_LASTNAME", type="string", length=50)
   */
  @Column({
    name: 'USR_NAME',
    type: 'varchar',
    length: 50,
  })
  name?: string;

  /**
   * @ORM\Column(name="USR_PHONE_NUMBER", type="string", length=45, nullable=true)
   */
  @Column({
    name: 'USR_PHONE_NUMBER',
    nullable: true,
    type: 'varchar',
    length: 45,
  })
  phoneNumber?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
