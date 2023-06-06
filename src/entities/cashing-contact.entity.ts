import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_CASHING_CONTACT_CSC")
 */
@Entity('T_CASHING_CONTACT_CSC')
export class CashingContactEntity {
  /**
   * @ORM\Column(name="CSC_ID", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'CSC_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="CSC_AMOUNT", type="float")
   */
  @Column({
    name: 'CSC_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amount?: number = 0;

  /**
   * @ORM\Column(name="amount_care", type="decimal", precision=10, scale=2)
   * @var decimal Montant total des soins.
   */
  @Column({
    name: 'amount_care',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountCare?: number = 0;

  /**
   * @ORM\Column(name="amount_prosthesis", type="decimal", precision=10, scale=2)
   * @var decimal Montant total des prothèses.
   */
  @Column({
    name: 'amount_prosthesis',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountProsthesis?: number = 0;

  /** File: application\Entities\Cashing\Contact.php
   * @ORM\ManyToOne(targetEntity="\App\Entities\Cashing", inversedBy="cashingContacts")
   * @ORM\JoinColumn(name="CSG_ID", referencedColumnName="CSG_ID")
   */
  // @TODO EntityMissing
  //   protected $cashing;

  /** File: application\Entity\PaymentPayee.php
   * @ORM\ManyToOne(targetEntity="Payment", inversedBy="payees")
   * @ORM\JoinColumn(name="CSG_ID", referencedColumnName="CSG_ID")
   */
  // @TODO EntityMissing
  // protected $payment;

  /** File: application\Entities\Cashing\Contact.php
   * @ORM\ManyToOne(targetEntity="\App\Entities\Contact", inversedBy="cashingContacts")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   */
  // @TODO EntityMissing
  //   protected $contact;

  /** File: application\Entity\PaymentPayee.php
   * @ORM\ManyToOne(targetEntity="Patient")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   * @Serializer\Expose
   * @Serializer\MaxDepth(1)
   */
  // @TODO EntityMissing
  // protected $patient;
}
// application/Entities/Cashing/Contact.php
// application/Entity/PaymentPayee.php
