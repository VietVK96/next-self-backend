import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="App\Repository\BankCheckRepository")
 * @ORM\Table(
 *  name="bank_check",
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="UNIQ_3624626632C8A3DE8BA2C646", columns={"organization_id", "internal_reference_id"})
 *  }
 * )
 * @ORM\AssociationOverrides({
 *  @ORM\AssociationOverride(name="organization", inversedBy="bankChecks")
 * })
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('bank_check')
export class BankCheckEntity {

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"bankCheck:index", "bankCheck:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="label", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"bankCheck:index", "bankCheck:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'label',
    type: 'varchar',
    length: 50,
  })
  name?: string;

  /**
   * @ORM\Column(name="fields", type="json", options={"default": "{}"})
   * @Serializer\Expose
   * @Serializer\Groups({"bankCheck:read"})
   * @Serializer\Type("array")
   * @Assert\Type("array")
   * @Assert\NotNull
   */
  @Column({
    name: 'fields',
    type: 'json',
  })
  fields?: string;

  /**
   * @ORM\Column(name="position", type="integer", options={"default": 0})
   * @Gedmo\SortablePosition
   * @Serializer\Expose
   * @Serializer\Groups({"bankCheck:index", "bankCheck:read"})
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   */
  @Column({
    name: 'position',
    type: 'tinyint',
    width: 3,
  })
  position?: number;

  /**
   * @ORM\Column(name="internal_reference_id", type="integer", nullable=true)
   */
  @Column({
    name: 'internal_reference_id',
    type: 'int',
    width: 11,
    nullable: true,
    default: null,
  })
  internalReferenceId?: number

}

// application\Entity\BankCheck.php
