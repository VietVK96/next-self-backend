import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_SEARCH_SCH")
 */
@Entity('T_SEARCH_SCH')
export class SearchEntity {
  /**
   * @ORM\Column(name="SCH_ID", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'SCH_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="SCH_NAME", type="string", length=45)
   */
  @Column({
    name: 'SCH_NAME',
    type: 'varchar',
    length: 45,
  })
  name?: string;

  /**
   * @ORM\Column(name="SCH_TABLE", type="string", length=64, nullable=true)
   */
  @Column({
    name: 'SCH_TABLE',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  table?: string;

  /**
   * @ORM\Column(name="SCH_COLUMN", type="string", length=64, nullable=true)
   */
  @Column({
    name: 'SCH_COLUMN',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  column?: string;

  /**
   * @ORM\Column(name="SCH_COLUMN_NAME", type="string", length=45)
   */
  @Column({
    name: 'SCH_COLUMN_NAME',
    type: 'varchar',
    length: 45,
  })
  columnName?: string;

  /**
   * @ORM\Column(name="SCH_COLUMN_LABEL", type="string", length=255, nullable=true)
   * @var string Libellé de la colonne
   */
  @Column({
    name: 'SCH_COLUMN_LABEL',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  columnLabel?: string;

  /**
   * @ORM\Column(name="SCH_COLUMN_POS", type="integer")
   */
  @Column({
    name: 'SCH_COLUMN_POS',
    type: 'int',
    width: 11,
    default: 1,
  })
  pos?: number;

  /**
   * @ORM\Column(name="SCH_COLUMN_TYPE", type="string", nullable=true)
   */
  @Column({
    name: 'SCH_COLUMN_TYPE',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  columnType?: string;
}

// application/Entities/Search.php
