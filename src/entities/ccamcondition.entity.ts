import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CcamEntity } from './ccam.entity';
import { DentalMaterialEntity } from './dental-material.entity';

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
  // protected $ccam;
  @Column({
    name: 'ccam_id',
    type: 'int',
    width: 11,
  })
  ccamId?: number;

  @ManyToOne(() => CcamEntity, (e) => e.conditions, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'ccam_id',
  })
  ccam?: CcamEntity;

  /**
   * @ORM\ManyToOne(targetEntity="DentalMaterial")
   * @ORM\JoinColumn(name="dental_material_id", referencedColumnName="id", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   */
  // protected $material = null;
  @Column({
    name: 'dental_material_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  dentalMaterialId?: number;

  @ManyToOne(() => DentalMaterialEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'dental_material_id',
  })
  material?: DentalMaterialEntity;

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
