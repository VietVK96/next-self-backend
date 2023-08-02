import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

/**
 * @ORM\Entity
 * @ORM\Table(name="resource")
 */
@Entity('resource')
export class ResourceEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "resource:index",
   *  "resource:read",
   *  "list",
   *  "details"
   * })
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="archived_at", type="datetime", nullable=true)
   * @Assert\DateTime
   * @var \DateTimeInterface|null
   */
  @Column({
    name: 'archived_at',
    type: 'datetime',
    nullable: true,
  })
  archivedAt?: string;

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

  /**
   * @ORM\ManyToOne(targetEntity="User")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "resource:read"
   * })
   */
  // protected $addressee = null;

  // @Column({
  //   name: 'user_id',
  //   type: 'int',
  //   width: 11,
  //   nullable: true,
  // })
  // addresseeId?: number;

  // @ManyToOne(() => UserEntity, {
  //   createForeignKeyConstraints: false,
  // })
  // @JoinColumn({
  //   name: 'user_id',
  // })
  // addressee?: UserEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   * @var \App\Entities\User Entité représentant le praticien.
   */
  // protected $user;

  @Column({
    name: 'user_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  userId?: number;

  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'user_id',
  })
  user?: UserEntity;

  /**
   * @ORM\Column(name="name", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "resource:index",
   *  "resource:read",
   *  "list",
   *  "details"
   * })
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'name',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name?: string;

  /**
   * @ORM\Column(name="color", type="json", options={"default": "{""background"": ""#000000"", ""foreground"": ""#ffffff""}"})
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "resource:index",
   *  "resource:read",
   *  "details"
   * })
   * @Serializer\Type("array")
   * @Assert\Collection(
   *  fields={
   *      "background"=@Assert\Required({@Assert\NotBlank}),
   *      "foreground"=@Assert\Required({@Assert\NotBlank})
   *  }
   * )
   * @Assert\NotNull
   */
  @Column({
    name: 'color',
    type: 'json',
    nullable: true,
  })
  color?: string;

  /**
   * @ORM\Column(name="use_default_color", type="boolean", options={"default": true})
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "resource:index",
   *  "resource:read",
   *  "details"
   * })
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'use_default_color',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 1,
  })
  useDefaultColor?: number;

  /**
   * @ORM\Column(name="free", type="boolean", options={"default": true})
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'free',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 1,
  })
  free?: number;

  /**
   * @ORM\ManyToMany(targetEntity="User", inversedBy="resources", cascade={"persist", "remove"})
   * @ORM\JoinTable(
   *  name="user_resource",
   *  joinColumns={
   *      @ORM\JoinColumn(name="resource_id", referencedColumnName="id")
   *  },
   *  inverseJoinColumns={
   *      @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   *  }
   * )
   */
  // protected $subscribers;

  @ManyToMany(() => UserEntity, (e) => e.resources, {
    createForeignKeyConstraints: false,
    cascade: true,
  })
  @JoinTable({
    name: 'user_resource',
    joinColumn: {
      name: 'resource_id',
    },
    inverseJoinColumn: {
      name: 'user_id',
    },
  })
  subscribers?: UserEntity[];
  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Group")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   * @var \App\Entities\Group Entité représentant le group.
   */
  // protected $group;

  @ManyToOne(() => OrganizationEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'organization_id',
  })
  group?: OrganizationEntity;
}

// Transfrom application\Entities\Resource.php
