import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="App\Repository\PolicyHolderRepository")
 * @ORM\Table(name="policy_holder")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('policy_holder')
export class PolicyHolderEntity {

  /**
   * @ORM\ManyToOne(targetEntity="Organization")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  // @TODO EntityMissing
  // protected $organization;

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"policyHolder:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="Patient")
   * @ORM\JoinColumn(name="patient_id", referencedColumnName="CON_ID")
   * @Serializer\Expose
   * @Serializer\Groups({"policyHolder:read"})
   */
  // @TODO EntityMissing
  // protected $patient = NULL;

  /**
   * @ORM\Column(name="name", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"policyHolder:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'name',
    type: 'varchar',
    length: 255,
    nullable: false
  })
  name?: string;

  /**
   * @ORM\Column(name="insee_number", type="string", length=15, nullable=true, options={"fixed": true})
   * @Serializer\Expose
   * @Serializer\Groups({"policyHolder:read"})
   * @Assert\Type("string")
   * @Assert\Length(min=15, max=15)
   */
  @Column({
    name: 'insee_number',
    type: 'varchar',
    length: 15,
    nullable: true,
  })
  inseeNumber?: string;

}

//application/Entity/PolicyHolder.php