import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_DENTAL_MODIFIER_DMO")
 */
@Entity('T_DENTAL_MODIFIER_DMO')
export class DentalModifierEntity {
  /**
   * @ORM\Column(name="DMO_ID", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @var integer Identifiant de l'enregistrement
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'DMO_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="DMO_CODE", type="text")
   * @var string Code du modificateur
   */
  @Column({
    name: 'DMO_CODE',
    type: 'varchar',
    length: 1,
  })
  code?: string;

  /**
   * @ORM\Column(name="DMO_NAME", type="text", unique=true)
   * @var string Libellé du modificateur
   */
  @Column({
    name: 'DMO_NAME',
    type: 'text',
    unique: true,
  })
  name?: string;

  /**
   * @ORM\Column(name="DMO_AMOUNT", type="decimal", precision=10, scale=2, nullable=true)
   * @var float Montant de la majoration
   */
  @Column({
    name: 'DMO_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  amount?: number;

  /**
   * @ORM\Column(name="DMO_PERCENT", type="decimal", precision=10, scale=2, nullable=true)
   * @var float Pourcentage de la majoration
   */
  @Column({
    name: 'DMO_PERCENT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  percent?: number;

  /**
   * @ORM\Column(name="DMO_AGE_LOWER_LIMIT", type="integer", nullable=true)
   * @var integer Age maximal de la majoration
   */
  @Column({
    name: 'DMO_AGE_LOWER_LIMIT',
    type: 'tinyint',
    length: 4,
    nullable: true,
  })
  ageLowerLimit?: number;
}
