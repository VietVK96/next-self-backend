import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
  // @TODO EntityMissing
  // protected $group;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Contact")
   * @ORM\JoinColumn(name="wzc_subscriber_id", referencedColumnName="CON_ID")
   * @var \App\Entities\Contact Entité représentant un contact.
   */
  // @TODO EntityMissing
  // protected $subscriber;

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
