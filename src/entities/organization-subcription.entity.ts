import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="App\Repository\OrganizationSubscriptionRepository")
 * @ORM\Table(
 *  name="organization_subscription",
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="UNIQ_642190C332C8A3DEE899029B", columns={"organization_id", "plan_id"})
 *  }
 * )
 * @ORM\AssociationOverrides({
 *  @ORM\AssociationOverride(name="organization", inversedBy="subscriptions")
 * })
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('organization_subscription')
export class OrganizationSubscriptionEntity {
  /**
   * @ORM\ManyToOne(targetEntity="Organization")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  // @TODO EntityMissing
  // organization;

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"subscription:index", "subscription:read"})
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="Plan")
   * @ORM\JoinColumn(name="plan_id", referencedColumnName="id")
   * @Serializer\Expose
   * @Serializer\Groups({"subscription:index", "subscription:read"})
   */
  // @TODO EntityMissing
  // protected $plan;

  /**
   * @ORM\Column(name="start_of_period", type="datetime")
   * @Serializer\Expose
   * @Serializer\Groups({"subscription:index", "subscription:read"})
   * @Serializer\Type("DateTime<'Y-m-d H:i:s'>")
   * @Assert\DateTime
   * @Assert\NotNull
   */
  @Column({
    name: 'start_of_period',
    type: 'datetime',
    nullable: false,
  })
  startOfPeriod?: string;

  /**
   * @ORM\Column(name="end_of_period", type="datetime")
   * @Serializer\Expose
   * @Serializer\Groups({"subscription:index", "subscription:read"})
   * @Serializer\Type("DateTime<'Y-m-d H:i:s'>")
   * @Assert\DateTime
   * @Assert\NotNull
   * @Assert\GreaterThan(propertyPath="startOfPeriod")
   */
  @Column({
    name: 'end_of_period',
    type: 'datetime',
    nullable: false,
  })
  endOfPeriod?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

//application/Entity/OrganizationSubscription.php
