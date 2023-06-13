import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PhoneTypeEntity } from './phone-type.entity';
import { ContactEntity } from './contact.entity';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_PHONE_PHO")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_PHONE_PHO')
export class PhoneEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="PHO_ID", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"unpaid:index"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'PHO_ID',
  })
  id?: number;

  /** File: application\Entities\Phone.php
   * @ORM\Column(name="PHO_NBR", type="string", length=15, nullable=false)
   */
  @Column({
    name: 'PHO_NBR',
    type: 'varchar',
    length: 15,
  })
  nbr?: string;

  /** File: application\Entities\PhoneEntity.php and application\Entity\PhoneNumber.php
   * @ORM\Column(name="PHO_NBR", type="string", length=15)
   * @Serializer\Expose
   * @Serializer\Groups({"unpaid:index"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=15)
   */
  @Column({
    name: 'PHO_NBR',
    type: 'varchar',
    length: 15,
  })
  number?: string;

  /** File: application\Entities\Phone.php and application\Entities\PhoneEntity.php
   * Type de numéro de téléphone.
   *
   * @ORM\ManyToOne(targetEntity="PhoneTypeEntity")
   * @ORM\JoinColumn(name="PTY_ID", referencedColumnName="PTY_ID")
   * @Expose
   * @var \App\Entities\PhoneTypeEntity
   */
  //   protected $type;
  @Column({
    name: 'PTY_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  ptyId?: number;

  @ManyToOne(() => PhoneTypeEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'PTY_ID',
  })
  type?: PhoneTypeEntity;

  /** File: application\Entity\PhoneNumber.php
   * @ORM\ManyToOne(targetEntity="PhoneNumberCategory", inversedBy="phoneNumbers", fetch="EAGER")
   * @ORM\JoinColumn(name="PTY_ID", referencedColumnName="PTY_ID")
   * @Serializer\Expose
   * @Assert\NotNull
   */
  //   protected $category;
  @ManyToOne(() => PhoneTypeEntity, (e) => e.phoneNumbers, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'PTY_ID',
  })
  category?: PhoneTypeEntity;

  /**
   * @ORM\ManyToMany(targetEntity="Patient", mappedBy="phoneNumbers")
   */
  //   protected $patients;
  @ManyToMany(() => ContactEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinTable({
    name: 'T_CONTACT_PHONE_COP',
    joinColumn: {
      name: 'PHO_ID',
    },
    inverseJoinColumn: {
      name: 'CON_ID',
    }
  })
  patients?: ContactEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}
// application/Entity/PhoneNumber.php
// application/Entities/Phone.php
// application/Entities/PhoneEntity.php
