import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="App\Repositories\CcamConditionRepository")
 * @ORM\Table(name="ccam_condition")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('ccam_condition')
export class CcamConditionEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="Ccam", inversedBy="conditions")
   * @ORM\JoinColumn(name="ccam_id", referencedColumnName="id")
   */
  // @TODO EntityMissing
  // protected $ccam;

  /**
   * @ORM\ManyToOne(targetEntity="DentalMaterial")
   * @ORM\JoinColumn(name="dental_material_id", referencedColumnName="id", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   */
  // @TODO EntityMissing
  // protected $material = null;

  /**
   * @ORM\Column(name="forbidden_teeth", type="simple_array", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("array")
   */
  @Column({
    name: 'forbidden_teeth',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  forbiddenTeeth?: string;
}

//application\Entities\CcamCondition.php
