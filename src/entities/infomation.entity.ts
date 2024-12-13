import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\User")
 * @ORM\Table(name="T_USER_USR", uniqueConstraints={
 *  @ORM\UniqueConstraint(name="UNIQ_1C904FF51FF1335", columns={"USR_LOG"})
 * })
 * @ORM\HasLifecycleCallbacks
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 */
@Entity('T_USER_USR_INFO')
export class UserInfoEntity {
  @PrimaryGeneratedColumn('increment', {})
  id?: number;

  @Column()
  userId?: number;

  @Column({
    nullable: true,
  })
  cvPath?: string;

  @Column({
    nullable: false,
    default: 0,
  })
  activeStep?: number;

  @Column({
    nullable: true,
    type: 'json',
  })
  questions?: string;

  @Column({
    nullable: true,
    type: 'json',
  })
  brandPlatform?: string;

  @Column({
    nullable: true,
  })
  originalname?: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  summarizeCV?: string;
}
