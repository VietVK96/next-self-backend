import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

/**
 * @ORM\Entity
 * @ORM\Table(name="mobile_subscriptions")
 * @ORM\HasLifecycleCallbacks
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 * @ExclusionPolicy("all")
 */
@Entity('mobile_subscriptions')
export class MobileSubscriptionEntity {
  /**
   * Identifiant de l'enregistrement.
   *
   * @ORM\Column(name="id", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @Expose
   * @var integer
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * Entité du groupe.
   *
   * @ORM\ManyToOne(targetEntity="GroupEntity")
   * @ORM\JoinColumn(name="group_id", referencedColumnName="GRP_ID")
   * @var \App\Entities\GroupEntity
   */
  // protected $group;

  @Column({
    name: 'group_id',
    type: 'int',
    width: 11,
  })
  groupId?: number;
  @ManyToOne(() => OrganizationEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'group_id',
  })
  group?: OrganizationEntity;

  /**
   * Entité de l'utilisateur.
   *
   * @ORM\OneToOne(targetEntity="UserEntity", inversedBy="mobileSubscription")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   * @var \App\Entities\UserEntity
   */
  // protected $user;

  @Column({
    name: 'user_id',
    type: 'int',
    width: 11,
  })
  userId?: number;
  @OneToOne(() => UserEntity, (e) => e.mobileSubscription, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}

//application/Entities/MobileSubscriptionEntity.php
