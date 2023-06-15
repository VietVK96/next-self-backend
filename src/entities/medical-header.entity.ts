import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

//enum('A4', 'A5', 'A5p', '180x210')
export enum EnumMedicalHeaderFormatType {
  A4 = 'A4',
  A5 = 'A5',
  A5P = 'A5p',
  SCREEN_180x210 = '180x210',
}

/**
 * @ORM\Entity
 * @ORM\Table(name="T_MEDICAL_HEADER_MDH")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_MEDICAL_HEADER_MDH')
export class MedicalHeaderEntity {
  /**
   * @ORM\Column(name="MDH_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'MDH_ID',
  })
  id?: number;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   * @var \App\Entities\User
   */
  @Column({
    name: 'user_id',
    type: 'int',
    width: 11,
  })
  userId?: number;

  @OneToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'user_id',
  })
  user?: UserEntity;

  /**
   * @ORM\Column(name="bill_message", type="text", nullable=true)
   * @var string Message facture.
   */
  @Column({
    name: 'bill_message',
    type: 'text',
    nullable: true,
  })
  billMessage?: string;

  /**
   * @ORM\Column(name="dental_quotation_message", type="text", nullable=true)
   * @var string Message devis.
   */
  @Column({
    name: 'dental_quotation_message',
    type: 'text',
    nullable: true,
  })
  dentalQuotationMessage?: string;

  /**
   * @ORM\Column(name="MDH_NAME", type="text", nullable=true)
   */
  @Column({
    name: 'MDH_NAME',
    type: 'text',
    nullable: true,
  })
  name?: string;

  /**
   * @ORM\Column(name="MDH_NAME_QUOT_HN", type="text", nullable=true)
   */
  @Column({
    name: 'MDH_NAME_QUOT_HN',
    type: 'text',
    nullable: true,
  })
  nameQuotHN?: string;

  /**
   * @ORM\Column(name="quotation_mutual_title", type="text", nullable=true)
   * @var string Titre du devis mutuelle
   */
  @Column({
    name: 'quotation_mutual_title',
    type: 'text',
    nullable: true,
  })
  quotationMutualTitle?: string;

  /**
   * @ORM\Column(name="MDH_MSG", type="text", nullable=true)
   */
  @Column({
    name: 'MDH_MSG',
    type: 'text',
    nullable: true,
  })
  msg?: string;

  /**
   * @ORM\Column(name="MDH_ADDRESS", type="text", nullable=true)
   */
  @Column({
    name: 'MDH_ADDRESS',
    type: 'text',
    nullable: true,
  })
  address?: string;

  /**
   * @ORM\Column(name="MDH_IDENT_PRAT", type="text", nullable=true)
   */
  @Column({
    name: 'MDH_IDENT_PRAT',
    type: 'text',
    nullable: true,
  })
  identPrat?: string;

  /**
   * @ORM\Column(name="MDH_IDENT_PRAT_QUOT", type="text", nullable=true)
   */
  @Column({
    name: 'MDH_IDENT_PRAT_QUOT',
    type: 'text',
    nullable: true,
  })
  identPratQuot?: string;

  /**
   * @ORM\Column(name="MDH_HEIGHT", type="integer", nullable=true)
   */
  @Column({
    name: 'MDH_HEIGHT',
    type: 'integer',
    nullable: true,
  })
  height?: number;

  /**
   * @ORM\Column(name="MDH_FORMAT", type="string", nullable=false)
   */
  @Column({
    name: 'MDH_FORMAT',
    type: 'enum',
    nullable: true,
    enum: EnumMedicalHeaderFormatType,
    default: EnumMedicalHeaderFormatType.A4,
  })
  format?: EnumMedicalHeaderFormatType;

  /**
   * @ORM\Column(name="MDH_ENABLE", type="integer", nullable=false)
   */
  @Column({
    name: 'MDH_ENABLE',
    type: 'tinyint',
    nullable: true,
    width: 1,
  })
  enable?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

// application/Entities/Medical/Header.php
