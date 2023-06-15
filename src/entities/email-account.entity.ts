import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { JoinAttribute } from 'typeorm/query-builder/JoinAttribute';
import { UserEntity } from './user.entity';
import { EmailOutgoingServerEntity } from './email-outgoing-server.entity';

/**
 * @ORM\Entity(repositoryClass="App\Repository\EmailAccountRepository")
 * @ORM\Table(name="email_account")
 * @Serializer\ExclusionPolicy("all")
 * @AcmeAssert\MaxEntries(max=EmailAccount::MAX_ENTRIES, repositoryMethod="getCountByUser", message="emailAccount.validation.maxEntries", groups={"emailAccount:create"})
 */
// File: application\Entity\EmailAccount.php: EmailAccount extends AbstractEntity implements OrganizationInterface
@Entity('email_account')
export class EmailAccountEntity {
  // use OrganizationTrait;
  /**
   * @ORM\ManyToOne(targetEntity="Organization")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  // protected $organization;
  @Column({ name: 'organization_id', type: 'int', width: 11 })
  organizationId?: number;

  @ManyToOne(() => OrganizationEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'organization_id' }
  )
  organization?: OrganizationEntity;

  // @Check TimeStamp
  // use TimestampableEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  /**
   * @var int Nombre maximal de compte de messagerie
   */
  MAX_ENTRIES?: number = 1;

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"emailAccount:index", "emailAccount:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="User", inversedBy="emailAccounts")
   * @ORM\JoinColumn(referencedColumnName="USR_ID")
   * @Gedmo\SortableGroup
   */
  // protected $user;
  @Column({ name: 'user_id', type: 'int', width: 11 })
  USRId?: number;

  @ManyToOne(() => UserEntity, e => e.emailAccounts, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' }
  )
  user?: UserEntity;

  /**
   * @ORM\Column(type="string")
   * @Serializer\Expose
   * @Serializer\Groups({"emailAccount:index", "emailAccount:read"})
   * @Assert\Email(mode=Assert\Email::VALIDATION_MODE_STRICT)
   * @Assert\NotBlank
   */
  @Column({
    name: 'email_address',
    type: 'varchar',
    length: 255,
  })
  emailAddress?: string;

  /**
   * @ORM\Column(type="string", length=255, nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"emailAccount:index", "emailAccount:read"})
   */
  @Column({
    name: 'display_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  displayName?: string;

  /**
   * @ORM\Column(type="string", length=255, nullable=true)
   * @Assert\Email(mode=Assert\Email::VALIDATION_MODE_STRICT)
   */
  @Column({
    name: 'reply_to_address',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  replyToAddress?: string;

  /**
   * @ORM\Column(type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"emailAccount:index", "emailAccount:read"})
   * @Gedmo\SortablePosition
   */
  @Column({
    name: 'position',
    type: 'int',
    width: 11,
    default: 0,
  })
  position?: number;

  /**
   * @ORM\OneToOne(targetEntity="EmailOutgoingServer", mappedBy="emailAccount", cascade={"persist"})
   * @Assert\Valid
   * @Assert\Type("App\Entity\EmailOutgoingServer")
   * @Assert\NotNull
   */
  // protected $outgoingServer;
  @OneToOne(() => EmailOutgoingServerEntity, { createForeignKeyConstraints: false })
  outgoingServer?: EmailOutgoingServerEntity;

  /**
   * @ORM\ManyToMany(targetEntity="User", inversedBy="subscribedEmailAccounts")
   * @ORM\JoinTable(
   *  name="email_account_subscriber",
   *  joinColumns={
   *      @ORM\JoinColumn(name="email_account_id", referencedColumnName="id")
   *  },
   *  inverseJoinColumns={
   *      @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   *  }
   * )
   */
  // protected $subscribers;
  @ManyToMany(() => UserEntity, e => e.subscribedEmailAccounts, {
    createForeignKeyConstraints: false,
  })
  @JoinTable({
    name: 'email_account_subscriber',
    joinColumn: { name: 'email_account_id' },
    inverseJoinColumn: { name: 'user_id' }
  })
  subscribers?: UserEntity[];
}

// application\Entity\EmailAccount.php
