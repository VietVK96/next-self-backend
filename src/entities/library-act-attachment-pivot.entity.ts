import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LibraryActEntity } from './library-act.entity';
import { LettersEntity } from './letters.entity';

/**
 * @ORM\Entity(repositoryClass="App\Repositories\LibraryActAttachmentRepository")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('library_act_attachment')
export class LibraryActAttachmentPivotEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  @Column({
    name: 'library_act_id',
    type: 'int',
    width: 11,
    default: 0,
  })
  libraryActId?: number;
  @ManyToOne(
    () => LibraryActEntity,
    (libraryAct) => libraryAct.pivotLibraryActAttachments,
  )
  @JoinColumn({
    name: 'library_act_id',
  })
  libraryAct?: LibraryActEntity;

  @Column({
    name: 'mail_id',
    type: 'int',
    width: 11,
    default: 0,
  })
  mailId?: number;
  @ManyToOne(
    () => LettersEntity,
    (attachment) => attachment.pivotLibraryActAttachments,
  )
  @JoinColumn({
    name: 'mail_id',
  })
  mail?: LettersEntity;
}
