import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

/**
 * @ORM\Entity(repositoryClass="App\Repository\SendingLogRepository")
 * @ORM\Table(
 *  name="T_USER_SMS_HISTORY_USH",
 *  indexes={
 *      @ORM\Index(name="INDEX_1F5BDC3FA76ED395F76648CC", columns={"USR_ID", "USH_USED"})
 *  }
 * )
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('T_USER_SMS_HISTORY_USH')
export class SendingLogEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="USH_ID", type="integer")
   * @Serializer\Expose
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'USH_ID',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="User", inversedBy="sendingLogs")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   */
  // protected $user;
  @Column({
    name: 'USR_ID',
    type: 'int',
    width: 11,
  })
  usrId?: number;
  @ManyToOne(() => UserEntity, (e) => e.sendingLogs, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'USR_ID',
  })
  user?: UserEntity;

  // @TODO EntityMissing
  // @Column({
  //   name: 'RMT_ID',
  //   type: 'int',
  //   width: 11,
  //   nullable: true
  // })
  // rmtId?: number;
  // @OneToOne(() => ReminderTypeEntity, {
  //   createForeignKeyConstraints: false
  // })
  // @JoinColumn({
  //   name: 'RMT_ID',
  // })
  // reminderType?: ReminderTypeEntity;

  /**
   * @ORM\Column(name="USH_USED", type="datetime")
   * @Serializer\Expose
   * @Serializer\Type("DateTime<'Y-m-d H:i:s'>")
   * @Assert\DateTime
   * @Assert\NotNull
   */
  @Column({
    name: 'USH_USED',
    type: 'datetime',
    nullable: true,
  })
  sendingDate?: string;

  /**
   * @ORM\Column(name="USH_RECEIVER", type="string", length=15)
   * @Serializer\Expose
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=15)
   */
  @Column({
    name: 'USH_RECEIVER',
    type: 'text',
    nullable: false,
  })
  receiver?: string;

  /**
   * @ORM\Column(name="USH_MSG", type="text")
   * @Serializer\Expose
   * @Assert\Type("string")
   * @Assert\NotBlank
   */
  @Column({
    name: 'USH_MSG',
    type: 'text',
    nullable: true,
  })
  message?: string;

  /**
   * @ORM\Column(name="USH_OVH_ID", type="integer", nullable=true)
   * @Serializer\Expose
   * @Serializer\Type("int")
   * @Assert\Type("int")
   */
  @Column({
    name: 'USH_OVH_ID',
    type: 'integer',
    width: 11,
    nullable: true,
  })
  externalReferenceId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

//application/Entity/SendingLog.php
