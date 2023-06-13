import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { CorrespondentTypeEntity } from './correspondent-type.entity';
import { CorrespondentEntity } from './correspondent.entity';

@Entity('T_GROUP_GRP')
export class OrganizationEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="GRP_ID", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'GRP_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="GRP_NAME", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(
   *  max=255
   * )
   */
  @Column({
    name: 'GRP_NAME',
  })
  name?: string;

  /**
   * @ORM\Column(name="GRP_SHARE_SMS", type="boolean", options={"default": false})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'GRP_SHARE_SMS',
  })
  smsSharing?: boolean;

  /**
   * @ORM\Column(name="GRP_TOKEN", type="string", length=36)
   */
  @Column({
    name: 'GRP_SHARE_SMS',
  })
  token?: string;

  /**
   * @ORM\OneToMany(targetEntity="UserEntity", mappedBy="organization", cascade={"persist"})
   */
  @OneToMany(() => UserEntity, (e) => e.group, {
    createForeignKeyConstraints: false,
  })
  users?: UserEntity[];

  @OneToMany(() => CorrespondentTypeEntity, e => e.group, {
    createForeignKeyConstraints: false,
  })
  correspondentTypes?: CorrespondentTypeEntity[];

  @OneToMany(() => CorrespondentEntity, e => e.group, {
    createForeignKeyConstraints: false,
  })
  correspondents?: CorrespondentEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

// application/Entities/Organization.php
// application/Entities/Group.php
