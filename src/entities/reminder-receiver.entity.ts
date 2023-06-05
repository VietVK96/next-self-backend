import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_REMINDER_RECEIVER_RMR")
 */
@Entity('T_REMINDER_RECEIVER_RMR')
export class ReminderReceiverEntity {
  /**
   * @ORM\Column(name="RMR_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'RMR_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="RMR_NAME", type="string", length=45, nullable=false)
   */
  @Column({
    name: 'RMR_NAME',
    length: 45,
  })
  name?: string;
}

// application/Entities/Reminder/Receiver.php
