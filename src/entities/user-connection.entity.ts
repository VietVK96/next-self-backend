import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\UserConnection")
 * @ORM\Table(name="T_USER_CONNECTION_USC")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_USER_CONNECTION_USC')
export class UserConnectionEntity {

  /**
   * @ORM\Column(name="USC_ID", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @var integer Identifiant de l'enregistrement
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'USC_ID',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User", inversedBy="connections")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   * @var \App\Entities\User Entité représentant l'utilisateur
   */
  // @TODO EntityMissing
  // protected $user;

  /**
   * @ORM\Column(name="USC_SESSION_ID", type="string", length=50)
   * @var string Identifiant courant de session
   */
  @Column({
    name: 'USC_SESSION_ID',
    type: 'varchar',
    length: 50,
  })
  sessionId?: string;

  /**
   * @ORM\Column(name="USC_IP", type="string", length=31)
   * @var string Adresse IP
   */
  @Column({
    name: 'USC_IP',
    type: 'varchar',
    length: 31,
  })
  ipAddress?: string;

  /**
   * @ORM\Column(name="USC_AGENT", type="text")
   * @var string Client HTML utilisé
   */
  @Column({
    name: 'USC_AGENT',
    type: 'text',
  })
  httpUserAgent?: string;

  @Column({
    name: 'USC_FROM_GSM',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  USC_FROM_GSM?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

}

// application/Entities/UserConnection.php
