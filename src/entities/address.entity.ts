import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_ADDRESS_ADR")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_ADDRESS_ADR')
export class AddressEntity {
  /**
   * @ORM\Column(name="ADR_ID", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @Expose
   * @var string|null
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'ADR_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="ADR_STREET", type="string", length=255, nullable=true)
   */
  @Column({
    name: 'ADR_STREET',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  street?: string;

  /**
   * @ORM\Column(name="ADR_STREET_COMP", type="string", length=255, nullable=true)
   */
  @Column({
    name: 'ADR_STREET_COMP',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  streetComp?: string;

  /**
   * @ORM\Column(name="ADR_ZIP_CODE", type="string", length=6, nullable=true)
   */
  @Column({
    name: 'ADR_ZIP_CODE',
    type: 'varchar',
    length: 6,
    nullable: true,
  })
  zipCode?: string;

  /**
   * @ORM\Column(name="ADR_CITY", type="string", length=255, nullable=true)
   */
  @Column({
    name: 'ADR_CITY',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  city?: string;

  /**
   * @ORM\Column(name="ADR_COUNTRY", type="string", length=255, nullable=true)
   * @Expose
   * @var string|null
   */
  @Column({
    name: 'ADR_COUNTRY',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  country?: string;

  /**
   * @ORM\Column(name="ADR_COUNTRY_ABBR", type="string", length=3, nullable=true)
   */
  @Column({
    name: 'ADR_COUNTRY_ABBR',
    type: 'varchar',
    length: 3,
    nullable: true,
  })
  countryAbbr?: string;

  /**
   * Code pays.
   *
   * @ORM\Column(name="ADR_COUNTRY_ABBR", type="string", length=3, nullable=true)
   * @Expose
   * @var string|null
   */
  @Column({
    name: 'ADR_COUNTRY_ABBR',
    type: 'varchar',
    length: 3,
    nullable: true,
  })
  countryCode?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}
//application/Entities/Address.php
//application/Entities/AddressEntity.php
