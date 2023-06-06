import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="App\Repository\CaresheetRejectionRepository")
 * @ORM\Table(name="caresheet_rejection")
 */
@Entity('caresheet_rejection')
export class CaresheetRejection {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="Caresheet", inversedBy="rejections")
   * @ORM\JoinColumn(name="caresheet_id", referencedColumnName="FSE_ID")
   * @Serializer\Exclude
   */
  // @TODO EntityMissing
  // protected $caresheet;

  /**
   * @ORM\Column(name="rejected_on", type="date")
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   * @Assert\NotBlank
   */
  @Column({
    name: 'rejected_on',
    type: 'date',
  })
  rejectedOn?: string;

  /**
   * @ORM\Column(name="error_code", type="string", length=255)
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'error_code',
    type: 'varchar',
    length: 255,
  })
  errorCode?: string;

  /**
   * @ORM\Column(name="error_text", type="string", length=255)
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'error_text',
    type: 'varchar',
    length: 255,
  })
  errorText?: string;

  /**
   * @ORM\Column(name="extra", type="json", nullable=true)
   * @Serializer\Exclude
   * @Assert\Type("array")
   * @Assert\NotBlank
   */
  @Column({
    name: 'extra',
    type: 'json',
    nullable: true,
    default: null,
  })
  extra?: string;
}

// application\Entity\CaresheetRejection.php
