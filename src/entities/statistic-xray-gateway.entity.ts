import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity
 * @ORM\Table(name="statistic_xray_gateway")
 * @ExclusionPolicy("all")
 */
@Entity('statistic_xray_gateway')
export class StatisticXrayGatewayEntity {
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
   * @ORM\ManyToOne(targetEntity="UserEntity")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   * @Expose
   * @var \App\Entities\UserEntity
   */
  // @TODO EntityMissing
  // protected $user;

  /**
   * Date d'enregistrement de la statistique.
   *
   * @ORM\Column(name="date", type="date")
   * @Expose
   * @var \DateTime
   */
  @Column({
    name: 'date',
    type: 'date',
  })
  date?: string;

  /**
   * Nom du logiciel de radiographie.
   *
   * @ORM\Column(name="xray_name", type="string", length=50)
   * @Expose
   * @var string
   */
  @Column({
    name: 'xray_name',
    type: 'varchar',
    length: 50,
  })
  xrayName?: string;

  /**
   * Nom du système d'exploitation.
   *
   * @ORM\Column(name="operating_system_name", type="string", length=50, nullable=true)
   * @Expose
   * @var string|null
   */
  @Column({
    name: 'operating_system_name',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  operatingSystemName?: string;

  /**
   * Numéro de version du système d'exploitation.
   *
   * @ORM\Column(name="operating_system_version", type="string", length=7, nullable=true)
   * @Expose
   * @var string|null
   */
  @Column({
    name: 'operating_system_name',
    type: 'varchar',
    length: 7,
    nullable: true,
  })
  operatingSystemVersion?: string;

  /**
   * Nombre de hits.
   *
   * @ORM\Column(name="hits", type="integer", options={"default":1})
   * @Expose
   * @var string
   */
  @Column({
    name: 'hits',
    type: 'int',
    width: 11,
    default: 1,
  })
  hits?: number;
}

// application\Entities\StatisticXrayGatewayEntity.php