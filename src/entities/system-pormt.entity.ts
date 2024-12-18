import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\User")
 * @ORM\Table(name="T_USER_USR", uniqueConstraints={
 *  @ORM\UniqueConstraint(name="UNIQ_1C904FF51FF1335", columns={"USR_LOG"})
 * })
 * @ORM\HasLifecycleCallbacks
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 */
@Entity('T_SYSTEM_PROMPT')
export class SystemPromptEntity {
  @PrimaryGeneratedColumn('increment', {})
  id?: number;

  @Column({
    nullable: true,
  })
  name?: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  content?: string;
}
