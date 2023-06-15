import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_REMINDER_TYPE_RMT")
 */
@Entity('T_REMINDER_TYPE_RMT')
export class ReminderTypeEntity {
  /**
   * @ORM\Column(name="RMT_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'RMT_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="RMT_NAME", type="string", length=45, nullable=false)
   */
  @Column({
    name: 'RMR_NAME',
    length: 45,
  })
  name?: string;
}

//application/Entities/Reminder/Type.php
