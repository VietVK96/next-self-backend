import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { ContactEntity } from './contact.entity';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_CONTACT_NOTE_CNO")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_CONTACT_NOTE_CNO')
export class ContactNoteEntity {
  /**
   * @ORM\Column(name="CNO_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * * @Expose
   * @var integer
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'CNO_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="CNO_DATE", type="date", nullable=true)
   * * @Expose
   * @var \DateTime
   */
  @Column({
    name: 'CNO_DATE',
    type: 'date',
    nullable: true,
  })
  date?: string;

  /**
   * Couleur du commentaire.
   *
   * @ORM\Column(name="color", type="integer")
   * @var integer
   * * @Expose
   * @var \App\ValueObjects\Color
   */
  @Column({
    name: 'color',
    type: 'int',
    width: 11,
    default: -15,
  })
  color?: number;

  /**
   * @ORM\Column(name="CNO_MESSAGE", type="text", nullable=false)
   */
  @Column({
    name: 'CNO_MESSAGE',
    type: 'text',
  })
  message?: string;

  /**
   * Entité de l'utilisateur.
   *
   * @ORM\ManyToOne(targetEntity="UserEntity")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   * @var \App\Entities\UserEntity
   */
  //   protected $user;
  @Column({
    name: 'user_id',
    type: 'int',
    width: 11,
  })
  userId?: number;

  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'USR_ID',
  })
  user?: UserEntity;

  /**
   * @File: Entities/Contact/Note.php
   * @ORM\ManyToOne(targetEntity="\App\Entities\Contact", inversedBy="notes")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   * protected $contact;
   */
  @Column({
    name: 'CON_ID',
    type: 'int',
    width: 11,
  })
  conId?: number;

  @ManyToOne(() => ContactEntity, (e) => e.notes, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'CON_ID',
    referencedColumnName: 'CON_ID',
  })
  contact?: ContactEntity;

  /**
   * @File: Entity/PatientNode.php
   * @ORM\ManyToOne(targetEntity="Patient")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   * protected $patient;
   */
  /**
   * @File: Entities/PatientNoteEntity.php
    Entité du patient.
     * 
     * @ORM\ManyToOne(targetEntity="PatientEntity")
     * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
     * @var \App\Entities\PatientEntity
   */
  //   protected $patient;

  @Column({
    name: 'CON_ID',
    type: 'int',
    width: 11,
  })
  patientId?: number;

  @ManyToOne(() => ContactEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'CON_ID',
    referencedColumnName: 'CON_ID',
  })
  patient?: ContactEntity;

  // @Check TimeStamp
  // use TimestampableEntity;
  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

// application/Entities/PatientNoteEntity.php
// application\Entities\Contact\Note.php
// application\Entity\PatientNote.php
