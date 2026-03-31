import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { DataSource, IsNull, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Portfolio } from '../portfolios/entities/portfolio.entity';
import { handlePostgresError } from '../common/utils/postgres-error-handler';

@Injectable()
export class UsersService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto) {
    try {
      const user = this.userRepository.create(createUserDto);
      await this.userRepository.save(user);
      const { id, firstName, lastName, email } = user;
      return {
        id,
        firstName,
        lastName,
        email
      };
    } catch (error) {
      handlePostgresError(error)
    }
  }

  async findById(id: string) {
    try {
      const user = await this.userRepository.findOne({
        where: {
          id: id,
          deletedAt: IsNull()
        }
      })

      if (!user) {
        throw new NotFoundException(`User not found`)
      }

      return user;
    } catch (error) {
      handlePostgresError(error)
    }
  }

  async findByEmailForLogin(email: string) {
    try {
      const user = await this.userRepository.findOne({
        where: {
          email,
          deletedAt: IsNull()
        },
        select: {
          id: true,
          email: true,
          password: true,
        }
      })

      if (!user) {
        throw new NotFoundException(`User not found`)
      }

      return user;
    } catch (error) {
      handlePostgresError(error)
    }
  }

  async remove(id: string) {
    const user = await this.findById(id)

    await this.dataSource.transaction(async (manager) => {
      await manager.softDelete(Portfolio, {
        user
      });

      await manager.softDelete(User, { id });
    });
    return true
  }
}
