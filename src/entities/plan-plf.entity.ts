import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BillEntity } from './bill.entity';
import { PlanEventEntity } from './plan-event.entity';
import { UserEntity } from './user.entity';
import { ContactEntity } from './contact.entity';
import { OrganizationEntity } from './organization.entity';
import { PaymentPlanEntity } from './payment-plan.entity';

export enum EnumPlanPlfType {
  PLAN = 'plan',
  QUOTATION = 'quotation',
  PLANNED = 'planned',
}

/**
 * @ORM\Entity
 * @ORM\Table(name="T_PLAN_PLF")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_PLAN_PLF')
export class PlanPlfEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="PLF_ID", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'PLF_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="PLF_NAME", type="string", nullable=true)
   */
  @Column({
    name: 'PLF_NAME',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  name?: string;

  /**
   * @ORM\Column(name="PLF_TYPE", type="string", nullable=false)
   */
  @Column({
    name: 'PLF_TYPE',
    type: 'enum',
    enum: EnumPlanPlfType,
    default: EnumPlanPlfType.PLAN,
  })
  type?: EnumPlanPlfType;

  /**
   * @ORM\Column(name="PLF_AMOUNT", type="float")
   * @var float Montant total du plan de traitement
   */
  @Column({
    name: 'PLF_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  amount?: number;

  /**
   * @ORM\Column(name="PLF_MUTUAL_CEILING", type="float")
   * @var float Plafond de la mutuelle
   */
  @Column({
    name: 'PLF_MUTUAL_CEILING',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  mutualCeiling?: number;

  /**
   * @ORM\Column(name="PLF_PERSON_REPAYMENT", type="float")
   * @var float Montant remboursé pour le patient
   */
  @Column({
    name: 'PLF_PERSON_REPAYMENT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  personRepayment?: number;

  /**
   * @ORM\Column(name="PLF_PERSON_AMOUNT", type="float")
   * @var float Montant à charge du patient
   */
  @Column({
    name: 'PLF_PERSON_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  personAmount?: number;

  /**
   * @ORM\Column(name="PLF_ACCEPTED_ON", type="datetime", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   */
  @Column({
    name: 'PLF_ACCEPTED_ON',
    type: 'datetime',
    nullable: true,
  })
  acceptedOn?: string;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\Bill")
   * @ORM\JoinColumn(name="BIL_ID", referencedColumnName="BIL_ID")
   */
  //   protected $bill;
  @Column({
    name: 'BIL_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  bilId?: number;

  @OneToOne(() => BillEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'BIL_ID',
  })
  bill?: BillEntity;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Plan\Event", mappedBy="plan")
   */
  //   protected $events;
  @OneToMany(() => PlanEventEntity, (e) => e.plan)
  events?: PlanEventEntity[];

  /**
   * @ORM\ManyToOne(targetEntity="User")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   */
  //   protected $user;
  @Column({
    name: 'user_id',
    type: 'int',
    width: 11,
  })
  userId?: number;

  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'user_id',
  })
  user?: UserEntity;

  /**
   * @ORM\ManyToOne(targetEntity="Patient")
   * @ORM\JoinColumn(name="patient_id", referencedColumnName="CON_ID")
   */
  //   protected $patient;
  @Column({
    name: 'patient_id',
    type: 'int',
    width: 11,
  })
  patientId?: number;

  @ManyToOne(() => ContactEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'patient_id',
  })
  patient?: ContactEntity;

  /**
   * @ORM\Column(name="sent_to_patient", type="boolean", options={"default": false})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("bool")
   */
  @Column({
    name: 'sent_to_patient',
    type: 'tinyint',
    width: 4,
    default: 0,
  })
  sentToPatient?: number;

  /**
   * @ORM\Column(name="sending_date_to_patient", type="date", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("DateTime<'Y-m-d'>")
   */
  @Column({
    name: 'sending_date_to_patient',
    type: 'date',
    nullable: true,
  })
  sendingDateToPatient?: string;

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

  //   @Column({
  //     name: 'payment_schedule_id',
  //   })
  //   paymentScheduleId?: number;
  @Column({
    name: 'payment_schedule_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  paymentScheduleId?: number;

  @ManyToOne(() => PaymentPlanEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'payment_schedule_id',
  })
  paymentSchedule?: PaymentPlanEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}
// application/Entities/Plan.php
// application/Entity/TreatmentPlan.php
