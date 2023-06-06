import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\Library\Bank")
 * @ORM\Table(name="T_LIBRARY_BANK_LBK")
 * @ORM\HasLifecycleCallbacks
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 */

@Entity('T_LIBRARY_BANK_LBK')
export class LibraryBankEntity {
  // use OrganizationTrait;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // use TimestampableTrait;
  // use SoftDeleteableEntity;

  /**
   * @ORM\Column(name="LBK_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'LBK_ID',
  })
  id?: number;

  /**
   *
   * @ORM\Column(name="LBK_ABBR", type="string", length=10)
   * @Serializer\Expose
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=10)
   */
  @Column({
    name: 'LBK_ABBR',
    type: 'varchar',
    length: 10,
  })
  shortName?: string;

  /**
   * @ORM\Column(name="LBK_ABBR", type="string", length=10)
   */
  @Column({
    name: 'LBK_ABBR',
    type: 'varchar',
    length: 10,
  })
  abbr?: string;

  /**
   * @ORM\Column(name="LBK_NAME", type="string", length=100)
   */
  @Column({
    name: 'LBK_NAME',
    type: 'varchar',
    length: 100,
  })
  name?: string;

  /**
   *
   * @ORM\Column(name="LBK_BANK_CODE", type="string", length=5, nullable=true, options={"fixed": true})
   * @Serializer\Expose
   * @Assert\Type(type={"digit"})
   * @Assert\Length(min=5, max=5)
   */
  @Column({
    name: 'LBK_BANK_CODE',
    type: 'varchar',
    length: 5,
    nullable: true,
  })
  code?: string;

  /**
   * @ORM\Column(name="LBK_BANK_CODE", type="string", length=5, nullable=true)
   */
  @Column({
    name: 'LBK_BANK_CODE',
    type: 'varchar',
    length: 5,
    nullable: true,
  })
  bankCode?: string;

  /**
   *
   * @ORM\Column(name="LBK_BRANCH_CODE", type="string", length=5, nullable=true, options={"fixed": true})
   * @Serializer\Expose
   * @Assert\Type(type={"digit"})
   * @Assert\Length(min=5, max=5)
   */
  @Column({
    name: 'LBK_BRANCH_CODE',
    type: 'varchar',
    length: 5,
    nullable: true,
  })
  agencyCode?: string;

  /**
   * @ORM\Column(name="LBK_BRANCH_CODE", type="string", length=5, nullable=true)
   */
  @Column({
    name: 'LBK_BRANCH_CODE',
    type: 'varchar',
    length: 5,
    nullable: true,
  })
  branchCode?: string;

  /**
   *
   * @ORM\Column(name="LBK_ACCOUNT_NBR", type="string", length=11, nullable=true, options={"fixed": true})
   * @Serializer\Expose
   * @Assert\Type(type={"alpha", "digit"})
   * @Assert\Length(min=11, max=11)
   */
  @Column({
    name: 'LBK_ACCOUNT_NBR',
    type: 'varchar',
    length: 11,
    nullable: true,
  })
  accountNumber?: string;

  /**
   * @ORM\Column(name="LBK_ACCOUNT_NBR", type="string", length=11, nullable=true)
   */
  @Column({
    name: 'LBK_ACCOUNT_NBR',
    type: 'varchar',
    length: 11,
    nullable: true,
  })
  accountNbr?: string;

  /**
   *
   * @ORM\Column(name="LBK_BANK_DETAILS", type="string", length=2, nullable=true, options={"fixed": true})
   * @Serializer\Expose
   * @Assert\Type(type={"digit"})
   * @Assert\Length(min=2, max=2)
   */
  @Column({
    name: 'LBK_BANK_DETAILS',
    type: 'varchar',
    length: 2,
    nullable: true,
  })
  key?: string;

  /**
   * @ORM\Column(name="LBK_BANK_DETAILS", type="string", length=2, nullable=true)
   */
  @Column({
    name: 'LBK_BANK_DETAILS',
    type: 'varchar',
    length: 2,
    nullable: true,
  })
  bankDetails?: string;

  /**
   * @ORM\Column(name="LBK_ACCOUNTING_CODE", type="string", length=15, nullable=true)
   * @var string Code comptable
   */
  @Column({
    name: 'LBK_ACCOUNTING_CODE',
    type: 'varchar',
    length: 15,
    default: 512000,
  })
  accountingCode?: string;

  /**
   * @ORM\Column(name="third_party_account", type="string", length=45)
   * @var string Compte Tiers.
   */
  @Column({
    name: 'third_party_account',
    type: 'varchar',
    length: 45,
    default: 411000,
  })
  thirdPartyAccount?: string;

  /**
   * @ORM\Column(name="product_account", type="string", length=45)
   * @var string Compte de Produit.
   */
  @Column({
    name: 'product_account',
    type: 'varchar',
    length: 45,
    default: 700000,
  })
  product_account?: string;

  /**
   * @ORM\Column(name="LBK_CURRENCY", type="string", length=3, nullable=true)
   */
  @Column({
    name: 'LBK_CURRENCY',
    type: 'varchar',
    length: 3,
    nullable: true,
  })
  currency?: string;

  /**
   *
   * @ORM\Column(name="LBK_SLIP_CHECK_NBR", type="integer", options={"default": 1})
   * @Assert\Type("int")
   * @Assert\GreaterThanOrEqual(1)
   * @Assert\NotNull
   */
  @Column({
    name: 'LBK_SLIP_CHECK_NBR',
    type: 'int',
    width: 11,
    default: 1,
  })
  nextBordereauNumber?: number;

  /**
   * @ORM\Column(name="LBK_SLIP_CHECK_NBR", type="integer")
   */
  @Column({
    name: 'LBK_SLIP_CHECK_NBR',
    type: 'int',
    width: 11,
    default: 1,
  })
  slipCheckNbr?: number;

  /**
   *
   * @ORM\Column(name="LBK_TRANSFERT_DEFAULT", type="boolean", options={"default": false})
   * @Serializer\Expose
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'LBK_TRANSFERT_DEFAULT',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  isDefault?: number;

  /**
   * @ORM\Column(name="LBK_TRANSFERT_DEFAULT", type="integer")
   * @var boolean
   */
  @Column({
    name: 'LBK_TRANSFERT_DEFAULT',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  transfertDefault?: number;

  /**
   * Banque par défaut pour les virements.
   *
   * @ORM\Column(name="LBK_TRANSFERT_DEFAULT", type="boolean")
   * @Expose
   * @var boolean
   */
  @Column({
    name: 'LBK_TRANSFERT_DEFAULT',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  default?: number;

  /**
   *
   * @ORM\Column(name="LBK_POS", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'LBK_POS',
    type: 'int',
    width: 11,
    default: 0,
  })
  position?: number;

  /**
   * @ORM\Column(name="LBK_POS", type="integer")
   * @var integer Position de la banque
   */
  @Column({
    name: 'LBK_POS',
    type: 'int',
    width: 11,
    default: 0,
  })
  pos?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Group", inversedBy="libraryBanks")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   * @var \App\Entities\Group Référence l'entité Group.
   */
  // @TODO EntityMissing
  //   protected $group;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   * @var \App\Entities\User Référence l'entité User.
   */
  // @TODO EntityMissing
  //   protected $user;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Address")
   * @ORM\JoinColumn(name="ADR_ID", referencedColumnName="ADR_ID")
   * @var \App\Entities\Address Référence l'entité Address.
   */
  // @TODO EntityMissing
  //   protected $address;
}

//application\Entities\BankEntity.php
//application\Entities\Library\Bank.php
//application\Entity\Bank.php
