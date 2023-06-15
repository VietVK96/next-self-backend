import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';

/**
 * @ORM\Entity
 * @ORM\Table(name="push_notification")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('push_notification')
export class PushNotificationEntity {
  /**
   * @ORM\Id()
   * @ORM\GeneratedValue()
   * @ORM\Column(name="id", type="integer")
   * @var integer
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\GroupEntity")
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
   * @ORM\Column(name="item_id", type="integer")
   * @var integer
   */
  @Column({
    name: 'item_id',
    type: 'int',
    width: 11,
    nullable: false,
  })
  itemId?: number;

  /**
   * @ORM\Column(name="title", type="string", length=255)
   * @var string
   */
  @Column({
    name: 'title',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  title?: string;

  /**
   * @ORM\Column(name="body", type="string", length=255)
   * @var string
   */
  @Column({
    name: 'body',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  body?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

//application/Entities/PushNotification.php
