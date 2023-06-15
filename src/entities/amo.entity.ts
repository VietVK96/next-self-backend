import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="App\Repository\AmoRepository")
 * @ORM\Table(name="amo", uniqueConstraints={
 *  @ORM\UniqueConstraint(name="UNIQ_BB0A1126697C7E9B", columns={"code_national"})
 * }, indexes={
 *  @ORM\Index(name="INDEX_BB0A1126A4D60759", columns={"libelle"})
 * })
 * @ORM\HasLifecycleCallbacks
 * @UniqueEntity("code_national")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('amo')
export class AmoEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"amo:index", "amo:read"})
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="libelle", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"amo:index", "amo:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'libelle',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  libelle?: string;

  /**
   * @ORM\Column(name="code_national", type="string", length=9, options={"fixed": true})
   * @Serializer\Expose
   * @Serializer\Groups({"amo:index", "amo:read"})
   */
  @Column({
    name: 'code_national',
    type: 'char',
    length: 9,
    nullable: false,
  })
  codeNational?: string;

  /**
   * @ORM\Column(name="grand_regime", type="string", length=2, options={"fixed": true})
   * @Serializer\Expose
   * @Serializer\Groups({"amo:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(min=2, max=2)
   */
  @Column({
    name: 'grand_regime',
    type: 'char',
    length: 2,
    nullable: false,
  })
  grandRegime?: string;

  /**
   * @ORM\Column(name="caisse_gestionnaire", type="string", length=3, options={"fixed": true})
   * @Serializer\Expose
   * @Serializer\Groups({"amo:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(min=3, max=3)
   */
  @Column({
    name: 'caisse_gestionnaire',
    type: 'char',
    length: 3,
    nullable: false,
  })
  caisseGestionnaire?: string;

  /**
   * @ORM\Column(name="centre_gestionnaire", type="string", length=4, options={"fixed": true})
   * @Serializer\Expose
   * @Serializer\Groups({"amo:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(min=4, max=4)
   */
  @Column({
    name: 'centre_gestionnaire',
    type: 'char',
    length: 4,
    nullable: false,
  })
  centreGestionnaire?: string;

  /**
   * @ORM\Column(name="organisme_destinataire", type="string", length=3, options={"fixed": true})
   * @Serializer\Expose
   * @Serializer\Groups({"amo:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(min=3, max=3)
   */
  @Column({
    name: 'organisme_destinataire',
    type: 'char',
    length: 3,
    nullable: false,
  })
  organismeDestinataire?: string;

  /**
   * @ORM\Column(name="centre_informatique", type="string", length=3, options={"fixed": true})
   * @Serializer\Expose
   * @Serializer\Groups({"amo:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(min=3, max=3)
   */
  @Column({
    name: 'centre_informatique',
    type: 'char',
    length: 3,
    nullable: false,
  })
  centreInformatique?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

//application/Entity/Amo.php
