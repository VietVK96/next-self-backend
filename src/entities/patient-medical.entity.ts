import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ContactEntity } from './contact.entity';
import { PolicyHolderEntity } from './policy-holder.entity';
import { TariffTypeEntity } from './tariff-type.entity';

/**
 * @ORM\Entity
 * @ORM\Table(name="patient_medical")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('patient_medical')
export class PatientMedicalEntity {
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
   * @ORM\OneToOne(targetEntity="Patient", inversedBy="medical")
   * @ORM\JoinColumn(name="patient_id", referencedColumnName="CON_ID")
   */
  // protected $patient;

  @Column({
    name: 'patient_id',
    type: 'int',
    width: 11,
  })
  patientId?: number;
  @OneToOne(() => ContactEntity, (e) => e.medical, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'patient_id' })
  patient?: ContactEntity;

  /**
   * @ORM\OneToOne(targetEntity="PolicyHolder", cascade={"persist", "remove"})
   * @ORM\JoinColumn(name="policy_holder_id", referencedColumnName="id", nullable=true)
   * @Serializer\Expose
   */
  // policyHolder = null;

  @Column({
    name: 'policy_holder_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  policyHolderId?: number;
  @OneToOne(() => PolicyHolderEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'policy_holder_id' })
  policyHolder?: PolicyHolderEntity;

  /**
   * @ORM\OneToOne(targetEntity="TariffType")
   * @ORM\JoinColumn(name="tariff_type_id", referencedColumnName="id", nullable=true)
   * @Serializer\Expose
   */
  // tariffType = null;

  @Column({
    name: 'tariff_type_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  tariffTypeId?: number;
  @OneToOne(() => TariffTypeEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'tariff_type_id' })
  tariffType?: TariffTypeEntity;

  /**
   * @ORM\Column(name="service_amo_code", type="string", length=2, nullable=true, options={"fixed": true})
   * @Serializer\Expose
   * @Assert\Type("string")
   * @Assert\Length(min=2, max=2)
   */
  @Column({
    name: 'service_amo_code',
    type: 'char',
    length: 2,
    nullable: true,
  })
  serviceAmoCode?: string;

  /**
   * @ORM\Column(name="service_amo_start_date", type="date", nullable=true)
   * @Serializer\Expose
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   */
  @Column({
    name: 'service_amo_start_date',
    type: 'date',
    nullable: true,
  })
  serviceAmoStartDate?: string;

  /**
   * @ORM\Column(name="service_amo_end_date", type="date", nullable=true)
   * @Serializer\Expose
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   * @Assert\GreaterThan(propertyPath="serviceAmoStartDate")
   */
  @Column({
    name: 'service_amo_end_date',
    type: 'date',
    nullable: true,
  })
  serviceAmoEndDate?: string;
}

//application/Entity/PatientMedical.php
