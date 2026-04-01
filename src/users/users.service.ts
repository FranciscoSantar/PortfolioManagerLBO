import { DataSource, IsNull, Repository } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import { CreateUserDto } from './dto/create-user.dto';
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
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(UsersService.name)
  }

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
      this.logger.error('Error creating user', {
        email: createUserDto.email,
        error
      })
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
      this.logger.error('Error fetching user by ID', {
        userId: id,
        error
      })
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
      this.logger.error('Error fetching user by email for login', {
        email,
        error
      })
      handlePostgresError(error)
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
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
      this.logger.info('User deleted successfully', {
        userId: id,
        email: user.email
      })
      return true
    } catch (error) {
      this.logger.error('Error during user deletion', {
        userId: id,
        error
      })
      handlePostgresError(error)
    }
  }
}
