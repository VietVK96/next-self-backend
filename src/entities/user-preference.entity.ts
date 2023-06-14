import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { UserEntity } from './user.entity';

// enum('day', 'week')
export enum UserPreferenceViewType {
  DAY = 'day',
  WEEK = 'week',
}

// enum('none', 'both', 'three')
export enum UserPreferenceQuotationDisplayOdontogramType {
  NONE = 'none',
  BOTH = 'both',
  THREE = 'three',
}

//enum('none', 'both', 'only')
export enum UserPreferenceQuotationDisplayDetailsType {
  NONE = 'none',
  BOTH = 'both',
  ONLY = 'only',
}

/**
 * @ORM\Entity
 * @ORM\Table(name="T_USER_PREFERENCE_USP")
 */
@Entity('T_USER_PREFERENCE_USP')
export class UserPreferenceEntity {
  /**
   * @ORM\Column(name="USP_LANGUAGE", type="string", length=3, nullable=false)
   */
  @Column({
    name: 'USP_LANGUAGE',
    type: 'varchar',
    length: 3,
    nullable: false,
    default: 'fr',
  })
  language?: string;

  /**
   * @ORM\Column(name="USP_COUNTRY", type="string", length=3, nullable=false)
   */
  @Column({
    name: 'USP_COUNTRY',
    type: 'varchar',
    length: 3,
    nullable: false,
    default: 'FR',
  })
  country?: string;

  /**
   * Code pays.
   *
   * @ORM\Column(name="USP_COUNTRY", type="string", length=3)
   * @Expose
   * @var string
   */
  @Column({
    name: 'USP_COUNTRY',
    type: 'varchar',
    length: 3,
    nullable: false,
    default: 'FR',
  })
  countryCode?: string;

  /**
   * @ORM\Column(name="USP_TIMEZONE", type="string", length=45, nullable=false)
   */
  @Column({
    name: 'USP_TIMEZONE',
    type: 'varchar',
    length: 45,
    nullable: false,
    default: 'Europe/Paris',
  })
  timezone?: string;

  /**
   * @ORM\Column(name="currency", type="string", length=3, options={"fixed": true, "default": "EUR"})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Currency
   * @Assert\NotBlank
   */
  @Column({
    name: 'currency',
    type: 'char',
    length: 3,
    nullable: false,
    default: 'EUR',
  })
  currency?: string;

  /**
   * @ORM\Column(name="USP_VIEW", type="string", nullable=false)
   */
  @Column({
    name: 'USP_VIEW',
    type: 'enum',
    enum: UserPreferenceViewType,
    default: UserPreferenceViewType.WEEK,
    nullable: false,
  })
  view?: UserPreferenceViewType;

  /**
   * @ORM\Column(name="USP_DAYS", type="integer", nullable=false)
   */
  @Column({
    name: 'USP_DAYS',
    type: 'tinyint',
    nullable: false,
    width: 4,
    default: 62,
  })
  days?: number;

  /**
   * @ORM\Column(name="USP_WEEK_START_DAY", type="integer", nullable=false)
   */
  @Column({
    name: 'USP_WEEK_START_DAY',
    type: 'tinyint',
    nullable: false,
    width: 4,
    default: 1,
  })
  weekStartDay?: number;

  /**
   * @ORM\Column(name="USP_DISPLAY_HOLIDAY", type="integer", nullable=false)
   */
  @Column({
    name: 'USP_DISPLAY_HOLIDAY',
    type: 'tinyint',
    nullable: false,
    width: 1,
    default: 0,
  })
  displayHoliday?: number;

  /**
   * @ORM\Column(name="USP_DISPLAY_EVENT_TIME", type="integer")
   */
  @Column({
    name: 'USP_DISPLAY_EVENT_TIME',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0,
  })
  displayEventTime?: number;

  /**
   * @ORM\Column(name="USP_DISPLAY_LAST_PATIENTS", type="integer")
   */
  @Column({
    name: 'USP_DISPLAY_LAST_PATIENTS',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 1,
  })
  displayLastPatients?: number;

  /**
   * @ORM\Column(name="USP_DISPLAY_PRACTITIONER_CALENDAR", type="integer")
   */
  @Column({
    name: 'USP_DISPLAY_PRACTITIONER_CALENDAR',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0,
  })
  displayPractitionerCalendar?: number;

  /**
   * @ORM\Column(name="USP_ENABLE_EVENT_PRACTITIONER_CHANGE", type="integer")
   * @var boolean Active la modification du praticien lors de la selection
   * d'un patient dans la saisie d'un rendez-vous
   */
  @Column({
    name: 'USP_ENABLE_EVENT_PRACTITIONER_CHANGE',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 1,
  })
  enableEventPractitionerChange?: number;

  /**
   * @ORM\Column(name="USP_FREQUENCY", type="integer", nullable=false)
   */
  @Column({
    name: 'USP_FREQUENCY',
    type: 'int',
    nullable: false,
    default: 30,
  })
  frequency?: number;

