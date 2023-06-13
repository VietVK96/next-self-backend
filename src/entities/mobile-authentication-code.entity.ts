import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { ContactEntity } from './contact.entity';

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
  // protected $group;
  @Column({
    name: 'group_id',
  })
  groupId?: number;
  @ManyToOne(() => OrganizationEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'group_id',
  })
  group?: OrganizationEntity;

  /**
   * Entité de l'utilisateur.
   *
   * @ORM\OneToOne(targetEntity="UserEntity")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   * @var \App\Entities\UserEntity
   */
  // protected $user;

  @OneToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

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

  @Column({
    name: 'patient_id',
  })
  patientId?: number;
  @ManyToOne(() => ContactEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'patient_id',
  })
  patient?: ContactEntity;

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
    nullable: false,
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
