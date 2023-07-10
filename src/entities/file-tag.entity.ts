import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity
 * @ORM\Table(name="file_tag")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('file_tag')
export class FileTagEntity {
  /**
   * @ORM\Column(name="id", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @Expose
   * @var string|null
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\Column(name="file_id", type="string", length=11)
   */
  @Column({
    name: 'file_id',
    type: 'int',
    width: 11,
  })
  file_id?: number;

  /**
   * @ORM\Column(name="file_id", type="string", length=11)
   */
  @Column({
    name: 'file_id',
    type: 'int',
    width: 11,
  })
  tag_id?: number;
}
