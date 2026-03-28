import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DataSource, IsNull, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Portfolio } from 'src/portfolios/entities/portfolio.entity';
import { handlePostgresError } from 'src/common/utils/postgres-error-handler';

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
      return user;
    } catch (error) {
      handlePostgresError(error)
    }
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOne(id: string) {
    try {
      const user = await this.userRepository.findOne({
        where: {
          id: id,
          deletedAt: IsNull()
        }
      })

      if (!user) {
        throw new NotFoundException(`User with id = ${id} was not found.`)
      }

      return user;
    } catch (error) {
      handlePostgresError(error)
    }
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async remove(id: string) {
    this.findOne(id)

    await this.dataSource.transaction(async (manager) => {
      await manager.softDelete(Portfolio, {
        user: { id },
      });

      await manager.softDelete(User, { id });
    });
    return true
  }
}
