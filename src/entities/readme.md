# Convert entity from PHP to nodejs
Ở bên php sẽ có 2 thư mục là `application/Entities` và `application/Entity` . Thực hiện convert file PHP ở trong 2 thư mục này sang node js ở thư mục `src/entities`.
Khi convert thì ở cuối file entity của nodejs có comment file đang thực hiện convert. Ví dụ: Ở file `src/entities/user.entity.ts` thì cuối file có comment
```
// application/Entities/User.php
// application/Entities/UserEntity.php
``` 
Copy comment của php sang nodejs .
Ví dụ:
Ở file `application/Entities/User.php` có
```
/**
 * @ORM\Entity(repositoryClass="\App\Repositories\User")
 * @ORM\Table(name="T_USER_USR", uniqueConstraints={
 *  @ORM\UniqueConstraint(name="UNIQ_1C904FF51FF1335", columns={"USR_LOG"})
 * })
 * @ORM\HasLifecycleCallbacks
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 */
```
Ở file `src/entities/user.entity.ts` cũng coppy sang 
```
/**
 * @ORM\Entity(repositoryClass="\App\Repositories\User")
 * @ORM\Table(name="T_USER_USR", uniqueConstraints={
 *  @ORM\UniqueConstraint(name="UNIQ_1C904FF51FF1335", columns={"USR_LOG"})
 * })
 * @ORM\HasLifecycleCallbacks
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 */
@Entity('T_USER_USR')
export class UserEntity {
}
```
## Quy định tên file entity
Ví dụ ở php là `application/Entities/User.php` thì đổi qua nodejs là `src/entities/user.entity.ts`. 
Ở php có `class User` hoặc là `class UserEntity` thì đổi sang nodejs là `export class UserEntity`
Ở nodejs bắt buộc file phải có là `.entity.ts` ở cuối và tên class là `XXXEntity`

## Các thành phần trong entity từ php qua nodejs
- Tên bảng ở PHP
```
* @ORM\Table(name="T_USER_USR",
```
như ở trên thì tên bảng chính là `T_USER_USR`
Thì qua bên nodejs là
```
@Entity('T_USER_USR')
```
- Cột id tự động tăng dần
Ví dụ bên php là 
```
/**
* @ORM\Column(name="USR_ID", type="integer", nullable=false)
* @ORM\Id
* @ORM\GeneratedValue(strategy="IDENTITY")
*/
protected $id;
```
Như cấu trúc PHP ở trên thì tên cột là `USR_ID` . Dạng INT(11). Có tăng đơn vị lên 1 đơn vị sau khi insert
Thì đổi qua nodejs là 
```
  /**
   * @ORM\Column(name="USR_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'USR_ID',
  })
  id?: number;
```
Property `name` chính là khai báo tên cột  `PrimaryGeneratedColumn` là khai báo cột khóa chính.
Khi đổi sang nodejs thì `protected $id;` đổi sang `id?: number;` thì `number` chính là type đó. 
```
- Cột bình thường:
/**
* @ORM\Column(name="USR_ADMIN", type="integer", nullable=false)
*/
protected $admin;
```
Như cấu trúc PHP ở trên thì tên cột là `USR_ADMIN` . Dạng INT. Không được để null. Để xem rõ hơn về tính chất của cột đó thì truy cập đường link:
http://10.10.31.29/phpmyadmin/index.php?db=dental&table=T_USER_USR&target=tbl_structure.php&token=647c2930990ce12d7b218a7b0c7725f5
Thay `T_USER_USR` thành bảng tương ứng.

