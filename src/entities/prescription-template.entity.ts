import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { MedicamentEntity } from './medicament.entity';

/**
 * @ORM\Entity(repositoryClass="App\Repository\PrescriptionTemplateRepository")
 * @ORM\Table(name="prescription_template")
 * @ORM\AssociationOverrides({
 *  @ORM\AssociationOverride(name="organization", inversedBy="prescriptionTemplates")
 * })
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('prescription_template')
export class PrescriptionTemplateEntity {
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
    referencedColumnName: 'GRP_ID',
  })
  organization: OrganizationEntity;
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"prescriptionTemplate:index", "prescriptionTemplate:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="name", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"prescriptionTemplate:index", "prescriptionTemplate:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'name',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name?: string;

  /**
   * @ORM\Column(name="position", type="integer", options={"default": 0})
   * @Gedmo\SortablePosition
   * @Serializer\Expose
   * @Serializer\Groups({"prescriptionTemplate:index", "prescriptionTemplate:read"})
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   */
  @Column({
    name: 'position',
    type: 'integer',
    width: 11,
    nullable: false,
    default: 0,
  })
  position?: number;

  /**
   * @ORM\Column(name="observation", type="text", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"prescriptionTemplate:read"})
   * @Assert\Type("string")
   */
  @Column({
    name: 'observation',
    type: 'text',
    nullable: true,
  })
  observation?: string;

  /**
   * @ORM\ManyToMany(targetEntity="Medicament")
   * @ORM\JoinTable(
   *  name="prescription_template_medicament",
   *  joinColumns={
   *      @ORM\JoinColumn(name="prescription_template_id", referencedColumnName="id")
   *  },
   *  inverseJoinColumns={
   *      @ORM\JoinColumn(name="medicament_id", referencedColumnName="MDP_ID")
   *  }
   * )
   * @Serializer\Expose
   * @Serializer\Groups({"medicament:read"})
   */
  // protected $medicaments;
  @ManyToMany(() => MedicamentEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinTable({
    name: 'prescription_template_medicament',
    joinColumn: {
      name: 'prescription_template_id',
    },
    inverseJoinColumn: {
      name: 'medicament_id',
    },
  })
  medicaments: MedicamentEntity[];
}

//application/Entity/PrescriptionTemplate.php
