import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserRole } from '../../../common/enums';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  password!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ type: 'text', nullable: true, select: false })
  refreshToken?: string | null;
}
