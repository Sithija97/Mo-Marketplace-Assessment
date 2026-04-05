import { Variant } from '../../variants/entities/variant.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column({ nullable: true })
  imageUrl!: string;

  @OneToMany(() => Variant, (variant) => variant.product, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  variants!: Variant[];
}
