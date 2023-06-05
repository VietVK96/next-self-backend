import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * @ORM\Entity
 * @ORM\Table(name="T_REMINDER_UNIT_RMU")
 */
@Entity('T_REMINDER_UNIT_RMU')
export class ReminderUnitEntity {

  /**
   * @ORM\Column(name="RMU_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'RMU_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="RMU_NAME", type="string", length=45, nullable=false)
   */
  @Column({
    name: 'RMR_NAME',
    length: 45,
  })
  name?: string;

  /**
   * @ORM\Column(name="RMU_NBR", type="integer", nullable=false)
   */
  @Column({
    name: 'RMU_NBR'
  })
  nbr?: number;
}

// application/Entities/Reminder/Unit.php
