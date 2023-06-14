import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { CorrespondentTypeEntity } from './correspondent-type.entity';
import { AddressEntity } from './address.entity';
import { GenderEntity } from './gender.entity';
import { PhoneEntity } from './phone.entity';

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
  // group;
  @Column({
    name: 'organization_id',
    type: 'int',
    width: 11
  })
  organizationId?: number;

  @ManyToOne(() => OrganizationEntity, e => e.correspondents, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'organization_id',
    referencedColumnName: 'GRP_ID'
  })
  group?: OrganizationEntity;

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
  // protected $category = NULL;
  @Column({
    name: 'correspondent_type_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  correspondentTypeId?: number;

  @ManyToOne(() => CorrespondentTypeEntity, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'correspondent_type_id',
    referencedColumnName: "id"
  })
  category?: CorrespondentTypeEntity;

  /**
   * @ORM\ManyToOne(targetEntity="Address")
   * @ORM\JoinColumn(name="ADR_ID", referencedColumnName="ADR_ID", nullable=true)
   */
  // protected $address = NULL;
  @Column({
    name: 'ADR_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  ADRId?: string;

  @ManyToOne(() => AddressEntity, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'ADR_ID',
    referencedColumnName: 'ADR_ID'
  })
  address?: AddressEntity;

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
  // protected $gender;
  @Column({
    name: 'GEN_ID',
    type: 'int',
    width: 11,
  })
  genId?: number;

  @ManyToOne(() => GenderEntity, e => e.correspondents, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'GEN_ID',
    referencedColumnName: "GEN_ID"
  })
  gender?: GenderEntity;

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
  // protected $phoneNumbers;
  @ManyToMany(() => PhoneEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinTable({
    name: 'T_CORRESPONDENT_PHONE_CPP',
    joinColumn: { name: "CPD_ID", referencedColumnName: "CPD_ID" },
    inverseJoinColumn: { name: "PHO_ID", referencedColumnName: "PHO_ID" }
  })
  phoneNumbers?: PhoneEntity[];

  /**
   * @ORM\ManyToMany(targetEntity="\App\Entities\Phone")
   * @ORM\JoinTable(name="T_CORRESPONDENT_PHONE_CPP",
   *  joinColumns={@ORM\JoinColumn(name="CPD_ID", referencedColumnName="CPD_ID")},
   *  inverseJoinColumns={@ORM\JoinColumn(name="PHO_ID", referencedColumnName="PHO_ID")}
   * )
   */
  // protected $phones;
  @ManyToMany(() => PhoneEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinTable({
    name: 'T_CORRESPONDENT_PHONE_CPP',
    joinColumn: { name: "CPD_ID", referencedColumnName: "CPD_ID" },
    inverseJoinColumn: { name: "PHO_ID", referencedColumnName: "PHO_ID" }
  })
  phones?: PhoneEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}

//application/Entities/Correspondent.php
