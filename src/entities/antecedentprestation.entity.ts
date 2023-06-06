import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_DENTAL_INITIAL_DIN")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_DENTAL_INITIAL_DIN')
export class AntecedentPrestationEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="DIN_ID", type="integer")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'DIN_ID',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="Contact")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   */
  // @TODO EntityMissing
  //   protected $contact;

  /**
   * @ORM\ManyToOne(targetEntity="LibraryAct")
   * @ORM\JoinColumn(name="library_act_id", referencedColumnName="id", nullable=true)
   */
  // @TODO EntityMissing
  //   protected $libraryAct = null;

  /**
   * @ORM\ManyToOne(targetEntity="LibraryActQuantity")
   * @ORM\JoinColumn(name="library_act_quantity_id", referencedColumnName="id", nullable=true)
   */
  // @TODO EntityMissing
  //   protected $libraryActQuantity = null;

  /**
   * @ORM\Column(name="DIN_NAME", type="text")
   */
  @Column({
    name: 'DIN_NAME',
    type: 'text',
  })
  name?: string;

  /**
   * @ORM\Column(name="DIN_TOOTH", type="text", nullable=true)
   */
  @Column({
    name: 'DIN_TOOTH',
    type: 'text',
    nullable: true,
  })
  teeth?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}
//application/Entities/AntecedentPrestation.php
