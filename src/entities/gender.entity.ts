import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CorrespondentEntity } from './correspondent.entity';

export enum EnumGenderType {
  M = 'M',
  F = 'F',
}

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\Gender")
 * @ORM\Table(name="T_GENDER_GEN")
 */
@Entity('T_GENDER_GEN')
export class GenderEntity {
  /**
   * @ORM\Column(name="GEN_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'GEN_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="GEN_NAME", type="string", length=50, nullable=false)
   */
  @Column({
    name: 'GEN_NAME',
    type: 'varchar',
    length: 50,
  })
  name?: string;

  /**
   * @ORM\Column(name="long_name", type="string", length=45)
   * @var string Libellé long.
   */
  @Column({
    name: 'long_name',
    type: 'varchar',
    length: 45,
  })
  longName?: string;

  /**
   * @ORM\Column(name="GEN_TYPE", type="string", nullable=false)
   */
  @Column({
    name: 'GEN_TYPE',
    type: 'enum',
    enum: EnumGenderType,
    default: EnumGenderType.M,
  })
  type?: EnumGenderType;

  /**
     * @ORM\Column(name="code", type="integer", nullable=true)
     * @Serializer\Expose
     * @Serializer\Type("int")
     * @Assert\Type("int")
     */
  @Column({
    name: 'code',
    type: 'int',
    width: 11,
    nullable: true,
  })
  code?: number;

  @OneToMany(() => CorrespondentEntity, e => e.gender, {
    createForeignKeyConstraints: false
  })
  correspondents?: CorrespondentEntity[];
}

// application\Entities\CivilityTitle.php
// application\Entities\Gender.php
// application\Entity\CivilityTitle.php
