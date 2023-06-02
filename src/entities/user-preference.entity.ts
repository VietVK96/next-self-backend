import { Column, Entity } from "typeorm";

// enum('day', 'week')
export enum UserPreferenceViewType {
  DAY = 'day',
  WEEK = 'week'
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
    default: 'fr'
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
    default: 'FR'
  })
  country?: string;

  /**
   * @ORM\Column(name="USP_TIMEZONE", type="string", length=45, nullable=false)
   */
  @Column({
    name: 'USP_TIMEZONE',
    type: 'varchar',
    length: 45,
    nullable: false,
    default: 'Europe/Paris'
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
    default: 'EUR'
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
    nullable: false
  })
  view?: UserPreferenceViewType;

  /**
   * @ORM\Column(name="USP_DAYS", type="integer", nullable=false)
   */
  @Column({
    name: 'USP_DAYS',
    type: 'tinyint',
    nullable: false,
    length: 4,
    default: 62
  })
  days?: number;

  /**
   * @ORM\Column(name="USP_WEEK_START_DAY", type="integer", nullable=false)
   */
  @Column({
    name: 'USP_WEEK_START_DAY',
    type: 'tinyint',
    nullable: false,
    length: 4,
    default: 1
  })
  weekStartDay;

  /**
   * @ORM\Column(name="USP_DISPLAY_HOLIDAY", type="integer", nullable=false)
   */
  @Column({
    name: "USP_DISPLAY_HOLIDAY",
    type="integer", nullable=false)
  })
  displayHoliday;

  /**
   * @ORM\Column(name="USP_DISPLAY_EVENT_TIME", type="integer")
   */
  @Column({
    name: "USP_DISPLAY_EVENT_TIME",
    type="integer")
  })
  displayEventTime;

  /**
   * @ORM\Column(name="USP_DISPLAY_LAST_PATIENTS", type="integer")
   */
  @Column({
    name: "USP_DISPLAY_LAST_PATIENTS",
    type="integer")
  })
  displayLastPatients;

  /**
   * @ORM\Column(name="USP_DISPLAY_PRACTITIONER_CALENDAR", type="integer")
   */
  @Column({
    name: "USP_DISPLAY_PRACTITIONER_CALENDAR",
    type="integer")
  })
  displayPractitionerCalendar;

  /**
   * @ORM\Column(name="USP_ENABLE_EVENT_PRACTITIONER_CHANGE", type="integer")
   * @var boolean Active la modification du praticien lors de la selection
   * d'un patient dans la saisie d'un rendez-vous
   */
  @Column({
    @ORM\Column(name="USP_ENABLE_EVENT_PRACTITIONER_CHANGE", type="integer")
le: ventP
actitionerChange;

  /**
   * @ORM\Column(name="USP_FREQUENCY", type="integer", nullable=false)
   */
  @Column({
    name: "USP_FREQUENCY",
    type="integer", nullable=false)
  })
  frequency;

  /**
   * @ORM\Column(name="USP_HMD", type="string", length=5, nullable=false)
   */
  @Column({
    name: "USP_HMD",
    type="string", length=5, nullable=false)
  })
  hmd;

  /**
   * @ORM\Column(name="USP_HMF", type="string", length=5, nullable=false)
   */
  @Column({
    name: "USP_HMF",
    type="string", length=5, nullable=false)
  })
  hmf;

  /**
   * @ORM\Column(name="USP_HAD", type="string", length=5, nullable=false)
   */
  @Column({
    name: "USP_HAD",
    type="string", length=5, nullable=false)
  })
  had;

  /**
   * @ORM\Column(name="USP_HAF", type="string", length=5, nullable=false)
   */
  @Column({
    name: "USP_HAF",
    type="string", length=5, nullable=false)
  })
  haf;

  /**
   * @ORM\Column(name="USP_HEIGHT_LINE", type="integer", nullable=false)
   */
  @Column({
    name: "USP_HEIGHT_LINE",
    type="integer", nullable=false)
  })
  heightLine;

  /**
   * @ORM\Column(name="USP_QUOTATION_DISPLAY_ODONTOGRAM", type="string")
   * @var string 
   */
  @Column({
    @ORM\Column(name="USP_QUOTATION_DISPLAY_ODONTOGRAM", type="string")
ation: isplayO
ontogram;

  /**
   * @ORM\Column(name="USP_QUOTATION_DISPLAY_DETAILS", type="string")
   * @var string 
   */
  @Column({
    @ORM\Column(name="USP_QUOTATION_DISPLAY_DETAILS", type="string")
ation: isplayD
tails;

  /**
   * @ORM\Column(name="USP_QUOTATION_DISPLAY_TOOLTIP", type="integer")
   * @var boolean 
   */
  @Column({
    @ORM\Column(name="USP_QUOTATION_DISPLAY_TOOLTIP", type="integer")
ation: isplayT
oltip;

  /**
   * @ORM\Column(name="USP_QUOTATION_DISPLAY_DUPLICATA", type="integer")
   * @var boolean 
   */
  @Column({
    @ORM\Column(name="USP_QUOTATION_DISPLAY_DUPLICATA", type="integer")
ation: isplayD
plicata;

  /**
   * @ORM\Column(name="USP_QUOTATION_COLOR", type="string", nullable=true)
   * @var string 
   */
  @Column({
    @ORM\Column(name="USP_QUOTATION_COLOR", type="string", nullable=true)
ation: olor;

  /**
   * @ORM\Column(name="USP_BILL_DISPLAY_TOOLTIP", type="integer")
   * @var boolean
   */
  @Column({
    @ORM\Column(name="USP_BILL_DISPLAY_TOOLTIP", type="integer")
Display: ooltip;

  /**
   * @ORM\Column(name="USP_BILL_TEMPLATE", type="integer")
   * @var integer Modèle de facture utilisé.
   */
  @Column({
    @ORM\Column(name="USP_BILL_TEMPLATE", type="integer")
Template: 

  /**
   * @ORM\Column(name="USP_ORDER_DISPLAY_TOOLTIP", type="integer")
   * @var boolean
   */
  @Column({
    @ORM\Column(name="USP_ORDER_DISPLAY_TOOLTIP", type="integer")
r: isplayTooltip;

  /**
   * @ORM\Column(name="USP_ORDER_DUPLICATA", type="integer")
   * @var boolean
   */
  @Column({
    @ORM\Column(name="USP_ORDER_DUPLICATA", type="integer")
r: uplicata;

  /**
   * @ORM\Column(name="USP_ORDER_PREPRINTED_HEADER", type="integer")
   * @var boolean
   */
  @Column({
    @ORM\Column(name="USP_ORDER_PREPRINTED_HEADER", type="integer")
r: reprintedH
ader;

  /**
   * @ORM\Column(name="USP_ORDER_PREPRINTED_HEADER_SIZE", type="integer")
   * @var integer
   */
  @Column({
    @ORM\Column(name="USP_ORDER_PREPRINTED_HEADER_SIZE", type="integer")
r: reprintedH
aderSize;

  /**
   * @ORM\Column(name="USP_ORDER_FORMAT", type="string", length=7)
   * @var string Format de l'ordonnance "A4", "A5" ou "widthxheight".
   */
  @Column({
    @ORM\Column(name="USP_ORDER_FORMAT", type="string", length=7)
r: ormat;

  /**
   * @ORM\Column(name="USP_ORDER_BCB_CHECK", type="integer")
   * @var boolean Activation du contrôle depuis la Base Claude Bernard.
   */
  @Column({
    @ORM\Column(name="USP_ORDER_BCB_CHECK", type="integer")
r: cbC
eck;

  /**
   * @ORM\Column(name="USP_THEME_CUSTOM", type="integer")
   * @var integer
   */
  @Column({
    @ORM\Column(name="USP_THEME_CUSTOM", type="integer")
e: ustom;

  /**
   * @ORM\Column(name="USP_THEME_COLOR", type="integer", nullable=true)
   * @var integer
   */
  @Column({
    @ORM\Column(name="USP_THEME_COLOR", type="integer", nullable=true)
e: olor;

  /**
   * @ORM\Column(name="USP_THEME_BGCOLOR", type="integer", nullable=true)
   * @var integer
   */
  @Column({
    @ORM\Column(name="USP_THEME_BGCOLOR", type="integer", nullable=true)
e: gcolor;

  /**
   * @ORM\Column(name="USP_THEME_BORDERCOLOR", type="integer", nullable=true)
   * @var integer
   */
  @Column({
    @ORM\Column(name="USP_THEME_BORDERCOLOR", type="integer", nullable=true)
e: ordercolor;

  /**
   * @ORM\Column(name="USP_THEME_ASIDE_BGCOLOR", type="integer", nullable=true)
   * @var integer
   */
  @Column({
    @ORM\Column(name="USP_THEME_ASIDE_BGCOLOR", type="integer", nullable=true)
e: sideB
color;

  /**
   * @ORM\Column(name="USP_REMINDER_VISIT_DURATION", type="integer")
   * @var integer Nombre de mois pour les rappels visites
   */
  @Column({
    @ORM\Column(name="USP_REMINDER_VISIT_DURATION", type="integer")
nder: isitD
ration;

  /**
   * @ORM\Column(name="USP_CCAM_BRIDGE_QUICKENTRY", type="integer")
   * @var boolean Saisie rapide des bridges.
   */
  @Column({
    @ORM\Column(name="USP_CCAM_BRIDGE_QUICKENTRY", type="integer")
Bridge: uickentry;

  /**
   * @ORM\Column(name="ccam_price_list", type="integer")
   * @var integer Grille tarifaire utilisée en CCAM.
   */
  @Column({
    @ORM\Column(name="ccam_price_list", type="integer")
Price: ist;

  /**
   * Temps de prise en charge du patient.
   * 
   * @ORM\Column(name="patient_care_time", type="time")
   * @var \DateTime
   */
  @Column({
    @ORM\Column(name="patient_care_time", type="time")
ent: areT
me;

  /**
   * @ORM\Column(name="calendar_border_colored", type="boolean", options={"default": true})
   */
  @Column({
    name: "calendar_border_colored",
    type="boolean", options={"default": true})
  })
  calendarBorderColored = true;

  /**
   * @ORM\Column(name="signature_automatic", type="boolean", options={"default": false})
   */
  @Column({
    name: "signature_automatic",
    type="boolean", options={"default": false})
  })
  signatureAutomatic = false;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\User", inversedBy="preference")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="NONE")
   */
  user;
}


//application/Entities/User/Preference.php