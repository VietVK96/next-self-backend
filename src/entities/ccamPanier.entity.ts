import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="App\Repository\CcamPanierRepository")
 * @ORM\Table(
 *  name="ccam_panier",
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="UNIQ_D804EB2477153098", columns={"code"})
 *  }
 * )
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('ccam_panier')
export class CcamPanierEntity {
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
   * @ORM\Column(name="code", type="string", length=1, options={"fixed": true})
   * @Serializer\Expose
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(min=1, max=1)
   */
  @Column({
    name: 'code',
    type: 'char',
    length: 1,
  })
  code?: string;

  /**
   * @ORM\Column(name="label", type="string", length=255)
   * @Serializer\Expose
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'label',
    type: 'varchar',
    length: 255,
  })
  label?: string;

  /**
   * @ORM\Column(name="color", type="json")
   * @Serializer\Expose
   * @Assert\NotBlank
   * @AcmeAssert\Color
   */
  @Column({
    name: 'color',
    type: 'json',
  })
  color?: string;
}
// application\Entity\CcamPanier.php
