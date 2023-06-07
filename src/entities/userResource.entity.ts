import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
  // @TODO EntityMissing
  // protected $user;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Resource")
   * @ORM\JoinColumn(name="resource_id", referencedColumnName="id")
   * @var \App\Entities\Resource Entité représentant la ressource.
   */
  // @TODO EntityMissing
  // protected $resource;

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

  /**
     * @ORM\Column(name="color", type="json", options={"default": "{""background"": ""#000000"", ""foreground"": ""#ffffff""}"})
     * @Serializer\Expose
     * @Serializer\Groups({
     *  "resource:index",
     *  "resource:read",
     *  "details"
     * })
     * @Serializer\Type("array")
     * @Assert\Collection(
     *  fields={
     *      "background"=@Assert\Required({@Assert\NotBlank}),
     *      "foreground"=@Assert\Required({@Assert\NotBlank})
     *  }
     * )
     * @Assert\NotNull
     */
  @Column({
    name: 'color',
    type: 'json',
    default: '"default": "{""background"": ""#000000"", ""foreground"": ""#ffffff""}"'
  })
  color?: string;

  /**
   * @ORM\Column(name="use_default_color", type="boolean", options={"default": true})
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "resource:index",
   *  "resource:read",
   *  "details"
   * })
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'use_default_color',
    type: 'boolean',
    default: true,
  })
  useDefaultColor?: boolean;

  /**
   * @ORM\Column(name="free", type="boolean", options={"default": true})
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'free',
    type: 'boolean',
    default: true,
  })
  free?: boolean;

  /**
     * @ORM\ManyToMany(targetEntity="User", inversedBy="resources", cascade={"persist", "remove"})
     * @ORM\JoinTable(
     *  name="user_resource",
     *  joinColumns={
     *      @ORM\JoinColumn(name="resource_id", referencedColumnName="id")
     *  },
     *  inverseJoinColumns={
     *      @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
     *  }
     * )
     */
  // @TODO EntityMissing
  // protected $subscribers;

}

// application/Entities/UserResource.php
// application/Entity/Resource.php