  /**
   * @ORM\Column(name="USP_HMD", type="string", length=5, nullable=false)
   */
  @Column({
    name: 'USP_HMD',
    type: 'varchar',
    length: 5,
    nullable: false,
    default: '08:00',
  })
  hmd?: string;

  /**
   * @ORM\Column(name="USP_HMF", type="string", length=5, nullable=false)
   */
  @Column({
    name: 'USP_HMF',
    type: 'varchar',
    length: 5,
    nullable: false,
    default: '12:00',
  })
  hmf?: string;

  /**
   * @ORM\Column(name="USP_HAD", type="string", length=5, nullable=false)
   */
  @Column({
    name: 'USP_HAD',
    type: 'varchar',
    length: 5,
    nullable: false,
    default: '14:00',
  })
  had?: string;

  /**
   * @ORM\Column(name="USP_HAF", type="string", length=5, nullable=false)
   */
  @Column({
    name: 'USP_HAF',
    type: 'varchar',
    length: 5,
    nullable: false,
    default: '20:00',
  })
  haf?: string;

  /**
   * @ORM\Column(name="USP_HEIGHT_LINE", type="integer", nullable=false)
   */
  @Column({
    name: 'USP_HEIGHT_LINE',
    type: 'int',
    nullable: false,
    default: 0,
  })
  heightLine?: number;

  /**
   * @ORM\Column(name="USP_QUOTATION_DISPLAY_ODONTOGRAM", type="string")
   * @var string
   */
  @Column({
    name: 'USP_QUOTATION_DISPLAY_ODONTOGRAM',
    type: 'enum',
    enum: UserPreferenceQuotationDisplayOdontogramType,
    nullable: false,
    default: UserPreferenceQuotationDisplayOdontogramType.NONE,
  })
  quotationDisplayOdontogram?: UserPreferenceQuotationDisplayOdontogramType;

  /**
   * @ORM\Column(name="USP_QUOTATION_DISPLAY_DETAILS", type="string")
   * @var string
   */
  @Column({
    name: 'USP_QUOTATION_DISPLAY_DETAILS',
    type: 'enum',
    enum: UserPreferenceQuotationDisplayDetailsType,
    nullable: false,
    default: UserPreferenceQuotationDisplayDetailsType.BOTH,
  })
  quotationDisplayDetails?: UserPreferenceQuotationDisplayDetailsType;

  /**
   * @ORM\Column(name="USP_QUOTATION_DISPLAY_TOOLTIP", type="integer")
   * @var boolean
   */
  @Column({
    name: 'USP_QUOTATION_DISPLAY_TOOLTIP',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 1,
  })
  quotationDisplayTooltip?: number;

  /**
   * @ORM\Column(name="USP_QUOTATION_DISPLAY_DUPLICATA", type="integer")
   * @var boolean
   */
  @Column({
    name: 'USP_QUOTATION_DISPLAY_DUPLICATA',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0,
  })
  quotationDisplayDuplicata?: number;

  /**
   * @ORM\Column(name="USP_QUOTATION_COLOR", type="string", nullable=true)
   * @var string
   */
  @Column({
    name: 'USP_QUOTATION_COLOR',
    type: 'varchar',
    nullable: true,
  })
  quotationColor?: string;

  /**
   * @ORM\Column(name="USP_BILL_DISPLAY_TOOLTIP", type="integer")
   * @var boolean
   */
  @Column({
    name: 'USP_BILL_DISPLAY_TOOLTIP',
    type: 'tinyint',
    nullable: false,
    default: 1,
  })
  billDisplayTooltip?: 1;

  /**
   * @ORM\Column(name="USP_BILL_TEMPLATE", type="integer")
   * @var integer Modèle de facture utilisé.
   */
  @Column({
    name: 'USP_BILL_TEMPLATE',
    type: 'tinyint',
    width: 4,
    nullable: false,
    default: 1,
  })
  billTemplate?: number;

  /**
   * @ORM\Column(name="USP_ORDER_DISPLAY_TOOLTIP", type="integer")
   * @var boolean
   */
  @Column({
    name: 'USP_ORDER_DISPLAY_TOOLTIP',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 1,
  })
  orderDisplayTooltip?: number;

  /**
   * @ORM\Column(name="USP_ORDER_DUPLICATA", type="integer")
   * @var boolean
   */
  @Column({
    name: 'USP_ORDER_DUPLICATA',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 1,
  })
  orderDuplicata?: number;

  /**
   * @ORM\Column(name="USP_ORDER_PREPRINTED_HEADER", type="integer")
   * @var boolean
   */
  @Column({
    name: 'USP_ORDER_PREPRINTED_HEADER',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0,
  })
  orderPreprintedHeader?: number;

  /**
   * @ORM\Column(name="USP_ORDER_PREPRINTED_HEADER_SIZE", type="integer")
   * @var integer
   */
  @Column({
    name: 'USP_ORDER_PREPRINTED_HEADER_SIZE',
    type: 'int',
    nullable: false,
    default: 35,
  })
  orderPreprintedHeaderSize?: number;

