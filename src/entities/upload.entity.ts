import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { TagEntity } from './tag.entity';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_UPLOAD_UPL")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_UPLOAD_UPL')
export class UploadEntity {
  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  /**
   * @ORM\Column(name="UPL_ID", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'UPL_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="UPL_NAME", type="text")
   */
  @Column({
    name: 'UPL_NAME',
    type: 'text',
  })
  name?: string;

  /**
   * @ORM\Column(name="UPL_FILENAME", type="text")
   */
  @Column({
    name: 'UPL_FILENAME',
    type: 'text',
  })
  filename?: string;

  /**
   * @ORM\Column(name="UPL_PATH", type="text")
   */
  @Column({
    name: 'UPL_PATH',
    type: 'text',
  })
  path?: string;

  /**
   * @ORM\Column(name="UPL_TYPE", type="string", length=50)
   */
  @Column({
    name: 'UPL_TYPE',
    type: 'varchar',
    length: 50,
  })
  type?: string;

  /**
   * @ORM\Column(name="UPL_SIZE", type="integer")
   */
  @Column({
    name: 'UPL_SIZE',
    type: 'int',
    width: 11,
    default: 0,
  })
  size?: number;

  /**
   * @ORM\Column(name="UPL_IP", type="string", length=50, nullable=true)
   */
  @Column({
    name: 'UPL_IP',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  ip?: string;

  /**
   * @ORM\Column(name="UPL_TOKEN", type="string", length=28, nullable=true)
   */
  @Column({
    name: 'UPL_TOKEN',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  token?: string;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   */
  // protected $user;
  @Column({ name: 'USR_ID', type: 'int', width: 11 })
  USRId?: number;

  @ManyToOne(() => UserEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'USR_ID' })
  user?: UserEntity;

  /////

  /** File: application\Entity\File.php
   * @ORM\ManyToOne(targetEntity="User")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   */
  // protected $transmitter;
  @ManyToOne(() => UserEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'USR_ID' })
  transmitter?: UserEntity;

  /** File: application\Entity\File.php
   * @ORM\Column(name="UPL_NAME", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"file:index", "file:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'UPL_NAME',
    type: 'text',
  })
  originalFilename?: string;

  /** File: application\Entity\File.php
   * @ORM\Column(name="UPL_FILENAME", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"file:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'UPL_FILENAME',
    type: 'text',
  })
  fileName?: string;

  /** File: application\Entity\File.php
   * @ORM\Column(name="UPL_SIZE", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"file:read"})
   * @Assert\Type("integer")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'UPL_SIZE',
    type: 'int',
    width: 11,
    default: 0,
  })
  fileSize?: number;

  /** File: application\Entity\File.php
   * @ORM\Column(name="UPL_TYPE", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"file:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(max=255)
   */
  @Column({
    name: 'UPL_TYPE',
    type: 'varchar',
    length: 50,
  })
  mimeType?: string;

  /**
   * @var UploadedFile|null
   */
  // @TODO EntityMissing
  // protected $file = null;

  /**
   * @var string|null
   */
  removalPath?: string;

  /**
   * @ORM\ManyToMany(targetEntity="Tag")
   * @ORM\JoinTable(
   *  name="file_tag",
   *  joinColumns={
   *      @ORM\JoinColumn(name="file_id", referencedColumnName="UPL_ID")
   *  },
   *  inverseJoinColumns={
   *      @ORM\JoinColumn(name="tag_id", referencedColumnName="id")
   *  }
   * )
   * @Serializer\Expose
   * @Serializer\Groups({"file:read"})
   */
  // protected $tags;
  @ManyToMany(() => TagEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinTable({
    name: 'file_tag',
    joinColumn: { name: 'file_id' },
    inverseJoinColumn: { name: 'tag_id' }
  })
  tags?: TagEntity[];
}

// application\Entities\Upload.php
// application\Entity\File.php
