import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { ContactEntity } from './contact.entity';

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\Wzagenda\Contact")
 * @ORM\Table(name="wzagenda_contact_wzc")
 */
@Entity('wzagenda_contact_wzc')
export class WzagendaContactEntity {
  /**
   * @ORM\Column(name="wzc_id", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @var integer Identifiant de l'enregistrement.
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'wzc_id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Group")
   * @ORM\JoinColumn(name="grp_id", referencedColumnName="GRP_ID")
   * @var \App\Entities\Group Entité représentant le groupe.
   */
  // protected $group;

  @Column({
    name: 'grp_id',
    type: 'int',
    width: 11,
  })
  grpId?: number;
  @ManyToOne(() => OrganizationEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'grp_id',
  })
  group?: OrganizationEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Contact")
   * @ORM\JoinColumn(name="wzc_subscriber_id", referencedColumnName="CON_ID")
   * @var \App\Entities\Contact Entité représentant un contact.
   */
  // protected $subscriber;

  @Column({
    name: 'wzc_subscriber_id',
    type: 'int',
    width: 11,
  })
  wzcSubscriberId?: number;
  @ManyToOne(() => ContactEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'wzc_subscriber_id',
  })
  subscriber?: ContactEntity;

  /**
   * @ORM\Column(name="wzc_provider_id", type="integer")
   * @var integer Identifiant du contact interne à WZ-Agenda.
   */
  @Column({
    name: 'wzc_provider_id',
    type: 'int',
    nullable: false,
  })
  providerId?: number;
}

//application/Entities/User/Type.php
