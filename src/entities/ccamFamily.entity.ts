import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="App\Repository\CcamFamilyRepository")
 * @ORM\Table(name="ccam_family",
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="UNIQ_592EC78D77153098", columns={"code"})
 *  }
 * )
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('ccam_family')
export class CcamFamilyEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="CcamPanier")
   * @ORM\JoinColumn(name="ccam_panier_id", referencedColumnName="id", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   */
  // @TODO EntityMissing
  //   protected $panier = null;

  /**
   * @ORM\Column(name="code", type="string", length=3, options={"fixed": true})
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(min=3, max=3)
   */
  @Column({
    name: 'code',
    type: 'char',
    length: 3,
  })
  code?: string;

  /**
   * @ORM\Column(name="label", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'label',
    type: 'varchar',
    length: 255,
  })
  label?: string;
}

// application\Entity\CcamFamily.php
