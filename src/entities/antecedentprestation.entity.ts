import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContactEntity } from './contact.entity';
import { LibraryActEntity } from './library-act.entity';
import { LibraryActQuantityEntity } from './library-act-quantity.entity';

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
  //   protected $contact;
  @Column({
    name: 'CON_ID',
  })
  conId?: number;
  @ManyToOne(() => ContactEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'CON_ID',
  })
  contact?: ContactEntity;

  /**
   * @ORM\ManyToOne(targetEntity="LibraryAct")
   * @ORM\JoinColumn(name="library_act_id", referencedColumnName="id", nullable=true)
   */
  //   protected $libraryAct = null;
  @Column({
    name: 'library_act_id',
  })
  libraryActId?: number;

  @ManyToOne(() => LibraryActEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'library_act_id',
  })
  libraryAct?: LibraryActEntity;

  /**
   * @ORM\ManyToOne(targetEntity="LibraryActQuantity")
   * @ORM\JoinColumn(name="library_act_quantity_id", referencedColumnName="id", nullable=true)
   */
  //   protected $libraryActQuantity = null;
  @Column({
    name: 'library_act_quantity_id',
  })
  libraryActQuantityId?: number;

  @ManyToOne(() => LibraryActQuantityEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'library_act_quantity_id',
  })
  libraryActQuantity?: LibraryActQuantityEntity;

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
