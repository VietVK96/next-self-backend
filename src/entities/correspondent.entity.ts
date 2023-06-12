import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CashingEntity } from './cashing.entity';

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\Correspondent")
 * @ORM\Table(name="T_CORRESPONDENT_CPD")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_CORRESPONDENT_CPD')
export class CorrespondentEntity {
  /**
   * @ORM\ManyToOne(targetEntity="Organization")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  // @TODO EntityMissing
  // group;

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="CPD_ID", type="integer")
   * @Serializer\Expose
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'CPD_ID',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="AddressBookCategory")
   * @ORM\JoinColumn(name="correspondent_type_id", referencedColumnName="id", nullable=true)
   */
  // @TODO EntityMissing
  // protected $category = NULL;

  /**
   * @ORM\ManyToOne(targetEntity="Address")
   * @ORM\JoinColumn(name="ADR_ID", referencedColumnName="ADR_ID", nullable=true)
   */
  // @TODO EntityMissing
  // protected $address = NULL;

  @Column({
    name: 'CPD_TYPE',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  type?: string;
  /**
   * @ORM\Column(name="CPD_LASTNAME", type="string", length=255)
   * @Serializer\Expose
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'CPD_LASTNAME',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  lastName?: string;

  /**
   * @ORM\Column(name="CPD_FIRSTNAME", type="string", length=255, nullable=true)
   * @Serializer\Expose
   * @Assert\Type("string")
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'CPD_FIRSTNAME',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  firstName?: string;

  /**
   * @ORM\Column(name="CPD_MAIL", type="string", length=50, nullable=true)
   * @Serializer\Expose
   * @Assert\Type("string")
   * @Assert\Length(max=50)
   */
  @Column({
    name: 'CPD_MAIL',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  email?: string;

  /**
   * @ORM\Column(name="CPD_MSG", type="text", nullable=true)
   * @Serializer\Expose
   * @Assert\Type("string")
   */
  @Column({
    name: 'CPD_MSG',
    type: 'text',
    nullable: true,
  })
  observation?: string;

  /**
   * @ORM\Column(name="CPD_MSG", type="text", nullable=true)
   */
  @Column({
    name: 'CPD_MSG',
    type: 'text',
    nullable: true,
  })
  msg?: string;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Gender")
   * @ORM\JoinColumn(name="GEN_ID", referencedColumnName="GEN_ID")
   */
  // @TODO EntityMissing
  // protected $gender;

  /**
   * @ORM\ManyToMany(targetEntity="PhoneNumber")
   * @ORM\JoinTable(
   *  name="T_CORRESPONDENT_PHONE_CPP",
   *  joinColumns={
   *      @ORM\JoinColumn(name="CPD_ID", referencedColumnName="CPD_ID")
   *  },
   *  inverseJoinColumns={
   *      @ORM\JoinColumn(name="PHO_ID", referencedColumnName="PHO_ID")
   *  }
   * )
   */
  // @TODO EntityMissing
  // protected $phoneNumbers;

  /**
   * @ORM\ManyToMany(targetEntity="\App\Entities\Phone")
   * @ORM\JoinTable(name="T_CORRESPONDENT_PHONE_CPP",
   *  joinColumns={@ORM\JoinColumn(name="CPD_ID", referencedColumnName="CPD_ID")},
   *  inverseJoinColumns={@ORM\JoinColumn(name="PHO_ID", referencedColumnName="PHO_ID")}
   * )
   */
  // @TODO EntityMissing
  // protected $phones;

  @OneToMany(() => CashingEntity, (e) => e.correspondent, {
    createForeignKeyConstraints: false,
  })
  cashings?: CashingEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}

//application/Entities/Correspondent.php
