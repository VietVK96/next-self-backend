/**
 * @ORM\Entity(repositoryClass="App\Repository\EmailOutgoingServerRepository")
 * @ORM\Table(
 *  name="email_outgoing_server"
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="UNIQ_4536D7E437D8AD65", columns={"email_account_id"})
 *  }
 * )
 * @UniqueEntity("emailAccount")
 */

import {
  Column,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EmailAccountEntity } from './email-account.entity';

// File: application\Entity\EmailOutgoingServer.php: class EmailOutgoingServer extends AbstractEntity
@Entity('email_outgoing_server')
export class EmailOutgoingServerEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(type="integer")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\OneToOne(targetEntity="EmailAccount", inversedBy="outgoingServer")
   */
  // protected $emailAccount
  @OneToOne(() => EmailAccountEntity, (e) => e.outgoingServer, {
    createForeignKeyConstraints: false,
  })
  emailAccount?: EmailAccountEntity;

  /**
   * @ORM\Column(type="string", length=4, options={"fixed": true, "default": "smtp"})
   */
  @Column({
    name: 'protocol',
    type: 'char',
    length: 4,
    default: 'smtp',
  })
  protocol?: string;

  /**
   * @ORM\Column(type="string")
   * @Assert\NotBlank
   * @Encrypted
   */
  @Column({
    name: 'username',
    type: 'varchar',
    length: 255,
  })
  username?: string;

  /**
   * @ORM\Column(type="string")
   * @Assert\NotBlank
   * @Encrypted
   */
  @Column({
    name: 'password',
    type: 'varchar',
    length: 255,
  })
  password?: string;

  /**
   * @ORM\Column(type="string", length=255)
   * @Assert\Hostname
   * @Assert\NotBlank
   */
  @Column({
    name: 'hostname',
    type: 'varchar',
    length: 255,
  })
  hostname?: string;

  /**
   * @ORM\Column(type="integer", options={"unsigned": true, "default": 587})
   * @Assert\NotBlank
   */
  @Column({
    name: 'port',
    type: 'smallint',
    width: 5,
    default: 587,
    unsigned: true,
  })
  port?: number;

  /**
   * @ORM\Column(type="boolean", options={"default": false})
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'connection_established',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  connectionEstablished?: number;
}

// application\Entity\EmailOutgoingServer.php
