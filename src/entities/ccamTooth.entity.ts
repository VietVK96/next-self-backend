import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity
 * @ORM\Table(
 *  name="ccam_tooth",
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="UNIQ_93EA25995D4C99F38879E8E5", columns={"ccam_id", "rank"})
 *  }
 * )
 */
@Entity('ccam_tooth')
export class CcamToothEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="Ccam", inversedBy="teeth")
   * @ORM\JoinColumn(name="ccam_id", referencedColumnName="id")
   */
  // @TODO EntityMissing
  //   protected $ccam;

  /**
   * @ORM\ManyToOne(targetEntity="DentalMaterial")
   * @ORM\JoinColumn(name="dental_material_id", referencedColumnName="id")
   */
  // @TODO EntityMissing
  //   protected $material;

  /**
   * @ORM\Column(name="rank", type="integer")
   */
  @Column({
    name: 'rank',
    type: 'int',
    width: 11,
  })
  rank?: number;

  /**
   * @ORM\Column(name="forbidden_teeth", type="simple_array", nullable=true)
   */
  @Column({
    name: 'forbidden_teeth',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  forbiddenTeeth?: string;

  /**
   * @ORM\Column(name="forbidden_teeth_cmu", type="simple_array", nullable=true)
   */
  @Column({
    name: 'forbidden_teeth',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  forbiddenTeethCmu?: string;
}

//application\Entity\CcamTooth.php
