import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="App\Repository\AmcRepository")
 * @ORM\Table(name="amc", uniqueConstraints={
 *  @ORM\UniqueConstraint(name="UNIQ_B2BC5D0DF55AE19E", columns={"numero"})
 * }, indexes={
 *  @ORM\Index(name="INDEX_B2BC5D0DA4D60759", columns={"libelle"})
 * })
 * @UniqueEntity("numero")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('amc')
export class AmcEntity {

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"amc:index", "amc:read"})
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="libelle", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"amc:index", "amc:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'libelle',
    type: 'varchar',
    length: 255,
    nullable: false
  })
  libelle?: string;

  /**
   * @ORM\Column(name="numero", type="string", length=40)
   * @Serializer\Expose
   * @Serializer\Groups({"amc:index", "amc:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=40)
   */
  @Column({
    name: 'numero',
    type: 'varchar',
    length: 40,
    nullable: false
  })
  numero?: string;

  /**
   * @ORM\Column(name="is_gu", type="boolean", options={"default": true})
   * @Serializer\Expose
   * @Serializer\Groups({"amc:read"})
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'is_gu',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 1
  })
  isGu?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

}


//application/Entity/Amc.php