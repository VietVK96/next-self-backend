import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LibraryActEntity } from './library-act.entity';
import { LibraryOdontogramEntity } from './library-odontogram.entity';

/**
 * @ORM\Entity(repositoryClass="App\Repositories\LibraryActAttachmentRepository")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('library_act_odontogram')
export class LibraryActOdontogramPivotEntity {
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
    (libraryAct) => libraryAct.pivotLibraryActOdontograms,
  )
  @JoinColumn({
    name: 'library_act_id',
  })
  libraryAct?: LibraryActEntity;

  @Column({
    name: 'library_odontogram_id',
    type: 'int',
    width: 11,
    default: 0,
  })
  libraryOdontogramId?: number;
  @ManyToOne(
    () => LibraryOdontogramEntity,
    (attachment) => attachment.pivotLibraryActOdontograms,
  )
  @JoinColumn({
    name: 'library_odontogram_id',
  })
  libraryOdontogram?: LibraryOdontogramEntity;
}
