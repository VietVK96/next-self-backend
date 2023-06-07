import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

// enum('none', 'outline', 'readonly', 'all')	
enum EnumPrivilegeTypeType {
    NONE = 'none',
    OUTLINE = 'outline',
    READONLY = 'readonly',
    ALL = 'all'
}

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\Privilege")
 * @ORM\Table(name="T_PRIVILEGE_PVG")
 */
@Entity('T_PRIVILEGE_PVG')
export class PrivilegeEntity {

  /**
   * @ORM\Column(name="PVG_ID", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'PVG_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="PVG_NAME", type="text", nullable=true)
   */
  @Column({
    name: 'PVG_NAME',
    type: 'text',
    nullable: true
  })
  name?: string;

  @Column({
    name: 'PVG_COLOR',
    type: 'int',
    width: 11,
    nullable: false,
    default: -12303
  })
  color?: number;

  /**
   * @ORM\Column(name="PVG_TYPE", type="string")
   */
  @Column({
    name: 'PVG_TYPE',
    type: 'enum',
    enum: EnumPrivilegeTypeType,
    nullable: false,
    default: EnumPrivilegeTypeType.ALL
  })
  type?: EnumPrivilegeTypeType;

  /**
   * @ORM\Column(name="PVG_POS", type="integer")
   */
  @Column({
    name: 'PVG_POS',
    type: 'int',
    width: 11,
    nullable: false,
    default: 0
  })
  pos?: number;

  /**
   * @ORM\Column(name="PVG_ENABLE", type="integer")
   */
  @Column({
    name: 'PVG_ENABLE',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 1
  })
  enable?: number;

  /**
   * @ORM\Column(name="PVG_PERMISSION_CALENDAR", type="integer")
   * @var integer Permission agenda
   */
  @Column({
    name: 'PVG_PERMISSION_CALENDAR',
    type: 'tinyint',
    width: 4,
    nullable: false,
    default: 15
  })
  permissionCalendar?: number;

  /**
   * @ORM\Column(name="PVG_PERMISSION_BILLING", type="integer")
   * @var integer Permission facturation
   */
  @Column({
    name: 'PVG_PERMISSION_BILLING',
    type: 'tinyint',
    width: 4,
    nullable: false,
    default: 15
  })
  permissionBilling?: number;

  /**
   * @ORM\Column(name="PVG_PERMISSION_PAIEMENT", type="integer")
   * @var integer Permission paiement
   */
  @Column({
    name: 'PVG_PERMISSION_PAIEMENT',
    type: 'tinyint',
    width: 4,
    nullable: false,
    default: 15
  })
  permissionPaiement?: number;

  /**
   * @ORM\Column(name="PVG_PERMISSION_ACCOUNTING", type="integer")
   * @var integer Permission comptabilité
   */
  @Column({
    name: 'PVG_PERMISSION_ACCOUNTING',
    type: 'tinyint',
    width: 4,
    nullable: false,
    default: 15
  })
  permissionAccounting?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User", inversedBy="privileges")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   */
  // @TODO EntityMissing
  // protected $user;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User", inversedBy="privileged")
   * @ORM\JoinColumn(name="USR_WITH_ID", referencedColumnName="USR_ID")
   */
  // @TODO EntityMissing
  // protected $userWith;

}

//application/Entities/Privilege.php