import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { DataSource, IsNull, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Portfolio } from '../portfolios/entities/portfolio.entity';
import { handlePostgresError } from '../common/utils/postgres-error-handler';
import { CreatedUserResponseDto } from './dto/response-user.dto';
import { PortfolioAsset } from '../portfolio-assets/entities/portfolio-asset.entity';
import { Transaction } from '../transactions/entities/transaction.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<CreatedUserResponseDto> {
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

  async findById(id: string): Promise<User> {
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

  async findByEmailForLogin(email: string): Promise<User> {
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

  async remove(id: string): Promise<boolean> {
    const user = await this.findById(id)

    await this.dataSource.transaction(async (manager) => {
      await manager.softDelete(Transaction, {
        portfolio: {
          user: {
            id
          }
        }
      })

      await manager.softDelete(PortfolioAsset, {
        portfolio: {
          user: {
            id
          }
        }
      })

      await manager.softDelete(Portfolio, {
        user
      });

      await manager.softDelete(User, {
        id
      });
    });
    return true
  }
}
