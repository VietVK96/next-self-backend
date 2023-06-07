import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

// enum('ios', 'android', 'web')
export enum EnumPushNotificationDeviceToken {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}
/**
 * @ORM\Entity
 * @ORM\Table(name="push_notification_device_token", uniqueConstraints={
 *  @ORM\UniqueConstraint(name="unique_group_id_platform_token", columns={"group_id","platform","token"})
 * })
 * @ORM\HasLifecycleCallbacks
 */
@Entity('push_notification_device_token')
export class PushNotificationDeviceTokenEntity {

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
  // @TODO EntityMissing
  // protected $group;

  /**
   * @ORM\Column(name="platform", type="enum_push_notification_platform")
   * @var string
   */
  @Column({
    name: 'platform',
    type: 'enum',
    enum: EnumPushNotificationDeviceToken,
    nullable: false,
  })
  platform?: EnumPushNotificationDeviceToken;

  /**
   * @ORM\Column(name="token", type="string", length=255)
   * @var string
   */
  @Column({
    name: 'token',
    type: 'varchar',
    length: 255,
    nullable: false
  })
  token?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

//application/Entities/PushNotificationDeviceToken.php