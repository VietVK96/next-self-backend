import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\MobileAuthenticationCodeRepository")
 * @ORM\Table(name="mobile_authentication_codes", uniqueConstraints={
 *  @ORM\UniqueConstraint(name="unique_group_id_code", columns={"group_id","code"})
 * })
 * @ORM\HasLifecycleCallbacks
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=true)
 * @ExclusionPolicy("all")
 */
@Entity('mobile_authentication_codes')
export class MobileAuthenticationCodeEntityEntity {

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
   * @ORM\OneToOne(targetEntity="UserEntity")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   * @var \App\Entities\UserEntity
   */
  // @TODO EntityMissing
  // protected $user;

  /**
   * Entité du patient.
   * 
   * @ORM\ManyToOne(targetEntity="PatientEntity")
   * @ORM\JoinColumn(name="patient_id", referencedColumnName="CON_ID")
   * @Expose
   * @var \App\Entities\PatientEntity
   */
  // @TODO EntityMissing
  // protected $patient;

  /**
   * Code d'authentification.
   * 
   * @ORM\Column(name="code", type="string", length=6)
   * @Expose
   * @var string
   */
  @Column({
    name: 'code',
    type: 'varchar',
    length: 6,
    nullable: false
  })
  code?: string;


  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}

//application/Entities/MobileAuthenticationCodeEntity.php