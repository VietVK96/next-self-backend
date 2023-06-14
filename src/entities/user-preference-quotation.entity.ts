import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

// enum('none', 'both', 'three')
export enum UserPreferenceQuotationDisplayOdontogramType {
  NONE = 'none',
  BOTH = 'both',
  THREEE = 'three',
}

// enum('none', 'both', 'only')
export enum UserPreferenceQuotationDisplayAnnexeType {
  NONE = 'none',
  BOTH = 'both',
  ONLY = 'only',
}

/**
 * @ORM\Entity
 * @ORM\Table(name="T_USER_PREFERENCE_QUOTATION_UPQ")
 */
@Entity('T_USER_PREFERENCE_QUOTATION_UPQ')
export class UserPreferenceQuotationEntity {
  /**
   * @ORM\Column(name="UPQ_ID", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @var integer Identifiant de l'enregistrement
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'UPQ_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="UPQ_COLOR", type="string", nullable=true)
   * @var string Couleur du devis
   */
  @Column({
    name: 'UPQ_COLOR',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  color?: string;

  /**
   * @ORM\Column(name="period_of_validity", type="integer", options={"default": 6})
   */
  @Column({
    name: 'period_of_validity',
    type: 'integer',
    nullable: false,
    default: 6,
  })
  periodOfValidity?: number;

  /**
   * @ORM\Column(name="UPQ_PLACE_OF_MANUFACTURE", type="integer")
   * @var integer Lieu du fabricant
   */
  @Column({
    name: 'UPQ_PLACE_OF_MANUFACTURE',
    type: 'integer',
    nullable: false,
    default: 1,
  })
  placeOfManufacture?: number;

  /**
   * @ORM\Column(name="UPQ_PLACE_OF_MANUFACTURE_LABEL", type="string", length=16, nullable=true)
   * @var string Libellé du lieu du fabricant
   */
  @Column({
    name: 'UPQ_PLACE_OF_MANUFACTURE_LABEL',
    type: 'varchar',
    length: 16,
    nullable: true,
  })
  placeOfManufactureLabel?: string;

  /**
   * @ORM\Column(name="UPQ_WITH_SUBCONTRACTING", type="integer")
   * @var boolean Avec / Sans sous-traitant
   */
  @Column({
    name: 'UPQ_WITH_SUBCONTRACTING',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 1,
  })
  withSubcontracting?: number;

  /**
   * @ORM\Column(name="UPQ_PLACE_OF_SUBCONTRACTING", type="integer", nullable=true)
   * @var integer Lieu du sous-traitant
   */
  @Column({
    name: 'UPQ_PLACE_OF_SUBCONTRACTING',
    type: 'integer',
    nullable: true,
  })
  placeOfSubcontracting?: number;

  /**
   * @ORM\Column(name="UPQ_PLACE_OF_SUBCONTRACTING_LABEL", type="string", length=16, nullable=true)
   * @var string Libellé du lieu du sous-traitant
   */
  @Column({
    name: 'UPQ_PLACE_OF_SUBCONTRACTING_LABEL',
    type: 'varchar',
    length: 16,
    nullable: true,
  })
  placeOfSubcontractingLabel?: string;

  /**
   * @ORM\Column(name="UPQ_DISPLAY_ODONTOGRAM", type="string")
   * @var boolean Affichage des schémas dentaires
   */
  @Column({
    name: 'UPQ_DISPLAY_ODONTOGRAM',
    type: 'enum',
    enum: UserPreferenceQuotationDisplayOdontogramType,
    default: UserPreferenceQuotationDisplayOdontogramType.NONE,
    nullable: false,
  })
  displayOdontogram?: UserPreferenceQuotationDisplayOdontogramType;

  /**
   * @ORM\Column(name="UPQ_DISPLAY_ANNEXE", type="string")
   * @var boolean Affichage de l'annexe
   */
  @Column({
    name: 'UPQ_DISPLAY_ANNEXE',
    type: 'enum',
    enum: UserPreferenceQuotationDisplayAnnexeType,
    default: UserPreferenceQuotationDisplayAnnexeType.BOTH,
    nullable: false,
  })
  displayAnnexe?: UserPreferenceQuotationDisplayAnnexeType;

  /**
   * @ORM\Column(name="UPQ_DISPLAY_NOTICE", type="integer")
   * @var boolean Affichage de la notice explicative
   */
  @Column({
    name: 'UPQ_DISPLAY_NOTICE',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 1,
  })
  displayNotice?: number;

  /**
   * @ORM\Column(name="UPQ_DISPLAY_TOOLTIP", type="integer")
   * @var boolean Affichage des bulles d'aides
   */
  @Column({
    name: 'UPQ_DISPLAY_TOOLTIP',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 1,
  })
  displayTooltip?: number;

  /**
   * @ORM\Column(name="UPQ_DISPLAY_DUPLICATA", type="integer")
   * @var boolean Affichage du duplicata
   */
  @Column({
    name: 'UPQ_DISPLAY_DUPLICATA',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 1,
  })
  displayDuplicata?: number;

  /**
   * @ORM\Column(type="boolean", options={"default": false})
   */
  @Column({
    name: 'treatment_timeline',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0,
  })
  treatmentTimeline?: number;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\User", inversedBy="userPreferenceQuotation")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   * @var \App\Entities\User Entité représentant l'utilisateur
   */
  // protected $user;

  @OneToOne(() => UserEntity, (e) => e.userPreferenceQuotation, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'USR_ID' })
  user?: UserEntity;
}

// application/Entities/User/Preference/Quotation.php
