import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CorrespondentEntity } from './correspondent.entity';
import { OrganizationEntity } from './organization.entity';
import { GenderEntity } from './gender.entity';
import { AddressEntity } from './address.entity';
import { UploadEntity } from './upload.entity';
import { ContactFamilyEntity } from './contact-family.entity';
import { ContactNoteEntity } from './contact-note.entity';
import { EventEntity } from './event.entity';
import { DentalQuotationEntity } from './dental-quotation.entity';
import { BillEntity } from './bill.entity';
import { CashingEntity } from './cashing.entity';
import { MedicalOrderEntity } from './medical-order.entity';
import { CashingContactEntity } from './cashing-contact.entity';
import { UserEntity } from './user.entity';
import { ContactUserEntity } from './contact-user.entity';
import { PhoneEntity } from './phone.entity';

export enum EnumContactReminderVisitType {
  NONE = 'none',
  DURATION = 'duration',
  DATE = 'date',
}

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\Contact")
 * @ORM\Table(name="T_CONTACT_CON")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_CONTACT_CON')
export class ContactEntity {
  /**
   * @ORM\Column(name="CON_ID", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */

  @PrimaryGeneratedColumn('increment', {
    name: 'GRP_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="CON_NBR", type="integer", nullable=true)
   */
  @Column({
    name: 'CON_NBR',
    type: 'int',
    nullable: true,
  })
  nbr?: number;

  /**
   * @ORM\Column(name="CON_LASTNAME", type="string", length=50, nullable=false)
   */
  @Column({
    name: 'CON_LASTNAME',
    type: 'varchar',
    length: 50,
  })
  lastname?: string;

  /**
   * @ORM\Column(name="last_name_phonetic", type="string", length=10, nullable=true)
   */
  @Column({
    name: 'last_name_phonetic',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  lastNamePhonetic?: string;

  /**
   * @ORM\Column(name="CON_FIRSTNAME", type="string", length=50, nullable=false)
   */
  @Column({
    name: 'CON_FIRSTNAME',
    type: 'varchar',
    length: 50,
  })
  firstname?: string;

  /**
   * @ORM\Column(name="first_name_phonetic", type="string", length=10, nullable=true)
   */
  @Column({
    name: 'first_name_phonetic',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  firstNamePhonetic?: string;

  /**
   * @ORM\Column(name="CON_PROFESSION", type="string", length=255, nullable=true)
   */
  @Column({
    name: 'CON_PROFESSION',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  profession?: string;

  /**
   * @ORM\Column(name="CON_MAIL", type="string", length=50, nullable=true)
   */
  @Column({
    name: 'CON_MAIL',
    type: 'varchar',
    nullable: true,
    length: 50,
  })
  email?: string;

  /**
   * @ORM\Column(name="CON_BIRTHDAY", type="date", nullable=false)
   */
  @Column({
    name: 'CON_BIRTHDAY',
    type: 'date',
    nullable: true,
  })
  birthday?: string;

  /**
   * @ORM\Column(name="CON_BIRTH_ORDER", type="integer")
   */
  @Column({
    name: 'CON_BIRTH_ORDER',
    type: 'int',
    default: 1,
  })
  birthOrder?: number;

  /**
   * @ORM\Column(name="CON_QUALITY", type="integer")
   */
  @Column({
    name: 'CON_QUALITY',
    type: 'int',
    nullable: true,
  })
  quality?: number;

  /**
   * @ORM\Column(name="CON_BREASTFEEDING", type="integer")
   * @var integer 0 : pas d’allaitement déclaré 1 : allaitement en cours
   */
  @Column({
    name: 'CON_BREASTFEEDING',
    type: 'int',
    default: 0,
  })
  breastfeeding?: number;

  /**
   * @ORM\Column(name="CON_PREGNANCY", type="integer")
   * @var integer Grossesse déclarée si valeur >0. Cette valeur est précisée en mois.
   * Si grosesse=0 : pas de grossesse déclarée.
   */
  @Column({
    name: 'CON_PREGNANCY',
    type: 'int',
    default: 0,
  })
  pregnancy?: number;

  /**
   * @ORM\Column(name="CON_CLEARANCE_CREATININE", type="integer")
   * @var integer Clairance créatinine exprimée en ml/min (0=non utilisé).
   */
  @Column({
    name: 'CON_CLEARANCE_CREATININE',
    type: 'int',
    default: 0,
  })
  clearanceCreatinine?: number;

  /**
   * @ORM\Column(name="CON_HEPATIC_INSUFFICIENCY", type="string", length=1)
   * @var string Valeur possible : chaîne vide, A, B ou C.
   */
  @Column({
    name: 'CON_HEPATIC_INSUFFICIENCY',
    type: 'varchar',
    length: 1,
  })
  hepaticInsufficiency?: string;

  /**
   * @ORM\Column(name="CON_WEIGHT", type="integer")
   * @var integer Poids du patient en kg.
   */
  @Column({
    name: 'CON_WEIGHT',
    type: 'int',
    default: 0,
  })
  weight?: number;

  /**
   * @ORM\Column(name="CON_SIZE", type="integer")
   * @var integer Taille du patient en cm.
   */
  @Column({
    name: 'CON_SIZE',
    type: 'int',
    default: 0,
  })
  size?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Correspondent")
   * @ORM\JoinColumn(name="CON_MEDECIN_TRAITANT", referencedColumnName="CPD_ID")
   * @var integer Entité représentant le médecin traitant.
   */
  // protected $medecinTraitant;

  @Column({
    name: 'CON_MEDECIN_TRAITANT',
    type: 'int',
    width: 11,
    nullable: true,
  })
  medecinTraitantId?: number;

  @ManyToOne(() => CorrespondentEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'CON_MEDECIN_TRAITANT',
    referencedColumnName: 'CPD_ID',
  })
  medecinTraitant?: CorrespondentEntity;

  /**
   * @ORM\Column(name="CON_MSG", type="text", nullable=false)
   */
  @Column({
    name: 'CON_MSG',
    type: 'text',
  })
  msg?: string;

  /**
   * @ORM\Column(name="CON_NOTIFICATION_MSG", type="text", nullable=true)
   */
  @Column({
    name: 'CON_NOTIFICATION_MSG',
    type: 'text',
    nullable: true,
  })
  notificationMsg?: string;

  /**
   * @ORM\Column(name="CON_NOTIFICATION_ENABLE", type="integer")
   */
  @Column({
    name: 'CON_NOTIFICATION_ENABLE',
    type: 'tinyint',
    width: 1,
    default: 1,
  })
  notificationEnable?: number;

  /**
   * @ORM\Column(name="CON_NOTIFICATION_EVERY_TIME", type="integer")
   * @var boolean Message de rappel doit être affiché à chaque fois
   */
  @Column({
    name: 'CON_NOTIFICATION_EVERY_TIME',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  notificationEveryTime?: number;

  /**
   * @ORM\Column(name="CON_COLOR", type="integer")
   */
  @Column({
    name: 'CON_COLOR',
    type: 'int',
    width: 11,
    default: -3840,
  })
  color?: number;

  /**
   * @ORM\Column(name="CON_COLOR_MEDICAL", type="integer")
   * @var integer Couleur médicale du patient au format 4D.
   */
  @Column({
    name: 'CON_COLOR_MEDICAL',
    type: 'int',
    width: 11,
    default: -3840,
  })
  colorMedical?: number;

  /**
   * @ORM\Column(name="CON_INSEE", type="string", length=13, nullable=true)
   * @var string Numéro de sécurité sociale, sur 13 caractères.
   */
  @Column({
    name: 'CON_INSEE',
    type: 'varchar',
    length: 13,
    nullable: true,
  })
  insee?: string;

  /**
   * @ORM\Column(name="CON_INSEE_KEY", type="string", length=2, nullable=true)
   * @var string Clé du numéro de sécurité sociale, sur 2 caractères.
   */
  @Column({
    name: 'CON_INSEE_KEY',
    type: 'varchar',
    length: 2,
    nullable: true,
  })
  inseeKey?: string;

  /**
   * @ORM\Column(name="social_security_reimbursement_rate", type="decimal", precision=10, scale=2, nullable=true)
   */
  @Column({
    name: 'social_security_reimbursement_rate',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  socialSecurityReimbursementRate?: number;

  /**
   * @ORM\Column(name="CON_MUTUAL_REPAYMENT_TYPE", type="integer")
   * @var integer Formule de remboursement de la mutuelle.
   */
  @Column({
    name: 'CON_MUTUAL_REPAYMENT_TYPE',
    type: 'int',
    width: 11,
  })
  mutualRepaymentType?: number;

  /**
   * @ORM\Column(name="CON_MUTUAL_REPAYMENT_RATE", type="float")
   * @var float Taux de remboursement de la mutuelle.
   */
  @Column({
    name: 'CON_MUTUAL_REPAYMENT_RATE',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  mutualRepaymentRate?: number;

  /**
   * @ORM\Column(name="CON_MUTUAL_COMPLEMENT", type="float")
   * @var float Montant complémentaire remboursé par la mutuelle.
   */
  @Column({
    name: 'CON_MUTUAL_COMPLEMENT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  mutualComplement?: number;

  /**
   * @ORM\Column(name="CON_MUTUAL_CEILING", type="float")
   * @var float Plafond de remboursement de la mutuelle.
   */
  @Column({
    name: 'CON_MUTUAL_CEILING',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    default: 0,
  })
  mutualCeiling?: number;

  /**
   * @ORM\Column(name="CON_AGENESIE", type="integer")
   * @var boolean Si Soumis à condition Agénésie.
   */
  @Column({
    name: 'CON_AGENESIE',
    type: 'tinyint',
    default: 0,
    width: 1,
  })
  agenesie?: number;

  /**
   * @ORM\Column(name="CON_MALADIE_RARE", type="integer")
   * @var boolean Si Soumis à condition Maladie Rare.
   */
  @Column({
    name: 'CON_MALADIE_RARE',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  maladieRare?: number;

  /**
   * @ORM\Column(name="CON_RX_SIDEXIS_LOADED", type="integer")
   * @var boolean Si le patient a déjà été chargé dans le logiciel de radio Sidexis.
   */
  @Column({
    name: 'CON_MALADIE_RARE',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  rxSidexisLoaded?: number;

  /**
   * @ORM\Column(name="CON_REMINDER_VISIT_TYPE", type="string")
   * @var string Activation des rappels visites
   */
  @Column({
    name: 'CON_REMINDER_VISIT_TYPE',
    type: 'enum',
    enum: EnumContactReminderVisitType,
    default: EnumContactReminderVisitType.DURATION,
  })
  reminderVisitType?: EnumContactReminderVisitType;

  /**
   * @ORM\Column(name="CON_REMINDER_VISIT_DURATION", type="integer", nullable=true)
   * @var integer Nombre de mois pour les rappels visites
   */
  @Column({
    name: 'CON_REMINDER_VISIT_DURATION',
    type: 'int',
    width: 11,
    nullable: true,
  })
  reminderVisitDuration?: number;

  /**
   * @ORM\Column(name="CON_REMINDER_VISIT_DATE", type="date", nullable=true)
   * @var \DateTime Date du prochain rappel
   */
  @Column({
    name: 'CON_REMINDER_VISIT_DATE',
    type: 'date',
    nullable: true,
  })
  reminderVisitDate?: string;

  /**
   * @ORM\Column(name="CON_REMINDER_VISIT_LAST_DATE", type="date", nullable=true)
   * @var \DateTime Date du dernier rappel
   */
  @Column({
    name: 'CON_REMINDER_VISIT_LAST_DATE',
    type: 'date',
    nullable: true,
  })
  reminderVisitLastDate?: string;

  /**
   * @ORM\Column(name="CON_DELETE", type="integer", nullable=false)
   */
  @Column({
    name: 'CON_DELETE',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  delete?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Group", inversedBy="contacts")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  // protected $group;

  @Column({
    name: 'organization_id',
    type: 'int',
    width: 11,
  })
  organizationId?: number;

  @ManyToOne(() => OrganizationEntity, (e) => e.contacts, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'organization_id',
    referencedColumnName: 'GRP_ID',
  })
  group?: OrganizationEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Gender")
   * @ORM\JoinColumn(name="GEN_ID", referencedColumnName="GEN_ID")
   */
  // protected $gender;
  @Column({
    name: 'GEN_ID',
    type: 'int',
    width: 11,
  })
  genId?: number;

  @ManyToOne(() => GenderEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'GEN_ID',
    referencedColumnName: 'GEN_ID',
  })
  gender?: GenderEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Address")
   * @ORM\JoinColumn(name="ADR_ID", referencedColumnName="ADR_ID")
   */
  // protected $address;

  @Column({
    name: 'ADR_ID',
    type: 'int',
    width: 11,
  })
  adrId?: number;

  @ManyToOne(() => AddressEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'ADR_ID',
    referencedColumnName: 'ADR_ID',
  })
  address?: AddressEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Upload")
   * @ORM\JoinColumn(name="UPL_ID", referencedColumnName="UPL_ID")
   */
  // protected $upload;
  @Column({
    name: 'UPL_ID',
    type: 'int',
    width: 11,
  })
  uplId?: number;

  @ManyToOne(() => UploadEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'UPL_ID',
    referencedColumnName: 'UPL_ID',
  })
  upload?: UploadEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Correspondent")
   * @ORM\JoinColumn(name="CPD_ID", referencedColumnName="CPD_ID")
   */
  // protected $correspondent;
  @Column({
    name: 'CPD_ID',
    type: 'int',
    width: 11,
  })
  cpdId?: number;

  @ManyToOne(() => CorrespondentEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'CPD_ID',
    referencedColumnName: 'CPD_ID',
  })
  correspondent?: CorrespondentEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Contact\Family", inversedBy="contacts")
   * @ORM\JoinColumn(name="COF_ID", referencedColumnName="COF_ID")
   */
  // protected $family;
  @Column({
    name: 'COF_ID',
    type: 'int',
    width: 11,
  })
  cofId?: number;

  @ManyToOne(() => ContactFamilyEntity, (e) => e.contacts, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'COF_ID',
    referencedColumnName: 'COF_ID',
  })
  family?: ContactFamilyEntity;

  /**
   * @ORM\ManyToMany(targetEntity="\App\Entities\Phone")
   * @ORM\JoinTable(
   * 		name="T_CONTACT_PHONE_COP",
   * 		joinColumns={@ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")},
   * 		inverseJoinColumns={@ORM\JoinColumn(name="PHO_ID", referencedColumnName="PHO_ID")}
   * )
   */
  // protected $phones;
  @ManyToMany(() => PhoneEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinTable({
    name: 'T_CONTACT_PHONE_COP',
    joinColumn: {
      name: 'CON_ID',
    },
    inverseJoinColumn: {
      name: 'PHO_ID',
    },
  })
  phones?: PhoneEntity[];

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Contact\Note", mappedBy="contact")
   * @ORM\OrderBy({"date" = "ASC"})
   */
  // protected $notes;
  @OneToMany(() => ContactNoteEntity, (e) => e.contact, {
    createForeignKeyConstraints: false,
  })
  notes?: ContactNoteEntity[];

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Event", mappedBy="contact")
   * @ORM\OrderBy({"start" = "ASC", "end" = "DESC"})
   */
  // protected $events;
  @OneToMany(() => EventEntity, (e) => e.contact, {
    createForeignKeyConstraints: false,
  })
  events?: EventEntity[];

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Dental\Quotation", mappedBy="contact")
   * @ORM\OrderBy({"date" = "ASC"})
   */
  // protected $quotations;
  @OneToMany(() => DentalQuotationEntity, (e) => e.contact, {
    createForeignKeyConstraints: false,
  })
  quotations?: DentalQuotationEntity[];

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Bill", mappedBy="contact")
   * @ORM\OrderBy({"date" = "ASC"})
   */
  // protected $bills;
  @OneToMany(() => BillEntity, (e) => e.contact, {
    createForeignKeyConstraints: false,
  })
  bills?: BillEntity[];
  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Cashing", mappedBy="contact")
   * @ORM\OrderBy({"date" = "ASC"})
   */

  // protected $cashings;
  @OneToMany(() => CashingEntity, (e) => e.contact, {
    createForeignKeyConstraints: false,
  })
  cashings?: CashingEntity[];

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Medical\Order", mappedBy="contact")
   * @ORM\OrderBy({"date" = "ASC"})
   */
  // protected $orders;
  @OneToMany(() => MedicalOrderEntity, (e) => e.contact, {
    createForeignKeyConstraints: false,
  })
  orders?: MedicalOrderEntity[];

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Cashing\Contact", mappedBy="contact")
   */
  // protected $cashingContacts;
  @OneToMany(() => CashingContactEntity, (e) => e.contact, {
    createForeignKeyConstraints: false,
  })
  cashingContacts?: CashingContactEntity[];

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   */
  // protected $user;
  @Column({
    name: 'USR_ID',
    type: 'int',
    width: 11,
  })
  ursId?: number;

  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'USR_ID',
    referencedColumnName: 'USR_ID',
  })
  user?: UserEntity;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\ContactUser", mappedBy="contact")
   * @var \Doctrine\Common\Collections\ArrayCollection
   */
  // protected $contactUsers;
  @OneToMany(() => ContactUserEntity, (e) => e.contact, {
    createForeignKeyConstraints: false,
  })
  contactUsers?: ContactUserEntity[];
  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
