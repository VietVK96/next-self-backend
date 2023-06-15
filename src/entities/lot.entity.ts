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
import { LotStatusEntity } from './lot-status.entity';
import { AmoEntity } from './amo.entity';
import { AmcEntity } from './amc.entity';
import { FseEntity } from './fse.entity';
import { OrganizationEntity } from './organization.entity';

/**
 * @ORM\Entity(repositoryClass="App\Repository\LotRepository")
 * @ORM\Table(
 *  name="lot",
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="UNIQ_B81291B32C8A3DED84CFD7B", columns={"organization_id", "external_reference_id"})
 *  }
 * )
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('lot')
export class LotEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"Default", "lot_summary", "caresheet:index", "caresheet:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="LotStatus")
   * @ORM\JoinColumn(name="lot_status_id", referencedColumnName="id")
   * @Serializer\Expose
   */
  // protected $status;
  @Column({
    name: 'lot_status_id',
    type: 'int',
    width: 11,
  })
  lotStatusId?: number;
  @ManyToOne(() => LotStatusEntity, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'lot_status_id'
  })
  status?: LotStatusEntity;

  /**
   * @ORM\ManyToOne(targetEntity="Amo")
   * @ORM\JoinColumn(name="amo_id", referencedColumnName="id", nullable=true)
   * @Serializer\Expose
   */
  // protected $amo = null;
  @Column({
    name: 'amo_id',
    type: 'int',
    width: 11,
    nullable: true
  })
  amoId?: number;
  @ManyToOne(() => AmoEntity, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'amo_id'
  })
  amo?: AmoEntity;

  /**
   * @ORM\ManyToOne(targetEntity="Amc")
   * @ORM\JoinColumn(name="amc_id", referencedColumnName="id", nullable=true)
   * @Serializer\Expose
   */
  // protected $amc = null;
  @Column({
    name: 'amc_id',
    type: 'int',
    width: 11,
    nullable: true
  })
  amcId?: number;
  @ManyToOne(() => AmcEntity, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'amc_id'
  })
  amc?: AmcEntity;

  /**
   * @ORM\Column(name="finess_number", type="string", length=255)
   * @Serializer\Expose
   * @Assert\Type("alnum")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'finess_number',
    type: 'varchar',
    length: 255,
  })
  finessNumber?: string;

  /**
   * @ORM\Column(name="number", type="string", length=3, options={"fixed": true})
   * @Serializer\Expose
   * @Serializer\Groups({"Default", "lot_summary", "caresheet:index", "caresheet:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(min=3, max=3)
   */
  @Column({
    name: 'number',
    type: 'char',
    length: 3,
  })
  number?: string;

  /**
   * @ORM\Column(name="mode", type="enum_lot_mode", length=1, options={"fixed": true, "default": "3"})
   * @Serializer\Expose
   * @Assert\Choice(callback={"App\Enum\LotModeEnum", "getValues"})
   * @Assert\NotNull
   */
  @Column({
    name: 'mode',
    type: 'char',
    length: 1,
    default: '3',
  })
  mode?: string;

  /**
   * @ORM\Column(name="type", type="enum_lot_type", length=3, options={"fixed": true, "default": "FSE"})
   * @Serializer\Expose
   * @Assert\Choice(callback={"App\Enum\LotTypeEnum", "getValues"})
   * @Assert\NotNull
   */
  @Column({
    name: 'type',
    type: 'char',
    length: 3,
    default: 'FSE',
  })
  type?: string;

  /**
   * @ORM\Column(name="creation_date", type="date")
   * @Serializer\Expose
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   * @Assert\NotNull
   */
  @Column({
    name: 'creation_date',
    type: 'date',
  })
  creationDate?: string;

  /**
   * @ORM\Column(name="sending_date", type="date", nullable=true)
   * @Serializer\Expose
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   * @Assert\GreaterThanOrEqual(propertyPath="creationDate")
   */
  @Column({
    name: 'sending_date',
    type: 'date',
    nullable: true,
  })
  sendingDate?: string;

  /**
   * @ORM\Column(name="amount", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amount?: number = 0;

  /**
   * @ORM\Column(name="amount_amo", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'amount_amo',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountAmo?: number = 0;

  /**
   * @ORM\Column(name="amount_amc", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'amount_amc',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountAmc?: number = 0;

  /**
   * @ORM\Column(name="external_reference_id", type="integer")
   * @Serializer\Expose
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThan(0)
   */
  @Column({
    name: 'external_reference_id',
    type: 'int',
    width: 11,
  })
  externalReferenceId?: number;

  /**
   * @ORM\ManyToMany(targetEntity="Caresheet", inversedBy="lots", cascade={"persist"})
   * @ORM\JoinTable(
   *  name="lot_caresheet",
   *  joinColumns={
   *      @ORM\JoinColumn(name="lot_id", referencedColumnName="id")
   *  },
   *  inverseJoinColumns={
   *      @ORM\JoinColumn(name="caresheet_id", referencedColumnName="FSE_ID")
   *  }
   * )
   * @Serializer\Expose
   * @Serializer\MaxDepth(1)
   */
  //   protected $caresheets;
  @ManyToMany(() => FseEntity, (e) => e.lots, {
    createForeignKeyConstraints: false
  })
  @JoinTable({
    name: 'lot_caresheet',
    joinColumn: {
      name: 'lot_id'
    },
    inverseJoinColumn: {
      name: 'caresheet_id'
    }
  })
  caresheets?: FseEntity[];

  // from file extends
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
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'organization_id'
  })
  organization?: OrganizationEntity;

  // @Check TimeStamp
  //use TimestampableEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
// application/Entity/Lot.php
