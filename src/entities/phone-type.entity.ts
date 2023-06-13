import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PhoneEntity } from './phone.entity';

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\Phone\Type")
 * @ORM\Table(name="T_PHONE_TYPE_PTY")
 */
@Entity('T_PHONE_TYPE_PTY')
export class PhoneTypeEntity {
  /**
   * @ORM\Column(name="PTY_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'PTY_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="PTY_NAME", type="string", length=81, nullable=false)
   */
  @Column({
    name: 'PTY_NAME',
    type: 'string',
    length: 81,
    nullable: false,
  })
  name?: string;

  /**
   * Nom d'affichage du type de numéro de téléphone.
   * 
   * @ORM\Column(name="display_name", type="string", length=255)
   * @Expose
   * @var string
   */
  @Column({
    name: 'display_name',
    type: 'varchar',
    length: 255
  })
  displayName?: string;

  /**
   * @ORM\Column(name="PTY_POS", type="integer")
   * @var integer
   */
  @Column({
    name: 'PTY_POS',
    type: 'integer',
    default: 0,
  })
  pos?: number;

  /**
   * Position du type de numéro de téléphone.
   * 
   * @ORM\Column(name="PTY_POS", type="integer", options={"default": 0})
   * @Expose
   * @var integer
   */
  @Column({
    name: 'PTY_POS',
    type: 'int',
    width: 11,
    default: 0
  })
  position?: number;

  /**
   * @ORM\OneToMany(targetEntity="PhoneNumber", mappedBy="category")
   */
  // protected $phoneNumbers;
  @OneToMany(() => PhoneEntity, (e) => e.category)
  phoneNumbers?: PhoneEntity[];

}

// application/Entites/Phone/Type.php
