import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MedicamentFamilyEntity } from './medicament-family.entity';
import { ContraindicationEntity } from './contraindication.entity';
import { OrganizationEntity } from './organization.entity';

/**
 * @ORM\Entity(repositoryClass="App\Repository\MedicamentRepository")
 * @ORM\Table(
 *  name="T_MEDICAL_PRESCRIPTION_MDP",
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="UNIQ_9A9C723A32C8A3DE2664B178", columns={"organization_id", "internal_reference"})
 *  }
 * )
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('T_MEDICAL_PRESCRIPTION_MDP')
export class MedicamentEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="MDP_ID", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"medicament:index", "medicament:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'MDP_ID',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="MedicamentFamily", inversedBy="medicaments")
   * @ORM\JoinColumn(name="MDT_ID", referencedColumnName="MDT_ID")
   * @Gedmo\SortableGroup
   */
  //   protected $family;
  @Column({
    name: 'MDT_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  mdtId?: number;
  @ManyToOne(() => MedicamentFamilyEntity, (e) => e.medicaments, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'MDT_ID',
  })
  family?: MedicamentFamilyEntity;

  /**
   * @ORM\Column(name="MDP_NAME", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"medicament:index", "medicament:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'MDP_NAME',
    type: 'text',
    nullable: true,
  })
  name?: string;

  /**
   * @ORM\Column(name="MDP_ABBR", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"medicament:index", "medicament:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'MDP_ABBR',
    type: 'text',
    nullable: true,
  })
  abbreviation?: string;

  /**
   * @ORM\Column(name="position", type="integer", options={"default": 0})
   * @Gedmo\SortablePosition
   * @Serializer\Expose
   * @Serializer\Groups({"medicament:index", "medicament:read"})
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   */
  @Column({
    name: 'position',
    type: 'int',
    width: 11,
    default: 0,
  })
  position?: number = 0;

  /**
   * @ORM\Column(name="MDP_FORMAT", type="string", length=255, nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"medicament:read"})
   * @Assert\Type("string")
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'MDP_FORMAT',
    type: 'text',
    nullable: true,
  })
  format?: string;

  /**
   * @ORM\Column(name="MDP_DOSAGE", type="string", length=255, nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"medicament:read"})
   * @Assert\Type("string")
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'MDP_DOSAGE',
    type: 'text',
    nullable: true,
  })
  dosage?: string;

  /**
   * @ORM\Column(name="MDP_PRESCRIPTION", type="text", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"medicament:read"})
   * @Assert\Type("string")
   */
  @Column({
    name: 'MDP_PRESCRIPTION',
    type: 'text',
    nullable: true,
  })
  posologie?: string;

  /**
   * @ORM\Column(name="MDP_BCB_ID", type="integer", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"medicament:read"})
   * @Assert\Type("int")
   */
  @Column({
    name: 'MDP_BCB_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  bcbdextherId?: number;

  /**
   * @ORM\Column(name="internal_reference", type="string", length=7, nullable=true, options={"fixed": true})
   */
  @Column({
    name: 'internal_reference',
    type: 'char',
    length: 7,
    nullable: true,
  })
  internalReference?: string;
  /**
   * @ORM\ManyToMany(targetEntity="Contraindication")
   * @ORM\JoinTable(
   *  name="T_MEDICAL_PRESCRIPTION_CONTRAINDICATION_MPC",
   *  joinColumns={
   *      @ORM\JoinColumn(name="MDP_ID", referencedColumnName="MDP_ID")
   *  },
   *  inverseJoinColumns={
   *      @ORM\JoinColumn(name="MLC_ID", referencedColumnName="MLC_ID")
   *  }
   * )
   * @Serializer\Expose
   * @Serializer\Groups({"medicament:read"})
   */
  // protected $contraindications;
  @ManyToMany(() => ContraindicationEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinTable({
    name: 'T_MEDICAL_PRESCRIPTION_CONTRAINDICATION_MPC',
    joinColumn: {
      name: 'MDP_ID',
    },
    inverseJoinColumn: {
      name: 'MLC_ID',
    },
  })
  contraindications?: ContraindicationEntity[];

  // from file extends
  /**
   * @ORM\ManyToOne(targetEntity="Organization")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  // protected $organization;
  @Column({
    name: 'organization_id',
    type: 'int',
    width: 11,
  })
  organizationId?: number;
  @ManyToOne(() => OrganizationEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'organization_id',
  })
  organization?: OrganizationEntity;

  // @Check TimeStamp
  //use TimestampableEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
// application/Entity/Medicament.php
