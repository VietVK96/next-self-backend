import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="App\Repository\DomtomMajorationRepository")
 * @ORM\Table(
 *  name="domtom_majoration",
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="UNIQ_1D3ABF235D4C99F3DFB1C783", columns={"ccam_id", "domtom_id"})
 *  }
 * )
 * @Serializer\ExclusionPolicy("all")
 * @UniqueEntity(fields={"ccam", "domtom"})
 */
// File: application\Entity\DomtomMajoration.php: DomtomMajoration extends AbstractEntity
@Entity('domtom_majoration')
export class DomtomMajorationEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"domtomMajoration:index", "domtomMajoration:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="Ccam", inversedBy="domtomMajorations")
   * @ORM\JoinColumn(name="ccam_id", referencedColumnName="id")
   */
  // @TODO EntityMissing
  // protected $ccam;

  /**
   * @ORM\ManyToOne(targetEntity="Domtom")
   * @ORM\JoinColumn(name="domtom_id", referencedColumnName="id")
   */
  // @TODO EntityMissing
  // protected $domtom;

  /**
   * @ORM\Column(name="modification_date", type="date")
   * @Serializer\Expose
   * @Serializer\Groups({"domtomMajoration:index", "domtomMajoration:read"})
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   * @Assert\NotNull
   */
  @Column({
    name: 'modification_date',
    type: 'date',
  })
  modificationDate?: string;

  /**
   * @ORM\Column(name="coefficient", type="decimal", precision=4, scale=3, options={"default": 1})
   * @Serializer\Expose
   * @Serializer\Groups({"domtomMajoration:index", "domtomMajoration:read"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotBlank
   */
  @Column({
    name: 'coefficient',
    type: 'decimal',
    precision: 4,
    scale: 3,
    default: 1,
  })
  coefficient?: number;
}

// application\Entity\DomtomMajoration.php