import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * @ORM\Entity
 * @ORM\Table(name="mobile_settings", uniqueConstraints={
 *  @ORM\UniqueConstraint(name="unique_user_id", columns={"user_id"})
 * })
 * @ExclusionPolicy("all")
 */
@Entity('mobile_settings')
export class MobileSettingEntityEntity {

  /**
   * Identifiant de l'enregistrement.
   * 
   * @ORM\Column(name="id", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @Expose
   * @var integer
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * Entité du groupe.
   * 
   * @ORM\ManyToOne(targetEntity="GroupEntity")
   * @ORM\JoinColumn(name="group_id", referencedColumnName="GRP_ID")
   * @var \App\Entities\GroupEntity
   */
  // @TODO EntityMissing
  // protected $group;

  /**
   * Entité de l'utilisateur.
   * 
   * @ORM\OneToOne(targetEntity="UserEntity", inversedBy="mobileSetting")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   * @var \App\Entities\UserEntity
   */
  // @TODO EntityMissing
  // protected $user;

  /**
   * Durée de la session.
   * 
   * @ORM\Column(name="session_duration", type="integer", options={"default": 60})
   * @Expose
   * @var integer
   */
  @Column({
    name: 'session_duration',
    type: 'integer',
    nullable: false,
    default: 60
  })
  sessionDuration?: number;

}

//application/Entities/MobileSettingEntity.php