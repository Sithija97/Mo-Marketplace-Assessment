import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Index(['product', 'combinationKey'], { unique: true })
@Entity()
export class Variant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  color!: string;

  @Column()
  size!: string;

  @Column()
  material!: string;

  @Column({ name: 'combination_key' })
  combinationKey!: string;

  @Column()
  stock!: number;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  product!: Product;
}
