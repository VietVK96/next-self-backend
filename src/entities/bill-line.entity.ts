import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

//'operation','ligneBlanche','ligneSeparation'
export enum EnumBillLineType {
  OPERATION = 'operation',
  LIGNE_BLANCHE = 'ligneBlanche',
  LIGNE_SEPARATION = 'ligneSeparation',
}

/**
 * @ORM\Entity
 * @ORM\Table(name="T_BILL_LINE_BLN")
 */
@Entity('T_BILL_LINE_BLN')
export class BillLine {
  /**
   * @ORM\Column(name="BLN_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'BLN_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="BLN_POS", type="integer", nullable=false)
   */
  @Column({
    name: 'BLN_POS',
    type: 'int',
    length: 11,
  })
  pos?: number;

  /**
   * @ORM\Column(name="BLN_TYPE", type="string", nullable=false)
   */
  //'operation','ligneBlanche','ligneSeparation'
  @Column({
    name: 'BLN_TYPE',
    type: 'enum',
    enum: EnumBillLineType,
  })
  type?: EnumBillLineType;

  /**
   * @ORM\Column(name="BLN_DATE", type="date", nullable=true)
   */
  @Column({
    name: 'BLN_DATE',
    nullable: true,
    type: 'date',
  })
  date?: string;

  /**
   * @ORM\Column(name="BLN_MSG", type="text", nullable=true)
   */
  @Column({
    name: 'BLN_MSG',
    type: 'text',
    nullable: true,
  })
  msg?: string;

  /**
   * @ORM\Column(name="BLN_AMOUNT", type="float", nullable=true)
   */
  @Column({
    name: 'BLN_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  amount?: number;

  /**
   * @ORM\Column(name="BLN_TEETH", type="text", nullable=true)
   * @var string Liste des dents de la prestation.
   */
  @Column({
    name: 'BLN_TEETH',
    type: 'text',
    nullable: true,
  })
  teeth?: string;

  /**
   * @ORM\Column(name="BLN_COTATION", type="string", length=10, nullable=true)
   * @var string Cotation NGAP ou CCAM
   */
  @Column({
    name: 'BLN_COTATION',
    length: 7,
    nullable: true,
  })
  cotation?: string;

  /**
   * @ORM\Column(name="BLN_SECU_AMOUNT", type="float", nullable=true)
   * @var float Base de remboursement AMO.
   */
  @Column({
    name: 'BLN_SECU_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  secuAmount?: number;

  /**
   * @ORM\Column(name="BLN_MATERIALS", type="string", length=15)
   * @var string Liste des matériaux utilisés.
   */
  @Column({
    name: 'BLN_MATERIALS',
    length: 15,
    nullable: true,
  })
  materials?: string;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Bill", inversedBy="lines")
   * @ORM\JoinColumn(name="BIL_ID", referencedColumnName="BIL_ID")
   */
  // @TODO EntityMissing
  //protected $bill;
}
// application/Entities/Bill/Line.php