```
  /**
   * @ORM\Column(name="USR_ADMIN", type="integer", nullable=false)
   */
  @Column({
    name: 'USR_ADMIN',
    type: 'tinyint',
    size: 1,
    default: 0,
  })
  admin?: number;
```
+ Property `name` chính là khai báo tên cột  `Column` là khai báo cột.
+ `type` là dạng dữ liệu ở mysql , có tất cả các dạng như sau: `bit, int, integer, tinyint, smallint, mediumint, bigint, float, double, double precision, dec, decimal, numeric, fixed, bool, boolean, date, datetime, timestamp, time, year, char, nchar, national char, varchar, nvarchar, national varchar, text, tinytext, mediumtext, blob, longtext, tinyblob, mediumblob, longblob, enum, set, json, binary, varbinary, geometry, point, linestring, polygon, multipoint, multilinestring, multipolygon, geometrycollection, uuid, inet4, inet6`. `length` là độ dài của cột đó, nếu không khai báo thì là max của dạng dữ liệu đó. 
+ Đối với dạng dữ liệu `decimal` thì cần khai báo thêm `precision` và `scale`. Ví dụ : `decimal(10,2)` thì `precision` là 10 và `scale` là 2.
```
  /**
   * @ORM\Column(name="USR_RATE_CHARGES", type="float")
   * @var float Taux de charges du cabinet pour le praticien,
   * exprimé en pourcentage.
   * decimal(10,2)	
   */
  @Column({
    name: 'USR_RATE_CHARGES',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  rateCharges?: number;
```
+ `default` là giá trị mặc định khi insert vào dữ liệu.
+ Dạng dữ liệu từ mysql sang nodejs là:
`bit, int, integer, tinyint, smallint, mediumint, bigint, float, double, double precision, dec, decimal, numeric, fixed` => `number`. Và quy định độ dài (rộng) của cột là `width`. Ví dụ INT(11) thì `type : 'int', width: 11`\
`date, datetime, timestamp, time, year, char, nchar, national char, varchar, nvarchar, national varchar, text, tinytext, mediumtext, blob, longtext, tinyblob, mediumblob, longblob, json, binary, varbinary ` => `string`. Và quy định độ dài (rộng) của cột là `length`. Ví dụ VARCHAR(20) thì `type : 'varchar', length: 20`\
Nếu gặp các dạng dữ liệu khác thì cần kiểm tra lại để map lại cho đúng.
## Relation:
Ví dụ ở php là:
```
/**
* @ORM\ManyToOne(targetEntity="\App\Entities\Group", inversedBy="users")
* @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
*/
protected $group;
```
Thì cái @ORM\ManyToOne chính là dạng quan hệ. Có 3 dạng chính là 
```
- @ORM\OneToMany
- @ORM\OneToOne
- @ORM\ManyToOne
```
[Tham khảo tại https://www.doctrine-project.org/projects/doctrine-orm/en/2.15/reference/association-mapping.html](https://www.doctrine-project.org/projects/doctrine-orm/en/2.15/reference/association-mapping.html)
`@ORM\JoinColumn` chính là cột khóa phụ refrence tới khóa chính . `name="organization_id"` chính là khóa phụ tại bảng đó. Còn `referencedColumnName="GRP_ID"` chính là khóa chính ở bảng cần refrence.
Khi chuyển đổi qua nodejs thì là:
```
  @Column({
    name: 'organization_id',
  })
  organizationId?: number;

  @ManyToOne(() => OrganizationEntity, (e) => e.users)
  @JoinColumn({
    name: 'organization_id',
    referencedColumnName: 'GRP_ID',
  })
  group?: OrganizationEntity;
```
* Chú ý : Cần khai báo thêm `Column` vì bên nodejs không thể tự sinh ra cột khóa phụ được.
## Các cột quan hệ mà chưa thể convert vì chưa có bảng tương ứng thì:
Copy hết sang và đặt đúng thứ tự của PHP. Sau đó comment lại và thêm 1 comment là 
```
// @TODO EntityMissing
```
Ví dụ: 
```
  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\Address")
   * @ORM\JoinColumn(name="ADR_ID", referencedColumnName="ADR_ID")
   */
  // @TODO EntityMissing
  // protected $address;
```

## Cột TimeStamp
Nếu ở php thấy 
```
use TimestampableTrait;
```
Thì bên nodejs thêm 
```
  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at'})
  updatedAt?: Date;

```
Nếu ở PHP thấy 
```
use SoftDeleteableEntity;
```
Thì ở bên nodejs thêm 
```
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
```
