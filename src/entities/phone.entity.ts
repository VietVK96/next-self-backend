import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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
  // @TODO EntityMissing
  //   protected $type;

  /** File: application\Entity\PhoneNumber.php
   * @ORM\ManyToOne(targetEntity="PhoneNumberCategory", inversedBy="phoneNumbers", fetch="EAGER")
   * @ORM\JoinColumn(name="PTY_ID", referencedColumnName="PTY_ID")
   * @Serializer\Expose
   * @Assert\NotNull
   */
  // @TODO EntityMissing
  //   protected $category;

  /**
   * @ORM\ManyToMany(targetEntity="Patient", mappedBy="phoneNumbers")
   */
  // @TODO EntityMissing
  //   protected $patients;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}
// application/Entity/PhoneNumber.php
// application/Entities/Phone.php
// application/Entities/PhoneEntity.php