  /**
   * @ORM\Column(name="USP_ORDER_FORMAT", type="string", length=7)
   * @var string Format de l'ordonnance "A4", "A5" ou "widthxheight".
   */
  @Column({
    name: 'USP_ORDER_FORMAT',
    type: 'varchar',
    length: 7,
    nullable: false,
    default: 'A4',
  })
  orderFormat?: string;

  /**
   * @ORM\Column(name="USP_ORDER_BCB_CHECK", type="integer")
   * @var boolean Activation du contrôle depuis la Base Claude Bernard.
   */
  @Column({
    name: 'USP_ORDER_BCB_CHECK',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 1,
  })
  orderBcbCheck?: number;

  /**
   * @ORM\Column(name="USP_THEME_CUSTOM", type="integer")
   * @var integer
   */
  @Column({
    name: 'USP_THEME_CUSTOM',
    type: 'tinyint',
    width: 4,
    nullable: false,
    default: 0,
  })
  themeCustom?: number;

  /**
   * @ORM\Column(name="USP_THEME_COLOR", type="integer", nullable=true)
   * @var integer
   */
  @Column({
    name: 'USP_THEME_COLOR',
    type: 'int',
    nullable: true,
  })
  themeColor?: number;

  /**
   * @ORM\Column(name="USP_THEME_BGCOLOR", type="integer", nullable=true)
   * @var integer
   */
  @Column({
    name: 'USP_THEME_BGCOLOR',
    type: 'int',
    nullable: true,
  })
  themeBgcolor?: number;

  /**
   * @ORM\Column(name="USP_THEME_BORDERCOLOR", type="integer", nullable=true)
   * @var integer
   */
  @Column({
    name: 'USP_THEME_BORDERCOLOR',
    type: 'int',
    nullable: true,
  })
  themeBordercolor?: number;

  /**
   * @ORM\Column(name="USP_THEME_ASIDE_BGCOLOR", type="integer", nullable=true)
   * @var integer
   */
  @Column({
    name: 'USP_THEME_ASIDE_BGCOLOR',
    type: 'int',
    nullable: true,
  })
  themeAsideBgcolor?: number;

  /**
   * @ORM\Column(name="USP_REMINDER_VISIT_DURATION", type="integer")
   * @var integer Nombre de mois pour les rappels visites
   */
  @Column({
    name: 'USP_REMINDER_VISIT_DURATION',
    type: 'int',
    nullable: false,
    default: 6,
  })
  reminderVisitDuration?: number;

  /**
   * @ORM\Column(name="USP_CCAM_BRIDGE_QUICKENTRY", type="integer")
   * @var boolean Saisie rapide des bridges.
   */
  @Column({
    name: 'USP_CCAM_BRIDGE_QUICKENTRY',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0,
  })
  ccamBridgeQuickentry?: number;

  /**
   * @ORM\Column(name="ccam_price_list", type="integer")
   * @var integer Grille tarifaire utilisée en CCAM.
   */
  @Column({
    name: 'ccam_price_list',
    type: 'tinyint',
    width: 4,
    nullable: false,
    default: 13,
  })
  ccamPriceList?: number;

  /**
   * @ORM\Column(name="ccam_price_list", type="integer", options={"default": 13})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\Range(min=0, max=16)
   */
  @Column({
    name: 'ccam_price_list',
    type: 'tinyint',
    width: 4,
    nullable: false,
    default: 13,
  })
  priceGrid?: number;

  /**
   * Temps de prise en charge du patient.
   *
   * @ORM\Column(name="patient_care_time", type="time")
   * @var \DateTime
   */
  @Column({
    name: 'patient_care_time',
    type: 'time',
    nullable: false,
    default: '00:00:00',
  })
  patientCareTime?: string;

  /**
   * @ORM\Column(name="sesam_vitale_mode_desynchronise", type="boolean", options={"default": false})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'sesam_vitale_mode_desynchronise',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0,
  })
  sesamVitaleModeDesynchronise?: number;

  /**
   * @ORM\Column(name="calendar_border_colored", type="boolean", options={"default": true})
   */
  @Column({
    name: 'calendar_border_colored',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 1,
  })
  calendarBorderColored?: number;

  /**
   * @ORM\Column(name="signature_automatic", type="boolean", options={"default": false})
   */
  @Column({
    name: 'signature_automatic',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0,
  })
  signatureAutomatic?: number;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\User", inversedBy="preference")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="NONE")
   */
  // protected $user;

  @OneToOne(() => UserEntity, (e) => e.preference, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'USR_ID' })
  user?: UserEntity;
  /**
   * Entité de l'utilisateur.
   *
   * @ORM\OneToOne(targetEntity="UserEntity", inversedBy="setting")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="NONE")
   * @var \App\Entities\UserEntity
   */
  // @TODO EntityMissing
  // protected $user;
}

//application/Entities/User/Preference.php
