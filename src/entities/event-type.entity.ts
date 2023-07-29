/**
 * @ORM\Entity(repositoryClass="App\Repository\EventTypeRepository")
 * @ORM\Table(name="event_type")
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 * @Serializer\ExclusionPolicy("all")
 */

import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

// File: application\Entity\EventType.php: class EventType extends AbstractEntity implements OrganizationInterface
@Entity('event_type')
export class EventTypeEntity {
  // use OrganizationTrait;
  /**
   * @ORM\ManyToOne(targetEntity="Organization")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  // protected $organization;
  @Column({
    name: 'organization_id',
    type: 'int',
    width: 11,
  })
  organizationId?: number;
  @ManyToOne(() => OrganizationEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'organization_id',
  })
  organization?: OrganizationEntity;

  // use SoftDeleteableEntity;
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // @Check TimeStamp
  // use TimestampableEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

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
   * @ORM\ManyToOne(targetEntity="User", inversedBy="eventTypes")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   */
  // protected $user;
  @Column({
    name: 'user_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  userId?: number;
  @ManyToOne(() => UserEntity, (e) => e.eventTypes, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'user_id',
  })
  user?: UserEntity;

  /**
   * @ORM\Column(name="label", type="string", length=255)
   * @Serializer\Expose
   * @Assert\Type("string")
   * @Assert\NotBlank
   */
  @Column({
    name: 'label',
    type: 'varchar',
    length: 255,
  })
  label?: string;

  /**
   * @ORM\Column(name="position", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'position',
    type: 'int',
    width: 11,
    default: 0,
  })
  position?: number;

  /**
   * @ORM\Column(name="duration", type="time", options={"default": "00:30:00"})
   * @Serializer\Expose
   * @Serializer\Type("DateTime<'H:i:s'>")
   * @Assert\Type("DateTimeInterface")
   * @Assert\NotNull
   */
  @Column({
    name: 'duration',
    type: 'time',
    default: '00:30:00',
  })
  duration?: string;

  /**
   * @ORM\Column(name="color", type="json")
   * @Serializer\Expose
   * @AcmeAssert\Color
   */
  @Column({
    name: 'color',
    type: 'json',
    nullable: true,
  })
  color?: any;

  /**
   * @ORM\Column(name="is_visible", type="boolean", options={"default": true})
   * @Serializer\Expose
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'is_visible',
    type: 'tinyint',
    width: 1,
    default: 1,
  })
  isVisible?: number;
}

// application\Entity\EventType.php
