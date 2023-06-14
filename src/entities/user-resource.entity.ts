import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { ResourceEntity } from './resource.entity';

/**
 * @ORM\Entity
 * @ORM\Table(name="user_resource")
 */
@Entity('user_resource')
export class UserResourceEntity {
  /**
   * @ORM\Column(name="id", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @var integer Identifiant de l'enregistrement.
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   * @var \App\Entities\User Entité représentant l'utilisateur.
   */
  // protected $user;

  @Column({
    name: 'user_id',
    type: 'int',
    width: 11,
  })
  usrId?: number;
  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'user_id',
  })
  user?: UserEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Resource")
   * @ORM\JoinColumn(name="resource_id", referencedColumnName="id")
   * @var \App\Entities\Resource Entité représentant la ressource.
   */
  // @TODO EntityMissing
  // protected $resource;

  @Column({
    name: 'resource_id',
    type: 'int',
    width: 11,
  })
  resourceId?: number;
  @ManyToOne(() => ResourceEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'resource_id',
  })
  resource?: ResourceEntity;

  /**
   * @ORM\Column(name="selected", type="integer")
   * @var boolean Etat de sélection de la ressource.
   */
  @Column({
    name: 'selected',
    type: 'tinyint',
    width: 1,
    default: 1,
  })
  selected?: number;

  /**
   * @ORM\Column(name="access_level", type="integer")
   * @var integer Niveau d'accès à la ressource.
   */
  @Column({
    name: 'access_level',
    type: 'tinyint',
    width: 4,
    default: 15,
  })
  accessLevel?: number;
}

// application/Entities/UserResource.php
