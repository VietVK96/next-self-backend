import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { SpecialtyCodeEntity } from './specialty-code.entity';
import { DomtomEntity } from './domtom.entities';

/**
 * @ORM\Entity
 * @ORM\Table(name="user_medical")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('user_medical')
export class UserMedicalEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\OneToOne(targetEntity="User", inversedBy="medical")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   */
  //   protected $user;

  @OneToOne(() => UserEntity, (e) => e.medical, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  /**
   * @ORM\ManyToOne(targetEntity="SpecialtyCode", fetch="EAGER")
   * @ORM\JoinColumn(name="specialty_code_id", referencedColumnName="id")
   * @Serializer\Expose
   */
  //   protected $specialtyCode;

  @Column({
    name: 'specialty_code_id',
    type: 'int',
    width: 11,
    default: 19,
  })
  specialtyCodeId?: number;
  @ManyToOne(() => SpecialtyCodeEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'specialty_code_id',
  })
  specialtyCode?: SpecialtyCodeEntity;

  /**
   * @ORM\ManyToOne(targetEntity="Domtom")
   * @ORM\JoinColumn(name="domtom_id", referencedColumnName="id", nullable=true)
   * @Serializer\Expose
   */
  //   protected $domtom = null;

  @Column({
    name: 'domtom_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  domtomId?: number;
  @ManyToOne(() => DomtomEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'domtom_id',
  })
  domtom?: DomtomEntity;

  /**
   * @ORM\Column(name="last_name", type="string", length=255)
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'last_name',
    type: 'varchar',
    length: 255,
  })
  lastName?: string;

  /**
   * @ORM\Column(name="first_name", type="string", length=255)
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'first_name',
    type: 'varchar',
    length: 255,
  })
  firstName?: string;

  /**
   * @ORM\Column(name="finess_number", type="string", length=255)
   * @Serializer\Expose
   * @Assert\Type("alnum")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'finess_number',
    type: 'varchar',
    length: 255,
  })
  finessNumber?: string;

  /**
   * @ORM\Column(name="national_identifier_number", type="string", length=255, nullable=true)
   * @Serializer\Expose
   * @Assert\Type("string")
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'national_identifier_number',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  nationalIdentifierNumber?: string;

  /**
   * @ORM\Column(name="national_identifier_number_remp", type="string", length=255, nullable=true)
   * @Serializer\Expose
   * @Assert\Type("string")
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'national_identifier_number_remp',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  nationalIdentifierNumberRemp?: string;

  /**
   * @ORM\Column(name="rpps_number", type="string", length=11, nullable=true)
   * @Serializer\Expose
   * @Assert\Type("alnum")
   * @Assert\Length(min=11, max=11)
   */
  @Column({
    name: 'rpps_number',
    type: 'varchar',
    length: 11,
    nullable: true,
  })
  rppsNumber?: string;

  /**
   * @ORM\Column(name="therapeutic_alternative", type="json")
   * @Assert\Type("array")
   * @Assert\NotBlank
   */
  @Column({
    name: 'therapeutic_alternative',
    type: 'json',
    nullable: true,
  })
  therapeuticAlternative?: string;
}
// application/Entity/UserMedical.php
