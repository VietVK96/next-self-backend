import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
/**
 * @ORM\Entity
 * @ORM\Table(name="contact_user_cou")
 */

@Entity('contact_user_cou')
export class ContactUserEntity {

  /**
   * @ORM\Column(name="cou_id", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @var integer $id Identifiant de l'enregistrement.
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'cou_id'
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Contact", inversedBy="contactUsers")
   * @ORM\JoinColumn(name="con_id", referencedColumnName="CON_ID")
   * @var \App\Entities\Contact $contact Entité représentant le patient.
   */
  // @TODO EntityMissing
  // protected $contact;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="usr_id", referencedColumnName="USR_ID")
   * @var \App\Entities\User $user Entité représentant le praticien.
   */
  // @TODO EntityMissing
  // protected $user;

  @Column({
    name: 'cou_unpaid_level',
    type: 'int',
    nullable: false,
    default: 0
  })
  unpaidLevel?: number;

  @Column({
    name: 'cou_unpaid_last_recovery',
    type: 'date',
    nullable: true,
  })
  unpaidLastRecovery?: string;

  /**
   * @ORM\Column(name="cou_amount_due", type="decimal", precision=10, scale=2)
   * @var float Montant dû.
   */
  @Column({
    name: 'cou_amount_due',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.00
  })
  amountDue?: number;

  /**
   * @ORM\Column(name="cou_amount_due", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'cou_amount_due',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.00
  })
  balance?: number;

  /**
   * @ORM\Column(name="amount_due_care", type="decimal", precision=10, scale=2)
   * @var float Montant dû des soins.
   */
  @Column({
    name: 'amount_due_care',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.00
  })
  amountDueCare?: number;

  /**
   * @ORM\Column(name="amount_due_care", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'amount_due_care',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.00
  })
  balanceCare?: number;

  /**
   * @ORM\Column(name="amount_due_prosthesis", type="decimal", precision=10, scale=2)
   * @var float Montant dû des prothèses.
   */
  @Column({
    name: 'amount_due_prosthesis',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.00
  })
  amountDueProsthesis?: number;

  /**
   * @ORM\Column(name="amount_due_prosthesis", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'amount_due_prosthesis',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.00
  })
  balanceProsthesis?: number;

  /**
   * @ORM\Column(name="cou_last_payment", type="date", nullable=true)
   * @var \DateTime|NULL $lastPayment Date de dernier paiement.
   */
  @Column({
    name: 'cou_last_payment',
    type: 'date',
    nullable: true
  })
  lastPayment?: string;

  /**
   * @ORM\Column(name="cou_last_care", type="date", nullable=true)
   * @var \DateTime|NULL $lastCare Date de dernier soin.
   */
  @Column({
    name: 'cou_last_care',
    type: 'date',
    nullable: true
  })
  lastCare?: string;

  /**
   * @ORM\Column(name="cou_force_update", type="integer")
   * @var boolean $forceUpdate Force la mise à jour des informations.
   */
  @Column({
    name: 'cou_force_update',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0
  })
  forceUpdate?: number;

}

//application/Entiteies/ContactUser.php